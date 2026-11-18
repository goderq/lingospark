import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';
import { MotionPressable } from './Motion';
import { speak } from '../utils/speech';
import { sensesForWord } from '../data/wordSenses';

export default function WordContext({ word, accent = 'en-US', rate = 0.78 }) {
  useTheme();
  const [open, setOpen] = useState(false);
  const senses = sensesForWord(word.english);
  const examples = senses.length ? senses : word.example ? [{ english: word.example, russian: word.exampleRu }] : [];
  if (!examples.length) return null;
  const title = senses.length ? `Примеры по значениям · ${senses.length}` : 'Пример в разговоре';
  return <View style={s.container}>
    <MotionPressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={s.toggle}>
      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.purple} />
      <Text style={s.label}>{open ? (senses.length ? 'Скрыть примеры' : 'Скрыть пример') : title}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.purple} />
    </MotionPressable>
    {open && examples.map(example => <View key={example.english} style={s.example}>
      {!!example.meaning && <Text style={s.label}>{example.meaning}</Text>}
      <Text style={s.english}>{example.english}</Text>
      {!!example.russian && <Text style={s.russian}>{example.russian}</Text>}
      <MotionPressable accessibilityRole="button" accessibilityLabel={example.meaning ? `Послушать пример: ${example.meaning}` : 'Послушать пример'}
        onPress={() => speak(example.english, { language: accent, rate })} style={s.toggle}>
        <Ionicons name="volume-high" size={18} color={colors.purple} /><Text style={s.label}>Послушать пример</Text>
      </MotionPressable>
    </View>)}
  </View>;
}
const s = createThemedStyles(() => ({ container: { alignSelf: 'stretch', marginTop: 8, gap: 6 }, toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, label: { flexShrink: 1, color: colors.purple, fontSize: 14, fontWeight: '700' }, example: { padding: 14, gap: 8, borderRadius: 16, backgroundColor: colors.accentSoft }, english: { color: colors.text, fontSize: 16, lineHeight: 24 }, russian: { color: colors.textMuted, fontSize: 14, lineHeight: 21 } }));
