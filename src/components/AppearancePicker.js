import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';

export default function AppearancePicker() {
  const { mode, setMode } = useTheme();
  return <View style={s.group}>{[['light', 'Светлая', 'sunny-outline'], ['dark', 'Тёмная', 'moon-outline'], ['system', 'Системная', 'phone-portrait-outline']].map(([value, label, icon]) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === value }} key={value} onPress={() => setMode(value)} style={[s.option, mode === value && s.selected]}>
    <View style={[s.preview, { backgroundColor: value === 'light' ? '#F5F6FB' : value === 'dark' ? '#0D1120' : colors.cardLight }]}><View style={[s.line, { width: '65%', backgroundColor: value === 'dark' ? '#45516B' : '#CDD4E8' }]} /><View style={[s.tile, { backgroundColor: value === 'dark' ? '#242E45' : '#FFFFFF' }]} /><View style={s.dot} /></View>
    <Ionicons name={icon} size={19} color={mode === value ? colors.purple : colors.textMuted} /><Text style={s.label}>{label}</Text>
    {mode === value && <Ionicons name="checkmark-circle" size={19} color={colors.purple} />}
  </Pressable>)}</View>;
}
const s = createThemedStyles(() => ({ group: { flexDirection: 'row', gap: 8 }, option: { flex: 1, padding: 10, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 10 }, selected: { borderColor: colors.purple, backgroundColor: colors.accentSoft }, preview: { width: '100%', height: 80, borderRadius: 12, padding: 10, gap: 7, overflow: 'hidden' }, line: { height: 5, borderRadius: 4 }, tile: { height: 25, borderRadius: 7 }, dot: { width: 22, height: 8, borderRadius: 4, backgroundColor: '#6845DE' }, label: { color: colors.text, fontSize: 12, fontWeight: '700' } }));
