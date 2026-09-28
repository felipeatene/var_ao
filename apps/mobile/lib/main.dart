import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'core/invitation.dart';
import 'session/match_session.dart';
import 'replay_screen.dart';

const ink = Color(0xff17212b),
    paper = Color(0xfff7f7f2),
    blue = Color(0xff2456d8);
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const OutroAngulo());
}

class OutroAngulo extends StatelessWidget {
  const OutroAngulo({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Outro Ângulo',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: paper,
      colorScheme: ColorScheme.fromSeed(
        seedColor: blue,
        primary: blue,
        surface: paper,
        onSurface: ink,
        error: const Color(0xffb42318),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: paper,
        foregroundColor: ink,
        scrolledUnderElevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 40,
          height: 1.08,
          fontWeight: FontWeight.w700,
          letterSpacing: -1.3,
        ),
        headlineMedium: TextStyle(fontSize: 30, fontWeight: FontWeight.w700),
        bodyLarge: TextStyle(fontSize: 17, height: 1.5),
      ),
    ),
    home: const HomeScreen(),
  );
}

Route<T> route<T>(Widget child) => Platform.isIOS
    ? CupertinoPageRoute<T>(builder: (_) => child)
    : MaterialPageRoute<T>(builder: (_) => child);

class Brand extends StatelessWidget {
  const Brand({super.key});
  @override
  Widget build(BuildContext context) => const Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(Icons.crop_free, color: blue, size: 30),
      SizedBox(width: 10),
      Flexible(
        child: Text(
          'Outro Ângulo',
          style: TextStyle(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            letterSpacing: -.6,
          ),
        ),
      ),
    ],
  );
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool beach = false, busy = false;
  String? error;
  Future<void> _open([Invitation? invitation]) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final session = await MatchSession.create(join: invitation);
      if (!mounted) {
        await session.close();
        return;
      }
      await Navigator.of(context)
          .push(route(SessionScreen(session: session, beach: beach)));
      await session.close();
      session.dispose();
    } catch (e) {
      if (mounted) setState(() => error = friendlyError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _join() async {
    final invitation = await Navigator.of(context)
        .push<Invitation>(route(const JoinScreen()));
    if (invitation != null) await _open(invitation);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Brand()),
    body: SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            children: [
              Text(
                'Todo lance\nmerece outro\nângulo.',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              Image.asset(
                'assets/court.png',
                height: 220,
                fit: BoxFit.contain,
                semanticLabel: 'Ilustração de uma quadra de vôlei',
              ),
              const Text(
                'Reveja o jogo com dois celulares.',
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              const Text(
                'Uma partida. Dois pontos de vista.',
                style: TextStyle(color: Color(0xff56616d), fontSize: 16),
              ),
              const SizedBox(height: 24),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: false, label: Text('Quadra')),
                  ButtonSegment(value: true, label: Text('Praia')),
                ],
                selected: {beach},
                onSelectionChanged: busy
                    ? null
                    : (v) => setState(() => beach = v.first),
                style: const ButtonStyle(
                  minimumSize: WidgetStatePropertyAll(Size(0, 48)),
                ),
              ),
              const SizedBox(height: 24),
              if (error != null) ErrorNotice(error!),
              FilledButton(
                onPressed: busy ? null : () => _open(),
                child: Text(busy ? 'Preparando câmera…' : 'Criar partida'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: busy ? null : _join,
                child: const Text('Entrar como câmera'),
              ),
              const SizedBox(height: 20),
              const Text(
                'Na mesma rede. Sem precisar de internet.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xff56616d)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Mantenha os dois aplicativos abertos durante a captura. O replay pausa a gravação.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xff56616d)),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

String friendlyError(Object e) {
  if (e is CameraException) {
    return 'Não foi possível usar a câmera. Confira a permissão nas configurações do celular e tente novamente. (${e.code})';
  }
  if (e is SocketException || e is TimeoutException) {
    return 'Não encontramos o outro celular. Confira o Wi-Fi, o convite e a permissão de rede local.';
  }
  if (e is FileSystemException) {
    return 'Não foi possível armazenar o vídeo. Libere espaço no celular e inicie outra partida.';
  }
  return '$e'
      .replaceFirst('Bad state: ', '')
      .replaceFirst('FormatException: ', '');
}

class ErrorNotice extends StatelessWidget {
  const ErrorNotice(this.message, {super.key});
  final String message;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Semantics(
      liveRegion: true,
      child: Text(
        message,
        style: TextStyle(
          color: Theme.of(context).colorScheme.error,
          height: 1.5,
        ),
      ),
    ),
  );
}

class JoinScreen extends StatefulWidget {
  const JoinScreen({super.key});
  @override
  State<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends State<JoinScreen> {
  final input = TextEditingController();
  String? error;
  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  void accept(String value) {
    try {
      final invitation = Invitation.parse(value);
      Navigator.pop(context, invitation);
    } catch (e) {
      setState(() => error = friendlyError(e));
    }
  }

  Future<void> scan() async {
    final value = await Navigator.of(context)
        .push<String>(route(const ScanScreen()));
    if (value != null && mounted) accept(value);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Entrar como câmera')),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Encontre sua partida.',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          const Text(
            'Conecte os dois celulares ao mesmo Wi-Fi ou hotspot. Leia o QR que aparece no celular do organizador.',
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: scan,
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Ler QR da partida'),
          ),
          const SizedBox(height: 32),
          const Text(
            'Ou cole o convite',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: input,
            minLines: 2,
            maxLines: 4,
            autocorrect: false,
            enableSuggestions: false,
            decoration: const InputDecoration(
              labelText: 'Link do convite',
              border: OutlineInputBorder(),
            ),
          ),
          if (error != null) ErrorNotice(error!),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => accept(input.text),
            child: const Text('Conectar à partida'),
          ),
        ],
      ),
    ),
  );
}

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});
  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final controller = MobileScannerController(formats: [BarcodeFormat.qrCode]);
  bool handled = false;
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Ler convite')),
    body: MobileScanner(
      controller: controller,
      onDetect: (capture) async {
        if (handled) return;
        final values = capture.barcodes.where(
          (b) => b.rawValue?.startsWith('outroangulo://') == true,
        );
        if (values.isEmpty) return;
        handled = true;
        final value = values.first.rawValue!;
        await controller.stop();
        if (context.mounted) Navigator.pop(context, value);
      },
    ),
  );
}

class SessionScreen extends StatefulWidget {
  const SessionScreen({required this.session, required this.beach, super.key});
  final MatchSession session;
  final bool beach;
  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen>
    with WidgetsBindingObserver {
  bool preview = false;
  MatchSession get session => widget.session;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden ||
        state == AppLifecycleState.detached) {
      unawaited(session.interrupt());
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: session,
    builder: (context, _) {
      if (session.phase == MatchPhase.review &&
          session.isHost &&
          session.localReplay != null &&
          session.remoteReplay != null) {
        return ReplayScreen(session: session);
      }
      final recording = session.phase == MatchPhase.recording;
      final waiting = session.phase == MatchPhase.pairing;
      final transferring = session.phase == MatchPhase.transferring;
      return Scaffold(
        appBar: AppBar(title: const Brand()),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Text(
                    waiting
                        ? 'Vamos conectar?'
                        : recording
                        ? 'Partida pronta.'
                        : transferring
                        ? 'Preparando replay…'
                        : session.phase == MatchPhase.closed
                        ? 'Partida encerrada.'
                        : 'Seu ponto de vista.',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.beach ? 'Vôlei de praia' : 'Vôlei de quadra',
                    style: const TextStyle(color: Color(0xff56616d)),
                  ),
                  if (session.error != null)
                    ErrorNotice(friendlyError(session.error!)),
                  if (waiting && session.isHost) ...[
                    const SizedBox(height: 24),
                    const Text(
                      'No segundo celular, toque em “Entrar como câmera” e leia este convite.',
                    ),
                    Center(
                      child: Semantics(
                        label: 'QR code para conectar o segundo celular',
                        child: QrImageView(
                          data: session.invitation!.encode(),
                          size: 224,
                          backgroundColor: Colors.white,
                        ),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(text: session.invitation!.encode()),
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Convite copiado.')),
                          );
                        }
                      },
                      icon: const Icon(Icons.copy),
                      label: const Text('Copiar convite'),
                    ),
                    if (session.addresses.length > 1)
                      DropdownButtonFormField<String>(
                        initialValue: session.invitation!.host,
                        decoration: const InputDecoration(
                          labelText: 'Endereço da rede Wi-Fi',
                        ),
                        items: session.addresses
                            .map(
                              (a) => DropdownMenuItem(value: a, child: Text(a)),
                            )
                            .toList(),
                        onChanged: (v) {
                          if (v != null) session.selectAddress(v);
                        },
                      ),
                  ] else ...[
                    const SizedBox(height: 24),
                    if (preview && session.backend.controller != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: AspectRatio(
                          aspectRatio:
                              session.backend.controller!.value.aspectRatio,
                          child: CameraPreview(session.backend.controller!),
                        ),
                      )
                    else
                      Image.asset(
                        'assets/court.png',
                        height: 220,
                        semanticLabel: 'Posicione os celulares em lados diferentes da quadra',
                      ),
                    TextButton.icon(
                      onPressed: () => setState(() => preview = !preview),
                      icon: Icon(
                        preview
                            ? Icons.map_outlined
                            : Icons.camera_alt_outlined,
                      ),
                      label: Text(
                        preview
                            ? 'Ver orientação da quadra'
                            : 'Conferir enquadramento',
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  CameraRow(
                    number: 1,
                    label: 'Este celular',
                    status: recording ? 'Capturando' : 'Captura pausada',
                  ),
                  CameraRow(
                    number: 2,
                    label: 'Outro celular',
                    status: session.peerReady
                        ? (recording ? 'Conectado' : 'Pronto')
                        : 'Aguardando conexão',
                  ),
                  const SizedBox(height: 20),
                  if (recording) ...[
                    Row(
                      children: [
                        const Icon(Icons.history),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${(minValue(session.availableMs, session.peerAvailableMs) / 1000).floor()} s na janela de revisão',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'A troca entre arquivos pode deixar pequenos intervalos. Eles serão identificados no replay.',
                      style: TextStyle(fontSize: 13, color: Color(0xff56616d)),
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (session.isHost &&
                      session.peerReady &&
                      !transferring &&
                      session.phase != MatchPhase.closed)
                    FilledButton(
                      onPressed: recording ? session.review : session.start,
                      child: Text(
                        recording ? 'Revisar lance' : 'Iniciar captura',
                      ),
                    ),
                  if (!session.isHost && !waiting)
                    Text(
                      transferring
                          ? 'Enviando os vídeos. Mantenha o app aberto.'
                          : session.phase == MatchPhase.review
                          ? 'O organizador está revisando. Aguarde a retomada.'
                          : 'O organizador controla o início e a revisão.',
                      textAlign: TextAlign.center,
                    ),
                  if (transferring)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: LinearProgressIndicator(),
                    ),
                  if (session.canRetry &&
                      session.phase == MatchPhase.interrupted)
                    OutlinedButton(
                      onPressed: session.retryTransfer,
                      child: const Text('Tentar transferência novamente'),
                    ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Encerrar partida'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

int minValue(int a, int b) => a < b ? a : b;

class CameraRow extends StatelessWidget {
  const CameraRow({
    required this.number,
    required this.label,
    required this.status,
    super.key,
  });
  final int number;
  final String label, status;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 16),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: Color(0xffdadedf))),
    ),
    child: Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: const Color(0xffe3eafa),
          foregroundColor: blue,
          child: Text('$number'),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                status,
                style: const TextStyle(color: Color(0xff56616d), fontSize: 14),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
