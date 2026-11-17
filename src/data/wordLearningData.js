const common = {
  the: ["артикль", "The book is on the table.", "Книга лежит на столе."],
  of: ["предлог", "Would you like a cup of tea?", "Хотите чашку чая?"],
  and: ["союз", "She speaks English and Spanish.", "Она говорит по-английски и по-испански."],
  to: ["предлог / частица", "I want to learn English.", "Я хочу учить английский."],
  a: ["артикль", "She bought a new bag.", "Она купила новую сумку."],
  in: ["предлог", "They live in London.", "Они живут в Лондоне."],
  for: ["предлог", "This present is for you.", "Этот подарок для тебя."],
  is: ["глагол", "The lesson is useful.", "Этот урок полезный."],
  on: ["предлог", "Your phone is on the desk.", "Твой телефон на столе."],
  that: ["местоимение / союз", "I know that she is busy.", "Я знаю, что она занята."],
  by: ["предлог", "The book was written by Orwell.", "Книга была написана Оруэллом."],
  this: ["местоимение", "This is my first lesson.", "Это мой первый урок."],
  with: ["предлог", "I came with my friend.", "Я пришёл с другом."],
  i: ["местоимение", "I study English every day.", "Я учу английский каждый день."],
  you: ["местоимение", "You can do it.", "Ты можешь это сделать."],
  it: ["местоимение", "It looks interesting.", "Это выглядит интересно."],
  not: ["частица", "I am not tired.", "Я не устал."],
  or: ["союз", "Would you like tea or coffee?", "Вы хотите чай или кофе?"],
  be: ["глагол", "I want to be confident.", "Я хочу быть уверенным."],
  are: ["глагол", "We are ready.", "Мы готовы."],
  from: ["предлог", "She is from Canada.", "Она из Канады."],
  at: ["предлог", "Meet me at the station.", "Встреть меня на станции."],
  as: ["предлог / союз", "He works as a designer.", "Он работает дизайнером."],
  your: ["определитель", "What is your name?", "Как тебя зовут?"],
  all: ["определитель", "All students passed the test.", "Все студенты сдали тест."],
  have: ["глагол", "I have two questions.", "У меня есть два вопроса."],
  new: ["прилагательное", "I started a new job.", "Я начал новую работу."],
  more: ["наречие / определитель", "I need more time.", "Мне нужно больше времени."],
  an: ["артикль", "She is an engineer.", "Она инженер."],
  was: ["глагол", "The meeting was yesterday.", "Встреча была вчера."],
  we: ["местоимение", "We learn together.", "Мы учимся вместе."],
  will: ["вспомогательный глагол", "I will call you tomorrow.", "Я позвоню тебе завтра."],
  home: ["существительное / наречие", "I am going home.", "Я иду домой."],
  can: ["модальный глагол", "Can you help me?", "Ты можешь мне помочь?"],
  us: ["местоимение", "Please tell us the truth.", "Пожалуйста, скажи нам правду."],
  about: ["предлог", "We talked about work.", "Мы говорили о работе."],
  if: ["союз", "Call me if you need help.", "Позвони мне, если нужна помощь."],
  my: ["определитель", "My English is getting better.", "Мой английский становится лучше."],
  has: ["глагол", "She has a good idea.", "У неё есть хорошая идея."],
  do: ["глагол", "What do you do?", "Чем ты занимаешься?"],
  no: ["определитель / частица", "There is no problem.", "Проблемы нет."],
  he: ["местоимение", "He works from home.", "Он работает из дома."],
  get: ["глагол", "I usually get home at six.", "Обычно я прихожу домой в шесть."],
  go: ["глагол", "We go to school by bus.", "Мы ездим в школу на автобусе."],
  make: ["глагол", "Let's make a plan.", "Давай составим план."],
  time: ["существительное", "Do you have time today?", "У тебя сегодня есть время?"],
  people: ["существительное", "Many people work online.", "Многие люди работают онлайн."],
  work: ["существительное / глагол", "I work in a small company.", "Я работаю в небольшой компании."],
  like: ["глагол / предлог", "I like this place.", "Мне нравится это место."],
  know: ["глагол", "Do you know the answer?", "Ты знаешь ответ?"],
  list: ["существительное / глагол", "I made a list of things to buy.", "Я составил список покупок."],
  place: ["существительное / глагол", "This is a quiet place to study.", "Это тихое место для учёбы."],
  family: ["существительное", "My family lives near the sea.", "Моя семья живёт недалеко от моря."],
  friend: ["существительное", "This is my friend Anna.", "Это моя подруга Анна."],
  appointment: ["существительное", "I would like to make an appointment.", "Я хотел бы записаться на приём."],
  journey: ["существительное", "The journey took two hours.", "Поездка заняла два часа."],
  travel: ["глагол / существительное", "We travel by train.", "Мы путешествуем на поезде."],
  ticket: ["существительное", "Where can I buy a ticket?", "Где можно купить билет?"],
  station: ["существительное", "The station is across the road.", "Вокзал находится через дорогу."],
  hotel: ["существительное", "Our hotel is near the airport.", "Наш отель находится рядом с аэропортом."],
  room: ["существительное", "I booked a room for two nights.", "Я забронировал номер на две ночи."],
  bill: ["существительное", "Could we have the bill, please?", "Можно нам счёт, пожалуйста?"],
  menu: ["существительное", "Could I see the menu?", "Можно посмотреть меню?"],
  order: ["существительное / глагол", "Are you ready to order?", "Вы готовы сделать заказ?"],
  water: ["существительное / глагол", "Could I have some water?", "Можно мне воды?"],
  coffee: ["существительное", "I'd like a coffee, please.", "Я хотел бы кофе, пожалуйста."],
  price: ["существительное", "Does the price include breakfast?", "Завтрак включён в стоимость?"],
  receipt: ["существительное", "Could I have a receipt?", "Можно мне чек?"],
  refund: ["существительное / глагол", "I would like a refund.", "Я хотел бы получить возврат денег."],
  size: ["существительное", "Do you have this in a smaller size?", "У вас есть это меньшего размера?"],
  meeting: ["существительное", "The meeting starts at ten.", "Встреча начинается в десять."],
  job: ["существительное", "I'm looking for a new job.", "Я ищу новую работу."],
  experience: ["существительное / глагол", "I have three years of experience.", "У меня три года опыта."],
  deadline: ["существительное", "Can we discuss the deadline?", "Можем обсудить срок сдачи?"],
  advice: ["существительное", "Thank you for your advice.", "Спасибо за совет."],
  information: ["существительное", "I need some information about the course.", "Мне нужна информация о курсе."],
  opportunity: ["существительное", "This is a good opportunity to practise.", "Это хорошая возможность попрактиковаться."],
  improve: ["глагол", "I want to improve my English.", "Я хочу улучшить свой английский."],
  confident: ["прилагательное", "I feel more confident now.", "Теперь я чувствую себя увереннее."],
  comfortable: ["прилагательное", "These shoes are comfortable.", "Эта обувь удобная."],
};

const functionWords = {
  article: new Set(["the", "a", "an"]),
  pronoun: new Set(["i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "who", "what", "which"]),
  preposition: new Set(["of", "to", "in", "for", "on", "by", "with", "from", "at", "about", "into", "over", "under", "between", "through"]),
  conjunction: new Set(["and", "or", "but", "if", "because", "while", "although", "unless"]),
};

export function wordLearningDetails(english, translation = "") {
  const curated = common[english];
  if (curated) return { partOfSpeech: curated[0], example: curated[1], exampleRu: curated[2], curated: true };
  if (functionWords.article.has(english)) return { partOfSpeech: "артикль" };
  if (functionWords.pronoun.has(english)) return { partOfSpeech: "местоимение" };
  if (functionWords.preposition.has(english)) return { partOfSpeech: "предлог" };
  if (functionWords.conjunction.has(english)) return { partOfSpeech: "союз" };
  const firstMeaning = translation.split(/[;,]/)[0].trim();
  if (/ть(?:ся)?$/i.test(firstMeaning)) return { partOfSpeech: "глагол", partOfSpeechInferred: true };
  if (/(?:ый|ий|ой|ая|яя|ое|ее|ые|ие)$/i.test(firstMeaning)) return { partOfSpeech: "прилагательное", partOfSpeechInferred: true };
  return { partOfSpeech: "Часть речи зависит от значения", partOfSpeechInferred: true };
}

export const curatedExampleCount = Object.keys(common).length;
