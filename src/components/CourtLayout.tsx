import React, { useState, useRef } from 'react';
import { CameraDevice, SportType } from '../types';
import {
  Camera,
  Plus,
  Trash2,
  RotateCw,
  Compass,
  Check,
  Eye,
  Crosshair,
  Sparkles,
  Move,
  X,
  Target,
  Maximize,
} from 'lucide-react';

interface CourtLayoutProps {
  sport: SportType;
  cameras: CameraDevice[];
  onAddCameraAtPosition: (xPercent: number, yPercent: number, label: string) => void;
  onUpdateCameraPosition: (id: string, xPercent: number, yPercent: number) => void;
  onUpdateCameraRotation: (id: string, rotationDegrees: number) => void;
  onUpdateCameraLabel: (id: string, label: string) => void;
  onRemoveCamera: (id: string) => void;
  onSelectCameraPreview?: (cam: CameraDevice) => void;
  isPro: boolean;
  onOpenUpgradeModal: () => void;
}

export const CourtLayout: React.FC<CourtLayoutProps> = ({
  sport,
  cameras,
  onAddCameraAtPosition,
  onUpdateCameraPosition,
  onUpdateCameraRotation,
  onUpdateCameraLabel,
  onRemoveCamera,
  onSelectCameraPreview,
  isPro,
  onOpenUpgradeModal,
}) => {
  const isBeach = sport === 'beach_volleyball';
  const arenaContainerRef = useRef<HTMLDivElement | null>(null);

  // Crosshair placement mode
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  // Selected camera for configuration popover
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || null;

  // Dragging state
  const [draggingCameraId, setDraggingCameraId] = useState<string | null>(null);

  const activeCameras = cameras.filter((c) => c.status !== 'offline');
  const activeCount = activeCameras.length;

  // Calculates click or touch percentage relative to whole arena container (0% to 100%)
  const getCoordinatesFromEvent = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null => {
    if (!arenaContainerRef.current) return null;
    const rect = arenaContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  // Helper to suggest an automatic label based on position (inside vs outside lines)
  const getSuggestedLabel = (x: number, y: number) => {
    // Inner court boundary: X from 16% to 84%, Y from 12% to 88%
    const isOutsideX = x < 16 || x > 84;
    const isOutsideY = y < 12 || y > 88;
    const isOutside = isOutsideX || isOutsideY;

    if (x > 75 && y < 20) return 'Quina Adversário (Fora da Linha)';
    if (x < 25 && y < 20) return 'Quina Superior Esq (Fora da Linha)';
    if (x > 75 && y > 80) return 'Quina Fundo Dir (Fora da Linha)';
    if (x < 25 && y > 80) return 'Quina Fundo Esq (Fora da Linha)';

    if (y < 12) return 'Atrás da Linha de Fundo (Fora)';
    if (y > 88) return 'Atrás da Linha de Saque (Fora)';
    if (x < 16 && Math.abs(y - 50) < 15) return 'Lateral Rede Esq (Fora)';
    if (x > 84 && Math.abs(y - 50) < 15) return 'Lateral Rede Dir (Fora)';
    if (x < 16) return 'Lateral Esquerda (Fora)';
    if (x > 84) return 'Lateral Direita (Fora)';

    let side = y < 50 ? 'Lado Adversário' : 'Seu Lado';
    return `Câmera ${activeCount + 1} (${side})`;
  };

  // Handle click on arena (court or free zone)
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingCameraId) return; // Prevent creating while dragging
    const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
    if (!coords) return;

    if (!isPro && activeCount >= 2) {
      onOpenUpgradeModal();
      setIsPlacementMode(false);
      return;
    }

    const label = getSuggestedLabel(coords.x, coords.y);
    onAddCameraAtPosition(coords.x, coords.y, label);
    setIsPlacementMode(false);
  };

  // Drag and drop handlers (Mouse)
  const handleMouseDownCamera = (e: React.MouseEvent, camId: string) => {
    e.stopPropagation();
    setDraggingCameraId(camId);
    setSelectedCameraId(camId);
  };

  const handleMouseMoveArena = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingCameraId) return;
    const coords = getCoordinatesFromEvent(e.clientX, e.clientY);
    if (coords) {
      onUpdateCameraPosition(draggingCameraId, coords.x, coords.y);
    }
  };

  const handleMouseUpArena = () => {
    if (draggingCameraId) {
      setDraggingCameraId(null);
    }
  };

  // Drag and drop handlers (Touch for Mobile)
  const handleTouchStartCamera = (e: React.TouchEvent, camId: string) => {
    e.stopPropagation();
    setDraggingCameraId(camId);
    setSelectedCameraId(camId);
  };

  const handleTouchMoveArena = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingCameraId || e.touches.length === 0) return;
    const touch = e.touches[0];
    const coords = getCoordinatesFromEvent(touch.clientX, touch.clientY);
    if (coords) {
      onUpdateCameraPosition(draggingCameraId, coords.x, coords.y);
    }
  };

  const handleTouchEndArena = () => {
    if (draggingCameraId) {
      setDraggingCameraId(null);
    }
  };

  // Calculate auto rotation towards center of inner court (50%, 50%)
  const pointTowardsCenter = (cam: CameraDevice) => {
    const dx = 50 - cam.xPercent;
    const dy = 50 - cam.yPercent;
    let angleRad = Math.atan2(dy, dx);
    let deg = Math.round((angleRad * 180) / Math.PI);
    if (deg < 0) deg += 360;
    onUpdateCameraRotation(cam.id, deg);
  };

  // Calculate auto rotation towards net center (50%, 50%)
  const pointTowardsNet = (cam: CameraDevice) => {
    const targetY = 50; // Net is at 50%
    const dx = 50 - cam.xPercent;
    const dy = targetY - cam.yPercent;
    let angleRad = Math.atan2(dy, dx);
    let deg = Math.round((angleRad * 180) / Math.PI);
    if (deg < 0) deg += 360;
    onUpdateCameraRotation(cam.id, deg);
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Top Header & Actions Bar */}
      <div className="w-full flex items-center justify-between px-2 mb-2 text-xs font-mono text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-gray-200 font-bold uppercase tracking-wider text-[11px]">
            {isBeach ? '🏐 Vôlei Praia' : '🏐 Vôlei Quadra'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-gray-800/80 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20 text-[11px]">
            {activeCount} {activeCount === 1 ? 'Câmera Ativa' : 'Câmeras Ativas'}
          </span>
          {!isPro && (
            <button
              onClick={onOpenUpgradeModal}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30"
            >
              <Sparkles className="w-3 h-3" /> Limite: 2
            </button>
          )}
        </div>
      </div>

      {/* Button to toggle crosshair placement mode */}
      <div className="w-full flex items-center justify-between px-1 mb-2 gap-2">
        <button
          onClick={() => {
            if (!isPro && activeCount >= 2) {
              onOpenUpgradeModal();
              return;
            }
            setIsPlacementMode(!isPlacementMode);
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
            isPlacementMode
              ? 'bg-amber-500 text-gray-950 ring-2 ring-amber-400'
              : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
          }`}
        >
          {isPlacementMode ? (
            <>
              <Crosshair className="w-3.5 h-3.5 animate-spin" />
              <span>Toque dentro ou fora da quadra</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>+ Posicionar Câmera (Dentro ou Fora da Linha)</span>
            </>
          )}
        </button>
      </div>

      {/* ================= MAIN ARENA BOARD (INCLUI ZONA LIVRE EXTERNA E QUADRA) ================= */}
      <div
        ref={arenaContainerRef}
        onClick={handleArenaClick}
        onMouseMove={handleMouseMoveArena}
        onMouseUp={handleMouseUpArena}
        onTouchMove={handleTouchMoveArena}
        onTouchEnd={handleTouchEndArena}
        className={`relative w-full max-w-[340px] h-[410px] rounded-3xl p-3 bg-[#0d141e] border-2 border-gray-800 shadow-2xl flex items-center justify-center overflow-visible ${
          isPlacementMode ? 'cursor-crosshair ring-2 ring-amber-400/80' : 'cursor-pointer'
        }`}
      >
        {/* Subtle arena floor texture (Zona de escape externa) */}
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Free Zone / Zona Livre watermark indicators */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-500 font-bold uppercase tracking-widest pointer-events-none">
          ZONA LIVRE (FORA DA LINHA)
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-500 font-bold uppercase tracking-widest pointer-events-none">
          ÁREA DE TRIPÉS E BANCO (FORA)
        </div>

        {/* Placement Guide Banner when active */}
        {isPlacementMode && (
          <div className="absolute top-7 inset-x-4 z-40 bg-amber-500/90 text-gray-950 px-3 py-1 rounded-full text-center text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center justify-center gap-1 shadow-lg pointer-events-none">
            <Target className="w-3 h-3" /> Toque fora ou dentro das linhas brancas
          </div>
        )}

        {/* ================= OFFICIAL PLAYING COURT RECTANGLE (WITH WHITE BORDER) ================= */}
        {/* Occupies centered space (e.g. 68% width, 76% height) leaving the outer boundary clearly accessible */}
        <div
          style={{
            position: 'absolute',
            left: '16%',
            right: '16%',
            top: '12%',
            bottom: '12%',
          }}
          className={`rounded-lg border-[3.5px] border-white shadow-2xl pointer-events-none transition-colors duration-500 overflow-hidden ${
            isBeach ? 'beach-sand-pattern' : 'court-wood-pattern'
          }`}
        >
          {/* Subtle court grid / perspective styling */}
          <div className="absolute inset-0 bg-black/5" />

          {/* NET / REDE (Center line & Net band) */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center z-10">
            {/* Center court line */}
            <div className="w-full h-1 bg-white shadow-sm" />
            {/* Net mesh overlay */}
            <div className="absolute inset-x-0 -top-3 h-6 bg-white/25 backdrop-blur-[0.5px] border-y-2 border-white flex items-center justify-between px-1">
              <span className="text-[7px] font-mono font-black text-red-600 bg-white px-0.5 rounded-sm shadow">
                ANT-ESQ
              </span>
              <span className="text-[8px] font-black tracking-widest text-black/80 uppercase">
                REDE CENTRAL
              </span>
              <span className="text-[7px] font-mono font-black text-red-600 bg-white px-0.5 rounded-sm shadow">
                ANT-DIR
              </span>
            </div>
          </div>

          {/* ATTACK LINES (3m) - Only for Indoor Court */}
          {!isBeach && (
            <>
              {/* Top team attack line */}
              <div className="absolute top-[33.3%] left-0 right-0 h-1 bg-white/90 border-b border-black/10">
                <span className="absolute right-1 -top-3 text-[7px] font-mono text-white/90 drop-shadow">
                  3M
                </span>
              </div>
              {/* Bottom team attack line */}
              <div className="absolute top-[66.6%] left-0 right-0 h-1 bg-white/90 border-t border-black/10">
                <span className="absolute right-1 top-1 text-[7px] font-mono text-white/90 drop-shadow">
                  3M
                </span>
              </div>
            </>
          )}

          {/* Team Zone Watermarks */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/20 font-black text-[10px] tracking-widest uppercase">
            LADO ADVERSÁRIO
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 font-black text-[10px] tracking-widest uppercase">
            SEU LADO
          </div>
        </div>

        {/* Net Posts extending beyond the white sidelines into the Free Zone (Realistic physics) */}
        <div
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          className="absolute inset-x-2 flex justify-between items-center pointer-events-none z-10"
        >
          <div className="w-3 h-5 bg-gray-600 rounded-sm border border-gray-400 shadow flex items-center justify-center">
            <div className="w-1 h-3 bg-red-500 rounded-full" />
          </div>
          <div className="w-3 h-5 bg-gray-600 rounded-sm border border-gray-400 shadow flex items-center justify-center">
            <div className="w-1 h-3 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* ================= DYNAMIC CAMERAS (PLACED INSIDE OR OUTSIDE COURT) ================= */}
        {activeCameras.map((cam) => {
          const isSelected = selectedCameraId === cam.id;
          const isDragging = draggingCameraId === cam.id;
          const rot = cam.rotationDegrees ?? 0;

          // Check if camera is placed outside the white line
          const isOutside =
            cam.xPercent < 16 || cam.xPercent > 84 || cam.yPercent < 12 || cam.yPercent > 88;

          return (
            <div
              key={cam.id}
              onMouseDown={(e) => handleMouseDownCamera(e, cam.id)}
              onTouchStart={(e) => handleTouchStartCamera(e, cam.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCameraId(cam.id);
              }}
              style={{
                left: `${cam.xPercent}%`,
                top: `${cam.yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-30 flex flex-col items-center group cursor-grab active:cursor-grabbing transition-transform ${
                isDragging ? 'scale-110 z-50' : 'hover:scale-105'
              }`}
            >
              {/* LENS FOV CONE (Light cone pointing towards the court) */}
              <div
                style={{
                  transform: `rotate(${rot}deg)`,
                  transformOrigin: 'top center',
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none w-36 h-36 flex justify-center"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-28 h-28 overflow-visible opacity-50 group-hover:opacity-80 transition-opacity"
                >
                  <defs>
                    <linearGradient id={`fov-grad-${cam.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="50,0 10,95 90,95"
                    fill={`url(#fov-grad-${cam.id})`}
                  />
                  {/* Direction arrow line */}
                  <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="65"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>

              {/* Pulsing Radar Ring (Green) */}
              <span className="absolute -inset-1 rounded-2xl bg-emerald-400/40 animate-ping pointer-events-none" />

              {/* Camera Pin Node */}
              <div
                className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-2xl relative ${
                  isSelected
                    ? 'bg-gradient-to-tr from-emerald-500 to-green-300 text-gray-950 ring-4 ring-emerald-400 scale-105'
                    : isOutside
                    ? 'bg-gray-900/95 text-emerald-400 border-2 border-emerald-500 shadow-emerald-500/20'
                    : 'bg-gray-900/95 text-amber-300 border-2 border-amber-400/90 shadow-amber-400/20'
                }`}
                title={`${cam.customLabel || cam.name} - Clique para configurar`}
              >
                <Camera className="w-4 h-4 fill-current" />
                <span className="text-[7px] font-mono font-black leading-none mt-0.5">40s</span>

                {/* Battery / FPS indicator badge */}
                <div className="absolute -top-1.5 -right-1.5 bg-gray-950 border border-emerald-500 text-[7px] font-mono text-emerald-400 px-1 rounded-full shadow">
                  {cam.fps}f
                </div>

                {/* Outside vs Inside Tag */}
                {isOutside && (
                  <div className="absolute -bottom-1.5 -left-1 bg-emerald-950 border border-emerald-500/80 text-[6px] font-mono text-emerald-300 px-0.5 rounded">
                    FORA
                  </div>
                )}
              </div>

              {/* Label Tag below pin */}
              <div className="mt-1 flex items-center gap-1 bg-black/90 backdrop-blur px-2 py-0.5 rounded-full border border-gray-700 shadow-md text-[9px] font-semibold text-gray-200 whitespace-nowrap pointer-events-none max-w-[120px] truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${isOutside ? 'bg-emerald-400' : 'bg-amber-400'} shadow-sm`} />
                <span className="truncate">{cam.customLabel || cam.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Help Below Court */}
      <p className="text-[11px] text-gray-400 mt-2 text-center px-4">
        Toque <span className="text-emerald-400 font-semibold">fora das linhas brancas</span> (na zona livre)
        ou dentro da quadra e arraste livremente o tripé.
      </p>

      {/* ================= CAMERA SETTINGS DRAWER / POPOVER ================= */}
      {selectedCamera && (
        <div className="w-full max-w-[340px] mt-3 p-3.5 bg-gray-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-bottom-2">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <input
                type="text"
                value={selectedCamera.customLabel || selectedCamera.name}
                onChange={(e) => onUpdateCameraLabel(selectedCamera.id, e.target.value)}
                placeholder="Nome do ângulo..."
                className="bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg px-2 py-0.5 text-xs font-bold text-white max-w-[160px] outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onRemoveCamera(selectedCamera.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Remover câmera"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedCameraId(null)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Coordinates & Zone Indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 bg-gray-950/70 p-1.5 rounded-xl border border-gray-800">
            <span>
              Posição: <strong className="text-gray-200">X: {selectedCamera.xPercent}% | Y: {selectedCamera.yPercent}%</strong>{' '}
              {selectedCamera.xPercent < 16 || selectedCamera.xPercent > 84 || selectedCamera.yPercent < 12 || selectedCamera.yPercent > 88 ? (
                <span className="text-emerald-400 font-bold">(Fora da Linha)</span>
              ) : (
                <span className="text-amber-400 font-bold">(Dentro da Linha)</span>
              )}
            </span>
            <span>
              Lente: <strong className="text-emerald-400">{selectedCamera.rotationDegrees}°</strong>
            </span>
          </div>

          {/* Quick Direction Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-400" /> Direção da Lente (Para onde filma):
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => pointTowardsCenter(selectedCamera)}
                className="py-1 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Target className="w-3 h-3 text-emerald-400" />
                <span>Apontar Centro da Quadra</span>
              </button>

              <button
                onClick={() => pointTowardsNet(selectedCamera)}
                className="py-1 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCw className="w-3 h-3 text-sky-400" />
                <span>Apontar para a Rede</span>
              </button>
            </div>

            {/* Rotation slider */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-gray-400">0°</span>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={selectedCamera.rotationDegrees}
                onChange={(e) =>
                  onUpdateCameraRotation(selectedCamera.id, parseInt(e.target.value, 10))
                }
                className="w-full accent-emerald-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-gray-400">360°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
