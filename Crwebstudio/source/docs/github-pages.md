# Publicação no GitHub Pages

Este site ocupa a pasta **Crwebstudio/** do repositório existente **LUCSIDSISTEMAS/app**, na branch `main`. O endereço configurado é **https://lucsidsistemas.github.io/app/Crwebstudio/**. A disponibilidade da página deve ser verificada depois da publicação do repositório.

## Estrutura da publicação

A pasta `Crwebstudio/` contém diretamente `index.html`, CSS e JavaScript minificados, imagens, fontes, sitemap e robots. O diretório `Crwebstudio/source/` preserva o código e os recursos necessários para manutenção. Os demais arquivos do repositório `app` permanecem independentes deste projeto.

O site usa a configuração GitHub Pages existente no repositório. Esta pasta não contém um workflow próprio e não exige criar outro repositório ou mudar a origem da publicação.

## Atualizar a página

1. Entre em `Crwebstudio/source/` e use Node.js 24.
2. Execute `npm ci` e `npm run build`.
3. Copie o conteúdo de `dist/` para `../`, a pasta `Crwebstudio/`.
4. Envie as alterações de `Crwebstudio/` para `main` no repositório `LUCSIDSISTEMAS/app`.
5. Acompanhe a publicação de Pages já configurada no repositório e verifique o endereço da página diretamente no navegador.

```sh
cd Crwebstudio/source
npm ci
npm run build
cp -R dist/. ../
```

Não envie `node_modules/`, credenciais ou arquivos locais de autenticação. Os originais em `source-assets/` são recursos de manutenção; a página carrega as versões otimizadas em `assets/`.

## Endereço e subpasta

O build usa `url` de `site.config.json`, configurado como `https://lucsidsistemas.github.io/app/Crwebstudio`. Se a hospedagem mudar, atualize essa configuração ou informe `CRWEBSTUDIO_SITE_URL` durante a compilação.

```sh
CRWEBSTUDIO_SITE_URL='https://lucsidsistemas.github.io/app/Crwebstudio/' npm run build
```

O build normaliza barras finais e conserva `/app/Crwebstudio/` em canonical, Open Graph, imagem de compartilhamento, dados estruturados, sitemap e referência de sitemap no robots. Endereços sem HTTPS, vazios, com credenciais, parâmetros ou fragmentos são rejeitados.

CSS, JavaScript, imagens e fontes usam caminhos relativos ao `index.html`. A marca e o retorno ao topo usam `#inicio`, mantendo a navegação dentro desta pasta.

Nenhum `CNAME` é criado. A publicação nesta pasta não registra nem configura o domínio próprio `crwebstudio.com.br`.

## Contatos

| Ação | Destino |
| --- | --- |
| CTAs de orçamento e serviços | `https://wa.me/5531998188608`, com mensagem apropriada ao serviço |
| WhatsApp | +55 (31) 99818-8608 |
| Instagram | `https://www.instagram.com/cr.webstudio/` |
| Marca e voltar ao topo | `#inicio` |

Os contatos são links nativos com `target="_top"`. Em uma página aberta diretamente, o navegador navega na própria aba. Em uma página incorporada, o link solicita navegação na janela principal, respeitando as permissões do visualizador. A página não envia mensagens automaticamente e não depende de `window.open()`.

## SEO e indexação

`allowIndexing` mantém o valor `false`. O HTML inclui `noindex,nofollow`. O build gera `robots.txt` com o caminho `/app/Crwebstudio/` e o sitemap com o endereço configurado.

Rastreadores procuram `robots.txt` na raiz da origem; o arquivo desta subpasta não controla os rastreadores do domínio inteiro. A meta `robots` continua presente no HTML. Para alterar a política de indexação, modifique a configuração e gere uma nova versão.

## Conferência após a publicação

- Confirme que a publicação de Pages corresponde ao commit com os arquivos novos.
- Abra o endereço da página diretamente e confira imagens, logo, fontes e estilos.
- Clique em **Vamos criar**, nos CTAs de soluções e planos, no WhatsApp flutuante e nos acessos de Instagram. Confira o telefone ou perfil de destino.
- Confira menu, abas, retorno pela marca e voltar ao topo com mouse, toque e teclado.
- Inspecione o layout em 320, 768, 1024 e 1440 px e com a preferência de movimento reduzido.

Essas são orientações de verificação após a publicação, não uma declaração de testes já executados. Os resultados da revisão estática e seus limites estão em [validation.md](validation.md).

Se houver 404, confira o andamento da publicação existente e o caminho com maiúscula `Crwebstudio/`. Se um contato falhar apenas dentro de um visualizador incorporado, compare com a página aberta diretamente, pois o visualizador pode restringir a navegação externa.

## Referências

- [GitHub — configuração da origem do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [MDN — links e contexto de navegação](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)
- [Google — localização e escopo de robots.txt](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)
