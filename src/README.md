# 💻 Diretório `src/` — Arquitetura do Frontend (React + TypeScript)

Este diretório contém o código-fonte principal da aplicação web interativa **VAR-ÃO**, implementada em **React 19**, **TypeScript** e estilizada com **Tailwind CSS**.

---

## 🏛️ Estrutura de Pastas

```
src/
├── components/          # Componentes visuais modulares da interface
│   ├── CourtLayout.tsx           # Desenho da quadra interativa e slots de câmera
│   ├── VarReviewModal.tsx        # Central tática de revisão do VAR (Slow-mo, zoom, anotação)
│   ├── CameraView.tsx            # Visão de gravação da Câmera Periférica (OLED + Webcam)
│   ├── HighlightsGalleryModal.tsx# Galeria de lances salvos (Highlights de 40s)
│   ├── ProUpgradeModal.tsx       # Modal de assinatura e benefícios do plano Pro
│   └── GithubRoadmapModal.tsx    # Visualizador do Roadmap Markdown com cópia rápida
├── types/               # Definições de tipos TypeScript e contratos de dados
│   └── index.ts                  # Entidades do domínio (câmeras, lances, vereditos, planos)
├── utils/               # Funções utilitárias e geradores gráficos
│   └── mockFootage.ts            # Motor gráfico de renderização de vídeo simulado em Canvas
├── App.tsx              # Componente raiz, máquina de estados e roteamento de telas
├── index.css            # Folha de estilo global, temas de quadra e animações
└── main.tsx             # Ponto de entrada do React DOM
```

---

## 🔄 Fluxo de Navegação e Máquina de Estados

O arquivo `App.tsx` atua como o controlador de tela principal gerenciando a transição entre quatro visualizações centrais:

```
                  ┌──────────────────────┐
                  │    TELA 1: HOME      │
                  │   Escolha de Papel   │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│   TELA 2: MESTRE      │         │ TELA 3: SETUP CÂMERA  │
│  Mapa da Quadra       │         │ Escolha do Ângulo     │
│  Acionar VAR / Salvar │         └───────────┬───────────┘
└───────────────────────┘                     ▼
                                  ┌───────────────────────┐
                                  │ TELA 4: CÂMERA GRAVA  │
                                  │ Buffer de 40s Ativo   │
                                  └───────────────────────┘
```

### Estados Principais Gerenciados no `App.tsx`:
1. `activeScreen`: Alterna dinamicamente entre `'home'`, `'master'`, `'camera_setup'` e `'camera_recording'`.
2. `sport`: Define o layout da quadra e regras dimensionais (`'court_volleyball'` ou `'beach_volleyball'`).
3. `tier`: Controla o plano do usuário (`'free'` ou `'pro'`), aplicando travas de limite de câmeras e cota de salvamento.
4. `cameras`: Lista de dispositivos conectados ao Jam com posição, status, bateria, FPS e resolução.
5. `highlights`: Armazenamento de jogadas de 40s exportadas na galeria local.
6. `isTransferringToMaster`: Efeito de gatilho que simula o congelamento do buffer nas câmeras periféricas no momento em que o Mestre clica em *Acionar VAR* ou *Salvar Lance*.

---

## 🎨 Design System e Estilização

- **Cores Táticas:**
  - Primária (Ações e Destaques): `emerald-500` / `#10b981`
  - VAR / Perigo / Arbitragem: `red-500` / `#ef4444`
  - Fundo Tático OLED: `gray-950` / `#0b0f17`
- **Texturas Customizadas (`index.css`):**
  - `.court-wood-pattern`: Textura clássica de assoalho de madeira para vôlei de quadra.
  - `.beach-sand-pattern`: Textura pontilhada de areia para vôlei de praia.
  - `.tactical-scanline`: Efeito de linha de varredura de monitor tático de arbitragem.
- **Tipografia:**
  - Títulos e interface: `Plus Jakarta Sans`
  - Códigos, timers, FPS e telemetria: `JetBrains Mono`

---

## 🔗 Próximos Passos na Arquitetura

Para consultar as documentações específicas de cada subsistema:
- [Consulte a documentação de componentes (`components/README.md`)](./components/README.md)
- [Consulte a documentação das entidades e tipos (`types/README.md`)](./types/README.md)
- [Consulte a documentação do motor de simulação gráfica (`utils/README.md`)](./utils/README.md)
