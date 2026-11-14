export const branchingDialogues = [
  {
    id: 'salary-talk', title: 'Переговоры о зарплате', level: 'B2', emoji: '💼', intro: 'Добейтесь пересмотра зарплаты, сохранив профессиональный тон.',
    start: 'opening', nodes: {
      opening: { speaker: 'Manager', line: 'You wanted to discuss your role?', choices: [
        ['Yes. I would like to review my responsibilities and compensation.','evidence',2],
        ['Yes, I deserve more money immediately.','defensive',0],
        ['Actually, it does not matter.','exit',0],
      ]},
      evidence: { speaker: 'Manager', line: 'What makes you think an adjustment is appropriate?', choices: [
        ['I have taken on two major accounts and improved retention by fifteen percent.','offer',2],
        ['Everything is more expensive now.','weak',1],
        ['Other people probably earn more than I do.','defensive',0],
      ]},
      offer: { speaker: 'Manager', line: 'Those results are valuable. What did you have in mind?', choices: [
        ['I would welcome an adjustment aligned with the expanded role.','success',2],
        ['Give me twenty percent or I leave.','fail',0],
        ['Whatever you decide is fine.','partial',1],
      ]},
      weak: { speaker: 'Manager', line: 'I understand, but I need a business case.', choices: [['Let me show you the measurable results I delivered.','offer',2],['Then forget it.','fail',0],['Everyone knows I work hard.','partial',1]] },
      defensive: { speaker: 'Manager', line: 'That approach makes this conversation difficult.', choices: [['You are right. Let me focus on my results and responsibilities.','evidence',2],['I am only telling the truth.','fail',0],['We can talk another time.','exit',1]] },
      success: { ending: 'Отличный результат', text: 'Вы привели факты и договорились о формальном пересмотре зарплаты.', tone: 'success' },
      partial: { ending: 'Компромисс', text: 'Разговор прошёл спокойно, но конкретного решения пока нет.', tone: 'partial' },
      fail: { ending: 'Переговоры сорвались', text: 'Ультиматум закрыл возможность конструктивного обсуждения.', tone: 'fail' },
      exit: { ending: 'Возможность отложена', text: 'Вы завершили разговор, не изложив свою позицию.', tone: 'partial' },
    },
  },
  {
    id: 'missed-flight', title: 'Отменённый рейс', level: 'B1', emoji: '✈️', intro: 'Найдите подходящий новый рейс и помощь с ночёвкой.',
    start: 'opening', nodes: {
      opening: { speaker: 'Agent', line: 'I am afraid your flight has been cancelled.', choices: [['Could you explain the available alternatives, please?','options',2],['This is unacceptable! Fix it now!','angry',0],['Okay, I will sleep here.','exit',0]] },
      options: { speaker: 'Agent', line: 'There is a flight tomorrow morning or one tonight with two connections.', choices: [['The morning flight sounds safer. Will accommodation be provided?','hotel',2],['Put me on anything at all.','partial',1],['I refuse both choices.','fail',0]] },
      hotel: { speaker: 'Agent', line: 'Yes, we can provide a hotel and airport transfer.', choices: [['Thank you. Could I also have written confirmation?','success',2],['That is the least you can do.','partial',1],['I want cash instead.','fail',0]] },
      angry: { speaker: 'Agent', line: 'I want to help, but I need you to choose an alternative.', choices: [['I apologize. What is the most reliable option?','options',2],['Your company is terrible.','fail',0],['Never mind.','exit',0]] },
      success: { ending: 'Маршрут восстановлен', text: 'Вы получили новый билет, отель и письменное подтверждение.', tone: 'success' }, partial: { ending: 'Решение найдено', text: 'Вы улетите, хотя детали поездки не идеальны.', tone: 'partial' }, fail: { ending: 'Помощь не оформлена', text: 'Разговор закончился без практического решения.', tone: 'fail' }, exit: { ending: 'Вы остались без плана', text: 'Нужно было уточнить доступные варианты.', tone: 'fail' },
    },
  },
  {
    id: 'team-conflict', title: 'Конфликт в команде', level: 'C1', emoji: '🤝', intro: 'Помогите двум коллегам договориться о совместной работе.',
    start: 'opening', nodes: {
      opening: { speaker: 'Alex', line: 'Sam keeps changing my work without asking.', choices: [['Let us separate the facts from our assumptions first.','facts',2],['Sam, why are you causing problems?','angry',0],['You both need to calm down.','partial',1]] },
      facts: { speaker: 'Sam', line: 'I changed it because the client updated the requirements.', choices: [['Did both of you receive the same update from the client?','cause',2],['Then Alex is clearly wrong.','fail',0],['Changes happen. Let us move on.','partial',1]] },
      cause: { speaker: 'Alex', line: 'No, I was not included in that email.', choices: [['The gap is communication, not effort. Let us agree on a shared update process.','success',2],['Sam should apologize and take the blame.','partial',1],['Alex should check every email himself.','fail',0]] },
      angry: { speaker: 'Sam', line: 'I was trying to protect the deadline.', choices: [['I phrased that unfairly. Please explain what happened.','facts',2],['That is just an excuse.','fail',0],['Fine, forget the discussion.','partial',0]] },
      success: { ending: 'Рабочий процесс исправлен', text: 'Команда нашла первопричину и договорилась об общем канале обновлений.', tone: 'success' }, partial: { ending: 'Временное перемирие', text: 'Спор остановлен, но системная причина осталась.', tone: 'partial' }, fail: { ending: 'Конфликт усилился', text: 'Обвинения помешали участникам разобраться в фактах.', tone: 'fail' },
    },
  },
  {
    id: 'medical-visit', title: 'Приём у врача', level: 'A2', emoji: '🩺', intro: 'Точно опишите симптомы и поймите рекомендации.',
    start: 'opening', nodes: {
      opening: { speaker: 'Doctor', line: 'What seems to be the problem?', choices: [['I have had a headache and a fever since yesterday.','details',2],['I am bad and sick.','partial',1],['Give me some medicine.','fail',0]] },
      details: { speaker: 'Doctor', line: 'Do you have any other symptoms?', choices: [['I also have a sore throat, but I am not coughing.','advice',2],['Maybe everything. I do not know.','partial',1],['No questions, please.','fail',0]] },
      advice: { speaker: 'Doctor', line: 'Rest, drink water, and call us if the fever gets worse.', choices: [['How long should I wait before calling again?','success',2],['Okay, whatever.','partial',1],['I need antibiotics now.','fail',0]] },
      success: { ending: 'Рекомендации понятны', text: 'Вы точно описали симптомы и уточнили дальнейшие действия.', tone: 'success' }, partial: { ending: 'Не все детали ясны', text: 'Врач помог, но описание симптомов было недостаточно точным.', tone: 'partial' }, fail: { ending: 'Разговор не завершён', text: 'Требование лекарства без обсуждения не помогло диагностике.', tone: 'fail' },
    },
  },
  {
    id: 'project-delay', title: 'Задержка проекта', level: 'B2', emoji: '📊', intro: 'Сообщите клиенту о задержке и сохраните доверие.',
    start: 'opening', nodes: {
      opening: { speaker: 'Client', line: 'Will the product be ready on Monday?', choices: [['Testing revealed an issue, so we need two additional days.','plan',2],['Probably not. Things went wrong.','partial',1],['The deadline was unrealistic anyway.','fail',0]] },
      plan: { speaker: 'Client', line: 'Why am I only hearing about this now?', choices: [['You should have been informed earlier, and I take responsibility for that.','repair',2],['We only discovered it today.','partial',1],['My colleague forgot to tell you.','fail',0]] },
      repair: { speaker: 'Client', line: 'How will you prevent another delay?', choices: [['We added a daily quality review and will send you progress updates.','success',2],['We will try harder.','partial',1],['Another delay is impossible.','fail',0]] },
      success: { ending: 'Доверие сохранено', text: 'Вы признали ошибку и предложили измеримый план.', tone: 'success' }, partial: { ending: 'Клиент сомневается', text: 'Срок согласован, но план звучит недостаточно конкретно.', tone: 'partial' }, fail: { ending: 'Доверие потеряно', text: 'Перекладывание ответственности ухудшило ситуацию.', tone: 'fail' },
    },
  },
  {
    id: 'research-debate', title: 'Научная дискуссия', level: 'C1', emoji: '🔬', intro: 'Защитите вывод, не преувеличивая силу доказательств.',
    start: 'opening', nodes: {
      opening: { speaker: 'Reviewer', line: 'Your sample seems too small to support this conclusion.', choices: [['That is a valid limitation; our conclusion is deliberately cautious.','evidence',2],['The sample is perfectly adequate.','fail',0],['All studies have limitations.','partial',1]] },
      evidence: { speaker: 'Reviewer', line: 'What evidence strengthens your interpretation?', choices: [['The effect appears across three measures, although replication is still needed.','scope',2],['The result is statistically significant, so it must be true.','fail',0],['Several colleagues agree with us.','partial',1]] },
      scope: { speaker: 'Reviewer', line: 'How should readers apply the finding?', choices: [['As preliminary evidence that guides further testing, not as a universal rule.','success',2],['They should change policy immediately.','fail',0],['They can interpret it however they like.','partial',0]] },
      success: { ending: 'Убедительная защита', text: 'Вы признали ограничения и точно определили область вывода.', tone: 'success' }, partial: { ending: 'Аргумент частично принят', text: 'Позиция понятна, но ей не хватает опоры на данные.', tone: 'partial' }, fail: { ending: 'Вывод переоценён', text: 'Категоричные заявления ослабили научный аргумент.', tone: 'fail' },
    },
  },
  {
    id: 'apartment-viewing', title: 'Аренда квартиры', level: 'A2', emoji: '🏠', intro: 'Осмотрите квартиру и уточните важные условия до подписания договора.',
    start: 'opening', nodes: {
      opening: { speaker: 'Landlord', line: 'Would you like me to show you around?', choices: [['Yes, please. Is the rent inclusive of utilities?','terms',2],['The flat looks fine. I will take it.','partial',1],['This place is too small.','fail',0]] },
      terms: { speaker: 'Landlord', line: 'Heating is included, but electricity is separate.', choices: [['Thank you. How much is the deposit, and is it refundable?','contract',2],['Okay. Where do I sign?','partial',1],['I will not pay for electricity.','fail',0]] },
      contract: { speaker: 'Landlord', line: 'The deposit is one month’s rent and is refundable.', choices: [['Could I read the tenancy agreement before deciding?','success',2],['I trust you. No need for a contract.','fail',0],['Can I pay sometime later?','partial',1]] },
      success: { ending: 'Условия проверены', text: 'Вы уточнили расходы, депозит и попросили договор до оплаты.', tone: 'success' }, partial: { ending: 'Решение поспешное', text: 'Квартира подходит, но часть условий осталась неясной.', tone: 'partial' }, fail: { ending: 'Сделка не состоялась', text: 'Резкий ответ или отказ от договора создали лишний риск.', tone: 'fail' },
    },
  },
  {
    id: 'restaurant-problem', title: 'Ошибка в ресторане', level: 'A2', emoji: '🍽️', intro: 'Вежливо объясните проблему с заказом и получите замену.',
    start: 'opening', nodes: {
      opening: { speaker: 'Waiter', line: 'Is everything all right with your meal?', choices: [['I am afraid I ordered the vegetarian dish, not the chicken.','solution',2],['No. This is completely wrong.','partial',1],['Take it away.','fail',0]] },
      solution: { speaker: 'Waiter', line: 'I apologize. Would you like us to replace it?', choices: [['Yes, please. Could you also check that it contains no meat?','wait',2],['Obviously. Be quick.','partial',1],['No, but I will not pay.','fail',0]] },
      wait: { speaker: 'Waiter', line: 'Certainly. It will take about ten minutes.', choices: [['That is fine, thank you for sorting it out.','success',2],['Ten minutes is impossible.','partial',1],['Bring me anything else.','fail',0]] },
      success: { ending: 'Заказ исправлен', text: 'Вы ясно описали ошибку и подтвердили важное требование.', tone: 'success' }, partial: { ending: 'Блюдо заменят', text: 'Проблема решена, хотя тон можно было сделать мягче.', tone: 'partial' }, fail: { ending: 'Разговор зашёл в тупик', text: 'Без ясной просьбы официант не смог предложить подходящее решение.', tone: 'fail' },
    },
  },
  {
    id: 'job-interview', title: 'Собеседование', level: 'B1', emoji: '🎯', intro: 'Расскажите о своём опыте и задайте сильный вопрос работодателю.',
    start: 'opening', nodes: {
      opening: { speaker: 'Interviewer', line: 'Could you tell me about yourself?', choices: [['I have three years of customer support experience and enjoy solving complex problems.','example',2],['Everything is already in my CV.','fail',0],['I am a hard-working person.','partial',1]] },
      example: { speaker: 'Interviewer', line: 'Can you give me an example of a difficult problem you solved?', choices: [['I reorganized our response process and reduced waiting time by thirty percent.','questions',2],['I solve difficult problems every day.','partial',1],['I cannot remember one right now.','fail',0]] },
      questions: { speaker: 'Interviewer', line: 'Do you have any questions for us?', choices: [['How would success in this role be measured during the first three months?','success',2],['How soon can I take a holiday?','partial',1],['No, I know everything I need.','fail',0]] },
      success: { ending: 'Сильное впечатление', text: 'Вы подтвердили опыт результатом и проявили интерес к ожиданиям компании.', tone: 'success' }, partial: { ending: 'Неплохой разговор', text: 'Ответы понятны, но им не хватило конкретных примеров.', tone: 'partial' }, fail: { ending: 'Опыт не раскрыт', text: 'Короткие закрытые ответы не позволили показать ваши сильные стороны.', tone: 'fail' },
    },
  },
  {
    id: 'neighbour-noise', title: 'Разговор с соседом', level: 'B2', emoji: '🌙', intro: 'Решите проблему с шумом спокойно и без конфликта.',
    start: 'opening', nodes: {
      opening: { speaker: 'Neighbour', line: 'Hi. Is something wrong?', choices: [['The music has been quite loud after midnight. Could we find a solution?','context',2],['You make noise every night.','partial',1],['Turn it off or I will call the police.','fail',0]] },
      context: { speaker: 'Neighbour', line: 'I did not realize you could hear it so clearly.', choices: [['The walls are thin, and I start work early. Would you mind using headphones after eleven?','agreement',2],['You should have known that.','partial',1],['That is not my problem.','fail',0]] },
      agreement: { speaker: 'Neighbour', line: 'That sounds reasonable. Please tell me if it happens again.', choices: [['Thank you, I appreciate it. I will speak to you directly if there is a problem.','success',2],['It had better not happen again.','partial',1],['I will still report this.','fail',0]] },
      success: { ending: 'Соседи договорились', text: 'Вы описали факты, объяснили влияние и предложили конкретный компромисс.', tone: 'success' }, partial: { ending: 'Напряжение осталось', text: 'Шум, вероятно, прекратится, но резкий тон ухудшил отношения.', tone: 'partial' }, fail: { ending: 'Конфликт усилился', text: 'Угроза до обсуждения решения вызвала защитную реакцию.', tone: 'fail' },
    },
  },
];

export const ieltsReading = [
  { id:'r1', level:'6.0', title:'Urban trees', passage:'Cities around the world are planting trees to reduce summer temperatures. Leaves provide shade, while evaporation from the tree surface cools the surrounding air. However, the benefits depend on species, location and long-term maintenance. A poorly chosen tree may damage pavements or require more water than the local climate can provide.', questions:[
    ['What are two cooling mechanisms?','Shade and evaporation',['Rain and wind','Roots and soil']],['Do all trees provide equal benefits?','No, species and location matter',['Yes, always','Only old trees work']],['What is one possible disadvantage?','Damage to pavements',['Lower rainfall','More traffic']],
  ]},
  { id:'r2', level:'6.5', title:'The value of sleep', passage:'Sleep was once regarded as a passive state, but research now shows that the brain remains highly active. During sleep it consolidates memories, regulates emotion and removes metabolic waste. Cutting sleep to gain extra working time may therefore reduce, rather than increase, overall productivity.', questions:[
    ['How was sleep viewed in the past?','As a passive state',['As exercise','As a disease']],['What happens to memories during sleep?','They are consolidated',['They disappear','They become inaccurate']],['What paradox does the passage describe?','Less sleep may reduce productivity',['More work causes sleep','Sleep requires work']],
  ]},
  { id:'r3', level:'7.0', title:'Citizen science', passage:'Citizen-science projects invite members of the public to collect observations for professional researchers. Their scale can produce datasets that no small laboratory could gather alone. Critics question the consistency of volunteer observations, yet digital training and automatic checks increasingly allow researchers to identify unreliable entries.', questions:[
    ['What is the main advantage?','Large-scale data collection',['Free laboratory buildings','Faster publication']],['What concern do critics raise?','Data consistency',['Public interest','Digital costs']],['How is the concern addressed?','Training and automatic checks',['Smaller datasets','Paid advertising']],
  ]},
  { id:'r4', level:'7.5', title:'The productivity paradox', passage:'New technology does not always produce immediate gains in productivity. Organizations often install a tool without redesigning the processes around it. Employees must then maintain old routines while learning the new system, temporarily increasing their workload. Meaningful gains emerge only when institutions adapt structures, incentives and skills together.', questions:[
    ['Why can technology initially increase workload?','Old and new routines coexist',['The tools stop working','Employees work fewer hours']],['What mistake do organizations make?','They fail to redesign processes',['They train too much','They remove all routines']],['When do gains emerge?','When structures, incentives and skills adapt together',['Immediately after purchase','Before installation']],
  ]},
];

export const ieltsListening = [
  { id:'l1', title:'Library orientation', text:'The library opens at eight thirty on weekdays. Group study rooms must be booked online, but individual desks are available without a reservation. Please remember that the second floor is a silent area.', questions:[['When does the library open?','At 8:30',['At 8:00','At 9:30']],['What requires booking?','Group study rooms',['Individual desks','The second floor']],['Where must students remain silent?','On the second floor',['At the entrance','In group rooms']]] },
  { id:'l2', title:'Course change', text:'The photography workshop has moved from Saturday morning to Sunday afternoon. It will still take place in Room Twelve, and participants should bring a camera but not a laptop.', questions:[['When is the workshop now?','Sunday afternoon',['Saturday morning','Sunday morning']],['Where is it?','Room Twelve',['Room Twenty','The main hall']],['What should participants bring?','A camera',['A laptop','A printer']]] },
  { id:'l3', title:'Research interview', text:'We initially expected price to determine customer loyalty. Interviews revealed, however, that reliable support mattered more. Price influenced the first purchase, whereas support determined whether customers returned.', questions:[['What was the initial expectation?','Price determined loyalty',['Support was irrelevant','Customers never returned']],['What mattered more in interviews?','Reliable support',['Advertising','Product color']],['What did price influence?','The first purchase',['Repeat purchases','Support quality']]] },
  { id:'l4', title:'Museum redevelopment', text:'The museum will close its east wing for six months. The renovation will create accessible entrances and improve climate control. Although some exhibits will go into storage, the most popular collection will move temporarily to the west wing.', questions:[['How long will the east wing close?','Six months',['Six weeks','One year']],['What will improve?','Access and climate control',['Ticket prices','Parking']],['Where will the popular collection go?','The west wing',['Storage','Another museum']]] },
];

export const ieltsWriting = [
  { type:'Task 1', title:'Изменение транспорта', prompt:'The chart shows the percentage of commuters using cars, buses and bicycles in 2000 and 2025. Summarize the main features and make comparisons.', checklist:['введение своими словами','общий обзор главных тенденций','точные сравнения','без личного мнения'] },
  { type:'Task 1', title:'Письмо арендодателю', prompt:'Write a letter about a recurring heating problem. Describe the issue, explain its impact and request action.', checklist:['цель письма','конкретные детали','влияние проблемы','вежливая просьба'] },
  { type:'Task 2', title:'Технологии и общение', prompt:'Some people believe technology improves communication, while others think it damages real relationships. Discuss both views and give your opinion.', checklist:['обе точки зрения','ясная позиция','примеры','логичный вывод'] },
  { type:'Task 2', title:'Образование', prompt:'Universities should focus on practical employment skills rather than academic knowledge. To what extent do you agree or disagree?', checklist:['степень согласия','два развитых аргумента','контраргумент','вывод'] },
  { type:'Task 2', title:'Окружающая среда', prompt:'Individual actions have little effect on environmental problems; governments and companies must solve them. Discuss and give your opinion.', checklist:['роль людей','роль организаций','сбалансированная оценка','пример'] },
  { type:'Task 2', title:'Городская жизнь', prompt:'More people are choosing to live alone in large cities. Is this a positive or negative development?', checklist:['чёткий ответ','социальные последствия','экономические последствия','вывод'] },
];

export const ieltsSpeaking = [
  ['Part 1','Home','Describe the place where you live. What do you like about it?'],['Part 1','Learning','How do you prefer to learn a new skill?'],
  ['Part 1','Routine','Which part of your daily routine would you like to change?'],['Part 2','A useful skill','Describe a useful skill you learned. Say when, how and why it matters.'],
  ['Part 2','A difficult decision','Describe a difficult decision you made and explain the result.'],['Part 2','A memorable journey','Describe a journey you remember well and explain why.'],
  ['Part 2','A person you admire','Describe a person whose work you admire.'],['Part 3','Education','Should schools teach more practical skills? Why?'],
  ['Part 3','Technology','How might artificial intelligence change employment?'],['Part 3','Cities','Why do some cities feel more liveable than others?'],
  ['Part 3','Environment','Who should pay for environmental protection?'],['Part 3','Culture','Does globalization weaken or strengthen local culture?'],
].map((row,index)=>({id:`s-${index}`,part:row[0],title:row[1],prompt:row[2]}));
