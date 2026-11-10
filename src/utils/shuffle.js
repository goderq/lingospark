const hashSeed = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const shuffleOptions = (options, seed = '') => {
  const result = [...options];
  let state = hashSeed(`${seed}|${options.join('|')}`) || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

export const balancedOptions = (options, answer, questionIndex = 0, sessionSeed = 0) => {
  if (!options.includes(answer) || options.length < 2) return shuffleOptions(options, `${sessionSeed}-${questionIndex}`);
  const size = options.length;
  const cycleNumber = Math.floor(questionIndex / size);
  let previousLast = -1;
  let positions = [];
  for (let cycle = 0; cycle <= cycleNumber; cycle += 1) {
    positions = shuffleOptions(Array.from({ length: size }, (_, index) => index), `${sessionSeed}-positions-${cycle}`);
    if (positions[0] === previousLast) [positions[0], positions[1]] = [positions[1], positions[0]];
    previousLast = positions[size - 1];
  }
  const answerPosition = positions[questionIndex % size];
  const wrongAnswers = shuffleOptions(options.filter((option) => option !== answer), `${sessionSeed}-wrong-${questionIndex}`);
  wrongAnswers.splice(answerPosition, 0, answer);
  return wrongAnswers;
};
