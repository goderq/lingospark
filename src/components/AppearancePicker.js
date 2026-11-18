import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';
import { palettes } from '../design/palettes';
import { MotionPressable } from './Motion';

export default function AppearancePicker() {
  const { mode, scheme, setMode } = useTheme();
  const modes = [['light', 'Светлая', 'sunny-outline', 'Чистые белые карточки'], ['dark', 'Тёмная', 'moon-outline', 'Спокойный вечерний фон'], ['pink', 'Розовая', 'flower-outline', 'Пудра и ягодный акцент'], ['system', 'Системная', 'phone-portrait-outline', 'Как на твоём iPhone']];
  return <View style={s.group}>{modes.map(([value, label, icon, detail]) => {
    const preview = palettes[value === 'system' ? scheme === 'dark' ? 'dark' : 'light' : value];
    return <MotionPressable key={value} containerStyle={s.cell} accessibilityRole="radio" accessibilityLabel={label + ' тема'} accessibilityState={{ checked: mode === value }} onPress={() => setMode(value)} style={[s.option, mode === value && s.selected]}>
      <View accessible={false} pointerEvents="none" style={[s.preview, { backgroundColor: preview.background, borderColor: preview.border }]}>
        {value === 'system' && <View style={s.nightHalf} />}
        {value === 'pink' && <><View style={s.petal} /><View style={[s.petal, { right: -6, top: -12, width: 55, height: 55 }]} /></>}
        <View style={[s.line, { width: '55%', backgroundColor: preview.textMuted }]} /><View style={[s.tile, { backgroundColor: preview.card }]} /><View style={[s.dot, { backgroundColor: preview.accentFill }]} />
      </View>
      <View style={s.labelRow}><Ionicons name={icon} size={18} color={mode === value ? colors.purple : colors.textMuted} /><Text style={s.label}>{label}</Text>{mode === value && <Ionicons name="checkmark-circle" size={18} color={colors.purple} />}</View>
      <Text style={s.detail}>{detail}</Text>
    </MotionPressable>;
  })}</View>;
}
const s = createThemedStyles(() => ({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, cell: { width: '47%', flexGrow: 1 }, option: { padding: 12, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.buttonBorder, gap: 9 }, selected: { borderColor: colors.purple, backgroundColor: colors.accentSoft }, preview: { height: 72, borderWidth: 1, borderRadius: 12, padding: 10, gap: 7, overflow: 'hidden' }, line: { height: 4, borderRadius: 4 }, tile: { height: 21, borderRadius: 7 }, dot: { width: 30, height: 9, borderRadius: 4 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, label: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' }, detail: { color: colors.textMuted, fontSize: 11, lineHeight: 16 }, nightHalf: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', backgroundColor: '#181F32' }, petal: { position: 'absolute', right: 15, top: 4, width: 45, height: 45, borderRadius: 25, backgroundColor: '#F7C7DD' },
}));
