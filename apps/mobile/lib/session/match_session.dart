import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../capture/rolling_recorder.dart';
import '../core/invitation.dart';
import '../core/replay.dart';
import 'local_transport.dart';

enum MatchPhase {
  pairing,
  ready,
  recording,
  transferring,
  review,
  interrupted,
  closed,
}

class MatchSession extends ChangeNotifier {
  MatchSession._({
    required this.isHost,
    required this.directory,
    required this.backend,
    required this.token,
  }) {
    _epoch = DateTime.now().millisecondsSinceEpoch;
    _watch.start();
    recorder = RollingRecorder(
      backend: backend,
      directory: Directory('${directory.path}/capture'),
      nowMs: nowMs,
      onError: fail,
    );
    transport = LocalTransport(
      token: token,
      nowMs: nowMs,
      segmentForId: (id) {
        if (!recorder.buffer.isPinned(id)) return null;
        for (final s in recorder.buffer.segments) {
          if (s.id == id) return s;
        }
        return null;
      },
    );
  }
  final bool isHost;
  final Directory directory;
  final CameraBackend backend;
  final String token;
  late final RollingRecorder recorder;
  late final LocalTransport transport;
  final Stopwatch _watch = Stopwatch();
  late int _epoch;
  int nowMs() => _epoch + _watch.elapsedMilliseconds;
  MatchPhase phase = MatchPhase.pairing;
  Invitation? invitation, _peer;
  List<String> addresses = [];
  String? error;
  ClockEstimate clock = const ClockEstimate(0, 0);
  int peerUncertaintyMs = 0;
  int peerAvailableMs = 0;
  ReplayWindow? localReplay, remoteReplay;
  List<Segment> _remoteManifest = [];
  String? _replayId;
  int _replayEnd = 0;
  bool peerReady = false, _closing = false, _busy = false;
  Timer? _ticker, _deadline;
  StreamSubscription<Map<String, dynamic>>? _messageSubscription;
  StreamSubscription<bool>? _connectionSubscription;
  Future<void> _messageQueue = Future.value();
  int get availableMs => recorder.captureStartedMs == null
      ? 0
      : max(0, min(40000, nowMs() - recorder.captureStartedMs!));

  static Future<MatchSession> create({Invitation? join}) async {
    final temp = await getTemporaryDirectory();
    final root = Directory('${temp.path}/outro_angulo');
    await root.create(recursive: true);
    // App owns these temporary sessions. Remove abandoned footage on startup.
    await for (final entity in root.list()) {
      await entity.delete(recursive: true);
    }
    final directory = Directory('${root.path}/${randomId()}');
    await directory.create();
    final session = MatchSession._(
      isHost: join == null,
      directory: directory,
      backend: CameraBackend(),
      token: join?.token ?? randomId(32),
    );
    try {
      await session._initialize(join);
      return session;
    } catch (_) {
      await session.close();
      rethrow;
    }
  }

  Future<void> _initialize(Invitation? join) async {
    await recorder.initialize();
    final interfaces = await NetworkInterface.list(
      type: InternetAddressType.IPv4,
    );
    addresses = interfaces
        .expand((i) => i.addresses)
        .where((a) {
          try {
            Invitation.parse(
              Invitation(host: a.address, port: 1, token: token).encode(),
            );
            return true;
          } catch (_) {
            return false;
          }
        })
        .map((a) => a.address)
        .toList();
    if (addresses.isEmpty) {
      throw StateError(
        'Conecte o celular a um Wi-Fi ou hotspot e tente novamente.',
      );
    }
    await transport.start();
    _messageSubscription = transport.messages.stream.listen((message) {
      _messageQueue = _messageQueue
          .then((_) => _onMessage(message))
          .catchError((Object e) => fail(e));
    });
    _connectionSubscription = transport.connections.stream.listen((connected) {
      if (!connected && !_closing) {
        peerReady = false;
        fail(
          StateError(
            'O outro celular desconectou. Encerre e conecte os aparelhos novamente.',
          ),
        );
      }
    });
    if (join == null) {
      invitation = Invitation(
        host: addresses.first,
        port: transport.port,
        token: token,
      );
    } else {
      _peer = join;
      clock = await transport.synchronize(join);
      await transport.connect(join);
      transport.send('hello', {
        'port': transport.port,
        'uncertaintyMs': clock.uncertaintyMs,
      });
    }
    await WakelockPlus.enable();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_closing) return;
      if (transport.connected && phase == MatchPhase.recording) {
        try {
          transport.send('status', {'availableMs': availableMs});
        } catch (e) {
          fail(e);
        }
      }
      notifyListeners();
    });
  }

  void selectAddress(String address) {
    if (!isHost || !addresses.contains(address) || transport.connected) return;
    invitation = Invitation(host: address, port: transport.port, token: token);
    notifyListeners();
  }

  Future<void> _onMessage(Map<String, dynamic> m) async {
    if (_closing) return;
    switch (m['type']) {
      case 'hello':
        if (!isHost || phase != MatchPhase.pairing) return;
        final port = m['port'] as int;
        if (port < 1 || port > 65535) {
          throw const FormatException('Porta inválida');
        }
        _peer = Invitation(
          host: transport.remoteAddress!,
          port: port,
          token: token,
        );
        peerUncertaintyMs = (m['uncertaintyMs'] as int).clamp(0, 60000);
        peerReady = true;
        phase = MatchPhase.ready;
        transport.send('ready');
      case 'ready':
        if (isHost || phase != MatchPhase.pairing) return;
        peerReady = true;
        phase = MatchPhase.ready;
      case 'start':
        if (isHost ||
            (phase != MatchPhase.ready &&
                phase != MatchPhase.review &&
                phase != MatchPhase.interrupted)) {
          return;
        }
        await _startLocal();
        transport.send('started');
      case 'started':
        if (!isHost || phase != MatchPhase.recording) return;
        peerReady = true;
      case 'status':
        peerAvailableMs = (m['availableMs'] as int).clamp(0, 40000);
      case 'freeze':
        if (isHost || phase != MatchPhase.recording) return;
        _replayId = m['replayId'] as String;
        _replayEnd = m['endMs'] as int;
        phase = MatchPhase.transferring;
        notifyListeners();
        final replay = await recorder.freeze(_replayEnd - clock.offsetMs);
        transport.send('manifest', {
          'replayId': _replayId,
          'segments': replay.segments
              .map((s) => s.toJson(offsetMs: clock.offsetMs))
              .toList(),
        });
        phase = MatchPhase.review;
      case 'manifest':
        if (!isHost ||
            phase != MatchPhase.transferring ||
            m['replayId'] != _replayId) {
          return;
        }
        _deadline?.cancel();
        final entries = m['segments'] as List;
        if (entries.length > 20) {
          throw const FormatException('Manifesto muito grande');
        }
        _remoteManifest = entries
            .map((e) => Segment.fromJson(e as Map<String, dynamic>))
            .toList();
        if (_remoteManifest.map((s) => s.id).toSet().length !=
                _remoteManifest.length ||
            _remoteManifest.any(
              (s) => s.endMs <= _replayEnd - 40000 || s.startMs >= _replayEnd,
            )) {
          throw const FormatException('Manifesto fora da janela de replay');
        }
        await _downloadReplay();
      case 'interrupt':
        await recorder.pause();
        phase = MatchPhase.interrupted;
        error = 'Captura interrompida no outro celular. Mantenha os aplicativos abertos.';
      case 'close':
        await close();
      default:
        return;
    }
    if (!_closing) notifyListeners();
  }

  Future<void> _startLocal() async {
    _deadline?.cancel();
    _remoteManifest = [];
    localReplay = null;
    remoteReplay = null;
    error = null;
    peerAvailableMs = 0;
    final incoming = Directory('${directory.path}/incoming');
    if (await incoming.exists()) await incoming.delete(recursive: true);
    await recorder.start();
    phase = MatchPhase.recording;
  }

  Future<void> start() async {
    if (!isHost || _busy || !transport.connected) return;
    _busy = true;
    try {
      transport.send('start');
      await _startLocal();
      notifyListeners();
    } catch (e) {
      fail(e);
    } finally {
      _busy = false;
    }
  }

  Future<void> review() async {
    if (!isHost ||
        _busy ||
        phase != MatchPhase.recording ||
        !transport.connected) {
      return;
    }
    _busy = true;
    try {
      _replayId = randomId();
      _replayEnd = nowMs();
      phase = MatchPhase.transferring;
      notifyListeners();
      transport.send('freeze', {'replayId': _replayId, 'endMs': _replayEnd});
      localReplay = await recorder.freeze(_replayEnd);
      _deadline = Timer(const Duration(seconds: 25), () {
        if (phase == MatchPhase.transferring && _remoteManifest.isEmpty) {
          fail(
            StateError(
              'A outra câmera não respondeu. Confira a conexão e inicie uma nova captura.',
            ),
          );
        }
      });
    } catch (e) {
      fail(e);
    } finally {
      _busy = false;
    }
  }

  Future<void> _downloadReplay() async {
    try {
      final segments = <Segment>[];
      for (final segment in _remoteManifest) {
        segments.add(
          await transport.download(
            _peer!,
            segment,
            Directory('${directory.path}/incoming'),
          ),
        );
      }
      // Local finalization may still be underway when the remote responds.
      await recorder.pause();
      localReplay ??= recorder.buffer.freeze(_replayEnd);
      remoteReplay = ReplayWindow(
        startMs: _replayEnd - 40000,
        endMs: _replayEnd,
        segments: segments,
      );
      phase = MatchPhase.review;
      error = null;
    } catch (e) {
      phase = MatchPhase.interrupted;
      error = '$e';
    }
    if (!_closing) notifyListeners();
  }

  Future<void> retryTransfer() async {
    if (!isHost || _remoteManifest.isEmpty || _busy) return;
    _busy = true;
    phase = MatchPhase.transferring;
    error = null;
    notifyListeners();
    try {
      await _downloadReplay();
    } finally {
      _busy = false;
    }
  }

  bool get canRetry =>
      isHost && _remoteManifest.isNotEmpty && transport.connected;
  Future<void> interrupt() async {
    if (_closing || phase != MatchPhase.recording) return;
    if (transport.connected) transport.send('interrupt');
    await recorder.pause();
    phase = MatchPhase.interrupted;
    error = 'A captura parou ao sair do aplicativo. Retome com os dois celulares abertos.';
    notifyListeners();
  }

  void fail(Object cause) {
    if (_closing) return;
    if (phase == MatchPhase.recording && transport.connected) {
      try {
        transport.send('interrupt');
      } catch (_) {}
    }
    phase = MatchPhase.interrupted;
    error = '$cause';
    unawaited(recorder.pause().catchError((Object _) {}));
    notifyListeners();
  }

  Future<void> close() async {
    if (_closing) return;
    _closing = true;
    _ticker?.cancel();
    _deadline?.cancel();
    try {
      if (transport.connected) transport.send('close');
    } catch (_) {}
    await _messageSubscription?.cancel();
    await _connectionSubscription?.cancel();
    await transport.dispose();
    try {
      await recorder.dispose();
    } finally {
      if (await directory.exists()) await directory.delete(recursive: true);
      await WakelockPlus.disable();
      phase = MatchPhase.closed;
      notifyListeners();
    }
  }
}
