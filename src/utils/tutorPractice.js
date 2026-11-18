export function tutorPracticeFor(text) {
  const match = text?.trim().match(/^(?:(?:hi|hello|hey)[,!\s]+)?my name ([a-z][a-z'-]{1,23})[.!]*$/i);
  if (!match || /^(?:is|was|will|can|means|sounds|appears)$/i.test(match[1])) return null;
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
