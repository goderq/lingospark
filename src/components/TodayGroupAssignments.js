import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupDueDate, groupTopicName } from '../utils/groupStudy';
import { useProgressSelector } from '../store/ProgressContext';
import { MotionPressable } from './Motion';
import { PrimaryButton } from './UI';
import useStudyAssignments from './useStudyAssignments';
import { colors, createThemedStyles, useTheme } from '../theme';

export default function TodayGroupAssignments({ onOpen }) {
  useTheme();
  const assignments = useStudyAssignments();
  const results = useProgressSelector(state => state.progress.groupStudyResults);
  const [visible, setVisible] = useState(3);
  const finished = item => Number(results?.[item.id]?.status === 'completed');
  const items = assignments.filter(item => groupTopicName(item.topic_id)).sort((first, second) => finished(first) - finished(second));
  if (!items.length || !onOpen) return null;

  return <View style={s.section}>
    <Text accessibilityRole="header" style={s.heading}>Задания группы</Text>
    {items.slice(0, visible).map(item => {
      const result = results?.[item.id];
      const title = groupTopicName(item.topic_id);
      const status = result?.status === 'completed' ? `Выполнено · ${result.correct}/${result.total}`
        : result?.status === 'started' ? 'В процессе' : 'Назначено';
      return <MotionPressable key={item.id} accessibilityRole="button" accessibilityLabel={title + ' · задание группы'}
        onPress={() => onOpen(item)} style={s.card}>
        <Ionicons name="people-outline" size={22} color={colors.purple} />
        <View style={s.details}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.muted}>{item.group_name} · до {groupDueDate(item.due_on)}</Text>
          <Text style={result?.status === 'completed' ? s.done : s.muted}>{status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </MotionPressable>;
    })}
    {items.length > visible && <PrimaryButton title="Показать ещё задания" variant="secondary" onPress={() => setVisible(value => value + 6)} />}
  </View>;
}

const s = createThemedStyles(() => ({
  section: { gap: 10 },
  heading: { color: colors.text, fontSize: 21, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 76, gap: 13, padding: 16, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  details: { flex: 1, gap: 4 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  muted: { color: colors.textMuted, fontSize: 13 },
  done: { color: colors.mint, fontSize: 13, fontWeight: '700' },
}));
