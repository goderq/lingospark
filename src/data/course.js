import { extraDialogues, extraLessons } from './advancedCourse.js';
import { moreLessons } from './moreCourses.js';
import { expandedLessons } from './expandedContent.js';
import { extraDictations, megaDialogues } from './contentExpansion.js';
import { enrichLessons } from './courseExpansion.js';

const baseLessons = [
  {
    id: 'greetings', unit: 1, difficulty: 'A1', title: 'Знакомство', subtitle: 'Приветствия и первые фразы', icon: 'hand-left', color: '#7C5CFC', xp: 20,
    exercises: [
      { id: 'g1', type: 'choice', prompt: 'Как сказать «Привет!»?', hint: 'Так здороваются с друзьями', options: ['Hello!', 'Goodbye!', 'Thanks!', 'Sorry!'], answer: 'Hello!', speak: 'Hello!' },
      { id: 'g2', type: 'choice', prompt: 'What is your name?', hint: 'Выбери правильный перевод', options: ['Как тебя зовут?', 'Как твои дела?', 'Где ты живёшь?', 'Сколько тебе лет?'], answer: 'Как тебя зовут?', speak: 'What is your name?' },
      { id: 'g3', type: 'build', prompt: 'Собери: «Меня зовут Анна»', hint: 'Начни с My', options: ['Anna', 'name', 'is', 'My'], answer: 'My name is Anna', speak: 'My name is Anna' },
      { id: 'g4', type: 'translate', prompt: 'Переведи: Nice to meet you', hint: 'Фраза при знакомстве', answers: ['приятно познакомиться', 'рад познакомиться'], answer: 'Приятно познакомиться', speak: 'Nice to meet you' },
      { id: 'g5', type: 'choice', prompt: 'Когда уместно сказать “How do you do?”', hint: 'Это формальное приветствие', options: ['При первом официальном знакомстве', 'Когда прощаешься с другом', 'Когда просишь помощи', 'Когда заказываешь еду'], answer: 'При первом официальном знакомстве', speak: 'How do you do?' },
    ],
  },
  {
    id: 'cafe', unit: 1, difficulty: 'A1', title: 'В кофейне', subtitle: 'Заказываем как местные', icon: 'cafe', color: '#FF9F43', xp: 25,
    exercises: [
      { id: 'c1', type: 'choice', prompt: 'I would like a coffee, please', hint: 'Вежливый заказ', options: ['Я бы хотел кофе, пожалуйста', 'Я не люблю кофе', 'Где мой кофе?', 'Кофе холодный'], answer: 'Я бы хотел кофе, пожалуйста', speak: 'I would like a coffee, please' },
      { id: 'c2', type: 'choice', prompt: 'Что значит «the bill»?', hint: 'Просим это после еды', options: ['счёт', 'меню', 'ложка', 'чай'], answer: 'счёт', speak: 'the bill' },
      { id: 'c3', type: 'build', prompt: 'Собери: «Можно мне меню?»', hint: 'May I...', options: ['menu', 'the', 'have', 'May', 'I'], answer: 'May I have the menu', speak: 'May I have the menu' },
      { id: 'c4', type: 'translate', prompt: 'Переведи: How much is it?', hint: 'Вопрос о цене', answers: ['сколько это стоит', 'сколько стоит'], answer: 'Сколько это стоит', speak: 'How much is it?' },
      { id: 'c5', type: 'build', prompt: 'Собери: «У меня аллергия на орехи»', hint: 'I am allergic...', options: ['nuts', 'allergic', 'to', 'am', 'I'], answer: 'I am allergic to nuts', speak: 'I am allergic to nuts' },
    ],
  },
  {
    id: 'travel', unit: 2, difficulty: 'A2', title: 'Путешествие', subtitle: 'Аэропорт и навигация', icon: 'airplane', color: '#2ED3B7', xp: 30,
    exercises: [
      { id: 't1', type: 'choice', prompt: 'Where is the train station?', hint: 'Ищем вокзал', options: ['Где железнодорожный вокзал?', 'Когда отправляется поезд?', 'Это мой билет?', 'Поезд опаздывает?'], answer: 'Где железнодорожный вокзал?', speak: 'Where is the train station?' },
      { id: 't2', type: 'choice', prompt: '«Boarding pass» — это...', hint: 'Показывают перед посадкой', options: ['посадочный талон', 'чемодан', 'паспорт', 'выход'], answer: 'посадочный талон', speak: 'boarding pass' },
      { id: 't3', type: 'build', prompt: 'Собери: «Мой рейс задержан»', hint: 'My flight...', options: ['delayed', 'flight', 'is', 'My'], answer: 'My flight is delayed', speak: 'My flight is delayed' },
      { id: 't4', type: 'translate', prompt: 'Переведи: Turn left at the corner', hint: 'Указание пути', answers: ['поверните налево на углу', 'поверни налево на углу'], answer: 'Поверните налево на углу', speak: 'Turn left at the corner' },
      { id: 't5', type: 'translate', prompt: 'Переведи: I missed my connecting flight', hint: 'Рейс с пересадкой', answers: ['я опоздал на стыковочный рейс', 'я пропустил стыковочный рейс'], answer: 'Я опоздал на стыковочный рейс', speak: 'I missed my connecting flight' },
    ],
  },
  {
    id: 'smalltalk', unit: 2, difficulty: 'A2', title: 'Small talk', subtitle: 'Лёгкий живой разговор', icon: 'chatbubbles', color: '#FF5C8A', xp: 35,
    exercises: [
      { id: 's1', type: 'choice', prompt: 'How is it going?', hint: 'Неформальный вопрос', options: ['Как дела?', 'Куда ты идёшь?', 'Который час?', 'Что это?'], answer: 'Как дела?', speak: 'How is it going?' },
      { id: 's2', type: 'choice', prompt: 'Выбери естественный ответ', hint: 'На How are you?', options: ['Pretty good, thanks!', 'I am table', 'At seven clock', 'No name'], answer: 'Pretty good, thanks!', speak: 'Pretty good, thanks!' },
      { id: 's3', type: 'build', prompt: 'Собери: «Чем ты занимаешься?»', hint: 'What do...', options: ['do', 'you', 'What', 'do'], answer: 'What do you do', speak: 'What do you do?' },
      { id: 's4', type: 'translate', prompt: 'Переведи: Sounds great!', hint: 'Выражаем одобрение', answers: ['звучит отлично', 'звучит здорово'], answer: 'Звучит отлично', speak: 'Sounds great!' },
      { id: 's5', type: 'choice', prompt: '“I’m up for it” означает...', hint: 'Разговорное согласие', options: ['Я согласен и готов', 'Я уже наверху', 'Я против этого', 'Я устал от этого'], answer: 'Я согласен и готов', speak: "I'm up for it" },
    ],
  },
  {
    id: 'shopping', unit: 3, difficulty: 'A2', title: 'Покупки без стресса', subtitle: 'Размеры, возврат и скидки', icon: 'bag-handle', color: '#8B7CF6', xp: 40,
    exercises: [
      { id: 'sh1', type: 'choice', prompt: '“It doesn’t fit me” означает...', hint: 'Одежда не подходит', options: ['Это мне не по размеру', 'Мне не нравится цвет', 'Это слишком дорого', 'Я не могу это найти'], answer: 'Это мне не по размеру', speak: "It doesn't fit me" },
      { id: 'sh2', type: 'build', prompt: 'Собери: «Можно примерить это?»', hint: 'Can I...', options: ['on', 'this', 'try', 'Can', 'I'], answer: 'Can I try this on', speak: 'Can I try this on?' },
      { id: 'sh3', type: 'choice', prompt: 'Что такое “a refund”?', hint: 'После возврата товара', options: ['Возврат денег', 'Подарочный чек', 'Скидка', 'Гарантия'], answer: 'Возврат денег', speak: 'a refund' },
      { id: 'sh4', type: 'translate', prompt: 'Переведи: Is this item on sale?', hint: 'Спрашиваем о скидке', answers: ['этот товар со скидкой', 'на этот товар есть скидка'], answer: 'Этот товар со скидкой', speak: 'Is this item on sale?' },
      { id: 'sh5', type: 'build', prompt: 'Собери: «Я хотел бы вернуть это»', hint: 'I would like...', options: ['this', 'return', 'to', 'like', 'would', 'I'], answer: 'I would like to return this', speak: 'I would like to return this' },
    ],
  },
  {
    id: 'past', unit: 3, difficulty: 'A2+', title: 'Истории в прошлом', subtitle: 'Past Simple и детали событий', icon: 'time', color: '#F07B62', xp: 45,
    exercises: [
      { id: 'pa1', type: 'choice', prompt: 'Yesterday I ___ to the cinema', hint: 'Неправильный глагол go', options: ['went', 'goed', 'have gone', 'was go'], answer: 'went', speak: 'Yesterday I went to the cinema' },
      { id: 'pa2', type: 'choice', prompt: 'Выбери правильный вопрос', hint: 'Past Simple использует did', options: ['Did you see him?', 'Did you saw him?', 'Have you saw him?', 'Were you see him?'], answer: 'Did you see him?', speak: 'Did you see him?' },
      { id: 'pa3', type: 'build', prompt: 'Собери: «Мы не знали ответа»', hint: 'После didn’t — начальная форма', options: ['answer', 'the', 'know', "didn't", 'We'], answer: "We didn't know the answer", speak: "We didn't know the answer" },
      { id: 'pa4', type: 'translate', prompt: 'Переведи: She left before I arrived', hint: 'Два события в прошлом', answers: ['она ушла до того как я приехал', 'она ушла прежде чем я приехал'], answer: 'Она ушла до того как я приехал', speak: 'She left before I arrived' },
      { id: 'pa5', type: 'choice', prompt: 'Какое слово произносится /t/?', hint: 'Окончание -ed после глухого согласного', options: ['worked', 'played', 'wanted', 'needed'], answer: 'worked', speak: 'worked' },
    ],
  },
  {
    id: 'plans', unit: 4, difficulty: 'B1', title: 'Планы и прогнозы', subtitle: 'Will, going to и договорённости', icon: 'calendar', color: '#36B8D9', xp: 50,
    exercises: [
      { id: 'pl1', type: 'choice', prompt: 'Look at those clouds! It ___ rain', hint: 'Прогноз по видимым признакам', options: ["is going to", 'will be', 'is', 'would'], answer: 'is going to', speak: "It's going to rain" },
      { id: 'pl2', type: 'choice', prompt: 'I think people ___ live on Mars one day', hint: 'Мнение о будущем', options: ['will', 'are going', 'are', 'have'], answer: 'will', speak: 'People will live on Mars one day' },
      { id: 'pl3', type: 'build', prompt: 'Собери: «Я встречаюсь с ней завтра»', hint: 'Запланированная договорённость', options: ['tomorrow', 'her', 'meeting', 'am', 'I'], answer: 'I am meeting her tomorrow', speak: 'I am meeting her tomorrow' },
      { id: 'pl4', type: 'translate', prompt: 'Переведи: I’ll get back to you by Friday', hint: 'Обещание ответить', answers: ['я отвечу вам до пятницы', 'я свяжусь с вами до пятницы'], answer: 'Я свяжусь с вами до пятницы', speak: "I'll get back to you by Friday" },
      { id: 'pl5', type: 'choice', prompt: 'Как вежливо предложить помощь?', hint: 'Решение в момент разговора', options: ["I'll help you with that", "I'm going help you", 'I helping you', 'I have help you'], answer: "I'll help you with that", speak: "I'll help you with that" },
    ],
  },
  {
    id: 'presentperfect', unit: 4, difficulty: 'B1', title: 'Опыт и результат', subtitle: 'Present Perfect без путаницы', icon: 'checkmark-done-circle', color: '#2ED3B7', xp: 55,
    exercises: [
      { id: 'pp1', type: 'choice', prompt: 'I ___ never ___ sushi', hint: 'Опыт к настоящему моменту', options: ['have / tried', 'did / try', 'was / trying', 'have / try'], answer: 'have / tried', speak: 'I have never tried sushi' },
      { id: 'pp2', type: 'choice', prompt: 'Выбери правильный вариант', hint: 'Yesterday требует Past Simple', options: ['I saw her yesterday', 'I have seen her yesterday', 'I have saw her yesterday', 'I see her yesterday'], answer: 'I saw her yesterday', speak: 'I saw her yesterday' },
      { id: 'pp3', type: 'build', prompt: 'Собери: «Ты уже закончил?»', hint: 'already — уже', options: ['yet', 'finished', 'you', 'Have'], answer: 'Have you finished yet', speak: 'Have you finished yet?' },
      { id: 'pp4', type: 'translate', prompt: 'Переведи: We have lived here since 2020', hint: 'since — начальная точка', answers: ['мы живем здесь с 2020 года', 'мы прожили здесь с 2020 года'], answer: 'Мы живем здесь с 2020 года', speak: 'We have lived here since 2020' },
      { id: 'pp5', type: 'choice', prompt: 'She has worked here ___ five years', hint: 'Период времени', options: ['for', 'since', 'from', 'during'], answer: 'for', speak: 'She has worked here for five years' },
    ],
  },
  {
    id: 'phrasal', unit: 5, difficulty: 'B1+', title: 'Фразовые глаголы', subtitle: 'Звучим естественнее', icon: 'git-branch', color: '#FF9F43', xp: 60,
    exercises: [
      { id: 'ph1', type: 'choice', prompt: '“I ran into an old friend” означает...', hint: 'run into — неожиданно встретить', options: ['Я случайно встретил старого друга', 'Я поссорился со старым другом', 'Я позвонил старому другу', 'Я убежал от старого друга'], answer: 'Я случайно встретил старого друга', speak: 'I ran into an old friend' },
      { id: 'ph2', type: 'choice', prompt: 'Please ___ your shoes before entering', hint: 'Снять одежду или обувь', options: ['take off', 'put off', 'turn off', 'get off'], answer: 'take off', speak: 'Please take off your shoes' },
      { id: 'ph3', type: 'build', prompt: 'Собери: «Не сдавайся!»', hint: 'give up — сдаваться', options: ['up', 'give', "Don't"], answer: "Don't give up", speak: "Don't give up!" },
      { id: 'ph4', type: 'translate', prompt: 'Переведи: We need to figure it out', hint: 'figure out — разобраться', answers: ['нам нужно в этом разобраться', 'мы должны это выяснить'], answer: 'Нам нужно в этом разобраться', speak: 'We need to figure it out' },
      { id: 'ph5', type: 'choice', prompt: 'The meeting was “put off”', hint: 'Что произошло со встречей?', options: ['Её отложили', 'Её отменили навсегда', 'Она началась раньше', 'Она закончилась'], answer: 'Её отложили', speak: 'The meeting was put off' },
    ],
  },
  {
    id: 'work', unit: 5, difficulty: 'B1+', title: 'Работа и встречи', subtitle: 'Деловой английский без канцелярита', icon: 'briefcase', color: '#6575E8', xp: 65,
    exercises: [
      { id: 'wo1', type: 'choice', prompt: '“Let’s wrap up” на встрече значит...', hint: 'wrap up — завершать', options: ['Давайте заканчивать', 'Давайте начнём заново', 'Давайте сделаем перерыв', 'Давайте проголосуем'], answer: 'Давайте заканчивать', speak: "Let's wrap up" },
      { id: 'wo2', type: 'build', prompt: 'Собери: «Не могли бы вы уточнить?»', hint: 'Could you...', options: ['that', 'clarify', 'you', 'Could'], answer: 'Could you clarify that', speak: 'Could you clarify that?' },
      { id: 'wo3', type: 'choice', prompt: 'Что означает “meet the deadline”?', hint: 'deadline — крайний срок', options: ['Уложиться в срок', 'Перенести срок', 'Назначить встречу', 'Отменить проект'], answer: 'Уложиться в срок', speak: 'meet the deadline' },
      { id: 'wo4', type: 'translate', prompt: 'Переведи: I’ll keep you posted', hint: 'Держать в курсе', answers: ['я буду держать вас в курсе', 'я сообщу вам о новостях'], answer: 'Я буду держать вас в курсе', speak: "I'll keep you posted" },
      { id: 'wo5', type: 'choice', prompt: 'Самый вежливый способ не согласиться:', hint: 'Деловая дискуссия', options: ["I see your point, but I have some concerns", "You're completely wrong", 'No, bad idea', 'I disagree, obviously'], answer: "I see your point, but I have some concerns", speak: 'I see your point, but I have some concerns' },
    ],
  },
  {
    id: 'conditionals', unit: 6, difficulty: 'B2', title: 'Условные предложения', subtitle: 'Реальность, мечты и сожаления', icon: 'shuffle', color: '#E76AA3', xp: 70,
    exercises: [
      { id: 'co1', type: 'choice', prompt: 'If it rains, we ___ at home', hint: 'First Conditional', options: ["will stay", 'would stay', 'stayed', 'have stayed'], answer: 'will stay', speak: "If it rains, we'll stay at home" },
      { id: 'co2', type: 'choice', prompt: 'If I ___ you, I would apologize', hint: 'Second Conditional: were для всех лиц', options: ['were', 'was', 'am', 'will be'], answer: 'were', speak: 'If I were you, I would apologize' },
      { id: 'co3', type: 'build', prompt: 'Собери: «Если бы я знал, я бы помог»', hint: 'Third Conditional', options: ['helped', 'have', 'would', 'known', 'had', 'I', 'I', 'If'], answer: 'If I had known I would have helped', speak: 'If I had known, I would have helped' },
      { id: 'co4', type: 'translate', prompt: 'Переведи: Unless you hurry, you’ll miss the train', hint: 'unless = if not', answers: ['если ты не поторопишься ты опоздаешь на поезд', 'если не поторопишься пропустишь поезд'], answer: 'Если ты не поторопишься ты опоздаешь на поезд', speak: "Unless you hurry, you'll miss the train" },
      { id: 'co5', type: 'choice', prompt: 'If she had left earlier, she ___ the bus', hint: 'Нереальное прошлое', options: ["wouldn't have missed", "won't miss", "wouldn't miss", "hadn't missed"], answer: "wouldn't have missed", speak: "She wouldn't have missed the bus" },
    ],
  },
  {
    id: 'interview', unit: 6, difficulty: 'B2', title: 'Собеседование', subtitle: 'Сильные ответы без шаблонов', icon: 'people', color: '#35A7A0', xp: 75,
    exercises: [
      { id: 'in1', type: 'choice', prompt: '“I’m a quick learner” означает...', hint: 'Описание сильной стороны', options: ['Я быстро учусь', 'Я быстро читаю', 'Я хороший учитель', 'Я тороплюсь на работу'], answer: 'Я быстро учусь', speak: "I'm a quick learner" },
      { id: 'in2', type: 'build', prompt: 'Собери: «Я отвечал за команду из пяти человек»', hint: 'was responsible for', options: ['people', 'five', 'of', 'team', 'a', 'for', 'responsible', 'was', 'I'], answer: 'I was responsible for a team of five people', speak: 'I was responsible for a team of five people' },
      { id: 'in3', type: 'choice', prompt: 'Лучший ответ на “Tell me about a challenge”:', hint: 'Нужен конкретный пример и результат', options: ['Describe the situation, your action, and the result', 'Say you have never faced challenges', 'Complain about your previous manager', 'Give a one-word answer'], answer: 'Describe the situation, your action, and the result', speak: 'Tell me about a challenge you faced' },
      { id: 'in4', type: 'translate', prompt: 'Переведи: I exceeded the target by twenty percent', hint: 'Результат с цифрами', answers: ['я превысил план на двадцать процентов', 'я перевыполнил план на двадцать процентов'], answer: 'Я превысил план на двадцать процентов', speak: 'I exceeded the target by twenty percent' },
      { id: 'in5', type: 'choice', prompt: 'Как вежливо спросить о следующих шагах?', hint: 'В конце интервью', options: ['What are the next steps in the process?', 'When do I start?', 'Did I get the job?', 'How soon will you call me?'], answer: 'What are the next steps in the process?', speak: 'What are the next steps in the process?' },
    ],
  },
  {
    id: 'idioms', unit: 7, difficulty: 'B2', title: 'Идиомы в разговоре', subtitle: 'Понимай носителей быстрее', icon: 'bulb', color: '#F0A43C', xp: 80,
    exercises: [
      { id: 'id1', type: 'choice', prompt: '“It’s not my cup of tea” означает...', hint: 'Не о напитках', options: ['Это не в моём вкусе', 'Я не пью чай', 'Это слишком просто', 'Мне нужно подумать'], answer: 'Это не в моём вкусе', speak: "It's not my cup of tea" },
      { id: 'id2', type: 'choice', prompt: '“Break the ice” — это...', hint: 'В начале общения', options: ['Разрядить обстановку', 'Испортить отношения', 'Начать спор', 'Сделать паузу'], answer: 'Разрядить обстановку', speak: 'break the ice' },
      { id: 'id3', type: 'build', prompt: 'Собери: «Давай назовём вещи своими именами»', hint: 'call a spade a spade', options: ['spade', 'a', 'spade', 'a', 'call', "Let's"], answer: "Let's call a spade a spade", speak: "Let's call a spade a spade" },
      { id: 'id4', type: 'translate', prompt: 'Переведи: We’re on the same page', hint: 'Общее понимание', answers: ['мы понимаем друг друга', 'мы одинаково это понимаем', 'мы согласны'], answer: 'Мы понимаем друг друга', speak: "We're on the same page" },
      { id: 'id5', type: 'choice', prompt: 'Если задача “a piece of cake”, она...', hint: 'Очень простая', options: ['Очень лёгкая', 'Очень срочная', 'Очень дорогая', 'Очень скучная'], answer: 'Очень лёгкая', speak: 'It was a piece of cake' },
    ],
  },
  {
    id: 'debate', unit: 7, difficulty: 'B2+', title: 'Мнение и аргументы', subtitle: 'Сложная дискуссия на английском', icon: 'mic', color: '#D15BE3', xp: 90,
    exercises: [
      { id: 'de1', type: 'choice', prompt: 'Какая фраза усиливает аргумент?', hint: 'Ссылка на доказательства', options: ['The evidence suggests that...', 'Everyone knows that...', 'I just feel it', 'It is what it is'], answer: 'The evidence suggests that...', speak: 'The evidence suggests that' },
      { id: 'de2', type: 'build', prompt: 'Собери: «С другой стороны, это может стоить дороже»', hint: 'On the other hand', options: ['more', 'cost', 'may', 'it', 'hand', 'other', 'the', 'On'], answer: 'On the other hand it may cost more', speak: 'On the other hand, it may cost more' },
      { id: 'de3', type: 'choice', prompt: '“That being said” вводит...', hint: 'Контраст с предыдущей мыслью', options: ['Оговорку или противоположный аргумент', 'Окончательный вывод', 'Пример', 'Новую тему без связи'], answer: 'Оговорку или противоположный аргумент', speak: 'That being said' },
      { id: 'de4', type: 'translate', prompt: 'Переведи: I partly agree, although there are exceptions', hint: 'Частичное согласие', answers: ['я частично согласен хотя есть исключения', 'отчасти я согласен но есть исключения'], answer: 'Я частично согласен хотя есть исключения', speak: 'I partly agree, although there are exceptions' },
      { id: 'de5', type: 'choice', prompt: 'Самый убедительный вывод:', hint: 'Суммируем аргумент', options: ['Taking everything into account, this is the most practical option', 'Anyway, that is all', 'I think I am right', 'You understand what I mean'], answer: 'Taking everything into account, this is the most practical option', speak: 'Taking everything into account, this is the most practical option' },
    ],
  },
  {
    id: 'mastery', unit: 8, difficulty: 'C1', title: 'Нюансы и стиль', subtitle: 'Точность продвинутой речи', icon: 'diamond', color: '#7C5CFC', xp: 100,
    exercises: [
      { id: 'ma1', type: 'choice', prompt: 'Выбери наиболее естественную формулировку:', hint: 'Формальный стиль', options: ['The proposal warrants further consideration', 'The proposal needs more thinking about', 'We should maybe think proposal more', 'Proposal is needing consideration'], answer: 'The proposal warrants further consideration', speak: 'The proposal warrants further consideration' },
      { id: 'ma2', type: 'choice', prompt: '“Hardly had I arrived when...” — это...', hint: 'Инверсия после hardly', options: ['Едва я прибыл, как...', 'Я с трудом приехал, потому что...', 'Я ещё не приехал, когда...', 'Если бы я приехал раньше...'], answer: 'Едва я прибыл, как...', speak: 'Hardly had I arrived when the meeting started' },
      { id: 'ma3', type: 'build', prompt: 'Собери: «Не только он опоздал, но и забыл документы»', hint: 'Инверсия после Not only', options: ['documents', 'the', 'forgot', 'also', 'he', 'but', 'late', 'he', 'was', 'only', 'Not'], answer: 'Not only was he late but he also forgot the documents', speak: 'Not only was he late, but he also forgot the documents' },
      { id: 'ma4', type: 'translate', prompt: 'Переведи: Had I known, I would have acted differently', hint: 'Инверсия вместо If I had known', answers: ['если бы я знал я бы поступил иначе', 'знай я об этом я бы поступил иначе'], answer: 'Если бы я знал я бы поступил иначе', speak: 'Had I known, I would have acted differently' },
      { id: 'ma5', type: 'choice', prompt: 'Слово “nevertheless” ближе всего к...', hint: 'Контраст между идеями', options: ['тем не менее', 'следовательно', 'более того', 'например'], answer: 'тем не менее', speak: 'nevertheless' },
    ],
  },
  ...extraLessons,
  ...moreLessons,
  ...expandedLessons,
];

const levelOrder = { A1: 0, A2: 1, 'A2+': 2, B1: 3, 'B1+': 4, B2: 5, 'B2+': 6, C1: 7 };
export const lessons = enrichLessons(baseLessons).sort((first, second) => (levelOrder[first.difficulty] ?? 99) - (levelOrder[second.difficulty] ?? 99) || first.unit - second.unit);

export const reviewWords = [
  { id: 'w1', english: 'confident', russian: 'уверенный', translations: ['уверенная', 'уверенно'], example: 'I feel confident when I speak English.', emoji: '💪' },
  { id: 'w2', english: 'journey', russian: 'путешествие', translations: ['поездка'], example: 'Every lesson is part of your journey.', emoji: '🧭' },
  { id: 'w3', english: 'improve', russian: 'улучшать', translations: ['улучшить', 'совершенствовать'], example: 'Practice helps you improve.', emoji: '🚀' },
  { id: 'w4', english: 'curious', russian: 'любознательный', translations: ['любопытный', 'любознательная'], example: 'Stay curious and ask questions.', emoji: '🔎' },
  { id: 'w5', english: 'habit', russian: 'привычка', example: 'Ten minutes a day builds a habit.', emoji: '🌱' },
  { id: 'w6', english: 'deadline', russian: 'крайний срок', example: 'We need to meet the deadline.', emoji: '⏳' },
  { id: 'w7', english: 'overcome', russian: 'преодолевать', translations: ['преодолеть'], example: 'She overcame every obstacle.', emoji: '⛰️' },
  { id: 'w8', english: 'evidence', russian: 'доказательства', translations: ['свидетельство', 'улики'], example: 'The evidence supports our conclusion.', emoji: '🧾' },
  { id: 'w9', english: 'approach', russian: 'подход', translations: ['метод'], example: 'We need a different approach.', emoji: '🧩' },
  { id: 'w10', english: 'although', russian: 'хотя', example: 'Although it was late, we continued.', emoji: '🔀' },
  { id: 'w11', english: 'reliable', russian: 'надёжный', translations: ['надежный', 'достоверный'], example: 'This source is reliable.', emoji: '🛡️' },
  { id: 'w12', english: 'warrant', russian: 'давать основания', translations: ['оправдывать', 'гарантировать'], example: 'The results warrant further research.', emoji: '🔬' },
];

export const phrases = [
  ['Could you help me?', 'Вы не могли бы мне помочь?'],
  ["I don't understand", 'Я не понимаю'],
  ['Could you speak slowly?', 'Не могли бы вы говорить медленнее?'],
  ['That sounds great!', 'Звучит отлично!'],
  ['Have a nice day!', 'Хорошего дня!'],
  ['Would you mind repeating that?', 'Не могли бы вы повторить?'],
  ['Let me get back to you on that', 'Позвольте мне уточнить и ответить позже'],
  ['I see where you’re coming from', 'Я понимаю вашу точку зрения'],
  ['As far as I’m concerned...', 'Насколько я могу судить...'],
  ['That’s a fair point', 'Это справедливое замечание'],
];

export const dictations = [
  { id: 'd1', level: 'A1', text: 'Nice to meet you', translation: 'Приятно познакомиться' },
  { id: 'd2', level: 'A2', text: 'Could you speak more slowly?', translation: 'Не могли бы вы говорить медленнее?' },
  { id: 'd3', level: 'A2', text: 'My flight has been delayed', translation: 'Мой рейс задержали' },
  { id: 'd4', level: 'B1', text: 'I have never tried anything like this', translation: 'Я никогда не пробовал ничего подобного' },
  { id: 'd5', level: 'B1', text: 'We need to figure out what went wrong', translation: 'Нам нужно выяснить, что пошло не так' },
  { id: 'd6', level: 'B2', text: 'I see your point, but I have some concerns', translation: 'Я понимаю вашу точку зрения, но у меня есть опасения' },
  { id: 'd7', level: 'B2', text: 'Had I known earlier, I would have acted differently', translation: 'Если бы я узнал раньше, я бы поступил иначе' },
  { id: 'd8', level: 'C1', text: 'The evidence warrants further consideration', translation: 'Доказательства требуют дальнейшего рассмотрения' },
  ...extraDictations,
];

const baseDialogues = [
  {
    id: 'airport', title: 'В аэропорту', emoji: '✈️', level: 'A2', color: '#36B8D9',
    intro: 'Ваш рейс отменили. Поговорите с сотрудником авиакомпании.',
    steps: [
      { speaker: 'Agent', line: 'Good afternoon. How can I help you?', prompt: 'Объясните проблему', options: ['My flight has been cancelled. What are my options?', 'I cancel the flying yesterday', 'Where is the coffee shop?'], answer: 'My flight has been cancelled. What are my options?' },
      { speaker: 'Agent', line: 'I can put you on the next flight tomorrow morning.', prompt: 'Спросите про отель', options: ['Will the airline provide accommodation?', 'Where I sleep now hotel?', 'Give me a room immediately'], answer: 'Will the airline provide accommodation?' },
      { speaker: 'Agent', line: 'Yes, we will arrange a hotel and transportation.', prompt: 'Вежливо поблагодарите', options: ['Thank you. I really appreciate your help.', 'Fine. Do it quickly.', 'At last, that is better.'], answer: 'Thank you. I really appreciate your help.' },
    ],
  },
  {
    id: 'meeting', title: 'Рабочая встреча', emoji: '💼', level: 'B1', color: '#6575E8',
    intro: 'На встрече обсуждают задержку проекта. Отвечайте дипломатично.',
    steps: [
      { speaker: 'Manager', line: 'Why are we behind schedule?', prompt: 'Объясните причину', options: ['We ran into an unexpected technical issue.', 'Because the team is bad.', 'I do not know anything.'], answer: 'We ran into an unexpected technical issue.' },
      { speaker: 'Manager', line: 'When can we expect the final version?', prompt: 'Назовите реалистичный срок', options: ['We should be able to deliver it by Friday.', 'Maybe sometime soon.', 'It was already done tomorrow.'], answer: 'We should be able to deliver it by Friday.' },
      { speaker: 'Manager', line: 'Please keep me updated.', prompt: 'Подтвердите', options: ["Of course. I'll keep you posted.", 'You can ask me later.', 'Updates are not necessary.'], answer: "Of course. I'll keep you posted." },
    ],
  },
  {
    id: 'interview_chat', title: 'Собеседование', emoji: '🤝', level: 'B2', color: '#35A7A0',
    intro: 'Пройдите короткое собеседование на английском.',
    steps: [
      { speaker: 'Interviewer', line: 'Tell me about a challenge you overcame.', prompt: 'Выберите сильное начало', options: ['In my previous role, our team faced a tight deadline.', 'I never have any challenges.', 'Challenges are always difficult.'], answer: 'In my previous role, our team faced a tight deadline.' },
      { speaker: 'Interviewer', line: 'What did you do?', prompt: 'Опишите действие', options: ['I reorganized the workflow and clarified priorities.', 'I waited until someone fixed it.', 'I was doing many different things.'], answer: 'I reorganized the workflow and clarified priorities.' },
      { speaker: 'Interviewer', line: 'What was the result?', prompt: 'Завершите ответ результатом', options: ['We delivered on time and exceeded the target by ten percent.', 'The result was a result.', 'Eventually it finished somehow.'], answer: 'We delivered on time and exceeded the target by ten percent.' },
    ],
  },
  {
    id: 'debate_chat', title: 'Дискуссия', emoji: '🎙️', level: 'C1', color: '#D15BE3',
    intro: 'Обсудите удалённую работу, сохраняя убедительный и вежливый тон.',
    steps: [
      { speaker: 'Partner', line: 'Remote work always reduces productivity.', prompt: 'Не согласитесь корректно', options: ["I see where you're coming from, but the evidence is mixed.", 'That is completely wrong.', 'No, remote work is best.'], answer: "I see where you're coming from, but the evidence is mixed." },
      { speaker: 'Partner', line: 'But communication is clearly more difficult.', prompt: 'Признайте часть аргумента', options: ['That is a fair point, although good processes can address it.', 'Communication does not matter.', 'You still do not understand.'], answer: 'That is a fair point, although good processes can address it.' },
      { speaker: 'Partner', line: 'So what would you recommend?', prompt: 'Предложите компромисс', options: ['Taking everything into account, a hybrid model seems most practical.', 'Everyone should choose anything.', 'I have no recommendation.'], answer: 'Taking everything into account, a hybrid model seems most practical.' },
    ],
  },
  ...extraDialogues,
  ...megaDialogues,
];

const dialogueFollowUps = [
  { speaker: 'Partner', line: 'Before we finish, shall we confirm the details?', prompt: 'Согласитесь и уточните', options: ['Yes, let us make sure everything is clear.', 'No details are ever needed.', 'You already say all thing.'], answer: 'Yes, let us make sure everything is clear.' },
  { speaker: 'Partner', line: 'Would you like me to send you a written confirmation?', prompt: 'Попросите подтверждение', options: ['Yes, please send it to me by email.', 'I want paper immediately now.', 'Confirmation not send.'], answer: 'Yes, please send it to me by email.' },
  { speaker: 'Partner', line: 'Perfect. I will take care of that today.', prompt: 'Вежливо завершите разговор', options: ['That is very helpful. Have a great day.', 'You should do it faster.', 'The talk is finishing.'], answer: 'That is very helpful. Have a great day.' },
];

export const dialogues = baseDialogues.map((dialogue) => ({ ...dialogue, steps: dialogue.steps.length >= 6 ? dialogue.steps : [...dialogue.steps, ...dialogueFollowUps.slice(0, 6 - dialogue.steps.length)] }));

