"""Create compact, mechanically resized derivatives of the official brand assets.

Run with Python plus Pillow and fontTools. Original images and fonts are never
altered. WebP derivatives use lossless encoding and preserve transparency.
WOFF fonts include Latin/Portuguese, combining marks, punctuation and currency.
"""
from pathlib import Path
import json
import shutil

from PIL import Image, ImageChops
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public' / 'assets'
ASSETS.mkdir(parents=True, exist_ok=True)
SOURCES = ROOT / 'source-assets'
SOURCES.mkdir(exist_ok=True)

IMAGE_JOBS = [
    ('crwebstudio-logo.png', 'crwebstudio-logo-960.webp', (960, 640)),
    ('crwebstudio-logo.png', 'crwebstudio-logo-576.webp', (576, 384)),
    ('crwebstudio-simbolo.png', 'crwebstudio-symbol-96.webp', (96, 96)),
    ('crwebstudio-simbolo.png', 'favicon-48.png', (48, 48)),
]
FONT_JOBS = [
    ('studio-display.otf', 'display.woff'),
    ('nimbus-sans-regular.otf', 'sans-regular.woff'),
    ('nimbus-sans-bold.otf', 'sans-bold.woff'),
]
FONT_UNICODES = set().union(
    range(0x0020, 0x0250),
    range(0x0300, 0x0370),
    range(0x2000, 0x2070),
    range(0x20A0, 0x20D0),
)


def source_for(name):
    source = SOURCES / name
    current = ASSETS / name
    if not source.exists():
        shutil.copy2(current, source)
    elif current.exists() and source.read_bytes() != current.read_bytes():
        raise ValueError(f'Original differs from saved source: {name}')
    return source


for original, output, size in IMAGE_JOBS:
    source = source_for(original)
    with Image.open(source) as image:
        resized = image.resize(size, Image.Resampling.LANCZOS)
        target = ASSETS / output
        if target.suffix == '.webp':
            resized.save(target, format='WEBP', lossless=True, quality=100, method=6, exact=True)
        else:
            resized.save(target, format='PNG', optimize=True)
        with Image.open(target) as saved:
            assert saved.size == size
            assert saved.mode == resized.mode
            assert ImageChops.difference(saved, resized).getbbox() is None, output
            alpha_extrema = saved.getchannel('A').getextrema() if saved.mode == 'RGBA' else None
        print(json.dumps({'file': str(target.relative_to(ROOT)), 'bytes': target.stat().st_size,
                          'size': size, 'mode': resized.mode, 'alpha_extrema': alpha_extrema,
                          'lossless_matches_resized_pixels': True}))

for original, output in FONT_JOBS:
    source = source_for(original)
    target = ASSETS / output
    previous_bytes = target.stat().st_size if target.exists() else None
    with TTFont(source) as font:
        expected_characters = set(font.getBestCmap()).intersection(FONT_UNICODES)
        options = subset.Options()
        options.layout_features = ['*']
        options.notdef_glyph = True
        options.notdef_outline = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=FONT_UNICODES)
        subsetter.subset(font)
        font.flavor = 'woff'
        font.save(target)
    with TTFont(target) as after:
        assert expected_characters == set(after.getBestCmap()), output
        for character in 'ÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç•©':
            assert ord(character) in after.getBestCmap(), (output, character)
    print(json.dumps({'file': str(target.relative_to(ROOT)), 'bytes': target.stat().st_size,
                      'previous_bytes': previous_bytes,
                      'unicode_characters': len(expected_characters),
                      'requested_character_ranges_preserved': True}))
