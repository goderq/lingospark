import compactWordBank from "./wordBank.json";

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

export const wordBank = compactWordBank.map(
  ([english, translation, transcription, stableIndex], index) => {
    const level = levelForIndex(index);
    const variants = translation
      .split(/[;,]/)
      .map((value) => value.replace(/\([^)]*\)/g, "").trim())
      .filter(Boolean);
    const fullTranslation = variants.slice(0, 3).join("; ");
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
    };
  },
);

export const wordBankSize = wordBank.length;

export const wordsByLevel = Object.fromEntries(
  wordLevels.map((level) => [
    level,
    wordBank.filter((word) => word.level === level),
  ]),
);

export const wordCountsByLevel = Object.fromEntries(
  wordLevels.map((level) => [level, wordsByLevel[level].length]),
);

const wordIndexById = new Map(
  wordBank.map((word, index) => [word.id, index]),
);

export const getWordCandidates = (activeId, amount = 12) => {
  const activeIndex = wordIndexById.get(activeId) ?? -1;
  const start = activeIndex < 0 ? 0 : activeIndex;
  const result = [];
  const used = new Set([activeId]);
  const step = 997;
  for (let offset = 1; result.length < amount && offset < wordBank.length; offset += 1) {
    const word = wordBank[(start + offset * step) % wordBank.length];
    if (!used.has(word.id)) {
      used.add(word.id);
      result.push(word);
    }
  }
  return result;
};
