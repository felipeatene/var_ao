import 'dart:convert';
import 'dart:io';
import 'dart:math';

String randomId([int bytes = 12]) {
  final random = Random.secure();
  return List.generate(
    bytes,
    (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
}

class Invitation {
  const Invitation({
    required this.host,
    required this.port,
    required this.token,
  });
  final String host, token;
  final int port;
  String encode() => Uri(
    scheme: 'outroangulo',
    host: 'join',
    queryParameters: {'v': '1', 'host': host, 'port': '$port', 'token': token},
  ).toString();
  Uri endpoint(String path) =>
      Uri(scheme: 'http', host: host, port: port, path: path);
  factory Invitation.parse(String value, {bool allowLoopback = false}) {
    final uri = Uri.parse(value.trim());
    final host = uri.queryParameters['host'] ?? '';
    final ip = InternetAddress.tryParse(host);
    final parts = ip?.rawAddress;
    final local =
        ip?.type == InternetAddressType.IPv4 &&
        parts != null &&
        (parts[0] == 10 ||
            (parts[0] == 192 && parts[1] == 168) ||
            (parts[0] == 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (allowLoopback && parts[0] == 127));
    final port = int.tryParse(uri.queryParameters['port'] ?? '') ?? 0;
    final token = uri.queryParameters['token'] ?? '';
    if (uri.scheme != 'outroangulo' ||
        uri.host != 'join' ||
        uri.queryParameters['v'] != '1' ||
        !local ||
        port < 1 ||
        port > 65535 ||
        !RegExp(r'^[a-f0-9]{64}$').hasMatch(token)) {
      throw const FormatException(
        'Convite inválido. Use o QR ou link criado pelo organizador.',
      );
    }
    return Invitation(host: host, port: port, token: token);
  }
}

Map<String, dynamic> decodeMessage(String text) {
  if (utf8.encode(text).length > 65536) {
    throw const FormatException('Mensagem muito grande');
  }
  final value = jsonDecode(text);
  if (value is! Map<String, dynamic> ||
      value['v'] != 1 ||
      value['type'] is! String) {
    throw const FormatException('Protocolo incompatível');
  }
  return value;
}
