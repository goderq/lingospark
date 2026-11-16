import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { greetingJourney } from '../data/learningJourney';
import { useProgress } from '../store/ProgressContext';
import useScreenTiming from '../components/useScreenTiming';
import { colors } from '../theme';

export default function LearningHomeScreen({ onNavigate, onJourney, onCourse }) {
  useScreenTiming('learning_home_open');
  const { progress } = useProgress();
  const completed = new Set(progress.completed);
  const learned = greetingJourney.stages.filter(stage => progress.journeys?.greetings?.stages?.[stage.id]?.completedAt).length;
  const next = lessons.find(lesson => !completed.has(lesson.id));
  const sections = [
    ['course', 'map-outline', 'Курсы', 'Последовательный путь A1–C1'],
    ['review', 'library-outline', 'Слова', 'Сессии по уровню и словарь'],
    ['grammarCenter', 'school-outline', 'Грамматика', 'Объяснения, времена и практика'],
    ['examCenter', 'ribbon-outline', 'Экзамены', 'Проверки отдельно от обучения'],
    ['knowledgeMap', 'stats-chart-outline', 'Карта навыков', 'Результаты и задания, на которых они основаны'],
    ['retention', 'time-outline', 'Проверка памяти', 'Повторение после перерыва'],
  ];
  return <ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>Обучение</Text>
    <Text style={s.muted}>Понятный маршрут, практика и подтверждённые результаты.</Text>
    <Pressable onPress={onJourney} style={[s.card, { borderColor: colors.purple }]}>
      <Text style={s.label}>A1 · ПОЛНЫЙ УЧЕБНЫЙ ЦИКЛ</Text>
      <Text style={s.heading}>Знакомство</Text>
      <Text style={s.muted}>Понять → слова → услышать → собрать фразу → диалог.</Text>
      <Text style={s.accent}>{learned}/5 этапов · {progress.journeys?.greetings?.draft ? 'Продолжить' : learned ? 'Открыть маршрут' : 'Начать'} →</Text>
    </Pressable>
    <Text style={s.heading}>Маршрут A1–C1</Text>
    <Text style={s.muted}>Следующий урок: {next?.title || 'Все уроки пройдены'}. Полный формат из пяти этапов пока подготовлен для «Знакомства»; остальные темы доступны в курсах.</Text>
    <View style={s.levels}>{['A1', 'A2', 'B1', 'B2', 'C1'].map(level => {
      const pool = lessons.filter(lesson => lesson.difficulty.replace('+', '') === level);
      return <Pressable key={level} onPress={() => onCourse(level)} style={s.level}><Text style={s.heading}>{level}</Text><Text style={s.muted}>{pool.filter(lesson => completed.has(lesson.id)).length}/{pool.length}</Text></Pressable>;
    })}</View>
    {sections.map(([id, icon, title, subtitle]) => <Pressable key={id} onPress={() => onNavigate(id)} style={s.row}>
      <Ionicons name={icon} size={25} color={colors.purple} /><View style={s.body}><Text style={s.heading}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>)}
    <Pressable style={s.card} onPress={() => onNavigate('learningHub')}><Text style={s.heading}>Все упражнения и инструменты →</Text><Text style={s.muted}>Каталог, диктанты, чтение, тетрадь и сохранённые разделы.</Text></Pressable>
  </ScrollView>;
}
const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110, gap: 18 }, title: { fontSize: 32, color: 'white', fontWeight: '900' }, heading: { fontSize: 18, color: 'white', fontWeight: '800' },
  muted: { fontSize: 14, lineHeight: 22, color: colors.textMuted }, label: { fontSize: 12, fontWeight: '800', color: colors.purple }, accent: { color: colors.mint, fontSize: 15, fontWeight: '700' },
  card: { padding: 20, gap: 13, backgroundColor: colors.card, borderRadius: 23, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: colors.card }, body: { flex: 1, gap: 6 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, level: { backgroundColor: colors.card, padding: 14, borderRadius: 17, gap: 6, minWidth: 80 },
});
