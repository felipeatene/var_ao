import 'dart:math';

/// File timestamps use the session's monotonic clock, expressed in milliseconds.
class Segment {
  const Segment({
    required this.id,
    required this.path,
    required this.startMs,
    required this.endMs,
    required this.bytes,
    required this.sha256,
  });
  final String id, path, sha256;
  final int startMs, endMs, bytes;
  int get durationMs => endMs - startMs;
  Segment withPath(String value) => Segment(
    id: id,
    path: value,
    startMs: startMs,
    endMs: endMs,
    bytes: bytes,
    sha256: sha256,
  );
  Map<String, Object> toJson({int offsetMs = 0}) => {
    'id': id,
    'startMs': startMs + offsetMs,
    'endMs': endMs + offsetMs,
    'bytes': bytes,
    'sha256': sha256,
  };
  factory Segment.fromJson(Map<String, dynamic> j) {
    final id = j['id'] as String;
    final hash = j['sha256'] as String;
    final start = j['startMs'] as int, end = j['endMs'] as int;
    final bytes = j['bytes'] as int;
    if (!RegExp(r'^[a-f0-9]{24}$').hasMatch(id) ||
        !RegExp(r'^[a-f0-9]{64}$').hasMatch(hash) ||
        end <= start ||
        end - start > 60000 ||
        bytes < 1 ||
        bytes > 100 * 1024 * 1024) {
      throw const FormatException('Segmento inválido');
    }
    return Segment(
      id: id,
      path: '',
      startMs: start,
      endMs: end,
      bytes: bytes,
      sha256: hash,
    );
  }
}

class TimeGap {
  const TimeGap(this.startMs, this.endMs);
  final int startMs, endMs;
  int get durationMs => endMs - startMs;
}

class ReplayWindow {
  ReplayWindow({
    required this.startMs,
    required this.endMs,
    required List<Segment> segments,
  }) : segments = List.unmodifiable(
         [...segments]..sort((a, b) => a.startMs.compareTo(b.startMs)),
       );
  final int startMs, endMs;
  final List<Segment> segments;
  List<TimeGap> get gaps {
    var cursor = startMs;
    final result = <TimeGap>[];
    for (final segment in segments) {
      if (segment.endMs <= startMs || segment.startMs >= endMs) continue;
      if (segment.startMs > cursor) {
        result.add(TimeGap(cursor, min(segment.startMs, endMs)));
      }
      cursor = max(cursor, segment.endMs);
    }
    if (cursor < endMs) result.add(TimeGap(cursor, endMs));
    return result;
  }

  int get availableMs => max(
    0,
    endMs - startMs - gaps.fold<int>(0, (sum, gap) => sum + gap.durationMs),
  );
  Segment? segmentAt(int timeMs) {
    for (final segment in segments) {
      if (timeMs >= segment.startMs && timeMs < segment.endMs) return segment;
    }
    return null;
  }
}

/// Retains the segment straddling the 40-second boundary, never a partial file.
/// Physical files removed by prune are returned for the caller to delete.
class RollingBuffer {
  RollingBuffer({this.retentionMs = 40000});
  final int retentionMs;
  final List<Segment> _segments = [];
  final Set<String> _pinned = {};
  List<Segment> get segments => List.unmodifiable(_segments);
  void add(Segment segment) {
    if (_segments.any((s) => s.id == segment.id)) {
      throw StateError('Segmento repetido');
    }
    _segments.add(segment);
    _segments.sort((a, b) => a.startMs.compareTo(b.startMs));
  }

  List<Segment> prune(int nowMs) {
    final removed = _segments
        .where((s) => s.endMs <= nowMs - retentionMs && !_pinned.contains(s.id))
        .toList();
    _segments.removeWhere((s) => removed.contains(s));
    return removed;
  }

  ReplayWindow freeze(int endMs) {
    final startMs = endMs - retentionMs;
    final selected = _segments
        .where((s) => s.endMs > startMs && s.startMs < endMs)
        .toList();
    _pinned.addAll(selected.map((s) => s.id));
    return ReplayWindow(startMs: startMs, endMs: endMs, segments: selected);
  }

  bool isPinned(String id) => _pinned.contains(id);
  void release() => _pinned.clear();
  List<Segment> clear() {
    if (_pinned.isNotEmpty) {
      throw StateError('Libere o replay antes de limpar o buffer');
    }
    final removed = [..._segments];
    _segments.clear();
    return removed;
  }
}

class ClockSample {
  const ClockSample({
    required this.sentMs,
    required this.receivedMs,
    required this.hostMs,
  });
  final int sentMs, receivedMs, hostMs;
  int get roundTripMs => receivedMs - sentMs;
  int get offsetMs => hostMs - ((sentMs + receivedMs) ~/ 2);
}

class ClockEstimate {
  const ClockEstimate(this.offsetMs, this.uncertaintyMs);
  final int offsetMs, uncertaintyMs;
  factory ClockEstimate.fromSamples(List<ClockSample> samples) {
    final valid = samples.where((s) => s.roundTripMs >= 0).toList()
      ..sort((a, b) => a.roundTripMs.compareTo(b.roundTripMs));
    if (valid.isEmpty) throw StateError('Sem amostras de sincronização');
    return ClockEstimate(
      valid.first.offsetMs,
      (valid.first.roundTripMs / 2).ceil(),
    );
  }
}
