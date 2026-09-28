import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import 'core/replay.dart';
import 'session/match_session.dart';

class ReplayScreen extends StatefulWidget {
  const ReplayScreen({required this.session, super.key});
  final MatchSession session;
  @override
  State<ReplayScreen> createState() => _ReplayScreenState();
}

class _ReplayScreenState extends State<ReplayScreen> {
  int camera = 0, alignmentMs = 0, _revision = 0;
  double timeMs = 0, speed = .5;
  bool playing = false, loading = false, _advancing = false;
  String? error;
  Segment? segment;
  VideoPlayerController? player;
  final transform = TransformationController();
  ReplayWindow get window =>
      camera == 0 ? widget.session.localReplay! : widget.session.remoteReplay!;
  int get offset => camera == 1 ? alignmentMs : 0;
  int get start => widget.session.localReplay!.startMs;
  @override
  void initState() {
    super.initState();
    final segments = widget.session.localReplay!.segments;
    timeMs = segments.isEmpty
        ? 0
        : max(0, segments.first.startMs - start).toDouble();
    unawaited(loadAt(timeMs));
  }

  @override
  void dispose() {
    _revision++;
    player?.removeListener(onVideo);
    player?.dispose();
    transform.dispose();
    super.dispose();
  }

  Future<void> loadAt(double position, {bool resume = false}) async {
    final revision = ++_revision;
    final selected = window.segmentAt(start + position.round() + offset);
    setState(() {
      loading = true;
      error = null;
      timeMs = position.clamp(0, 40000);
      playing = false;
    });
    final previous = player;
    player = null;
    previous?.removeListener(onVideo);
    await previous?.dispose();
    if (!mounted || revision != _revision) return;
    segment = selected;
    if (selected == null) {
      setState(() => loading = false);
      return;
    }
    final next = VideoPlayerController.file(File(selected.path));
    try {
      await next.initialize();
      if (!mounted || revision != _revision) {
        await next.dispose();
        return;
      }
      final relative = (start + timeMs.round() + offset - selected.startMs)
          .clamp(0, next.value.duration.inMilliseconds);
      await next.seekTo(Duration(milliseconds: relative));
      await next.setPlaybackSpeed(speed);
      if (!mounted || revision != _revision) {
        await next.dispose();
        return;
      }
      player = next;
      player!.addListener(onVideo);
      setState(() {
        loading = false;
        playing = resume;
      });
      if (resume) await next.play();
    } catch (_) {
      await next.dispose();
      if (mounted && revision == _revision) {
        setState(() {
          player = null;
          loading = false;
          playing = false;
          error = 'Não foi possível reproduzir este trecho.';
        });
      }
    }
  }

  void onVideo() {
    final value = player?.value;
    if (!mounted || value == null || segment == null || loading) return;
    if (value.hasError) {
      setState(() {
        playing = false;
        error = 'O vídeo não pôde ser reproduzido.';
      });
      return;
    }
    if (playing) {
      final position =
          segment!.startMs - start - offset + value.position.inMilliseconds;
      setState(() => timeMs = position.clamp(0, 40000).toDouble());
      if (position >= 40000) {
        player?.pause();
        setState(() => playing = false);
        return;
      }
      if (!_advancing &&
          value.position >= value.duration - const Duration(milliseconds: 60)) {
        _advancing = true;
        final nextTime = (segment!.endMs - start - offset)
            .clamp(0, 40000)
            .toDouble();
        unawaited(
          loadAt(nextTime, resume: true).whenComplete(() => _advancing = false),
        );
      }
    }
  }

  Future<void> toggle() async {
    if (player == null || loading) return;
    if (playing) {
      await player!.pause();
    } else {
      await player!.play();
    }
    if (mounted) setState(() => playing = !playing);
  }

  void nextAvailable() {
    final absolute = start + timeMs.round() + offset;
    final later = window.segments.where((s) => s.startMs > absolute).toList();
    if (later.isNotEmpty) {
      unawaited(
        loadAt(
          (later.first.startMs - start - offset).clamp(0, 40000).toDouble(),
        ),
      );
    }
  }

  Future<void> align() async {
    await player?.pause();
    if (!mounted) return;
    setState(() => playing = false);
    var value = alignmentMs.toDouble();
    final result = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, update) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Ajustar sincronia',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Alinhe um evento visível nos dois ângulos. O ajuste se aplica à câmera 2.',
                ),
                Text(
                  '${value.round()} ms',
                  style: const TextStyle(fontSize: 24),
                ),
                Slider(
                  min: -2000,
                  max: 2000,
                  divisions: 400,
                  value: value,
                  label: '${value.round()} ms',
                  onChanged: (v) => update(() => value = v),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, value.round()),
                  child: const Text('Aplicar ajuste'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (result != null && mounted) {
      alignmentMs = result;
      await loadAt(timeMs);
    }
  }

  @override
  Widget build(BuildContext context) {
    final missingMs = window.gaps.fold<int>(
      0,
      (sum, gap) => sum + gap.durationMs,
    );
    return Theme(
      data: Theme.of(context).copyWith(
        scaffoldBackgroundColor: const Color(0xff15191f),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xff91b5ff),
          surface: Color(0xff15191f),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xff15191f),
          foregroundColor: Colors.white,
        ),
      ),
      child: Scaffold(
        appBar: AppBar(title: const Text('Revisar lance')),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: AspectRatio(
                      aspectRatio: player?.value.aspectRatio ?? 4 / 3,
                      child: ColoredBox(
                        color: Colors.black,
                        child: loading
                            ? const Center(child: CircularProgressIndicator())
                            : player != null
                            ? InteractiveViewer(
                                transformationController: transform,
                                minScale: 1,
                                maxScale: 4,
                                child: VideoPlayer(player!),
                              )
                            : Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Text(
                                        error ?? 'Sem imagens neste instante.',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: nextAvailable,
                                      child: const Text(
                                        'Próximo trecho disponível',
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 0, label: Text('Câmera 1')),
                      ButtonSegment(value: 1, label: Text('Câmera 2')),
                    ],
                    selected: {camera},
                    onSelectionChanged: (v) {
                      camera = v.first;
                      transform.value = Matrix4.identity();
                      unawaited(loadAt(timeMs));
                    },
                    style: const ButtonStyle(
                      minimumSize: WidgetStatePropertyAll(Size(0, 48)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '${(timeMs / 1000).toStringAsFixed(1)} / 40 s',
                    style: const TextStyle(
                      color: Colors.white,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  Slider(
                    value: timeMs.clamp(0, 40000),
                    min: 0,
                    max: 40000,
                    label: '${(timeMs / 1000).toStringAsFixed(1)} s',
                    onChanged: (value) {
                      player?.pause();
                      setState(() {
                        playing = false;
                        timeMs = value;
                      });
                    },
                    onChangeEnd: (v) => loadAt(v),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      IconButton(
                        tooltip: 'Voltar um segundo',
                        onPressed: () => loadAt(max(0, timeMs - 1000)),
                        icon: const Icon(Icons.replay, color: Colors.white),
                        constraints: const BoxConstraints(
                          minHeight: 56,
                          minWidth: 56,
                        ),
                      ),
                      IconButton.filled(
                        tooltip: playing ? 'Pausar' : 'Reproduzir',
                        onPressed: player == null || loading ? null : toggle,
                        iconSize: 36,
                        icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                        constraints: const BoxConstraints(
                          minHeight: 64,
                          minWidth: 64,
                        ),
                      ),
                      IconButton(
                        tooltip: 'Avançar um segundo',
                        onPressed: () => loadAt(min(40000, timeMs + 1000)),
                        icon: const Icon(Icons.forward_10, color: Colors.white),
                        constraints: const BoxConstraints(
                          minHeight: 56,
                          minWidth: 56,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      DropdownButton<double>(
                        value: speed,
                        dropdownColor: const Color(0xff252d36),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                        ),
                        items: [.25, .5, 1.0]
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(
                                  '${s.toString().replaceAll('.', ',')}×',
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (s) {
                          if (s != null) {
                            setState(() => speed = s);
                            player?.setPlaybackSpeed(s);
                          }
                        },
                      ),
                      TextButton.icon(
                        onPressed: align,
                        icon: const Icon(Icons.tune),
                        label: const Text('Ajustar sincronia'),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          transform.value = Matrix4.identity();
                        },
                        icon: const Icon(Icons.zoom_out),
                        label: const Text('Restaurar zoom'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Incerteza da rede: ±${widget.session.peerUncertaintyMs} ms. O tempo de captura também pode variar entre aparelhos.',
                    style: const TextStyle(
                      color: Color(0xffbdc6d2),
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                  if (missingMs > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        '${(missingMs / 1000).toStringAsFixed(2)} s sem imagens nesta janela, incluindo início incompleto e trocas de arquivo.',
                        style: const TextStyle(
                          color: Color(0xffffd493),
                          height: 1.5,
                        ),
                      ),
                    ),
                  const SizedBox(height: 28),
                  FilledButton(
                    onPressed: () async {
                      await player?.pause();
                      await widget.session.start();
                    },
                    child: const Text('Retomar partida'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
