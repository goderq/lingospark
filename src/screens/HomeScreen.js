import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { useProgressSelector } from '../store/ProgressContext';
import { nextLearningStep, readQuickSession } from '../utils/learningContinuation';
import { retentionSummary } from '../utils/retention';
import { countDueReviewWords } from '../utils/unifiedReview';
import SyncStatus from '../components/SyncStatus';
import { ProgressBar } from '../components/UI';
import { MotionPressable } from '../components/Motion';
import { colors, useTheme, createThemedStyles } from '../theme';

export default function HomeScreen({ onJourney, onRetention, onLearningHub, onLearning, onSearch, onBookmarks, onAccount, onSyncDetails, onQuickSession }) {
  useTheme();
  const progress = useProgressSelector(({ progress: p }) => ({
    name: p.name, streak: p.streak, completed: p.completed, retention: p.retention, journeys: p.journeys, dailyXP: p.dailyXP, dailyGoal: p.dailyGoal, reviewStats: p.reviewStats, quickSession: p.quickSession,
    wordPreferences: p.wordPreferences, customWords: p.customWords, reviewQueue: p.reviewQueue, mistakes: p.mistakes,
  }));
  const next = lessons.find(item => !progress.completed.includes(item.id));
  const step = useMemo(() => nextLearningStep(progress), [progress.completed, progress.journeys]);
  const quick = useMemo(() => readQuickSession(progress.quickSession, progress), [progress.quickSession, progress.completed, progress.journeys]);
  const today = new Date().toISOString().slice(0, 10);
  const [reviewWords, setReviewWords] = useState(null);
  const hasReviewActivity = !!(progress.mistakes?.length || Object.keys(progress.reviewStats || {}).length || Object.keys(progress.reviewQueue || {}).length);
  useEffect(() => {
    if (!hasReviewActivity || reviewWords) return;
    let active = true;
    import('../data/wordBank').then(({ extendedWordBank }) => {
      if (active) setReviewWords(extendedWordBank);
    }).catch(() => {});
    return () => { active = false; };
  }, [hasReviewActivity, reviewWords]);
  const dueWords = useMemo(() => reviewWords ? countDueReviewWords(progress, [...reviewWords, ...(progress.customWords || [])]) : 0,
    [reviewWords, progress.customWords, progress.reviewStats, progress.reviewQueue, progress.wordPreferences, progress.mistakes, today]);
  const dueTopics = useMemo(() => retentionSummary(progress, lessons).due.length, [progress.retention, progress.completed, today]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.eyebrow}>LINGOSPARK / СЕГОДНЯ</Text><Text style={s.greeting}>{greeting}, {progress.name}</Text></View><Pressable accessibilityLabel="Поиск" onPress={onSearch} style={s.icon}><Ionicons name="search-outline" size={22} color={colors.text} /></Pressable><Pressable accessibilityLabel="Закладки" onPress={onBookmarks} style={s.icon}><Ionicons name="bookmark-outline" size={21} color={colors.text} /></Pressable></View>
    <Text style={s.title}>Немного практики.{"\n"}Каждый день.</Text>
    <MotionPressable accessibilityRole="button" accessibilityLabel={quick && quick.step < 3 ? 'Продолжить занятие' : 'Начать занятие'} onPress={onQuickSession}>
      <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View pointerEvents="none" style={s.orbit} /><View pointerEvents="none" style={s.orbitSmall} />
        <View style={s.heroTop}><Text style={s.heroLabel}>10 МИНУТ ДЛЯ СЕБЯ</Text><Ionicons name="sparkles" size={24} color={colors.heroMuted} /></View>
        <Text style={s.heroTitle}>{quick && quick.step < 3 ? 'Продолжим занятие?' : 'Твоё занятие на сегодня'}</Text>
        <Text style={s.heroSubtitle}>Учебная тема, повторение и короткая практика. Всё по шагам.</Text>
        <View style={s.heroBottom}><Text style={s.heroButton}>{quick && quick.step < 3 ? 'Продолжить занятие' : 'Начать занятие'} →</Text></View>
      </LinearGradient>
    </MotionPressable>
    <MotionPressable accessibilityRole="button" onPress={() => next ? onJourney(step.topicId) : (onLearning || onLearningHub)()} style={s.quick}><View style={s.quickIcon}><Ionicons name="map-outline" size={25} color={colors.purple} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{next ? step.title : 'Все темы пройдены'}</Text><Text style={s.muted}>{next ? `Следующий этап: ${step.stageTitle}` : 'Выбери тему для повторения'}</Text></View><Ionicons name="chevron-forward" size={21} color={colors.purple} /></MotionPressable>
    <MotionPressable accessibilityRole="button" onPress={onRetention} style={s.quick}><View style={[s.quickIcon, { backgroundColor: colors.successSoft }]}><Ionicons name="time-outline" size={25} color={colors.mint} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>Повторение</Text><Text style={s.muted}>{dueWords + dueTopics ? `Пора вернуться: ${dueWords} слов · ${dueTopics} тем` : 'Повтори изученное в удобном темпе'}</Text></View><Ionicons name="chevron-forward" size={21} color={colors.mint} /></MotionPressable>
    <View style={s.daily}><View style={s.dailyTop}><Text style={s.heading}>Маленькая цель дня</Text><Text style={s.accent}>{progress.dailyXP} / {progress.dailyGoal} XP</Text></View><ProgressBar value={progress.dailyXP / Math.max(1, progress.dailyGoal)} /><View style={s.dailyTop}><Text style={s.muted}>Каждое занятие — шаг вперёд</Text><Text style={s.streak}>🔥 {progress.streak} дн.</Text></View></View>
    <MotionPressable accessibilityRole="button" onPress={onLearning || onLearningHub} style={s.quick}><Ionicons name="grid-outline" size={23} color={colors.purple} /><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>Все занятия</Text><Text style={s.muted}>Слова, курсы, грамматика и другие навыки</Text></View><Ionicons name="chevron-forward" size={21} color={colors.textMuted} /></MotionPressable>
    <SyncStatus onAccount={onAccount} onDetails={onSyncDetails} />
  </ScrollView>;
}
const s = createThemedStyles(() => ({
 content: { padding: 22, paddingBottom: 108, gap: 20 }, header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, eyebrow: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' }, greeting: { color: colors.textMuted, fontSize: 14, marginTop: 7 }, title: { color: colors.text, fontSize: 35, lineHeight: 41, letterSpacing: -1.2, fontWeight: '800' }, icon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
 hero: { borderRadius: 28, padding: 24, minHeight: 225, overflow: 'hidden', gap: 14 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroLabel: { color: colors.heroMuted, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.6, maxWidth: '90%' }, heroSubtitle: { color: colors.heroMuted, fontSize: 14, lineHeight: 21, maxWidth: '85%' }, heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, heroButton: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, heroCount: { color: colors.heroMuted, fontSize: 12 }, orbit: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: '#FFFFFF22', right: -90, top: -80 }, orbitSmall: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#FFFFFF22', right: -50, top: -45 },
 quick: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 17, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, quickIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
 heading: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 }, muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 }, daily: { gap: 14, paddingVertical: 3 }, dailyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, accent: { color: colors.purple, fontSize: 12, fontWeight: '700' }, streak: { color: colors.text, fontSize: 12, fontWeight: '700' }, section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 22, padding: 18, gap: 8, borderWidth: 1, borderColor: colors.border }, tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, planToggle: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
