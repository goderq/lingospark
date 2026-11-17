export const now=()=>globalThis.performance?.now?.() ?? Date.now();
const started=now();
let startupRecorded=false;
const samples=[];
let transition = null;
const routeMetrics = { review: 'words_open', vocabulary: 'dictionary_open', journey: 'journey_open', learn: 'learning_home_open', practice: 'practice_open', adaptive: 'practice_open', skillSprint: 'practice_open', dailyChallenge: 'practice_open', unifiedReview: 'practice_open', mistakes: 'practice_open', spaced: 'practice_open', spacedRepetition: 'practice_open', reviewCalendar: 'practice_open', dailyMixedExam: 'practice_open', tenseChallenge: 'practice_open', courseTest: 'practice_open', c1Exam: 'practice_open', courseCheckpoint: 'practice_open', levelExams: 'practice_open', fullIeltsMock: 'practice_open', exam: 'practice_open' };
export function beginScreenTransition(route) { transition = routeMetrics[route] ? { metric: routeMetrics[route], at: now() } : null; }
export function finishScreenTransition(metric) { if (transition?.metric === metric) { recordTiming(`navigation_${metric}`, now() - transition.at); transition = null; } }
export function recordTiming(name,duration){
  if(!Number.isFinite(duration)||duration<0)return;
  samples.push({name,ms:Math.round(duration),at:Date.now()});
  if(samples.length>240)samples.shift();
}
export function markStartup(){if(!startupRecorded){startupRecorded=true;recordTiming('startup_js',now()-started);}}
export function performanceSummary(){
  const names=[...new Set(samples.map((sample)=>sample.name))];
  return names.map((name)=>{const entries=samples.filter((item)=>item.name===name);const sorted=entries.map(item=>item.ms).sort((a,b)=>a-b);return {name,count:entries.length,last:entries.at(-1).ms,max:sorted.at(-1),median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]};});
}
