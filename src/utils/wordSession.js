export function readWordSession(draft) {
  if (!draft || draft.version !== 1 || typeof draft.sessionId !== 'string' || !Array.isArray(draft.deck) || !draft.deck.length || draft.deck.length > 100) return {};
  if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= draft.deck.length || !['learn', 'test'].includes(draft.phase)) return {};
  if (draft.deck.some(word => !word || typeof word.id !== 'string' || typeof word.english !== 'string' || typeof word.russian !== 'string' || !['en-ru', 'ru-en'].includes(word.direction))) return {};
  if (draft.deck.some(word => !['A1', 'A2', 'B1', 'B2', 'C1'].includes(word.level))) return {};
  if (typeof draft.answer !== 'string' || !Array.isArray(draft.letterTiles) || !Array.isArray(draft.usedLetters)) return {};
  if (!Number.isInteger(draft.score) || draft.score < 0 || draft.score > draft.index + (draft.checked ? 1 : 0)) return {};
  if (!['A1', 'A2', 'B1', 'B2', 'C1', 'Все'].includes(draft.level) || !['typing', 'choice', 'listening', 'letters', 'definition'].includes(draft.mode)) return {};
  if (!['core', 'extended'].includes(draft.catalogMode) || !['mixed', 'en-ru', 'ru-en'].includes(draft.directionMode) || ![10, 20, 30, 50].includes(draft.amount) || typeof draft.theme !== 'string' || typeof draft.statusFilter !== 'string') return {};
  if (!Number.isInteger(draft.optionSeed) || typeof draft.checked !== 'boolean' || typeof draft.correct !== 'boolean' || typeof draft.grade !== 'string' || typeof draft.editingTranslation !== 'boolean' || typeof draft.translationDraft !== 'string') return {};
  return draft;
}
