import 'package:flutter_test/flutter_test.dart';
import 'package:outro_angulo/core/replay.dart';
import 'package:outro_angulo/core/invitation.dart';

Segment segment(String id, int start, int end) => Segment(
  id: id,
  path: '/$id.mp4',
  startMs: start,
  endMs: end,
  bytes: 10,
  sha256: 'hash',
);
void main() {
  test(
    'rolling window retains straddling segment and pins replay until release',
    () {
      final buffer = RollingBuffer();
      for (var i = 0; i < 12; i++) {
        buffer.add(segment('$i', i * 5000, (i + 1) * 5000));
      }
      expect(buffer.prune(57000).map((s) => s.id), ['0', '1', '2']);
      final replay = buffer.freeze(57000);
      expect(replay.startMs, 17000);
      expect(replay.segments.first.id, '3');
      expect(buffer.prune(200000), isEmpty);
      expect(() => buffer.clear(), throwsStateError);
      buffer.release();
      expect(buffer.prune(200000).length, 9);
    },
  );
  test(
    'gaps include incomplete buffer and rotation pauses without hiding them',
    () {
      final replay = ReplayWindow(
        startMs: 0,
        endMs: 40000,
        segments: [segment('a', 10000, 15000), segment('b', 15180, 22000)],
      );
      expect(replay.gaps.map((g) => g.durationMs), [10000, 180, 18000]);
      expect(replay.availableMs, 11820);
      expect(replay.segmentAt(15050), isNull);
      expect(replay.segmentAt(15180)?.id, 'b');
    },
  );
  test('clock estimate uses lowest RTT and reports uncertainty', () {
    final clock = ClockEstimate.fromSamples([
      const ClockSample(sentMs: 1000, receivedMs: 1100, hostMs: 1080),
      const ClockSample(sentMs: 2000, receivedMs: 2020, hostMs: 2040),
    ]);
    expect(clock.offsetMs, 30);
    expect(clock.uncertaintyMs, 10);
  });
  test('invitation rejects public hosts, missing credentials and incompatible versions', () {
    final token = randomId(32);
    final valid = Invitation(
      host: '192.168.1.10',
      port: 12345,
      token: token,
    ).encode();
    expect(Invitation.parse(valid).port, 12345);
    expect(
      () => Invitation.parse(valid.replaceAll('192.168.1.10', '8.8.8.8')),
      throwsFormatException,
    );
    expect(
      () => Invitation.parse(valid.replaceAll('v=1', 'v=2')),
      throwsFormatException,
    );
    expect(
      () => Invitation.parse('https://example.com'),
      throwsFormatException,
    );
    expect(() => decodeMessage('{"type":"start"}'), throwsFormatException);
  });
  test('manifest never accepts file paths or invalid metadata as a segment identifier', () {
    expect(
      () => Segment.fromJson({
        'id': '../../secret',
        'sha256': 'a' * 64,
        'bytes': 10,
        'startMs': 0,
        'endMs': 5000,
      }),
      throwsFormatException,
    );
  });
}
