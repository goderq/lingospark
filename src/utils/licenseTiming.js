const OFFLINE_MS = 7 * 86400000;

export function licenseTiming({ expires_at, revoked_at, licensed, verifiedAt } = {}, now = Date.now()) {
  const expiry = expires_at ? Date.parse(expires_at) : Infinity;
  const checked = Number.isFinite(verifiedAt) && verifiedAt > 0 && verifiedAt <= now;
  const offlineUntil = checked ? Math.min(verifiedAt + OFFLINE_MS, expiry) : null;
  return {
    licensed: !!licensed && !revoked_at && expiry > now,
    expired: expiry <= now,
    offlineUntil: Number.isFinite(offlineUntil) ? offlineUntil : null,
  };
}

export function offlineLicense(cached, now = Date.now()) {
  const timing = licenseTiming({ ...cached, licensed: true }, now);
  return {
    expires_at: cached?.expires_at ?? null,
    verifiedAt: cached?.verifiedAt ?? null,
    licensed: timing.licensed && timing.offlineUntil > now,
    offline: true,
  };
}

export function offlineRemaining(until, now = Date.now()) {
  const hours = Math.ceil((until - now) / 3600000);
  if (hours >= 24) return Math.floor(hours / 24) + ' дн. ' + (hours % 24) + ' ч.';
  return hours > 0 ? 'до ' + hours + ' ч.' : 'меньше минуты';
}
