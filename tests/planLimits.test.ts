import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWeeklyUsage, parseUsage, requiresPro, weekKey} from '../src/utils/planLimits';
const sunday = new Date(2026,8,27,23,59);
const monday = new Date(2026,8,28,0,0);
test('local Monday boundary including year transition',()=>{
 assert.equal(weekKey(sunday),'2026-09-21'); assert.equal(weekKey(monday),'2026-09-28');
 assert.equal(weekKey(new Date(2027,0,1)),'2026-12-28');
});
test('free boundaries and all Pro capabilities',()=>{
 assert.equal(requiresPro('free','camera_limit',1),false);assert.equal(requiresPro('free','camera_limit',2),true);
 assert.equal(requiresPro('free','weekly_highlight_limit',2),false);assert.equal(requiresPro('free','weekly_highlight_limit',3),true);
 for(const reason of ['camera_limit','weekly_highlight_limit','export_1080p','remove_watermark'] as const){assert.equal(requiresPro('pro',reason,99),false);}
 assert.equal(requiresPro('free','export_1080p'),true);assert.equal(requiresPro('free','remove_watermark'),true);
});
test('invalid, expired and negative values reset safely',()=>{
 for(const raw of [null,'invalid','{}','null',JSON.stringify({week:weekKey(monday),count:-1}),JSON.stringify({week:weekKey(monday),count:1.5}),JSON.stringify({week:weekKey(sunday),count:3})]) assert.equal(parseUsage(raw,monday),0);
});
test('persists three successful saves across instances and resets next Monday',()=>{
 let raw:string|null=null;const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
 const first=createWeeklyUsage(()=>storage);assert.equal(first.read(sunday).count,0);
 for(let i=1;i<=3;i++) assert.equal(first.increment(sunday).count,i);
 const next=createWeeklyUsage(()=>storage);assert.equal(next.read(sunday).count,3);assert.equal(next.read(monday).count,0);assert.equal(next.increment(monday).count,1);
});
test('read and write failures keep an in-memory count',()=>{
 for(const readFails of [true,false]){
 const store=createWeeklyUsage(()=>({getItem:()=>{if(readFails)throw Error('denied');return null;},setItem:()=>{throw Error('quota');}}));
 assert.deepEqual(store.increment(monday),{count:1,persistent:false}); assert.equal(store.increment(monday).count,2);
 assert.equal(store.read(new Date(2026,9,5)).count,0);
 }
});
