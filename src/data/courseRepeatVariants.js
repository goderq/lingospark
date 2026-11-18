const choice = (prompt, answer, wrong, explanation) => ({ type: 'choice', prompt, answer, options: [answer, ...wrong], explanation });
const build = (prompt, answer, options, explanation) => ({ type: 'build', prompt, answer, options, explanation });
const duration = (prompt, explanation) => choice(prompt, 'for', ['since', 'from', 'during'], explanation);

const variants = {
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
