# 🏐 Projeto VAR-ÃO - Roadmap e Especificações

O **VAR-ÃO** é um aplicativo mobile focado em democratizar a tecnologia de arbitragem de vídeo (VAR) para esportes amadores. Inspirado no sistema de "Jams" do Spotify, o app conecta múltiplos smartphones offline para atuarem como um sistema multi-câmeras de gravação de buffer contínuo (últimos 40 segundos).

---

## 🗂 Fase 1: Arquitetura Base e Setup do Projeto
**Objetivo:** Preparar a fundação do aplicativo em Flutter.
- [ ] Inicializar projeto Flutter e definir estrutura de pastas (MVVM ou Clean Architecture).
- [ ] Configurar gerência de estado (Riverpod recomendado).
- [ ] Adicionar dependências essenciais no `pubspec.yaml`: `camera` (para gravação contínua), `wifi_p2p` / pacote de Hotspot (rede local) e `gal` (para salvar na galeria).
- [ ] Criar o esqueleto das telas principais (Rotas).

## 🗂 Fase 2: Interface (UX/UI) e Fluxo de Navegação
**Objetivo:** Construir o fluxo completo do usuário.
- [ ] **Tela de Entrada (Home):** Opção para o usuário escolher se quer "Criar um Jam" (Celular Mestre) ou "Entrar em um Jam" (Câmera Periférica).
- [ ] **Visão Mestre - Mapa da Quadra:** Criar o layout da quadra interativa onde o usuário define as posições das câmeras conectadas (Fundo Esquerdo, Fundo Direito, Rede).
- [ ] **Visão Mestre - Painel de Controle:** Implementar os botões "Acionar VAR" (revisão rápida) e "Salvar Lance" (Highlights).
- [ ] **Visão Câmera:** Tela de espera escura indicando a gravação em segundo plano e a posição escolhida.

## 🗂 Fase 3: Motor de Vídeo e Buffer Circular
**Objetivo:** Desenvolver a captura otimizada de vídeo sem estourar a memória.
- [ ] Configurar o pacote de câmera para iniciar a gravação silenciosa.
- [ ] Implementar a lógica do Buffer Circular: gravar em pequenos blocos de 10s e descartar arquivos antigos para reter apenas os últimos 40 segundos de vídeo.
- [ ] Garantir que a qualidade do vídeo seja configurável (720p para o plano Free e 1080p para o Pro).

## 🗂 Fase 4: Comunicação de Rede (Offline) e Sincronização
**Objetivo:** Fazer os celulares conversarem e enviarem os vídeos sem internet.
- [ ] **Descoberta Local:** Implementar a criação de Host (Hotspot) pelo Mestre e a conexão das Câmeras.
- [ ] **Sincronia de Tempo (NTP):** Sincronizar o relógio interno (milissegundos) de todos os aparelhos no momento em que entram no "Jam".
- [ ] **Gatilho e Transferência:** Quando o Mestre acionar o botão, enviar o *timestamp* exato pela rede local. As câmeras devem cortar o vídeo correspondente e transferir o arquivo (via WebSockets/HTTP local) para o Mestre.

## 🗂 Fase 5: Ações de Jogo, Armazenamento e Monetização
**Objetivo:** Separar as lógicas do VAR e dos Highlights, e aplicar regras de negócio.
- [ ] **Lógica "Acionar VAR":** O vídeo recebido vai para o cache temporário, abre o player para revisão tática e é apagado em seguida.
- [ ] **Lógica "Salvar Lance":** O vídeo recebido é salvo permanentemente na galeria (pasta "VAR-ÃO - Jogadas") do celular Mestre.
- [ ] **Controle Freemium (Armazenamento Local / Auth):** 
  - Limitar o "Salvar Lance" a 3 vezes por semana no plano Free.
  - Limitar o número de câmeras no Jam a 2 (Mestre + 1 Câmera) no plano Free.
  - Criar paywall indicando o plano Pro (Câmeras e Lances ilimitados) por assinatura.
