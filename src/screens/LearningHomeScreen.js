import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { learningJourneys } from '../data/learningJourney';
import { isJourneyUnlocked } from '../utils/learningJourney';
import { nextLearningStep } from '../utils/learningContinuation';
import { useProgress } from '../store/ProgressContext';
import useScreenTiming from '../components/useScreenTiming';
import { ProgressBar } from '../components/UI';
import { colors , useTheme, createThemedStyles } from '../theme';

export default function LearningHomeScreen({ onNavigate, onJourney, onCourse }) {
  useTheme();
  useScreenTiming('learning_home_open');
  const { progress } = useProgress();
  const completed = new Set(progress.completed);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Все');
  const [section, setSection] = useState('courses');
  const routes = useMemo(() => learningJourneys.filter(journey => (filter === 'Все' || journey.level === filter) && journey.title.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru').trim())), [filter, query]);
  const next = lessons.find(lesson => !completed.has(lesson.id));
  const sections = section === 'words' ? [
    ['review', 'library-outline', 'Изучать слова', 'Карточки, примеры и произношение'],
    ['vocabulary', 'search-outline', 'Словарь', 'Найти слово или сохранить своё'],
    ['unifiedReview', 'time-outline', 'Повторение', 'Вернуться к словам в нужный момент'],
  ] : section === 'grammar' ? [
    ['tenses', 'time-outline', 'Времена', 'От ситуации к форме и практике'],
    ['grammarAcademy', 'school-outline', 'Академия грамматики', 'Конструкции и подробные объяснения'],
    ['grammarCenter', 'apps-outline', 'Все темы грамматики', 'Выбери то, что нужно сейчас'],
  ] : [
    ['quickSession', 'timer-outline', 'Занятие на 10 минут', 'Тема, повторение и разговор в одном маршруте'],
    ['practice', 'flash-outline', 'Практика', 'Один экран, разные навыки и самопроверка'],
    ['examCenter', 'ribbon-outline', 'Экзамены', 'Проверки отдельно от обучения'],
  ];
  return <FlatList data={section === 'courses' ? routes : []} keyExtractor={item => item.id}
    initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5}
    keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    contentContainerStyle={s.content}
    ListHeaderComponent={<View style={{ gap: 18 }}>
      <Text style={s.label}>ТВОЯ БИБЛИОТЕКА ЗНАНИЙ</Text>
      <Text style={s.title}>Учись по-своему</Text>
      <View style={s.segment}>{[['courses', 'Курсы'], ['words', 'Слова'], ['grammar', 'Грамматика']].map(([id, title]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: section === id }} key={id} onPress={() => setSection(id)} style={[s.segmentItem, section === id && s.segmentActive]}><Text style={[s.segmentText, section === id && { color: colors.purple }]}>{title}</Text></Pressable>)}</View>
      {section === 'courses' && <View style={s.summary}><Text style={s.heading}>Твой путь · {progress.completed.length}/43</Text><ProgressBar value={progress.completed.length / 43} /><Text style={s.muted}>Следующий шаг: {next?.title || 'Выбрать новый навык'}.</Text></View>}
      {sections.map(([id, icon, title, subtitle]) => <Pressable key={id} onPress={() => onNavigate(id)} style={s.row}>
        <Ionicons name={icon} size={25} color={colors.purple} /><View style={s.body}><Text style={s.heading}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>)}
      <Pressable style={s.card} onPress={() => onNavigate('learningHub')}><Text style={s.heading}>Каталог и дополнительные инструменты →</Text><Text style={s.muted}>Чтение, тетрадь, сюжеты и сохранённые разделы.</Text></Pressable>
      {section === 'courses' && <><Text style={s.heading}>Учебные темы</Text>
      <TextInput accessibilityLabel="Найти тему" value={query} onChangeText={setQuery} placeholder="Название темы" placeholderTextColor={colors.textMuted} style={{ color: colors.text, backgroundColor: colors.card, padding: 18, borderRadius: 16, fontSize: 17 }} />
      <View style={s.levels}>{['Все', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => <Pressable key={level} onPress={() => setFilter(level)} style={[s.level, filter === level && { borderWidth: 1, borderColor: colors.purple }]}><Text style={s.segmentText}>{level}</Text></Pressable>)}</View></>}
    </View>}
    renderItem={({ item }) => {
      const available = isJourneyUnlocked(progress, item.id);
      const state = progress.journeys?.[item.id];
      const count = item.stages.filter(stage => state?.stages?.[stage.id]?.completedAt).length;
      const prerequisite = !available ? nextLearningStep(progress, item.id) : null;
      return <Pressable accessibilityRole="button" onPress={() => onJourney(available ? item.id : prerequisite.topicId)} style={[s.card, !available && { borderColor: colors.textMuted }]}>
        <Text style={s.label}>{item.level} · {count}/5 этапов {completed.has(item.id) ? '· урок пройден' : ''}</Text>
        <Text style={s.heading}>{item.title}</Text><Text style={s.muted}>{item.goal}</Text>
        {available && <ProgressBar value={count / item.stages.length} height={4} />}
        <Text style={s.accent}>{!available ? `Нужно завершить «${prerequisite.title}» · ${prerequisite.stageTitle}. Перейти →` : state?.draft ? 'Продолжить с сохранённого места →' : 'Открыть тему →'}</Text>
      </Pressable>;
    }}
    ListEmptyComponent={section === 'courses' ? <Text style={s.muted}>Темы не найдены. Попробуй другой уровень или запрос.</Text> : null}
  />;
}

const s = createThemedStyles(() => ({
  segment: { flexDirection: 'row', padding: 5, borderRadius: 18, backgroundColor: colors.cardLight }, segmentItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 }, segmentActive: { backgroundColor: colors.card }, segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' }, summary: { padding: 20, borderRadius: 24, backgroundColor: colors.accentSoft, gap: 14 },
  content: { padding: 20, paddingBottom: 110, gap: 18 }, title: { fontSize: 32, color: colors.text, fontWeight: '900' }, heading: { fontSize: 18, color: colors.text, fontWeight: '800' },
  muted: { fontSize: 14, lineHeight: 22, color: colors.textMuted }, label: { fontSize: 12, fontWeight: '800', color: colors.purple }, accent: { color: colors.mint, fontSize: 15, fontWeight: '700' },
  card: { padding: 20, gap: 13, backgroundColor: colors.card, borderRadius: 23, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: colors.card }, body: { flex: 1, gap: 6 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, level: { backgroundColor: colors.card, padding: 12, borderRadius: 12, gap: 6, minWidth: 44, alignItems: 'center' },
}));
