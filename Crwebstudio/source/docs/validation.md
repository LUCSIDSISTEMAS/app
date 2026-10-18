# Revisão da navegação e dos contatos

Revisão de código e arquivos em 17/10/2026, após o relato de que os contatos não abriam. Os resultados abaixo distinguem análise estática, compilação e inspeção de imagem de testes em navegador.

## Correção da navegação

Os 21 links externos da versão anterior usavam `target="_blank"`. Os endereços estavam preenchidos e o JavaScript não interceptava os cliques externos. O bloqueio relatado pelo usuário não foi reproduzido em navegador neste ambiente; abrir nova aba em uma visualização incorporada é uma hipótese, não uma causa comprovada.

A revisão usa âncoras HTTPS com `target="_top"`: em uma página aberta diretamente, o contato abre na própria aba; em uma visualização incorporada, solicita navegação da janela principal, sujeita às permissões do ambiente que incorpora a página. Não usa `window.open`, pop-ups ou redirecionamentos por script. Decorações sobrepostas ignoram o ponteiro, e os dispositivos estabilizam durante o toque. As duas logos retornam a `#inicio`, preservando o caminho do projeto no GitHub Pages.

## Implementação e conteúdo

- Referência visual `IMG_0784.jpeg` inspecionada: navy/azul, interfaces em perspectiva, painel claro e quatro celulares.
- Logo oficial pequena no cabeçalho e no rodapé. Sem logo grande no hero.
- Informação de 200+ clientes incluída conforme afirmação explícita do responsável.
- Sem portfólio, parcerias, prêmios, tempo de mercado, avaliações ou preços fictícios.
- Telas ilustrativas com legenda e botões reais para conversar sobre cada solução, sem simular loja ou pedidos de clientes.
- Quatro soluções explicadas: institucional, loja virtual, gestão/integrações e suporte de TI.
- Compra integral sob orçamento e assinatura de 10% ao mês com ajuda e suporte, apresentada como recorrente.

## Verificações estáticas e build

- Build concluído; sintaxe dos scripts válida e diff sem problemas de espaço em branco.
- Um H1, cinco H2 e seis H3. IDs únicos; referências locais, símbolos e âncoras existentes.
- Imagens com alt e dimensões. Arte principal prioritária e imagens abaixo da abertura com lazy loading.
- Título de 47 caracteres e descrição de 121. Metadados, canonical, sitemap e robots presentes.
- Duas fontes de peso da mesma família CRSans; texto editorial a partir de 16 px.
- Alvos interativos de 44 px ou mais; foco visível e menu nativo.
- Abas com ARIA, foco itinerante, setas por orientação, Home/End/Espaço e Enter. Painéis ocultos apenas após o aprimoramento por JavaScript.
- Galeria com gesto e teclado, sem rolagem automática. Arte com inclinação máxima de 2,5 graus e respeito a movimento reduzido.
- Links externos HTTPS com navegação direta; WhatsApp e Instagram não dependem de JavaScript. Sem formulário, coleta de dados, API keys ou submissão simulada.
- Correção dos cinco CTAs anteriormente decorativos: `Vamos criar`, `Criar site`, `Criar loja`, `Criar painel` e `Conversar` agora são links, sem ancestrais ocultos para acessibilidade.
- WhatsApp oficial +55 (31) 99818-8608, informado pelo responsável, ativo em 17 links comerciais. Os três acessos identificados com a marca WhatsApp estão visíveis.
- Sete mensagens distintas: contato geral, site institucional, loja virtual, gestão, suporte, compra e assinatura. Todas usam o mesmo número confirmado e não enviam mensagens automaticamente.
- Três links visíveis de Instagram continuam apontando para o perfil oficial, independentes da configuração do WhatsApp.
- Flutuação e inclinação decorativa dos dispositivos, reflexos nas telas, realce dos ícones de pedidos e halo do WhatsApp sem alterar dimensões de layout.
- Molduras estabilizam em hover e foco; os reflexos não capturam cliques. Movimento reduzido e suspensão de efeitos fora da tela foram conferidos no código.
- Acesso privado preservado e indexação desabilitada de forma coerente.

## Encaixe calculado com a fonte utilizada

| Viewport | Linha mais longa do H1 | Largura disponível |
| --- | --- | --- |
| 320 px | 271,5 px | 288 px |
| 768 px | 506,7 px | 704 px |
| 1024 px | 417 px | 431,5 px |
| 1440 px | 542,9 px | 558 px |

Em 1024 px, marca, navegação, CTA e intervalos ocupam aproximadamente 762 dos 960 px disponíveis. O título do painel claro em 320 px ocupa cerca de 229,2 dos 248 px disponíveis. Entre 480 e 767 px, detalhes secundários do mockup principal ficam ocultos para evitar corte da ilustração.

Essas medidas são estáticas: não são uma emulação visual dos quatro viewports.

## Contraste calculado

| Combinação | Razão |
| --- | --- |
| Texto principal / navy | 18,88:1 |
| Texto de apoio / navy | 11,85:1 |
| Texto principal / painel claro | 15,70:1 |
| Texto de apoio / painel claro | 7,08:1 |
| Texto branco / azul do botão | 6,18:1 |
| Texto branco / violeta do botão | 6,78:1 |
| Link / painel claro | 6,73:1 |
| Texto branco / WhatsApp | 5,48:1 |

## Recursos

Valores sem compressão de transporte:

| Recurso | Bytes |
| --- | --- |
| CSS minificado | 38.350 |
| JavaScript minificado | 4.607 |
| Arte WebP 1200 × 800 | 132.832 |
| Arte WebP 720 × 480 | 59.798 |
| Conteúdo total de dist | 553.938 |

O total de dist inclui recursos de compartilhamento e variantes; o navegador não precisa baixar todas as imagens ou todas as fontes. A página não carrega biblioteca JavaScript de execução. O original artístico e os arquivos de documentação ficam fora da publicação.

## Limites

O navegador de teste compatível não está disponível neste ambiente. Não foram testadas interações reais em navegadores, nem medidos LCP, CLS ou Lighthouse. LCP abaixo de 2,5 s e CLS abaixo de 0,1 continuam como metas. Uma captura nativa da versão publicada permite verificar o enquadramento desktop, sem substituir esses testes.

Referências: [W3C — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) e [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp).
