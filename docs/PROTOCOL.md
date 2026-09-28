# 📡 Protocolo de sessão local · v1

[← Documentação principal](../README.md) · [Aplicativo](../apps/mobile/README.md) · [Validação](VALIDATION.md)

Contrato implementado para dois aparelhos. Não depende de serviços externos durante a partida; não cria a rede Wi-Fi automaticamente.

Cada telefone inicia um servidor HTTP em porta efêmera na interface IPv4. O convite `outroangulo://join?v=1&host=…&port=…&token=…` contém o endereço privado e um segredo aleatório de 256 bits. Leitura de QR e colagem manual usam a mesma validação. Convites públicos, versões incompatíveis e credenciais malformadas são rejeitados.

Requisições exigem `Authorization: Bearer TOKEN`. `/control` aceita um único WebSocket por telefone. Não se registra o segredo em logs. A API atende apenas `/clock`, `/control` e segmentos explicitamente retidos para replay. O protocolo é autenticado, mas não criptografado; destina-se a redes locais de confiança.

## Interfaces

| Interface | Responsabilidade |
| :--- | :--- |
| `Invitation` | Endereço privado, porta, versão e credencial temporária |
| `Segment` / `ReplayWindow` | Metadados de arquivos, janela comum e lacunas |
| `RollingBuffer` / `RollingRecorder` | Retenção, preservação e rotação da captura |
| `LocalTransport` | Autenticação, controle e download local |
| `MatchSession` | Papéis, estados e coordenação dos dois aparelhos |

| Endpoint | Uso |
| :--- | :--- |
| `GET /clock` | Timestamp do organizador para estimativa temporal |
| `GET /control` | Upgrade para WebSocket autenticado |
| `GET /segment/ID` | Vídeo retido para replay, com suporte a intervalo |

## Mensagens

Envelope JSON `{v:1,type:…}` limitado a 64 KiB. `hello` informa a porta do servidor do participante e a incerteza estimada; o organizador usa o IP observado da conexão, não um endereço enviado no corpo. `ready`, `start`, `started`, `status`, `freeze`, `manifest`, `interrupt`, `close` governam o ciclo da partida. Comandos fora do estado ou papel esperado são ignorados.

O participante mede sete requisições a `/clock`. A amostra de menor RTT produz a estimativa de offset; metade do RTT é exibida como incerteza da rede. Cada aparelho ancora um Stopwatch em UTC para evitar saltos do relógio durante a sessão. Os timestamps do participante são convertidos para a escala do organizador antes da transferência. Isto não calibra latência de captura do hardware.

## Arquivos e replay

Captura silenciosa solicitada em 720p/30 fps via plugin camera. A rotação portátil em segmentos de cinco segundos finaliza e reinicia o gravador. Seu intervalo de parada é representado explicitamente no manifesto. Arquivos são mantidos até cruzarem o limite de 40 segundos; o segmento que cruza o início da janela é conservado inteiro.

`freeze` fixa um instante comum do organizador. Ambos param a captura e preservam os segmentos que intersectam `[instante - 40000, instante)`. O manifesto inclui identificador aleatório, início/fim normalizados, tamanho e SHA-256; nunca inclui caminhos locais. O replay limita o intervalo apresentado, mesmo quando um arquivo contém vídeo anterior ou posterior à janela.

O organizador baixa cada segmento em `/segment/ID`, usando `Range: bytes=N-` para retomar um `.part`. Tamanho e SHA-256 são conferidos antes de renomear para `.mp4`. Um manifesto aceita até 20 segmentos de até 100 MiB cada. IDs aceitam somente 24 dígitos hexadecimais. Downloads incompletos não aparecem como vídeo válido.

Os arquivos permanecem protegidos durante a revisão e tentativas de transferência. A retomada libera o replay, limpa as duas janelas e começa outra captura. Encerrar fecha sockets, câmera e servidores e remove o diretório temporário da sessão. Resíduos de uma interrupção do processo são removidos na próxima criação de sessão.

## Estados e falhas

`pairing → ready → recording → transferring → review → recording`. Falhas produzem `interrupted`; saída produz `closed`. A entrada em segundo plano pausa a captura. Desconexão, armazenamento, permissões e transferência interrompida são comunicados ao usuário; nenhum fallback simulado existe no aplicativo nativo.

## Futuro

Captura sem lacunas exige um backend nativo de segmentação contínua, com timestamps de apresentação do encoder. Calibração de sensores, conexão cifrada e reconexão sem recriar a sessão são evoluções separadas, não capacidades afirmadas nesta implementação.
