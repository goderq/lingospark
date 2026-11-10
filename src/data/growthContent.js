const parseWords = (source, prefix) => source.trim().split('\n').map((line,index)=>{const [english,russian,example]=line.split('|');return{id:`${prefix}-${index}`,english,russian,example}});

export const extendedVocabularyTopics = [
  ['Дом и быт','🏠','A1–A2',`kitchen|кухня|The kitchen is next to the living room.
bedroom|спальня|The bedroom is upstairs.
furniture|мебель|We bought new furniture.
shelf|полка|Put the book on the shelf.
drawer|ящик|The keys are in the drawer.
blanket|одеяло|I need a warm blanket.
neighborhood|район|This is a quiet neighborhood.
rent|арендная плата|The rent is due tomorrow.
repair|ремонтировать|They will repair the window.
household|домашнее хозяйство|Household costs have increased.`],
  ['Еда и готовка','🥗','A1–B1',`ingredient|ингредиент|Fresh ingredients improve the dish.
recipe|рецепт|This recipe is easy to follow.
boil|варить|Boil the water for five minutes.
fry|жарить|Fry the onions gently.
bake|запекать|We baked bread this morning.
spicy|острый|The soup is too spicy for me.
flavor|вкус|Garlic adds flavor.
portion|порция|The portions are quite large.
appetite|аппетит|The walk gave me an appetite.
nutritious|питательный|Beans are cheap and nutritious.`],
  ['Здоровье','🩺','A1–B2',`symptom|симптом|Describe every symptom clearly.
treatment|лечение|The treatment takes two weeks.
recover|выздоравливать|She recovered quickly.
appointment|приём|I made a doctor’s appointment.
prescription|рецепт врача|You need a prescription for this medicine.
injury|травма|The injury was not serious.
prevent|предотвращать|Exercise can prevent some illnesses.
well-being|благополучие|Sleep is essential for well-being.
diagnosis|диагноз|The doctor explained the diagnosis.
side effect|побочный эффект|Drowsiness is a possible side effect.`],
  ['Учёба','📚','A1–B2',`subject|предмет|History is my favorite subject.
assignment|задание|The assignment is due on Monday.
grade|оценка|She received a high grade.
revise|повторять материал|I need to revise before the exam.
memorize|запоминать|Do not try to memorize every sentence.
skill|навык|Writing is a practical skill.
knowledge|знание|Experience deepened his knowledge.
curriculum|учебная программа|The school updated its curriculum.
assessment|оценивание|The course includes a final assessment.
scholarship|стипендия|She won a scholarship to study abroad.`],
  ['Покупки','🛍️','A1–B1',`receipt|чек|Keep the receipt in case of a return.
discount|скидка|The store offers a ten percent discount.
refund|возврат денег|I asked for a full refund.
cashier|кассир|The cashier was very helpful.
customer|покупатель|Every customer received a sample.
quality|качество|The quality is better than expected.
brand|бренд|I do not care about the brand.
purchase|покупка|You can return the purchase within a week.
available|доступный; в наличии|This size is not available.
reasonable|разумный|The price seems reasonable.`],
  ['Природа','🌲','A1–B2',`forest|лес|The path leads through the forest.
coast|побережье|They live near the coast.
valley|долина|A river flows through the valley.
wildlife|дикая природа|The island has unique wildlife.
species|вид|This species is endangered.
habitat|среда обитания|Roads can destroy animal habitats.
climate|климат|The climate is becoming warmer.
drought|засуха|The drought damaged local farms.
flood|наводнение|Heavy rain caused a flood.
landscape|ландшафт|The landscape changes dramatically in winter.`],
  ['Характер','🧠','A2–B2',`patient|терпеливый|A good teacher is patient.
generous|щедрый|That was a generous offer.
honest|честный|Please give me an honest answer.
reliable|надёжный|We need a reliable supplier.
stubborn|упрямый|He is too stubborn to change his mind.
ambitious|амбициозный|She has an ambitious plan.
thoughtful|внимательный|It was a thoughtful gift.
independent|самостоятельный|The child became more independent.
adaptable|гибкий|Adaptable employees learn quickly.
open-minded|непредвзятый|Try to remain open-minded.`],
  ['Медиа','📰','B1–C1',`headline|заголовок|The headline was misleading.
source|источник|Always check the original source.
coverage|освещение в СМИ|The event received international coverage.
broadcast|трансляция|The broadcast starts at eight.
audience|аудитория|The program attracts a young audience.
claim|утверждение|The article makes a surprising claim.
misleading|вводящий в заблуждение|The graph is potentially misleading.
verify|проверять|Journalists must verify the information.
credibility|достоверность|The error damaged the newspaper’s credibility.
distort|искажать|A short quotation can distort the argument.`],
  ['Право и правила','⚖️','B1–C1',`law|закон|The law protects consumers.
right|право|Everyone has the right to a fair trial.
duty|обязанность|It is our duty to report the incident.
permit|разрешение|You need a permit to build here.
ban|запрет|The city introduced a parking ban.
comply|соблюдать|Companies must comply with the regulation.
violation|нарушение|The fine was issued for a safety violation.
enforce|обеспечивать соблюдение|Police enforce the law.
legislation|законодательство|Parliament approved new legislation.
liability|юридическая ответственность|The contract limits the company’s liability.`],
  ['Идеи и аргументы','💡','B2–C1',`assumption|предположение|The argument rests on a false assumption.
perspective|точка зрения|Try to see the issue from another perspective.
principle|принцип|The decision reflects an important principle.
consequence|последствие|Every choice has a consequence.
contradiction|противоречие|There is a contradiction in the report.
valid|обоснованный|That is a valid concern.
relevant|относящийся к делу|Only include relevant evidence.
coherent|связный|The essay presents a coherent argument.
undermine|подрывать|The new evidence may undermine the theory.
substantiate|подкреплять доказательствами|The claim must be substantiated with data.`],
].map(([title,emoji,level,source],index)=>({id:`extended-topic-${index}`,title,emoji,level,words:parseWords(source,`extended-${index}`)}));

const q=(prompt,answer,wrong,explanation)=>({prompt,answer,options:[answer,...wrong],explanation});
export const workModules = [
  {id:'interview',title:'Собеседование',emoji:'🤝',level:'B1',hook:'Отвечай по структуре Situation → Action → Result.',theory:'Сильный ответ не перечисляет качества, а доказывает их коротким примером с измеримым результатом.',exercises:[
    q('Tell me about yourself.','I am a project coordinator with three years of experience in digital products.',['Myself is a good worker.','Everything is already in my CV.'],'Назови роль, опыт и специализацию.'),q('What is your greatest strength?','I stay calm under pressure and prioritize clearly.',['I have no weaknesses.','I work all the time.'],'Качество должно звучать конкретно.'),q('Describe a challenge.','Our deadline changed, so I reorganized the plan and we delivered on time.',['Challenges are always bad.','My manager solved it.'],'Покажи действие и результат.'),q('Why do you want this role?','The role combines my experience with an opportunity to lead larger projects.',['I mainly need a salary.','Your office is near my home.'],'Свяжи свой опыт с вакансией.'),q('Do you have any questions?','How will success in this role be measured during the first six months?',['No, nothing.','When can I take a vacation?'],'Хороший вопрос показывает интерес к результату.') ]},
  {id:'emails',title:'Деловые письма',emoji:'✉️',level:'B1',hook:'Тема, цель, действие, срок — четыре опоры ясного письма.',theory:'Ставь главную просьбу в первый абзац. Используй короткие абзацы и точный срок вместо расплывчатого “as soon as possible”.',exercises:[
    q('Choose the clearest subject line.','Action required: approve Q3 budget by Friday',['Hello','Important information'],'Тема сразу показывает действие и срок.'),q('Вежливая просьба:','Could you send the revised file by 3 p.m.?',['Send it now.','I want the file.'],'Could you + verb — нейтральная просьба.'),q('Как мягко напомнить?','Just a quick reminder that the form is due tomorrow.',['You forgot the form again.','Why have you not sent it?'],'Reminder сообщает факт без обвинения.'),q('Формальное завершение:','Please let me know if you need any further information.',['Okay, bye.','Answer me quickly.'],'Предложи помощь и следующий шаг.'),q('Исправь расплывчатый срок.','Please respond by noon on Tuesday.',['Please respond soon.','Reply when possible.'],'Точный срок снижает риск недопонимания.') ]},
  {id:'meetings',title:'Встречи и обсуждения',emoji:'👥',level:'B1',hook:'Управляй разговором: цель → мнения → решение → действия.',theory:'Полезные фразы не только выражают мнение, но и помогают группе двигаться к решению.',exercises:[q('Начать встречу:','The aim of today’s meeting is to agree on the launch date.',['We are here for something.','Let us talk randomly.'],'Сразу назови цель.'),q('Вернуть разговор к теме:','Could we come back to the main question?',['Stop talking.','That is irrelevant.'],'Вопрос звучит дипломатично.'),q('Проверить согласие:','Are we all comfortable with this approach?',['Everyone agrees, yes?','This is decided.'],'Открытый вопрос даёт возможность возразить.'),q('Зафиксировать действие:','Maya will send the draft by Thursday.',['Someone should send it soon.','The draft is needed.'],'Имя + действие + срок.'),q('Подвести итог:','To summarize, we have chosen option B and assigned three actions.',['That is everything.','The meeting happened.'],'Summary фиксирует решение.') ]},
  {id:'calls',title:'Звонки и видеосвязь',emoji:'📞',level:'A2',hook:'Уточняй услышанное — это профессионально, а не неловко.',theory:'На звонке нет жестов и контекста, поэтому чаще подтверждай имена, цифры и следующие действия.',exercises:[q('Представиться:','Hello, this is Alex Morgan from Northstar.',['I am Alex speaking you.','Who is there?'],'This is... — стандартная формула.'),q('Попросить соединить:','Could you put me through to Ms Lee, please?',['Give me Ms Lee.','I want Lee now.'],'Put me through — соединить по телефону.'),q('Переспросить:','Could you repeat the reference number, please?',['Say again.','I did not listen.'],'Назови, какую именно информацию повторить.'),q('Проверить связь:','I am afraid the connection is breaking up.',['Your voice is bad.','Internet broke you.'],'Breaking up — звук прерывается.'),q('Завершить:','I will email the summary right after this call.',['We finish now.','That was all.'],'Подтверди следующий шаг.') ]},
  {id:'presentations',title:'Презентации',emoji:'📊',level:'B2',hook:'Сначала маршрут, затем данные, в конце один ясный вывод.',theory:'Слушателю легче следовать за презентацией, если ты заранее обозначаешь структуру и проговариваешь смысл графика.',exercises:[q('Обозначить структуру:','I will begin with the problem, then compare two solutions.',['I have many slides.','First I speak everything.'],'Signposting создаёт маршрут.'),q('Объяснить график:','The key point here is the steady rise after June.',['You can see numbers.','This graph is interesting.'],'Назови главную тенденцию.'),q('Перейти к теме:','This brings me to our final recommendation.',['Next slide now.','I change topic.'],'This brings me to... — плавный переход.'),q('Ответить на сложный вопрос:','That is an important question. Let me address it in two parts.',['I do not like this question.','The answer is obvious.'],'Признай вопрос и структурируй ответ.'),q('Завершить:','If you remember one thing, it should be that early action costs less.',['That is my presentation.','Thank you for listening to slides.'],'Оставь одну запоминающуюся мысль.') ]},
  {id:'negotiations',title:'Переговоры',emoji:'⚖️',level:'B2',hook:'Ищи интерес за позицией: почему это важно другой стороне?',theory:'Хорошие переговоры отделяют человека от проблемы и превращают требование в обсуждаемый критерий.',exercises:[q('Выяснить интерес:','What is the main concern behind that deadline?',['Why is your deadline impossible?','You must change the date.'],'Вопрос раскрывает причину позиции.'),q('Условное предложение:','If we shorten the first phase, could you extend the final deadline?',['We shorten and you extend.','Change the deadline now.'],'If...could... связывает обмен уступками.'),q('Не согласиться:','I understand the reasoning, but the current price does not reflect the reduced scope.',['Your price is wrong.','No deal.'],'Сначала признай логику, затем дай критерий.'),q('Проверить компромисс:','Would that address your main concern?',['Now you are satisfied?','This is enough.'],'Вопрос проверяет ценность предложения.'),q('Закрепить итог:','Let us confirm the revised terms in writing.',['We remember it.','The deal is probably done.'],'Письменное подтверждение предотвращает спор.') ]},
  {id:'feedback',title:'Обратная связь',emoji:'💬',level:'B2',hook:'Наблюдение → влияние → следующий шаг.',theory:'Описывай конкретное поведение, а не личность. Тогда обратную связь можно превратить в действие.',exercises:[q('Конкретное наблюдение:','The last two reports arrived after the agreed deadline.',['You are always late.','You are unreliable.'],'Факт можно проверить.'),q('Объяснить влияние:','This leaves the team with too little time for quality checks.',['It is very annoying.','Everyone is unhappy.'],'Покажи рабочее последствие.'),q('Предложить действие:','Could we agree on an earlier warning if the schedule changes?',['Never do it again.','Try to be better.'],'Действие должно быть выполнимым.'),q('Принять обратную связь:','Thank you for pointing that out. I will change the review process.',['That was not my fault.','Fine.'],'Признание + конкретное действие.'),q('Похвалить содержательно:','Your concise summary helped the client make a quick decision.',['Great job.','You are the best.'],'Назови поведение и эффект.') ]},
  {id:'crisis',title:'Сложные ситуации',emoji:'🚨',level:'C1',hook:'Сначала факты и ответственность, затем план и частота обновлений.',theory:'В кризисе доверие зависит не от обещания идеального результата, а от прозрачности и предсказуемого процесса.',exercises:[q('Сообщить проблему:','We have identified a security issue affecting a limited number of accounts.',['Something bad happened.','There is no reason to worry.'],'Точно опиши подтверждённый масштаб.'),q('Признать неизвестное:','We do not yet know the full cause, and the investigation is ongoing.',['We know nothing.','It was probably a supplier.'],'Не выдавай предположение за факт.'),q('Назвать действие:','We have isolated the affected system and reset all access keys.',['We are handling it.','We will try something.'],'Конкретное завершённое действие.'),q('Обещать обновление:','We will provide the next verified update at 4 p.m.',['We will update you soon.','Wait for more news.'],'Точное время создаёт предсказуемость.'),q('Извиниться без ухода от ответственности:','We apologize for the disruption and accept responsibility for restoring the service safely.',['Mistakes happen.','We are sorry if you were affected.'],'Прямое извинение и ответственность.') ]},
];

export const readingTexts = [
  ['A1','A new routine','Marta started a new job near her home. She now walks to work instead of taking the bus. The walk takes twenty minutes, and she often buys coffee from a small shop on the way. She feels more energetic in the morning.','How does Marta travel to work?','She walks',['She takes a bus','She drives'],'How long does it take?','Twenty minutes',['Ten minutes','An hour']],
  ['A1','The shared garden','Our building has a small garden. Every Saturday, three neighbors water the plants and remove weeds. In summer, we grow tomatoes and herbs. Everyone may take some, but we always leave enough for others.','When do neighbors work there?','On Saturday',['On Monday','Every evening'],'What do they grow?','Tomatoes and herbs',['Apples and rice','Only flowers']],
  ['A2','A delayed parcel','Kim ordered a birthday gift online, but it did not arrive on time. The tracking page showed the wrong address. She contacted customer support, corrected the address and received the parcel the next morning.','Why was it delayed?','The address was wrong',['It was too large','Kim was away'],'When did it arrive?','The next morning',['A week later','That evening']],
  ['A2','Learning to cook','Owen used to eat ready-made meals because he thought cooking was difficult. Then a friend showed him three simple recipes. After a month, he was preparing most meals himself and spending less money.','Why did Owen buy ready meals?','He thought cooking was difficult',['He had no kitchen','He disliked food'],'What changed after a month?','He cooked most meals',['He spent more money','He opened a restaurant']],
  ['B1','The four-day experiment','A small design company tested a four-day working week for three months. Employees worked fewer hours but attended shorter meetings and protected periods of focused work. Projects were still delivered on time, while sick days declined. The company decided to continue the arrangement for another year.','How did they protect productivity?','Shorter meetings and focused work',['Lower salaries','More employees'],'What happened to sick days?','They declined',['They doubled','They stayed unmeasured']],
  ['B1','Repair rather than replace','Community repair cafés bring volunteers together to fix broken household items. Visitors learn how products work and avoid throwing useful objects away. Not every item can be saved, but organizers say the greater value is changing how people think about ownership and waste.','What do visitors gain besides repairs?','Knowledge of how products work',['New products','Money from volunteers'],'What is the greater value?','Changing attitudes to waste',['Saving every object','Selling old tools']],
  ['B1','A language exchange','At a language exchange, participants spend half the session speaking one language and half speaking another. The format gives learners real conversation without the cost of private lessons. Its success depends on balanced participation: confident speakers must leave space for beginners.','What is one advantage?','Real conversation without private-lesson cost',['Formal certificates','No need to speak'],'What makes it successful?','Balanced participation',['Only advanced speakers','A silent room']],
  ['B2','The hidden cost of convenience','Fast delivery appears to save consumers time, yet it can shift costs elsewhere. Warehouses must hold more stock, drivers make less efficient journeys, and failed deliveries create additional traffic. Some retailers now offer discounts to customers who choose slower, consolidated delivery.','What costs can fast delivery create?','Stock and inefficient journeys',['Longer holidays','Fewer warehouses'],'Why offer slow-delivery discounts?','To consolidate deliveries',['To sell damaged goods','To remove tracking']],
  ['B2','Why forecasts fail','Forecasts often fail not because analysts lack data but because they assume existing relationships will remain stable. A model trained during normal conditions may perform poorly during a crisis. Skilled forecasters therefore present ranges and scenarios rather than a single precise number.','What false assumption causes failure?','Relationships will remain stable',['Data is unnecessary','Crises never happen'],'What do skilled forecasters present?','Ranges and scenarios',['One exact number','Only past data']],
  ['B2','Public space and trust','Well-designed public spaces allow strangers to share an environment without needing to interact directly. Repeated low-risk encounters can gradually increase familiarity and trust. However, if a space is dominated by commercial activity, people who cannot afford to spend money may feel excluded.','How can trust develop?','Repeated low-risk encounters',['Forced conversation','Expensive events'],'Who may feel excluded?','People unable to spend money',['Local shop owners','Regular visitors']],
  ['C1','The measurement trap','When a measure becomes a target, people may optimize the number while neglecting the purpose behind it. A school judged solely by test results may narrow its curriculum; a support team rewarded for short calls may end conversations before problems are resolved. Measurement remains necessary, but multiple indicators and qualitative judgment reduce the risk of distortion.','What happens when a measure becomes a target?','The number replaces the underlying purpose',['Measurement becomes impossible','Quality always rises'],'How can distortion be reduced?','Multiple indicators and judgment',['One strict metric','Removing all assessment']],
  ['C1','Productive disagreement','Groups often pursue harmony because conflict feels inefficient. Yet premature agreement can conceal weak assumptions and silence useful evidence. Productive disagreement is not personal opposition: it requires participants to challenge claims, explain standards of proof and remain willing to revise their own position.','Why can harmony be harmful?','It can hide weak assumptions',['It always creates conflict','It increases evidence'],'What defines productive disagreement?','Challenging claims while remaining open to revision',['Defending one view forever','Avoiding standards of proof']],
].map((row,index)=>({id:`reading-${index}`,level:row[0],title:row[1],text:row[2],questions:[{prompt:row[3],answer:row[4],options:[row[4],...row[5]]},{prompt:row[6],answer:row[7],options:[row[7],...row[8]]}]}));

export const storyChapters = [
  {id:'chapter-1',title:'Неожиданное письмо',emoji:'✉️',text:'В первый день новой работы Лена получает письмо, отправленное сотрудником, которого нет в списке компании. В нём сказано: “Не доверяй итоговому отчёту”.',choices:[['Спросить менеджера прямо','manager',2],['Тихо проверить автора и отчёт','research',3],['Удалить странное письмо','ignore',0]]},
  {id:'chapter-2',title:'След в данных',emoji:'🔍',text:'В отчёте Лена находит повторяющиеся записи, из-за которых результат выглядит лучше. Коллега Том просит не задерживать публикацию.',choices:[['Показать Тому конкретные записи','evidence',3],['Обвинить Тома в подделке','accuse',0],['Исправить данные молча','silent',1]]},
  {id:'chapter-3',title:'Сложный союзник',emoji:'🤝',text:'Том признаёт проблему: старое программное обеспечение иногда дублирует данные. Но руководство не хочет оплачивать обновление.',choices:[['Предложить временную проверку и план обновления','plan',3],['Сразу написать публичный пост','public',0],['Отказаться участвовать','exit',1]]},
  {id:'chapter-4',title:'Решение совета',emoji:'🏛️',text:'На встрече директор спрашивает, можно ли выпустить отчёт сейчас и добавить исправление позднее.',choices:[['Объяснить риск и предложить точный новый срок','delay',3],['Согласиться ради команды','agree',0],['Сказать, что решение не ваше','avoid',1]]},
  {id:'chapter-5',title:'Цена правды',emoji:'⚖️',text:'Исправленный отчёт показывает более скромный результат, но клиент благодарит команду за прозрачность. Лене предлагают возглавить новый процесс качества.',choices:[['Принять и создать открытый контроль качества','leader',3],['Принять, но скрыть прошлую ошибку','hide',1],['Отказаться из-за риска','safe',0]]},
];

export const marathonPlans = {
  7: ['Пройти персональный урок','Повторить 15 слов','Выполнить диктант','Прочитать текст','Пройти рабочий модуль','Потренировать произношение','Сдать смешанный экзамен'],
  30: Array.from({length:30},(_,i)=>[
    '10 новых слов','Один курс','Аудирование','Повторение ошибок','Время английского','Деловая фраза','История с вопросами','Письменное задание','Диалог','Грамматический блок'
  ][i%10]),
};
