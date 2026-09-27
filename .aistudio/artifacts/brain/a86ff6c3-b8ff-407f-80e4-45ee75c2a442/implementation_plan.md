# 🏐 Expansão da Área de Câmeras: Zona Livre Externa (Fora das Linhas Brancas)

Permite posicionar, clicar e arrastar as câmeras para **fora das linhas brancas da quadra** (na área de escape/zona livre ao redor da quadra), como tripés reais de arbitragem posicionados atrás da linha de fundo, nas laterais e além dos postes da rede.

---

### Decisões do Usuário

> [!IMPORTANT]
> - **Câmeras Fora da Quadra (Zona Livre):** Em partidas reais de vôlei, as câmeras ficam montadas em tripés do lado de fora das linhas brancas. A área interativa será expandida para conter tanto o retângulo de jogo (dentro das linhas) quanto o perímetro externo ao redor (fora das linhas).
> - **Visual Tático com Linhas e Escape:** O contorno de jogo terá a linha branca oficial delimitadora, enquanto a área externa exibirá a zona livre (com piso contrastante ou textura de escape), onde os tripés podem ser posicionados livremente.
> - **Overflow Visível:** Os marcadores de câmera e os cones de luz da lente poderão se estender ou ficar posicionados além das bordas sem serem cortados por `overflow-hidden`.

---

## 1. Visão Geral da Mudança no Layout

### Como será estruturado:
1. **Área da Arena (Arena Externa / Zona Livre):**
   - Um contêiner interativo maior ($300\text{px} \times 400\text{px}$) representando o ginásio/praia completo.
   - Todo esse contêiner é interativo para cliques, toques e arrasto (*drag & drop*).
2. **Retângulo da Quadra Oficial (Dentro das Linhas Brancas):**
   - Fica centralizado no meio da arena ($200\text{px} \times 320\text{px}$), com linhas brancas nítidas de 4px, linha central e linhas de ataque de 3m.
   - Deixa uma margem perimetral clara de escape de todos os lados (cima, baixo, esquerda e direita).
3. **Liberdade Total de Posicionamento:**
   - O usuário pode colocar a câmera **fora da linha** (ex: na quina externa do adversário apontando para dentro, no fundo atrás da linha de saque, ou nas laterais externas da rede).
   - O cone de visão da lente (FOV) aponta da câmera externa em direção à quadra.

---

## 2. Diagrama de Composição da Quadra

```
┌────────────────────────────────────────────────────────┐
│  ARENA / ZONA LIVRE EXTERNA (ÁREA DE CLIQUE E ARRASTO) │
│                                                        │
│     (🎥 Tripé Fora) ──► [Cone apontando para a quadra] │
│     ┌────────────────────────────────────────────┐     │
│     │ LINHA BRANCA OFICIAL (9x18m)               │     │
│     │                                            │     │
│     │               Lado Adversário              │     │
│     │                                            │     │
│     │ ═══════════════ REDE CENTRAL ═════════════ │     │
│     │                                            │     │
│     │                  Seu Lado                  │     │
│     │                                            │     │
│     └────────────────────────────────────────────┘     │
│                                                        │
│     (🎥 Tripé no Fundo) ──► [Apontando para a linha]   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Ajustes Técnicos

- Atualizar o cálculo de coordenadas do `CourtLayout.tsx` para cobrir 100% da área da arena (tanto dentro quanto fora da linha branca).
- Atualizar as posições iniciais das câmeras de exemplo para ficarem na zona externa (ex: câmera da quina a $8\%$ de distância da borda externa, e câmera de fundo a $92\%$ do fundo).
- Remover o `overflow-hidden` que cortava os cones e pinos fora da linha branca.
