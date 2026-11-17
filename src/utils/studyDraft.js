import { snapshotKey } from './snapshot.js';
export const studySourceKey = source => snapshotKey([source.id, source.formula || '', source.exercises]);
export function readStudyDraft(draft, sources) {
  const source = sources.find(item => item.id === draft?.sourceId);
  if (!source || draft.version !== 1 || draft.contentKey !== studySourceKey(source)) return {};
  if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= source.exercises.length || typeof draft.selected !== 'string' || !Number.isInteger(draft.score) || draft.score < 0 || draft.score > draft.index + (draft.selected ? 1 : 0)) return {};
  if (typeof draft.learning !== 'boolean' || !Number.isInteger(draft.seed)) return {};
  if (draft.gate && (!Number.isInteger(draft.gateIndex) || draft.gateIndex < 0 || draft.gateIndex > 1 || !Number.isInteger(draft.gateScore) || draft.gateScore < 0 || draft.gateScore > draft.gateIndex + (draft.gateSelected ? 1 : 0))) return {};
  return draft;
}
