# 🧩 Componentes · Outro Ângulo

[← Frontend](../README.md) · [Design system](../../DESIGN.md)

| Componente | Responsabilidade e limites |
| :--- | :--- |
| `CourtLayout` | Mapa com marcadores orientados e pop-up contextual de nome/direção. A organização é demonstrativa. |
| `CameraView` | Prévia da webcam ou visualização simulada. Trata permissão e libera o stream; não grava um buffer. |
| `VarReviewModal` | Replay Canvas ilustrativo, alternância de ângulo, velocidade, zoom, marcações e vereditos demonstrativos. |
| `HighlightsGalleryModal` | Lista metadados dos lances da demonstração e exporta resumos em texto. |
| `ProUpgradeModal` | Apresenta planos simulados, sem compra ou cobrança. |
| `GithubRoadmapModal` | Apresenta planejamento demonstrativo; o roadmap versionado é a referência atual. |
| `DialogBoundary` | Semântica de diálogo, foco, Escape, bloqueio de rolagem e fundo inerte. |

## Padrões de interação

Ações principais usam azul e texto explícito. O replay usa fundo escuro para priorizar a imagem. Controles devem funcionar com teclado e exibir foco visível. A movimentação do mapa também oferece alternativas à interação por arraste.

Os componentes recebem dados e callbacks da aplicação; não devem transformar valores simulados em promessas de funcionamento nativo. A interface de planos não deve coletar pagamento, e o botão de exportação deve indicar o formato real.

## Ao alterar um componente

Verifique o fluxo de entrada e saída, restauração de foco, tela estreita, texto ampliado e preferência por movimento reduzido. Preserve a liberação da webcam e a desmontagem dos modais. Rode `npm run lint` e `npm run build` na raiz.

A revisão manual em leitor de tela permanece parte do [roteiro de validação](../../docs/VALIDATION.md), e não deve ser presumida apenas pela existência de atributos ARIA.

## Configuração junto à câmera

Toque no marcador ou pressione Enter para abrir um pop-up não modal junto à câmera. Ele prefere o espaço abaixo, inverte para cima quando necessário e se ajusta às bordas da área visível, sem alterar a altura da página. O botão fixo de revisão fica fora da área ocupada pelo pop-up.

O pop-up abre em modo circular por padrão: oito setas orbitam um centro que identifica o estado atual, sem expor graus ou nomes ambíguos na interação principal. Um botão de acessibilidade no canto superior alterna para uma rosa dos ventos 3×3 com botões nativos e foco visível. Nome e direção ficam pendentes até **Salvar**; o CTA começa desabilitado, aplica as duas alterações e fecha o pop-up. Fechar sem salvar descarta a edição. Um ângulo intermediário já existente permanece como “Atual” até uma direção ser escolhida. A convenção mantém `atan2`: direita 0°, baixo 90°, esquerda 180°, cima 270°; diagonais nos intervalos de 45°. A seta gira ao redor do centro do marcador.

Um deslocamento de pelo menos 6 px distingue arraste de toque. Arrastar move a câmera sem abrir sua configuração. As setas do teclado continuam movendo o marcador. Escape e o botão de fechar devolvem o foco à câmera; tocar fora, sair com Tab ou escolher outra câmera encerra a configuração anterior. A remoção permanece como ação secundária e direciona o foco a outra câmera ou ao botão de adicionar.

O posicionamento acompanha rolagem, tamanho do conteúdo, redimensionamento e eventos de `visualViewport`, incluindo mudanças de área visível pelo teclado virtual. Em alturas extremas, o conteúdo do pop-up pode rolar internamente. Teste físico do teclado iOS/Android continua recomendado.
