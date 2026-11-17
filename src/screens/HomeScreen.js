import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { useProgressActions, useProgressSelector } from '../store/ProgressContext';
import DailyLearningPlan from '../components/DailyLearningPlan';
import SyncStatus from '../components/SyncStatus';
import { ProgressBar } from '../components/UI';
import { colors } from '../theme';

export default function HomeScreen({ onLesson, onJourney, onRetention, onReview, onDictation, onMistakes, onAdaptive, onLearningHub, onLingoWorld, onSearch, onBookmarks, onAccount, onSyncDetails, recentScreens = [], onRecent }) {
  const progress = useProgressSelector(({ progress: p }) => ({
    name: p.name, streak: p.streak, completed: p.completed, retention: p.retention,
    journeys: p.journeys, lessonDraft: p.lessonDraft, mistakes: p.mistakes,
    dailyActions: p.dailyActions, dailyXP: p.dailyXP, dailyGoal: p.dailyGoal,
    reviewStats: p.reviewStats, reviewQueue: p.reviewQueue,
  }));
  const { isUnlocked } = useProgressActions();
  const draft = lessons.find(item => item.id === progress.lessonDraft?.lessonId && isUnlocked(item));
  const next = draft || lessons.find(item => !progress.completed.includes(item.id)) || lessons[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  return <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.muted}>{greeting},</Text><Text style={s.title}>{progress.name}!</Text></View>
      <Pressable accessibilityLabel="Поиск" onPress={onSearch} style={s.icon}><Ionicons name="search" size={23} color="white" /></Pressable>
      <Pressable accessibilityLabel="Закладки" onPress={onBookmarks} style={s.icon}><Ionicons name="bookmark-outline" size={23} color={colors.orange} /></Pressable>
    </View>
    <SyncStatus onAccount={onAccount} onDetails={onSyncDetails} />
    <DailyLearningPlan progress={progress} next={next} onLesson={onLesson} onJourney={onJourney} onRetention={onRetention} onMistakes={onMistakes} onReview={onReview} onDictation={onDictation} onLearningHub={onLearningHub} />
    <View style={s.card}><Text style={s.heading}>Цель дня · {progress.dailyXP}/{progress.dailyGoal} XP</Text><ProgressBar value={progress.dailyXP / Math.max(1, progress.dailyGoal)} /><Text style={s.muted}>Серия занятий: {progress.streak} дн. XP показывает активность, а не уровень владения языком.</Text></View>
    <Text style={s.heading}>Выбери занятие</Text>
    {[
      ['map-outline', 'Учебный маршрут', '43 темы от A1 до C1', onLearningHub],
      ['flash-outline', 'Практика', 'Навык, тема, уровень и самопроверка', onAdaptive],
      ['time-outline', 'Единое повторение', 'Слова, ошибки, фразы и память курса', onRetention],
      ['library-outline', 'Новые слова', 'Сессия на выбранном уровне', onReview],
      ['earth-outline', 'Английская жизнь', 'Примени язык в сюжетных ситуациях', onLingoWorld],
    ].map(([icon, title, subtitle, action]) => <Pressable key={title} onPress={action} style={s.row}><Ionicons name={icon} size={25} color={colors.purple} /><View style={{ flex: 1, gap: 5 }}><Text style={s.heading}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>)}
    {!!recentScreens.length && <><Text style={s.heading}>Недавно</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>{recentScreens.map(item => <Pressable key={item.key} onPress={() => onRecent?.(item)} style={s.recent}><Text style={s.link}>{item.title}</Text></Pressable>)}</ScrollView></>}
  </ScrollView>;
}
const s = StyleSheet.create({ content: { padding: 20, paddingBottom: 110, gap: 16 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { color: 'white', fontSize: 32, fontWeight: '900' }, heading: { color: 'white', fontSize: 18, fontWeight: '800' }, muted: { color: colors.textMuted, fontSize: 14, lineHeight: 22 }, card: { padding: 20, gap: 14, backgroundColor: colors.card, borderRadius: 24 }, row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, backgroundColor: colors.card, borderRadius: 20 }, icon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 18 }, recent: { padding: 16, borderRadius: 16, backgroundColor: colors.card }, link: { color: colors.purple, fontWeight: '700' } });
