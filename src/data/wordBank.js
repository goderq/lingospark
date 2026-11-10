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
    return {
      id: `bank-${stableIndex ?? index}`,
      english,
      russian: variants[0] || translation,
      translations: variants.slice(1, 8),
      fullTranslation: translation,
      transcription,
      level,
      emoji: emojiForLevel[level],
      frequency: index + 1,
    };
  },
);

export const wordBankSize = wordBank.length;
