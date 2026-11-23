import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupDueDate } from '../utils/groupStudy';
import { eventDay } from '../utils/studyEvents';
import { useProgressSelector } from '../store/ProgressContext';
import { MotionPressable } from './Motion';
import { PrimaryButton } from './UI';
import { colors, createThemedStyles, useTheme } from '../theme';

export default function TodayStudyEvents({ events, onOpen, now }) {
  useTheme();
  const results = useProgressSelector(state => state.progress.studyEventResults);
  const [visible, setVisible] = useState(3);
  const current = events.filter(event => Array.isArray(event?.topics) && event.topics.length && eventDay(event, now) < event.topics.length + 7);
  if (!current.length || !onOpen) return null;

  return <View style={s.section}>
    <Text accessibilityRole="header" style={s.heading}>Общие события</Text>
    {current.slice(0, visible).map(event => {
      const day = eventDay(event, now);
      const completed = event.topics.filter((_, index) => results?.[event.id]?.days?.[index]).length;
      const status = day < 0 ? 'Начало ' + groupDueDate(event.starts_on)
        : day >= event.topics.length ? 'Завершено · ' + completed + '/' + event.topics.length
          : 'День ' + (day + 1) + ' из ' + event.topics.length + ' · выполнено ' + completed;
      return <MotionPressable key={event.id} accessibilityRole="button" accessibilityLabel={event.name + ' · общее событие'}
        onPress={() => onOpen(event)} style={s.card}>
        <Ionicons name={results?.[event.id]?.badgeAt ? 'ribbon-outline' : 'calendar-outline'} size={24} color={colors.purple} />
        <View style={s.details}>
          <Text style={s.title}>{event.name}</Text>
          <Text style={s.muted}>{status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </MotionPressable>;
    })}
    {current.length > visible && <PrimaryButton title="Показать ещё события" variant="secondary" onPress={() => setVisible(value => value + 6)} />}
  </View>;
}

const s = createThemedStyles(() => ({
  section: { gap: 10 },
  heading: { color: colors.text, fontSize: 21, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 68, gap: 13, padding: 16, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  details: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 13 },
}));
