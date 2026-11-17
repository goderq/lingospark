export const shallowEqual = (a, b) => a === b || (!!a && !!b && typeof a === 'object' && typeof b === 'object' && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.is(a[key], b[key])));

export function createSelectorStore(initial) {
  let snapshot = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    publish: next => {
      if (snapshot === next) return;
      snapshot = next;
      [...listeners].forEach(listener => listener());
    },
  };
}
