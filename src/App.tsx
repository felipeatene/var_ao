import { DialogBoundary } from './components/DialogBoundary';
import React, { useState, useEffect } from 'react';
import {
  CameraDevice,
  CameraPositionId,
  SavedHighlight,
  SportType,
  SubscriptionTier,
  VarVerdict,
} from './types';
import { CourtLayout } from './components/CourtLayout';
import { VarReviewModal } from './components/VarReviewModal';
import { CameraView } from './components/CameraView';
import { HighlightsGalleryModal } from './components/HighlightsGalleryModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { GithubRoadmapModal } from './components/GithubRoadmapModal';
import confetti from 'canvas-confetti';
import {
  Camera,
  Play,
  Share2,
  Film,
  Sparkles,
  Wifi,
  Smartphone,
  CheckCircle2,
  RotateCcw,
  Plus,
  GitBranch,
  Radio,
  Eye,
  Settings,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Tv,
  ArrowLeft,
  Clock3,
  ArrowUpRight,
} from 'lucide-react';

type ScreenId = 'home' | 'master' | 'camera_setup' | 'camera_recording';

export default function App() {
  // Navigation & Screen
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [activeScreen]);
  const [sport, setSport] = useState<SportType>('court_volleyball');
  const [tier, setTier] = useState<SubscriptionTier>('free');

  // Phone Frame or Viewport mode
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [showMultiDeviceDock, setShowMultiDeviceDock] = useState<boolean>(false);

  // Active Peripheral Camera setup choice
  const [cameraPositionChoice, setCameraPositionChoice] =
    useState<CameraPositionId>('pos_fundo_baixo');

  // Connected Cameras in the Jam with free coordinates (placed in Free Zone outside lines)
  const [cameras, setCameras] = useState<CameraDevice[]>([
    {
      id: 'cam-1',
      name: 'Outro lado',
      customLabel: 'Outro lado',
      positionId: 'pos_fundo_cima',
      xPercent: 50,
      yPercent: 8,
      rotationDegrees: 145,
      fovAngle: 50,
      status: 'recording',
      batteryLevel: 94,
      fps: 60,
      resolution: '720p',
      bufferSeconds: 40,
      isWebcam: false,
      lensType: 'standard',
    },
    {
      id: 'cam-2',
      name: 'Atrás da Linha de Saque (Fora)',
      customLabel: 'Câmera de fundo',
      positionId: 'pos_fundo_baixo',
      xPercent: 50,
      yPercent: 92,
      rotationDegrees: 270,
      fovAngle: 50,
      status: 'recording',
      batteryLevel: 87,
      fps: 60,
      resolution: '720p',
      bufferSeconds: 40,
      isWebcam: false,
      lensType: 'wide',
    },
  ]);

  // Saved Highlights State
  const [highlights, setHighlights] = useState<SavedHighlight[]>([
    {
      id: 'hl-1',
      title: 'Bloqueio Triplo Monstro',
      sport: 'court_volleyball',
      timestamp: 'Hoje, 14:32',
      duration: 40,
      camerasCount: 2,
      thumbnail: '',
      fileSizeMb: 42.4,
      resolution: '720p',
      hasWatermark: true,
      tags: ['Bloqueio', 'PontoCrucial'],
    },
    {
      id: 'hl-2',
      title: 'Saque Viagem na Linha',
      sport: 'court_volleyball',
      timestamp: 'Hoje, 15:05',
      duration: 40,
      camerasCount: 2,
      thumbnail: '',
      fileSizeMb: 39.8,
      resolution: '720p',
      hasWatermark: true,
      tags: ['Ace', 'LinhaFundo'],
    },
  ]);

  const [weeklySavedCount, setWeeklySavedCount] = useState<number>(2);

  // Modals state
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);

  // Flash trigger state for peripheral sync effect
  const [isTransferringToMaster, setIsTransferringToMaster] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Camera at specific (x%, y%) coordinate
  const handleAddCameraAtPosition = (xPercent: number, yPercent: number, label: string) => {
    if (tier === 'free' && cameras.length >= 2) {
      setIsUpgradeModalOpen(true);
      return;
    }

    // Auto calculate initial rotation pointing towards court center (50, 50)
    const dx = 50 - xPercent;
    const dy = 50 - yPercent;
    let angleRad = Math.atan2(dy, dx);
    let deg = Math.round((angleRad * 180) / Math.PI);
    if (deg < 0) deg += 360;

    const newCam: CameraDevice = {
      id: `cam-${Date.now()}`,
      name: label,
      customLabel: label,
      positionId:
        yPercent < 35 ? 'pos_fundo_cima' : yPercent > 65 ? 'pos_fundo_baixo' : 'pos_rede_esq',
      xPercent,
      yPercent,
      rotationDegrees: deg,
      fovAngle: 50,
      status: 'recording',
      batteryLevel: Math.floor(Math.random() * 15) + 85,
      fps: 60,
      resolution: tier === 'pro' ? '1080p' : '720p',
      bufferSeconds: 40,
      isWebcam: false,
      lensType: 'standard',
    };

    setCameras((prev) => [...prev, newCam]);
    showToast(`Câmera posicionada em (${xPercent}%, ${yPercent}%)!`);
  };

  const handleUpdateCameraPosition = (id: string, xPercent: number, yPercent: number) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, xPercent, yPercent } : c))
    );
  };

  const handleUpdateCameraRotation = (id: string, rotationDegrees: number) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rotationDegrees } : c))
    );
    showToast('Câmera salva.');
  };

  const handleUpdateCameraLabel = (id: string, label: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, customLabel: label, name: label } : c))
    );
  };

  const handleRemoveCamera = (id: string) => {
    setCameras((prev) => prev.filter((c) => c.id !== id));
    showToast('Câmera removida da quadra.');
  };

  // Action: ACIONAR VAR
  const handleTriggerVar = () => {
    const activeCount = cameras.filter((c) => c.positionId).length;
    if (activeCount === 0) {
      showToast('Erro: Nenhuma câmera conectada ao Jam!');
      return;
    }

    // Trigger flash animation on peripheral devices
    setIsTransferringToMaster(true);
    showToast('Preparando replay simulado…');

    setTimeout(() => {
      setIsTransferringToMaster(false);
      setIsVarModalOpen(true);
    }, 700);
  };

  // Action: SALVAR LANCE (Highlight)
  const handleTriggerSaveHighlight = () => {
    const activeCount = cameras.filter((c) => c.positionId).length;
    if (activeCount === 0) {
      showToast('Erro: Nenhuma câmera conectada ao Jam!');
      return;
    }

    // Check freemium limit (3 saves per week for free)
    if (tier === 'free' && weeklySavedCount >= 3) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsTransferringToMaster(true);
    showToast(`Lance Salvo! Exportando 40s para a pasta "VAR-ÃO - Jogadas"...`);

    setTimeout(() => {
      setIsTransferringToMaster(false);
      const newHighlight: SavedHighlight = {
        id: `hl-${Date.now()}`,
        title: `Jogada #${highlights.length + 1} (${sport === 'beach_volleyball' ? 'Praia' : 'Quadra'})`,
        sport: sport,
        timestamp: 'Agora há pouco',
        duration: 40,
        camerasCount: activeCount,
        thumbnail: '',
        fileSizeMb: tier === 'pro' ? 68.5 : 41.2,
        resolution: tier === 'pro' ? '1080p' : '720p',
        hasWatermark: tier === 'free',
        tags: ['VAR-ÃO', 'Highlight'],
      };

      setHighlights((prev) => [newHighlight, ...prev]);
      setWeeklySavedCount((prev) => prev + 1);

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
      setIsGalleryOpen(true);
    }, 800);
  };

  // Start Camera Peripheral Mode
  const handleStartCameraRole = (pos: CameraPositionId) => {
    setCameraPositionChoice(pos);
    setActiveScreen('camera_recording');
    showToast('Escolha a webcam ou a câmera simulada.');
  };

  const handleVerdictDecided = (verdict: VarVerdict, notes: string) => {
    showToast(`Veredito registrado: ${verdict}`);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="wordmark" onClick={() => setActiveScreen('home')} aria-label="Outro Ângulo, início"><span className="brand-mark" aria-hidden="true" />Outro Ângulo</button>
        <nav aria-label="Navegação"><button className="quiet-button" onClick={() => setIsGalleryOpen(true)}><Film size={19}/><span>Jogadas</span><span className="count">{highlights.length}</span></button><button className="icon-button" onClick={() => setIsRoadmapModalOpen(true)} aria-label="Sobre o protótipo"><GitBranch size={20}/></button></nav>
      </header>
      <div className="demo-notice"><span className="status-dot"/>Protótipo interativo <span className="notice-detail">· Conexão e replays simulados</span></div>
      {toastMessage && <div className="toast" role="status">{toastMessage}</div>}
      <main className={`workspace ${activeScreen === 'home' ? 'home-workspace' : ''}`}>
        {activeScreen === 'home' && <section className="home-layout">
          <div className="home-story"><h1>Todo lance<br/>merece outro<br/><span>ângulo.</span></h1><p className="intro">O jogo segue.<br/>A dúvida fica para o replay.</p><div className="home-court"><img src="/assets/court.png" alt="Ilustração de uma quadra de vôlei com a rede ao centro"/></div></div>
          <div className="start-panel"><div className="start-copy"><h2>Reveja o jogo<br/>com dois celulares.</h2><p>Uma partida. Dois pontos de vista. <br/>Escolha a modalidade para começar.</p></div><fieldset className="sport-picker"><legend>Modalidade</legend><div className="segmented"><button aria-pressed={sport === 'court_volleyball'} onClick={() => setSport('court_volleyball')}>Quadra</button><button aria-pressed={sport === 'beach_volleyball'} onClick={() => setSport('beach_volleyball')}>Praia</button></div></fieldset><div className="start-actions"><button className="primary-button" onClick={() => setActiveScreen('master')}>Criar partida <ArrowUpRight size={22}/></button><button className="secondary-button" onClick={() => setActiveScreen('camera_setup')}>Entrar como câmera <Camera size={20}/></button></div><p className="connection-note"><Wifi size={17}/>No aplicativo: mesma rede, sem internet.</p><div className="small-print"><span>Uma nova visão do seu jogo.</span><button onClick={() => setIsRoadmapModalOpen(true)}>Conheça o projeto <ArrowUpRight size={14}/></button></div></div>
        </section>}
        {activeScreen === 'master' && <section className="match-layout"><div className="match-title"><button className="back-link" onClick={() => setActiveScreen('home')}><ArrowLeft size={18}/> Voltar</button><h1>Partida pronta.</h1><p>{sport === 'court_volleyball' ? 'Vôlei de quadra' : 'Vôlei de praia'} · sessão demonstrativa</p></div><div className="court-panel legacy-light"><CourtLayout sport={sport} cameras={cameras} onAddCameraAtPosition={handleAddCameraAtPosition} onUpdateCameraPosition={handleUpdateCameraPosition} onUpdateCameraRotation={handleUpdateCameraRotation} onUpdateCameraLabel={handleUpdateCameraLabel} onRemoveCamera={handleRemoveCamera} isPro={tier === 'pro'} onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}/></div><aside className="match-controls"><h2>Seus pontos de vista</h2><div className="camera-list">{cameras.map((camera,i)=><div className="camera-row" key={camera.id}><span className="camera-number">{i+1}</span><div><strong>{i===0?'Este celular':camera.customLabel || camera.name}</strong><span>{camera.status==='offline'?'Desconectada':'Câmera simulada'}</span></div><span className="recording-state"><span className="status-dot"/>{camera.status==='offline'?'Offline':'Pronta'}</span></div>)}</div><div className="buffer-status"><Clock3 size={23}/><div><strong>40 s para rever o lance</strong><span>Vídeo de demonstração</span></div></div><button className="primary-button" disabled={!cameras.length || isTransferringToMaster} onClick={handleTriggerVar}>{isTransferringToMaster?'Preparando replay…':'Revisar lance'}<Play size={20}/></button><button className="secondary-button" disabled={!cameras.length || isTransferringToMaster} onClick={handleTriggerSaveHighlight}>Salvar jogada <Film size={19}/></button><div className="match-utilities"><button className="quiet-button" onClick={() => setActiveScreen('camera_setup')}><Camera size={18}/> Usar webcam</button><button className="quiet-button" onClick={() => setIsUpgradeModalOpen(true)}>Plano {tier === 'pro'?'Pro':'Free'}</button></div><button className="end-session" onClick={() => setActiveScreen('home')}>Encerrar demonstração</button></aside></section>}
        {activeScreen === 'camera_setup' && <section className="setup-layout"><button className="back-link" onClick={() => setActiveScreen('home')}><ArrowLeft size={18}/>Voltar</button><h1>De onde vamos<br/>ver o jogo?</h1><p>Escolha a posição deste celular. A webcam é local; esta versão web não conecta outros aparelhos.</p><div className="position-list">{[{id:'pos_fundo_baixo' as CameraPositionId,title:'Linha de fundo',desc:'Atrás da linha de saque do seu lado'},{id:'pos_fundo_cima' as CameraPositionId,title:'Fundo adversário',desc:'Uma visão do outro lado da quadra'},{id:'pos_rede_esq' as CameraPositionId,title:'Rede, à esquerda',desc:'Para rever bloqueios e toques na rede'},{id:'pos_rede_dir' as CameraPositionId,title:'Rede, à direita',desc:'Outro ponto de vista dos bloqueios'},{id:'pos_lateral' as CameraPositionId,title:'Lateral da quadra',desc:'Uma visão ampla de toda a jogada'}].map((item,i)=><button key={item.id} onClick={() => handleStartCameraRole(item.id)}><span className="camera-number">{i+1}</span><span><strong>{item.title}</strong><small>{item.desc}</small></span><ChevronRight size={20}/></button>)}</div></section>}
        {activeScreen === 'camera_recording' && <div className="recording-screen"><CameraView positionId={cameraPositionChoice} sport={sport} onExit={() => setActiveScreen('home')} isTriggered={isTransferringToMaster} onSelectPosition={setCameraPositionChoice}/></div>}
      </main>
      <footer className="app-footer"><span>Outro Ângulo</span><span>Feito para quem está em quadra.</span><button onClick={() => setIsRoadmapModalOpen(true)}>Sobre a demonstração</button></footer>
      {isVarModalOpen && <DialogBoundary label="Revisar lance" onClose={() => setIsVarModalOpen(false)}><VarReviewModal isOpen onClose={() => setIsVarModalOpen(false)} sport={sport} cameras={cameras} onVerdictDecided={handleVerdictDecided}/></DialogBoundary>}
      {isGalleryOpen && <DialogBoundary label="Jogadas salvas" onClose={() => setIsGalleryOpen(false)}><div className="legacy-light"><HighlightsGalleryModal isOpen onClose={() => setIsGalleryOpen(false)} highlights={highlights} onDeleteHighlight={(id) => setHighlights(prev => prev.filter(h => h.id!==id))} weeklySavedCount={weeklySavedCount} tier={tier} onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}/></div></DialogBoundary>}
      {isUpgradeModalOpen && <DialogBoundary label="Planos demonstrativos" onClose={() => setIsUpgradeModalOpen(false)}><div className="legacy-light"><ProUpgradeModal isOpen onClose={() => setIsUpgradeModalOpen(false)} tier={tier} onToggleTier={(value)=>{setTier(value);showToast('Plano alterado apenas nesta demonstração.');}}/></div></DialogBoundary>}
      {isRoadmapModalOpen && <DialogBoundary label="Sobre o protótipo" onClose={() => setIsRoadmapModalOpen(false)}><div className="legacy-light"><GithubRoadmapModal isOpen onClose={() => setIsRoadmapModalOpen(false)}/></div></DialogBoundary>}
    </div>
  );
}
