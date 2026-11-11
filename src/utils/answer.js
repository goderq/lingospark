export const normalizeAnswer = (value = '') => `${value}`
  .toLocaleLowerCase('ru')
  .replace(/ё/g, 'е')
  .replace(/[.,!?;:«»"'()[\]{}]/g, '')
  .replace(/[–—]/g, '-')
  .trim()
  .replace(/\s+/g, ' ');

const tokens = (value) => normalizeAnswer(value).split(' ').filter(Boolean);
const isRussian = (value) => /[а-яё]/i.test(value);
const hasLatin = (value) => /[a-z]/i.test(value);
const hasCyrillic = (value) => /[а-яё]/i.test(value);

// A translation must stay in the language requested by the exercise. This
// prevents bilingual strings such as "I agree — я согласен" from being
// accepted, even if one half matches an allowed variant exactly.
export const answerUsesExpectedScript = (actual, expected) => {
  const actualHasLatin = hasLatin(actual);
  const actualHasCyrillic = hasCyrillic(actual);
  const expectedHasLatin = hasLatin(expected);
  const expectedHasCyrillic = hasCyrillic(expected);
  if (expectedHasLatin && !expectedHasCyrillic) {
    return actualHasLatin && !actualHasCyrillic;
  }
  if (expectedHasCyrillic && !expectedHasLatin) {
    return actualHasCyrillic && !actualHasLatin;
  }
  return true;
};
const NEGATIONS = new Set(['не', 'ни', 'нет', 'никогда', 'нельзя', 'без']);
const PREPOSITIONS = new Set([
  'в', 'во', 'на', 'к', 'ко', 'с', 'со', 'из', 'от', 'до', 'для', 'о', 'об',
  'обо', 'по', 'под', 'над', 'перед', 'при', 'через', 'между', 'у', 'за',
]);

const wordDifference = (source, target) => {
  const remaining = tokens(target);
  tokens(source).forEach((word) => {
    const index = remaining.indexOf(word);
    if (index >= 0) remaining.splice(index, 1);
  });
  return remaining;
};

const sameBag = (left, right) =>
  [...tokens(left)].sort().join(' ') === [...tokens(right)].sort().join(' ');

const lcsLength = (left, right) => {
  const row = Array(right.length + 1).fill(0);
  left.forEach((word) => {
    let diagonal = 0;
    right.forEach((candidate, index) => {
      const previous = row[index + 1];
      row[index + 1] = word === candidate
        ? diagonal + 1
        : Math.max(row[index + 1], row[index]);
      diagonal = previous;
    });
  });
  return row[right.length];
};

const hasSameCriticalWords = (left, right) => {
  const select = (list, set) => list.filter((word) => set.has(word)).sort().join(' ');
  return select(left, NEGATIONS) === select(right, NEGATIONS);
};

const keepsPrepositionLinks = (actual, expected) => {
  const expectedLinks = expected
    .map((word, index) => PREPOSITIONS.has(word) && expected[index + 1]
      ? `${word} ${expected[index + 1]}`
      : null)
    .filter(Boolean);
  const actualLinks = new Set(actual.map((word, index) => `${word} ${actual[index + 1] || ''}`));
  return expectedLinks.every((link) => actualLinks.has(link));
};

const flexibleRussianOrder = (actual, expected) => {
  const actualWords = tokens(actual);
  const expectedWords = tokens(expected);
  if (!sameBag(actual, expected)) return false;
  if (!hasSameCriticalWords(actualWords, expectedWords)) return false;
  if (!keepsPrepositionLinks(actualWords, expectedWords)) return false;
  const orderedShare = lcsLength(actualWords, expectedWords) / Math.max(1, expectedWords.length);
  return orderedShare >= 0.6;
};

export const answersMatch = (actual, expected) => {
  const normalizedActual = normalizeAnswer(actual);
  const normalizedExpected = normalizeAnswer(expected);
  if (!answerUsesExpectedScript(normalizedActual, normalizedExpected)) return false;
  if (normalizedActual === normalizedExpected) return true;
  if (isRussian(normalizedActual) && isRussian(normalizedExpected)) {
    return flexibleRussianOrder(normalizedActual, normalizedExpected);
  }
  return false;
};

const roughRussianStem = (word) => {
  if (!/[а-я]/.test(word) || word.length < 5) return word;
  return word.replace(/(иями|ями|ами|ого|ему|ому|ими|ыми|ая|яя|ое|ее|ые|ие|ий|ый|ой|ам|ям|ах|ях|ом|ем|у|ю|а|я|ы|и|е|о)$/u, '');
};

const buildWordBreakdown = (actual, expected) => {
  const expectedPool = tokens(expected).map((word, index) => ({ word, index, used: false }));
  const words = tokens(actual).map((word) => {
    let match = expectedPool.find((entry) => !entry.used && entry.word === word);
    if (match) {
      match.used = true;
      return { word, status: 'correct' };
    }
    match = expectedPool.find(
      (entry) => !entry.used && roughRussianStem(entry.word) === roughRussianStem(word),
    );
    if (match) {
      match.used = true;
      return { word, expected: match.word, status: 'form' };
    }
    return { word, status: 'extra' };
  });
  return {
    words,
    missingWords: expectedPool.filter((entry) => !entry.used).map((entry) => entry.word),
  };
};

export const analyzeAnswer = (actual, expected) => {
  const normalizedActual = normalizeAnswer(actual);
  const normalizedExpected = normalizeAnswer(expected);
  const actualWords = tokens(actual);
  const expectedWords = tokens(expected);
  const missing = wordDifference(actual, expected);
  const extra = wordDifference(expected, actual);
  const unmatchedExtra = [...extra];
  const wrongForms = [];
  missing.forEach((wanted) => {
    const index = unmatchedExtra.findIndex(
      (given) => roughRussianStem(given) === roughRussianStem(wanted) && given !== wanted,
    );
    if (index >= 0) wrongForms.push(`${unmatchedExtra.splice(index, 1)[0]} → ${wanted}`);
  });
  const overlap = actualWords.length + expectedWords.length
    ? (2 * (expectedWords.length - missing.length)) / (actualWords.length + expectedWords.length)
    : 1;
  const orderScore = lcsLength(actualWords, expectedWords) / Math.max(1, expectedWords.length);
  const criticalMismatch = !hasSameCriticalWords(actualWords, expectedWords);
  const unnaturalOrder =
    !missing.length &&
    !extra.length &&
    isRussian(normalizedActual) &&
    !flexibleRussianOrder(normalizedActual, normalizedExpected);
  const score = Math.max(0, Math.min(1, overlap * 0.78 + orderScore * 0.22));
  const breakdown = buildWordBreakdown(actual, expected);
  return {
    expected,
    missing,
    extra,
    wrongForms,
    sameWords: !missing.length && !extra.length,
    orderChanged: !missing.length && !extra.length && normalizedActual !== normalizedExpected,
    criticalMismatch,
    unnaturalOrder,
    score,
    words: breakdown.words,
    missingWords: breakdown.missingWords,
    distance: missing.length + extra.length,
  };
};

export const closestAnswerAnalysis = (actual, variants = []) =>
  variants
    .map((variant) => analyzeAnswer(actual, variant))
    .sort((a, b) => b.score - a.score || a.distance - b.distance)[0] || analyzeAnswer(actual, '');

export const gradeAnswer = (actual, variants = []) => {
  const accepted = variants.filter(Boolean);
  const exactVariant = accepted.find((variant) => answersMatch(actual, variant));
  if (exactVariant) {
    return { status: 'correct', analysis: analyzeAnswer(actual, exactVariant) };
  }
  const analysis = closestAnswerAnalysis(actual, accepted);
  const expectedScriptMatches = accepted.some((variant) =>
    answerUsesExpectedScript(actual, variant));
  return {
    status:
      expectedScriptMatches &&
      !analysis.criticalMismatch && !analysis.unnaturalOrder && analysis.score >= 0.68
        ? 'close'
        : 'wrong',
    analysis,
  };
};
