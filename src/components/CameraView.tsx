import React, { useState, useEffect, useRef } from 'react';
import { CameraPositionId, SportType } from '../types';
import { drawSimulatedAngleFootage, CAMERA_POSITIONS } from '../utils/mockFootage';
import {
  Camera,
  Video,
  VideoOff,
  Radio,
  Clock,
  Battery,
  Wifi,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface CameraViewProps {
  positionId: CameraPositionId;
  sport: SportType;
  onExit: () => void;
  isTriggered: boolean;
  onSelectPosition: (pos: CameraPositionId) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  positionId,
  sport,
  onExit,
  isTriggered,
  onSelectPosition,
}) => {
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [bufferSeconds, setBufferSeconds] = useState(40.0);
  const [timeString, setTimeString] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const time = `${now.toTimeString().split(' ')[0]}.${ms}`;
      setTimeString(time);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Synthetic camera render loop
  useEffect(() => {
    if (useRealWebcam) return;

    let active = true;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = ((now - startTime) / 1000) % 40;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawSimulatedAngleFootage(
            ctx,
            canvasRef.current.width,
            canvasRef.current.height,
            positionId,
            sport,
            elapsed
          );
        }
      }
      if (active) requestAnimationFrame(loop);
    };

    const handle = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(handle);
    };
  }, [useRealWebcam, positionId, sport]);

  // Real webcam activation
  const startWebcam = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUseRealWebcam(true);
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      setWebcamError('Permissão de câmera não concedida. Usando feed simulado de alta precisão.');
      setUseRealWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseRealWebcam(false);
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const positionInfo = CAMERA_POSITIONS[positionId];

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-black text-gray-100 overflow-hidden select-none">
      
      {/* Flash transfer banner when Master hits VAR or Highlight */}
      {isTriggered && (
        <div className="absolute inset-0 z-50 bg-emerald-600/90 flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <RefreshCw className="w-16 h-16 text-white animate-spin mb-4" />
          <h2 className="text-2xl font-black text-white">CONGELANDO BUFFER (40s)...</h2>
          <p className="text-sm text-emerald-100 mt-2 font-mono">
            Transferindo pacotes de vídeo para o Celular Mestre via Hotspot Wi-Fi Local.
          </p>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="z-20 px-4 py-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="p-1.5 rounded-full bg-gray-900/80 hover:bg-gray-800 text-gray-300 border border-gray-700"
            title="Voltar ao início"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">
                BUFFER ATIVO (40s)
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">NTP Local: {timeString}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30">
            <Wifi className="w-3 h-3" /> Jam P2P
          </span>
          <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-0.5 rounded text-gray-300 border border-gray-700">
            <Battery className="w-3.5 h-3.5 text-emerald-400" /> 88%
          </span>
        </div>
      </div>

      {/* Center Feed Area (Canvas simulated or Real Webcam) */}
      <div className="relative flex-1 flex items-center justify-center bg-gray-950 overflow-hidden">
        {useRealWebcam ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            {/* Real Webcam HUD overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg border border-emerald-500/50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-300">
                WEBCAM REAL • {positionInfo.shortLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={720}
              height={480}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tactical Crosshair Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-24 h-24 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-400/80 rounded-full" />
          </div>
        </div>

        {/* OLED Battery Saver Notice overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur border border-gray-800 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-900 text-emerald-400 border border-gray-700">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-200">
                Posição: {positionInfo.label}
              </div>
              <p className="text-[10px] text-gray-400">
                Gravando silenciosamente em memória circular (últimos 40s).
              </p>
            </div>
          </div>

          {/* Real Camera vs Simulator Toggle */}
          <button
            onClick={() => {
              if (useRealWebcam) {
                stopWebcam();
              } else {
                startWebcam();
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
          >
            {useRealWebcam ? (
              <>
                <VideoOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulador</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webcam Real</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Angle Switcher & Jam Info */}
      <div className="z-20 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2">
        {webcamError && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] px-3 py-1 rounded-xl flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{webcamError}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 font-mono px-1">
          <span>Trocar Posição do Celular:</span>
          <span className="text-emerald-400 font-bold">Slot Vinculado</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {(['pos_fundo_baixo', 'pos_fundo_cima', 'pos_rede_esq', 'pos_rede_dir', 'pos_lateral'] as CameraPositionId[]).map(
            (pos) => (
              <button
                key={pos}
                onClick={() => onSelectPosition(pos)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all truncate ${
                  positionId === pos
                    ? 'bg-emerald-500 text-gray-950 font-bold shadow'
                    : 'bg-gray-900/90 text-gray-300 hover:bg-gray-800 border border-gray-800'
                }`}
              >
                {CAMERA_POSITIONS[pos].shortLabel}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
