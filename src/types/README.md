# 🏷️ Tipos do demonstrador web

[← Frontend](../README.md)

Os tipos em `index.ts` descrevem estado e apresentação do React. Não são evidência de capacidades do hardware nem o protocolo entre celulares.

| Tipo | Uso |
| :--- | :--- |
| `SportType` | Modalidades `court_volleyball` e `beach_volleyball` |
| `CameraPositionId` / `CameraPositionConfig` | Posições sugeridas, nomes e orientação do mapa |
| `CameraDevice` | Identificação, posição percentual, rotação, estado e dados demonstrativos da câmera; pode referenciar uma track de webcam |
| `SubscriptionTier` | Seleção demonstrativa entre `free` e `pro` |
| `SavedHighlight` | Metadados de lances: título, miniatura, duração, tags e apresentação |
| `VarVerdict` / `VarVerdictDetail` | Opções de veredito e seus rótulos de interface |

## Limites dos dados

Valores como bateria, FPS, resolução, tamanho de arquivo e segundos de buffer podem ser simulados. Uma entrada `SavedHighlight` não representa um arquivo de vídeo real. Alterar o plano demonstrativo não cria uma assinatura.

Os modelos de segmentos, convites, relógios e estados de sessão reais estão em Dart no aplicativo mobile. Consulte o [protocolo local](../../docs/PROTOCOL.md) para integração.
