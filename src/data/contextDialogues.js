// Each step lists complete English replies that satisfy the same requested intent.
const scene = (id, title, level, topicIds, intro, speaker, turns) => ({
  id, title, level, topicIds, intro,
  steps: turns.map(([line, prompt, dialogueHint, explanation, answer, ...answers], index) => ({
    id: `scene-${id}-${index + 1}`, type: 'translate', skill: 'conversation', topic: title,
    context: `${speaker}: ${line}`, audio: line, prompt, dialogueHint, explanation, answer, answers,
  })),
});

export const contextDialogues = [
  scene('station', 'Найти дорогу к вокзалу', 'A1', ['travel'], 'Уточни путь, транспорт и время в дороге.', 'Passer-by', [
    ['Hi there. Do you need help?', 'Спроси, как добраться до вокзала.', 'How do I get to…?', 'Get to здесь означает «добраться до места».',
      'How do I get to the station?', 'How can I get to the station?', 'Could you tell me how to get to the station?', 'How do I get to the train station?'],
    ['It’s a long walk. You can go by bus.', 'Спроси, на какой автобус сесть.', 'Which bus…?', 'Take a bus означает «сесть на автобус» или «поехать на автобусе».',
      'Which bus should I take?', 'Which bus do I take?', 'What bus should I take?', 'Which bus can I take?'],
    ['Take bus number five. It stops right outside.', 'Спроси, сколько времени занимает поездка.', 'How long does it…?', 'Take в вопросе о времени значит «занимать».',
      'How long does it take?', 'How long will it take?', 'How long does the bus ride take?', 'How long is the bus ride?'],
  ]),
  scene('coffee', 'Заказать кофе и оплатить', 'A1', ['cafe'], 'Закажи кофе с собой и попроси оплатить картой.', 'Barista', [
    ['Hi! What would you like?', 'Попроси один кофе.', 'Can I have…?', 'Can I have… подходит для вежливого заказа.',
      'Can I have a coffee, please?', 'Could I have a coffee, please?', 'A coffee, please.', 'I’d like a coffee, please.', 'Can I have a coffee?'],
    ['Of course. Is that for here or to go?', 'Скажи, что кофе с собой.', 'To go…', 'To go означает «с собой». В британском английском также говорят to take away.',
      'To go, please.', 'To go.', 'Takeaway, please.', 'To take away, please.', 'I’d like it to go, please.'],
    ['Sure. That’s three pounds.', 'Спроси, можно ли оплатить картой.', 'Can I pay by…?', 'По-английски говорят pay by card или pay with a card.',
      'Can I pay by card?', 'Can I pay with a card?', 'Could I pay by card?', 'Do you take cards?', 'Card, please.'],
  ]),
  scene('appointment', 'Перенести запись', 'A2', ['plans', 'health'], 'Позвони в клинику и перенеси пятницу на понедельник.', 'Receptionist', [
    ['Good morning. How can I help?', 'Объясни, что у тебя запись на пятницу.', 'I have an appointment…', 'Appointment — запись на приём. С днём недели употребляется on или for.',
      'I have an appointment on Friday.', 'I have an appointment for Friday.', 'My appointment is on Friday.', 'I’m booked in for Friday.'],
    ['I can see your booking. What would you like to do?', 'Попроси перенести запись на понедельник.', 'Could I change…?', 'Change или move an appointment означает «перенести запись».',
      'Could I move my appointment to Monday?', 'Could I change my appointment to Monday?', 'Can I reschedule my appointment for Monday?', 'Can I move it to Monday?'],
    ['I have a slot on Monday at ten.', 'Подтверди, что понедельник в десять подходит.', 'Monday at ten…', 'Works for me означает «мне подходит».',
      'Monday at ten works for me.', 'Monday at ten is fine.', 'That works for me.', 'Ten on Monday is fine.', 'That’s perfect, thank you.'],
  ]),
  scene('refund', 'Вернуть покупку', 'A2', ['shopping'], 'В магазине объясни причину возврата и попроси вернуть деньги.', 'Shop assistant', [
    ['Hello. How can I help you today?', 'Скажи, что хочешь вернуть эту куртку.', 'I’d like to return…', 'Return в магазине означает «вернуть покупку».',
      'I’d like to return this jacket.', 'I want to return this jacket.', 'Can I return this jacket?', 'Could I return this jacket, please?'],
    ['Of course. Is anything wrong with it?', 'Скажи, что куртка слишком велика.', 'It’s too…', 'Too big означает «слишком большой», а не просто «очень большой».',
      'It’s too big.', 'The jacket is too big for me.', 'It’s too large for me.', 'It’s too big for me.'],
    ['Would you like an exchange or a refund?', 'Выбери возврат денег.', 'A refund…', 'Refund — возврат денег. Exchange — обмен товара.',
      'A refund, please.', 'I’d like a refund, please.', 'I’d prefer a refund.', 'Could I have a refund, please?', 'I’d like my money back, please.'],
  ]),
  scene('parcel', 'Забрать посылку', 'A2', ['phrasal', 'shopping'], 'Уточни, как получить свою посылку в пункте выдачи.', 'Clerk', [
    ['Hi! What can I do for you?', 'Скажи, что пришёл забрать свою посылку.', 'I’m here to pick up…', 'Pick up здесь означает «забрать». Collect — ещё один естественный вариант.',
      'I’m here to pick up my parcel.', 'I’m here to collect my parcel.', 'I’d like to pick up my package.', 'Can I pick up my parcel, please?'],
    ['Do you have your collection code?', 'Скажи, что код у тебя на телефоне.', 'It’s on my…', 'On my phone означает «на телефоне», например в сообщении или приложении.',
      'Yes, it’s on my phone.', 'It’s on my phone.', 'I have it on my phone.', 'The code is on my phone.', 'Yes, I have it on my phone.'],
    ['Thanks. Here’s your parcel. Do you need anything else?', 'Поблагодари и скажи, что больше ничего не нужно.', 'No, that’s all…', 'That’s all — короткий вежливый способ закончить разговор.',
      'No, that’s all, thank you.', 'No, thanks.', 'That’s all, thanks.', 'Nothing else, thank you.', 'No, thank you.'],
  ]),
  scene('train', 'Опоздать на пересадку', 'B1', ['travel', 'past'], 'Объясни, что произошло, и найди следующий поезд.', 'Station employee', [
    ['Good evening. What happened?', 'Скажи, что опоздал на стыковочный поезд.', 'I missed…', 'Miss a train — «опоздать на поезд». Прошедшая форма — missed.',
      'I missed my connecting train.', 'I missed my connection.', 'I missed the connecting train.', 'I missed my next train.'],
    ['There’s another train at nine.', 'Спроси, можешь ли использовать тот же билет.', 'Can I use…?', 'The same ticket — уже купленный билет, о котором идёт речь.',
      'Can I use the same ticket?', 'Can I use my current ticket?', 'Can I use my ticket on that train?', 'Is my ticket valid on that train?'],
    ['Yes, your ticket is valid. The train leaves from the east side.', 'Уточни, с какой платформы отправляется поезд.', 'Which platform…?', 'Leave from или depart from указывает место отправления.',
      'Which platform does it leave from?', 'What platform does it leave from?', 'Which platform does the train leave from?', 'Which platform is it?'],
  ]),
  scene('colleague', 'Попросить коллегу о помощи', 'B1', ['work', 'presentperfect'], 'Договорись о помощи с приложением и уточни срок.', 'Colleague', [
    ['You look busy. Is there anything I can help with?', 'Попроси помочь запустить отчёт в приложении.', 'Could you help me run…?', 'Run a report означает «запустить формирование отчёта». Generate a report — «сформировать отчёт».',
      'Could you help me run the report?', 'Can you help me run the report?', 'Could you help me generate the report?', 'Can you help me generate the report in the app?'],
    ['Sure. How long have you been working on it?', 'Скажи, что работаешь над отчётом уже час.', 'I’ve been working… for…', 'For an hour описывает длительность. Present Perfect Continuous подходит для продолжающейся работы.',
      'I’ve been working on it for an hour.', 'I have been working on the report for an hour.', 'I’ve been working on it for one hour.', 'I started working on it an hour ago.'],
    ['I can take a look after lunch.', 'Спроси, можно ли встретиться в два часа.', 'Could we meet…?', 'Перед временем встречи употребляется at: at two.',
      'Could we meet at two?', 'Can we meet at two?', 'Could we meet at two o’clock?', 'Can we meet at 2?', 'Does two o’clock work for you?'],
  ]),
];

export const contextDialogueForTopic = topicId => contextDialogues.find(scene => scene.topicIds.includes(topicId));
