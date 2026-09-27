import React, { useState, useEffect, useRef } from 'react';
import { CameraDevice, CameraPositionId, SportType, VarVerdict } from '../types';
import { drawSimulatedAngleFootage, CAMERA_POSITIONS } from '../utils/mockFootage';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  Camera,
  Share2,
} from 'lucide-react';

interface VarReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sport: SportType;
  cameras: CameraDevice[];
  onVerdictDecided: (verdict: VarVerdict, notes: string) => void;
}

type AnnotationMode = 'none' | 'line' | 'circle' | 'touch';

interface AnnotationItem {
  type: AnnotationMode;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  color: string;
}

export const VarReviewModal: React.FC<VarReviewModalProps> = ({
  isOpen,
  onClose,
  sport,
  cameras,
  onVerdictDecided,
}) => {
  if (!isOpen) return null;

  // Active angle
  const activeCameras = cameras.filter((c) => c.positionId && c.status !== 'offline');
  const [selectedPosId, setSelectedPosId] = useState<CameraPositionId>(
    activeCameras[0]?.positionId || 'pos_fundo_baixo'
  );

  // Playback state (0 to 40 seconds)
  const [currentTime, setCurrentTime] = useState<number>(38.5); // Default to near the crucial 38.5s spike moment
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0.25); // Default slow-mo 0.25x

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0, 1.5, 2.0, 3.0
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Annotations
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>('none');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLineStart, setCurrentLineStart] = useState<{ x: number; y: number } | null>(null);

  // Split view toggle
  const [isSplitView, setIsSplitView] = useState(false);

  // Verdict state
  const [selectedVerdict, setSelectedVerdict] = useState<VarVerdict | null>(null);
  const [verdictConfirmed, setVerdictConfirmed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Render loop for playback & canvas
  useEffect(() => {
    let active = true;

    const render = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          let next = prev + delta * speed;
          if (next >= 40) next = 0;
          return next;
        });
      }

      // Draw Main Canvas
      if (canvasRef.current) {
        const cvs = canvasRef.current;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.save();
          // Apply digital zoom and pan
          ctx.translate(cvs.width / 2 + panOffset.x, cvs.height / 2 + panOffset.y);
          ctx.scale(zoomLevel, zoomLevel);
          ctx.translate(-cvs.width / 2, -cvs.height / 2);

          drawSimulatedAngleFootage(
            ctx,
            cvs.width,
            cvs.height,
            selectedPosId,
            sport,
            currentTime,
            speed < 1.0
          );

          // Draw annotations on top
          drawAnnotations(ctx, annotations);

          ctx.restore();
        }
      }

      // If split view is enabled, draw second angle
      if (isSplitView && splitCanvasRef.current) {
        const cvs2 = splitCanvasRef.current;
        const ctx2 = cvs2.getContext('2d');
        if (ctx2) {
          const secondPos: CameraPositionId =
            selectedPosId === 'pos_fundo_baixo' ? 'pos_rede_esq' : 'pos_fundo_baixo';
          drawSimulatedAngleFootage(ctx2, cvs2.width, cvs2.height, secondPos, sport, currentTime, true);
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, selectedPosId, sport, currentTime, zoomLevel, panOffset, annotations, isSplitView]);

  const drawAnnotations = (ctx: CanvasRenderingContext2D, items: AnnotationItem[]) => {
    for (const item of items) {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = 3;

      if (item.type === 'line' && item.x2 !== undefined && item.y2 !== undefined) {
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Arrow head or end dot
        ctx.beginPath();
        ctx.arc(item.x2, item.y2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'circle') {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
      } else if (item.type === 'touch') {
        // Crosshair marker
        const s = 14;
        ctx.beginPath();
        ctx.moveTo(item.x - s, item.y);
        ctx.lineTo(item.x + s, item.y);
        ctx.moveTo(item.x, item.y - s);
        ctx.lineTo(item.x, item.y + s);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
      }
    }
  };

  // Canvas Mouse / Touch events for drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (annotationMode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (annotationMode === 'touch') {
      setAnnotations((prev) => [...prev, { type: 'touch', x, y, color: '#22c55e' }]);
    } else if (annotationMode === 'circle') {
      setAnnotations((prev) => [...prev, { type: 'circle', x, y, color: '#ef4444' }]);
    } else if (annotationMode === 'line') {
      setIsDrawing(true);
      setCurrentLineStart({ x, y });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLineStart || annotationMode !== 'line') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setAnnotations((prev) => [
      ...prev,
      {
        type: 'line',
        x: currentLineStart.x,
        y: currentLineStart.y,
        x2: x,
        y2: y,
        color: '#38bdf8',
      },
    ]);
    setIsDrawing(false);
    setCurrentLineStart(null);
  };

  // Step 1 frame (approx 1/60s = 0.016s)
  const stepFrame = (frames: number) => {
    setIsPlaying(false);
    setCurrentTime((prev) => {
      const next = prev + frames * 0.0166;
      return Math.max(0, Math.min(40, next));
    });
  };

  // Confirm official verdict
  const handleConfirmVerdict = (verdict: VarVerdict) => {
    setSelectedVerdict(verdict);
    setVerdictConfirmed(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onVerdictDecided(verdict, `Decisão pelo VAR em ${currentTime.toFixed(2)}s`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[96vh] flex flex-col bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-gray-100">
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-red-950/80 via-gray-900 to-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded tracking-wider uppercase">
                VAR OFICIAL
              </span>
              <h2 className="font-bold text-sm sm:text-base text-gray-100 flex items-center gap-1.5">
                Revisão Tática de Arbitragem
              </h2>
            </div>
            <span className="hidden sm:inline-block text-xs font-mono text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
              Buffer: 40 segundos congelados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                isSplitView
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
              title="Comparar dois ângulos simultâneos"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split 2 Ângulos</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Angle Selector Tabs */}
        <div className="px-4 py-2 bg-gray-900/70 border-b border-gray-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider shrink-0">
            Ângulos do Jam ({activeCameras.length}):
          </span>
          {activeCameras.length > 0 ? (
            activeCameras.map((cam) => {
              const posId = cam.positionId || 'pos_fundo_baixo';
              const active = selectedPosId === posId;
              const label = cam.customLabel || cam.name || CAMERA_POSITIONS[posId]?.shortLabel;
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedPosId(posId)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    active
                      ? 'bg-emerald-500 text-gray-950 font-bold shadow-lg shadow-emerald-500/20'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700/60'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>{label}</span>
                  <span className="text-[9px] font-mono opacity-80">({cam.xPercent}%, {cam.yPercent}%)</span>
                </button>
              );
            })
          ) : (
            (['pos_fundo_baixo', 'pos_fundo_cima', 'pos_rede_esq'] as CameraPositionId[]).map((posId) => (
              <button
                key={posId}
                onClick={() => setSelectedPosId(posId)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  selectedPosId === posId
                    ? 'bg-emerald-500 text-gray-950 font-bold'
                    : 'bg-gray-800/80 text-gray-300'
                }`}
              >
                <Camera className="w-3 h-3" />
                {CAMERA_POSITIONS[posId].shortLabel}
              </button>
            ))
          )}
        </div>

        {/* Video Player Display Area */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[380px] bg-black flex items-center justify-center overflow-hidden p-2">
          {isSplitView ? (
            <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden flex flex-col">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-contain"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={handleCanvasMouseUp}
                />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                  ÂNGULO 1: {CAMERA_POSITIONS[selectedPosId]?.shortLabel}
                </div>
              </div>
              <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden flex flex-col">
                <canvas
                  ref={splitCanvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-sky-400">
                  ÂNGULO 2: SINCRONIZADO
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={720}
                height={400}
                className="max-h-[380px] w-auto aspect-video rounded-xl shadow-2xl border border-gray-800 cursor-crosshair object-contain"
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
              />

              {/* Zoom & Pan Indicator Badge */}
              {zoomLevel > 1 && (
                <div className="absolute top-4 left-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-mono">
                  ZOOM: {zoomLevel.toFixed(1)}x
                </div>
              )}
            </div>
          )}

          {/* Verdict Stamped Notification Overlay */}
          {verdictConfirmed && selectedVerdict && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in zoom-in-95">
              <div className="bg-gray-900 border-2 border-emerald-500 rounded-2xl p-6 text-center max-w-sm shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3 animate-bounce" />
                <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                  Veredito Oficial Registrado
                </span>
                <h3 className="text-2xl font-black text-white mt-1 mb-2">
                  {selectedVerdict === 'IN' && '🏐 BOLA DENTRO!'}
                  {selectedVerdict === 'OUT' && '🔴 BOLA FORA!'}
                  {selectedVerdict === 'TOUCH_BLOCK' && '🧤 TOQUE NO BLOQUEIO!'}
                  {selectedVerdict === 'TOUCH_NET' && '⚠️ TOQUE NA REDE!'}
                  {selectedVerdict === 'INVASION' && '🚫 INVASÃO DE LINHA!'}
                  {selectedVerdict === 'CONFIRMED' && '✅ PONTO CONFIRMADO!'}
                  {selectedVerdict === 'OVERTURNED' && '🔄 DECISÃO REVERTIDA!'}
                </h3>
                <p className="text-xs text-gray-300 mb-5">
                  Lance revisado com base no buffer multi-ângulo sincronizado de 40s.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVerdictConfirmed(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200"
                  >
                    Continuar Análise
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-gray-950"
                  >
                    Fechar VAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tactical Controls & Scrubber */}
        <div className="px-4 py-3 bg-gray-900/95 border-t border-gray-800 flex flex-col gap-3">
          
          {/* Scrubber Bar (40s buffer) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">
                  {currentTime.toFixed(2)}s
                </span>
                <span className="text-gray-500">/ 40.00s</span>
              </div>
              <div className="text-[11px] text-gray-400">
                Ponto de Impacto estimado: <span className="text-amber-400 font-semibold">38.45s</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={0.02}
              value={currentTime}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="w-full accent-emerald-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Control Buttons Grid */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Play, Pause, Frame-by-Frame */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2.5 rounded-xl font-bold transition-all shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-gray-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                }`}
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => stepFrame(-1)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs flex items-center gap-0.5"
                title="Voltar 1 Frame"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px] font-mono">-1f</span>
              </button>

              <button
                onClick={() => stepFrame(1)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs flex items-center gap-0.5"
                title="Avançar 1 Frame"
              >
                <span className="text-[10px] font-mono">+1f</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentTime(38.0);
                  setIsPlaying(false);
                }}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs"
                title="Pular para o Momento da Decisão (38s)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Slow-mo Speed Selector */}
            <div className="flex items-center gap-1 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
              <span className="text-[10px] font-mono text-gray-400 px-1">VELOCIDADE:</span>
              {[
                { label: '0.1x', val: 0.1 },
                { label: '0.25x', val: 0.25 },
                { label: '0.5x', val: 0.5 },
                { label: '1.0x', val: 1.0 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setSpeed(item.val)}
                  className={`px-2 py-0.5 text-xs rounded-lg font-mono font-bold transition-colors ${
                    speed === item.val
                      ? 'bg-emerald-500 text-gray-950'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Digital Zoom & Drawing Tools */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-gray-800 p-1 rounded-xl border border-gray-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.5))}
                  className="p-1 hover:text-emerald-400 text-gray-300 rounded"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1.0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1 hover:text-emerald-400 text-gray-300 rounded"
                  title="Resetar Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Annotation Tools */}
              <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
                <button
                  onClick={() => setAnnotationMode(annotationMode === 'line' ? 'none' : 'line')}
                  className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 ${
                    annotationMode === 'line'
                      ? 'bg-sky-500 text-gray-950 font-bold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Traçar Linha Laser de Quadra"
                >
                  <PenTool className="w-3 h-3" /> Linha
                </button>
                <button
                  onClick={() => setAnnotationMode(annotationMode === 'touch' ? 'none' : 'touch')}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    annotationMode === 'touch'
                      ? 'bg-emerald-500 text-gray-950 font-bold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Marcar Ponto de Toque"
                >
                  Toque
                </button>
                {annotations.length > 0 && (
                  <button
                    onClick={() => setAnnotations([])}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Limpar anotações"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Official Verdict Buttons Bar */}
          <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Decisão do Árbitro:
            </span>

            <button
              onClick={() => handleConfirmVerdict('IN')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all hover:scale-105"
            >
              🏐 Bola DENTRO
            </button>
            <button
              onClick={() => handleConfirmVerdict('OUT')}
              className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow transition-all hover:scale-105"
            >
              🔴 Bola FORA
            </button>
            <button
              onClick={() => handleConfirmVerdict('TOUCH_BLOCK')}
              className="px-3 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all hover:scale-105"
            >
              🧤 Toque Bloqueio
            </button>
            <button
              onClick={() => handleConfirmVerdict('TOUCH_NET')}
              className="px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all hover:scale-105"
            >
              ⚠️ Toque na Rede
            </button>
            <button
              onClick={() => handleConfirmVerdict('INVASION')}
              className="px-3 py-1.5 rounded-xl bg-orange-600/90 hover:bg-orange-500 text-white font-bold text-xs shadow transition-all hover:scale-105"
            >
              🚫 Invasão
            </button>
            <button
              onClick={() => handleConfirmVerdict('CONFIRMED')}
              className="px-3 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold text-xs transition-all"
            >
              Confirmar Ponto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
