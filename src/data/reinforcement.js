import { reinforcementSituations } from './reinforcementScenarios.js';
// Explicit source bindings prevent unrelated questions from entering practice.
const task = (skill, prompt, answer, wrong, explanation) => ({
  skill, prompt, answer, options: [answer, ...wrong], explanation, type: "choice",
});

// Change lexical surroundings without changing subject agreement, time markers,
// negation or the tested gap. These are reviewed singular/plural equivalents.
const practiceVocabulary = [
  [/\bcoffee\b/gi, 'tea'], [/\btrain\b/gi, 'bus'],
  [/\breport\b/gi, 'essay'], [/\breports\b/gi, 'essays'],
  [/\bLondon\b/g, 'Madrid'], [/\bBerlin\b/g, 'Rome'],
  [/\bCanada\b/g, 'Japan'], [/\bEnglish\b/g, 'Spanish'],
  [/\bcinema\b/gi, 'theatre'], [/\bfilm\b/gi, 'show'],
  [/\bbook\b/gi, 'magazine'], [/\bbooks\b/gi, 'magazines'],
  [/\bbridge\b/gi, 'school'], [/\bemail\b/gi, 'message'],
  [/\bflat\b/gi, 'house'], [/\bdog\b/gi, 'cat'],
  [/\bchildren\b/gi, 'students'], [/\bshop\b/gi, 'museum'],
  [/\bpresentation\b/gi, 'speech'], [/\bproject\b/gi, 'assignment'],
  [/\bhomework\b/gi, 'coursework'], [/\bdinner\b/gi, 'lunch'],
  [/\bAnna\b/g, 'Emma'], [/\bJohn\b/g, 'David'],
];

function varyGap(item, context) {
  if (!item.prompt?.includes('___') || !item.options?.includes(item.answer)) return null;
  for (const [pattern, replacement] of practiceVocabulary) {
    const prompt = item.prompt.replace(pattern, replacement);
    if (prompt === item.prompt) continue;
    return {
      type: 'choice', skill: context.topic || 'Грамматическая конструкция',
      prompt, answer: item.answer, options: [...item.options],
      explanation: `${item.explanation || item.hint || 'Сохрани грамматическую форму, которую требует окружение пропуска.'} Здесь меняется предмет или место, но временные маркеры и грамматическая связь остаются прежними.`,
    };
  }
  return null;
}

export const courseReinforcement = {
  'mega-greetings-2': task("Представить друга", "Представь нового друга Макса своим коллегам.", "This is my friend Max", ["Let me introduce myself", "Where are you from?", "It was nice meeting you"], "Чтобы представить другого человека, используем This is…: This is my friend Max — это мой друг Макс. Let me introduce myself относится к представлению себя, а не друга."),
  g1: task("Приветствие", "Ты встретил друга утром. Как поздороваться?", "Hi!", ["Goodbye!", "Thank you!"], "Hi — дружеское приветствие, как и Hello. Goodbye говорят при прощании, Thank you — когда благодарят."),
  g2: task("Имя собеседника", "Как спросить имя нового одноклассника?", "What's your name?", ["Where do you live?", "How old are you?"], "What's — сокращение What is. Слово name показывает, что вопрос об имени; where — о месте, how old — о возрасте."),
  c2: task("Счёт в кафе", "Ты закончил ужин и хочешь оплатить заказ. Что попросить?", "The bill, please.", ["The menu, please.", "A table, please."], "The bill — счёт к оплате. Menu нужно для выбора блюд, а table — столик."),
  t2: task("Посадочный талон", "На посадке просят показать документ с номером места. Это…", "a boarding pass", ["a suitcase", "a timetable"], "Boarding pass — посадочный талон с данными посадки и местом. Suitcase — чемодан; timetable — расписание."),
  s1: task("Как дела", "Друг говорит: How's it going? Что он хочет узнать?", "Как у тебя дела?", ["Куда ты идёшь?", "Как тебя зовут?"], "How's it going — разговорный вариант How is it going: вопрос о делах, а не о направлении движения."),
  sh3: task("Возврат денег", "Магазин вернул тебе стоимость покупки. Ты получил…", "a refund", ["a discount", "a receipt"], "Refund — возвращённые деньги. Discount — скидка при покупке; receipt — чек."),
  pa1: task("Прошлая форма go", "Last Saturday, Leo ___ to the museum.", "went", ["goes", "has gone"], "Last Saturday — завершённое время. Нужен Past Simple: go → went; goes относится к настоящему, has gone — Present Perfect."),
  pa2: task("Вопрос с did", "Выбери вопрос о вчерашнем звонке.", "Did you call her yesterday?", ["Did you called her yesterday?", "Do you called her yesterday?"], "Вопрос в Past Simple: Did + подлежащее + начальная форма call. Прошедшее время уже выражено через did."),
  pp5: task("Длительность с for", "He has lived here ___ three months.", "for", ["since", "during"], "Three months — длительность, поэтому for. Since указывает начальную точку: since March."),
  ph2: task("Снять одежду", "It's warm inside. Please ___ your coat.", "take off", ["turn off", "put off"], "Take off используют со снимаемой одеждой. Turn off — выключить устройство; put off — отложить событие."),
  he1: task("Боль в горле", "Как сказать врачу, что у тебя болит горло?", "My throat hurts.", ["My back hurts.", "I feel dizzy."], "Throat — горло: My throat hurts передаёт тот же симптом, что I have a sore throat. Back — спина; dizzy — головокружение."),
  he3: task("Рецепт врача", "В аптеке нужен документ от врача на лекарство. Это…", "a prescription", ["an appointment", "an insurance policy"], "Prescription — рецепт на лекарство. Appointment — запись на приём; insurance policy — страховой полис."),
};

export const tenseReinforcement = {
  "Present Simple": task("Present Simple", "Mia ___ the bus to work every day.", "takes", ["is taking", "took"], "Every day показывает привычку. С Mia (= she) в Present Simple добавляем -s: takes."),
  "Present Continuous": task("Present Continuous", "Look! The children ___ in the garden right now.", "are playing", ["play", "played"], "Look и right now указывают на действие сейчас. Children — множественное число: are + playing."),
  "Present Perfect": task("Present Perfect", "Nora ___ three countries so far this year.", "has visited", ["visited yesterday", "is visit"], "So far this year — период ещё продолжается, важен накопленный опыт. Nora (= she): has + visited."),
  "Present Perfect Continuous": task("Present Perfect Continuous", "We ___ for twenty minutes, and we are still waiting.", "have been waiting", ["are wait", "waited tomorrow"], "Ожидание началось раньше и продолжается сейчас. Длительность выражена через for: have been + waiting."),
  "Past Simple": task("Past Simple", "Emma ___ her keys yesterday.", "lost", ["loses", "has lost"], "Yesterday — законченное прошлое. Неправильный глагол lose имеет форму Past Simple lost."),
  "Past Continuous": task("Past Continuous", "At 8 yesterday evening, Ben ___ dinner.", "was cooking", ["cooks", "has cooked"], "Указан момент прошлого, в который шёл процесс. Ben (= he): was + cooking."),
  "Past Perfect": task("Past Perfect", "When we reached the cinema, the film ___.", "had already started", ["has already started", "will start"], "Фильм начался раньше нашего прихода: had + started. Обе точки относятся к прошлому."),
  "Past Perfect Continuous": task("Past Perfect Continuous", "By the time the café opened, we ___ outside for forty minutes.", "had been waiting", ["have been waiting", "will be waiting"], "Длительный процесс предшествовал открытию кафе в прошлом: had been + waiting."),
  "Future Simple": task("Future Simple", "I promise I ___ your secret.", "will keep", ["kept", "am keep"], "Обещание о будущем выражаем через will + начальная форма keep."),
  "Future Continuous": task("Future Continuous", "At this time tomorrow, we ___ over the Atlantic.", "will be flying", ["flew", "have flown"], "Речь о процессе в конкретный будущий момент: will be + flying."),
  "Future Perfect": task("Future Perfect", "By Friday evening, I ___ all five reports.", "will have finished", ["will finishing", "have finish"], "By Friday задаёт будущий срок завершения. Результат к этому сроку: will have + finished."),
  "Future Perfect Continuous": task("Future Perfect Continuous", "By next May, Dan ___ here for ten years.", "will have been working", ["will working", "has work"], "Подчёркнута длительность работы к будущей точке: will have been + working."),
};

const alternateCourseTasks = {
  g1: task('Приветствие', 'Ты начинаешь дружеское сообщение однокласснику. Какая первая реплика подходит?', 'Hey!', ['See you!', 'Sorry!'], 'Hey — неформальное приветствие. See you используют при прощании, Sorry — для извинения.'),
  g2: task('Имя собеседника', 'На языковой встрече ты ещё не знаешь имени партнёра. Что спросить?', 'What is your name?', ['What time is it?', 'Where is the station?'], 'Name означает имя. What time спрашивает время, Where is the station — расположение вокзала.'),
  'mega-greetings-2': task('Представить друга', 'Познакомь коллегу со своим другом Дэвидом.', 'This is my friend David', ['My name is David', 'Nice to meet you'], 'This is… представляет другого человека. My name is… называет твоё собственное имя.'),
  c2: task('Счёт в кафе', 'Ты готов оплатить ужин. Как вежливо обратиться к официанту?', 'Could I have the bill, please?', ['Could I have the menu, please?', 'Could I have some water, please?'], 'The bill — счёт за еду. Menu — меню, water — вода. Could I have… — вежливая просьба.'),
  t2: task('Посадочный талон', 'Как назвать по-английски талон, который сканируют перед входом в самолёт?', 'boarding pass', ['passport control', 'baggage claim'], 'Boarding pass — посадочный талон; passport control — паспортный контроль, baggage claim — выдача багажа.'),
  pp5: task('Длительность с for', 'They have studied together ___ six months.', 'for', ['since', 'at'], 'Six months — длительность. For обозначает, как долго; since требует начальную точку.'),
  pa1: task('Прошлая форма go', 'Last Sunday, we ___ to the park.', 'went', ['go', 'gone'], 'Last Sunday — завершённое прошлое. Нужна форма Past Simple: went. Gone используется с вспомогательным have.'),
  ph2: task('Снять одежду', 'Please ___ your hat before the ceremony.', 'take off', ['turn off', 'put off'], 'Take off означает снять одежду. Turn off — выключить, put off — отложить событие.'),
};

export function findReinforcement(item, context = {}) {
  const variant = Math.abs(context.practiceVariant || 0) % 2;
  if (variant && alternateCourseTasks[item.id]) return alternateCourseTasks[item.id];
  const source = courseReinforcement[item.id];
  if (source) return source;
  const situation = reinforcementSituations[item.id];
  if (situation && item.options?.includes(item.answer)) {
    return {
      type: 'choice',
      skill: context.topic || 'Применение фразы',
      prompt: situation,
      answer: item.answer,
      options: [...item.options],
      explanation: item.explanation || `В этой ситуации подходит «${item.answer}». ${item.hint || 'Сопоставь намерение говорящего с выбранной фразой.'}`,
    };
  }
  const gapVariant = varyGap(item, context);
  if (gapVariant) return gapVariant;
  // Exact topic matching only: never infer a grammar skill from broad words.
  if (context.formula && tenseReinforcement[context.topic]) {
    if (/^(for|since)$/i.test(item.answer)) {
      return task("Since / for", "She has worked here ___ 2022.", "since", ["for", "during"], "2022 — начальная точка, поэтому since. For нужно для длительности: for four years.");
    }
    return tenseReinforcement[context.topic];
  }
  return null;
}
