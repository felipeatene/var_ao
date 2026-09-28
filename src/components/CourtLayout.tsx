import React, { useRef, useState } from 'react';
import { CameraDevice, SportType } from '../types';
import { Plus, RotateCw, Trash2, X } from 'lucide-react';

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

export const CourtLayout: React.FC<CourtLayoutProps> = (props) => {
  const { sport, cameras, onAddCameraAtPosition, onUpdateCameraPosition, onUpdateCameraRotation, onUpdateCameraLabel, onRemoveCamera, isPro, onOpenUpgradeModal } = props;
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const selected = cameras.find(camera => camera.id === selectedId);
  const point = (x: number, y: number) => {
    const rect = board.current!.getBoundingClientRect();
    return [Math.max(6, Math.min(94, (x-rect.left)/rect.width*100)), Math.max(6, Math.min(94, (y-rect.top)/rect.height*100))];
  };
  const add = (x=50,y=92) => { onAddCameraAtPosition(x,y,`Câmera ${cameras.length+1}`); setPlacing(false); };
  return <div className="court-editor">
    <div className={`court-map ${sport === 'beach_volleyball'?'court-beach':''}`} ref={board}
      onPointerMove={event => { if (dragging.current) { const [x,y]=point(event.clientX,event.clientY); onUpdateCameraPosition(dragging.current,x,y); } }}
      onPointerUp={() => { dragging.current=null; }}
      onPointerCancel={() => { dragging.current=null; }}
      onClick={event => { if(placing && event.target === event.currentTarget) {const [x,y]=point(event.clientX,event.clientY);add(x,y);} }}>
      <svg viewBox="0 0 320 440" role="img" aria-label={`Mapa de vôlei de ${sport === 'beach_volleyball'?'praia':'quadra'}`} className="court-drawing">
        <rect x="42" y="48" width="236" height="344" rx="3" fill={sport==='beach_volleyball'?'#e8d5ad':'#dcaa80'}/>
        <rect x="48" y="54" width="224" height="332" fill="none" stroke="white" strokeWidth="2"/>
        {sport !== 'beach_volleyball' && <><path d="M48 164H272M48 276H272" stroke="white" strokeWidth="2"/><path d="M160 54V386" stroke="white" strokeWidth="1" opacity=".5"/></>}
        <path d="M30 220H290" stroke="#283746" strokeWidth="3"/><path d="M31 210V230M289 210V230" stroke="#2456d8" strokeWidth="5"/>
        <text x="160" y="117" textAnchor="middle" fill="#684321" fontSize="11">OUTRO LADO</text><text x="160" y="329" textAnchor="middle" fill="#684321" fontSize="11">SEU LADO</text>
      </svg>
      {cameras.map((camera,index)=><button className={`camera-pin ${selectedId===camera.id?'selected':''}`} key={camera.id}
        style={{left:`${Math.max(6, Math.min(94,camera.xPercent))}%`,top:`${Math.max(6,Math.min(94,camera.yPercent))}%`}}
        aria-label={`Câmera ${index+1}: ${camera.customLabel || camera.name}. Use as setas para mover e Enter para configurar.`}
        onClick={event=>{event.stopPropagation();setSelectedId(camera.id);}}
        onPointerDown={event=>{event.stopPropagation();dragging.current=camera.id;event.currentTarget.setPointerCapture(event.pointerId);}}
        onKeyDown={event=>{const delta:Record<string,number[]>={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};if(delta[event.key]){event.preventDefault();const [dx,dy]=delta[event.key];onUpdateCameraPosition(camera.id,Math.max(6,Math.min(94,camera.xPercent+dx)),Math.max(6,Math.min(94,camera.yPercent+dy)));}}}>
        {index+1}<span className="camera-direction" style={{transform:`rotate(${camera.rotationDegrees}deg)`}} aria-hidden="true"/>
      </button>)}
      {placing && <div className="placement-hint">Toque no mapa para posicionar</div>}
    </div>
    <div className="court-toolbar"><p>Arraste os pontos para posicionar as câmeras.</p><button className="quiet-button" onClick={()=>{if(!isPro && cameras.length>=2){onOpenUpgradeModal();return;}setPlacing(!placing);}}><Plus size={18}/>{placing?'Cancelar':'Adicionar câmera'}</button></div>
    {placing && <button className="secondary-button" onClick={()=>add()}>Posicionar na linha de fundo</button>}
    {selected && <section className="camera-settings" aria-label="Configurar câmera"><div className="settings-title"><h3>Configurar câmera</h3><button className="icon-button" aria-label="Fechar configuração" onClick={()=>setSelectedId(null)}><X size={20}/></button></div>
      <label>Nome<input value={selected.customLabel || selected.name} onChange={e=>onUpdateCameraLabel(selected.id,e.target.value)} maxLength={40}/></label>
      <label>Orientação · {selected.rotationDegrees}°<input type="range" min="0" max="359" value={selected.rotationDegrees} onChange={e=>onUpdateCameraRotation(selected.id,+e.target.value)}/></label>
      <div className="settings-actions"><button className="quiet-button" onClick={()=>onUpdateCameraRotation(selected.id,(selected.rotationDegrees+90)%360)}><RotateCw size={18}/>Girar 90°</button><button className="quiet-button destructive" onClick={()=>{onRemoveCamera(selected.id);setSelectedId(null);}}><Trash2 size={18}/>Remover</button></div>
    </section>}
  </div>;
};
