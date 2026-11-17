import { lessons } from './course.js';
import { courseSupplement, courseConversationTopics } from './courseSupplement.js';
import { journeyNotes } from './journeyNotes.js';
import { getCourseDialogue } from './courseDialogues.js';

export function buildCourseJourney(lesson) {
  const phrases = courseSupplement[lesson.id];
  const [goal, guide, pitfall] = journeyNotes[lesson.id];
  const choices = lesson.exercises.filter(item => item.type === 'choice').slice(0, 3);
  const prefix = `journey-${lesson.id}`;
  const dialogue = getCourseDialogue(lesson.id);
  const level = lesson.difficulty.replace('+', '');
  const cards = phrases.slice(0, 3).map(([english, russian]) => ({ title: english, simple: russian, detail: `${russian}. ${guide}`, example: english, translation: russian }));
  return {
    id: lesson.id, title: lesson.title, level, goal,
    ai: { topicId: lesson.id, level, topic: lesson.title, opening: dialogue[0].line,
      instruction: `Разыграй ситуацию «${courseConversationTopics[lesson.id]}». Цель ученика: ${goal} Задавай один вопрос за ход, реагируй на его содержание. Не отвечай за ученика. Опорные выражения: ${phrases.map(pair => pair[0]).join('; ')}. Помощь давай по просьбе: сначала намёк, затем начало фразы, полный пример — только по отдельной просьбе. Допустимые перефразирования не объявляй ошибками. Не меняй тему без согласия ученика.` },
    stages: [
      { id: 'understand', title: 'Понять', skill: 'grammar', mode: 'choice', intro: goal,
        cards: [{ title: 'Ситуация и смысл', simple: guide, detail: `${guide}\n${pitfall}`, example: phrases[0][0], translation: phrases[0][1] }, { title: 'На что обратить внимание', simple: pitfall, detail: `${pitfall}\nСравни английскую фразу с её переводом. При проверке сохраняй время, отрицание и степень уверенности.`, example: phrases[1][0], translation: phrases[1][1] }],
        exercises: choices.map((item, i) => ({ ...item, id: `${prefix}-understand-${i}` })),
      },
      { id: 'words', title: 'Выражения в контексте', skill: 'vocabulary', mode: 'choice', intro: 'Учи фразу целиком, вместе с её значением и ситуацией.', cards,
        exercises: phrases.slice(0, 3).map(([english, russian], i) => ({ id: `${prefix}-words-${i}`, type: 'choice', prompt: `Какой смысл передаёт «${english}»?`, answer: russian, options: phrases.map(pair => pair[1]), explanation: `В этой ситуации «${english}» значит «${russian}». ${pitfall}` })),
      },
      { id: 'listen', title: 'Услышать', skill: 'listening', mode: 'listen', cards: [], intro: 'Послушай и запиши фразу по-английски. Повторное прослушивание разрешено; текст скрыт до ответа.',
        exercises: phrases.slice(0, 3).map(([english, russian], i) => ({ id: `${prefix}-listen-${i}`, type: 'translate', prompt: 'Прослушай и запиши фразу.', answer: english, speak: english, explanation: `Ты услышал: «${english}». Значение: «${russian}». ${pitfall}` })),
      },
      { id: 'phrases', title: 'Собрать фразу', skill: 'writing', mode: 'build', cards: [], intro: 'Собери английскую фразу. Слова можно убрать и поставить заново; каждое доступное слово используется один раз.',
        exercises: phrases.slice(2, 5).map(([english, russian], i) => ({ id: `${prefix}-phrases-${i}`, type: 'build', prompt: `Скажи: «${russian}».`, answer: english, options: english.split(/\s+/).reverse(), explanation: `${english} — ${russian}. ${guide}` })),
      },
      { id: 'dialogue', title: 'Поговорить', skill: 'conversation', mode: 'input', cards: [], intro: 'Ответь собеседнику по ситуации. Это подготовленный письменный разговор; он не оценивает произношение.',
        exercises: dialogue.map((step, i) => ({ ...step, id: `${prefix}-dialogue-${i}`, type: 'translate', explanation: `В этой реплике нужно передать: «${phrases[['cafe', 'travel'].includes(lesson.id) && i === 1 ? 2 : i][1]}». ${pitfall}` })),
      },
    ],
  };
}

export const otherCourseJourneys = lessons.filter(lesson => lesson.id !== 'greetings').map(buildCourseJourney);
