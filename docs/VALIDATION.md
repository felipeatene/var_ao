# 🧪 Validação do primeiro marco

[← Documentação principal](../README.md) · [Aplicativo](../apps/mobile/README.md)

Registro de **28/09/2026**. Os resultados abaixo distinguem compilação, testes automatizados e uso real. Este documento não declara homologação para arbitragem.

## Verificações executadas

| Verificação | Resultado observado |
| :--- | :--- |
| `npm run lint` | Checagem TypeScript aprovada na execução final |
| `npm run build` | Aprovado na verificação final com `npm ci` em cópia temporária fora do iCloud |
| `./scripts/mobile.sh analyze` | Aprovado, sem problemas reportados |
| `./scripts/mobile.sh test --no-pub` | Oito testes aprovados |
| `./scripts/mobile.sh build apk --debug --no-pub` | Aprovado; APK de depuração gerado |
| `./scripts/mobile.sh build ios --simulator --debug --no-pub` | Aprovado; `Runner.app` para simulador gerado |
| Web no navegador local | Início → partida → revisão → retomada percorridos; abertura/retomada também acionadas por teclado |
| Wrapper com `FLUTTER_BIN` sem `.tooling` | Aprovado em checkout temporário com executável de teste |
| Links locais, SVG da capa e JSON de tokens | Verificados |
| Console web durante revisão | Nenhum erro capturado na consulta realizada |
| Android ↔ iPhone físicos | **Pendente** |
| Sessão sem internet em rede física | **Pendente** |

A primeira repetição da checagem web terminou com código 137 durante os problemas de arquivos sob demanda. Não é registrada como aprovação. A verificação final copiou `src/`, `public/` e configurações web atuais para uma pasta temporária fora do iCloud, instalou o mesmo lockfile com `npm ci` e executou TypeScript e build com sucesso (1.669 módulos; bundle JavaScript de 290,31 kB, 90,66 kB gzip). A pasta Documents sofreu bloqueios de leitura associados a arquivos `dataless` do iCloud. O download dos arquivos permitiu continuar. Isso reforça a recomendação de manter ferramentas e builds fora de pastas sincronizadas.

## Cobertura dos oito testes Flutter

1. Retenção circular mantém o segmento que cruza a janela e preserva segmentos fixados até liberação.
2. Janela incompleta e pausas entre segmentos aparecem como lacunas.
3. Estimativa temporal escolhe a amostra de menor RTT e calcula a incerteza.
4. Convite rejeita endereço público, credencial ausente e versão incompatível.
5. Manifesto rejeita caminhos de arquivo e metadados inválidos.
6. Transporte real em loopback verifica autenticação, limite de participante, retomada de arquivo parcial e integridade SHA-256.
7. Backend de captura falso verifica congelamento concorrente, preservação e início de nova janela.
8. Widget inicial permanece utilizável em tela estreita com texto ampliado.

O teste de transporte usa arquivos locais e sockets reais, mas não envolve câmera física ou Wi-Fi entre celulares. O teste de retomada parte de arquivo parcial; não substitui teste de queda de rede no meio de um vídeo real.

## Evidências visuais do web

| Captura real | Contexto |
| :--- | :--- |
| [Início](screenshots/web-home.png) | Viewport estreito do navegador local |
| [Início mobile](screenshots/web-mobile.png) | Layout responsivo em tela de celular |
| [Partida](screenshots/web-match.png) | Mapa e ação de revisão |
| [Replay](screenshots/web-replay.png) | Player escuro com vídeo demonstrativo |

As imagens em `docs/design/` são propostas conceituais aprovadas, não capturas. Não existem capturas nativas verificadas nesta entrega. As capturas publicadas são de viewport; o recurso full-page do navegador apresentou resultados inválidos e não foi usado como evidência.

A revisão independente concluiu **ship para revisão por PR** no escopo do web móvel capturado, sem bloqueio visual material nessas imagens. Ela não comprova desktop, Flutter, conteúdo abaixo da dobra nem todos os estados de interação. A pendência de documentação encontrada foi resolvida com este registro.

O detector visual do CSS apontou diferenças de cores, raios e tipografia em relação ao subconjunto documentado de tokens, além de um aviso sobre borda lateral no marcador de câmera. São avisos de inspeção, não uma certificação de qualidade ou acessibilidade.

## Roteiro obrigatório em aparelhos reais

Registre modelo, versão do sistema, versão do app, rede, organizador e resultado de cada cenário. Execute a matriz **Android organizador / iPhone câmera** e depois **iPhone organizador / Android câmera**.

| Cenário | Critério de aceite |
| :--- | :--- |
| Pareamento QR e manual | Dois aparelhos prontos; convite inválido ou sessão encerrada recusados |
| Operação sem internet | Criar, capturar, transferir e rever usando apenas a rede local |
| Buffer abaixo e acima de 40 s | Duração disponível coerente; início incompleto e lacunas identificados |
| Mesmo evento nos dois ângulos | Filmar um evento visível comum; comparar posição temporal e medir ajuste necessário |
| Captura segmentada | Conferir duração e continuidade dos arquivos; registrar cada pausa perceptível |
| Reprodução | Alternar ângulo, velocidade e zoom mantendo posição temporal coerente |
| Retomar partida | Reiniciar janela vazia e informar novo preenchimento |
| Rede interrompida | Erro compreensível; nenhum arquivo parcial reproduzido como completo; verificar retomada possível ou orientação de nova sessão |
| Permissões negadas | Explicar câmera/rede necessárias e caminho de recuperação |
| Segundo plano e tela bloqueada | Interromper captura de forma explícita; verificar retorno sem prometer captura em background |
| Armazenamento insuficiente | Interrupção visível, sem vídeo inválido ou exclusão de dados fora do cache do app |
| Encerrar sessão | Liberar câmera, sockets e arquivos temporários da sessão |
| Sessão prolongada | Registrar aquecimento, espaço utilizado, bateria e estabilidade |

## Acessibilidade pendente

Verificar VoiceOver e TalkBack, ordem de leitura, nomes dos controles, foco de diálogos, contraste em todos os estados, texto ampliado, orientação e alvos de toque de 48 unidades lógicas. O web inclui redução de movimento e foco visível; o teste de widget cobre parte do texto ampliado. Isso não equivale a uma auditoria completa.

## Limitações conhecidas

- Segmentação portátil por parada/início pode perder instantes entre arquivos. Os tempos medidos são da aplicação, não timestamps calibrados do sensor.
- 720p/30 fps é configuração solicitada; conferir formato efetivo nos aparelhos.
- A incerteza de rede não representa precisão total do alinhamento entre câmeras.
- Não há reconexão transparente garantida, gravação em segundo plano nem antecipação validada de disco cheio.
- HTTP/WebSocket local usa credencial temporária, sem criptografia de transporte.
- Ícones de lançamento nativos ainda derivam do scaffold Flutter; distribuição em lojas fica fora deste marco.
- Builds de depuração não são artefatos de produção. O build iOS realizado é para simulador; não comprova assinatura ou instalação em iPhone real.

## Resultado para revisão

O código e a documentação podem ser revisados via pull request. A validação física e a revisão nativa de acessibilidade continuam abertas e não devem ser marcadas como concluídas no merge ou na descrição do produto.
