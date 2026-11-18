import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Appearance, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, resolveScheme, themeModes } from './design/palettes';

const KEY = '@lingospark/appearance-v1';
let activeScheme = resolveScheme('system', Appearance.getColorScheme());
export const colors = new Proxy({}, { get: (_, key) => palettes[activeScheme][key] });
const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext) || { mode: 'system', scheme: activeScheme, reduceMotion: true, setMode: () => {} };

export function createThemedStyles(factory) {
  const cache = new Map();
  const current = () => {
    if (!cache.has(activeScheme)) {
      const definitions = factory();
      for (const [name, style] of Object.entries(definitions)) {
        if (style.fontSize && style.fontSize < 11) style.fontSize = 11;
        if (style.fontWeight === '900') style.fontWeight = '800';
        if (style.fontSize && style.lineHeight && style.lineHeight < style.fontSize * 1.3) style.lineHeight = Math.ceil(style.fontSize * 1.3);
        if (/button|chip|choice|toggle|tab|back|filter|action/i.test(name) && !/icon|text|label|dot/i.test(name)) {
          for (const dimension of ['height', 'minHeight']) if (typeof style[dimension] === 'number' && style[dimension] >= 32 && style[dimension] < 44) style[dimension] = 44;
          if (typeof style.width === 'number' && style.width >= 32 && style.width < 44) style.width = 44;
        }
        if (style.backgroundColor === colors.card && style.borderRadius >= 16) definitions[name] = { borderWidth: 1, borderColor: colors.border, ...style };
      }
      cache.set(activeScheme, StyleSheet.create(definitions));
    }
    return cache.get(activeScheme);
  };
  return new Proxy({}, { get: (_, key) => current()[key], ownKeys: () => Reflect.ownKeys(current()), getOwnPropertyDescriptor: (_, key) => ({ configurable: true, enumerable: true, value: current()[key] }) });
}

export function ThemeProvider({ children }) {
  const [mode, updateMode] = useState('system');
  const [system, setSystem] = useState(Appearance.getColorScheme());
  const [systemMotion, setSystemMotion] = useState(true);
  const [userMotion, setUserMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const writes = useRef(Promise.resolve());
  const preferences = useRef({ mode: 'system', reduceMotion: false });
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(KEY).then(raw => { const saved = JSON.parse(raw || '{}'); if (mounted) { preferences.current = { mode: themeModes.includes(saved.mode) ? saved.mode : 'system', reduceMotion: saved.reduceMotion === true }; updateMode(preferences.current.mode); setUserMotion(preferences.current.reduceMotion); } }).catch(() => {}).finally(() => { if (mounted) setReady(true); });
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setSystemMotion(value); }).catch(() => {});
    const appearance = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme));
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemMotion);
    return () => { mounted = false; appearance.remove(); motion.remove(); };
  }, []);
  const scheme = resolveScheme(mode, system);
  useEffect(() => { Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode === 'pink' ? 'light' : mode); }, [mode]);
  activeScheme = scheme;
  const persist = (nextMode, nextMotion) => { const snapshot = { mode: nextMode, reduceMotion: nextMotion }; preferences.current = snapshot; writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(KEY, JSON.stringify(snapshot))); writes.current.catch(() => {}); };
  const value = useMemo(() => ({ mode, scheme, reduceMotion: systemMotion || userMotion, userReduceMotion: userMotion,
    setMode: next => { if (themeModes.includes(next)) { if (next === 'system') { Appearance.setColorScheme('unspecified'); setSystem(Appearance.getColorScheme()); } updateMode(next); persist(next, preferences.current.reduceMotion); } },
    setReduceMotion: next => { setUserMotion(!!next); persist(preferences.current.mode, !!next); },
  }), [mode, scheme, systemMotion, userMotion]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const shadows = { card: { shadowColor: '#162344', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 } };

