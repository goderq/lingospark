import { vocabularyTopics } from "./megaPractice";
import { extendedVocabularyTopics } from "./growthContent";
import { wordPhrasePacks } from "./wordPhrasePacks";
import { wordBank } from "./wordBank";

const bankByEnglish = new Map(
  wordBank.map((word) => [word.english.toLowerCase(), word]),
);

const existingThemes = [
  ...vocabularyTopics,
  ...extendedVocabularyTopics,
].map((topic) => ({
  id: topic.id,
  title: topic.title,
  emoji: topic.emoji,
  level: topic.level,
  words: topic.words.map((entry, index) => {
    const bankWord = bankByEnglish.get(entry.english.toLowerCase());
    return {
      ...(bankWord || {
        id: `theme-${topic.id}-${index}`,
        english: entry.english,
        level: topic.level.slice(0, 2),
        transcription: "",
        frequency: wordBank.length + index + 1,
        emoji: topic.emoji,
      }),
      russian: entry.russian,
      fullTranslation: entry.russian,
      translations: entry.russian.split(/[;,]/).map((value) => value.trim()),
      example: entry.example,
      themeId: topic.id,
    };
  }),
}));

export const wordThemes = [...wordPhrasePacks, ...existingThemes];
