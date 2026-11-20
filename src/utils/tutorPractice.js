function namePractice(text) {
  const match = text?.trim().match(/^(?:(?:hi|hello|hey)[,!\s]+)?my name ([a-z][a-z'-]{1,23})[.!]*$/i);
  if (!match || /^(?:is|was|will|can|exists|changes|changed|matters|means|sounds|appears|works|fits|helps|varies|differs|stays)$/i.test(match[1])) return null;
  const name = match[1].toLowerCase() === 'nina' ? 'Alex' : 'Nina';
  const english = 'My name is ' + name + '.';
  return {
    explanation: 'После My name поставь is, затем назови имя.',
    exercise: {
      prompt: name === 'Nina' ? 'Ты впервые на языковой встрече. Представься как Нина.' : 'Представься новому соседу. Тебя зовут Алекс.',
      options: [english, 'My name ' + name + '.', 'My name am ' + name + '.'],
      answer: english,
      explanation: 'После My name нужна форма is. Am употребляется с I.',
    },
    construction: 'name',
  };
}

const targetedPractice = [
  {
    pattern: /^i (?:don'?t|do not) now (?:the |what\b|where\b|why\b|how\b|if\b|whether\b|him\b|her\b)/i,
    construction: 'knowNotNow',
    explanation: 'Know значит «знать», а now — «сейчас». Чтобы сказать «не знаю», используй don’t know.',
    exercise: {
      prompt: 'Выбери, как сказать «Я не знаю его номера телефона».',
      options: ["I don’t know his phone number.", "I don’t now his phone number.", "I don’t knew his phone number."],
      answer: "I don’t know his phone number.",
    },
  },
  {
    pattern: /^did (?:you|we|they|he|she) (?:went|saw|ate|bought|met|made|took|had|got|came)\b/i,
    construction: 'pastQuestion',
    explanation: 'Did уже показывает прошедшее время. После подлежащего нужна начальная форма глагола, например go вместо went.',
    exercise: {
      prompt: 'Спроси, купил ли собеседник билет вчера.',
      options: ['Did you buy a ticket yesterday?', 'Did you bought a ticket yesterday?', 'Do you bought a ticket yesterday?'],
      answer: 'Did you buy a ticket yesterday?',
    },
  },
  {
    pattern: /^(?:i|you|we|they|he|she) (?:didn'?t|did not) (?:went|saw|ate|bought|met|made|took|had|got|came)\b/i,
    construction: 'pastNegative',
    explanation: 'После didn’t глагол ставится в начальную форму. Прошедшее время уже выражено через did.',
    exercise: {
      prompt: 'Выбери, как сказать «Она не видела этот фильм».',
      options: ['She didn’t see this film.', 'She didn’t saw this film.', 'She don’t saw this film.'],
      answer: 'She didn’t see this film.',
    },
  },
];

const normal = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
const practiceWithOriginal = (practice, original) => practice && { ...practice, original };

export function tutorPracticeFor(text) {
  const original = text?.trim();
  if (!original || original.length > 220 || /[«»"“”]|^\s*(?:is|why|how|what|translate|repeat|correct|explain)\b/i.test(original)) return null;
  const rule = targetedPractice.find(item => item.pattern.test(original.replace(/[’‘]/g, "'")));
  if (!rule) return practiceWithOriginal(namePractice(original), original);
  const key = normal(original);
  if (rule.exercise.options.some(option => normal(option) === key)) {
    const variant = alternativePractice[rule.construction];
    return practiceWithOriginal({ construction: rule.construction, explanation: rule.explanation, exercise: { ...variant, explanation: rule.explanation } }, original);
  }
  const { construction, explanation, exercise } = rule;
  return practiceWithOriginal({ construction, explanation, exercise: { ...exercise, explanation } }, original);
}

const alternativePractice = {
  knowNotNow: {
    prompt: 'Выбери, как сказать «Я не знаю адреса».',
    options: ['I don’t know the address.', 'I don’t now the address.', 'I don’t knew the address.'],
    answer: 'I don’t know the address.',
  },
  pastQuestion: {
    prompt: 'Спроси, видел ли собеседник Сэма утром.',
    options: ['Did you see Sam this morning?', 'Did you saw Sam this morning?', 'Do you saw Sam this morning?'],
    answer: 'Did you see Sam this morning?',
  },
  pastNegative: {
    prompt: 'Выбери, как сказать «Мы не встретились вчера».',
    options: ['We didn’t meet yesterday.', 'We didn’t met yesterday.', 'We don’t met yesterday.'],
    answer: 'We didn’t meet yesterday.',
  },
};

export function tutorPracticeFromMessages(messages) {
  const recent = messages.filter(item => item.kind !== 'command' && item.action !== 'translate' && item.content?.trim()).slice(-12);
  for (let index = recent.length - 1; index >= 0; index--) {
    const message = recent[index];
    if (message.role !== 'user') continue;
    const practice = tutorPracticeFor(message.content);
    if (practice) return practice;
    const previous = recent[index - 1];
    const question = previous?.role === 'assistant' && previous.content.match(/[^.!?\n]*\?/g)?.at(-1)?.trim();
    if (/^i (?:don['’]?t|do not) now[.!]*$/i.test(message.content.trim()) && /^(?:what|where|when|who|why|how|do you know)\b/i.test(question || '')) {
      return practiceWithOriginal(tutorPracticeFor("I don't now the answer."), message.content.trim());
    }
  }
  return null;
}
