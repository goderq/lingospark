import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProgress } from '../store/ProgressContext';
import { skillEvidence } from '../utils/learningJourney';
import { colors , useTheme, createThemedStyles } from '../theme';

export default function SkillEvidenceScreen({ onClose }) {
  useTheme();
  const { progress } = useProgress();
  const skills = useMemo(() => skillEvidence(progress), [progress.journeys, progress.reviewStats, progress.completedTenses, progress.completedGrammarTracks, progress.completed, progress.stats, progress.writingCompleted, progress.practiceResults]);
  return <ScrollView contentContainerStyle={s.content}>
    <Pressable onPress={onClose} style={s.back}><Text style={s.link}>← Назад</Text></Pressable>
    <Text style={s.title}>Карта навыков</Text>
    <Text style={s.muted}>Здесь показаны фактические упражнения. Эти результаты не подтверждают уровень CEFR. Письменный диалог не оценивает устную речь, а выбор перевода не измеряет произношение.</Text>
    {skills.map(skill => <View key={skill.id} style={s.card}>
      <Text style={s.heading}>{skill.title}</Text>
      {!skill.evidence.length ? <Text style={s.muted}>Пока недостаточно данных. Пройди задания по этому навыку.</Text> : skill.evidence.map((entry, i) => <View key={i} style={s.entry}><Text style={s.text}>{entry.title}</Text><Text style={s.muted}>{entry.detail}</Text></View>)}
    </View>)}
    <Text style={s.muted}>Отметка «Закреплено» в курсе появляется отдельно — после отложенных проверок памяти.</Text>
  </ScrollView>;
}
const s = createThemedStyles(() => ({ content: { padding: 20, paddingBottom: 45, gap: 20 }, back: { minHeight: 48, justifyContent: 'center' }, link: { color: colors.purple, fontSize: 17, fontWeight: '700' }, title: { color: colors.text, fontSize: 29, fontWeight: '900' }, heading: { color: colors.text, fontSize: 21, fontWeight: '800' }, text: { color: colors.text, fontSize: 16 }, muted: { color: colors.textMuted, fontSize: 15, lineHeight: 24 }, card: { padding: 20, backgroundColor: colors.card, borderRadius: 24, gap: 14 }, entry: { gap: 7, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 } }));
