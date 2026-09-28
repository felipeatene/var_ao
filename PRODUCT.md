# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Praticantes brasileiros de vôlei recreativo em quadra e na praia, usando dois celulares para rever um lance recente.

## Product Purpose

Permitir a revisão de um mesmo lance por dois pontos de vista, sem depender de internet e sem prometer uma decisão de arbitragem ou precisão profissional.

## Operating Context

Aplicativo Flutter para Android e iOS. Os dois celulares devem estar conectados manualmente à mesma rede Wi-Fi ou hotspot, com ambos os aplicativos em primeiro plano. O convite pode ser lido por QR ou colado. O organizador inicia a captura e solicita a revisão; a captura pausa durante o replay e deve ser retomada depois.

## Capabilities and Constraints

A implementação móvel trabalha com uma janela de revisão de até 40 segundos, composta por segmentos. Trocas de arquivo podem deixar lacunas, que devem ser declaradas no replay. A disponibilidade real depende dos dois aparelhos; a interface não deve tratar a janela nominal como gravação contínua garantida. Há alinhamento manual e indicação das limitações de sincronização, sem promessa de precisão temporal.

A versão React é uma demonstração web: a prévia de câmera pode ser real, mas o replay demonstrativo não comprova a captura e transferência entre dois celulares. O aplicativo Flutter é a implementação destinada ao uso com dois dispositivos. Captação, transferência e reprodução reais entre aparelhos Android/iOS ainda precisam de validação física. Código implementado não equivale a produto homologado ou publicado em lojas.

Galeria de destaques, pagamentos nativos e lançamento nas lojas ficam fora deste marco.

## Brand Commitments

Nome: Outro Ângulo. Direção A — Essencial aprovada pelo usuário, registrada em `docs/design/option-a.png`: base clara, ações azuis, replay escuro e orientação pela quadra. A comunicação usa português direto: partida, câmera, revisar lance.

## Evidence on Hand

Referência visual aprovada: `docs/design/option-a.png`. Implementação visual web: `src/index.css`. Tema e fluxos móveis: `apps/mobile/lib/main.dart`. Esses arquivos sustentam a documentação de interface, mas não demonstram desempenho, precisão, compatibilidade em aparelhos ou auditoria completa de acessibilidade.

## Product Principles

- Priorizar a próxima ação útil antes da telemetria técnica.
- Distinguir demonstração, captura real e trecho indisponível.
- Declarar interrupções, lacunas e incerteza de sincronização.
- Orientar conexão e posicionamento com linguagem simples.

## Accessibility & Inclusion

Manter alvos de toque de pelo menos 48 unidades lógicas nos controles principais, texto escalável e identificação sem depender apenas de cor. O web inclui foco visível e redução de movimento; o Flutter usa controles semânticos e rótulos para imagens e QR. VoiceOver, TalkBack, contraste completo, ampliação de texto e uso em aparelhos reais ainda precisam de verificação: não há declaração de conformidade ou auditoria completa.
