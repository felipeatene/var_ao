import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:outro_angulo/capture/rolling_recorder.dart';

class FakeCamera implements CaptureBackend {
  FakeCamera(this.directory);
  final Directory directory;
  bool active = false;
  int stops = 0, starts = 0;
  @override
  Future<void> initialize() async {}
  @override
  Future<void> start() async {
    if (active) throw StateError('Already recording');
    active = true;
    starts++;
  }

  @override
  Future<String> stop() async {
    if (!active) throw StateError('Already stopped');
    active = false;
    stops++;
    final file = File('${directory.path}/source-$stops.mp4');
    await file.writeAsBytes(List.filled(1024, stops));
    return file.path;
  }

  @override
  Future<void> dispose() async {}
}

void main() {
  test(
    'concurrent freeze finalizes once, pins files and restarts a fresh buffer',
    () async {
      final root = await Directory.systemTemp.createTemp(
        'outro-recorder-test-',
      );
      final camera = FakeCamera(root);
      var now = 1000;
      final recorder = RollingRecorder(
        backend: camera,
        directory: Directory('${root.path}/clips'),
        nowMs: () => now,
        onError: (e) => fail('$e'),
        segmentDuration: const Duration(hours: 1),
      );
      try {
        await recorder.initialize();
        await recorder.start();
        now = 6000;
        final windows = await Future.wait([
          recorder.freeze(now),
          recorder.freeze(now),
        ]);
        expect(camera.stops, 1);
        expect(camera.active, isFalse);
        expect(windows.first.segments.length, 1);
        final clip = File(windows.first.segments.first.path);
        expect(await clip.exists(), isTrue);
        expect(recorder.buffer.prune(1000000), isEmpty);
        now = 9000;
        await recorder.start();
        expect(await clip.exists(), isFalse);
        expect(recorder.buffer.segments, isEmpty);
        expect(camera.starts, 2);
        expect(recorder.captureStartedMs, 9000);
        now = 12000;
      } finally {
        await recorder.dispose();
        await root.delete(recursive: true);
      }
    },
  );
}
