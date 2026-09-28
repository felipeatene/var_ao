import { ReactNode, useEffect, useRef } from 'react';

export function DialogBoundary({label,onClose,children}:{label:string;onClose:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const background=Array.from(document.querySelectorAll<HTMLElement>('.app-header, .workspace, .app-footer'));
    background.forEach(el=>el.inert=true);
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const focusable=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,summary,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
    (focusable()[0]||ref.current)?.focus();
    const listener=(event:KeyboardEvent)=>{
      const dialogs=document.querySelectorAll('.dialog-boundary');
      if(dialogs[dialogs.length-1]!==ref.current)return;
      if(event.key==='Escape'){event.preventDefault();close.current();}
      if(event.key==='Tab'){const elements=focusable();const first=elements[0],last=elements[elements.length-1];if(!first){event.preventDefault();return;}if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    };
    document.addEventListener('keydown',listener);
    return()=>{document.removeEventListener('keydown',listener);document.body.style.overflow=oldOverflow;if(document.querySelectorAll('.dialog-boundary').length<=1)background.forEach(el=>el.inert=false);if(previous?.isConnected)previous.focus();};
  },[]);
  return <div className="dialog-boundary" ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>;
}
