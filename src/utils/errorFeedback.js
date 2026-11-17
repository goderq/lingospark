import { evaluateExercise, closestAnswerAnalysis, normalizeAnswer } from './answer.js';

const words = text => normalizeAnswer(text).split(/\s+/).filter(Boolean);
const negation = text => words(text).filter(word => /^(not|no|never|cannot|can't|don't|doesn't|didn't|won't|isn't|aren't|не|нет|никогда|ни)$/.test(word));
const quoted = list => list.slice(0, 4).map(word => `«${word}»`).join(', ');

// Report observable differences. A lexical difference alone does not establish
// the learner's intention, tense, or the grammatical validity of another phrase.
export function errorFeedback(item, selected = '') {
  const input = String(selected).trim();
  if (!input) return { kind: 'empty', title: 'Ответ ещё не выбран', text: 'Сначала попробуй ответить самостоятельно.' };
  const grade = evaluateExercise(item, input);
  if (grade.correct) return { kind: 'accepted', title: 'Ответ принят', text: 'Этот вариант входит в допустимые ответы. Регистр, пунктуация и е/ё не меняют результат.' };
  if (item.optionExplanations?.[input]) return { kind: 'authored', title: 'Почему этот вариант не подходит', text: item.optionExplanations[input] };
  const expected = grade.expected || item.answer;
  if (/[а-яё]/i.test(input) && !/[а-яё]/i.test(expected) || /[a-z]/i.test(input) && !/[a-z]/i.test(expected)) return { kind: 'language', title: 'Нужен другой язык', text: `В этом задании нужен ${/[а-яё]/i.test(expected) ? 'русский' : 'английский'} ответ. Образец: «${expected}».` };
  if (negation(input).length !== negation(expected).length) return { kind: 'negation', title: 'Проверь отрицание', text: `В твоём ответе и образце различается отрицание. «${input}» и «${expected}» могут передавать противоположный смысл. Сохрани утверждение или отрицание исходного задания.` };
  const analysis = grade.analysis || closestAnswerAnalysis(input, grade.accepted);
  if (analysis.sameWords) return { kind: 'order', title: 'Те же слова — другие связи', text: `Все слова на месте. Сравни их связи и порядок: «${input}» → «${expected}». Перенос отрицания или предлога тоже может изменить смысл.` };
  if (analysis.missing.length && !analysis.extra.length) return { kind: 'missing', title: 'Есть пропущенный элемент', text: `По сравнению с ближайшим допустимым ответом не хватает ${quoted(analysis.missing)}. Полная фраза: «${expected}».` };
  if (analysis.extra.length && !analysis.missing.length) return { kind: 'extra', title: 'Есть дополнительный элемент', text: `В допустимом образце нет ${quoted(analysis.extra)}. Сравни с полной фразой «${expected}»; не добавляй смысл, которого нет в задании.` };
  return { kind: 'compare', title: 'Сравни две формулировки', text: `Твой ответ: «${input}». Допустимый образец: «${expected}».${analysis.extra.length ? ` Отличается: ${quoted(analysis.extra)} → ${quoted(analysis.missing)}.` : ''} ${item.explanation || 'Проверь, передаётся ли именно смысл исходного задания. Этот разбор не доказывает, что твоя фраза неверна в любой другой ситуации.'}` };
}
