import rules from './cloudSyncRules.js';
import { snapshotKey } from './snapshot.js';

export function cloudDecision({ local, remote, base, owner, userId }) {
  if (owner && owner !== userId) return remote ? 'cloud' : 'clean';
  if (!remote) return 'local';
  const localKey = snapshotKey(local), remoteKey = snapshotKey(remote.progress);
  if (localKey === remoteKey) return 'same';
  if (!rules.learningProgressScore(local)) return 'cloud';
  if (base?.key === localKey) return 'cloud';
  if (base?.key === remoteKey && Number(base.revision) === Number(remote.revision)) return 'local';
  if (!rules.learningProgressScore(remote.progress)) return 'local';
  return 'conflict';
}
