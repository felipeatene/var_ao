# 🧩 Componentes · Outro Ângulo

[← Frontend](../README.md) · [Design system](../../DESIGN.md)

| Componente | Responsabilidade e limites |
| :--- | :--- |
| `CourtLayout` | Mapa com posições de câmera, seleção, movimentação e edição. A organização é demonstrativa. |
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
