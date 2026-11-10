import { extraStories, bonusStories } from './contentExpansion.js';

export const placementQuestions = [
  { level: 'A1', prompt: 'She ___ from Spain.', options: ['is', 'are', 'am', 'be'], answer: 'is' },
  { level: 'A1', prompt: 'Выбери перевод: «Я не понимаю»', options: ["I don't understand", "I not understand", "I am not understand", "I no understand"], answer: "I don't understand" },
  { level: 'A2', prompt: 'Yesterday we ___ a great film.', options: ['saw', 'see', 'have seen', 'were see'], answer: 'saw' },
  { level: 'A2', prompt: 'I have lived here ___ three years.', options: ['for', 'since', 'from', 'during'], answer: 'for' },
  { level: 'B1', prompt: 'If it rains, we ___ at home.', options: ["will stay", 'would stay', 'stayed', 'have stayed'], answer: 'will stay' },
  { level: 'B1', prompt: 'The meeting has been ___ until Friday.', options: ['put off', 'put out', 'put up', 'put through'], answer: 'put off' },
  { level: 'B2', prompt: 'If I ___ about the delay, I would have called you.', options: ['had known', 'knew', 'would know', 'have known'], answer: 'had known' },
  { level: 'B2', prompt: 'Выбери наиболее вежливое несогласие:', options: ["I see your point, but I'm not entirely convinced", "You're wrong", 'No chance', 'That makes no sense'], answer: "I see your point, but I'm not entirely convinced" },
  { level: 'B2', prompt: 'She insisted ___ paying for dinner.', options: ['on', 'to', 'for', 'at'], answer: 'on' },
  { level: 'C1', prompt: 'Hardly ___ the room when the phone rang.', options: ['had I left', 'I had left', 'did I leave', 'I left'], answer: 'had I left' },
  { level: 'C1', prompt: 'The findings ___ further investigation.', options: ['warrant', 'make', 'ask', 'pretend'], answer: 'warrant' },
  { level: 'C1', prompt: 'Were the situation different, we ___ another approach.', options: ['might adopt', 'will adopt', 'adopted', 'have adopted'], answer: 'might adopt' },
];

export const grammarQuestions = [
  { id: 'gr1', topic: 'Времена', level: 'A2', prompt: 'I ___ my keys. Have you seen them?', options: ['have lost', 'lost yesterday', 'am losing', 'lose'], answer: 'have lost', explanation: 'Present Perfect нужен, потому что результат важен сейчас: ключей всё ещё нет.' },
  { id: 'gr2', topic: 'Времена', level: 'B1', prompt: 'When I arrived, they ___ dinner.', options: ['were having', 'had', 'have had', 'are having'], answer: 'were having', explanation: 'Past Continuous описывает действие, которое уже происходило в конкретный момент прошлого.' },
  { id: 'gr3', topic: 'Артикли', level: 'A2', prompt: 'She is ___ engineer at a large company.', options: ['an', 'a', 'the', '—'], answer: 'an', explanation: 'Перед профессией в единственном числе нужен неопределённый артикль. Engineer начинается с гласного звука.' },
  { id: 'gr4', topic: 'Артикли', level: 'B1', prompt: '___ information you gave me was useful.', options: ['The', 'An', 'A', 'Some of'], answer: 'The', explanation: 'Речь о конкретной информации, которую собеседник дал ранее, поэтому используется the.' },
  { id: 'gr5', topic: 'Предлоги', level: 'B1', prompt: 'She is responsible ___ customer support.', options: ['for', 'of', 'with', 'on'], answer: 'for', explanation: 'Устойчивое сочетание: be responsible for — отвечать за что-либо.' },
  { id: 'gr6', topic: 'Предлоги', level: 'B2', prompt: 'The decision depends ___ whether we get funding.', options: ['on', 'from', 'of', 'at'], answer: 'on', explanation: 'Глагол depend всегда используется с предлогом on.' },
  { id: 'gr7', topic: 'Условные', level: 'B1', prompt: 'If I were you, I ___ the offer.', options: ['would accept', 'will accept', 'accepted', 'have accepted'], answer: 'would accept', explanation: 'Second Conditional: If + Past Simple, затем would + начальная форма глагола.' },
  { id: 'gr8', topic: 'Условные', level: 'B2', prompt: 'If they had left earlier, they ___ the train.', options: ["wouldn't have missed", "won't miss", "wouldn't miss", "hadn't missed"], answer: "wouldn't have missed", explanation: 'Third Conditional описывает нереальное прошлое: if + had + V3, would have + V3.' },
  { id: 'gr9', topic: 'Порядок слов', level: 'B2', prompt: 'Выбери правильное предложение:', options: ['Rarely do we see such results', 'Rarely we see such results', 'Rarely see we such results', 'We do rarely see such results'], answer: 'Rarely do we see such results', explanation: 'После отрицательных наречий в начале предложения используется инверсия: rarely + auxiliary + subject.' },
  { id: 'gr10', topic: 'Модальные', level: 'B1', prompt: 'You ___ have told me earlier!', options: ['should', 'must to', 'ought', 'can to'], answer: 'should', explanation: 'Should have + V3 выражает сожаление или критику действия в прошлом.' },
  { id: 'gr11', topic: 'Герундий', level: 'B2', prompt: 'I look forward to ___ from you.', options: ['hearing', 'hear', 'have heard', 'be hearing'], answer: 'hearing', explanation: 'В выражении look forward to слово to — предлог, поэтому после него нужен герундий.' },
  { id: 'gr12', topic: 'Стиль', level: 'C1', prompt: 'Наиболее формальный вариант:', options: ['We regret to inform you that...', 'Sorry, but...', 'Bad news:', 'We need to tell you...'], answer: 'We regret to inform you that...', explanation: 'Regret to inform — стандартная формальная конструкция для сообщения неприятной информации.' },
];

export const stories = [
  {
    id: 'story1', level: 'A2', title: 'The Missed Train', emoji: '🚆', color: '#36B8D9',
    text: 'Emma left home early, but the bus was delayed. When she reached the station, her train was already leaving. Instead of getting upset, she bought a coffee and called her friend. They decided to meet an hour later.',
    translation: 'Эмма вышла из дома рано, но автобус задержался. Когда она добралась до вокзала, поезд уже отправлялся. Вместо того чтобы расстроиться, она купила кофе и позвонила подруге. Они решили встретиться на час позже.',
    questions: [
      { prompt: 'Why did Emma miss the train?', options: ['The bus was delayed', 'She woke up late', 'She lost her ticket'], answer: 'The bus was delayed' },
      { prompt: 'What did she do next?', options: ['She bought coffee and called her friend', 'She went home', 'She took a taxi'], answer: 'She bought coffee and called her friend' },
    ],
  },
  {
    id: 'story2', level: 'B1', title: 'A Difficult Decision', emoji: '🧭', color: '#7C5CFC',
    text: 'Daniel had worked for the same company for six years when he received an offer from a small startup. The new job paid less, but it offered more responsibility and a chance to build something meaningful. After weighing the risks, he accepted the offer. A year later, he was leading an international team.',
    translation: 'Дэниел проработал в одной компании шесть лет, когда получил предложение от небольшого стартапа. На новой работе платили меньше, но она давала больше ответственности и шанс создать что-то значимое. Взвесив риски, он принял предложение. Через год он уже руководил международной командой.',
    questions: [
      { prompt: 'Why was the new offer attractive?', options: ['It offered responsibility and meaningful work', 'It paid much more', 'It required less work'], answer: 'It offered responsibility and meaningful work' },
      { prompt: 'What happened a year later?', options: ['He was leading an international team', 'He returned to his old job', 'The startup closed'], answer: 'He was leading an international team' },
    ],
  },
  {
    id: 'story3', level: 'B2', title: 'The Unexpected Solution', emoji: '💡', color: '#F0A43C',
    text: 'The project was falling behind schedule, and the team had tried every obvious solution. During a meeting, the newest employee suggested removing a feature that customers rarely used. Although the idea initially seemed too simple, the data supported it. The change reduced development time and made the product easier to use.',
    translation: 'Проект отставал от графика, и команда перепробовала все очевидные решения. На встрече новый сотрудник предложил убрать функцию, которой клиенты почти не пользовались. Хотя поначалу идея казалась слишком простой, данные её подтвердили. Изменение сократило время разработки и сделало продукт удобнее.',
    questions: [
      { prompt: 'Who suggested the solution?', options: ['The newest employee', 'The project manager', 'A customer'], answer: 'The newest employee' },
      { prompt: 'Why did the team accept it?', options: ['The data supported the idea', 'They had no other choice', 'The manager demanded it'], answer: 'The data supported the idea' },
    ],
  },
  ...extraStories,
  ...bonusStories,
];
