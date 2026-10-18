import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';

const config = JSON.parse(await readFile(new URL('../site.config.json', import.meta.url), 'utf8'));
const root = new URL('../', import.meta.url);
const read = relative => readFile(new URL(relative, root), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
// O deploy pode informar sua URL sem modificar a configuração do Site original.
// Uma URL vazia informada pelo ambiente é um erro, não um retorno silencioso ao Site.
const configuredUrl = process.env.CRWEBSTUDIO_SITE_URL;
let url;
try {
  url = new URL(configuredUrl === undefined ? config.url : configuredUrl.trim());
} catch {
  throw new Error('O endereço de publicação deve ser uma URL HTTPS válida.');
}
if (url.protocol !== 'https:') throw new Error('O endereço do site deve usar HTTPS.');
if (url.username || url.password || url.search || url.hash) throw new Error('O endereço de publicação não pode conter credenciais, parâmetros ou fragmentos.');
const siteUrl = url.href.replace(/\/+$/, '');
const sitePath = new URL(`${siteUrl}/`).pathname;
const instagram = new URL(config.instagram);
if (instagram.protocol !== 'https:' || instagram.hostname !== 'www.instagram.com') throw new Error('O Instagram deve usar um endereço oficial HTTPS.');
if (config.title.length >= 60 || config.description.length >= 155) throw new Error('Título ou descrição excede o limite de SEO.');
if (!Number.isFinite(config.monthlyRate) || config.monthlyRate <= 0 || config.monthlyRate > 1) throw new Error('A porcentagem mensal é inválida.');
const phone = String(config.whatsapp || '');
if (phone && !/^[1-9]\d{9,14}$/.test(phone)) throw new Error('O WhatsApp precisa conter somente país, DDD e número, entre 10 e 15 dígitos.');
const phoneDisplay = phone ? `+${phone}`.replace(/^\+55(\d{2})(\d{4,5})(\d{4})$/, '+55 ($1) $2-$3') : '';
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(config.monthlyRate);
const messages = {
  general: 'Olá, crwebstudio! Gostaria de conversar sobre um site para minha empresa.',
  institucional: 'Olá, crwebstudio! Gostaria de criar um site institucional para minha empresa.',
  loja: 'Olá, crwebstudio! Gostaria de criar uma loja virtual para vender meus produtos.',
  gestao: 'Olá, crwebstudio! Gostaria de conversar sobre um painel de pedidos e integrações para minha loja.',
  suporte: 'Olá, crwebstudio! Gostaria de conhecer o suporte de TI para o meu site.',
  compra: 'Olá, crwebstudio! Gostaria de solicitar um orçamento para comprar o site pelo valor integral.',
  assinatura: `Olá, crwebstudio! Gostaria de conhecer a assinatura mensal de ${percent} do valor do site, com ajuda e suporte.`
};
const whatsapp = key => phone ? `https://wa.me/${phone}?text=${encodeURIComponent(messages[key])}` : '';
const contact = key => whatsapp(key) || config.instagram;
const schema = { '@context': 'https://schema.org', '@graph': [
  {
    '@type': 'Organization', '@id': `${siteUrl}/#empresa`, name: config.name,
    description: config.description, url: `${siteUrl}/`,
    logo: `${siteUrl}/assets/crwebstudio-logo-960.webp`, sameAs: [config.instagram],
    ...(phone ? { telephone: `+${phone}` } : {}),
    contactPoint: {
      '@type': 'ContactPoint', contactType: 'Atendimento comercial e suporte',
      availableLanguage: ['pt-BR'], url: contact('general'),
      ...(phone ? { telephone: `+${phone}` } : {})
    }
  },
  {
    '@type': 'WebSite', '@id': `${siteUrl}/#site`, url: `${siteUrl}/`, name: config.name,
    description: config.description, inLanguage: 'pt-BR', publisher: { '@id': `${siteUrl}/#empresa` }
  }
] };
const [cssSource, jsSource, htmlSource] = await Promise.all([read('src/styles.css'), read('src/app.js'), read('src/index.html')]);
const [css, js] = await Promise.all([
  transform(cssSource, { loader: 'css', minify: true, legalComments: 'none', target: ['chrome100', 'safari15.4', 'firefox100'] }),
  transform(jsSource, { loader: 'js', minify: true, legalComments: 'none', target: 'es2020' })
]);
const fingerprint = createHash('sha256').update(css.code + js.code).digest('hex').slice(0, 10);
const styleName = `styles.${fingerprint}.min.css`;
const scriptName = `app.${fingerprint}.min.js`;
const tokens = {
  TITLE: escape(config.title), DESCRIPTION: escape(config.description), URL: escape(siteUrl),
  ROBOTS: config.allowIndexing ? 'index,follow' : 'noindex,nofollow',
  STYLE: styleName, SCRIPT: scriptName, SCHEMA: JSON.stringify(schema).replace(/</g, '\\u003c'),
  INSTAGRAM: escape(config.instagram), INSTAGRAM_HANDLE: escape(config.instagramHandle),
  CONTACT_URL: escape(contact('general')), PURCHASE_URL: escape(contact('compra')), SUBSCRIPTION_URL: escape(contact('assinatura')),
  SITE_URL: escape(contact('institucional')), STORE_URL: escape(contact('loja')),
  MANAGEMENT_URL: escape(contact('gestao')), SUPPORT_URL: escape(contact('suporte')),
  CONTACT_CHANNEL: phone ? 'WhatsApp' : 'Instagram',
  PHONE_DISPLAY: escape(phoneDisplay),
  WHATSAPP_URL: escape(whatsapp('general') || '#contato'), WHATSAPP_HIDDEN: phone ? '' : 'hidden',
  CONTACT_FALLBACK_HIDDEN: phone ? 'hidden' : '', BODY_CLASS: phone ? 'has-whatsapp' : '', MONTHLY_PERCENT: escape(percent)
};
let html = htmlSource.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in tokens)) throw new Error(`Campo de compilação desconhecido: ${key}`);
  return tokens[key];
});
if (/\{\{/.test(html)) throw new Error('Há campos de compilação não resolvidos.');
if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) throw new Error('A página deve ter somente um H1.');
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('public/', root), dist, { recursive: true });
const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteUrl)}/</loc><lastmod>${lastmod}</lastmod></url></urlset>\n`;
const robots = `User-agent: *\n${config.allowIndexing ? 'Allow' : 'Disallow'}: ${sitePath}\nSitemap: ${siteUrl}/sitemap.xml\n`;
await Promise.all([
  writeFile(new URL('index.html', dist), html), writeFile(new URL(styleName, dist), css.code),
  writeFile(new URL(scriptName, dist), js.code), writeFile(new URL('sitemap.xml', dist), sitemap), writeFile(new URL('robots.txt', dist), robots)
]);
process.stdout.write(JSON.stringify({ titleCharacters: config.title.length, descriptionCharacters: config.description.length, cssBytes: Buffer.byteLength(css.code), jsBytes: Buffer.byteLength(js.code), whatsappConfigured: Boolean(phone), indexing: config.allowIndexing, siteUrl: `${siteUrl}/`, output: 'dist' }) + '\n');

