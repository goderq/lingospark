import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contextDialogues } from '../data/contextDialogues';
import { MotionPressable } from '../components/Motion';
import { colors, createThemedStyles, useTheme } from '../theme';
import PracticeScreen from './PracticeScreen';

export default function ContextDialoguesScreen({ onClose, initialSceneId }) {
  useTheme();
  const [selected, setSelected] = useState(() => contextDialogues.find(scene => scene.id === initialSceneId));
  if (selected) return <PracticeScreen key={selected.id} title={selected.title} presetMode="learn"
    presetDeck={selected.steps} sessionKey={`context-dialogue-${selected.id}`}
    onClose={initialSceneId ? onClose : () => setSelected(null)} />;
  return <View style={s.root}>
    <View style={s.header}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Назад" style={s.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={s.title}>Короткие диалоги</Text>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.detail}>Послушай собеседника и напиши ответ по-английски. Можно открыть подсказку.</Text>
      {contextDialogues.map(scene => <MotionPressable key={scene.id} accessibilityRole="button" onPress={() => setSelected(scene)} style={s.card}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.name}>{scene.title}</Text>
          <Text style={s.detail}>{scene.intro}</Text>
        </View>
        <Text style={s.level}>{scene.level}</Text>
        <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
      </MotionPressable>)}
    </ScrollView>
  </View>;
}

const s = createThemedStyles(() => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, minHeight: 64 },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  back: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12, paddingBottom: 44 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  detail: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  level: { color: colors.mint, fontWeight: '800' },
}));
