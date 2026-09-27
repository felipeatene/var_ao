# 🏐 VAR-ÃO — Árbitro de Vídeo e Highlights para Esportes Amadores

[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/)
[![Plataforma](https://img.shields.io/badge/plataforma-Flutter%20%7C%20Web%20React-blue.svg)](https://github.com/)
[![Buffer](https://img.shields.io/badge/buffer-40s%20Circular-orange.svg)](https://github.com/)
[![Rede](https://img.shields.io/badge/rede-Offline%20P2P%20%2F%20Hotspot-green.svg)](https://github.com/)
[![Esporte](https://img.shields.io/badge/esportes-V%C3%B4lei%20de%20Quadra%20%26%20Praia-yellow.svg)](https://github.com/)

> O **VAR-ÃO** democratiza a tecnologia de arbitragem de vídeo (VAR) e gravação de jogadas incríveis para esportes amadores. Inspirado no sistema de *"Jams"* do Spotify, o aplicativo conecta múltiplos smartphones em rede local (sem depender de internet) para funcionarem como um sistema multi-câmeras sincronizado com buffer circular contínuo dos últimos **40 segundos**.

---

## 📑 Índice da Documentação do Projeto

Para facilitar a navegação e manutenção por módulos, cada diretório do código-fonte possui seu próprio `README.md` dedicado:

* [📘 `src/README.md`](./src/README.md) — Visão geral da arquitetura do frontend, gerenciamento de estado e fluxo de telas.
* [🧩 `src/components/README.md`](./src/components/README.md) — Documentação aprofundada dos componentes de interface (Quadra interativa, VAR Player, Modo Câmera, Galeria de Lances, etc.).
* [🏷️ `src/types/README.md`](./src/types/README.md) — Definição dos tipos TypeScript, entidades do domínio (câmeras, lances, vereditos e planos).
* [⚙️ `src/utils/README.md`](./src/utils/README.md) — Motor gráfico em Canvas, simulação física da bola de vôlei, sincronia temporal NTP e HUD tático.

---

## 🎯 1. Visão Geral e Conceito Central

Em partidas amadoras de vôlei e esportes de quadra, lances cruciais (bolas na linha, toques sutis no bloqueio, toques na fita da rede ou invasões) geram discussões que interrompem o ritmo do jogo. Além disso, as melhores jogadas da partida geralmente são perdidas porque ninguém estava gravando no momento exato.

O **VAR-ÃO** resolve esses dois problemas:
1. **Arbitragem Imparcial (VAR Tático):** Ao acionar o botão do VAR, o sistema congela instantaneamente os últimos 40 segundos de todos os celulares vinculados à sessão e abre um player tático com *slow-motion*, zoom digital e avanço quadro a quadro para decidir o ponto.
2. **Highlights Prontos para Redes Sociais:** O botão "Salvar Lance" exporta o mesmo buffer de 40s com multi-ângulos sincronizados direto para a galeria do smartphone do organizador, pronto para compartilhar no Instagram, TikTok ou WhatsApp.

---

## 📡 2. Arquitetura de Rede Offline (O "Jam")

Para garantir latência ultrabaixa e transferência de arquivos pesados sem custo de dados móveis ou oscilações de Wi-Fi de clubes:

```
┌────────────────────────────────────────────────────────┐
│               CELULAR MESTRE (HOST DO JAM)             │
│        Cria Hotspot Wi-Fi Local (ex: VAR-AO_5G)        │
│          Servidor NTP Local + WebSocket Server         │
└──────────────────────────┬─────────────────────────────┘
                           │ Conexão P2P Local (Wi-Fi)
         ┌─────────────────┼─────────────────┐
         ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐
│ CÂMERA 1 (REDE)  │               │ CÂMERA 2 (FUNDO) │
│ Grava buffer 40s │               │ Grava buffer 40s │
│ NTP sincronizado │               │ NTP sincronizado │
└──────────────────┘               └──────────────────┘
```

* **Modo Hotspot P2P:** O celular Mestre gera a rede sem fio. As câmeras periféricas conectam-se pelo QR Code ou seleção de rede local.
* **Sincronia de Tempo (NTP):** Todos os dispositivos sincronizam seus relógios internos com precisão de milissegundos ($\pm 0.4\text{ms}$).
* **Buffer Circular:** Cada câmera grava pequenos fragmentos e descarta os mais antigos, retendo estritamente os últimos 40 segundos na memória do aparelho.

---

## 🗺️ 3. Roadmap de Desenvolvimento (5 Fases para GitHub Projects)

Abaixo está o planejamento completo para execução da versão nativa em Flutter:

### 🗂 Fase 1: Arquitetura Base e Setup do Projeto
* [ ] Inicializar projeto Flutter e definir estrutura de pastas (MVVM ou Clean Architecture).
* [ ] Configurar gerência de estado (Riverpod recomendado).
* [ ] Adicionar dependências essenciais no `pubspec.yaml`: `camera` (para gravação contínua), `wifi_p2p` / pacote de Hotspot (rede local) e `gal` (para salvar na galeria).
* [ ] Criar o esqueleto das telas principais (Rotas).

### 🗂 Fase 2: Interface (UX/UI) e Fluxo de Navegação
* [ ] **Tela de Entrada (Home):** Opção para o usuário escolher se quer "Criar um Jam" (Celular Mestre) ou "Entrar em um Jam" (Câmera Periférica).
* [ ] **Visão Mestre - Mapa da Quadra:** Criar o layout da quadra interativa onde o usuário define as posições das câmeras conectadas (Fundo Superior, Fundo Inferior, Rede Esquerda/Direita, Lateral).
* [ ] **Visão Mestre - Painel de Controle:** Implementar os botões "Acionar VAR" (revisão rápida) e "Salvar Lance" (Highlights).
* [ ] **Visão Câmera:** Tela de espera escura indicando a gravação em segundo plano e a posição escolhida.

### 🗂 Fase 3: Motor de Vídeo e Buffer Circular
* [ ] Configurar o pacote de câmera para iniciar a gravação silenciosa em segundo plano.
* [ ] Implementar a lógica do Buffer Circular: gravar em pequenos blocos de 10s e descartar arquivos antigos para reter apenas os últimos 40 segundos de vídeo.
* [ ] Garantir que a qualidade do vídeo seja configurável (720p para o plano Free e 1080p para o Pro).

### 🗂 Fase 4: Comunicação de Rede (Offline) e Sincronização
* [ ] **Descoberta Local:** Implementar a criação de Host (Hotspot) pelo Mestre e a conexão das Câmeras.
* [ ] **Sincronia de Tempo (NTP):** Sincronizar o relógio interno (milissegundos) de todos os aparelhos no momento em que entram no "Jam".
* [ ] **Gatilho e Transferência:** Quando o Mestre acionar o botão, enviar o *timestamp* exato pela rede local. As câmeras devem cortar o vídeo correspondente e transferir o arquivo (via WebSockets/HTTP local) para o Mestre.

### 🗂 Fase 5: Ações de Jogo, Armazenamento e Monetização
* [ ] **Lógica "Acionar VAR":** O vídeo recebido vai para o cache temporário, abre o player para revisão tática e é apagado em seguida.
* [ ] **Lógica "Salvar Lance":** O vídeo recebido é salvo permanentemente na galeria (pasta "VAR-ÃO - Jogadas") do celular Mestre.
* [ ] **Controle Freemium (Armazenamento Local / Auth):**
  * Limitar o "Salvar Lance" a 3 vezes por semana no plano Free.
  * Limitar o número de câmeras no Jam a 2 (Mestre + 1 Câmera) no plano Free.
  * Criar paywall indicando o plano Pro (Câmeras e Lances ilimitados) por assinatura.

---

## 💎 4. Modelo de Negócios (Freemium)

| Funcionalidade | Plano Free (Gratuito) | Plano Pro (Aprox. R$ 9,00/mês) |
| :--- | :--- | :--- |
| **Câmeras no Jam** | Mestre + 1 Câmera extra (Total 2) | Câmeras Ilimitadas |
| **Uso do VAR** | Ilimitado | Ilimitado |
| **Salvar Lance (Highlights)** | Limite de **3 lances por semana** | **Ilimitado** |
| **Qualidade de Vídeo** | 720p (Padrão) | 1080p a 60fps (Alta definição) |
| **Exportação** | Com marca d'água do aplicativo | Sem marca d'água / Vídeo limpo |

---

## 🚀 5. Executando o Protótipo Web Atual

O repositório contém uma aplicação completa construída em **React 19 + TypeScript + Vite + Tailwind CSS**, que simula o ecossistema com suporte à webcam real e feeds simulados táticos.

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Porta 3000)
npm run dev

# Validar TypeScript e Lint
npm run lint

# Gerar build de produção
npm run build
```

---

## 👥 Contribuição e Licença

Desenvolvido para revolucionar o esporte amador no Brasil. Sinta-se à vontade para abrir *Issues* ou enviar *Pull Requests* com base nas fases listadas acima.
