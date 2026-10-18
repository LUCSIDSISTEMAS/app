# crwebstudio

Site comercial em português, redesenhado a partir da referência visual enviada pelo responsável em 17/10/2026. A composição usa navy profundo, luz azul elétrico, logo pequena no cabeçalho, interfaces em perspectiva, painel claro de soluções e uma sequência de exemplos para celular.

## Executar o projeto

Os comandos abaixo devem ser executados nesta pasta `source/`.

```sh
npm ci
npm run build
cp -R dist/. ../
```

Use Node.js 24, a mesma versão selecionada no fluxo de publicação. O build valida os dados, gera HTML, minifica CSS/JavaScript e escreve `sitemap.xml` e `robots.txt`. O build escreve `dist/` nesta pasta `source/`. Copie seu conteúdo para `../`, a pasta pública `Crwebstudio/` do repositório `LUCSIDSISTEMAS/app`. O esbuild é dependência de desenvolvimento; não há framework ou biblioteca de execução no navegador.

Sem variáveis de ambiente, o endereço de publicação vem de `site.config.json`. Nesta exportação, ele corresponde ao caminho `https://lucsidsistemas.github.io/app/Crwebstudio/`; a publicação remota deve ser confirmada após o envio ao repositório existente **LUCSIDSISTEMAS/app**. Para compilar para outra hospedagem HTTPS, informe `CRWEBSTUDIO_SITE_URL`. Esse valor altera os endereços de SEO da saída; os contatos continuam vindo da configuração da empresa. Instruções em [Publicação no GitHub Pages](docs/github-pages.md).

| Caminho | Conteúdo |
| --- | --- |
| `src/index.html` | Componentes semânticos e textos do site |
| `src/styles.css` | Tokens, responsividade, componentes e animações |
| `src/app.js` | Menu, abas acessíveis, galeria por teclado e perspectiva |
| `site.config.json` | Contatos, percentual mensal, endereço e SEO |
| `public/assets/` | Imagens e fontes otimizadas publicáveis |
| `source-assets/` | Originais e registro da imagem gerada, fora da publicação |
| `scripts/build.mjs` | Compilação e geração dos arquivos publicados |
| `scripts/optimize-assets.py` | Conversão mecânica dos originais da marca e fontes |
| `docs/design-system.md` | Contratos dos componentes |
| `docs/validation.md` | Verificações e seus limites |
| `docs/github-pages.md` | Publicação, URL e diagnóstico no GitHub Pages |

A configuração de hospedagem do Site original fica no ambiente de manutenção. Credenciais, metadados privados de hospedagem e `node_modules/` não fazem parte da exportação para o GitHub.

## Conteúdo e identidade

A marca usa o símbolo oficial em tamanho pequeno junto ao nome crwebstudio. A logo grande da versão anterior foi removida da abertura. A informação **mais de 200 clientes satisfeitos** foi fornecida explicitamente pelo responsável neste pedido. Não foram acrescentados prêmios, certificações, tempo de mercado, parcerias, avaliações ou resultados financeiros.

As telas em perspectiva e os quatro celulares são ilustrações de soluções possíveis, não um portfólio de clientes ou um sistema de gestão conectado. A legenda da galeria informa isso. Seus botões são links reais para conversar com a crwebstudio: criar site, loja ou painel, sem simular uma coleção ou pedidos existentes. A seção de soluções explica site institucional, loja virtual, painel de pedidos/integrações e suporte do site; as abas são interativas de verdade.

A revisão de 18/10/2026 acrescenta escopo de entrega, etapas do projeto, dúvidas frequentes e condições comerciais mais claras. A galeria possui botões e informa os exemplos visíveis. As abas mantêm endereços diretos e histórico de navegação. O rodapé oferece uma preferência local para reduzir animações, respeitando também a configuração do sistema.

O recurso artístico `digital-wave` foi gerado com a ferramenta integrada de imagem, a partir da direção visual da referência. O prompt completo e a origem estão em `source-assets/digital-wave-v5.txt`. A tipografia, a marca e as interfaces são HTML e recursos oficiais, não textos gerados dentro de uma imagem. Os WebP de 720 e 1200 px são derivados comprimidos do original preservado.

## Contatos e planos

Instagram oficial: [@cr.webstudio](https://www.instagram.com/cr.webstudio/). WhatsApp oficial informado pelo responsável: **+55 (31) 99818-8608**, configurado como `5531998188608`, com destino [wa.me/5531998188608](https://wa.me/5531998188608). Os três acessos específicos ficam no botão flutuante, na seção de contato e no ícone do exemplo de celular. Os CTAs comerciais levam ao WhatsApp com mensagens diferentes para cada serviço, compra, assinatura e contato geral. O visitante confirma qualquer envio no aplicativo de destino. Os links explicitamente identificados como Instagram levam ao perfil oficial.

Os contatos usam links HTML HTTPS com `target="_top"`, sem depender de JavaScript, pop-ups ou abertura de nova aba. Os retornos pela marca usam `#inicio`, mantendo o visitante dentro do site mesmo quando a hospedagem está em uma subpasta. Um visualizador incorporado ainda pode impor suas próprias restrições de navegação; a conferência final deve ser feita também pelo endereço publicado aberto diretamente no navegador.

Para trocar o contato no futuro, altere apenas `whatsapp` em `site.config.json`, usando país, DDD e número somente em dígitos, depois recompile e publique. O build valida o formato. Sem número, os links exclusivos de WhatsApp ficam ocultos e os CTAs comerciais usam o Instagram como alternativa.

- **Compra:** valor integral do projeto sob orçamento.
- **Assinatura:** 10% do valor total do site por mês, com ajuda e suporte, sem pagar o site integralmente na entrada. É recorrência, não parcelamento. Recursos, prazo e condições são definidos na proposta.

Não há formulário, coleta de dados, checkout ou pagamento. Não há chaves de API no navegador. Qualquer formulário futuro deve ganhar validação de cliente e servidor, controle antispam, limites de requisição e erros em português antes de publicar.

## Hospedagem e SEO

Esta cópia está preparada para o GitHub Pages. O endereço de publicação é confirmado pelo GitHub ao concluir a implantação.

A publicação usa a pasta **Crwebstudio/** do repositório existente **LUCSIDSISTEMAS/app**, na branch `main`. O conteúdo compilado fica diretamente nessa pasta; o código de manutenção fica em `source/`. Após cada build, copie `source/dist/` para `Crwebstudio/` e envie as alterações para a publicação de Pages já configurada no repositório. A pasta não instala um workflow próprio nem altera a configuração dos outros projetos. Nenhum `CNAME` é criado; esta configuração não registra o domínio `crwebstudio.com.br`.

`allowIndexing: true` publica `index,follow` no HTML e permite a indexação da página. O build gera também `robots.txt` e `sitemap.xml` com os caminhos da hospedagem escolhida. Em sites de projeto do GitHub Pages, um `robots.txt` dentro da subpasta não controla os rastreadores do domínio inteiro. Permitir indexação não garante que os buscadores indexem a página nem uma posição nos resultados. A política pode ser alterada em `site.config.json` e exige um novo build.

## Verificação

Nesta revisão, o build e as checagens estáticas passaram: um H1, IDs únicos, âncoras válidas, arquivos locais presentes, campos de compilação resolvidos, política de indexação e destinos de WhatsApp conferidos, além de sintaxe JavaScript válida. A versão publicada deve ser conferida no navegador após o envio. Essas verificações não substituem medições de LCP/CLS nem testes em dispositivos reais; não há resultados medidos de Core Web Vitals nesta revisão.

Referências técnicas usadas: [W3C — padrão de abas acessíveis](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) e [web.dev — otimização de LCP](https://web.dev/articles/optimize-lcp). O recurso visual principal recebe prioridade e o conteúdo abaixo da abertura usa imagens com lazy loading. Licença das fontes em `public/assets/font-license.txt`.

