import {gradeAnswer} from './answer.js';

const intent=(id,title,examples,word,start,reaction)=>({id,title,examples,word,start,reaction});
export const rentalIntents=[
  intent('viewing','Договориться о просмотре',['Could I arrange a viewing?','Can I arrange a viewing?','I would like to arrange a viewing.','Could we arrange a viewing?','Can I view the room?'],'viewing — просмотр','Could I arrange…','Certainly. Would Saturday at eleven or Monday at six suit you?'),
  intent('budget','Обсудить цену',['Would you consider reducing the rent?','Could you reduce the rent?','Is the rent negotiable?','Could we discuss the rent?','Can you lower the rent?'],'rent — арендная плата','Would you consider…','I can reduce the monthly rent by twenty pounds. The deposit stays the same. Would you like to arrange a viewing?'),
  intent('repair','Попросить устранить неполадки',['Could you fix the reported issues before I move in?','Could you repair the tap before I move in?','Can you fix the tap before I move in?','Could you fix the problems before I move in?'],'fix — устранить; before I move in — до моего въезда','Could you fix…','Yes, I can have the tap repaired before you move in. Would you like to arrange a viewing?'),
  intent('decline','Отказаться и продолжить поиск',['Thank you, but I will keep looking.','Thanks, but I will keep looking.','Thank you, but I have decided to look elsewhere.','I am afraid this does not suit me.','Thanks, but this is not suitable for me.'],'keep looking — продолжать поиск','Thank you, but…','Of course. Thank you for letting me know. Good luck with your search.'),
];
export const viewingTimes=[
  intent('saturday','Суббота, 11:00',['Saturday at eleven works for me.','Saturday at 11 works for me.','Saturday at eleven is fine.','Saturday at 11 is fine.','Could we meet on Saturday at eleven?'],'Saturday — суббота; at — перед временем','Saturday at eleven…','Saturday at eleven is confirmed. I will meet you at the entrance.'),
  intent('monday','Понедельник, 18:00',['Monday at six works for me.','Monday at 6 works for me.','Monday at six is fine.','Monday at 6 is fine.','Could we meet on Monday at six?'],'Monday — понедельник; at — перед временем','Monday at six…','Monday at six is confirmed. I will meet you at the entrance.'),
];

export const newRentalDialogue=()=>({phase:'inquiry',turns:[],attempts:0,accepted:0,repairs:0,hints:0,successfulIntents:[]});
export function availableRentalIntents(dialogue){
  if(dialogue.phase==='time')return viewingTimes;
  if(dialogue.phase!=='inquiry')return [];
  return rentalIntents.filter((item)=>!dialogue.successfulIntents.includes(item.id));
}
export function dialogueHelp(intent,level){
  if(level===1)return intent.word;
  if(level===2)return intent.start;
  return level>=3?intent.examples[0]:'';
}
export function replyToLandlord(dialogue,intentId,text){
  const selected=availableRentalIntents(dialogue).find((item)=>item.id===intentId);
  if(!selected || !String(text || '').trim())return {dialogue,accepted:false,feedback:'Выбери намерение и напиши реплику.'};
  if(String(text).length>500)return {dialogue,accepted:false,feedback:'Раздели сообщение на короткие реплики до 500 символов.'};
  const variants=selected.id==='decline'?selected.examples:[...selected.examples,...selected.examples.map((line)=>line.replace(/[.!?]$/,'')+' please'),...selected.examples.map((line)=>'Please, '+line[0].toLowerCase()+line.slice(1))];
  const check=gradeAnswer(text,variants);
  const accepted=check.status==='correct';
  if(!accepted){
    return {accepted:false,feedback:check.status==='close'?'Начало понятно, но формулировку нужно уточнить. Проверь служебные слова и закончи просьбу.':'Эту формулировку не удалось уверенно распознать. Уточни реплику; при необходимости открой подсказку.',dialogue:{...dialogue,attempts:dialogue.attempts+1,repairs:dialogue.repairs+1,turns:[...dialogue.turns,{speaker:'you',text},{speaker:'landlord',text:'Could you rephrase that, please? I want to make sure I understand.'}].slice(-40)}};
  }
  const phase=selected.id==='decline'?'declined':dialogue.phase==='time'?'done':selected.id==='viewing'?'time':'inquiry';
  return {accepted:true,feedback:'Собеседник понял твою реплику.',dialogue:{...dialogue,phase,attempts:dialogue.attempts+1,accepted:dialogue.accepted+1,successfulIntents:[...dialogue.successfulIntents,selected.id],turns:[...dialogue.turns,{speaker:'you',text},{speaker:'landlord',text:selected.reaction}].slice(-40)}};
}

export function evaluateWorldQuestion(question,answer,previousRepairs=0){
  const correct=question.type==='choice'?answer===question.answer:gradeAnswer(answer,[question.answer,...(question.answers || [])]).status==='correct';
  return {correct,lifeCost:correct||previousRepairs===0?0:1,repairs:previousRepairs+(correct?0:1)};
}
export function worldQuestionHelp(question,level){
  const words=String(question.answer || '').split(/\s+/);
  if(level===1)return question.type==='input'?'Просмотр жилья — viewing. Договориться — arrange.':'Прочитай условие ещё раз: сохрани время, участников и намерение говорящего.';
  if(level===2)return question.type==='input'?words.slice(0,2).join(' ')+'…':'Ищи конкретный факт в тексте или грамматический маркер. Сравни варианты целиком.';
  return level>=3?question.answer:'';
}
