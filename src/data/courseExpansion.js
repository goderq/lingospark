import { courseSupplement } from './courseSupplement.js';

const cleanWords = (value) => value.replace(/[?.!,]/g, '').split(' ');

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
  return { ...lesson, exercises: [...lesson.exercises, ...bonus] };
});
