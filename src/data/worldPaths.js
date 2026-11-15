const scene = (prompt, answer, wrong, explanation) => ({prompt,answer,options:[answer,...wrong],explanation,type:'choice'});
const chapter = (id,title,speaker,line,questions,decisions) => ({id,title,speaker,line,questions,decisions});
const decision = (id,title,text,outcome) => ({id,title,text,outcome});

export const lifePaths = [
  {id:'career',title:'Карьера',emoji:'💼',description:'Работа, команда и собственный проект',chapters:[
    chapter('application','Шанс на новую работу','Grace','We value examples of what you achieved, not just a list of duties.',[
      scene('Что стоит включить в отклик?','A concrete achievement with a measurable result.',['Only a list of job titles.','A promise to do everything perfectly.'],'Achievement — достижение. Нужен конкретный результат, а не только обязанности.'),
      scene('Выбери естественное описание результата.','I helped reduce response times by twenty percent.',['I reduced twenty responses time percent.','I help yesterday all responses.'],'Helped + начальная форма reduce. By twenty percent показывает величину изменения.')
    ],[decision('team','Искать командную роль','I would like to grow within a supportive team.','Grace запомнила твой интерес к совместной работе.'),decision('independent','Выбрать самостоятельную роль','I work well independently and take responsibility for results.','Grace предложит тебе больше самостоятельности.')]),
    chapter('conflict','Разногласие в команде','Noah','A colleague has changed your plan without discussing it. You need to respond.',[
      scene('Начни разговор без обвинения.','Could we talk through the changes together?',['You always ruin everything.','You must follow me without questions.'],'Talk through — подробно обсудить. Вопрос приглашает к диалогу вместо обвинения.'),
      scene('Уточни приоритет перед новым решением.','Which deadline should we prioritise?',['Which deadline we should priority?','What deadline prioritising are?'],'В вопросе с should порядок: question word → should → подлежащее → глагол.')
    ],[decision('compromise','Договориться о компромиссе','Let us combine the strongest parts of both plans.','Вы объединили планы; Noah ценит твою гибкость.'),decision('evidence','Предложить короткий эксперимент','Could we test both approaches before deciding?','Команда проверит оба подхода на данных.')]),
    chapter('venture','Твой проект','Grace','You can lead an internal initiative or start a small independent project.',[
      scene('Как обозначить объём первого этапа?','Let us agree on a realistic scope for the first month.',['Let us promise every feature immediately.','Scope means no deadlines at all.'],'Scope — объём работы. Согласованный первый этап помогает избежать нереалистичных обещаний.'),
      scene('Объясни, что сделаешь перед запуском.','I will gather feedback before launching the full service.',['I will gathering feedback before launch service.','I gathered tomorrow full service.'],'Will + gather — план будущего действия; before launching — перед запуском.')
    ],[decision('lead','Возглавить инициативу','I would like to lead this initiative within the team.','Финал: ты стал руководителем внутреннего проекта.'),decision('found','Начать своё дело','I am ready to build a small independent service.','Финал: ты начал собственный небольшой сервис.')]),
  ]},
  {id:'study',title:'Учёба',emoji:'🎓',description:'Поступление, исследование и защита',chapters:[
    chapter('admission','Поступление','Amelia','Your application needs a statement of purpose and one example of previous work.',[
      scene('Что приложить к заявлению?','A statement of purpose and a sample of my work.',['Only my travel tickets.','A completed final dissertation.'],'Statement of purpose объясняет цели обучения; sample of work — пример твоей работы.'),
      scene('Как вежливо уточнить требования?','Could you clarify which documents are required?',['Which documents required you?','You must accept me with no documents.'],'Could you clarify… — вежливая просьба уточнить; are required — требуются.')
    ],[decision('research','Исследовательский путь','I want to investigate questions through independent research.','Amelia предложит тебе исследовательский проект.'),decision('practical','Прикладной путь','I would like to apply what I learn to practical problems.','Amelia подберёт проект с практической задачей.')]),
    chapter('group-project','Совместный проект','Amelia','One group member has missed a deadline. You need a workable plan.',[
      scene('Уточни, какая помощь нужна участнику.','What support would help you finish your part?',['Why are you always useless?','You must do everyone’s work.'],'Конкретный вопрос о поддержке помогает выяснить причину задержки.'),
      scene('Предложи распределить оставшиеся задачи.','Let us divide the remaining tasks and agree on new deadlines.',['Let us tasks remaining deadline divide.','We agree yesterday tomorrow tasks.'],'Divide the tasks — распределить задачи; agree on deadlines — согласовать сроки.')
    ],[decision('mentor','Помочь участнику','I can help you plan your part while keeping my own tasks.','Ты помог участнику выстроить работу, сохранив свои границы.'),decision('redistribute','Перераспределить задачи','Could we redistribute the work fairly across the group?','Группа согласовала новое распределение задач.')]),
    chapter('defence','Защита работы','Professor Morgan','The panel asks about the limitations of your findings.',[
      scene('Ответь научно и без преувеличений.','The sample was small, so the findings should be interpreted cautiously.',['Our findings prove everything for everyone.','Limitations mean the whole study is worthless.'],'Маленькая выборка ограничивает обобщение. Cautiously — с осторожностью.'),
      scene('Предложи следующий шаг исследования.','A larger follow-up study could test whether the pattern holds.',['We should never test the pattern again.','The pattern can tested no research.'],'Follow-up study — последующее исследование; could + test выражает возможность.')
    ],[decision('continue','Продолжить исследование','I would like to develop this question in further research.','Финал: тебе предложили продолжить исследовательскую работу.'),decision('apply','Применить результат','I want to turn these findings into a practical tool.','Финал: ты превратил работу в прикладной проект.')]),
  ]},
  {id:'community',title:'Своя жизнь',emoji:'🏡',description:'Соседи, друзья и городской праздник',chapters:[
    chapter('neighbours','Новые соседи','Olivia','The neighbours have invited you to a meeting about shared spaces.',[
      scene('Вежливо представься на встрече.','I have just moved in and would love to get to know everyone.',['You must all become my friends now.','I move yesterday knowing all.'],'Moved in — переехал в жильё; get to know — познакомиться ближе.'),
      scene('Уточни правила использования общей кухни.','Are there any agreed rules for using the shared kitchen?',['Who kitchen rules using are?','Shared kitchen means no rules possible.'],'Agreed rules — согласованные правила; shared kitchen — общая кухня.')
    ],[decision('garden','Присоединиться к саду','I would enjoy helping with the community garden.','Olivia познакомит тебя с участниками общего сада.'),decision('club','Организовать клуб','Could we start a small neighbourhood conversation club?','Соседи поддержали идею разговорного клуба.')]),
    chapter('friends','Договориться с друзьями','Sam','Some friends prefer an expensive evening out; others have a tight budget.',[
      scene('Предложи вариант, который не исключает людей.','Could we choose something affordable for everyone?',['Those with less money should stay home.','Affordable means the most expensive option.'],'Affordable — доступный по цене. Предложение учитывает бюджет всей компании.'),
      scene('Покажи, что учитываешь чужие предпочтения.','I am happy to consider other ideas as well.',['Only my idea can ever be right.','I happy considering yesterday tomorrow.'],'Be happy to + глагол — готовность что-то сделать; as well — тоже.')
    ],[decision('picnic','Устроить пикник','How about a picnic where everyone brings something?','Вы устроили пикник и познакомили разных друзей.'),decision('museum','Пойти в музей','Let us try the free museum and meet for tea afterwards.','Вы нашли общий интерес к городским музеям.')]),
    chapter('festival','Городское событие','Maya','Your group can organise a neighbourhood event. Accessibility and a realistic budget matter.',[
      scene('Уточни потребности посетителей.','How can we make the event accessible to more people?',['Accessibility is only about expensive tickets.','How event people accessible making?'],'Accessible — доступный людям с разными потребностями, не только финансово.'),
      scene('Предложи план дальнейшей поддержки.','We should assign responsibilities for cleaning up and future maintenance.',['Maintenance will happen without any plan.','We should spending every fund on posters.'],'Assign responsibilities — распределить обязанности; maintenance — дальнейшая поддержка.')
    ],[decision('annual','Сделать событие ежегодным','I would like to build a team that can run this event every year.','Финал: ты создал команду ежегодного районного праздника.'),decision('space','Создать постоянное место','Let us use this momentum to create a lasting community space.','Финал: жители поддержали создание постоянного общественного пространства.')]),
  ]},
];

export const rentalListings = [
  {id:'garden-room',title:'Комната у парка',rent:600,deposit:600,bills:0,commute:35,text:'Garden room: £600 per month, bills included. Deposit £600. Shared kitchen. Thirty-five minutes to the centre.'},
  {id:'central-studio',title:'Студия ближе к центру',rent:720,deposit:720,bills:60,commute:15,text:'Central studio: rent £720 per month plus £60 bills. Deposit £720. Private kitchen. Fifteen minutes to the centre.'},
  {id:'riverside-share',title:'Квартира с соседом',rent:680,deposit:680,bills:40,commute:25,text:'Riverside flat share: rent £680, monthly bills £40, deposit £680. Shared living room. Twenty-five minutes to the centre.'},
];
export const rentalBudget=1500;
export const rentalInitialCost=(listing)=>listing.rent+listing.deposit+listing.bills;
export function rentalQuestions(listing){return [
  scene('Сколько нужно на первый месяц, залог и коммунальные услуги? (Не перевод, а расчёт по объявлению.)',`£${rentalInitialCost(listing)}`,[`£${listing.rent}`,`£${rentalInitialCost(listing)+100}`],'Для заселения складываем первый месяц, залог и коммунальные услуги. На следующие месяцы залог повторно не начисляется.'),
  {...scene('Напиши хозяину: «Можно договориться о просмотре?»','Could I arrange a viewing?',[], 'Arrange a viewing — договориться о просмотре. Can I arrange a viewing — тоже допустимая просьба.'),type:'input',answers:['Could I arrange a viewing','Can I arrange a viewing','Could we arrange a viewing','I would like to arrange a viewing']},
  scene('Хозяин: “The deposit is refundable, subject to the condition of the room.” Что это означает?','Залог могут вернуть с учётом состояния комнаты.',['Залог никогда не возвращается.','Залог заменяет ежемесячную аренду.'],'Refundable — возвращаемый; subject to — при условии, с учётом. Состояние комнаты влияет на возврат.'),
];}

export function pathProgress(world,path){return world.lifePaths?.[path.id] || {completed:[],decisions:{}};}
export function pathQuestions(world,path,chapter){
  const questions=[...chapter.questions],state=pathProgress(world,path);
  if(chapter.id===path.chapters[1].id){
    const first=state.decisions[path.chapters[0].id]?.id;
    if(path.id==='career')questions.unshift(first==='team'
      ?scene('Grace помнит твой выбор командной роли. Предложи совместный разбор.','Could we review the plan as a team?',['I forbid any team discussion.','We team reviewing could plan?'],'As a team — всей командой; could we — совместное вежливое предложение.')
      :scene('Ты выбрал самостоятельную роль. Как взять ответственность за свой этап?','I will prepare a proposal and share the results.',['I will preparing a proposal.','No one needs to know my results.'],'Will + prepare; share the results сохраняет прозрачность самостоятельной работы.'));
    if(path.id==='study')questions.unshift(first==='research'
      ?scene('Amelia помнит твой исследовательский интерес. Предложи первый шаг.','Let us formulate a question we can investigate.',['We do not need a research question.','Question formulate investigating us.'],'Formulate a question — сформулировать исследовательский вопрос.')
      :scene('Ты выбрал прикладной путь. С чего начать проект?','Let us identify a practical problem we can solve.',['Practical problems never need a solution.','We practical solve problem yesterday tomorrow.'],'Identify a problem — определить задачу; can solve — можем решить.'));
    if(path.id==='community')questions.unshift(first==='garden'
      ?scene('Olivia зовёт тебя помочь в общем саду. Уточни время.','What time should I come to help in the garden?',['What time I should comes garden?','The garden does not have any people.'],'После should — начальная форма; вопросительный порядок should I come.')
      :scene('Соседи поддержали твой клуб. Пригласи новых участников.','Would you like to join our conversation club?',['Would you likes joining our club?','You must attend every meeting.'],'Would you like to… — приглашение, которое оставляет право отказаться.'));
  }
  if(path.id==='career' && chapter.id==='venture' && world.lifePaths?.study?.ending)questions.unshift(scene('Amelia из учебного пути предлагает познакомить тебя с партнёром. Как согласиться?','Thank you, an introduction would be very helpful.',['I demand every contact immediately.','Introduction are help yesterday.'],'Связь между путями: завершённая учёба открыла новое знакомство. An introduction — представление друг другу.'));
  return questions;
}
export function finishPathChapter(world,pathId,chapterId,decisionId,assessment=null){
  const path=lifePaths.find((entry)=>entry.id===pathId);
  const index=path?.chapters.findIndex((entry)=>entry.id===chapterId) ?? -1;
  if(index<0)return world;
  const state=pathProgress(world,path),chapter=path.chapters[index];
  const choice=chapter.decisions.find((entry)=>entry.id===decisionId);
  if(!choice || state.completed.includes(chapterId) || !path.chapters.slice(0,index).every((entry)=>state.completed.includes(entry.id)))return world;
  const finished=index===path.chapters.length-1;
  return {...world,lifePaths:{...world.lifePaths,[pathId]:{completed:[...state.completed,chapterId],decisions:{...state.decisions,[chapterId]:choice},assessments:{...(state.assessments || {}),...(assessment?{[chapterId]:assessment}:{})},ending:finished?choice.outcome:state.ending,endings:finished?[...new Set([...(state.endings || []),choice.outcome])]:(state.endings || [])}},pathDraft:null};
}

export function restartLifePath(world,pathId){
  const path=lifePaths.find((entry)=>entry.id===pathId);
  if(!path)return world;
  const state=pathProgress(world,path);
  return {...world,lifePaths:{...world.lifePaths,[pathId]:{completed:[],decisions:{},endings:[...new Set([...(state.endings || []),...(state.ending?[state.ending]:[])])]}},pathDraft:world.pathDraft?.pathId===pathId?null:world.pathDraft};
}

export function finishRental(world,listingId,terms,dialogue=null){
  const listing=rentalListings.find((entry)=>entry.id===listingId);
  if(!listing || rentalInitialCost(listing)>rentalBudget || !['inventory','repair'].includes(terms) || world.rental?.completed || (dialogue && dialogue.phase!=='done'))return world;
  const discount=dialogue?.successfulIntents?.includes('budget')?20:0;
  return {...world,rental:{completed:true,listingId,terms,monthly:listing.rent+listing.bills-discount,initial:rentalInitialCost(listing)-discount,discount,dialogue:dialogue?{...dialogue,turns:dialogue.turns.slice(-40)}:null,outcome:terms==='repair'?'Ты договорился устранить неполадки перед въездом.':'Ты договорился составить опись и зафиксировать состояние жилья.'},pathDraft:null};
}

export function restartRental(world){
  return {...world,rentalHistory:world.rental?.completed?[world.rental,...(world.rentalHistory || [])].slice(0,10):(world.rentalHistory || []),rental:null,pathDraft:world.pathDraft?.mode==='rental'?null:world.pathDraft};
}
