import { chooseCamera, reconcileSlots, toggleComparison, ReplaySlots } from '../utils/replaySlots';
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
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
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


  // Active angle
  const activeCameras = cameras.filter((c) => c.positionId && c.status !== 'offline');
  const [slotState, setSlotState] = useState<ReplaySlots>({a:activeCameras[0]?.id??'',b:activeCameras[1]?.id??'',active:'a',split:false});
  const slots = reconcileSlots(slotState,activeCameras.map(c=>c.id));
  const selectedCameraId = slots.a;
  const isSplitView = slots.split;
  const focusedCameraId = slots.active === 'b' ? slots.b : slots.a;
  const setFocusedCameraId = (id:string) => setSlotState({...slots,active:id===slots.b&&slots.split?'b':'a'});
  const selectedCamera = activeCameras.find(c => c.id === selectedCameraId) ?? activeCameras[0];
  const cameraName = (id: string) => {
    const camera = cameras.find(item => item.id === id);
    return camera?.customLabel?.trim() || camera?.name?.trim() || `Câmera ${Math.max(0, cameras.findIndex(item => item.id === id)) + 1}`;
  };
  const selectedPosId = selectedCamera?.positionId ?? 'pos_fundo_baixo';
  const secondCamera = activeCameras.find(c => c.id === slots.b);

  // Playback state (0 to 40 seconds)
  const [currentTime, setCurrentTime] = useState<number>(38.5); // Default to near the crucial 38.5s spike moment
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0.25); // Default slow-mo 0.25x

  // Zoom & Pan
  type View = { zoom: number; x: number; y: number };
  const [views, setViews] = useState<Record<string, View>>({});
  const getView = (id: string): View => views[id] ?? {zoom: 1, x: 0, y: 0};
  const viewId = focusedCameraId || selectedCameraId;
  const view = getView(viewId);
  const updateView = (id: string, change: (value: View) => View) => setViews(previous => {
    const next = change(previous[id] ?? {zoom:1,x:0,y:0});
    const maxX = 480 * (next.zoom - 1), maxY = 270 * (next.zoom - 1);
    return {...previous, [id]: {...next, x: Math.max(-maxX,Math.min(maxX,next.x)), y:Math.max(-maxY,Math.min(maxY,next.y))}};
  });
  const panDrag = useRef<{id:string;pointer:number;clientX:number;clientY:number;x:number;y:number} | null>(null);
  const pan = (x:number,y:number) => updateView(viewId,v=>({...v,x:v.x+x,y:v.y+y}));

  // Annotations
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>('none');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLineStart, setCurrentLineStart] = useState<{ x: number; y: number } | null>(null);

  // Split view toggle
  useEffect(() => {
    setSlotState(previous => {
      const next = reconcileSlots(previous,activeCameras.map(c=>c.id));
      return JSON.stringify(next) === JSON.stringify(previous) ? previous : next;
    });
  }, [activeCameras.map(c=>c.id).join('|')]);
  useEffect(() => { setAnnotations([]); setIsDrawing(false); setCurrentLineStart(null); panDrag.current=null; }, [slots.a, slots.b]);
  useEffect(() => { if(!activeCameras.length)setIsPlaying(false); }, [activeCameras.length]);

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
          ctx.clearRect(0,0,cvs.width,cvs.height);
          const v = getView(selectedCameraId);
          ctx.translate(cvs.width / 2 + v.x, cvs.height / 2 + v.y);
          ctx.scale(v.zoom, v.zoom);
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
          const v = getView(secondCamera?.id ?? '');
          ctx2.clearRect(0,0,cvs2.width,cvs2.height);
          ctx2.save();
          ctx2.translate(480 + v.x, 270 + v.y); ctx2.scale(v.zoom,v.zoom); ctx2.translate(-480,-270);
          drawSimulatedAngleFootage(ctx2, cvs2.width, cvs2.height, secondCamera?.positionId ?? 'pos_fundo_baixo', sport, currentTime, speed < 1);
          ctx2.restore();
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
  }, [isPlaying, speed, selectedPosId, sport, currentTime, views, selectedCameraId, secondCamera?.id, annotations, isSplitView]);

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
  const handleCanvasMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (annotationMode === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const v = getView(selectedCameraId);
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width) - 480 - v.x) / v.zoom + 480;
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height) - 270 - v.y) / v.zoom + 270;

    if (annotationMode === 'touch') {
      setAnnotations((prev) => [...prev, { type: 'touch', x, y, color: '#22c55e' }]);
    } else if (annotationMode === 'circle') {
      setAnnotations((prev) => [...prev, { type: 'circle', x, y, color: '#ef4444' }]);
    } else if (annotationMode === 'line') {
      setIsDrawing(true);
      setCurrentLineStart({ x, y });
    }
  };

  const handleCanvasMouseUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLineStart || annotationMode !== 'line') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const v = getView(selectedCameraId);
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width) - 480 - v.x) / v.zoom + 480;
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height) - 270 - v.y) / v.zoom + 270;

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

  const cameraCanvas = (id:string, secondary = false) => <div className={`replay-angle ${viewId === id ? 'active' : ''}`}>
    <button className="replay-angle-label" aria-pressed={viewId === id} onClick={()=>setFocusedCameraId(id)} title={cameraName(id)}><span>{isSplitView ? `${secondary?'B':'A'} · ` : ''}{cameraName(id)}</span><span> · {getView(id).zoom}×</span></button>
    <canvas ref={secondary ? splitCanvasRef : canvasRef} width={960} height={540}
      aria-label={`Imagem de ${cameraName(id)}. Amplie para arrastar ou use os botões de direção.`}
      style={{touchAction:getView(id).zoom > 1 || annotationMode !== 'none' ? 'none' : 'pan-y',cursor:getView(id).zoom>1?'grab':'default'}}
      onPointerDown={event=>{
        setFocusedCameraId(id);
        if (!secondary && annotationMode !== 'none') { handleCanvasMouseDown(event); return; }
        if (getView(id).zoom <= 1) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const v=getView(id);panDrag.current={id,pointer:event.pointerId,clientX:event.clientX,clientY:event.clientY,x:v.x,y:v.y};
      }}
      onPointerMove={event=>{
        const drag=panDrag.current;if(!drag || drag.id!==id || drag.pointer!==event.pointerId)return;
        const rect=event.currentTarget.getBoundingClientRect();
        updateView(id,v=>({...v,x:drag.x+(event.clientX-drag.clientX)*960/rect.width,y:drag.y+(event.clientY-drag.clientY)*540/rect.height}));
      }}
      onPointerUp={event=>{panDrag.current=null;if(!secondary)handleCanvasMouseUp(event);}}
      onPointerCancel={()=>{panDrag.current=null;setIsDrawing(false);setCurrentLineStart(null);}}
      onLostPointerCapture={()=>{panDrag.current=null;}}
    />
  </div>;

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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onVerdictDecided(verdict, `Decisão pelo VAR em ${currentTime.toFixed(2)}s`);
  };

  if (!isOpen) return null;
  return <div className="replay-overlay"><section className="replay-panel">
    <header className="replay-header"><div><h2>Revisar lance</h2><p>Vídeo simulado · 40 segundos</p></div><button className="icon-button" aria-label="Fechar revisão" onClick={onClose}><X size={22}/></button></header>
    <div className="replay-content"><div className={`replay-video ${isSplitView?'split-video':''}`}>
      {selectedCamera && cameraCanvas(selectedCamera.id)}
      {isSplitView && secondCamera && cameraCanvas(secondCamera.id,true)}
    </div>
    {!activeCameras.length && <p role="status">Nenhuma câmera disponível para revisão.</p>}
    <fieldset className="replay-session-controls" disabled={!activeCameras.length}>
    <p className="angle-instruction">{isSplitView ? `Escolha uma câmera para o quadro ${slots.active.toUpperCase()}` : "Escolha a câmera para revisar"}</p>
    <div className="angle-selector" aria-label="Ângulo de revisão">{activeCameras.map((cam)=><button key={cam.id} aria-pressed={viewId===cam.id} onFocus={event=>event.currentTarget.scrollIntoView({block:'nearest',inline:'nearest'})} onClick={()=>setSlotState(chooseCamera(slots,cam.id))} title={cameraName(cam.id)}>{`Cam ${cameras.findIndex(c=>c.id===cam.id)+1} · ${cameraName(cam.id)}`}{isSplitView && (slots.a===cam.id||slots.b===cam.id) && <span className="slot-badge">{slots.a===cam.id?'A':'B'}</span>}</button>)}</div>
    <div className="replay-time"><span>{currentTime.toFixed(2)} <span>/ 40 s</span></span><button disabled={activeCameras.length<2} onClick={()=>setSlotState(toggleComparison(slots,activeCameras.map(c=>c.id)))} aria-pressed={isSplitView}><Layers size={17}/>{isSplitView?'Um ângulo':'Comparar ângulos'}</button></div>
    <input className="replay-slider" type="range" min="0" max="40" step="0.0166" value={currentTime} aria-label="Posição no replay em segundos" onChange={e=>{setIsPlaying(false);setCurrentTime(+e.target.value);}}/>
    <div className="playback-controls"><label className="speed-control"><span className="sr-only">Velocidade</span><select value={speed} onChange={e=>setSpeed(+e.target.value)}>{[.1,.25,.5,1].map(v=><option key={v} value={v}>{String(v).replace('.',',')}×</option>)}</select></label><button aria-label="Voltar um quadro" onClick={()=>stepFrame(-1)}><ChevronLeft size={25}/></button><button className="play-button" aria-label={isPlaying?'Pausar':'Reproduzir'} onClick={()=>setIsPlaying(!isPlaying)}>{isPlaying?<Pause size={30}/>:<Play size={30}/>}</button><button aria-label="Avançar um quadro" onClick={()=>stepFrame(1)}><ChevronRight size={25}/></button><button aria-label="Ampliar vídeo" disabled={view.zoom>=3} onClick={()=>updateView(viewId,v=>({...v,zoom:Math.min(3,v.zoom+.5)}))}><ZoomIn size={22}/><span>{view.zoom}×</span></button></div>
    <div className="replay-pan" role="group" aria-label="Enquadramento da câmera selecionada">
      <p>Enquadramento · {cameraName(viewId)}</p>
      <span>Amplie e arraste a imagem ou use as setas. Apenas esta câmera se move.</span>
      <div className="replay-pan-buttons">
        <button aria-label="Reduzir vídeo" disabled={view.zoom<=1} onClick={()=>updateView(viewId,v=>({...v,zoom:Math.max(1,v.zoom-.5)}))}><ZoomOut size={20}/></button>
        <button aria-label="Mover imagem para a esquerda" disabled={view.zoom<=1} onClick={()=>pan(-60,0)}><ArrowLeft size={20}/></button>
        <button aria-label="Mover imagem para cima" disabled={view.zoom<=1} onClick={()=>pan(0,-60)}><ArrowUp size={20}/></button>
        <button aria-label="Mover imagem para baixo" disabled={view.zoom<=1} onClick={()=>pan(0,60)}><ArrowDown size={20}/></button>
        <button aria-label="Mover imagem para a direita" disabled={view.zoom<=1} onClick={()=>pan(60,0)}><ArrowRight size={20}/></button>
        <button aria-label="Redefinir enquadramento desta câmera" onClick={()=>updateView(viewId,()=>({zoom:1,x:0,y:0}))}><RotateCcw size={20}/></button>
      </div>
    </div>
    <details className="replay-tools"><summary>Marcações e decisão</summary><div className="drawing-tools"><button aria-pressed={annotationMode==='line'} onClick={()=>setAnnotationMode(annotationMode==='line'?'none':'line')}><PenTool size={17}/>Traçar linha</button><button aria-pressed={annotationMode==='touch'} onClick={()=>setAnnotationMode(annotationMode==='touch'?'none':'touch')}>Marcar toque</button><button onClick={()=>{setAnnotations([]);updateView(viewId,()=>({zoom:1,x:0,y:0}));}}><RotateCcw size={17}/>Limpar</button></div><p>As marcações são visuais e não detectam faltas automaticamente.</p><div className="verdict-options">{([{id:'IN',label:'Bola dentro'},{id:'OUT',label:'Bola fora'},{id:'TOUCH_BLOCK',label:'Toque no bloqueio'},{id:'TOUCH_NET',label:'Toque na rede'},{id:'INVASION',label:'Invasão'},{id:'CONFIRMED',label:'Confirmar ponto'}] as {id:VarVerdict,label:string}[]).map(v=><button key={v.id} aria-pressed={selectedVerdict===v.id} onClick={()=>handleConfirmVerdict(v.id)}>{v.label}</button>)}</div>{verdictConfirmed && <p role="status">Decisão registrada nesta demonstração.</p>}</details>
    </fieldset>
    <button className="primary-button resume-button" onClick={onClose}>Retomar partida <ChevronRight size={20}/></button>
    </div>
  </section></div>;
};
