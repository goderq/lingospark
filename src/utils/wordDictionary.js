import { wordEstablished } from './wordSchedule.js';

export const normalizeWordQuery = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim().replace(/\s+/g, ' ');
export function wordLearningState(stats, today = new Date().toISOString().slice(0, 10)) {
  if (!stats) return 'new';
  if (stats.dueDate && stats.dueDate <= today) return 'due';
  return wordEstablished(stats) ? 'learned' : 'learning';
}
export const wordStateLabels = { new: 'Новое', learning: 'Учу', due: 'Пора повторить', learned: 'Освоено' };
export function wordAmountLabel(count) {
  const last = count % 10, lastTwo = count % 100;
  return `${count} ${lastTwo >= 11 && lastTwo <= 14 ? 'слов' : last === 1 ? 'слово' : last >= 2 && last <= 4 ? 'слова' : 'слов'}`;
}

// Search index is prepared once when the dictionary loads. Query changes only
// scan candidates, with no repeated concatenation/normalization of base entries.
export function searchDictionary(words, query, customTranslations = {}) {
  const key = normalizeWordQuery(query);
  if (!key) return words;
  const ranked = [];
  for (const word of words) {
    const custom = customTranslations[word.id];
    const search = word.searchNormalized ?? normalizeWordQuery(`${word.english} ${word.fullTranslation || word.russian}`);
    if (!search.includes(key) && (!custom || !normalizeWordQuery(custom).includes(key))) continue;
    const english = word.english.toLowerCase();
    const rank = english === key ? 0 : english.startsWith(key) ? 1 : normalizeWordQuery(custom || word.russian).startsWith(key) ? 2 : 3;
    ranked.push({ word, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || (a.word.frequency || 99999) - (b.word.frequency || 99999));
  return ranked.map(item => item.word);
}
