# 🎞️ Utilitários de vídeo ilustrativo

[← Frontend](../README.md)

`mockFootage.ts` desenha uma cena de vôlei em Canvas para demonstrar revisão, ângulos e controles do player web.

## O que o motor faz

Renderiza quadra, personagens, bola e marcações de apresentação em função do tempo do demonstrador. Os ângulos ajudam a explorar a interface; não resultam de gravações simultâneas de aparelhos físicos.

## O que não faz

Não captura vídeo, sincroniza relógios, mede latência de câmera, detecta infrações ou identifica automaticamente bola dentro/fora. A cena é ilustrativa e não valida precisão de arbitragem. Não existe NTP real nesse utilitário.

Capture e sincronize arquivos reais somente pelo aplicativo Flutter e pelo [protocolo local](../../docs/PROTOCOL.md). Preserve o rótulo de demonstração quando reutilizar o Canvas em outra tela.
