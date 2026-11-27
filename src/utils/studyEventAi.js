import { normalizeAnswer } from './answer.js';
import { groupTopics } from './groupStudy.js';

export const eventAiLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const formats = ['mixed', 'listening', 'dialogue', 'phrases'];
const providedText = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const invalid = () => new Error('ИИ вернул неполный или некорректный вариант. Попробуй ещё раз с более конкретным запросом.');
const objectSchema = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const textSchema = { type: 'string' };
const daySchema = objectSchema({ topic: { type: 'integer' }, format: { type: 'integer' } });
const questionSchema = objectSchema({ prompt: textSchema, options: { type: 'array', items: textSchema, minItems: 3, maxItems: 3 },
  answer: { type: 'integer' }, explanation: textSchema });

export function eventPlanRequest({ brief, level, count, exclude, previous }) {
  if (!providedText(brief, 3, 400) || !eventAiLevels.includes(level) || !Number.isInteger(count) || count < 1 || count > 14) throw invalid();
  const isDay = !!exclude;
  const candidates = groupTopics.filter(topic => topic.level === level || topic.id === exclude?.topic);
  const allowRepeats = count > candidates.length * formats.length;
  const days = { type: 'array', items: daySchema, minItems: count, maxItems: count };
  const schema = objectSchema(isDay ? { days } : { name: textSchema, description: textSchema, days });
  const messages = [
    { role: 'system', content: `Ты методист курса английского. Составь расписание по запросу администратора, используя только номера тем из каталога. Верни JSON. Поля topic и format — целые числа. Форматы: 0 смешанный, 1 аудирование, 2 диалог, 3 сборка фраз. Чередуй форматы по смыслу. ${allowRepeats ? 'Можно повторять пары темы и формата, распределяй их по расписанию.' : 'Не повторяй пару темы и формата.'} Название на русском до 60 знаков, описание до 180.` },
    { role: 'user', content: `Запрос: ${JSON.stringify(brief.trim())}\nУровень ${level}. Дней: ${count}.\nКаталог:\n${candidates.map(({ title }, index) => `${index}: ${title}`).join('\n')}${isDay ? `\nПредложи другой вариант для дня ${exclude.index + 1}. Исключи тему ${candidates.findIndex(item => item.id === exclude.topic)} в формате ${formats.indexOf(exclude.format)}.${previous ? ` План сейчас: ${previous}.` : ''}` : ''}` },
  ];
  return { schema, messages, limit: isDay ? 72 : 420, parse: value => {
    if (!Array.isArray(value?.days) || value.days.length !== count) throw invalid();
    const used = new Set();
    const plan = value.days.map(day => {
      const topic = Number.isInteger(day?.topic) && candidates[day.topic]?.id;
      const format = Number.isInteger(day?.format) && formats[day.format];
      if (!topic || !format || (topic === exclude?.topic && format === exclude.format)) throw invalid();
      const key = `${topic}:${format}`;
      if (!allowRepeats && used.has(key)) throw invalid();
      used.add(key);
      return { topic, format };
    });
    if (isDay) return plan[0];
    if (!providedText(value.name, 2, 80) || !providedText(value.description, 2, 280)) throw invalid();
    return { name: value.name.trim(), description: value.description.trim(), days: plan };
  } };
}

export function validEventExercise(item) {
  return providedText(item?.prompt, 5, 220) && (/[а-яё]/i.test(item.prompt) || item.prompt.includes('___'))
    && providedText(item.explanation, 5, 240) && /[а-яё]/i.test(item.explanation)
    && Array.isArray(item.options) && item.options.length === 3
    && item.options.every(option => providedText(option, 1, 120) && /[a-z]/i.test(option) && !/[а-яё]/i.test(option))
    && new Set(item.options.map(normalizeAnswer)).size === 3
    && Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 3;
}

export function validEventExercisePair(pair) {
  if (!validEventExercise(pair?.question) || !validEventExercise(pair.review)) return false;
  const answer = normalizeAnswer(pair.question.options[pair.question.answer]);
  return normalizeAnswer(pair.question.prompt) !== normalizeAnswer(pair.review.prompt)
    && (!answer.includes(' ') || answer !== normalizeAnswer(pair.review.options[pair.review.answer]));
}

export function eventExerciseRequest(topic, brief = '') {
  const selected = groupTopics.find(item => item.id === topic);
  if (!selected) throw invalid();
  return {
    schema: objectSchema({ question: questionSchema, review: questionSchema }), limit: 650,
    messages: [
      { role: 'system', content: 'Создай два коротких задания по английскому для одной и той же конструкции. question — основное. review — новая ситуация, другая фраза, то же правило. prompt: инструкция на русском или английская фраза с пропуском ___ без ответа. options: ровно три разных английских варианта, только один правильный. answer: номер правильного варианта от 0 до 2. explanation: короткое объяснение на русском. Верни только JSON.' },
      { role: 'user', content: `Тема «${selected.title}», уровень ${selected.level}. ${brief.trim() ? `Пожелание: ${JSON.stringify(brief.trim().slice(0, 400))}.` : ''}` },
    ],
    parse: value => {
      if (!validEventExercisePair(value)) throw invalid();
      const clean = ({ prompt, options, answer, explanation }) => ({ prompt: prompt.trim(), options: options.map(item => item.trim()), answer, explanation: explanation.trim() });
      return { question: clean(value.question), review: clean(value.review), approved: false };
    },
  };
}

export function parseEventAiOutput(request, raw) {
  let value;
  try { value = JSON.parse((raw || '').trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')); }
  catch { throw invalid(); }
  return request.parse(value);
}
