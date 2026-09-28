# 📱 Outro Ângulo · Flutter

[← Documentação principal](../../README.md) · [Protocolo](../../docs/PROTOCOL.md) · [Validação](../../docs/VALIDATION.md)

Primeiro marco nativo para dois celulares na mesma rede local: captura sem áudio, pausa coordenada, transferência dos trechos recentes e revisão com dois ângulos. A operação Android ↔ iPhone ainda precisa de validação física.

## Ambiente reproduzível

- Flutter **3.47.5**, Dart **3.13.4**; dependências resolvidas em `pubspec.lock`.
- Android: Java 17, Android SDK, licenças aceitas e aparelho com depuração USB para execução. Use `doctor -v` para identificar componentes ausentes.
- iOS: macOS, Xcode com ferramentas de linha de comando, runtime de simulador e CocoaPods. Dispositivo real exige equipe de desenvolvimento e assinatura.

Na raiz do repositório:

```sh
# Opcional quando Flutter já está no PATH
export FLUTTER_BIN=/caminho/para/flutter/bin/flutter
./scripts/mobile.sh doctor -v
./scripts/mobile.sh pub get
./scripts/mobile.sh analyze
./scripts/mobile.sh test
./scripts/mobile.sh devices
./scripts/mobile.sh run -d ID_DO_APARELHO
```

O wrapper procura `FLUTTER_BIN`, depois `../.tooling/flutter/bin/flutter`, depois Flutter no `PATH`. A pasta `.tooling` é opcional e não é versionada. Java e Android SDK locais só são usados quando presentes. O comando `analyze` usa um alias temporário para contornar um problema observado de caminhos com acento no cliente LSP.

## Build e instalação

```sh
./scripts/mobile.sh build apk --debug
./scripts/mobile.sh build ios --simulator --debug
./scripts/mobile.sh build ios --debug --no-codesign
```

O APK normalmente fica em `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`; o build de simulador em `apps/mobile/build/ios/iphonesimulator/Runner.app`. Ambos são artefatos locais, excluídos do Git.

Para iPhone real, abra `apps/mobile/ios/Runner.xcworkspace` no Xcode, configure a equipe em Signing & Capabilities e execute no aparelho. O build sem assinatura não é instalável diretamente. Não inclua certificados ou perfis no repositório.

## Organização

| Área | Responsabilidade |
| :--- | :--- |
| `lib/core/` | Convite, segmentos, janela de replay, retenção e estimativa de relógio |
| `lib/capture/` | Backend da câmera e gravação em segmentos |
| `lib/session/` | HTTP/WebSocket, transferência e coordenação de estado |
| `lib/main.dart` | Tema, entrada, pareamento, partida e ciclo de vida |
| `lib/replay_screen.dart` | Player dos arquivos locais, ângulos, velocidade, zoom e ajuste temporal |
| `test/` | Retenção, relógios, convite, transporte, gravação serializada e layout |

## Operação e permissões

Conecte manualmente ambos os aparelhos ao mesmo Wi-Fi ou hotspot. Crie a partida no organizador; o segundo aparelho lê o QR ou cola o convite. Autorize câmera e, no iOS, rede local. Não há gravação de áudio. Mantenha o app em primeiro plano nos dois aparelhos.

A configuração solicitada é 720p/30 fps. O backend grava arquivos de aproximadamente cinco segundos; parar/iniciar gravação pode produzir lacunas. O replay indica ausência de vídeo. A janela nominal de 40 s pode estar incompleta logo após iniciar ou retomar.

A sincronização estima diferença de relógios e latência de rede. O ajuste manual compensa diferenças percebidas, mas não oferece garantia de alinhamento por quadro. Segmentos solicitados são preservados durante a revisão; ao retomar, inicia-se uma nova janela.

## Interrupções e recuperação

- **Permissão negada:** permita câmera/rede nas configurações do sistema e tente iniciar a sessão novamente.
- **Rede sem comunicação entre clientes:** use uma rede local compatível ou hotspot manual; redes de convidados podem isolar aparelhos.
- **Conexão perdida ou segundo plano:** a captura é interrompida. Uma nova sessão pode ser necessária; reconexão transparente não está garantida.
- **Transferência incompleta:** a implementação preserva arquivos parciais para retomada enquanto a sessão e os segmentos existem.
- **Armazenamento:** falhas de escrita/captura são tratadas como interrupção; medição antecipada de espaço e testes de disco cheio continuam pendentes.
- **iCloud no macOS:** mantenha o checkout baixado. SDKs e builds devem preferencialmente ficar fora de pastas sincronizadas; arquivos sob demanda podem bloquear ferramentas e atributos Finder podem interferir na assinatura.

Galeria nativa, assinatura, gravação em segundo plano e distribuição em lojas não fazem parte deste marco. Consulte a [matriz de validação](../../docs/VALIDATION.md) antes de considerar a implementação pronta para uso em partidas.
