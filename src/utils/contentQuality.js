import {answersMatch,normalizeAnswer} from './answer.js';

export const reportReasons=['Неверный перевод','Есть другой правильный ответ','Непонятное объяснение','Опечатка или другое'];
export function addContentReport(reports=[],item={},context={},reason,now=new Date().toISOString()){
  if(!reportReasons.includes(reason)||!item.prompt||!item.answer)return reports;
  const key=JSON.stringify([item.id || '',item.prompt,item.answer,context.topic || '',reason]);
  const previous=reports.find((entry)=>entry.key===key);
  return [{key,id:item.id || null,prompt:String(item.prompt).slice(0,2000),answer:String(item.answer).slice(0,2000),options:(item.options || []).map(String).slice(0,30),selected:String(context.selected || '').slice(0,1000),topic:String(context.topic || ''),type:item.type || 'choice',reason,count:(previous?.count || 0)+1,createdAt:previous?.createdAt || now,lastSeenAt:now},...reports.filter((entry)=>entry.key!==key)].slice(0,100);
}

export function choiceQualityIssues(item){
  if(item.type==='build'||item.type==='input'||item.type==='translate'||!item.options)return [];
  const issues=[],options=item.options.map(normalizeAnswer);
  if(new Set(options).size!==options.length)issues.push('Повторяющиеся варианты ответа');
  if(!item.options.includes(item.answer))issues.push('Правильный ответ отсутствует');
  if(item.options.filter((option)=>[item.answer,...(item.answers || [])].some((answer)=>answersMatch(option,answer))).length>1)issues.push('Несколько принимаемых вариантов в одиночном выборе');
  return issues;
}

export function distinctDistractors(candidates,accepted,limit=3){
  const seen=new Set(),result=[];
  for(const option of candidates){
    const key=normalizeAnswer(option);
    if(!key||seen.has(key)||accepted.some((answer)=>answersMatch(option,answer)))continue;
    seen.add(key);result.push(option);
    if(result.length===limit)break;
  }
  return result;
}
