let indexPromise, loadedIndex;
export const getLoadedReviewWordIndex = () => loadedIndex || null;

export function loadReviewWordIndex() {
  if (!indexPromise) {
    indexPromise = import('../data/wordBank').then(({ extendedWordBank }) => {
      loadedIndex = new Map(extendedWordBank.map(word => [word.id, word]));
      return loadedIndex;
    })
      .catch(error => { indexPromise = null; throw error; });
  }
  return indexPromise;
}

export function includeCustomReviewWords(index, customWords) {
  if (!customWords?.length) return index;
  const combined = new Map(index);
  for (const word of customWords) combined.set(word.id, word);
  return combined;
}
