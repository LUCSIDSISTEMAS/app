# Componentes — crwebstudio v5

## Direção

A referência enviada é a base de composição: abertura navy e azul elétrico, título branco com destaque azul, marca pequena no canto, dispositivos em perspectiva à direita, grande painel claro e sequência de celulares. Contornos são reservados principalmente a molduras de dispositivos; conteúdo institucional e planos têm organização aberta. Não acrescente pílulas de microtexto, controles de pausa, logos de parceiros ou métricas sem informação confirmada.

A tipografia usa apenas a família local `CRSans` em regular e negrito, com licença junto aos recursos. As variáveis no `:root` de `src/styles.css` centralizam cores, medidas, espaçamento, raio de controles e transições.

## Componentes

| Componente | Contrato |
| --- | --- |
| `.container` | Limite de largura e margens móveis comuns a toda a página. |
| `.site-header` | Navegação sticky, marca com retorno a `/`, cinco âncoras principais. |
| `.brand` | Símbolo oficial pequeno mais nome; nunca usar o monograma grande como imagem principal da abertura. |
| `.mobile-menu` | Elemento `details` nativo; fecha ao navegar, clicar fora ou pressionar Escape. |
| `.button`, `.text-link` | Ações reais por links com nomes claros e área de toque mínima de 44 px. Contatos usam HTTPS e `target="_top"`, sem depender de uma nova aba ou de JavaScript. |
| `.hero-main` | H1 único à esquerda; `.hero-art` ilustrativa à direita no computador. |
| `.hero-art`, `.art-stage` | Composição ilustrativa com link real em `.mock-action`. Não usar `role="img"` nem `aria-hidden` nos ancestrais dos links; somente detalhes sem interação são decorativos. |
| `.browser-window`, `.hero-phone` | Telas demonstrativas em HTML com recurso artístico WebP; não são interfaces de cliente conectado. |
| `.expertise-row`, `.proof-row` | Especialidades e informação dos 200+ clientes, sem marcas de parceiros ou indicadores inventados. |
| `.section-heading` | H2 e um parágrafo curto para introduzir uma área. |
| `.workspace` | Painel amplo e claro para escolher a solução, sem repetir grades de cartões pela página inteira. |
| `.solution-tabs`, `.solution-tab` | Âncoras progressivamente convertidas em abas ARIA; seleção por clique, setas, Home, End e Espaço. |
| `.solution-panel` | Artigo com H3, parágrafo, benefícios e CTA. Recebe `tabpanel` e fica oculto somente quando outra aba é selecionada. Sem JS, todas as soluções continuam acessíveis. |
| `.workspace-benefits` | Três características comuns: identidade, experiência e tecnologia. |
| `.workspace-promo` | Recurso artístico com overlay escuro e CTA real. Não deixar texto diretamente sobre uma área clara da imagem. |
| `.device-gallery` | Região acessível com quatro celulares largos em uma faixa horizontal. Toque nativo no celular, movimento suave de ida e volta e clique/arraste no computador com mouse. Teclado preservado; sem setas ou contador visível. |
| `.device-example` | Exemplo ilustrativo com legenda e CTA comercial real em `.screen-button`. O rótulo propõe criar a solução e não simula acesso a uma loja ou pedidos existentes. |
| `.contact-orbit` | Links sociais dos exemplos com nome acessível e alvo de 44 px. Instagram sempre oficial; WhatsApp depende de número confirmado. |
| `.offers`, `.offer` | Dois planos em colunas abertas; textos distinguem compra integral de assinatura recorrente. |
| `.contact-actions` | Canais oficiais, independentes de JavaScript. WhatsApp ativo para +55 (31) 99818-8607, confirmado pelo responsável. Instagram mantém o perfil oficial como destino. |
| `.site-footer`, `.back-top` | Marca compacta, assinatura e retorno ao início. |
| `.icon-library`, `.icon` | Ícones SVG embutidos, decorativos, sem requisições externas. |

## Responsividade e interação

A base é de 320 px, expandida em 768, 1024 e 1440 px. Navegação desktop e barra lateral vertical de soluções começam em 1024 px. Abaixo disso, o menu é compacto e as abas são horizontais. Os celulares podem ser percorridos por gesto e pelas setas do teclado quando a galeria recebe foco.

O JavaScript só aprimora a página: menu nativo e links continuam utilizáveis, e as soluções ficam visíveis sem script. Quando as abas são ativadas, apenas a selecionada tem `tabindex=0`; cada aba aponta para seu painel, com `aria-selected` e `aria-controls` sincronizados. O painel também pode receber foco.

## Movimento

A perspectiva da composição usa `--tilt-x` e `--tilt-y` em `.art-stage`, com limite de 2,5 graus por eixo. Somente ponteiro fino habilita o efeito. Ao chegar a um link, o ponteiro mantém a inclinação atual; o foco pelo teclado neutraliza a perspectiva. Os eventos de movimento não interceptam os cliques. Os blocos usam `.reveal.is-visible` para entrada única ao rolar. O conteúdo nunca depende de uma animação para ficar legível.

`prefers-reduced-motion` remove os movimentos. `body.page-inactive`, `.hero-art.is-offscreen` e `.device-example.is-offscreen` interrompem processamento visual fora da área ativa. O observador antecipa a retomada a 80 px da área visível. A preferência de reduzir movimentos fica no rodapé. Conforme a orientação do responsável, a galeria se move automaticamente apenas no desktop com mouse, enquanto visível; pausa com hover, foco, arraste, página oculta e movimento reduzido. O deslocamento retoma da posição atual e desacelera nas extremidades.

A composição principal mantém sua flutuação e pequenas inclinações. Os quatro celulares da galeria ficam proporcionais e estáveis dentro da faixa; apenas a rolagem horizontal do conjunto se move no desktop. A largura explícita de cada cartão impede o encolhimento, e a altura pode crescer para acomodar o conteúdo.

Reflexos diagonais, movimento da arte azul, realce sequencial dos ícones de pedidos e halo do WhatsApp são camadas decorativas. Pseudo-elementos usam `pointer-events: none`; não alteram textos, números ou estados reais e ficam desligados com movimento reduzido.

## Manutenção

Edite origem e configuração, depois execute `npm run build`. Não edite arquivos minificados. Toda nova página interna precisa de título, descrição, H1, canonical e sitemap próprios, além de breadcrumbs. Não acrescente recursos de servidor ou formulários como simulação; implemente a infraestrutura antes de apresentar a função como disponível.

