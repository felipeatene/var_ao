---
name: Outro Ângulo
description: Revisão de lances por dois pontos de vista, com interface essencial.
colors:
  action: "#2456d8"
  canvas: "#f7f7f2"
  surface: "#fff"
  ink: "#17212b"
  muted: "#56616d"
  line: "#dadedf"
  replay: "#15191f"
  replay-muted: "#b8c2cf"
  error: "#b42318"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(46px, 4.5vw, 68px)"
    fontWeight: 720
    lineHeight: 1.04
    letterSpacing: "-.04em"
  headline:
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.035em"
  body:
    fontSize: "17px"
    lineHeight: 1.55
  label:
    fontSize: "16px"
    fontWeight: 600
rounded:
  control: "8px"
  surface: "12px"
  panel: "16px"
spacing:
  compact: "8px"
  control-gap: "12px"
  regular: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.action}"
    rounded: "{rounded.surface}"
    padding: "14px 20px"
  button-quiet:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  buffer-status:
    backgroundColor: "#edeff0"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "18px"
  segmented:
    backgroundColor: "#e9eced"
    rounded: "{rounded.surface}"
    padding: "4px"
---

# Design System: Outro Ângulo

## Overview

**Creative North Star: "Essencial"**

A direção A — Essencial, aprovada em docs/design/option-a.png, organiza Outro Ângulo em superfícies claras, texto grafite e ações azuis. A quadra orienta o posicionamento; o replay escuro concentra a atenção no vídeo. A personalidade é direta e tranquila, com poucos elementos competindo por atenção.

Registro extraído de `src/index.css` e `apps/mobile/lib/main.dart`. Os tokens acima descrevem a implementação web; as cores principais e os raios de botões também aparecem no Flutter. Há diferenças intencionais de plataforma, descritas abaixo. Esta documentação não substitui testes físicos nem constitui auditoria completa de acessibilidade.

**Key Characteristics:**
- Superfícies claras e hierarquia legível.
- Azul reservado a ações e seleção.
- Quadra como orientação espacial e replay como área de atenção.

## Colors

Primária: azul de ação. Neutras: branco quente de fundo, branco de superfície, grafite para texto, cinza secundário e divisórias suaves. O replay tem fundo escuro próprio e texto secundário claro. Vermelho é reservado a erro ou ação destrutiva, sem depender apenas da cor para comunicar o estado.

**The Ação Clara Rule.** Use o azul para a próxima ação e para a seleção; mantenha texto explicativo em grafite secundário.

O Flutter declara explicitamente as cores principais, superfície, texto e erro em um tema Material 3; papéis restantes derivam de `ColorScheme.fromSeed`. Não se presume igualdade de todas as cores geradas entre plataformas. Nomes legados `emerald` no CSS apontam para azuis; não são autorização para introduzir verde.

## Typography

A web usa a pilha de fontes do sistema e títulos de peso forte, com espaçamento entre letras compacto. O título principal se adapta ao viewport; telas de partida usam a função headline. Texto secundário mantém hierarquia por tamanho e cor, sem se tornar instrução ilegível.

O Flutter não fixa família tipográfica: herda a tipografia Material da plataforma. Seu título maior usa tamanho 40, altura 1,08, peso 700 e espaçamento -1,3; o título médio usa 30 e peso 700; corpo maior usa 17 com altura 1,5. Não copiar mecanicamente os tamanhos desktop para o celular. A identidade textual tem tamanho 21 no Flutter e 22 no web desktop.

## Layout

A web limita o conteúdo principal a 1168 px e o cabeçalho a 1264 px. A abertura desktop dispõe história e ações em duas colunas; a tela de partida mantém quadra e controles próximos. Margens laterais de 24 px organizam o conteúdo móvel. Os pontos de adaptação observados são 620, 800 e 1400 px.

Até 620 px, a composição vira uma coluna; o replay ocupa toda a tela, e a comparação de vídeos se empilha. A ação de revisão fica no rodapé com compensação de área segura e espaço reservado no conteúdo. Verificar que teclado, ampliação de texto e navegação não a encobrem.

No Flutter, `SafeArea`, listas roláveis e largura máxima de 560 na abertura e 640 na sessão delimitam a leitura. O fluxo usa navegação Cupertino no iOS e Material no Android. A quadra móvel é uma ilustração de orientação e alterna com a prévia; o mapa web oferece marcadores e ajustes. Essa diferença não deve ser apresentada como paridade de interação já concluída.

## Elevation & Depth

Predominam superfícies planas, separação tonal e linhas discretas. Sombras aparecem em feedback temporário, na ação fixa móvel web e no painel contextual de câmera, registradas no sidecar. A barra superior Flutter remove a elevação ao rolar.

**The Vídeo em Primeiro Plano Rule.** Reserve a superfície escura para captura e revisão; evite efeitos que disputem atenção com o lance.

## Shapes

Controles pequenos usam cantos suavizados; botões principais e campos de vídeo usam o raio de superfície; mapa e painel de replay usam o raio de painel. Marcadores de câmera são circulares e numerados. No Flutter, botões preenchidos e contornados compartilham cantos de 12 e altura mínima de 56 unidades lógicas.

## Components

**The Camera Direction Rule.** A selected camera uses a compact circular wheel with eight arrows around a neutral center. The center may show `Atual` for an existing intermediate angle, while the camera marker preview follows the pending direction.

**The Accessible Alternate Rule.** The accessibility control in the popover header switches to an eight-button 3×3 wind rose. Native buttons, `radiogroup` semantics, arrow-key navigation, and visible focus make the same choice available without relying on the circular gesture.

**The Explicit Save Rule.** Name and direction are drafts until the primary `Salvar` action is enabled and pressed. Closing or switching cameras discards drafts; saving applies them, announces confirmation, closes the popover, and restores focus to the marker.

- **Ações:** botão azul preenchido para criar partida ou revisar lance; contornado para entrar ou realizar ação secundária. Web: altura mínima de 56 px, reduzida a 54 px no breakpoint móvel; utilidades principais têm 48 px. Estado desabilitado reduz opacidade e impede a ação. Hover principal usa azul mais escuro; secundário recebe fundo azul suave.
- **Campos:** rótulos permanentes, borda discreta, cantos de controle e altura mínima de 48 px nos ajustes web. Convite móvel aceita colagem em campo Material de múltiplas linhas. Erros devem explicar recuperação; no Flutter a mensagem é uma região semântica viva.
- **Seleção de modalidade:** duas escolhas explícitas, Quadra e Praia. Na web, a escolha usa `aria-pressed`; no Flutter, `SegmentedButton`. Não representar seleção exclusivamente por cor.
- **Navegação:** botões discretos e rótulos claros. Preservar controles de retorno e encerramento em estados intermediários.
- **Câmeras e quadra:** câmera numerada, nome e estado textual. Marcadores web medem 48 px e permitem ajuste de posição; a ilustração Flutter orienta sem prometer calibração. A precisão de localização não foi validada.
- **Configuração contextual de câmera (web):** tocar ou ativar um marcador abre um painel não modal ancorado a ele, com nome, seletor nativo de oito direções e remoção. O painel usa superfície branca, raio de 12 px, sombra `0 8px 28px #17212b2b` e largura máxima de 312 px; mantém margem de 12 px no viewport, reposiciona acima ou abaixo e reserva espaço para a ação fixa de revisão. Campos têm altura mínima de 48 px e texto de 16 px. A seta externa indica a direção; ângulos existentes fora das oito opções aparecem como “Atual”. O foco inicial vai ao painel, sem abrir o teclado virtual. Escape, botão de fechar, interação externa ou saída de foco encerram a configuração; Escape e fechar devolvem o foco ao marcador. Arrastar a partir de 6 px move a câmera sem abrir o painel; setas do teclado também movem o marcador. Esses comportamentos estão implementados, com teclado físico e VoiceOver ainda pendentes de validação.
- **Buffer:** mostrar disponibilidade e explicar lacunas. O bloco web é tonal; a sessão Flutter usa informação textual e ícone. O valor nominal de 40 segundos não representa continuidade garantida.
- **Replay:** superfície escura, seletor de ângulo, linha do tempo e controles legíveis. Ferramentas secundárias ficam recolhidas no web. Disponibilidade de controles específicos deve seguir a implementação de cada plataforma, sem inferir paridade a partir destes estilos.

A web define foco visível de 3 px com afastamento de 4 px e remove animações/transições sob `prefers-reduced-motion: reduce`. Transições de botão duram 0,15 s. O Flutter tem rótulos semânticos na ilustração e no QR, controles nativos e mensagens de erro em região viva. Os exemplos do sidecar retratam primitivas web e seus estados observados, não uma biblioteca Flutter.

Verificações ainda necessárias: navegação completa por teclado, foco em diálogos, contraste de todos os estados, tamanho de texto ampliado, VoiceOver/TalkBack, gesto de posicionamento por tecnologia assistiva e telas pequenas reais. A documentação não afirma aprovação nesses itens.

## Do's and Don'ts

### Do:
- Do preservar rótulos claros e estados textuais junto à cor.
- Do manter alvos principais de pelo menos 48 unidades lógicas.
- Do distinguir demonstração web e captura móvel ao apresentar o produto.

### Don't:
- Don't usar a quadra como prova de calibração ou precisão.
- Don't esconder lacunas ou tratar o buffer nominal como vídeo contínuo garantido.
- Don't declarar auditoria de acessibilidade ou validação física ainda não realizadas.
