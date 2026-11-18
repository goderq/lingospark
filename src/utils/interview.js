export const interviewSteps = [
  {
    id: 'intro',
    goal: 'Коротко расскажи о себе и своих навыках.',
    question: 'Could you tell me a little about yourself and your skills?',
    hint: 'Начни с I have experience in… или My background is in…',
    matches: /\b(?:i (?:work|worked|study|studied|have|am|can|know|used to|speciali[sz]e)|i['’]m|i['’]ve|my (?:name|background|skills?|experience))\b/i,
    exercise: {
      prompt: 'Как сказать «У меня есть опыт работы с клиентами»?',
      options: ['I have experience working with customers.', 'I am experience working with customers.', 'I have worked with customers tomorrow.'],
      answer: 'I have experience working with customers.',
      explanation: 'После I have experience можно использовать форму с -ing, чтобы описать, что ты умеешь делать.',
    },
  },
  {
    id: 'example',
    goal: 'Приведи пример задачи, с которой ты справился.',
    question: 'Can you give me an example of a problem you solved?',
    hint: 'Опиши одно действие в прошлом: Last year, I…',
    matches: /\b(?:last (?:year|month|week)|once|yesterday|ago|i (?:helped|solved|worked|managed|created|built|fixed|improved|led|organized|delivered|learned|handled|found|made|had|was|supported|reduced|increased))\b/i,
    exercise: {
      prompt: 'Как сказать «В прошлом году я помог клиенту решить проблему»?',
      options: ['Last year, I helped a customer solve a problem.', 'Last year, I help a customer solve a problem.', 'Last year, I will help a customer solve a problem.'],
      answer: 'Last year, I helped a customer solve a problem.',
      explanation: 'Last year обозначает закончившийся период. Для завершённого действия здесь нужен Past Simple: helped.',
    },
  },
  {
    id: 'question',
    goal: 'Задай работодателю вопрос о вакансии или команде.',
    question: 'What would you like to know about the role or the team?',
    hint: 'Спроси о команде, графике или задачах: Could you tell me about…?',
    matches: /^(?:and\s+)?(?:what|when|where|who|how|which|would|can|could|do|does|is|are|will|may)\b[^\n]*\b(?:team|role|position|job|hours|schedule|day|office|work|salary|training|responsibilities|tasks?|remote|onboarding|benefits|company|manager|start|week|pay|interview)\b/i,
    exercise: {
      prompt: 'Как вежливо спросить «Расскажите, пожалуйста, о команде»?',
      options: ['Could you tell me about the team?', 'Could you to tell me about the team?', 'Could me tell you about the team?'],
      answer: 'Could you tell me about the team?',
      explanation: 'В вежливой просьбе Could you…? после you идёт глагол без to.',
    },
  },
];

const grammarExamples = [
  {
    stepId: 'intro',
    pattern: /^i am have experience\b/i,
    correction: 'I have experience',
    explanation: 'Опыт выражается глаголом have. Am перед have здесь лишнее.',
  },
  {
    stepId: 'question',
    pattern: /^could you to tell me\b/i,
    correction: 'Could you tell me',
    explanation: 'После could + подлежащее глагол ставится без to.',
  },
];

function detectedError(text, stepId) {
  const rule = grammarExamples.find(item => item.stepId === stepId && item.pattern.test(text));
  return rule ? { original: text, corrected: text.replace(rule.pattern, rule.correction), explanation: rule.explanation } : null;
}

export function interviewProgress(messages) {
  const completed = [];
  const attempts = [];
  for (const message of messages) {
    const step = interviewSteps[completed.length];
    if (!step || message.role !== 'user' || message.kind === 'command' || message.interviewStepId !== step.id) continue;
    const text = String(message.content || '').trim();
    const error = detectedError(text, step.id);
    const attempt = { id: message.id, step, text, error, confirmed: message.interviewConfirmed === true };
    attempts.push(attempt);
    const clarification = /^(?:what do you mean|could you repeat|can you repeat|i do not understand|i don['’]t understand|i am not sure|i['’]m not sure)\b/i.test(text);
    if (attempt.confirmed || (!clarification && text.split(/\s+/).length >= 4 && step.matches.test(text))) {
      completed.push(attempt);
    }
  }
  return { completed, attempts, next: interviewSteps[completed.length] || null };
}

export function interviewReview(messages) {
  const { completed, attempts, next } = interviewProgress(messages);
  const mistake = [...attempts].reverse().find(item => item.error);
  const strength = completed.find(item => !item.error && /\b(?:i have experience|i worked|i helped|i solved|could you tell me)\b/i.test(item.text));
  const practiceStep = mistake?.step || next || completed.at(-1)?.step;
  return { completed, mistake: mistake?.error, strength, exercise: practiceStep?.exercise };
}

export function interviewContext(before, after) {
  const advanced = after.completed.length > before.completed.length;
  return [
    'INTERVIEW ROLEPLAY: You are interviewing a candidate. The app displays one prepared question at a time.',
    advanced
      ? 'React to a concrete detail in the candidate’s last answer. If they asked a job question, answer it in character using fictional details. Do not ask another question because the app shows the next prompt or ends the interview.'
      : `Help the candidate answer the current question: "${before.next?.question || interviewSteps[0].question}". If they ask what you mean, rephrase it. Do not give a complete answer for them or move to another interview topic.`,
    'Keep it to one or two short sentences. Avoid grades or hiring promises.',
  ].join(' ');
}
