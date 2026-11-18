const entries = {
  miss: [
    ['опоздать на транспорт', 'We might miss the train.', 'Мы можем опоздать на поезд.'],
    ['пропустить занятие или событие', 'I missed class yesterday.', 'Я вчера пропустил занятие.'],
    ['скучать по кому-то', 'I miss my sister.', 'Я скучаю по сестре.'],
  ],
  'pick up': [
    ['забрать посылку или заказ', 'Can I pick up my parcel today?', 'Можно сегодня забрать мою посылку?'],
    ['заехать за кем-то', "I'll pick you up at six.", 'Я заеду за тобой в шесть.'],
    ['поднять трубку', "Please pick up. It's urgent.", 'Пожалуйста, возьми трубку. Это срочно.'],
  ],
  run: [
    ['бегать', 'I run in the park on Sundays.', 'По воскресеньям я бегаю в парке.'],
    ['управлять', 'She runs a small café.', 'Она управляет маленьким кафе.'],
    ['работать (о программе или оборудовании)', 'The app runs in the background.', 'Приложение работает в фоновом режиме.'],
  ],
  take: [
    ['взять с собой', 'Take an umbrella with you.', 'Возьми с собой зонт.'],
    ['воспользоваться транспортом', 'Take the bus to the station.', 'Поезжай на автобусе до вокзала.'],
    ['занимать время', 'It takes ten minutes to get there.', 'Дорога туда занимает десять минут.'],
  ],
  get: [
    ['получить', 'Did you get my message?', 'Ты получил моё сообщение?'],
    ['добраться', 'How do I get to the station?', 'Как мне добраться до вокзала?'],
    ['стать (об изменении состояния)', "It's getting cold.", 'Становится холодно.'],
  ],
  book: [
    ['книга', 'I left my book on the table.', 'Я оставил книгу на столе.'],
    ['забронировать', 'Can I book a room for Friday?', 'Можно забронировать номер на пятницу?'],
    ['записаться', 'I need to book an appointment.', 'Мне нужно записаться на приём.'],
  ],
  change: [
    ['изменить', 'Can we change the time?', 'Мы можем изменить время?'],
    ['сделать пересадку', 'Change trains at Oxford.', 'Пересядь на другой поезд в Оксфорде.'],
    ['сдача', "Here's your change.", 'Вот ваша сдача.'],
  ],
  return: [
    ['вернуться', 'What time did you return home?', 'Во сколько ты вернулся домой?'],
    ['вернуть покупку', "I'd like to return this jacket.", 'Я хотел бы вернуть эту куртку.'],
    ['доход от вложений', 'The investment earned a modest return.', 'Инвестиция принесла небольшой доход.'],
  ],
  turn: [
    ['повернуть', 'Turn left at the bank.', 'Поверни налево у банка.'],
    ['очередь (чья-то)', "It's your turn.", 'Твоя очередь.'],
    ['становиться (о смене состояния)', 'The leaves turn yellow in autumn.', 'Осенью листья желтеют.'],
  ],
  leave: [
    ['уйти или уехать', 'We leave at nine.', 'Мы уезжаем в девять.'],
    ['оставить', 'You can leave your bag here.', 'Можешь оставить сумку здесь.'],
    ['отпуск', "She's on leave this week.", 'На этой неделе она в отпуске.'],
  ],
  hold: [
    ['держать', 'Could you hold this bag for me?', 'Можешь подержать мою сумку?'],
    ['проводить (мероприятие)', "We'll hold the meeting on Monday.", 'Мы проведём встречу в понедельник.'],
    ['подождать на линии', 'Could you hold for a moment?', 'Можете немного подождать на линии?'],
  ],
  light: [
    ['свет', 'The room needs more light.', 'В комнате нужно больше света.'],
    ['лёгкий (по весу)', 'This backpack is very light.', 'Этот рюкзак очень лёгкий.'],
    ['зажечь', 'Could you light the candle?', 'Можешь зажечь свечу?'],
  ],
};

export const wordSenses = Object.fromEntries(Object.entries(entries).map(([word, examples]) => [
  word,
  examples.map(([meaning, english, russian]) => ({ meaning, english, russian })),
]));
export function sensesForWord(word) {
  const key = word.toLowerCase();
  return Object.hasOwn(wordSenses, key) ? wordSenses[key] : [];
}
