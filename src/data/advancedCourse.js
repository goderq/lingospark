import { advancedTimeModules, moreTenseDrills } from './expandedContent.js';
import { c1TimeModules } from './c1TimeModules.js';

export const extraLessons = [
  { id: 'health', unit: 8, difficulty: 'B1', title: 'Здоровье и врач', subtitle: 'Симптомы, аптека и запись', icon: 'medkit', color: '#E85D75', xp: 70, exercises: [
    { id: 'he1', type: 'choice', prompt: '“I have a sore throat” означает...', options: ['У меня болит горло', 'У меня кружится голова', 'У меня болит спина', 'У меня высокая температура'], answer: 'У меня болит горло', speak: 'I have a sore throat' },
    { id: 'he2', type: 'build', prompt: 'Собери: «Как долго у вас эти симптомы?»', options: ['symptoms', 'these', 'had', 'you', 'have', 'long', 'How'], answer: 'How long have you had these symptoms', speak: 'How long have you had these symptoms?' },
    { id: 'he3', type: 'choice', prompt: 'Что значит “prescription”?', options: ['рецепт врача', 'больничный', 'страховка', 'диагноз'], answer: 'рецепт врача', speak: 'prescription' },
    { id: 'he4', type: 'translate', prompt: 'Переведи: Are there any side effects?', answers: ['есть ли побочные эффекты', 'имеются ли побочные эффекты'], answer: 'Есть ли побочные эффекты', speak: 'Are there any side effects?' },
    { id: 'he5', type: 'choice', prompt: 'You ___ take this medicine after meals', options: ['should', 'would', 'had', 'are'], answer: 'should', speak: 'You should take this medicine after meals' },
  ]},
  { id: 'relationships', unit: 8, difficulty: 'B1', title: 'Отношения и эмоции', subtitle: 'Чувства, поддержка и границы', icon: 'heart', color: '#FF5C8A', xp: 72, exercises: [
    { id: 're1', type: 'choice', prompt: '“I’m here for you” означает...', options: ['Я рядом и поддержу тебя', 'Я жду тебя здесь', 'Я пришёл за тобой', 'Я не согласен'], answer: 'Я рядом и поддержу тебя', speak: "I'm here for you" },
    { id: 're2', type: 'build', prompt: 'Собери: «Мне нужно немного пространства»', options: ['space', 'some', 'need', 'I'], answer: 'I need some space', speak: 'I need some space' },
    { id: 're3', type: 'choice', prompt: 'Как мягко выразить недовольство?', options: ['I felt hurt when that happened', 'You always ruin everything', 'This is all your fault', 'Never speak to me'], answer: 'I felt hurt when that happened', speak: 'I felt hurt when that happened' },
    { id: 're4', type: 'translate', prompt: 'Переведи: We need to talk this through', answers: ['нам нужно это обсудить', 'нам надо всё подробно обсудить'], answer: 'Нам нужно это обсудить', speak: 'We need to talk this through' },
    { id: 're5', type: 'choice', prompt: '“We get along well” означает...', options: ['Мы хорошо ладим', 'Мы часто спорим', 'Мы давно знакомы', 'Мы живём вместе'], answer: 'Мы хорошо ладим', speak: 'We get along well' },
  ]},
  { id: 'phone', unit: 9, difficulty: 'B1', title: 'Телефонные разговоры', subtitle: 'Звонки без паники', icon: 'call', color: '#36B8D9', xp: 74, exercises: [
    { id: 'po1', type: 'choice', prompt: 'Как попросить подождать на линии?', options: ['Could you hold for a moment?', 'Can you stay in the line?', 'Wait there now', 'Do not hang'], answer: 'Could you hold for a moment?', speak: 'Could you hold for a moment?' },
    { id: 'po2', type: 'build', prompt: 'Собери: «Я соединю вас с отделом продаж»', options: ['sales', 'to', 'through', 'you', 'put', "I'll"], answer: "I'll put you through to sales", speak: "I'll put you through to sales" },
    { id: 'po3', type: 'choice', prompt: '“The line is breaking up” означает...', options: ['Связь прерывается', 'Линия занята', 'Звонок завершён', 'Телефон сломан'], answer: 'Связь прерывается', speak: 'The line is breaking up' },
    { id: 'po4', type: 'translate', prompt: 'Переведи: Could I leave a message?', answers: ['могу я оставить сообщение', 'можно оставить сообщение'], answer: 'Могу я оставить сообщение', speak: 'Could I leave a message?' },
    { id: 'po5', type: 'choice', prompt: 'Самое естественное начало делового звонка:', options: ['Hello, this is Anna calling from NovaTech', 'Hello, I am Anna who calls', 'It is Anna on phone', 'Anna speaking to you now'], answer: 'Hello, this is Anna calling from NovaTech', speak: 'Hello, this is Anna calling from NovaTech' },
  ]},
  { id: 'education', unit: 9, difficulty: 'B1+', title: 'Учёба и образование', subtitle: 'Курсы, экзамены и проекты', icon: 'school', color: '#7C5CFC', xp: 76, exercises: [
    { id: 'ed1', type: 'choice', prompt: '“Submit an assignment” означает...', options: ['сдать задание', 'получить оценку', 'пропустить занятие', 'пересдать экзамен'], answer: 'сдать задание', speak: 'submit an assignment' },
    { id: 'ed2', type: 'build', prompt: 'Собери: «Когда крайний срок?»', options: ['deadline', 'the', 'is', 'When'], answer: 'When is the deadline', speak: 'When is the deadline?' },
    { id: 'ed3', type: 'choice', prompt: 'I wish I ___ more attention in class', options: ['had paid', 'have paid', 'would pay yesterday', 'pay'], answer: 'had paid', speak: 'I wish I had paid more attention in class' },
    { id: 'ed4', type: 'translate', prompt: 'Переведи: I need to catch up with the course', answers: ['мне нужно догнать курс', 'мне нужно наверстать материал'], answer: 'Мне нужно наверстать материал', speak: 'I need to catch up with the course' },
    { id: 'ed5', type: 'choice', prompt: 'Что такое “tuition fees”?', options: ['плата за обучение', 'стипендия', 'учебный план', 'вступительный экзамен'], answer: 'плата за обучение', speak: 'tuition fees' },
  ]},
  { id: 'finance', unit: 10, difficulty: 'B2', title: 'Деньги и финансы', subtitle: 'Банк, бюджет и инвестиции', icon: 'wallet', color: '#2ED3B7', xp: 82, exercises: [
    { id: 'fi1', type: 'choice', prompt: '“Interest rate” означает...', options: ['процентная ставка', 'обменный курс', 'банковская комиссия', 'остаток на счёте'], answer: 'процентная ставка', speak: 'interest rate' },
    { id: 'fi2', type: 'build', prompt: 'Собери: «С моего счёта списали комиссию»', options: ['account', 'my', 'from', 'fee', 'a', 'charged', 'was', 'I'], answer: 'I was charged a fee from my account', speak: 'I was charged a fee from my account' },
    { id: 'fi3', type: 'choice', prompt: 'If expenses exceed income, you are...', options: ['running a deficit', 'breaking even', 'making a deposit', 'earning interest'], answer: 'running a deficit', speak: 'running a deficit' },
    { id: 'fi4', type: 'translate', prompt: 'Переведи: I’d like to dispute this transaction', answers: ['я хочу оспорить эту операцию', 'я хотел бы оспорить эту транзакцию'], answer: 'Я хочу оспорить эту операцию', speak: "I'd like to dispute this transaction" },
    { id: 'fi5', type: 'choice', prompt: '“Break even” значит...', options: ['выйти в ноль', 'обанкротиться', 'получить прибыль', 'взять кредит'], answer: 'выйти в ноль', speak: 'break even' },
  ]},
  { id: 'media', unit: 10, difficulty: 'B2', title: 'Новости и медиа', subtitle: 'Факты, мнения и манипуляции', icon: 'newspaper', color: '#F07B62', xp: 84, exercises: [
    { id: 'me1', type: 'choice', prompt: '“A reliable source” — это...', options: ['надёжный источник', 'анонимный источник', 'главная новость', 'предвзятая статья'], answer: 'надёжный источник', speak: 'a reliable source' },
    { id: 'me2', type: 'build', prompt: 'Собери: «Эти данные были вырваны из контекста»', options: ['context', 'of', 'out', 'taken', 'were', 'figures', 'These'], answer: 'These figures were taken out of context', speak: 'These figures were taken out of context' },
    { id: 'me3', type: 'choice', prompt: 'Как отличить факт от мнения?', options: ['A fact can be verified with evidence', 'A fact sounds convincing', 'An opinion is always false', 'A headline is always a fact'], answer: 'A fact can be verified with evidence', speak: 'A fact can be verified with evidence' },
    { id: 'me4', type: 'translate', prompt: 'Переведи: The article presents a biased view', answers: ['статья представляет предвзятую точку зрения', 'в статье изложен необъективный взгляд'], answer: 'Статья представляет предвзятую точку зрения', speak: 'The article presents a biased view' },
    { id: 'me5', type: 'choice', prompt: '“Misleading” ближе всего к...', options: ['вводящий в заблуждение', 'убедительный', 'подробный', 'проверенный'], answer: 'вводящий в заблуждение', speak: 'misleading' },
  ]},
  { id: 'environment', unit: 11, difficulty: 'B2', title: 'Экология и будущее', subtitle: 'Климат и устойчивое развитие', icon: 'leaf', color: '#4CB963', xp: 86, exercises: [
    { id: 'ev1', type: 'choice', prompt: '“Renewable energy” означает...', options: ['возобновляемая энергия', 'ядерная энергия', 'ископаемое топливо', 'экономия энергии'], answer: 'возобновляемая энергия', speak: 'renewable energy' },
    { id: 'ev2', type: 'build', prompt: 'Собери: «Выбросы необходимо значительно сократить»', options: ['significantly', 'reduced', 'be', 'must', 'Emissions'], answer: 'Emissions must be reduced significantly', speak: 'Emissions must be reduced significantly' },
    { id: 'ev3', type: 'choice', prompt: 'The policy aims to ___ carbon emissions', options: ['curb', 'rise', 'waste', 'spread'], answer: 'curb', speak: 'curb carbon emissions' },
    { id: 'ev4', type: 'translate', prompt: 'Переведи: Individual choices can make a difference', answers: ['личный выбор может изменить ситуацию', 'индивидуальные решения имеют значение'], answer: 'Личный выбор может изменить ситуацию', speak: 'Individual choices can make a difference' },
    { id: 'ev5', type: 'choice', prompt: '“Sustainable” означает...', options: ['устойчивый и долгосрочный', 'временный', 'дорогостоящий', 'быстрорастущий'], answer: 'устойчивый и долгосрочный', speak: 'sustainable' },
  ]},
  { id: 'negotiation', unit: 11, difficulty: 'C1', title: 'Переговоры', subtitle: 'Условия, компромисс и влияние', icon: 'hand-left', color: '#D15BE3', xp: 94, exercises: [
    { id: 'ne1', type: 'choice', prompt: 'Как обозначить границу уступок?', options: ["That's as far as we can go", 'We give you everything', 'No more talking', 'This is impossible for you'], answer: "That's as far as we can go", speak: "That's as far as we can go" },
    { id: 'ne2', type: 'build', prompt: 'Собери: «При условии, что вы согласитесь с нашими сроками»', options: ['timeline', 'our', 'to', 'agree', 'you', 'that', 'Provided'], answer: 'Provided that you agree to our timeline', speak: 'Provided that you agree to our timeline' },
    { id: 'ne3', type: 'choice', prompt: '“A mutually beneficial agreement” — это...', options: ['взаимовыгодное соглашение', 'временный договор', 'односторонняя уступка', 'необязательное обещание'], answer: 'взаимовыгодное соглашение', speak: 'a mutually beneficial agreement' },
    { id: 'ne4', type: 'translate', prompt: 'Переведи: We are prepared to meet you halfway', answers: ['мы готовы пойти вам навстречу', 'мы готовы встретиться посередине'], answer: 'Мы готовы пойти вам навстречу', speak: 'We are prepared to meet you halfway' },
    { id: 'ne5', type: 'choice', prompt: 'Самая дипломатичная формулировка отказа:', options: ["I'm afraid those terms wouldn't be workable for us", 'We reject your bad offer', 'Absolutely not', 'Your terms are ridiculous'], answer: "I'm afraid those terms wouldn't be workable for us", speak: "I'm afraid those terms wouldn't be workable for us" },
  ]},
  { id: 'technology', unit: 12, difficulty: 'C1', title: 'Технологии и AI', subtitle: 'Инновации, данные и риски', icon: 'hardware-chip', color: '#6575E8', xp: 98, exercises: [
    { id: 'te1', type: 'choice', prompt: '“Cutting-edge technology” означает...', options: ['передовая технология', 'опасная технология', 'дешёвая технология', 'устаревшая технология'], answer: 'передовая технология', speak: 'cutting-edge technology' },
    { id: 'te2', type: 'build', prompt: 'Собери: «Алгоритм обучался на больших объёмах данных»', options: ['data', 'of', 'amounts', 'vast', 'on', 'trained', 'was', 'algorithm', 'The'], answer: 'The algorithm was trained on vast amounts of data', speak: 'The algorithm was trained on vast amounts of data' },
    { id: 'te3', type: 'choice', prompt: 'Что такое “data privacy”?', options: ['конфиденциальность данных', 'точность данных', 'хранение файлов', 'скорость сети'], answer: 'конфиденциальность данных', speak: 'data privacy' },
    { id: 'te4', type: 'translate', prompt: 'Переведи: Automation may reshape the labour market', answers: ['автоматизация может изменить рынок труда', 'автоматизация способна преобразовать рынок труда'], answer: 'Автоматизация может изменить рынок труда', speak: 'Automation may reshape the labour market' },
    { id: 'te5', type: 'choice', prompt: '“Ethical implications” — это...', options: ['этические последствия', 'технические требования', 'правовые документы', 'экономические преимущества'], answer: 'этические последствия', speak: 'ethical implications' },
  ]},
  { id: 'academic', unit: 12, difficulty: 'C1', title: 'Академический английский', subtitle: 'Исследования и аргументация', icon: 'library', color: '#8B7CF6', xp: 105, exercises: [
    { id: 'ac1', type: 'choice', prompt: 'Как осторожно сформулировать вывод?', options: ['The findings appear to suggest that...', 'This proves forever that...', 'Obviously, everyone knows...', 'There can be no doubt ever...'], answer: 'The findings appear to suggest that...', speak: 'The findings appear to suggest that' },
    { id: 'ac2', type: 'build', prompt: 'Собери: «Это выходит за рамки данного исследования»', options: ['study', 'this', 'of', 'scope', 'the', 'beyond', 'is', 'This'], answer: 'This is beyond the scope of this study', speak: 'This is beyond the scope of this study' },
    { id: 'ac3', type: 'choice', prompt: '“A significant correlation” означает...', options: ['значимая взаимосвязь', 'случайная ошибка', 'основная причина', 'недостаток данных'], answer: 'значимая взаимосвязь', speak: 'a significant correlation' },
    { id: 'ac4', type: 'translate', prompt: 'Переведи: Further research is needed to validate these results', answers: ['необходимы дальнейшие исследования чтобы подтвердить эти результаты', 'для подтверждения результатов нужны дальнейшие исследования'], answer: 'Необходимы дальнейшие исследования чтобы подтвердить эти результаты', speak: 'Further research is needed to validate these results' },
    { id: 'ac5', type: 'choice', prompt: 'Слово “whereas” используется для...', options: ['противопоставления двух фактов', 'указания причины', 'приведения примера', 'подведения итога'], answer: 'противопоставления двух фактов', speak: 'whereas' },
  ]},
];

export const extraDialogues = [
  { id: 'restaurant_issue', title: 'Проблема в ресторане', emoji: '🍽️', level: 'B1', color: '#FF9F43', intro: 'Блюдо оказалось холодным. Решите проблему вежливо.', steps: [
    { speaker: 'Waiter', line: 'Is everything all right with your meal?', prompt: 'Объясните проблему', options: ['The food is cold. Could you please heat it up?', 'This food is terrible', 'Bring another now'], answer: 'The food is cold. Could you please heat it up?' },
    { speaker: 'Waiter', line: 'I’m very sorry. I’ll replace it immediately.', prompt: 'Уточните время', options: ['Roughly how long will it take?', 'How many minutes exactly?', 'Why are you so slow?'], answer: 'Roughly how long will it take?' },
    { speaker: 'Waiter', line: 'About ten minutes. Dessert will be on the house.', prompt: 'Ответьте', options: ['Thank you, I appreciate that.', 'It should be free anyway.', 'Fine, leave now.'], answer: 'Thank you, I appreciate that.' },
  ]},
  { id: 'doctor_chat', title: 'У врача', emoji: '🩺', level: 'B1', color: '#E85D75', intro: 'Опишите врачу симптомы и уточните лечение.', steps: [
    { speaker: 'Doctor', line: 'What seems to be the problem?', prompt: 'Опишите симптомы', options: ["I've had a headache and a fever since yesterday.", 'My head is bad from yesterday.', 'I am having temperature.'], answer: "I've had a headache and a fever since yesterday." },
    { speaker: 'Doctor', line: 'Are you allergic to any medication?', prompt: 'Ответьте отрицательно', options: ['Not that I know of.', 'I know nothing.', 'No allergy maybe.'], answer: 'Not that I know of.' },
    { speaker: 'Doctor', line: 'Take these tablets twice a day.', prompt: 'Уточните побочные эффекты', options: ['Are there any side effects I should be aware of?', 'Is it dangerous?', 'What bad can happen?'], answer: 'Are there any side effects I should be aware of?' },
  ]},
  { id: 'landlord', title: 'Разговор с арендодателем', emoji: '🏠', level: 'B1+', color: '#2ED3B7', intro: 'В квартире сломалось отопление.', steps: [
    { speaker: 'Landlord', line: 'Hello, is something wrong?', prompt: 'Сообщите проблему', options: ["The heating hasn't been working since last night.", 'Heating is broken yesterday.', 'My flat is cold, fix it.'], answer: "The heating hasn't been working since last night." },
    { speaker: 'Landlord', line: 'I can send someone tomorrow afternoon.', prompt: 'Объясните срочность', options: ["It's quite urgent because the temperature is dropping.", 'Tomorrow is bad.', 'Send now or else.'], answer: "It's quite urgent because the temperature is dropping." },
    { speaker: 'Landlord', line: 'I understand. I’ll arrange a technician this evening.', prompt: 'Подтвердите', options: ['That would be very helpful, thank you.', 'Finally.', 'You must do that.'], answer: 'That would be very helpful, thank you.' },
  ]},
  { id: 'tech_support', title: 'Техническая поддержка', emoji: '🛠️', level: 'B2', color: '#6575E8', intro: 'Сервис не принимает ваш пароль.', steps: [
    { speaker: 'Support', line: 'Could you describe the issue?', prompt: 'Опишите проблему', options: ["I keep getting an error when I try to sign in.", 'Login does not make.', 'Your website is broken.'], answer: "I keep getting an error when I try to sign in." },
    { speaker: 'Support', line: 'Have you tried resetting your password?', prompt: 'Подтвердите и уточните', options: ['Yes, but the reset link has already expired.', 'I tried all things.', 'It did not do.'], answer: 'Yes, but the reset link has already expired.' },
    { speaker: 'Support', line: 'I’ll send you a new secure link.', prompt: 'Поблагодарите', options: ['Perfect. Thanks for sorting that out.', 'Send quickly.', 'Okay, maybe it works.'], answer: 'Perfect. Thanks for sorting that out.' },
  ]},
  { id: 'networking', title: 'Нетворкинг', emoji: '🤝', level: 'B2', color: '#D15BE3', intro: 'Познакомьтесь с человеком на конференции.', steps: [
    { speaker: 'Guest', line: 'Hi, I don’t think we’ve met before.', prompt: 'Представьтесь', options: ["I don't think so either. I'm Alex, I work in product design.", 'No. Alex.', 'We never met, obviously.'], answer: "I don't think so either. I'm Alex, I work in product design." },
    { speaker: 'Guest', line: 'What brings you to the conference?', prompt: 'Расскажите о цели', options: ["I'm here to learn about recent trends and meet people in the field.", 'My company sent me.', 'I just came to look.'], answer: "I'm here to learn about recent trends and meet people in the field." },
    { speaker: 'Guest', line: 'It was great talking to you.', prompt: 'Предложите сохранить контакт', options: ["Likewise. Would you like to connect on LinkedIn?", 'Give me your contact.', 'Okay, goodbye forever.'], answer: "Likewise. Would you like to connect on LinkedIn?" },
  ]},
  { id: 'contract', title: 'Переговоры о контракте', emoji: '📄', level: 'C1', color: '#F0A43C', intro: 'Обсудите цену и сроки крупного контракта.', steps: [
    { speaker: 'Partner', line: 'Your initial price is above our budget.', prompt: 'Предложите условную скидку', options: ['We could offer a discount provided that you commit to a two-year contract.', 'We can make it cheap.', 'Then increase your budget.'], answer: 'We could offer a discount provided that you commit to a two-year contract.' },
    { speaker: 'Partner', line: 'We would need more flexible payment terms.', prompt: 'Уточните предложение', options: ['What kind of arrangement did you have in mind?', 'What do you want now?', 'That is not possible.'], answer: 'What kind of arrangement did you have in mind?' },
    { speaker: 'Partner', line: 'Quarterly payments would work for us.', prompt: 'Закрепите договорённость', options: ['That sounds workable. I’ll have the revised terms drafted.', 'Fine, we accept everything.', 'Maybe we can do it.'], answer: 'That sounds workable. I’ll have the revised terms drafted.' },
  ]},
];

const tenseModuleBase = [
  { id: 'present-simple', name: 'Present Simple', level: 'A1', formula: 'I/you/we/they + V · he/she/it + V-s', use: 'Факты, привычки и регулярные действия', markers: 'usually, often, every day, never', example: 'She works from home twice a week.', exercises: [
    { prompt: 'He usually ___ coffee in the morning.', options: ['drinks', 'is drinking', 'has drunk'], answer: 'drinks', explanation: 'Usually указывает на регулярное действие.' },
    { prompt: 'The shop ___ at nine.', options: ['opens', 'is opening now', 'has opened yesterday'], answer: 'opens', explanation: 'Расписание и постоянный факт — Present Simple.' },
  ]},
  { id: 'present-continuous', name: 'Present Continuous', level: 'A1', formula: 'am/is/are + V-ing', use: 'Действие прямо сейчас или временная ситуация', markers: 'now, at the moment, currently', example: 'I am working on a new project this month.', exercises: [
    { prompt: 'Please be quiet. The baby ___.', options: ['is sleeping', 'sleeps every day', 'has slept'], answer: 'is sleeping', explanation: 'Действие происходит прямо сейчас.' },
    { prompt: 'I ___ with my parents until I find a flat.', options: ['am staying', 'stay always', 'have stayed yesterday'], answer: 'am staying', explanation: 'Временная ситуация вокруг настоящего момента.' },
  ]},
  { id: 'present-perfect', name: 'Present Perfect', level: 'A2', formula: 'have/has + V3', use: 'Опыт, результат сейчас, незавершённый период', markers: 'already, yet, ever, never, just', example: 'I have already finished the report.', exercises: [
    { prompt: '___ you ever ___ to Canada?', options: ['Have / been', 'Did / went', 'Are / being'], answer: 'Have / been', explanation: 'Вопрос об опыте без точного времени.' },
    { prompt: 'She ___ just ___ the office.', options: ['has / left', 'did / leave', 'is / leaving yesterday'], answer: 'has / left', explanation: 'Just часто используется с Present Perfect.' },
  ]},
  { id: 'present-perfect-continuous', name: 'Present Perfect Continuous', level: 'B1', formula: 'have/has been + V-ing', use: 'Действие началось раньше и продолжается или только закончилось', markers: 'for, since, all day, lately', example: 'They have been waiting for two hours.', exercises: [
    { prompt: 'I ___ English since January.', options: ['have been learning', 'am learn', 'learned now'], answer: 'have been learning', explanation: 'Процесс начался раньше и всё ещё продолжается.' },
    { prompt: 'Why are you tired? — I ___.', options: ['have been running', 'run yesterday', 'am run'], answer: 'have been running', explanation: 'Видимый результат недавно завершившегося процесса.' },
  ]},
  { id: 'past-simple', name: 'Past Simple', level: 'A1', formula: 'V2 / V-ed · did not + V', use: 'Завершённое действие в прошлом', markers: 'yesterday, last week, ago, in 2020', example: 'We moved here three years ago.', exercises: [
    { prompt: 'I ___ her at the conference yesterday.', options: ['met', 'have met', 'am meeting'], answer: 'met', explanation: 'Yesterday — законченное время в прошлом.' },
    { prompt: 'Did you ___ the email?', options: ['receive', 'received', 'have received'], answer: 'receive', explanation: 'После did используется начальная форма.' },
  ]},
  { id: 'past-continuous', name: 'Past Continuous', level: 'A2', formula: 'was/were + V-ing', use: 'Процесс в момент прошлого или фон истории', markers: 'at 8 pm, while, when', example: 'I was driving when you called.', exercises: [
    { prompt: 'At ten last night, we ___.', options: ['were sleeping', 'slept every day', 'have slept'], answer: 'were sleeping', explanation: 'Процесс в конкретный момент прошлого.' },
    { prompt: 'While I ___, the lights went out.', options: ['was cooking', 'cooked usually', 'have cooked'], answer: 'was cooking', explanation: 'Длинный процесс прерывается коротким событием.' },
  ]},
  { id: 'past-perfect', name: 'Past Perfect', level: 'B1', formula: 'had + V3', use: 'Одно действие произошло раньше другого в прошлом', markers: 'before, after, by the time, already', example: 'The train had left before we arrived.', exercises: [
    { prompt: 'By the time I arrived, they ___.', options: ['had left', 'left tomorrow', 'have left now'], answer: 'had left', explanation: 'Они ушли раньше другого прошлого события.' },
    { prompt: 'She was tired because she ___ well.', options: ["hadn't slept", "hasn't slept now", "didn't sleeping"], answer: "hadn't slept", explanation: 'Причина предшествовала состоянию в прошлом.' },
  ]},
  { id: 'past-perfect-continuous', name: 'Past Perfect Continuous', level: 'B2', formula: 'had been + V-ing', use: 'Длительный процесс до момента в прошлом', markers: 'for, since, before, when', example: 'He had been working for hours before he took a break.', exercises: [
    { prompt: 'They ___ for an hour when the bus came.', options: ['had been waiting', 'were waited', 'have waited'], answer: 'had been waiting', explanation: 'Подчёркивается длительность до события в прошлом.' },
    { prompt: 'Her eyes were red because she ___.', options: ['had been crying', 'cries', 'has cry'], answer: 'had been crying', explanation: 'Причиной прошлого результата был процесс.' },
  ]},
  { id: 'future-simple', name: 'Future Simple', level: 'A2', formula: 'will + V', use: 'Спонтанное решение, обещание, мнение о будущем', markers: 'tomorrow, probably, I think, one day', example: 'I think it will be a success.', exercises: [
    { prompt: 'The phone is ringing. — I ___ it.', options: ["will answer", "am answer", "answered"], answer: 'will answer', explanation: 'Решение принято в момент речи.' },
    { prompt: 'I promise I ___ you.', options: ["won't forget", "am not forget", "didn't forget tomorrow"], answer: "won't forget", explanation: 'Обещание выражается через will.' },
  ]},
  { id: 'future-continuous', name: 'Future Continuous', level: 'B1', formula: 'will be + V-ing', use: 'Процесс в определённый момент будущего', markers: 'this time tomorrow, at 8 tomorrow', example: 'This time tomorrow, I will be flying to Rome.', exercises: [
    { prompt: 'At nine tomorrow, I ___ a presentation.', options: ['will be giving', 'give yesterday', 'have given now'], answer: 'will be giving', explanation: 'Процесс будет идти в конкретное время будущего.' },
    { prompt: 'Don’t call at six. We ___.', options: ['will be having dinner', 'have dinner yesterday', 'had dinner'], answer: 'will be having dinner', explanation: 'Действие будет происходить в шесть.' },
  ]},
  { id: 'future-perfect', name: 'Future Perfect', level: 'B2', formula: 'will have + V3', use: 'Действие завершится к моменту в будущем', markers: 'by, by the time, before', example: 'By Friday, we will have completed the project.', exercises: [
    { prompt: 'By next year, she ___ her degree.', options: ['will have completed', 'will completing', 'has completed yesterday'], answer: 'will have completed', explanation: 'Результат будет готов к будущему сроку.' },
    { prompt: 'They ___ the bridge by 2030.', options: ['will have built', 'will be build', 'have building'], answer: 'will have built', explanation: 'By 2030 задаёт будущую границу завершения.' },
  ]},
  { id: 'future-perfect-continuous', name: 'Future Perfect Continuous', level: 'C1', formula: 'will have been + V-ing', use: 'Длительность процесса к моменту в будущем', markers: 'for ... by, by the time', example: 'By June, I will have been working here for ten years.', exercises: [
    { prompt: 'By noon, we ___ for six hours.', options: ['will have been driving', 'will drive yesterday', 'have been drive'], answer: 'will have been driving', explanation: 'Подчёркивается длительность к будущему моменту.' },
    { prompt: 'Next month, she ___ the company for a year.', options: ['will have been running', 'will be run', 'has ran'], answer: 'will have been running', explanation: 'Процесс будет длиться год к указанному моменту.' },
  ]},
];

const extraTenseDrills = {
  'present-simple': [
    { prompt: 'My brother ___ in Berlin.', options: ['lives', 'is living every year', 'has live'], answer: 'lives', explanation: 'Постоянное место жительства — Present Simple.' },
    { prompt: 'How often ___ you exercise?', options: ['do', 'are', 'have'], answer: 'do', explanation: 'Вопрос в Present Simple строится с do или does.' },
  ],
  'present-continuous': [
    { prompt: 'Why ___ you ___?', options: ['are / laughing', 'do / laughing', 'have / laugh'], answer: 'are / laughing', explanation: 'Действие происходит в момент речи.' },
    { prompt: 'More people ___ from home these days.', options: ['are working', 'works always', 'have work'], answer: 'are working', explanation: 'Изменяющаяся текущая тенденция — Present Continuous.' },
  ],
  'present-perfect': [
    { prompt: 'We ___ this film three times.', options: ['have seen', 'saw yesterday', 'are seeing now'], answer: 'have seen', explanation: 'Количество опыта к настоящему моменту.' },
    { prompt: 'The train ___ yet.', options: ["hasn't arrived", "didn't arrived", "isn't arrive"], answer: "hasn't arrived", explanation: 'Yet в отрицании часто требует Present Perfect.' },
  ],
  'present-perfect-continuous': [
    { prompt: 'How long ___ you ___ here?', options: ['have / been working', 'are / work', 'did / working'], answer: 'have / been working', explanation: 'Вопрос о длительности процесса до настоящего.' },
    { prompt: 'It ___ all morning.', options: ['has been raining', 'rains yesterday', 'is rain'], answer: 'has been raining', explanation: 'Процесс длился всё утро и связан с настоящим.' },
  ],
  'past-simple': [
    { prompt: 'She ___ the company in 2022.', options: ['joined', 'has joined', 'is joining'], answer: 'joined', explanation: 'In 2022 — завершённый период прошлого.' },
    { prompt: 'We ___ not ___ the answer.', options: ['did / know', 'were / knew', 'have / know'], answer: 'did / know', explanation: 'После did not используется начальная форма.' },
  ],
  'past-continuous': [
    { prompt: 'What ___ you ___ at 8 pm?', options: ['were / doing', 'did / doing', 'have / done'], answer: 'were / doing', explanation: 'Вопрос о процессе в конкретный момент прошлого.' },
    { prompt: 'They ___ when I saw them.', options: ['were arguing', 'argued every day', 'have argued'], answer: 'were arguing', explanation: 'Действие уже шло в момент встречи.' },
  ],
  'past-perfect': [
    { prompt: 'I recognised her because we ___ before.', options: ['had met', 'meet', 'have meet'], answer: 'had met', explanation: 'Встреча произошла раньше другого прошлого события.' },
    { prompt: 'After he ___ the report, he sent it.', options: ['had finished', 'has finished now', 'finishes'], answer: 'had finished', explanation: 'Завершение отчёта предшествовало отправке.' },
  ],
  'past-perfect-continuous': [
    { prompt: 'He was exhausted because he ___ all night.', options: ['had been studying', 'was study', 'has studied now'], answer: 'had been studying', explanation: 'Длительный процесс стал причиной прошлого состояния.' },
    { prompt: 'How long ___ they ___ before they moved?', options: ['had / been dating', 'were / date', 'have / dated'], answer: 'had / been dating', explanation: 'Длительность процесса до события в прошлом.' },
  ],
  'future-simple': [
    { prompt: 'I’m sure you ___ the exam.', options: ['will pass', 'are pass', 'passed tomorrow'], answer: 'will pass', explanation: 'Мнение или уверенность о будущем.' },
    { prompt: 'Don’t worry, I ___ anyone.', options: ["won't tell", "don't tell tomorrow", "am not tell"], answer: "won't tell", explanation: 'Обещание — Future Simple.' },
  ],
  'future-continuous': [
    { prompt: 'This weekend, we ___ by the sea.', options: ['will be relaxing', 'relaxed next week', 'have relax'], answer: 'will be relaxing', explanation: 'Процесс в период будущего.' },
    { prompt: 'Will you ___ the car tonight?', options: ['be using', 'used', 'have use'], answer: 'be using', explanation: 'Вежливый вопрос о планируемом процессе.' },
  ],
  'future-perfect': [
    { prompt: 'By Monday, I ___ all the interviews.', options: ['will have completed', 'will completing', 'completed tomorrow'], answer: 'will have completed', explanation: 'Действие завершится к понедельнику.' },
    { prompt: 'She ___ home before midnight.', options: ['will have returned', 'will returning', 'has return tomorrow'], answer: 'will have returned', explanation: 'Результат будет достигнут до будущей границы.' },
  ],
  'future-perfect-continuous': [
    { prompt: 'By 2030, they ___ together for twenty years.', options: ['will have been working', 'will be work', 'have worked yesterday'], answer: 'will have been working', explanation: 'Длительность процесса к будущему году.' },
    { prompt: 'In May, I ___ here for exactly a decade.', options: ['will have been living', 'will living', 'have live'], answer: 'will have been living', explanation: 'Подчёркивается десятилетняя длительность к маю.' },
  ],
};

export const tenseModules = tenseModuleBase.map((module) => ({
  ...module,
  exercises: [...module.exercises, ...(extraTenseDrills[module.id] || []), ...(moreTenseDrills[module.id] || [])],
})).concat(advancedTimeModules, c1TimeModules);
