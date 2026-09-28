import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:outro_angulo/main.dart';

void main() {
  testWidgets('home remains usable with large text on a narrow phone', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(const OutroAngulo());
    await tester.pumpAndSettle();
    expect(find.text('Criar partida'), findsOneWidget);
    expect(find.text('Entrar como câmera'), findsOneWidget);
    expect(tester.takeException(), isNull);
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Entrar como câmera'), 200);
    expect(tester.takeException(), isNull);
    final button = tester.getSize(
      find.widgetWithText(OutlinedButton, 'Entrar como câmera'),
    );
    expect(button.height, greaterThanOrEqualTo(48));
  });
}
