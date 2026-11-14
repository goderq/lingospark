const choice = (id, prompt, answer, wrong, speak = answer) => ({ id, type: 'choice', prompt, options: [answer, ...wrong], answer, speak });
const translate = (id, prompt, answer, speak) => ({ id, type: 'translate', prompt, answer, answers: [answer.toLowerCase()], speak });

const expandedLessonBase = [
  { id: 'technology', unit: 18, difficulty: 'B1', title: 'Технологии', subtitle: 'Устройства, приложения и интернет', icon: 'hardware-chip', color: '#4D96FF', xp: 82, exercises: [
    choice('te1', '“The app keeps crashing” означает...', 'Приложение постоянно вылетает', ['Приложение обновляется', 'Телефон разрядился', 'Интернет ускорился']),
    choice('te2', 'I forgot my password, so I need to ___ it.', 'reset', ['install', 'stream', 'scroll']),
    translate('te3', 'Переведи: Back up your files regularly', 'Регулярно создавай резервные копии файлов', 'Back up your files regularly'),
    choice('te4', 'Что такое “two-factor authentication”?', 'двухфакторная аутентификация', ['двойная загрузка', 'быстрый пароль', 'общая сеть']),
    choice('te5', 'The update is compatible ___ older devices.', 'with', ['for', 'at', 'by']),
    translate('te6', 'Переведи: My connection is unstable', 'Моё соединение нестабильно', 'My connection is unstable'),
    choice('te7', 'Самая вежливая просьба в поддержку:', 'Could you help me troubleshoot this issue?', ['Fix it now', 'Your app is bad', 'Do troubleshooting']),
  ]},
  { id: 'environment', unit: 18, difficulty: 'B2', title: 'Экология', subtitle: 'Климат и устойчивое развитие', icon: 'leaf', color: '#2ECC71', xp: 92, exercises: [
    choice('ev1', '“Biodiversity loss” — это...', 'утрата биоразнообразия', ['ядерные отходы', 'рост лесов', 'очистка воды']),
    choice('ev2', 'Companies should reduce their carbon ___.', 'footprint', ['step', 'shadow', 'mark']),
    translate('ev3', 'Переведи: Sea levels are continuing to rise', 'Уровень моря продолжает повышаться', 'Sea levels are continuing to rise'),
    choice('ev4', '“Single-use plastic” означает...', 'одноразовый пластик', ['переработанный пластик', 'прочный пластик', 'биоматериал']),
    choice('ev5', 'The policy aims ___ cutting emissions.', 'at', ['on', 'for', 'to']),
    translate('ev6', 'Переведи: The damage may be irreversible', 'Ущерб может быть необратимым', 'The damage may be irreversible'),
    choice('ev7', 'Научная формулировка:', 'The evidence points to a significant decline in biodiversity.', ['Nature gets worse', 'Animals are less', 'Biodiversity is not good']),
  ]},
  { id: 'finance', unit: 19, difficulty: 'B2', title: 'Финансы', subtitle: 'Бюджет, инвестиции и экономика', icon: 'trending-up', color: '#F4B942', xp: 94, exercises: [
    choice('fi1', '“Living within your means” означает...', 'жить по средствам', ['брать кредиты', 'увеличивать доход', 'копить наличные']),
    choice('fi2', 'Interest rates have ___ sharply.', 'risen', ['raised', 'rose up', 'rised']),
    translate('fi3', 'Переведи: I set aside part of my salary every month', 'Я откладываю часть зарплаты каждый месяц', 'I set aside part of my salary every month'),
    choice('fi4', 'Что такое “emergency fund”?', 'резерв на непредвиденные расходы', ['пенсионный налог', 'кредитный лимит', 'страховой договор']),
    choice('fi5', 'The investment carries a high level of ___.', 'risk', ['chance', 'dangerous', 'losses']),
    translate('fi6', 'Переведи: Inflation has reduced purchasing power', 'Инфляция снизила покупательную способность', 'Inflation has reduced purchasing power'),
    choice('fi7', 'Точный деловой термин для «окупиться»:', 'pay off', ['pay back to', 'return money itself', 'cover up']),
  ]},
  { id: 'psychology', unit: 19, difficulty: 'B2', title: 'Психология', subtitle: 'Эмоции, привычки и мышление', icon: 'happy', color: '#9B6BFF', xp: 96, exercises: [
    choice('py1', '“Coping mechanism” — это...', 'способ справляться со стрессом', ['защитный рефлекс', 'тип памяти', 'черта характера']),
    choice('py2', 'We tend to ___ information that confirms our beliefs.', 'notice', ['noticing', 'noticed to', 'observation']),
    translate('py3', 'Переведи: Lack of sleep affects decision-making', 'Недостаток сна влияет на принятие решений', 'Lack of sleep affects decision-making'),
    choice('py4', '“Self-awareness” означает...', 'самосознание', ['самоуверенность', 'самокритика', 'самоконтроль']),
    choice('py5', 'She is gradually overcoming her fear ___ flying.', 'of', ['from', 'with', 'at']),
    translate('py6', 'Переведи: Habits are shaped by repeated behaviour', 'Привычки формируются повторяющимся поведением', 'Habits are shaped by repeated behaviour'),
    choice('py7', 'Естественное выражение:', 'I need some time to process what happened.', ['I must process the happening', 'I think this through my brain', 'I need digest event']),
  ]},
  { id: 'media', unit: 20, difficulty: 'C1', title: 'Медиа и информация', subtitle: 'Новости, аргументы и фактчекинг', icon: 'newspaper', color: '#FF6B6B', xp: 108, exercises: [
    choice('me1', '“Misleading headline” — это...', 'вводящий в заблуждение заголовок', ['секретная новость', 'рекламный текст', 'редакционная статья']),
    choice('me2', 'The claim was not supported ___ reliable evidence.', 'by', ['with', 'from', 'at']),
    translate('me3', 'Переведи: The report should be treated with caution', 'К этому отчёту следует относиться с осторожностью', 'The report should be treated with caution'),
    choice('me4', '“To verify a source” означает...', 'проверить источник', ['процитировать автора', 'скрыть публикацию', 'изменить заголовок']),
    choice('me5', 'The article draws a distinction ___ fact and opinion.', 'between', ['among', 'from', 'of']),
    translate('me6', 'Переведи: The figures were taken out of context', 'Цифры были вырваны из контекста', 'The figures were taken out of context'),
    choice('me7', 'Нейтральная академическая формулировка:', 'The available evidence remains inconclusive.', ['Nobody knows anything', 'The evidence is bad', 'It cannot be true']),
  ]},
  { id: 'relationships', unit: 20, difficulty: 'B1', title: 'Отношения и общение', subtitle: 'Границы, поддержка и конфликты', icon: 'people', color: '#FF7EB6', xp: 84, exercises: [
    choice('re1', '“We see eye to eye” означает...', 'Мы придерживаемся одного мнения', ['Мы часто спорим', 'Мы давно знакомы', 'Мы избегаем разговора']),
    choice('re2', 'It helps to talk things ___.', 'through', ['overly', 'away', 'down']),
    translate('re3', 'Переведи: I did not mean to hurt your feelings', 'Я не хотел задеть твои чувства', 'I did not mean to hurt your feelings'),
    choice('re4', 'Вежливо обозначить границу:', 'I’m not comfortable discussing that.', ['Do not ask me', 'That is none of your business', 'Stop this topic']),
    choice('re5', 'You can always count ___ me.', 'on', ['at', 'with', 'for']),
    translate('re6', 'Переведи: We managed to resolve the misunderstanding', 'Нам удалось разрешить недопонимание', 'We managed to resolve the misunderstanding'),
    choice('re7', '“To take someone for granted” означает...', 'не ценить человека должным образом', ['доверять человеку', 'просить об одолжении', 'поддерживать человека']),
  ]},
  { id: 'academic', unit: 21, difficulty: 'C1', title: 'Академический английский', subtitle: 'Исследования и аргументация', icon: 'library', color: '#5C7CFA', xp: 112, exercises: [
    choice('ac1', '“The findings suggest” означает...', 'результаты указывают', ['авторы доказывают', 'данные отсутствуют', 'исследование завершено']),
    choice('ac2', 'This argument is based ___ two assumptions.', 'on', ['in', 'at', 'from']),
    translate('ac3', 'Переведи: Further research is required to confirm the results', 'Для подтверждения результатов необходимы дальнейшие исследования', 'Further research is required to confirm the results'),
    choice('ac4', 'Лучший синоним “important” в научном тексте:', 'significant', ['big', 'nice', 'loud']),
    choice('ac5', 'The study accounts ___ regional differences.', 'for', ['of', 'with', 'to']),
    translate('ac6', 'Переведи: The sample was too small to draw firm conclusions', 'Выборка была слишком мала для однозначных выводов', 'The sample was too small to draw firm conclusions'),
    choice('ac7', 'Осторожное утверждение:', 'This may partly explain the observed pattern.', ['This definitely explains everything', 'It is obvious why', 'The pattern proves it']),
  ]},
  { id: 'negotiation', unit: 21, difficulty: 'C1', title: 'Сложные переговоры', subtitle: 'Компромиссы и убедительные аргументы', icon: 'swap-horizontal', color: '#00B8A9', xp: 115, exercises: [
    choice('ne1', '“To reach common ground” означает...', 'найти точки соприкосновения', ['уступить полностью', 'прервать переговоры', 'подписать контракт']),
    choice('ne2', 'We are willing to compromise, ___ certain conditions.', 'subject to', ['because to', 'despite of', 'according with']),
    translate('ne3', 'Переведи: That proposal does not address our main concern', 'Это предложение не решает нашу главную проблему', 'That proposal does not address our main concern'),
    choice('ne4', 'Дипломатичное несогласие:', 'I see your point, but I interpret the figures differently.', ['You are wrong', 'That makes no sense', 'I reject your figures']),
    choice('ne5', 'Let us explore an alternative that works ___ both sides.', 'for', ['to', 'at', 'by']),
    translate('ne6', 'Переведи: We cannot make further concessions', 'Мы не можем пойти на дальнейшие уступки', 'We cannot make further concessions'),
    choice('ne7', '“A deal-breaker” — это...', 'неприемлемое условие', ['выгодное предложение', 'пункт договора', 'устная договорённость']),
  ]},
];

export const expandedLessons = expandedLessonBase.map((lesson) => ({
  ...lesson,
  id: `deep-${lesson.id}`,
  exercises: lesson.exercises.map((exercise) => ({ ...exercise, id: `deep-${exercise.id}` })),
}));

export const advancedTimeModules = [
  { id: 'used-to', group: 'Advanced', name: 'Used to & Would', level: 'B1', formula: 'used to + V · would + V', use: 'Прошлые привычки и состояния, которых больше нет', markers: 'when I was young, in those days', example: 'I used to live near the sea.', exercises: [
    { prompt: 'We ___ play outside every evening.', options: ['used to', 'use to', 'were use'], answer: 'used to', explanation: 'Регулярная привычка в прошлом.' },
    { prompt: 'I ___ be very shy at school.', options: ['used to', 'would being', 'was use to'], answer: 'used to', explanation: 'Для прошлого состояния подходит used to.' },
    { prompt: 'Every summer, my grandfather ___ take us fishing.', options: ['would', 'was', 'has'], answer: 'would', explanation: 'Would описывает повторявшееся действие.' },
    { prompt: 'Did you ___ have long hair?', options: ['use to', 'used to', 'using to'], answer: 'use to', explanation: 'После did используется use to.' },
    { prompt: 'She is used to ___ early.', options: ['getting up', 'get up', 'got up'], answer: 'getting up', explanation: 'Be used to + герундий означает «быть привыкшим».' },
    { prompt: 'There ___ be a cinema here.', options: ['used to', 'would', 'is used'], answer: 'used to', explanation: 'Состояние в прошлом — used to.' },
  ]},
  { id: 'going-to', group: 'Advanced', name: 'Be Going To', level: 'A2', formula: 'am/is/are going to + V', use: 'Планы и прогнозы на основе видимых признаков', markers: 'look!, planned, intend', example: 'We are going to move next month.', exercises: [
    { prompt: 'Look at those clouds. It ___.', options: ['is going to rain', 'will raining', 'rains yesterday'], answer: 'is going to rain', explanation: 'Есть видимый признак будущего события.' },
    { prompt: 'I ___ start a new course next week.', options: ['am going to', 'going', 'will to'], answer: 'am going to', explanation: 'Заранее принятое намерение.' },
    { prompt: '___ they going to join us?', options: ['Are', 'Do', 'Will be'], answer: 'Are', explanation: 'Вопрос начинается с формы be.' },
    { prompt: 'She ___ going to sell the house.', options: ["isn't", "doesn't", "won't be to"], answer: "isn't", explanation: 'Отрицание строится с be + not.' },
    { prompt: 'Be careful! You ___ drop it.', options: ['are going to', 'will to', 'are drop'], answer: 'are going to', explanation: 'Прогноз по происходящему сейчас.' },
    { prompt: 'What ___ you going to do?', options: ['are', 'do', 'will'], answer: 'are', explanation: 'What are you going to do?' },
  ]},
  { id: 'future-in-past', group: 'Advanced', name: 'Future in the Past', level: 'B2', formula: 'would + V · was/were going to + V', use: 'Будущее с точки зрения прошлого', markers: 'said, knew, thought, promised', example: 'She said she would call later.', exercises: [
    { prompt: 'He promised he ___ help us.', options: ['would', 'will', 'is going'], answer: 'would', explanation: 'После глагола в прошлом will превращается в would.' },
    { prompt: 'I knew they ___ arrive late.', options: ['would', 'will', 'have'], answer: 'would', explanation: 'Будущее относительно прошлого момента.' },
    { prompt: 'We were going to leave, but it ___.', options: ['started raining', 'will rain', 'has rain'], answer: 'started raining', explanation: 'Запланированное действие не состоялось.' },
    { prompt: 'She said the meeting ___ at noon.', options: ['would start', 'will started', 'starts yesterday'], answer: 'would start', explanation: 'Косвенная речь в прошлом.' },
    { prompt: 'I thought you ___ understand.', options: ['would', 'will', 'are'], answer: 'would', explanation: 'Ожидание в прошлом о последующем событии.' },
    { prompt: 'They ___ visit us, but changed their plans.', options: ['were going to', 'are going to', 'would have now'], answer: 'were going to', explanation: 'Несостоявшийся план в прошлом.' },
  ]},
  { id: 'narrative-tenses', group: 'Advanced', name: 'Narrative Tenses', level: 'C1', formula: 'Past Simple + Continuous + Perfect', use: 'Сочетание времён для последовательного рассказа', markers: 'when, while, by the time, suddenly', example: 'I was walking home when I realised I had lost my keys.', exercises: [
    { prompt: 'I ___ home when the storm began.', options: ['was driving', 'had driven every day', 'have driven'], answer: 'was driving', explanation: 'Фоновый процесс — Past Continuous.' },
    { prompt: 'By the time we arrived, the film ___.', options: ['had started', 'was start', 'has started now'], answer: 'had started', explanation: 'Событие произошло раньше другого прошлого события.' },
    { prompt: 'Suddenly, someone ___ the door.', options: ['opened', 'was opening for hours', 'had open'], answer: 'opened', explanation: 'Короткое событие двигает сюжет.' },
    { prompt: 'She was tired because she ___ all night.', options: ['had been working', 'worked tomorrow', 'is working'], answer: 'had been working', explanation: 'Длительная причина прошлого результата.' },
    { prompt: 'While they ___, the alarm went off.', options: ['were talking', 'had talked tomorrow', 'talk'], answer: 'were talking', explanation: 'Фоновое действие прервано событием.' },
    { prompt: 'He recognised the place because he ___ there before.', options: ['had been', 'was being', 'has go'], answer: 'had been', explanation: 'Опыт предшествовал моменту узнавания.' },
  ]},
];

export const moreTenseDrills = {
  'present-simple': [
    { prompt: 'Water ___ at 100°C.', options: ['boils', 'is boiling every day', 'has boiled tomorrow'], answer: 'boils', explanation: 'Общеизвестный факт.' },
    { prompt: 'She rarely ___ late.', options: ['arrives', 'is arrive', 'has arriving'], answer: 'arrives', explanation: 'Rarely — маркер регулярности.' },
  ],
  'present-continuous': [
    { prompt: 'The climate ___ warmer.', options: ['is getting', 'gets right now always', 'has get'], answer: 'is getting', explanation: 'Постепенно меняющаяся ситуация.' },
    { prompt: 'I ___ tonight.', options: ["am not working", "don't working", "haven't work"], answer: "am not working", explanation: 'Временная договорённость на ближайшее время.' },
  ],
  'present-perfect': [
    { prompt: 'I ___ my keys. Have you seen them?', options: ['have lost', 'lost yesterday', 'am losing'], answer: 'have lost', explanation: 'Результат важен сейчас.' },
    { prompt: 'She ___ here since 2020.', options: ['has lived', 'lived yesterday', 'is live'], answer: 'has lived', explanation: 'Since связывает прошлое с настоящим.' },
  ],
  'present-perfect-continuous': [
    { prompt: 'They ___ about this issue for months.', options: ['have been arguing', 'are argue', 'argued tomorrow'], answer: 'have been arguing', explanation: 'Длительный незавершённый процесс.' },
    { prompt: 'Your hands are dirty. What ___ you ___?', options: ['have / been doing', 'did / doing', 'are / do'], answer: 'have / been doing', explanation: 'Видимый результат недавнего процесса.' },
  ],
  'past-simple': [
    { prompt: 'The meeting ___ two hours ago.', options: ['ended', 'has ended', 'is ending'], answer: 'ended', explanation: 'Ago требует Past Simple.' },
    { prompt: 'Where ___ you go last weekend?', options: ['did', 'have', 'were'], answer: 'did', explanation: 'Last weekend — завершённое прошлое.' },
  ],
  'past-continuous': [
    { prompt: 'It ___ when we left.', options: ['was snowing', 'snowed usually', 'has snowed'], answer: 'was snowing', explanation: 'Процесс в момент прошлого.' },
    { prompt: 'I ___ attention while he was speaking.', options: ["wasn't paying", "didn't paying", "haven't pay"], answer: "wasn't paying", explanation: 'Два параллельных процесса в прошлом.' },
  ],
  'past-perfect': [
    { prompt: 'He apologised after he ___ his mistake.', options: ['had realised', 'has realised now', 'realises'], answer: 'had realised', explanation: 'Осознание произошло до извинения.' },
    { prompt: 'We could not enter because someone ___ the door.', options: ['had locked', 'locks', 'has lock'], answer: 'had locked', explanation: 'Блокировка произошла раньше попытки войти.' },
  ],
  'past-perfect-continuous': [
    { prompt: 'The ground was wet because it ___.', options: ['had been raining', 'rains', 'was rain'], answer: 'had been raining', explanation: 'Процесс объясняет прошлый результат.' },
    { prompt: 'She ___ for weeks before she got an answer.', options: ['had been waiting', 'has waiting', 'was waited'], answer: 'had been waiting', explanation: 'Длительность до события в прошлом.' },
  ],
  'future-simple': [
    { prompt: 'Perhaps they ___ later.', options: ['will call', 'are call', 'called tomorrow'], answer: 'will call', explanation: 'Предположение о будущем.' },
    { prompt: 'I ___ carry that for you.', options: ['will', 'am', 'did'], answer: 'will', explanation: 'Спонтанное предложение помощи.' },
  ],
  'future-continuous': [
    { prompt: 'This time next week, we ___ abroad.', options: ['will be travelling', 'travel yesterday', 'have travel'], answer: 'will be travelling', explanation: 'Процесс в момент будущего.' },
    { prompt: 'At noon, she ___ with the client.', options: ['will be meeting', 'met tomorrow', 'has meet'], answer: 'will be meeting', explanation: 'Запланированный будущий процесс.' },
  ],
  'future-perfect': [
    { prompt: 'By six, they ___ the work.', options: ['will have finished', 'will finish yesterday', 'have finishing'], answer: 'will have finished', explanation: 'Результат к будущему сроку.' },
    { prompt: 'By then, you ___ enough experience.', options: ['will have gained', 'will gaining', 'gain yesterday'], answer: 'will have gained', explanation: 'Накопленный результат к моменту будущего.' },
  ],
  'future-perfect-continuous': [
    { prompt: 'By Friday, I ___ for twelve days.', options: ['will have been travelling', 'will travel yesterday', 'am travel'], answer: 'will have been travelling', explanation: 'Длительность к будущей границе.' },
    { prompt: 'In July, he ___ here for five years.', options: ['will have been teaching', 'will teaching', 'has teach'], answer: 'will have been teaching', explanation: 'Продолжительность процесса к июлю.' },
  ],
};
