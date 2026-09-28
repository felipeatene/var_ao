import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Accessibility, Check, Plus, Trash2, X } from 'lucide-react';
import { CameraDevice, SportType } from '../types';

// Same convention as atan2 used when adding a camera: 0° right, clockwise.
const directions = [
  { label: 'Cima', degrees: 270 },
  { label: 'Cima-direita', degrees: 315 },
  { label: 'Direita', degrees: 0 },
  { label: 'Baixo-direita', degrees: 45 },
  { label: 'Baixo', degrees: 90 },
  { label: 'Baixo-esquerda', degrees: 135 },
  { label: 'Esquerda', degrees: 180 },
  { label: 'Cima-esquerda', degrees: 225 },
];
const directionByDegrees = new Map(directions.map(direction => [direction.degrees, direction]));
const directionGlyphs = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
const clampPosition = (value: number) => Math.max(6, Math.min(94, value));

interface CourtLayoutProps {
  sport: SportType;
  cameras: CameraDevice[];
  onAddCameraAtPosition: (xPercent: number, yPercent: number, label: string) => void;
  onUpdateCameraPosition: (id: string, xPercent: number, yPercent: number) => void;
  onUpdateCameraRotation: (id: string, rotationDegrees: number) => void;
  onUpdateCameraLabel: (id: string, label: string) => void;
  onRemoveCamera: (id: string) => void;
  onSaved?: (message: string) => void;
  onSelectCameraPreview?: (cam: CameraDevice) => void;
  isPro: boolean;
  onOpenUpgradeModal: () => void;
}

export const CourtLayout: React.FC<CourtLayoutProps> = (props) => {
  const { sport, cameras, onAddCameraAtPosition, onUpdateCameraPosition,
    onUpdateCameraRotation, onUpdateCameraLabel, onRemoveCamera, onSaved, isPro,
    onOpenUpgradeModal } = props;
  const board = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const pins = useRef(new Map<string, HTMLButtonElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; rotation: number; initialName: string; initialRotation: number } | null>(null);
  const [accessibleDirections, setAccessibleDirections] = useState(false);
  const [placing, setPlacing] = useState(false);
  const popupId = useId();
  const selected = cameras.find(camera => camera.id === selectedId);

  const open = (camera: CameraDevice) => {
    setSelectedId(camera.id);
    setDraft({ name: camera.customLabel ?? camera.name, rotation: camera.rotationDegrees, initialName: camera.customLabel ?? camera.name, initialRotation: camera.rotationDegrees });
    setAccessibleDirections(false);
  };
  const close = (restoreFocus = true) => {
    if (restoreFocus && selectedId) pins.current.get(selectedId)?.focus({ preventScroll: true });
    setSelectedId(null);
    setDraft(null);
    setAccessibleDirections(false);
  };
  const hasChanges = Boolean(draft && (draft.name !== draft.initialName || draft.rotation !== draft.initialRotation));
  const canSave = Boolean(hasChanges && draft?.name.trim());
  const save = () => {
    if (!selected || !draft || !canSave) return;
    const name = draft.name.trim();
    onUpdateCameraLabel(selected.id, name);
    onUpdateCameraRotation(selected.id, draft.rotation);
    onSaved?.('Câmera salva.');
    close();
  };

  useLayoutEffect(() => {
    if (!selectedId || !selected || !popup.current) return;
    const panel = popup.current;
    const anchor = pins.current.get(selectedId)!;
    const place = () => {
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
      const topEdge = (viewport?.offsetTop ?? 0) + 12;
      const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth) - 24;
      let bottomEdge = topEdge + (viewport?.height ?? window.innerHeight) - 24;
      const review = document.querySelector<HTMLElement>('.match-controls > .primary-button');
      if (review && getComputedStyle(review).position === 'fixed') {
        const rect = review.getBoundingClientRect();
        if (rect.top > topEdge && rect.top < bottomEdge) bottomEdge = rect.top - 12;
      }
      panel.style.width = `${Math.min(312, rightEdge - leftEdge)}px`;
      panel.style.maxHeight = `${Math.max(48, bottomEdge - topEdge)}px`;
      const pin = anchor.getBoundingClientRect();
      const height = panel.offsetHeight;
      const width = panel.offsetWidth;
      const below = pin.bottom + 12;
      const above = pin.top - height - 12;
      const preferred = below + height <= bottomEdge ? below : above;
      panel.style.top = `${Math.max(topEdge, Math.min(preferred, bottomEdge - height))}px`;
      panel.style.left = `${Math.max(leftEdge, Math.min(pin.left + pin.width / 2 - width / 2, rightEdge - width))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    if (board.current) observer.observe(board.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [selectedId, selected?.xPercent, selected?.yPercent]);

  useLayoutEffect(() => {
    if (!selectedId || !popup.current) return;
    const panel = popup.current;
    const anchor = pins.current.get(selectedId);
    // Focus the panel, not the text input: opening must not summon the mobile keyboard.
    panel.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.contains(target) || anchor?.contains(target)) return;
      if (panel.contains(document.activeElement)) anchor?.focus({ preventScroll: true });
      close(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      anchor?.focus({ preventScroll: true });
      close(false);
    };
    const focusOutside = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !anchor?.contains(target)) close(false);
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', focusOutside);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('focusin', focusOutside);
    };
  }, [selectedId]);

  const point = (x: number, y: number) => {
    const rect = board.current!.getBoundingClientRect();
    return [clampPosition((x - rect.left) / rect.width * 100), clampPosition((y - rect.top) / rect.height * 100)];
  };
  const add = (x = 50, y = 92) => {
    onAddCameraAtPosition(x, y, `Câmera ${cameras.length + 1}`);
    setPlacing(false);
  };
  return <div className="court-editor">
    <div className={`court-map ${sport === 'beach_volleyball' ? 'court-beach' : ''}`} ref={board}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture) return;
        if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 6) return;
        gesture.moved = true;
        suppressClick.current = gesture.id;
          close(false);
        const [x, y] = point(event.clientX, event.clientY);
        onUpdateCameraPosition(gesture.id, x, y);
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => {
        suppressClick.current = drag.current?.id ?? null;
        drag.current = null;
      }}
      onLostPointerCapture={() => { drag.current = null; }}
      onClick={event => {
        if (placing && event.target === event.currentTarget) {
          const [x, y] = point(event.clientX, event.clientY);
          add(x, y);
        }
      }}>
      <svg viewBox="0 0 320 440" role="img" aria-label={`Mapa de vôlei de ${sport === 'beach_volleyball'?'praia':'quadra'}`} className="court-drawing">
        <rect x="42" y="48" width="236" height="344" rx="3" fill={sport==='beach_volleyball'?'#e8d5ad':'#dcaa80'}/>
        <rect x="48" y="54" width="224" height="332" fill="none" stroke="white" strokeWidth="2"/>
        {sport !== 'beach_volleyball' && <><path d="M48 164H272M48 276H272" stroke="white" strokeWidth="2"/><path d="M160 54V386" stroke="white" strokeWidth="1" opacity=".5"/></>}
        <path d="M30 220H290" stroke="#283746" strokeWidth="3"/><path d="M31 210V230M289 210V230" stroke="#2456d8" strokeWidth="5"/>
        <text x="160" y="117" textAnchor="middle" fill="#684321" fontSize="11">OUTRO LADO</text><text x="160" y="329" textAnchor="middle" fill="#684321" fontSize="11">SEU LADO</text>
      </svg>
      {cameras.map((camera, index) => <button
        className={`camera-pin ${selectedId === camera.id ? 'selected' : ''}`}
        key={camera.id}
        ref={element => { if (element) pins.current.set(camera.id, element); else pins.current.delete(camera.id); }}
        style={{ left: `${clampPosition(camera.xPercent)}%`, top: `${clampPosition(camera.yPercent)}%` }}
        aria-label={`Câmera ${index + 1}: ${camera.customLabel || camera.name}. Use as setas para mover e Enter para configurar.`}
        aria-haspopup="dialog" aria-expanded={selectedId === camera.id}
        aria-controls={selectedId === camera.id ? popupId : undefined}
        onClick={event => {
          event.stopPropagation();
          if (suppressClick.current === camera.id && event.detail !== 0) {
            suppressClick.current = null;
            return;
          }
          if (selectedId === camera.id) close(); else open(camera);
        }}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.stopPropagation();
          suppressClick.current = null;
          drag.current = { id: camera.id, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onKeyDown={event => {
          const delta: Record<string, number[]> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
          if (delta[event.key]) {
            event.preventDefault();
            const [dx, dy] = delta[event.key];
            onUpdateCameraPosition(camera.id, clampPosition(camera.xPercent + dx), clampPosition(camera.yPercent + dy));
          }
        }}>
        {index + 1}
        <span className="camera-direction" style={{ transform: `rotate(${selectedId === camera.id && draft ? draft.rotation : camera.rotationDegrees}deg)` }} aria-hidden="true">
          <svg viewBox="0 0 80 80"><path d="M64 40H76M70 34L76 40L70 46" /></svg>
        </span>
      </button>)}
      {placing && <div className="placement-hint">Toque no mapa para posicionar</div>}
    </div>
    <div className="court-toolbar"><p>Arraste os pontos para posicionar as câmeras.</p>
      <button ref={addButton} className="quiet-button" onClick={() => {
        if (!isPro && cameras.length >= 2) { onOpenUpgradeModal(); return; }
        setPlacing(!placing);
      }}><Plus size={18} />{placing ? 'Cancelar' : 'Adicionar câmera'}</button>
    </div>
    {placing && <button className="secondary-button" onClick={() => add()}>Posicionar na linha de fundo</button>}
    {selected && draft && createPortal(<div ref={popup} id={popupId} className="camera-popover"
      role="dialog" aria-modal="false" aria-labelledby={`${popupId}-title`} tabIndex={-1}>
      <div className="camera-popover-heading">
        <h3 id={`${popupId}-title`}>Câmera {cameras.indexOf(selected) + 1}</h3>
        <div className="camera-popover-tools">
          <button className="accessibility-toggle" type="button" aria-label={accessibleDirections ? 'Usar controle circular' : 'Usar seleção acessível'} title={accessibleDirections ? 'Usar controle circular' : 'Usar seleção acessível'} onClick={() => setAccessibleDirections(value => !value)}><Accessibility size={18} /></button>
          <button className="icon-button" aria-label="Fechar configuração" onClick={() => close()}><X size={20} /></button>
        </div>
      </div>
      <label>Nome da câmera
        <input aria-label="Nome da câmera" value={draft.name} onChange={event => setDraft(value => value ? { ...value, name: event.target.value } : value)} maxLength={40} />
      </label>
      <fieldset className="direction-fieldset"><legend>Direção</legend>
        {accessibleDirections ? <div className="direction-grid" role="radiogroup" aria-label="Direção da câmera">
          {directions.map((direction, index) => <button key={direction.degrees} type="button" role="radio" aria-checked={draft.rotation === direction.degrees} aria-label={direction.label} className={`direction-grid-button ${draft.rotation === direction.degrees ? 'selected' : ''}`} onClick={() => setDraft(value => value ? { ...value, rotation: direction.degrees } : value)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); (event.currentTarget.parentElement?.children[(index + 1) % 8] as HTMLElement)?.focus(); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); (event.currentTarget.parentElement?.children[(index + 7) % 8] as HTMLElement)?.focus(); } }}><span aria-hidden="true">{directionGlyphs[index]}</span></button>)}
        </div> : <div className="direction-wheel" role="radiogroup" aria-label="Direção da câmera">
          <div className="direction-wheel-center" aria-hidden="true"><span>{directionByDegrees.get(draft.rotation)?.label ?? 'Atual'}</span></div>
          {directions.map((direction, index) => <button key={direction.degrees} type="button" role="radio" aria-checked={draft.rotation === direction.degrees} aria-label={direction.label} title={direction.label} className={`direction-wheel-button direction-wheel-${index} ${draft.rotation === direction.degrees ? 'selected' : ''}`} onClick={() => setDraft(value => value ? { ...value, rotation: direction.degrees } : value)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); (event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[(index + 1) % 8] as HTMLElement)?.focus(); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); (event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[(index + 7) % 8] as HTMLElement)?.focus(); } }}><span aria-hidden="true">{directionGlyphs[index]}</span></button>)}
        </div>}
      </fieldset>
      <div className="camera-popover-actions">
      <button className="camera-remove" onClick={() => {
        const next = cameras.find(camera => camera.id !== selected.id);
        onRemoveCamera(selected.id);
        setSelectedId(null); setDraft(null);
        (next ? pins.current.get(next.id) : addButton.current)?.focus({ preventScroll: true });
      }}><Trash2 size={16} />Remover câmera</button>
      <button className="camera-save" disabled={!canSave} onClick={save}><Check size={16} />Salvar</button>
      </div>
    </div>, document.body)}
  </div>;
};
