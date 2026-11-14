import { courseSupplement } from './courseSupplement.js';

const cleanWords = (value) => value.replace(/[?.!,]/g, '').split(' ');

const explanationFor = (exercise, lesson) => {
  if (exercise.explanation) return exercise.explanation;
  const hint = exercise.hint ? `${exercise.hint.replace(/[.!?]+$/, '')}. ` : '';
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

const optionExplanationsFor = (exercise) => Object.fromEntries(
  (exercise.options || [])
    .filter((option) => option !== exercise.answer)
    .map((option) => [
      option,
      exercise.prompt.includes('___')
        ? `При подстановке «${option}» нарушается форма или устойчивое управление в данном предложении. В этом окружении требуется «${exercise.answer}».`
        : `«${option}» передаёт другой смысл или звучит неестественно в указанной ситуации. Точный ответ — «${exercise.answer}».`,
    ]),
);

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
    optionExplanations: optionExplanationsFor(exercise),
  }));
  return { ...lesson, exercises };
});
