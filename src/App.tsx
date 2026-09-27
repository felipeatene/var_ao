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
} from 'lucide-react';

type ScreenId = 'home' | 'master' | 'camera_setup' | 'camera_recording';

export default function App() {
  // Navigation & Screen
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [sport, setSport] = useState<SportType>('court_volleyball');
  const [tier, setTier] = useState<SubscriptionTier>('free');

  // Phone Frame or Viewport mode
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [showMultiDeviceDock, setShowMultiDeviceDock] = useState<boolean>(false);

  // Active Peripheral Camera setup choice
  const [cameraPositionChoice, setCameraPositionChoice] =
    useState<CameraPositionId>('pos_fundo_baixo');

  // Connected Cameras in the Jam with free coordinates (placed in Free Zone outside lines)
  const [cameras, setCameras] = useState<CameraDevice[]>([
    {
      id: 'cam-1',
      name: 'Quina Adversário (Fora da Linha)',
      customLabel: 'Quina Adversário (Fora)',
      positionId: 'pos_fundo_cima',
      xPercent: 91,
      yPercent: 7,
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
      customLabel: 'Fundo (Fora da Linha)',
      positionId: 'pos_fundo_baixo',
      xPercent: 50,
      yPercent: 93,
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
    showToast(`VAR Acionado! Baixando 40s de ${activeCount} câmeras...`);

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

      confetti({
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
    showToast('Câmera pronta! Sincronizando relógio NTP...');
  };

  const handleVerdictDecided = (verdict: VarVerdict, notes: string) => {
    showToast(`Veredito registrado: ${verdict}`);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-gray-100 flex flex-col items-center justify-start antialiased selection:bg-emerald-500 selection:text-black">
      
      {/* ================= SIMULATOR TOP NAV BAR ================= */}
      <header className="w-full bg-gray-950/90 border-b border-gray-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveScreen('home')}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-gray-950 text-base">
                🏐
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                  VAR-ÃO
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    JAM P2P
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Sport Selector */}
            <div className="hidden sm:flex items-center bg-gray-900 p-0.5 rounded-xl border border-gray-800 text-xs">
              <button
                onClick={() => setSport('court_volleyball')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sport === 'court_volleyball'
                    ? 'bg-emerald-500 text-gray-950 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Quadra (9x18m)
              </button>
              <button
                onClick={() => setSport('beach_volleyball')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sport === 'beach_volleyball'
                    ? 'bg-amber-500 text-gray-950 font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Praia (8x16m)
              </button>
            </div>
          </div>

          {/* Quick Action Badges & Modal Triggers */}
          <div className="flex items-center gap-2">
            
            {/* Gallery Button */}
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 text-xs font-semibold border border-gray-800 transition-colors"
              title="Abrir Galeria de Lances Salvos"
            >
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jogadas ({highlights.length})</span>
            </button>

            {/* Pro / Free Toggle Button */}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tier === 'pro'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-950 shadow-md shadow-amber-500/20'
                  : 'bg-gray-900 text-amber-400 border border-amber-500/40 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{tier === 'pro' ? 'PRO ATIVO' : 'UPGRADE PRO'}</span>
            </button>

            {/* GitHub Roadmap Doc Button */}
            <button
              onClick={() => setIsRoadmapModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-sky-400" />
              <span>Roadmap GitHub</span>
            </button>

            {/* Phone Frame Toggle */}
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors"
              title={isPhoneFrame ? 'Expandir para tela cheia' : 'Modo Celular (Moldura 375x812px)'}
            >
              {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= MAIN CONTAINER ================= */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 my-auto">
        <div
          className={`transition-all duration-300 relative ${
            isPhoneFrame
              ? 'w-[375px] h-[812px] bg-gray-950 rounded-[44px] border-[10px] border-black shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col'
              : 'w-full max-w-2xl min-h-[750px] bg-gray-950 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6'
          }`}
        >
          {/* Virtual Phone Notch / Dynamic Island */}
          {isPhoneFrame && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-900 border border-gray-800" />
            </div>
          )}

          {/* ----------------- SCREEN 1: HOME ----------------- */}
          {activeScreen === 'home' && (
            <div className="flex-1 flex flex-col justify-between p-6 pt-12 animate-in fade-in duration-300">
              {/* Brand Hero */}
              <div className="flex flex-col items-center text-center mt-4">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 text-5xl">
                    🏐
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-gray-900 border-2 border-emerald-500 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    40s BUFFER
                  </span>
                </div>

                <h1 className="text-4xl font-black text-white tracking-tight">VAR-ÃO</h1>
                <p className="text-sm text-gray-400 mt-2 max-w-xs">
                  A tecnologia profissional no seu jogo amador.
                </p>

                {/* Jam Network Status Pill */}
                <div className="mt-5 inline-flex items-center gap-2 bg-gray-900/90 border border-gray-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-gray-300">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rede Local P2P Offline</span>
                </div>
              </div>

              {/* Sport Preset Switcher on Home */}
              <div className="my-auto py-4">
                <p className="text-xs text-center text-gray-500 mb-2 font-mono uppercase tracking-wider">
                  Modalidade Esportiva
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSport('court_volleyball')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                      sport === 'court_volleyball'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-xl mb-1">🏐</span>
                    <strong className="text-xs font-bold">Vôlei de Quadra</strong>
                    <span className="text-[10px] text-gray-400 mt-0.5">9x18m com 3m</span>
                  </button>

                  <button
                    onClick={() => setSport('beach_volleyball')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                      sport === 'beach_volleyball'
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-xl mb-1">🏖️</span>
                    <strong className="text-xs font-bold">Vôlei de Praia</strong>
                    <span className="text-[10px] text-gray-400 mt-0.5">8x16m na Areia</span>
                  </button>
                </div>
              </div>

              {/* Role Selection Buttons (Matching prompt flow) */}
              <div className="flex flex-col gap-3 pb-6">
                <button
                  onClick={() => setActiveScreen('master')}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-gray-950 font-black text-base shadow-xl shadow-emerald-500/25 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5" />
                    <span>Criar Jam (Celular Mestre)</span>
                  </div>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => setActiveScreen('camera_setup')}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-200 font-bold text-sm border border-gray-800 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
                    <span>Entrar (Câmera Periférica)</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>

                <button
                  onClick={() => setIsRoadmapModalOpen(true)}
                  className="mt-1 text-center text-xs text-gray-500 hover:text-gray-300 font-mono"
                >
                  Ver Documentação de Fases & Roadmap (.md)
                </button>
              </div>
            </div>
          )}

          {/* ----------------- SCREEN 2: MASTER VIEW ----------------- */}
          {activeScreen === 'master' && (
            <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 pt-8 animate-in fade-in duration-300 overflow-y-auto">
              {/* Master Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">Painel do Mestre</h2>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      HOST
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Posicione câmeras livremente tocando ou arrastando pela quadra.
                  </p>
                </div>

                <button
                  onClick={() => setActiveScreen('home')}
                  className="p-1.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                  title="Voltar à tela inicial"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Court Layout Interactive Map */}
              <div className="my-auto py-1">
                <CourtLayout
                  sport={sport}
                  cameras={cameras}
                  onAddCameraAtPosition={handleAddCameraAtPosition}
                  onUpdateCameraPosition={handleUpdateCameraPosition}
                  onUpdateCameraRotation={handleUpdateCameraRotation}
                  onUpdateCameraLabel={handleUpdateCameraLabel}
                  onRemoveCamera={handleRemoveCamera}
                  isPro={tier === 'pro'}
                  onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
                />
              </div>

              {/* Master Action Trigger Controls (Exact requested buttons) */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-800/80">
                {/* 1. ACIONAR VAR */}
                <button
                  onClick={handleTriggerVar}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                  <span>ACIONAR VAR</span>
                  <span className="text-xs font-mono font-normal opacity-80">(Revisão Tática)</span>
                </button>

                {/* 2. SALVAR LANCE */}
                <button
                  onClick={handleTriggerSaveHighlight}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-gray-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Film className="w-4 h-4 fill-current" />
                  <span>SALVAR LANCE</span>
                  <span className="text-xs font-mono font-semibold opacity-80">(Highlights)</span>
                </button>

                {/* Bottom utilities */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setIsGalleryOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800 flex items-center justify-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver Galeria ({highlights.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveScreen('camera_setup')}
                    className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    <span>Modo Câmera</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- SCREEN 3: CAMERA SETUP ----------------- */}
          {activeScreen === 'camera_setup' && (
            <div className="flex-1 flex flex-col justify-between p-6 pt-10 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-white text-center">Posição da Câmera</h2>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Onde este celular será posicionado na quadra?
                </p>

                {/* Angle selection buttons */}
                <div className="flex flex-col gap-2.5 mt-6">
                  {[
                    {
                      id: 'pos_fundo_baixo' as CameraPositionId,
                      title: 'Linha de Fundo Inferior',
                      desc: 'Atrás da linha de saque do seu lado',
                      icon: '📍',
                    },
                    {
                      id: 'pos_fundo_cima' as CameraPositionId,
                      title: 'Linha de Fundo Superior',
                      desc: 'Atrás da quadra adversária para bolas no fundo',
                      icon: '🎯',
                    },
                    {
                      id: 'pos_rede_esq' as CameraPositionId,
                      title: 'Visão da Rede (Antena Esquerda)',
                      desc: 'Foco na fita superior e toques no bloqueio',
                      icon: '🏐',
                    },
                    {
                      id: 'pos_rede_dir' as CameraPositionId,
                      title: 'Visão da Rede (Antena Direita)',
                      desc: 'Foco na antena direita e invasão por baixo',
                      icon: '📐',
                    },
                    {
                      id: 'pos_lateral' as CameraPositionId,
                      title: 'Lateral / Arquibancada',
                      desc: 'Visão panorâmica para toda a extensão',
                      icon: '🏟️',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleStartCameraRole(item.id)}
                      className="p-3.5 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/50 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-xl bg-gray-950 border border-gray-800">
                          {item.icon}
                        </span>
                        <div>
                          <strong className="text-sm font-bold text-gray-200 group-hover:text-white">
                            {item.title}
                          </strong>
                          <p className="text-[11px] text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setActiveScreen('home')}
                  className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-semibold text-xs border border-gray-800"
                >
                  Cancelar e Voltar
                </button>
              </div>
            </div>
          )}

          {/* ----------------- SCREEN 4: CAMERA RECORDING ----------------- */}
          {activeScreen === 'camera_recording' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <CameraView
                positionId={cameraPositionChoice}
                sport={sport}
                onExit={() => setActiveScreen('home')}
                isTriggered={isTransferringToMaster}
                onSelectPosition={(pos) => setCameraPositionChoice(pos)}
              />
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}
      {/* 1. Tactical VAR Review Suite */}
      <VarReviewModal
        isOpen={isVarModalOpen}
        onClose={() => setIsVarModalOpen(false)}
        sport={sport}
        cameras={cameras}
        onVerdictDecided={handleVerdictDecided}
      />

      {/* 2. Highlights Gallery */}
      <HighlightsGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        highlights={highlights}
        onDeleteHighlight={(id) => setHighlights((prev) => prev.filter((h) => h.id !== id))}
        weeklySavedCount={weeklySavedCount}
        tier={tier}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      {/* 3. Pro Tier Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        tier={tier}
        onToggleTier={(newTier) => {
          setTier(newTier);
          showToast(newTier === 'pro' ? 'Plano Pro ativado!' : 'Plano Free ativado.');
        }}
      />

      {/* 4. GitHub Roadmap & Specs Modal */}
      <GithubRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />
    </div>
  );
}
