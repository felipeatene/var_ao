# 🧩 Diretório `src/components/` — Catálogo de Componentes

Este diretório contém os componentes modulares da interface do **VAR-ÃO**. Cada componente é independente, fortemente tipado e focado em um aspecto específico da experiência do usuário (UX).

---

## 📋 Sumário dos Componentes

| Componente | Responsabilidade Principal |
| :--- | :--- |
| [`CourtLayout.tsx`](#1-courtlayouttsx) | Renderiza a quadra interativa com posições de câmera e indicador de slots |
| [`VarReviewModal.tsx`](#2-varreviewmodaltsx) | Central de arbitragem com player tático, slow-mo, zoom, anotação e vereditos |
| [`CameraView.tsx`](#3-cameraviewtsx) | Tela de gravação OLED da câmera periférica (Buffer 40s + Webcam real) |
| [`HighlightsGalleryModal.tsx`](#4-highlightsgallerymodaltsx) | Galeria de jogadas salvas ("VAR-ÃO - Jogadas") e exportação de clipes |
| [`ProUpgradeModal.tsx`](#5-proupgrademodaltsx) | Tabela comparativa Free vs Pro e alternador de assinatura |
| [`GithubRoadmapModal.tsx`](#6-githubroadmapmodaltsx) | Visualizador do roadmap de 5 fases com cópia para o GitHub em 1 clique |

---

## 1. `CourtLayout.tsx`

Renderiza o desenho interativo da quadra de vôlei (Indoor ou Praia) com **posicionamento 100% livre e arrasto (Drag & Drop)** das câmeras periféricas.

### Props:
```typescript
interface CourtLayoutProps {
  sport: SportType;                    // 'court_volleyball' ou 'beach_volleyball'
  cameras: CameraDevice[];             // Dispositivos atualmente ativos no Jam
  onAddCameraAtPosition: (xPercent: number, yPercent: number, label: string) => void;
  onUpdateCameraPosition: (id: string, xPercent: number, yPercent: number) => void;
  onUpdateCameraRotation: (id: string, rotationDegrees: number) => void;
  onUpdateCameraLabel: (id: string, label: string) => void;
  onRemoveCamera: (id: string) => void;
  onSelectCameraPreview?: (cam: CameraDevice) => void;
  isPro: boolean;                      // Limite de 2 câmeras no Free / Ilimitado no Pro
  onOpenUpgradeModal: () => void;
}
```

### Funcionalidades:
- **Área da Arena Expandida (Zona Livre Externa):** Toda a extensão ao redor das linhas brancas da quadra (área de escape, trás da linha de fundo e laterais da rede) agora é 100% interativa para posicionar tripés reais de arbitragem.
- **Posicionamento Livre por Toque ou Botão:** O usuário pode clicar diretamente em qualquer coordenada (dentro ou fora da quadra) ou clicar em *"+ Posicionar Câmera"* para ativar a mira tática.
- **Arrasto em Tempo Real (Drag & Drop):** Tanto no celular (touch events) quanto no desktop (mouse events), o usuário pode segurar e arrastar o pino da câmera livremente pela zona externa ou interna.
- **Cone de Visão da Lente (FOV Cone):** Cada câmera projeta um feixe de luz semitransparente verde indicando a direção exata para onde a lente está apontada (inclusive de fora para dentro da quadra).
- **Gaveta de Configuração do Ângulo:** Permite renomear o ponto, girar a lente (0° a 360°) ou usar os atalhos automáticos *"Apontar Centro da Quadra"* e *"Apontar para a Rede"*.
- **Indicadores Visuais:** Anel de radar estroboscópico verde (`animate-ping`), indicador de FPS, etiqueta de status (FORA vs DENTRO) e telemetria de coordenadas.

---

## 2. `VarReviewModal.tsx`

É o coração da ferramenta de arbitragem. Simula o congelamento do buffer de 40 segundos e permite inspecionar cada milissegundo do lance duvidoso.

### Props:
```typescript
interface VarReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: SportType;
  cameras: CameraDevice[];
  onVerdictDecided: (verdict: VarVerdict, notes: string) => void;
}
```

### Recursos Táticos Integrados:
- **Barra de Linha do Tempo (Scrubber):** Navegação fluida de 0 a 40 segundos com indicação do ponto estimado de impacto (`38.45s`).
- **Controle de Velocidade:** Opções de `0.1x` (ultra câmera lenta), `0.25x` (padrão VAR), `0.5x` e `1.0x` (velocidade normal).
- **Avanço Quadro a Quadro:** Botões `-1f` e `+1f` (passo de aproximadamente 16 milissegundos).
- **Zoom Digital & Pan:** Níveis de ampliação de `1.0x` a `3.0x` para checar se a bola triscou na linha branca ou se houve toque na rede.
- **Anotações Táticas sobre o Vídeo:**
  - *Linha Laser:* Traçado de linha guia pontilhada sobre a linha da quadra ou antena.
  - *Marcador de Toque:* Ponto de contato na ponta dos dedos do bloqueador.
- **Registro de Vereditos Oficiais:**
  - `🏐 Bola DENTRO`
  - `🔴 Bola FORA`
  - `🧤 Toque Bloqueio`
  - `⚠️ Toque na Rede`
  - `🚫 Invasão`
  - `✅ Confirmar Ponto`

---

## 3. `CameraView.tsx`

A tela exibida no smartphone que atua como **Câmera Periférica**. Foi projetada com base nas restrições de economia de bateria de quadra e gravação contínua.

### Props:
```typescript
interface CameraViewProps {
  positionId: CameraPositionId;
  sport: SportType;
  onExit: () => void;
  isTriggered: boolean;                // Ativado quando o Mestre clica no VAR/Salvar
  onSelectPosition: (pos: CameraPositionId) => void;
}
```

### Funcionalidades:
- **OLED Power Saving:** Fundo totalmente preto `#000000` para reduzir o consumo de bateria do smartphone posicionado no tripé.
- **Suporte a Webcam Real:** Permite ao usuário clicar no botão *"Webcam Real"* e capturar a câmera física do dispositivo via `navigator.mediaDevices.getUserMedia`.
- **Efeito de Congelamento:** Ao receber o sinal do Mestre, exibe a notificação instantânea de transferência de buffer P2P.
- **Seletor Rápido de Posição:** Permite alterar o papel físico do smartphone em quadra a qualquer momento.

---

## 4. `HighlightsGalleryModal.tsx`

Simula a pasta do dispositivo móvel `"VAR-ÃO - Jogadas"`, armazenando os clipes de 40 segundos salvos pelo Mestre.

### Recursos:
- **Contador Semanal do Plano Free:** Mostra claramente a cota de `3 lances por semana` para usuários gratuitos e status ilimitado para Pro.
- **Metadados dos Clipes:** Exibe data, duração (40s), quantidade de ângulos sincronizados, resolução (`720p` com marca d'água ou `1080p` limpo) e tags da jogada.
- **Exportação:** Permite baixar o arquivo simulado do lance para compartilhamento social.

---

## 5. `ProUpgradeModal.tsx`

Apresenta a proposta de valor do plano Pro (R$ 9,00/mês) e inclui um alternador interativo de simulação com efeito de confete, permitindo testar instantaneamente a aplicação tanto no modo Free quanto no modo Pro.

---

## 6. `GithubRoadmapModal.tsx`

Modal que renderiza o planejamento técnico completo das 5 fases do projeto, com botão de cópia direta para o clipboard (`navigator.clipboard.writeText`) e download do arquivo `ROADMAP_VARAO.md` pronto para ser colocado no repositório.
