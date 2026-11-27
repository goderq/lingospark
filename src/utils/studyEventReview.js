import { constructionReviews } from '../data/constructionPractice.js';
import { courseSupplement } from '../data/courseSupplement.js';
import { eventReviewPhrases } from '../data/eventReviewPhrases.js';
import { constructionForExercise, findReinforcement } from '../data/reinforcement.js';
import { normalizeAnswer } from './answer.js';
import { eventDayDeck } from './studyEvents.js';

const skillNames = {
  grammar: 'Грамматика', vocabulary: 'Слова и выражения', listening: 'Аудирование',
  writing: 'Сборка фраз', conversation: 'Диалог',
};

const greetingLinks = {
  'j-understand-1': 'g1',
  'j-dialogue-1': 'j-understand-2', 'j-dialogue-2': 'j-phrases-3', 'j-dialogue-3': 'j-understand-3',
  'j-phrases-1': 'g3', 'j-phrases-2': 'mega-greetings-2',
};

const greetingAudio = {
  'j-listen-1': [['Hi, Emma!', 'Привет, Эмма!'], ['Hello, Alex!', 'Привет, Алекс!'], ['Good morning, David!', 'Доброе утро, Дэвид!']],
  'j-listen-2': [['My name is Nina.', 'Меня зовут Нина.'], ["I'm David.", 'Я Дэвид.'], ['My name is Sara.', 'Меня зовут Сара.']],
  'j-listen-3': [['Nice to meet you, Kate.', 'Приятно познакомиться, Кейт.'], ['Good to meet you.', 'Рад познакомиться.'], ['Pleased to meet you.', 'Приятно познакомиться.']],
};

const extraPastGo = {
  type: 'choice', prompt: 'After the lesson, Emma ___ home.', answer: 'went', options: ['go', 'went', 'gone'],
  explanation: 'В утвердительном предложении в Past Simple у go форма went.',
};

const afternoonGreeting = {
  type: 'choice', prompt: 'Сейчас три часа дня. Ты впервые встретил коллегу. Как поздороваться?',
  answer: 'Good afternoon!', options: ['Good night!', 'Good afternoon!', 'Goodbye!'],
  explanation: 'Good afternoon — приветствие после полудня. Goodbye и Good night здесь звучат как прощание.',
};

function reviewVariants(item, topic) {
  if (item.reviewVariant) return [item.reviewVariant];
  const topicPhrases = courseSupplement[topic] || [];
  const phrase = topicPhrases.find(([english, russian]) => english === item.answer || russian === item.answer)?.[0];
  const linkedPhrases = eventReviewPhrases[phrase] || [];
  if (item.skill === 'listening') {
    const phrases = greetingAudio[item.id] || [...linkedPhrases, ...topicPhrases];
    return phrases.map(([answer, translation]) => ({ type: 'translate', prompt: 'Послушай и запиши английскую фразу.',
      answer, speak: answer, explanation: `${answer} — ${translation}` }));
  }

  const linked = greetingLinks[item.id] ? { ...item, sourceExerciseId: greetingLinks[item.id] } : item;
  const construction = constructionForExercise(linked);
  const dialogue = constructionReviews[construction];
  const options = [findReinforcement(linked), findReinforcement(linked, { practiceVariant: 1 }), dialogue];
  if (item.id === 'j-understand-1') options.push(afternoonGreeting);
  if (construction === 'pastGo') options.push(extraPastGo);
  for (const [english, russian] of linkedPhrases) {
    const explanation = `${english} — ${russian}.`;
    options.push(item.skill === 'vocabulary' ? { type: 'choice', prompt: `Что означает «${english}»?`, answer: russian,
      options: linkedPhrases.map(([, translation]) => translation), explanation }
      : { type: 'translate', prompt: `Скажи по-английски: «${russian}»`, answer: english, explanation });
  }
  return options.filter(Boolean).map(variant => {
    if (item.type !== 'build') return variant;
    return { ...variant, type: 'build', options: variant.answer.split(/\s+/).reverse() };
  });
}

function exerciseKey(item) {
  const answer = normalizeAnswer(item.answer);
  const prompt = item.skill === 'listening' || (answer.includes(' ') && !item.prompt?.includes('___')) ? '' : normalizeAnswer(item.prompt);
  return JSON.stringify([prompt, answer]);
}

export function eventPersonalResult(event, result) {
  const days = event.topics.map((_, index) => {
    const completed = result?.days?.[index] === true;
    const answers = completed ? Object.entries(result.answers?.[index] || {}).filter(([, grade]) => typeof grade === 'boolean') : [];
    return { completed, total: answers.length, correct: answers.filter(([, grade]) => grade).length, answers };
  });
  if (!days.some(day => day.total)) return { days, focus: null, deck: [] };

  const original = event.topics.map((_, index) => eventDayDeck(event, index));
  const used = new Set(original.flat().map(exerciseKey));
  const missedSkills = {};
  const groups = [];
  for (const [day, { answers }] of days.entries()) {
    const items = new Map(original[day].map(item => [item.id, item]));
    for (const [id, correct] of answers) {
      const item = items.get(id);
      if (correct || !item) continue;
      missedSkills[item.skill] = (missedSkills[item.skill] || 0) + 1;
      groups.push(reviewVariants(item, event.topics[day]).map((variant, index) => ({ ...variant,
        id: `event-review-${id}-${index}`, skill: item.skill, topic: item.topic, reason: `День ${day + 1}` })));
    }
  }

  // Interleave mistakes so a single missed question cannot take every slot.
  const deck = [];
  for (let index = 0; deck.length < 5 && groups.some(group => index < group.length); index += 1) {
    for (const group of groups) {
      const item = group[index];
      if (!item) continue;
      const key = exerciseKey(item);
      if (used.has(key)) continue;
      used.add(key);
      deck.push(item);
      if (deck.length === 5) break;
    }
  }
  const [skill] = Object.keys(missedSkills).sort((a, b) => missedSkills[b] - missedSkills[a]);
  return { days, focus: skillNames[skill] || null, deck };
}
