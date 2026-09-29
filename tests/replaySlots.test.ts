import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseCamera,reconcileSlots,toggleComparison,ReplaySlots} from '../src/utils/replaySlots';
const initial:ReplaySlots={a:'1',b:'2',active:'a',split:false};
test('one, two, three, four and eight cameras maintain distinct valid slots',()=>{
 for(const size of [0,1,2,3,4,8]){
 const ids=Array.from({length:size},(_,i)=>String(i+1));let state=toggleComparison(initial,ids);
 for(const id of ids){state=chooseCamera(state,id);assert.ok(ids.includes(state.a));if(state.split){assert.ok(ids.includes(state.b));assert.notEqual(state.a,state.b);}}
 assert.equal(state.split,size>1);
 }
});
test('third and fourth replace focused slots; visible camera selects without swapping',()=>{
 let state=toggleComparison(initial,['1','2','3','4']);state=chooseCamera(state,'3');assert.equal(state.a,'3');assert.equal(state.b,'2');
 state=chooseCamera(state,'2');state=chooseCamera(state,'4');assert.equal(state.a,'3');assert.equal(state.b,'4');
 assert.deepEqual(chooseCamera(state,'3'),{...state,active:'a'});
});
test('leaving keeps focused angle and reopening recovers other angle',()=>{
 const ids=['1','2','3'];const state={...initial,active:'b' as const,split:true};
 const single=toggleComparison(state,ids);assert.equal(single.a,'2');assert.equal(single.b,'1');
 assert.deepEqual(toggleComparison(single,ids),{a:'2',b:'1',active:'a',split:true});
});
test('disconnect replaces only unavailable slot, one camera collapses, zero empties',()=>{
 const state={...initial,split:true};assert.deepEqual(reconcileSlots(state,['2','3']),{a:'3',b:'2',active:'a',split:true});
 assert.deepEqual(reconcileSlots(state,['2']),{a:'2',b:'',active:'a',split:false});
 assert.deepEqual(reconcileSlots(state,[]),{a:'',b:'',active:'a',split:false});
});
