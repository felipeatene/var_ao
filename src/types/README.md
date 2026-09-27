# 🏷️ Diretório `src/types/` — Modelos e Contratos de Dados

Este diretório contém as definições de tipos TypeScript que governam todas as entidades de negócio e o estado da aplicação **VAR-ÃO**.

Arquivo principal: [`src/types/index.ts`](./index.ts)

---

## 🗃️ Entidades e Tipos Principais

### 1. Modalidade Esportiva (`SportType`)
```typescript
export type SportType = 'court_volleyball' | 'beach_volleyball';
```
Define as dimensões e elementos de marcação da quadra:
- `'court_volleyball'`: Quadra de vôlei tradicional indoor ($9 \times 18\text{m}$) com linhas de ataque de 3 metros e assoalho de madeira.
- `'beach_volleyball'`: Quadra de vôlei de praia ($8 \times 16\text{m}$) sem linha de ataque de 3 metros e textura de areia.

---

### 2. Posições de Câmera na Quadra (`CameraPositionId`)
```typescript
export type CameraPositionId =
  | 'pos_fundo_cima'   // Fundo Superior / Oposto
  | 'pos_fundo_baixo'  // Fundo Inferior / Próximo ao saque
  | 'pos_rede_esq'     // Rede - Antena Esquerda
  | 'pos_rede_dir'     // Rede - Antena Direita
  | 'pos_lateral';     // Visão Panorâmica da Lateral / Arquibancada
```
Representa os pontos estratégicos recomendados de posicionamento de tripés ao redor da quadra.

---

### 3. Dispositivo de Câmera Conectado (`CameraDevice`)
```typescript
export interface CameraDevice {
  id: string;                                    // Identificador único do dispositivo
  name: string;                                  // Nome legível (ex: "Samsung S22 (Rede)")
  positionId: CameraPositionId | null;           // Slot de quadra ao qual está vinculado
  status: 'connected' | 'recording' | 'syncing' | 'transferring' | 'offline';
  batteryLevel: number;                          // Nível de bateria (0-100%)
  fps: number;                                   // Taxa de quadros (geralmente 60)
  resolution: '720p' | '1080p';                  // Resolução de captura
  bufferSeconds: number;                         // Capacidade do buffer (40 segundos)
  isWebcam: boolean;                             // Indica se está utilizando a webcam real
  streamTrack?: MediaStreamTrack | null;         // Faixa de vídeo da webcam nativa
  lensType: 'standard' | 'wide' | 'telephoto';   // Lente configurada
}
```

---

### 4. Lance Salvo / Highlight (`SavedHighlight`)
```typescript
export interface SavedHighlight {
  id: string;               // Identificador do clipe
  title: string;            // Título descritivo da jogada
  sport: SportType;         // Modalidade na qual foi gravado
  timestamp: string;        // Horário de registro
  duration: number;         // Duração do buffer exportado (40s)
  camerasCount: number;     // Número de câmeras sincronizadas no clipe
  thumbnail: string;        // Imagem representativa do ponto de contato
  fileSizeMb: number;       // Tamanho estimado do arquivo transferido
  resolution: '720p' | '1080p';
  hasWatermark: boolean;    // Presença de marca d'água (Free) ou clipe limpo (Pro)
  tags: string[];           // Tags automáticas (ex: #Bloqueio, #Ace, #VAR)
}
```

---

### 5. Vereditos de Arbitragem do VAR (`VarVerdict`)
```typescript
export type VarVerdict =
  | 'IN'           // Bola dentro da quadra (tocando a linha ou piso válido)
  | 'OUT'          // Bola fora (sem tocar nas linhas limítrofes)
  | 'TOUCH_BLOCK'  // Toque sutil no bloqueio adversário antes de sair
  | 'TOUCH_NET'    // Toque proibido na rede / fita superior durante a jogada
  | 'INVASION'     // Invasão completa por baixo ou por cima da rede
  | 'CONFIRMED'    // Ponto confirmado após revisão
  | 'OVERTURNED';  // Decisão de quadra revertida pelo VAR
```

---

### 6. Modelo de Assinatura (`SubscriptionTier`)
```typescript
export type SubscriptionTier = 'free' | 'pro';
```
- `'free'`: Limite de 2 câmeras no Jam, até 3 lances salvos por semana, resolução 720p com marca d'água.
- `'pro'`: Câmeras ilimitadas, lances ilimitados, 1080p 60fps e vídeo exportado limpo.
