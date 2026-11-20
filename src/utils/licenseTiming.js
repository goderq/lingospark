const OFFLINE_MS = 7 * 86400000;

export const isAccessStaff = role => role === 'owner' || role === 'admin';

export function licenseTiming({ expires_at, revoked_at, licensed, offline, staffAccess, role, verifiedAt } = {}, now = Date.now()) {
  const expiry = expires_at ? Date.parse(expires_at) : Infinity;
  const checked = Number.isFinite(verifiedAt) && verifiedAt > 0 && verifiedAt <= now;
  const cacheExpiry = checked ? verifiedAt + OFFLINE_MS : null;
  const staffOffline = staffAccess === true && cacheExpiry > now;
  const offlineUntil = checked ? Math.min(cacheExpiry, isAccessStaff(role) || staffAccess === true ? Infinity : expiry) : null;
  return {
    licensed: !!licensed && !revoked_at && expiry > now && (!offline || cacheExpiry > now),
    staffOffline,
    expired: expiry <= now,
    offlineUntil: Number.isFinite(offlineUntil) ? offlineUntil : null,
  };
}

export function offlineLicense(cached, now = Date.now()) {
  const license = cached?.licensed === true || (cached?.licensed === undefined && !!cached?.verifiedAt);
  const timing = licenseTiming({ ...cached, licensed: license }, now);
  return {
    expires_at: cached?.expires_at ?? null,
    verifiedAt: cached?.verifiedAt ?? null,
    licensed: timing.licensed && timing.offlineUntil > now,
    staffAccess: cached?.staffAccess === true,
    offline: true,
  };
}

export function offlineRemaining(until, now = Date.now()) {
  const hours = Math.ceil((until - now) / 3600000);
  if (hours >= 24) return Math.floor(hours / 24) + ' дн. ' + (hours % 24) + ' ч.';
  return hours > 0 ? 'до ' + hours + ' ч.' : 'меньше минуты';
}
