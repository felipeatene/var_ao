# 🧭 Frontend · Outro Ângulo

[← Documentação principal](../README.md)

O frontend é uma demonstração React 19 + TypeScript + Vite + Tailwind CSS. Mostra a experiência de organizar câmeras e rever um lance. Não implementa comunicação entre celulares nem captura de um buffer real.

## Organização

| Área | Responsabilidade |
| :--- | :--- |
| `App.tsx` | Navegação, modalidade, câmeras, lances e plano demonstrativo |
| `index.css` | Tokens, layout responsivo, componentes visuais e movimento reduzido |
| `components/` | Mapa da quadra, webcam, revisão e diálogos |
| `types/` | Tipos do domínio demonstrativo |
| `utils/` | Renderização do lance ilustrativo em Canvas |

## Fluxo e estado

A entrada permite criar uma partida ou experimentar a câmera. A partida reúne o mapa, posições e ações de revisão. O replay abre em ambiente escuro; a retomada devolve o foco à partida. Galeria, planos e roadmap permanecem acessíveis como demonstrações.

O estado é mantido no React, sem backend de contas ou assinatura. Diálogos são montados apenas quando abertos. `DialogBoundary` delimita o diálogo, controla foco, Escape e rolagem e torna o fundo inerte.

## Contratos importantes

- Dados simulados não representam dispositivos conectados, precisão temporal ou telemetria medida.
- A webcam usa permissão do navegador, sem áudio, e libera as tracks ao sair.
- A galeria exporta um resumo `.txt`; não há vídeo de uma partida real para baixar no web.
- Redução de movimento desativa efeitos contínuos e celebrações não essenciais.
- O aplicativo Flutter usa modelos próprios. Os tipos TypeScript não são o contrato de rede nativo.

## Desenvolvimento

Na raiz, execute `npm ci`, `npm run dev -- --host 127.0.0.1`, `npm run lint` e `npm run build`. O lint é a checagem TypeScript. Nenhuma chave de API é necessária.

Veja [componentes](components/README.md), [tipos](types/README.md), [utilitários](utils/README.md) e [design system](../DESIGN.md).
