const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

const actions = [
  ['book a table', 'забронировать столик'], ['change my ticket', 'изменить билет'], ['check the details', 'проверить детали'],
  ['call the manager', 'позвонить менеджеру'], ['send the document', 'отправить документ'], ['confirm the address', 'подтвердить адрес'],
  ['solve this problem', 'решить эту проблему'], ['finish the report', 'закончить отчёт'], ['move the meeting', 'перенести встречу'],
  ['ask for directions', 'спросить дорогу'], ['return this item', 'вернуть этот товар'], ['make an appointment', 'записаться на приём'],
  ['improve the plan', 'улучшить план'], ['compare the results', 'сравнить результаты'], ['explain the decision', 'объяснить решение'],
  ['review the contract', 'проверить договор'], ['protect the environment', 'защищать окружающую среду'], ['reduce the costs', 'снизить расходы'],
  ['collect more evidence', 'собрать больше доказательств'], ['consider another approach', 'рассмотреть другой подход'], ['clarify the requirements', 'уточнить требования'],
  ['update the schedule', 'обновить расписание'], ['prepare a presentation', 'подготовить презентацию'], ['contact customer support', 'связаться с поддержкой'],
  ['learn from the mistake', 'извлечь урок из ошибки'], ['negotiate a better price', 'договориться о лучшей цене'], ['measure the progress', 'измерить прогресс'],
  ['challenge the assumption', 'оспорить предположение'], ['summarize the findings', 'обобщить выводы'], ['justify the proposal', 'обосновать предложение'],
];

const dictationTemplates = [
  ([en, ru]) => [`I need to ${en}`, `Мне нужно ${ru}`],
  ([en, ru]) => [`Could you ${en}, please?`, `Не могли бы вы ${ru}?`],
  ([en, ru]) => [`We should ${en} before Friday`, `Нам стоит ${ru} до пятницы`],
  ([en, ru]) => [`They decided to ${en}`, `Они решили ${ru}`],
];

export const extraDictations = actions.slice(0, 23).flatMap((action, actionIndex) =>
  dictationTemplates.map((make, templateIndex) => {
    const [text, translation] = make(action);
    return { id: `dx-${actionIndex}-${templateIndex}`, level: levels[Math.min(4, Math.floor(actionIndex / 5))], text, translation };
  }),
);

const builderTemplates = [
  ([en, ru]) => [`Мне нужно ${ru} сегодня`, `I need to ${en} today`],
  ([en, ru]) => [`Мы уже успели ${ru}`, `We have already managed to ${en}`],
  ([en, ru]) => [`Они решили ${ru} на прошлой неделе`, `They decided to ${en} last week`],
  ([en, ru]) => [`Если будет время, я постараюсь ${ru}`, `If I have time I will try to ${en}`],
  ([en, ru]) => [`Важно ${ru} до принятия решения`, `It is important to ${en} before making a decision`],
];

export const sentenceBuilderPack = actions.flatMap((action, actionIndex) =>
  builderTemplates.map((make, templateIndex) => {
    const [prompt, answer] = make(action);
    return { id: `builder-mega-${actionIndex}-${templateIndex}`, prompt, answer, words: answer.split(' '), level: levels[Math.min(4, Math.floor(actionIndex / 6))] };
  }),
);

const irregularRows = [
  ['arise','arose','arisen','возникать'],['awake','awoke','awoken','просыпаться'],['be','was/were','been','быть'],['bear','bore','borne','нести'],
  ['beat','beat','beaten','бить'],['become','became','become','становиться'],['begin','began','begun','начинать'],['bend','bent','bent','сгибать'],
  ['bet','bet','bet','держать пари'],['bind','bound','bound','связывать'],['bite','bit','bitten','кусать'],['bleed','bled','bled','кровоточить'],
  ['blow','blew','blown','дуть'],['break','broke','broken','ломать'],['breed','bred','bred','разводить'],['bring','brought','brought','приносить'],
  ['broadcast','broadcast','broadcast','транслировать'],['build','built','built','строить'],['burn','burnt','burnt','гореть'],['burst','burst','burst','лопаться'],
  ['buy','bought','bought','покупать'],['catch','caught','caught','ловить'],['choose','chose','chosen','выбирать'],['come','came','come','приходить'],
  ['cost','cost','cost','стоить'],['creep','crept','crept','ползти'],['cut','cut','cut','резать'],['deal','dealt','dealt','иметь дело'],
  ['dig','dug','dug','копать'],['do','did','done','делать'],['draw','drew','drawn','рисовать'],['dream','dreamt','dreamt','мечтать'],
  ['drink','drank','drunk','пить'],['drive','drove','driven','водить'],['eat','ate','eaten','есть'],['fall','fell','fallen','падать'],
  ['feed','fed','fed','кормить'],['feel','felt','felt','чувствовать'],['fight','fought','fought','сражаться'],['find','found','found','находить'],
  ['flee','fled','fled','убегать'],['fly','flew','flown','летать'],['forbid','forbade','forbidden','запрещать'],['forget','forgot','forgotten','забывать'],
  ['forgive','forgave','forgiven','прощать'],['freeze','froze','frozen','замерзать'],['get','got','got','получать'],['give','gave','given','давать'],
  ['go','went','gone','идти'],['grow','grew','grown','расти'],['hang','hung','hung','вешать'],['have','had','had','иметь'],
  ['hear','heard','heard','слышать'],['hide','hid','hidden','прятать'],['hit','hit','hit','ударять'],['hold','held','held','держать'],
  ['hurt','hurt','hurt','причинять боль'],['keep','kept','kept','хранить'],['know','knew','known','знать'],['lay','laid','laid','класть'],
  ['lead','led','led','вести'],['learn','learnt','learnt','учить'],['leave','left','left','уходить'],['lend','lent','lent','одалживать'],
  ['let','let','let','позволять'],['lie','lay','lain','лежать'],['lose','lost','lost','терять'],['make','made','made','создавать'],
  ['mean','meant','meant','означать'],['meet','met','met','встречать'],['pay','paid','paid','платить'],['put','put','put','класть'],
  ['read','read','read','читать'],['ride','rode','ridden','ездить верхом'],['ring','rang','rung','звонить'],['rise','rose','risen','подниматься'],
  ['run','ran','run','бежать'],['say','said','said','говорить'],['see','saw','seen','видеть'],['sell','sold','sold','продавать'],
  ['send','sent','sent','отправлять'],['shake','shook','shaken','трясти'],['shine','shone','shone','сиять'],['shoot','shot','shot','стрелять'],
  ['show','showed','shown','показывать'],['shut','shut','shut','закрывать'],['sing','sang','sung','петь'],['sink','sank','sunk','тонуть'],
  ['sit','sat','sat','сидеть'],['sleep','slept','slept','спать'],['speak','spoke','spoken','говорить'],['spend','spent','spent','тратить'],
  ['stand','stood','stood','стоять'],['steal','stole','stolen','красть'],['swim','swam','swum','плавать'],['take','took','taken','брать'],
  ['teach','taught','taught','обучать'],['tell','told','told','рассказывать'],['think','thought','thought','думать'],['write','wrote','written','писать'],
];

export const irregularVerbPack = irregularRows.map(([base, past, participle, russian], index) => ({ id: `iv-${index}`, base, past, participle, russian }));

const situations = [
  ['hotel','В отеле','🏨','A2','a quiet room','номер потише'],['restaurant','В ресторане','🍽️','A2','a vegetarian meal','вегетарианское блюдо'],
  ['doctor','У врача','🩺','A2','an appointment today','приём сегодня'],['shop','Возврат товара','🛍️','A2','a refund for this item','возврат денег за товар'],
  ['station','На вокзале','🚆','A2','a ticket to Oxford','билет до Оксфорда'],['phone','По телефону','📞','B1','to speak to Ms Green','поговорить с мисс Грин'],
  ['rental','Аренда машины','🚗','B1','an automatic car','машину с автоматической коробкой'],['neighbor','Соседи','🏠','B1','some help with a package','помощь с посылкой'],
  ['university','В университете','🎓','B1','information about the course','информацию о курсе'],['support','Техподдержка','🛠️','B1','help with my account','помощь с аккаунтом'],
  ['networking','Знакомство на конференции','🤝','B2','to learn about your project','узнать о вашем проекте'],['feedback','Обратная связь','💬','B2','specific feedback on my work','конкретную обратную связь'],
  ['negotiation','Переговоры','📊','B2','a more flexible deadline','более гибкий срок'],['complaint','Жалоба','📣','B2','a practical solution','практичное решение'],
  ['presentation','После презентации','🎤','B2','to clarify one point','уточнить один момент'],['leadership','Разговор с командой','🧭','C1','your perspective on the change','ваше мнение об изменении'],
  ['ethics','Этическая дискуссия','⚖️','C1','to examine the wider impact','рассмотреть более широкие последствия'],['research','Научный семинар','🔬','C1','more evidence for this claim','больше доказательств утверждения'],
  ['crisis','Кризисная встреча','🚨','C1','a sustainable response','устойчивое решение'],['policy','Обсуждение политики','🏛️','C1','a balanced compromise','сбалансированный компромисс'],
];

export const megaDialogues = situations.map(([id, title, emoji, level, request, requestRu], index) => ({
  id: `mega-${id}`, title, emoji, level, color: ['#36B8D9','#7C5CFC','#FF9F43','#2ED3B7','#FF5C8A'][index % 5],
  intro: `Разыграйте ситуацию «${title}» и добейтесь цели: ${requestRu}.`,
  steps: [
    { speaker: 'Partner', line: 'Hello. How can I help you today?', prompt: 'Вежливо начните разговор', options: [`Hello. I'd like ${request}, please.`, `Give me ${request} now.`, `I am wanting something.`], answer: `Hello. I'd like ${request}, please.` },
    { speaker: 'Partner', line: 'Certainly. Could you give me a little more detail?', prompt: 'Уточните просьбу', options: [`Of course. What I need is ${request}.`, `You must already understand me.`, `Details are not important.`], answer: `Of course. What I need is ${request}.` },
    { speaker: 'Partner', line: 'That should be possible. Is there anything else?', prompt: 'Завершите разговор естественно', options: [`No, that's everything. Thank you for your help.`, `Finally. That took too long.`, `No more things from me.`], answer: `No, that's everything. Thank you for your help.` },
  ],
}));

const storyIdeas = [
  ['The Lost Wallet','👛','A2','Mia','lost her wallet on a bus','a driver found it under a seat','she got it back that evening'],
  ['A New Neighbor','🏡','A2','Leo','felt nervous about meeting his neighbor','he baked a small cake and introduced himself','they became good friends'],
  ['The Rainy Picnic','🌧️','A2','Sofia','planned a picnic but it began to rain','she moved the picnic into the living room','everyone still had fun'],
  ['The Broken Bicycle','🚲','A2','Noah','found a flat tyre on his way to school','a local mechanic taught him how to fix it','he arrived late but learned a useful skill'],
  ['The First Presentation','📽️','B1','Amelia','was afraid of speaking to a large audience','she practised with a friend every evening','her presentation was clear and confident'],
  ['The Community Garden','🌱','B1','Oliver','noticed an empty piece of land near his home','he invited neighbors to create a garden','the area became a popular meeting place'],
  ['An Honest Review','⭐','B1','Isla','received a product that did not work','she wrote a calm and detailed review','the company replaced it and improved the design'],
  ['The Language Exchange','🗣️','B1','Jack','wanted to practise speaking naturally','he joined a weekly language exchange','he gained confidence and new friends'],
  ['A Change of Route','🗺️','B1','Lily','discovered that her usual road was closed','she followed a quieter path through the park','the new route became her favorite'],
  ['The Difficult Customer','🤝','B2','Ethan','faced an angry customer at work','he listened carefully and offered two solutions','the customer accepted an apology'],
  ['The Small Experiment','🧪','B2','Grace','doubted a popular claim online','she designed a simple experiment to test it','the results contradicted the claim'],
  ['A Second Chance','🔁','B2','Henry','failed an important entrance test','he studied his mistakes instead of giving up','he passed with a high score the next year'],
  ['The Silent Meeting','📝','B2','Chloe','noticed that junior colleagues rarely spoke','she collected ideas anonymously before meetings','the team made better decisions'],
  ['The Unexpected Mentor','🧠','B2','Oscar','struggled to lead his first project','a retired colleague offered practical advice','he learned to delegate effectively'],
  ['The Ethical Shortcut','⚖️','C1','Emily','was asked to hide an inconvenient result','she documented the evidence and raised the issue','the organization corrected its report'],
  ['The Algorithmic Bias','🤖','C1','James','found that a hiring tool rejected qualified candidates','he audited the data with an independent team','the biased rules were removed'],
  ['The Coastal Decision','🌊','C1','Ava','had to balance tourism with environmental protection','she brought residents and scientists together','they agreed on a long-term plan'],
];

export const extraStories = storyIdeas.map(([title, emoji, level, name, obstacle, solution, result], index) => ({
  id: `story-mega-${index}`, title, emoji, level, color: ['#36B8D9','#7C5CFC','#F0A43C','#2ED3B7','#FF5C8A'][index % 5],
  text: `${name} ${obstacle}. Instead of ignoring the situation, ${solution}. As a result, ${result}. The experience showed ${name} that a thoughtful response can turn a difficulty into an opportunity.`,
  translation: `${name}: возникла непростая ситуация. Герой не стал её игнорировать, нашёл разумное решение и получил хороший результат. Этот опыт показал, что трудность можно превратить в возможность.`,
  questions: [
    { prompt: `What problem did ${name} face?`, options: [obstacle, solution, result], answer: obstacle },
    { prompt: 'What was the result?', options: [result, 'nothing changed', 'the problem became worse'], answer: result },
  ],
}));

const bonusCharacters = [
  ['Nora','a small coastal town'],['Liam','a busy technology company'],['Maya','an international school'],['Ben','a neighborhood café'],['Zoe','a local research center'],
  ['Lucas','a community theater'],['Ella','a wildlife charity'],['Daniel','a growing startup'],['Sophie','a public library'],['Max','a city hospital'],
];
const bonusChallenges = [
  ['noticed that an important routine was wasting time','asked the people involved to map every step','the team removed unnecessary work and gained an hour each day'],
  ['received conflicting advice about a difficult choice','compared the evidence and questioned each assumption','the final decision was slower but much more reliable'],
  ['made a mistake that affected other people','admitted it immediately and proposed a practical repair','trust was restored and the process was improved'],
];

export const bonusStories = bonusCharacters.flatMap(([name, place], characterIndex) => bonusChallenges.map(([problem, action, outcome], challengeIndex) => ({
  id: `story-bonus-${characterIndex}-${challengeIndex}`,
  title: [`A Better Process`,`The Careful Choice`,`Owning the Mistake`][challengeIndex],
  emoji: ['⚙️','🔍','🧩'][challengeIndex], level: characterIndex < 3 ? 'A2' : characterIndex < 7 ? 'B1' : 'C1',
  color: ['#36B8D9','#7C5CFC','#FF9F43'][challengeIndex],
  text: `${name} worked at ${place} and ${problem}. ${name} ${action}. In the end, ${outcome}. The experience became a useful lesson for everyone involved.`,
  translation: `${name} столкнулся с непростой ситуацией в ${place}. Вместо поспешного решения герой разобрался в причинах, предпринял продуманные действия и превратил опыт в полезный урок для всей команды.`,
  questions: [
    { prompt: `What did ${name} do?`, options: [action, 'ignored the situation', 'left without explanation'], answer: action },
    { prompt: 'What was the outcome?', options: [outcome, 'nothing changed', 'the project was abandoned'], answer: outcome },
  ],
})));
