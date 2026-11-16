// Authored teaching material. These stages do not infer translations from a
// general dictionary and never grant completion of the corresponding course.
export const greetingJourney = {
  id: 'greetings', title: 'Знакомство', level: 'A1',
  goal: 'Поздороваться, представиться и познакомить друга.',
  ai: { level: 'A1', topic: 'Знакомство на языковой встрече', opening: "Hi! I'm Sam. What's your name?", instruction: 'Ты Sam на языковой встрече. Узнай имя ученика, познакомь его со своей подругой Mia, затем попрощайся. Задавай один короткий вопрос за ход. Тренируй Hello, My name is, This is my friend, Nice to meet you. Не отвечай за ученика. Не переходи к работе или путешествиям без его просьбы.' },
  stages: [
    { id: 'understand', title: 'Понять', skill: 'grammar', mode: 'choice',
      intro: 'Представь: ты пришёл на встречу, где все говорят по-английски. Начнём с трёх маленьких шагов.',
      cards: [
        { title: '1. Начни разговор', simple: 'Hello! подходит почти всегда. Hi! — более дружеское «Привет!».', detail: 'Hello и Hi — приветствия. Goodbye и Bye завершают разговор. Good morning обычно говорят до полудня, Good afternoon — после полудня. Вечером при встрече говорят Good evening; Good night — когда прощаются перед сном.', example: 'Hi! Nice to meet you.', translation: 'Привет! Приятно познакомиться.' },
        { title: '2. Назови себя', simple: 'My name is + имя. Например: My name is Leo. Короткий вариант: I’m Leo.', detail: 'My — «мой», name — «имя», is связывает имя с человеком. В английском is здесь нужно, хотя по-русски мы говорим «Меня зовут Лео». I’m = I am: это тоже естественный способ представиться. Не добавляй am после My name.', example: "My name is Leo. / I'm Leo.", translation: 'Меня зовут Лео. / Я Лео.' },
        { title: '3. Представь другого', simple: 'This is + человек. This is my friend Mia — это моя подруга Миа.', detail: 'This is знакомит собеседника с другим человеком. My name is представляет самого говорящего. После знакомства уместно Nice to meet you. В ответ можно сказать Nice to meet you too. Too в конце значит «тоже».', example: 'This is my friend Mia. — Nice to meet you, Mia!', translation: 'Это моя подруга Миа. — Приятно познакомиться, Миа!' },
      ],
      exercises: [
        { id: 'j-understand-1', type: 'choice', prompt: 'Ты впервые встретил соседа днём. Как начать разговор?', answer: 'Hello!', options: ['Hello!', 'Good night!', 'Goodbye!'], explanation: 'Hello начинает встречу. Good night говорят перед сном, Goodbye — при прощании.' },
        { id: 'j-understand-2', type: 'choice', prompt: 'Лео представляет себя. Какая фраза построена правильно?', answer: 'My name is Leo.', options: ['My name is Leo.', 'My name am Leo.', 'My name Leo.'], explanation: 'После My name нужна форма is. Am употребляется с I: I am Leo.' },
        { id: 'j-understand-3', type: 'choice', prompt: 'Ты знакомишь собеседника со своей подругой Мией. Что сказать?', answer: 'This is my friend Mia.', options: ['My name is Mia.', 'This is my friend Mia.', 'Nice to meet my.'], explanation: 'This is представляет другого человека. My name is называет твоё собственное имя.' },
      ] },
    { id: 'words', title: 'Слова в ситуации', skill: 'vocabulary', mode: 'input',
      intro: 'Учи слова вместе с фразой. Здесь только значения, нужные для знакомства.',
      cards: [
        { title: 'hello · приветствие', simple: 'Здравствуйте; привет.', example: 'Hello, Sam!', translation: 'Привет, Сэм!' },
        { title: 'name · существительное', simple: 'Имя.', example: 'My name is Mia.', translation: 'Меня зовут Миа.' },
        { title: 'friend · существительное', simple: 'Друг; подруга.', example: 'This is my friend Leo.', translation: 'Это мой друг Лео.' },
        { title: 'meet · глагол', simple: 'Встретить; познакомиться — в выражении nice to meet you.', example: 'Nice to meet you.', translation: 'Приятно познакомиться.' },
        { title: 'too · наречие', simple: 'Тоже — в конце ответной фразы.', example: 'Nice to meet you too.', translation: 'Мне тоже приятно познакомиться.' },
      ],
      exercises: [
        { id: 'j-words-1', type: 'translate', prompt: 'Заполни пропуск: My ___ is Leo. Напиши только слово «имя».', answer: 'name', explanation: 'My name is Leo — меня зовут Лео. Name означает «имя».' },
        { id: 'j-words-2', type: 'translate', prompt: 'Заполни пропуск: This is my ___. Напиши только слово «друг».', answer: 'friend', explanation: 'My friend — мой друг или моя подруга.' },
        { id: 'j-words-3', type: 'translate', prompt: 'Тебе сказали Nice to meet you. Заполни ответ: Nice to meet you ___.', answer: 'too', explanation: 'Too в конце фразы означает «тоже».' },
      ] },
    { id: 'listen', title: 'Услышать', skill: 'listening', mode: 'listen',
      intro: 'Послушай и запиши английскую фразу. Можно слушать повторно и медленнее. Текст появится после ответа. Это проверка слуха, а не произношения.',
      cards: [], exercises: [
        { id: 'j-listen-1', type: 'translate', prompt: 'Послушай и запиши приветствие с именем.', answer: 'Hello, Mia!', speak: 'Hello, Mia!', explanation: 'Hello — приветствие. Mia — имя собеседницы; пунктуация не влияет на оценку.' },
        { id: 'j-listen-2', type: 'translate', prompt: 'Послушай и запиши, как человек представляется.', answer: 'My name is Sam.', speak: 'My name is Sam.', explanation: 'My name is Sam — меня зовут Сэм. В этой конструкции нужна форма is.' },
        { id: 'j-listen-3', type: 'translate', prompt: 'Послушай и запиши вежливую фразу при знакомстве.', answer: 'Nice to meet you.', speak: 'Nice to meet you.', explanation: 'Nice to meet you — приятно познакомиться. To соединяет nice с глаголом meet в этом выражении.' },
      ] },
    { id: 'phrases', title: 'Собрать фразу', skill: 'writing', mode: 'build',
      intro: 'Перенеси правило на новые имена и ситуации. Нажимай слова по порядку; выбранное слово можно убрать.',
      cards: [], exercises: [
        { id: 'j-phrases-1', type: 'build', prompt: 'Представься: «Меня зовут Сэм».', answer: 'My name is Sam', options: ['Sam', 'is', 'name', 'My'], explanation: 'Начни с My name («моё имя»), затем поставь is и назови имя: My name is Sam.' },
        { id: 'j-phrases-2', type: 'build', prompt: 'Познакомь людей: «Это моя подруга Миа».', answer: 'This is my friend Mia', options: ['friend', 'Mia', 'my', 'This', 'is'], explanation: 'This is представляет человека; my friend уточняет, кто это.' },
        { id: 'j-phrases-3', type: 'build', prompt: 'Ответь: «Мне тоже приятно познакомиться».', answer: 'Nice to meet you too', options: ['you', 'Nice', 'too', 'meet', 'to'], explanation: 'Nice to meet you — устойчивая фраза. Ответное too ставим в конец.' },
      ] },
    { id: 'dialogue', title: 'Поговорить', skill: 'conversation', mode: 'input',
      intro: 'Ты на языковой встрече. Сэм обращается к тебе. Отвечай по подсказанной ситуации на английском. Это подготовленный письменный диалог, его можно пройти без модели ИИ.',
      cards: [], exercises: [
        { id: 'j-dialogue-1', type: 'translate', line: "Hi! I'm Sam. What's your name?", prompt: 'Тебя зовут Лео. Представься одной фразой.', answer: 'My name is Leo', answers: ["I'm Leo", 'I am Leo', 'Hi, my name is Leo', "Hi, I'm Leo", 'Hello, my name is Leo'], explanation: 'My name is Leo и I’m Leo — естественные способы представиться.' },
        { id: 'j-dialogue-2', type: 'translate', line: 'Nice to meet you, Leo!', prompt: 'Скажи, что тебе тоже приятно познакомиться.', answer: 'Nice to meet you too', answers: ["It's nice to meet you too", 'It is nice to meet you too'], explanation: 'Добавь too в конец ответной фразы: «мне тоже».' },
        { id: 'j-dialogue-3', type: 'translate', line: 'Who is that with you?', prompt: 'Представь свою подругу Мию.', answer: 'This is my friend Mia', answers: ["She's my friend Mia", 'She is my friend Mia', 'This is Mia, my friend'], explanation: 'This is my friend Mia знакомит Сэма с Мией. She is my friend Mia тоже передаёт нужный смысл.' },
      ] },
  ],
};

export const learningJourneys = [greetingJourney];
export const getJourney = id => learningJourneys.find(item => item.id === id);
