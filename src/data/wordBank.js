import compactWordBank from "./wordBank.json";
import { wordLearningDetails } from "./wordLearningData";
import { wordCandidates } from '../utils/sampling';

export const wordLevels = ["A1", "A2", "B1", "B2", "C1"];

const levelForIndex = (index) => {
  if (index < 800) return "A1";
  if (index < 2000) return "A2";
  if (index < 3800) return "B1";
  if (index < 6000) return "B2";
  return "C1";
};

const emojiForLevel = {
  A1: "🌱",
  A2: "🧭",
  B1: "🚀",
  B2: "🎯",
  C1: "💎",
};

export const extendedWordBank = compactWordBank.map(
  ([english, translation, transcription, stableIndex], index) => {
    const level = levelForIndex(index);
    const variants = translation
      .split(/[;,]/)
      .map((value) => value.replace(/\([^)]*\)/g, "").trim())
      .filter(Boolean);
    const fullTranslation = variants.slice(0, 3).join("; ");
    const learning = wordLearningDetails(english, fullTranslation);
    return {
      id: `bank-${stableIndex ?? index}`,
      english,
      russian: variants[0] || translation,
      translations: variants.slice(1, 3),
      fullTranslation,
      searchText: `${english} ${translation} ${transcription || ""}`.toLocaleLowerCase("ru"),
      transcription,
      level,
      emoji: emojiForLevel[level],
      frequency: index + 1,
      ...learning,
    };
  },
);

const coreLimits = { A1: 700, A2: 950, B1: 1250, B2: 900, C1: 550 };
const excludedEnglish = new Set([
  "sex", "porn", "porno", "pornography", "masturbation", "orgasm", "erotica",
  "sexual", "sexually", "whore", "prostitute", "john", "jane", "michael",
  "david", "james", "robert", "mary", "william", "richard", "thomas",
  "charles", "daniel", "joseph", "paul", "mark", "donald", "george",
  "kenneth", "steven", "edward", "brian", "ronald", "anthony", "kevin",
  "jason", "jeff", "ryan", "gary", "nicholas", "eric", "stephen",
]);
const excludedRussian = /(?:порно|мастурб|оргазм|проститут|шлюх|дроч)/i;
const coreCounts = Object.fromEntries(wordLevels.map((level) => [level, 0]));

// The full offline dictionary remains available, while everyday learning uses
// a smaller frequency-first set without names, adult vocabulary and one-letter
// corpus fragments. This keeps random sessions useful instead of merely large.
export const wordBank = extendedWordBank.filter((word) => {
  if (excludedEnglish.has(word.english) || excludedRussian.test(word.fullTranslation)) return false;
  if (word.english.length === 1 && !["a", "i"].includes(word.english)) return false;
  if (coreCounts[word.level] >= coreLimits[word.level]) return false;
  coreCounts[word.level] += 1;
  return true;
});

export const wordBankSize = wordBank.length;
export const extendedWordBankSize = extendedWordBank.length;

export const wordsByLevel = Object.fromEntries(
  wordLevels.map((level) => [
    level,
    wordBank.filter((word) => word.level === level),
  ]),
);

export const wordCountsByLevel = Object.fromEntries(
  wordLevels.map((level) => [level, wordsByLevel[level].length]),
);

export const extendedWordsByLevel = Object.fromEntries(
  wordLevels.map((level) => [
    level,
    extendedWordBank.filter((word) => word.level === level),
  ]),
);

export const extendedWordCountsByLevel = Object.fromEntries(
  wordLevels.map((level) => [level, extendedWordsByLevel[level].length]),
);

const wordIndexById = new Map(
  wordBank.map((word, index) => [word.id, index]),
);
const extendedWordIndexById = new Map(
  extendedWordBank.map((word, index) => [word.id, index]),
);

export const getWordCandidates = (activeId, amount = 12, pool = wordBank) => {
  const indexById = pool === extendedWordBank ? extendedWordIndexById : wordIndexById;
  const activeIndex = pool === wordBank || pool === extendedWordBank ? indexById.get(activeId) ?? -1 : pool.findIndex(word => word.id === activeId);
  return wordCandidates(pool, activeId, activeIndex, amount);
};
