# ⚙️ Diretório `src/utils/` — Utilitários e Motor Gráfico Tático

Este diretório contém os utilitários de simulação, sincronização temporal e o motor de renderização em HTML5 Canvas responsável por gerar os feeds de vídeo dos ângulos de quadra.

Arquivo principal: [`src/utils/mockFootage.ts`](./mockFootage.ts)

---

## 🎥 Motor Gráfico de Simulação de Vôlei (`mockFootage.ts`)

A função central do motor é:

```typescript
export function drawSimulatedAngleFootage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  positionId: CameraPositionId,
  sport: SportType,
  t: number,                 // Tempo atual do buffer em segundos (0 a 40)
  isSlowMo: boolean = false
): void;
```

Essa função renderiza de forma sincronizada em 60 FPS a jogada de vôlei a partir do ponto de vista exato do ângulo de câmera selecionado.

---

## 📐 Perspectivas Renderizadas por Ângulo

### 1. Linhas de Fundo (`pos_fundo_baixo` e `pos_fundo_cima`)
- **Perspectiva:** Linha de fundo em primeiro plano ocupando a base da tela ($y = h \times 0.82$) e linhas laterais convergindo em direção à rede ao fundo.
- **Física da Bola e Impacto:**
  - A bola viaja pelo ar e atinge o solo no instante $t \approx 2.85\text{s}$ do ciclo de jogada.
  - No instante exato de contato, renderiza uma **explosão de pó de giz branco** em elipse sobre a linha branca para ilustrar o teste clássico de arbitragem (bola dentro tocando a linha).

### 2. Visão da Rede e Antenas (`pos_rede_esq` e `pos_rede_dir`)
- **Perspectiva:** Close-up da fita branca horizontal superior da rede, malha preta e poste da antena listrado em vermelho e branco (listras de 16px).
- **Ação dos Atletas:**
  - Braços do bloqueador saltando no tempo correto ($t \approx 2.0\text{s}$).
  - A bola é atacada rente à antena, raspando nos dedos do bloqueio e desviando de trajetória.
  - Indicador circular verde com pulso de contato destacando o instante do toque.

### 3. Visão Lateral Panorâmica (`pos_lateral`)
- **Perspectiva:** Visão lateral ampla da quadra, mostrando a rede perpendicular ao observador, as duas metades da quadra e a trajetória em arco parabólico da bola.

---

## 🕒 Telemetria e HUD Tático

Em cada quadro gerado, a função `drawTacticalHud` aplica a sobreposição oficial de informações do VAR:
1. **Identificador da Câmera:** Nome do ângulo com ponto verde indicador de sinal ativo.
2. **Buffer Restante:** Indicador de contagem decrescente (ex: `BUFFER: -1.5s`).
3. **Timecode de Alta Precisão:** Relógio em formato `00:SS.mmm` com sincronização simulada por protocolo NTP local ($\pm 0.4\text{ms}$).
4. **Selo de Câmera Lenta:** Indicador vermelho em destaque quando a velocidade está abaixo de $1.0\text{x}$.

---

## 🏐 Renderização da Bola Tricolor Oficial

A função `drawVolleyball(ctx, x, y, radius, rotation)` desenha a clássica bola de vôlei tricolor (amarelo, azul e branco) com rotação angular proporcional ao deslocamento para conferir realismo físico às revisões do VAR.
