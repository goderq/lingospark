import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { learningJourneys } from '../data/learningJourney';
import { isJourneyUnlocked } from '../utils/learningJourney';
import { useProgress } from '../store/ProgressContext';
import useScreenTiming from '../components/useScreenTiming';
import { colors } from '../theme';

export default function LearningHomeScreen({ onNavigate, onJourney, onCourse }) {
  useScreenTiming('learning_home_open');
  const { progress } = useProgress();
  const completed = new Set(progress.completed);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Все');
  const routes = useMemo(() => learningJourneys.filter(journey => (filter === 'Все' || journey.level === filter) && journey.title.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru').trim())), [filter, query]);
  const next = lessons.find(lesson => !completed.has(lesson.id));
  const sections = [
    ['course', 'map-outline', 'Курсы', 'Последовательный путь A1–C1'],
    ['practice', 'flash-outline', 'Практика', 'Один экран, разные навыки и самопроверка'],
    ['review', 'library-outline', 'Слова', 'Сессии по уровню и словарь'],
    ['grammarCenter', 'school-outline', 'Грамматика', 'Объяснения, времена и практика'],
    ['examCenter', 'ribbon-outline', 'Экзамены', 'Проверки отдельно от обучения'],
    ['knowledgeMap', 'stats-chart-outline', 'Карта навыков', 'Результаты и задания, на которых они основаны'],
    ['unifiedReview', 'time-outline', 'Единое повторение', 'Слова, ошибки, фразы и память курса'],
  ];
  return <FlatList data={routes} keyExtractor={item => item.id}
    initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5}
    keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    contentContainerStyle={s.content}
    ListHeaderComponent={<View style={{ gap: 18 }}>
      <Text style={s.title}>Обучение</Text>
      <Text style={s.muted}>43 темы: объяснение → выражения → слух → фразы → диалог. Следующий урок: {next?.title || 'Все уроки пройдены'}.</Text>
      {sections.map(([id, icon, title, subtitle]) => <Pressable key={id} onPress={() => onNavigate(id)} style={s.row}>
        <Ionicons name={icon} size={25} color={colors.purple} /><View style={s.body}><Text style={s.heading}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>)}
      <Pressable style={s.card} onPress={() => onNavigate('learningHub')}><Text style={s.heading}>Каталог и дополнительные инструменты →</Text><Text style={s.muted}>Чтение, тетрадь, сюжеты и сохранённые разделы.</Text></Pressable>
      <Text style={s.heading}>Все учебные темы</Text>
      <TextInput accessibilityLabel="Найти тему" value={query} onChangeText={setQuery} placeholder="Название темы" placeholderTextColor={colors.textMuted} style={{ color: 'white', backgroundColor: colors.card, padding: 18, borderRadius: 16, fontSize: 17 }} />
      <View style={s.levels}>{['Все', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => <Pressable key={level} onPress={() => setFilter(level)} style={[s.level, filter === level && { borderWidth: 1, borderColor: colors.purple }]}><Text style={s.heading}>{level}</Text></Pressable>)}</View>
    </View>}
    renderItem={({ item }) => {
      const available = isJourneyUnlocked(progress, item.id);
      const state = progress.journeys?.[item.id];
      const count = item.stages.filter(stage => state?.stages?.[stage.id]?.completedAt).length;
      return <Pressable disabled={!available} onPress={() => onJourney(item.id)} style={[s.card, !available && { opacity: 0.5 }]}>
        <Text style={s.label}>{item.level} · {count}/5 этапов {completed.has(item.id) ? '· урок пройден' : ''}</Text>
        <Text style={s.heading}>{item.title}</Text><Text style={s.muted}>{item.goal}</Text>
        <Text style={s.accent}>{!available ? 'Сначала пройди предыдущий урок' : state?.draft ? 'Продолжить с сохранённого места →' : 'Открыть тему →'}</Text>
      </Pressable>;
    }}
    ListEmptyComponent={<Text style={s.muted}>Темы не найдены. Попробуй другой уровень или запрос.</Text>}
  />;
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110, gap: 18 }, title: { fontSize: 32, color: 'white', fontWeight: '900' }, heading: { fontSize: 18, color: 'white', fontWeight: '800' },
  muted: { fontSize: 14, lineHeight: 22, color: colors.textMuted }, label: { fontSize: 12, fontWeight: '800', color: colors.purple }, accent: { color: colors.mint, fontSize: 15, fontWeight: '700' },
  card: { padding: 20, gap: 13, backgroundColor: colors.card, borderRadius: 23, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: colors.card }, body: { flex: 1, gap: 6 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, level: { backgroundColor: colors.card, padding: 14, borderRadius: 17, gap: 6, minWidth: 80 },
});
