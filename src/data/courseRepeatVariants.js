const choice = (prompt, answer, wrong, explanation) => ({ type: 'choice', prompt, answer, options: [answer, ...wrong], explanation });
const build = (prompt, answer, options, explanation) => ({ type: 'build', prompt, answer, options, explanation });
const duration = (prompt, explanation) => choice(prompt, 'for', ['since', 'from', 'during'], explanation);

const variants = {
  g2: [
    choice('На встрече слышишь: “What’s your name?” Что спросили?', 'Как тебя зовут?', ['Где ты живёшь?', 'Как у тебя дела?', 'Куда ты идёшь?'], 'Name здесь значит «имя». “What’s your name?” — сокращённая форма “What is your name?”.'),
    choice('На регистрации спрашивают: “Could you tell me your name?” Чего от тебя ждут?', 'Назвать своё имя', ['Назвать номер телефона', 'Уточнить время встречи', 'Показать приглашение'], 'Could you tell me… — вежливая просьба сообщить информацию. Your name — твоё имя.'),
  ],
  t2: [
    choice('У выхода на посадку просят “Show your boarding pass”. Какой документ нужен?', 'Посадочный талон', ['Багажная бирка', 'Маршрутная квитанция', 'Паспорт'], 'Boarding pass предъявляют при посадке. На нём указаны данные рейса и место.'),
    choice('В приложении авиакомпании есть кнопка “Download boarding pass”. Что скачается?', 'Талон для посадки', ['Список рейсов', 'Чек об оплате', 'Правила перевозки'], 'Boarding связан с посадкой, а pass здесь означает пропуск или талон.'),
  ],
  s1: [
    choice('Коллега встречает тебя утром и говорит: “How’s it going?” Что он спрашивает?', 'Как у тебя дела?', ['Куда ты едешь?', 'Во сколько ты придёшь?', 'Как тебя зовут?'], 'How’s it going? — неформальный вопрос о делах.'),
    choice('Друг прислал “How are things?” Как передать смысл?', 'Как поживаешь?', ['Где твои вещи?', 'Куда мы идём?', 'Есть ли у тебя время?'], 'How are things? — разговорный вопрос о том, как у человека идут дела.'),
  ],
  sh3: [
    choice('В письме магазина написано: “Your refund has been issued”. Что произошло?', 'Магазин оформил возврат денег', ['Магазин отправил замену', 'Магазин продлил гарантию', 'Магазин начислил скидку'], 'Refund — возврат уже уплаченной суммы.'),
    choice('Кассир предлагает “a refund or an exchange”. Что означает “a refund”?', 'Получить деньги обратно', ['Выбрать другой размер', 'Взять товар на примерку', 'Получить купон на покупку'], 'Refund — возврат денег. Exchange — обмен товара.'),
  ],
  ho3: [
    choice('В гостинице предлагают “late checkout until 2 p.m.” Что это даёт?', 'Можно освободить номер позже', ['Можно заселиться раньше', 'Можно перенести день заезда', 'Можно оставить вещи до заселения'], 'Checkout — выезд из гостиницы, late — позже обычного.'),
    choice('В подтверждении брони есть “late checkout available”. Что доступно?', 'Поздний выезд из номера', ['Поздний заезд в номер', 'Продление брони на ночь', 'Перенос завтрака на другое время'], 'Late checkout означает возможность выехать позже стандартного времени.'),
  ],
  pl1: [
    choice('Look at that cyclist! He ___ fall.', 'is going to', ['am going to', 'are going to', 'was going to'], 'Ты видишь признаки события в настоящем. С he используется is going to.'),
    choice('The glass is slipping off the table. It ___ break.', 'is going to', ['am going to', 'are going to', 'has gone to'], 'Стакан уже соскальзывает. Для прогноза по видимым признакам подходит is going to.'),
  ],
  pp1: [
    choice('I ___ never ___ an electric car.', 'have / driven', ['have / drove', 'did / driven', 'am / driving'], 'Present Perfect описывает опыт. После have нужна третья форма driven.'),
    choice('We ___ never ___ this film before.', 'have / seen', ['have / saw', 'did / seen', 'are / seeing'], 'Для опыта к настоящему моменту используется have + seen.'),
  ],
  he3: [
    choice('В аптеке спрашивают: “Do you have a prescription?” Что хотят увидеть?', 'Рецепт от врача', ['Назначенное время приёма', 'Медицинскую страховку', 'Чек за лекарство'], 'Prescription — рецепт, по которому аптека выдаёт лекарство.'),
    choice('Врач говорит: “I’ll write you a prescription”. Что он сделает?', 'Выпишет рецепт', ['Запишет на анализы', 'Выпишет справку', 'Назначит новый приём'], 'Write a prescription значит выписать рецепт.'),
  ],
  re5: [
    choice('Друг говорит о соседях: “We get along well”. Как у них складываются отношения?', 'Они хорошо ладят', ['Они редко встречаются', 'Они вместе переезжают', 'Они часто спорят'], 'Get along описывает отношения между людьми.'),
    choice('Что значит “I get on well with my colleagues”?', 'Я хорошо лажу с коллегами', ['Я часто подменяю коллег', 'Я работаю над одним проектом с коллегами', 'Я скоро познакомлюсь с коллегами'], 'Get on well with — распространённый британский вариант get along well with.'),
  ],
  po3: [
    choice('Во время звонка говорят: “You’re breaking up”. Что заметил собеседник?', 'Твой голос слышно с перебоями', ['Ты говоришь слишком громко', 'Ты звонишь по другому номеру', 'Ты хочешь закончить разговор'], 'Break up в телефонном разговоре означает, что звук прерывается.'),
    choice('Ты слышишь слова через одно. “The line keeps breaking up”. Как описать проблему?', 'Связь постоянно прерывается', ['Телефон постоянно занят', 'Звонок поступает с неизвестного номера', 'Не удаётся включить громкую связь'], 'Keeps breaking up указывает на повторяющиеся перебои связи.'),
  ],
  cu3: [
    choice('На упаковке указано “dairy-free”. Какое свойство продукта отмечено?', 'Он без молочных продуктов', ['Он без сахара', 'Он без пшеницы', 'Он без яиц'], 'Dairy означает молочные продукты. Free в составе dairy-free означает отсутствие.'),
    choice('Гость спрашивает: “Is this dessert dairy-free?” Что нужно уточнить?', 'Есть ли в десерте молочные продукты', ['Есть ли в десерте орехи', 'Есть ли в десерте яйца', 'Есть ли в десерте фрукты'], 'Dairy-free относится только к молочным ингредиентам.'),
  ],
  sp3: [
    choice('Our swimmer ___ a new national record yesterday.', 'set', ['made', 'did', 'put'], 'Устойчивое сочетание set a record означает установить рекорд. В прошлом форма set совпадает с исходной.'),
    choice('The team wants to ___ a new club record this season.', 'set', ['make', 'do', 'put'], 'После wants to нужен глагол в начальной форме. С record употребляется set.'),
  ],
  'deep-te2': [
    choice('I cannot remember my password. How do I ___ it?', 'reset', ['delete', 'enter', 'save'], 'Reset a password — задать новый пароль через процедуру сброса.'),
    choice('Use this link to ___ your forgotten password.', 'reset', ['reuse', 'share', 'store'], 'Если пароль забыт, ссылка позволяет reset, то есть сбросить его и выбрать новый.'),
  ],
  wo3: [
    choice('Руководитель спрашивает: “Can we meet the deadline?” Что ему важно?', 'Успеем ли мы в срок', ['Когда пройдёт встреча', 'Кто перенесёт встречу', 'Как согласовать смету'], 'Meet the deadline — выполнить работу к установленному сроку.'),
    choice('Коллега пишет: “We met the deadline”. Что получилось?', 'Мы закончили вовремя', ['Мы согласовали новый срок', 'Мы обсудили задержку', 'Мы назначили созвон'], 'Met — прошедшая форма meet. Здесь вместе с deadline она означает, что команда уложилась в срок.'),
  ],
  ed1: [
    choice('На учебной платформе написано “Submit your assignment by Friday”. Что нужно сделать?', 'Сдать задание к пятнице', ['Скачать задание к пятнице', 'Начать курс в пятницу', 'Обсудить оценку в пятницу'], 'Submit — отправить работу на проверку, by Friday — к пятнице.'),
    choice('Преподаватель спрашивает: “Have you submitted the assignment?” Что он хочет узнать?', 'Сдали ли вы задание', ['Поняли ли вы тему', 'Когда назначили урок', 'Скачали ли вы материалы'], 'Submit an assignment — сдать или отправить учебное задание.'),
  ],

  g3: [
    build('Собери: «Меня зовут Кейт»', 'My name is Kate', ['Kate', 'is', 'My', 'name'], 'После My name нужна связка is, затем имя.'),
    build('Собери: «Меня зовут Дэн»', 'My name is Dan', ['is', 'Dan', 'name', 'My'], 'Начни с My name, затем добавь is и имя.'),
  ],
  c2: [
    choice('Официант спрашивает: «Would you like the bill?» Что он предлагает?', 'Принести счёт', ['Принести меню', 'Долить воды', 'Принести десерт'], 'The bill — счёт за заказ.'),
    choice('Гость говорит: «The bill, please». Что он просит?', 'Счёт', ['Столик', 'Чай', 'Меню'], 'The bill означает «счёт к оплате».'),
  ],
  pa1: [
    choice('Last Saturday we ___ to the museum.', 'went', ['go', 'goed', 'have gone'], 'Last Saturday указывает на завершённое прошлое. Прошедшая форма go — went.'),
    choice('She ___ to the station yesterday.', 'went', ['goes', 'did went', 'has gone'], 'Yesterday задаёт прошлое время. В утвердительном предложении используется went.'),
  ],
  pa2: [
    choice('Выбери правильный вопрос о вчерашней работе.', 'Did you finish the report yesterday?', ['Did you finished the report yesterday?', 'Do you finished the report yesterday?', 'Was you finish the report yesterday?'], 'После Did и подлежащего you нужна начальная форма finish.'),
    choice('Выбери правильный вопрос о поездке на прошлой неделе.', 'Did you take the train last week?', ['Did you took the train last week?', 'Do you took the train last week?', 'Were you take the train last week?'], 'Did уже показывает прошлое время. Поэтому нужно take.'),
  ],
  pa3: [
    build('Собери: «Она не взяла зонт»', "She didn't take an umbrella", ['take', "didn't", 'umbrella', 'She', 'an'], 'После didn’t употребляется начальная форма take.'),
    build('Собери: «Мы не получили твоё сообщение»', "We didn't get your message", ['get', 'your', "didn't", 'message', 'We'], 'В отрицании Past Simple употребляется didn’t + начальная форма get.'),
  ],
  pp5: [
    duration('I have had this phone ___ two years.', 'Two years — период, поэтому употребляется for. Since указывает начальную точку.'),
    duration('They have known each other ___ a long time.', 'A long time — продолжительность. Для неё подходит for.'),
  ],
  ph2: [
    choice('It’s warm inside. Please ___ your coat.', 'take off', ['turn off', 'put off', 'get off'], 'Take off означает «снять предмет одежды».'),
    choice('You can ___ your gloves before we start.', 'take off', ['turn off', 'put off', 'get off'], 'С перчатками подходит take off. Turn off используют, когда выключают устройство.'),
  ],
};

export function courseExercisesForAttempt(lesson, completedAttempts) {
  if (!completedAttempts) return lesson.exercises;
  return lesson.exercises.map(exercise => {
    const choices = variants[exercise.id];
    if (!choices) return exercise;
    const index = (completedAttempts - 1) % choices.length;
    return { ...choices[index], id: `${exercise.id}-repeat-${index + 1}`, sourceExerciseId: exercise.id };
  });
}
