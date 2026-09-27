import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, GitBranch, CheckSquare, Square } from 'lucide-react';

interface GithubRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROADMAP_MARKDOWN = `# 🏐 Projeto VAR-ÃO - Roadmap e Especificações

O **VAR-ÃO** é um aplicativo mobile focado em democratizar a tecnologia de arbitragem de vídeo (VAR) para esportes amadores. Inspirado no sistema de "Jams" do Spotify, o app conecta múltiplos smartphones offline para atuarem como um sistema multi-câmeras de gravação de buffer contínuo (últimos 40 segundos).

---

## 🗂 Fase 1: Arquitetura Base e Setup do Projeto
**Objetivo:** Preparar a fundação do aplicativo em Flutter.
- [ ] Inicializar projeto Flutter e definir estrutura de pastas (MVVM ou Clean Architecture).
- [ ] Configurar gerência de estado (Riverpod recomendado).
- [ ] Adicionar dependências essenciais no \`pubspec.yaml\`: \`camera\` (para gravação contínua), \`wifi_p2p\` / pacote de Hotspot (rede local) e \`gal\` (para salvar na galeria).
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
`;

export const GithubRoadmapModal: React.FC<GithubRoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview');

  const handleCopy = () => {
    navigator.clipboard.writeText(ROADMAP_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([ROADMAP_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ROADMAP_VARAO.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-gray-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 text-emerald-400 rounded-xl border border-gray-700">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-100">
                Roadmap de Desenvolvimento & Issues GitHub
              </h2>
              <p className="text-xs text-gray-400">
                Fases do projeto estruturadas para o repositório mobile Flutter / Web.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Actions Toolbar */}
        <div className="px-5 py-2.5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-gray-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-emerald-500 text-gray-950 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Visualização Tática
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'markdown'
                  ? 'bg-emerald-500 text-gray-950 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Código Markdown (.md)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMd}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .md</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-gray-950 flex items-center gap-1.5 shadow transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar para GitHub</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5 text-xs font-sans leading-relaxed text-gray-300">
          {activeTab === 'preview' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <h3 className="font-bold text-sm text-emerald-300 mb-1">
                  🏐 Projeto VAR-ÃO - Visão Geral do Sistema
                </h3>
                <p className="text-gray-300 text-xs">
                  Inspirado no sistema de <em>"Jams"</em> do Spotify, o app conecta múltiplos
                  smartphones offline para atuarem como um sistema multi-câmeras de gravação contínua
                  em buffer de 40 segundos, resolvendo polêmicas de arbitragem e gerando clipes para redes sociais.
                </p>
              </div>

              {/* Phase cards */}
              {[
                {
                  phase: 'Fase 1',
                  title: 'Arquitetura Base e Setup do Projeto (Flutter)',
                  tasks: [
                    'Inicializar projeto Flutter e definir Clean Architecture / MVVM',
                    'Configurar gerência de estado (Riverpod)',
                    'Adicionar pacotes: camera, wifi_p2p / Hotspot local e gal (salvamento)',
                    'Criar rotas e esqueleto de telas principais',
                  ],
                },
                {
                  phase: 'Fase 2',
                  title: 'Interface (UX/UI) e Fluxo de Navegação',
                  tasks: [
                    'Tela de Entrada (Home): Criar Jam (Mestre) vs Entrar (Câmera)',
                    'Visão Mestre: Mapa da Quadra interativo com slots angulares',
                    'Visão Mestre: Botões ACIONAR VAR e SALVAR LANCE',
                    'Visão Câmera: Tela OLED de gravação em segundo plano',
                  ],
                },
                {
                  phase: 'Fase 3',
                  title: 'Motor de Vídeo e Buffer Circular (40 Segundos)',
                  tasks: [
                    'Captura contínua e silenciosa de vídeo',
                    'Buffer circular em memória: blocos de 10s retendo os últimos 40s',
                    'Qualidade de vídeo configurável (720p Free vs 1080p60 Pro)',
                  ],
                },
                {
                  phase: 'Fase 4',
                  title: 'Comunicação de Rede P2P Offline & Sincronização NTP',
                  tasks: [
                    'Descoberta local e Hotspot criado pelo Celular Mestre',
                    'Sincronia de relógio interno (NTP em milissegundos)',
                    'Gatilho de timestamp pelo Mestre e transferência rápida de arquivo',
                  ],
                },
                {
                  phase: 'Fase 5',
                  title: 'Ações de Jogo, Armazenamento e Monetização',
                  tasks: [
                    'Lógica ACIONAR VAR: cache temporário para revisão rápida',
                    'Lógica SALVAR LANCE: gravação permanente na galeria do celular',
                    'Regras Freemium: Limite 2 câmeras e 3 lances/semana no Free',
                    'Paywall do Plano Pro (R$ 9,00/mês para uso ilimitado)',
                  ],
                },
              ].map((item) => (
                <div key={item.phase} className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      {item.phase}
                    </span>
                    <h4 className="font-bold text-sm text-gray-100">{item.title}</h4>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {item.tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <pre className="font-mono text-xs bg-gray-900 p-4 rounded-2xl border border-gray-800 text-gray-300 whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
              {ROADMAP_MARKDOWN}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Pronto para ser adicionado ao GitHub Projects ou README.md
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
