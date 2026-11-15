export const now=()=>globalThis.performance?.now?.() ?? Date.now();
const started=now();
let startupRecorded=false;
const samples=[];
export function recordTiming(name,duration){
  if(!Number.isFinite(duration)||duration<0)return;
  samples.push({name,ms:Math.round(duration),at:Date.now()});
  if(samples.length>60)samples.shift();
}
export function markStartup(){if(!startupRecorded){startupRecorded=true;recordTiming('startup_js',now()-started);}}
export function performanceSummary(){
  const names=[...new Set(samples.map((sample)=>sample.name))];
  return names.map((name)=>{const entries=samples.filter((item)=>item.name===name);return {name,count:entries.length,last:entries.at(-1).ms,max:Math.max(...entries.map((item)=>item.ms))};});
}
