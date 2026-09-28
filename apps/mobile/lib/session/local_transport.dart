import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';

import '../core/invitation.dart';
import '../core/replay.dart';

/// One authenticated control socket and bounded segment requests per phone.
class LocalTransport {
  LocalTransport({
    required this.token,
    required this.nowMs,
    required this.segmentForId,
  });
  final String token;
  final int Function() nowMs;
  final Segment? Function(String) segmentForId;
  final messages = StreamController<Map<String, dynamic>>.broadcast();
  final connections = StreamController<bool>.broadcast();
  HttpServer? _server;
  WebSocket? _socket;
  String? remoteAddress;
  bool _closed = false;
  int get port => _server!.port;
  bool get connected => _socket?.readyState == WebSocket.open;
  Future<void> start({InternetAddress? address}) async {
    _server = await HttpServer.bind(address ?? InternetAddress.anyIPv4, 0);
    _server!.listen((request) {
      _serve(request).catchError((Object _) {
        try {
          request.response.statusCode = 500;
          request.response.close();
        } catch (_) {}
      });
    });
  }

  Future<void> _serve(HttpRequest request) async {
    final response = request.response;
    response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
    if (request.headers.value(HttpHeaders.authorizationHeader) !=
        'Bearer $token') {
      response.statusCode = HttpStatus.unauthorized;
      await response.close();
      return;
    }
    if (request.method != 'GET') {
      response.statusCode = 405;
      await response.close();
      return;
    }
    if (request.uri.path == '/clock') {
      response.headers.contentType = ContentType.json;
      response.write(jsonEncode({'v': 1, 'hostMs': nowMs()}));
      await response.close();
      return;
    }
    if (request.uri.path == '/control' &&
        WebSocketTransformer.isUpgradeRequest(request)) {
      if (connected) {
        response.statusCode = 409;
        await response.close();
        return;
      }
      remoteAddress = request.connectionInfo!.remoteAddress.address;
      _attach(await WebSocketTransformer.upgrade(request));
      return;
    }
    final path = request.uri.pathSegments;
    if (path.length == 2 &&
        path.first == 'segment' &&
        RegExp(r'^[a-f0-9]{24}$').hasMatch(path[1])) {
      final segment = segmentForId(path[1]);
      if (segment == null) {
        response.statusCode = 404;
        await response.close();
        return;
      }
      final file = File(segment.path);
      if (!await file.exists()) {
        response.statusCode = 404;
        await response.close();
        return;
      }
      var start = 0;
      final range = request.headers.value(HttpHeaders.rangeHeader);
      if (range != null) {
        final match = RegExp(r'^bytes=(\d+)-$').firstMatch(range);
        if (match == null || (start = int.parse(match[1]!)) >= segment.bytes) {
          response.statusCode = 416;
          await response.close();
          return;
        }
        response.statusCode = HttpStatus.partialContent;
        response.headers.set(
          HttpHeaders.contentRangeHeader,
          'bytes $start-${segment.bytes - 1}/${segment.bytes}',
        );
      }
      response.headers.contentType = ContentType('video', 'mp4');
      response.headers.set(HttpHeaders.acceptRangesHeader, 'bytes');
      response.contentLength = segment.bytes - start;
      await response.addStream(file.openRead(start));
      await response.close();
      return;
    }
    response.statusCode = 404;
    await response.close();
  }

  void _attach(WebSocket socket) {
    _socket = socket;
    socket.pingInterval = const Duration(seconds: 4);
    connections.add(true);
    socket.listen(
      (data) {
        try {
          if (data is! String) throw const FormatException();
          messages.add(decodeMessage(data));
        } catch (_) {
          socket.close(WebSocketStatus.invalidFramePayloadData);
        }
      },
      onDone: () {
        if (!_closed) connections.add(false);
      },
      onError: (Object e) {
        if (!_closed) {
          connections.add(false);
        }
      },
    );
  }

  Future<void> connect(Invitation invitation) async {
    remoteAddress = invitation.host;
    _attach(
      await WebSocket.connect(
        invitation.endpoint('/control').replace(scheme: 'ws').toString(),
        headers: {HttpHeaders.authorizationHeader: 'Bearer $token'},
      ).timeout(const Duration(seconds: 8)),
    );
  }

  void send(String type, [Map<String, dynamic> body = const {}]) {
    if (!connected) throw StateError('O outro celular desconectou.');
    _socket!.add(jsonEncode({...body, 'v': 1, 'type': type}));
  }

  Future<ClockEstimate> synchronize(Invitation host) async {
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 4);
    final samples = <ClockSample>[];
    try {
      for (var i = 0; i < 7; i++) {
        final sent = nowMs();
        final request = await client.getUrl(host.endpoint('/clock'));
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
        final response = await request.close().timeout(
          const Duration(seconds: 5),
        );
        if (response.statusCode != 200) {
          throw StateError('Convite expirado. Crie uma nova partida.');
        }
        final text = await response.transform(utf8.decoder).join();
        final received = nowMs();
        final value = jsonDecode(text) as Map<String, dynamic>;
        samples.add(
          ClockSample(
            sentMs: sent,
            receivedMs: received,
            hostMs: value['hostMs'] as int,
          ),
        );
      }
      return ClockEstimate.fromSamples(samples);
    } finally {
      client.close(force: true);
    }
  }

  Future<Segment> download(
    Invitation peer,
    Segment segment,
    Directory destination, {
    void Function(int)? onProgress,
  }) async {
    await destination.create(recursive: true);
    final file = File('${destination.path}/${segment.id}.mp4');
    if (await file.exists()) {
      if (await file.length() == segment.bytes &&
          (await sha256.bind(file.openRead()).first).toString() ==
              segment.sha256) {
        return segment.withPath(file.path);
      }
      await file.delete();
    }
    final partial = File('${file.path}.part');
    var offset = await partial.exists() ? await partial.length() : 0;
    if (offset >= segment.bytes) {
      await partial.delete();
      offset = 0;
    }
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 5);
    try {
      final request = await client.getUrl(
        peer.endpoint('/segment/${segment.id}'),
      );
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      if (offset > 0) {
        request.headers.set(HttpHeaders.rangeHeader, 'bytes=$offset-');
      }
      final response = await request.close().timeout(
        const Duration(seconds: 10),
      );
      if (response.statusCode != (offset > 0 ? 206 : 200) ||
          response.contentLength != segment.bytes - offset) {
        await response.drain<void>();
        throw StateError(
          'Transferência indisponível. Mantenha os dois apps abertos e tente novamente.',
        );
      }
      final sink = partial.openWrite(
        mode: offset > 0 ? FileMode.append : FileMode.write,
      );
      var count = offset;
      try {
        await for (final chunk in response.timeout(
          const Duration(seconds: 15),
        )) {
          count += chunk.length;
          if (count > segment.bytes) {
            throw const FormatException('Tamanho do vídeo inválido');
          }
          sink.add(chunk);
          onProgress?.call(count);
        }
        await sink.flush();
      } finally {
        await sink.close();
      }
      if (count != segment.bytes) {
        throw StateError('Transferência interrompida. Tente novamente.');
      }
      if ((await sha256.bind(partial.openRead()).first).toString() !=
          segment.sha256) {
        await partial.delete();
        throw StateError('Vídeo recebido incompleto. Tente novamente.');
      }
      await partial.rename(file.path);
      return segment.withPath(file.path);
    } finally {
      client.close(force: true);
    }
  }

  Future<void> dispose() async {
    _closed = true;
    await _socket?.close();
    await _server?.close(force: true);
    await messages.close();
    await connections.close();
  }
}
