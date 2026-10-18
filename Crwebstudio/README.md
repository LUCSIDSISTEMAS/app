# crwebstudio

Site comercial da **crwebstudio**, preparado para a pasta `Crwebstudio/` do repositório existente **LUCSIDSISTEMAS/app**.

Endereço previsto nesta configuração: **https://lucsidsistemas.github.io/app/Crwebstudio/**. A disponibilidade deve ser confirmada após a publicação do repositório.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `index.html` | Página pronta para publicação |
| `styles.*.min.css` e `app.*.min.js` | Estilos e interações compilados |
| `assets/` | Imagens, logo e fontes utilizadas pela página |
| `robots.txt` e `sitemap.xml` | Arquivos de SEO para esta subpasta |
| `source/` | Código completo, configuração, recursos originais e documentação |

A página usa a publicação GitHub Pages já existente no repositório `app`. Os arquivos desta pasta são independentes dos outros projetos presentes no repositório.

## Atualizar o site

Use Node.js 24. A partir desta pasta:

```sh
cd source
npm ci
npm run build
cp -R dist/. ../
```

Depois, envie as alterações de `Crwebstudio/` para a branch `main` do repositório `LUCSIDSISTEMAS/app` e acompanhe sua publicação de Pages. O build lê `source/site.config.json` e escreve temporariamente em `source/dist/`; a cópia acima coloca o resultado na pasta pública correta. A fonte de publicação existente do repositório é mantida.

## Canais oficiais

- WhatsApp: [+55 (31) 99818-8608](https://wa.me/5531998188608).
- Instagram: [@cr.webstudio](https://www.instagram.com/cr.webstudio/).

Os contatos usam links HTML nativos. A página não envia mensagens automaticamente. Detalhes de manutenção, planos e verificações estão em [source/README.md](source/README.md) e [source/docs/github-pages.md](source/docs/github-pages.md).
