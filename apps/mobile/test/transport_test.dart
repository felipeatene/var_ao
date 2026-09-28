import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:outro_angulo/core/invitation.dart';
import 'package:outro_angulo/core/replay.dart';
import 'package:outro_angulo/session/local_transport.dart';

void main() {
  test(
    'authenticated control, exclusive peer, resumed download and integrity',
    () async {
      final directory = await Directory.systemTemp.createTemp(
        'outro-transport-test-',
      );
      final bytes = List.generate(10000, (i) => i % 256);
      final original = await File('${directory.path}/source.mp4')
          .writeAsBytes(bytes);
      final s = Segment(
        id: randomId(),
        path: original.path,
        startMs: 0,
        endMs: 5000,
        bytes: bytes.length,
        sha256: sha256.convert(bytes).toString(),
      );
      final token = randomId(32);
      final server = LocalTransport(
        token: token,
        nowMs: () => 1000,
        segmentForId: (id) => id == s.id ? s : null,
      );
      final peer = LocalTransport(
        token: token,
        nowMs: () => 1000,
        segmentForId: (_) => null,
      );
      final unauthorized = HttpClient();
      try {
        await server.start(address: InternetAddress.loopbackIPv4);
        final invitation = Invitation(
          host: '127.0.0.1',
          port: server.port,
          token: token,
        );
        final response = await (await unauthorized.getUrl(
          invitation.endpoint('/clock'),
        )).close();
        expect(response.statusCode, 401);
        await response.drain<void>();
        final pending = server.messages.stream.first;
        await peer.connect(invitation);
        peer.send('hello', {'port': 9999});
        expect((await pending)['type'], 'hello');
        final third = LocalTransport(
          token: token,
          nowMs: () => 0,
          segmentForId: (_) => null,
        );
        await expectLater(
          third.connect(invitation),
          throwsA(isA<WebSocketException>()),
        );
        await third.dispose();
        final incoming = await Directory('${directory.path}/incoming').create();
        await File('${incoming.path}/${s.id}.mp4.part')
            .writeAsBytes(bytes.take(3000).toList());
        final downloaded = await peer.download(invitation, s, incoming);
        expect(await File(downloaded.path).readAsBytes(), bytes);
        final bad = Segment(
          id: s.id,
          path: '',
          startMs: 0,
          endMs: 5000,
          bytes: bytes.length,
          sha256: sha256.convert(utf8.encode('wrong')).toString(),
        );
        await expectLater(
          peer.download(
            invitation,
            bad,
            await Directory('${directory.path}/bad').create(),
          ),
          throwsStateError,
        );
      } finally {
        unauthorized.close(force: true);
        await peer.dispose();
        await server.dispose();
        await directory.delete(recursive: true);
      }
    },
  );
}
