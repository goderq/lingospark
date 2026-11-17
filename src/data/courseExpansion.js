import { courseSupplement } from './courseSupplement.js';
import { courseChoiceNotes } from './courseChoiceNotes.js';

const cleanWords = (value) => value.replace(/[?.!,]/g, '').split(' ');

const explanationFor = (exercise, lesson) => {
  if (exercise.explanation) return exercise.explanation;
  const hint = exercise.hint ? `${exercise.hint.replace(/[.!?]+$/, '')}. ` : '';
  const pair = courseSupplement[lesson.id].find(entry => entry.includes(exercise.answer));
  if (pair) return `${hint}В ситуации «${lesson.title}» выражение «${pair[0]}» означает «${pair[1]}». Сопоставь именно эту пару с исходным вопросом: у остальных фраз другое содержание.`;
  if (courseChoiceNotes[exercise.id]) return `${hint}${Object.values(courseChoiceNotes[exercise.id])[0]} Допустимый ответ: «${exercise.answer}».`;
  if (exercise.type === 'translate') {
    return `${hint}В теме «${lesson.title}» перевод должен сохранить смысл, время и тон исходной фразы. Естественный вариант здесь — «${exercise.answer}»; добавлять ответ на втором языке не нужно.`;
  }
  if (exercise.type === 'build') {
    return `${hint}Фраза собирается вокруг основы «${exercise.answer}». Сначала определи подлежащее и глагольную группу, затем присоедини дополнения в естественном английском порядке.`;
  }
  if (exercise.prompt.includes('___')) {
    return `${hint}После подстановки «${exercise.answer}» предложение становится грамматически и смыслово завершённым. Слова по обе стороны пропуска определяют именно эту форму или устойчивое сочетание.`;
  }
  if (/[а-яё]/i.test(exercise.answer)) {
    return `${hint}В контексте вопроса выражение передаёт значение «${exercise.answer}». Остальные варианты описывают другую ситуацию или искажают важную часть смысла.`;
  }
  return `${hint}Для ситуации из темы «${lesson.title}» естественно звучит «${exercise.answer}»: этот вариант одновременно подходит по значению, форме и стилю.`;
};

const optionExplanationsFor = (exercise, lesson) => Object.fromEntries(
  (exercise.options || [])
    .filter((option) => option !== exercise.answer)
    .map((option) => [
      option,
      courseChoiceNotes[exercise.id]?.[option] ? `${courseChoiceNotes[exercise.id][option]} Допустимый ответ: «${exercise.answer}».` : phraseContrast(exercise, option, courseSupplement[lesson.id]),
    ]),
);

function phraseContrast(exercise, option, phrases) {
  const optionPair = phrases.find(pair => pair.includes(option));
  const targetPair = phrases.find(pair => pair.includes(exercise.answer));
  if (optionPair && targetPair) return `«${optionPair[0]}» означает «${optionPair[1]}». Задание требует другой смысл: «${targetPair[0]}» — «${targetPair[1]}».`;
  if (exercise.prompt.includes('___')) return `Сравни подстановки в одно предложение: «${exercise.prompt.replace(/___/g, option)}» и «${exercise.prompt.replace(/___/g, exercise.answer)}». ${exercise.hint || 'Сохрани форму из условия задания.'}`;
  return `Выбрано «${option}»; допустимый ответ в этом задании — «${exercise.answer}». ${exercise.hint ? `Опора из условия: ${exercise.hint}.` : 'Сопоставь обе фразы с намерением в вопросе.'} Без дополнительного контекста этот разбор не утверждает, что выбранная фраза неверна во всех ситуациях.`;
}

export const enrichLessons = (lessons) => lessons.map((lesson) => {
  const phrases = courseSupplement[lesson.id];
  if (!phrases || phrases.length !== 5) {
    throw new Error(`Course ${lesson.id} must have exactly five unique supplemental phrases`);
  }
  const [[english0, russian0], [english1, russian1], [english2, russian2],
    [english3, russian3], [english4, russian4]] = phrases;
  const words = cleanWords(english2);
  const prefix = `mega-${lesson.id}`;
  const bonus = [
    { id: `${prefix}-1`, type: 'choice', prompt: `Переведи: “${english0}”`, hint: `Уровень ${lesson.difficulty}`, options: [russian0, russian1, russian2, russian4], answer: russian0, speak: english0 },
    { id: `${prefix}-2`, type: 'choice', prompt: `Как сказать: «${russian1}»?`, hint: 'Выбери точную английскую фразу', options: [english1, english0, english3, english4], answer: english1, speak: english1 },
    { id: `${prefix}-3`, type: 'build', prompt: `Собери фразу: «${russian2}»`, hint: 'Используй все слова один раз', options: [...words].reverse(), answer: words.join(' '), speak: english2 },
    { id: `${prefix}-4`, type: 'translate', prompt: `Напиши перевод: ${english3}`, hint: 'Пиши только по-русски, без английского варианта', answers: [russian3.toLowerCase()], answer: russian3, speak: english3 },
    { id: `${prefix}-5`, type: 'choice', prompt: `Как естественно сказать: «${russian4}»?`, hint: `Закрепление темы «${lesson.title}»`, options: [english4, english2, english0, english3], answer: english4, speak: english4 },
  ];
  const exercises = [...lesson.exercises, ...bonus].map((exercise) => ({
    ...exercise,
    explanation: explanationFor(exercise, lesson),
    optionExplanations: optionExplanationsFor(exercise, lesson),
  }));
  return { ...lesson, exercises };
});
