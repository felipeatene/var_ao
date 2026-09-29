export type ReplaySlots = {a:string;b:string;active:'a'|'b';split:boolean};
export function reconcileSlots(state:ReplaySlots, ids:string[]):ReplaySlots {
  if(!ids.length)return {a:'',b:'',active:'a',split:false};
  const a=ids.includes(state.a)?state.a:ids.find(id=>id!==state.b)??ids[0];
  const b=ids.includes(state.b)&&state.b!==a?state.b:ids.find(id=>id!==a)??'';
  return {a,b,active:b?state.active:'a',split:state.split&&!!b};
}
export function chooseCamera(state:ReplaySlots,id:string):ReplaySlots {
  if(!state.split)return {...state,a:id,b:state.b===id?state.a:state.b,active:'a'};
  if(id===state.a)return {...state,active:'a'};
  if(id===state.b)return {...state,active:'b'};
  return {...state,[state.active]:id};
}
export function toggleComparison(state:ReplaySlots,ids:string[]):ReplaySlots {
  const next=reconcileSlots(state,ids);
  if(next.split)return next.active==='b'?{a:next.b,b:next.a,active:'a',split:false}:{...next,split:false,active:'a'};
  return {...next,split:!!next.b,active:'a'};
}
