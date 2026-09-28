import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:crypto/crypto.dart';

import '../core/invitation.dart';
import '../core/replay.dart';

abstract class CaptureBackend {
  Future<void> initialize();
  Future<void> start();
  Future<String> stop();
  Future<void> dispose();
}

class CameraBackend implements CaptureBackend {
  CameraController? controller;
  @override
  Future<void> initialize() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) throw StateError('Nenhuma câmera disponível.');
    final camera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );
    controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: false,
      fps: 30,
    );
    await controller!.initialize();
  }

  @override
  Future<void> start() => controller!.startVideoRecording();
  @override
  Future<String> stop() async => (await controller!.stopVideoRecording()).path;
  @override
  Future<void> dispose() async {
    await controller?.dispose();
    controller = null;
  }
}

/// Portable MVP: camera plugins finalize files between segments. Those pauses are
/// deliberately represented as gaps; no seamless/frame-accurate claim is made.
class RollingRecorder {
  RollingRecorder({
    required this.backend,
    required this.directory,
    required this.nowMs,
    required this.onError,
    this.segmentDuration = const Duration(seconds: 5),
  });
  final CaptureBackend backend;
  final Directory directory;
  final int Function() nowMs;
  final void Function(Object) onError;
  final Duration segmentDuration;
  final RollingBuffer buffer = RollingBuffer();
  Timer? _timer;
  Future<void> _operation = Future.value();
  bool _wanted = false, _recording = false;
  int _startMs = 0;
  int? captureStartedMs;
  bool get isRecording => _wanted && _recording;
  Future<void> initialize() async {
    await directory.create(recursive: true);
    await backend.initialize();
  }

  Future<void> start() async {
    await pause();
    buffer.release();
    for (final s in buffer.clear()) {
      final f = File(s.path);
      if (await f.exists()) await f.delete();
    }
    _wanted = true;
    _operation = _begin();
    await _operation;
    captureStartedMs = _startMs;
  }

  Future<void> _begin() async {
    if (!_wanted) return;
    await backend.start();
    _recording = true;
    _startMs = nowMs();
    if (_wanted) {
      _timer = Timer(segmentDuration, () {
        _operation = _rotate().catchError((Object e) {
          _wanted = false;
          onError(e);
        });
      });
    }
  }

  Future<void> _rotate() async {
    await _finish();
    for (final s in buffer.prune(nowMs())) {
      final f = File(s.path);
      if (await f.exists()) await f.delete();
    }
    if (_wanted) await _begin();
  }

  Future<void> _finish() async {
    if (!_recording) return;
    final end = nowMs();
    final path = await backend.stop();
    _recording = false;
    final source = File(path);
    if (end <= _startMs || !await source.exists()) {
      if (await source.exists()) await source.delete();
      return;
    }
    final id = randomId();
    final file = await source.copy('${directory.path}/$id.mp4');
    await source.delete();
    final digest = await sha256.bind(file.openRead()).first;
    buffer.add(
      Segment(
        id: id,
        path: file.path,
        startMs: _startMs,
        endMs: end,
        bytes: await file.length(),
        sha256: digest.toString(),
      ),
    );
  }

  Future<void> pause() async {
    _wanted = false;
    _timer?.cancel();
    _timer = null;
    _operation = _operation.catchError((Object _) {}).then((_) => _finish());
    await _operation;
  }

  Future<ReplayWindow> freeze(int endMs) async {
    await pause();
    return buffer.freeze(endMs);
  }

  Future<void> dispose() async {
    try {
      await pause();
    } finally {
      await backend.dispose();
      if (await directory.exists()) await directory.delete(recursive: true);
    }
  }
}
