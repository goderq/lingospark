import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { useProgressSelector } from '../store/ProgressContext';
import DailyLearningPlan from '../components/DailyLearningPlan';
import SyncStatus from '../components/SyncStatus';
import { ProgressBar } from '../components/UI';
import { MotionPressable } from '../components/Motion';
import { colors, useTheme, createThemedStyles } from '../theme';

export default function HomeScreen({ onLesson, onJourney, onRetention, onReview, onDictation, onMistakes, onAdaptive, onLearningHub, onSearch, onBookmarks, onAccount, onSyncDetails, onQuickSession, onTenses }) {
  useTheme();
  const [planOpen, setPlanOpen] = useState(false);
  const progress = useProgressSelector(({ progress: p }) => ({
    name: p.name, streak: p.streak, completed: p.completed, retention: p.retention, journeys: p.journeys, lessonDraft: p.lessonDraft, mistakes: p.mistakes, dailyActions: p.dailyActions, dailyXP: p.dailyXP, dailyGoal: p.dailyGoal, reviewStats: p.reviewStats, reviewQueue: p.reviewQueue, quickSession: p.quickSession,
  }));
  const next = lessons.find(item => !progress.completed.includes(item.id));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.eyebrow}>LINGOSPARK / СЕГОДНЯ</Text><Text style={s.greeting}>{greeting}, {progress.name}</Text></View><Pressable accessibilityLabel="Поиск" onPress={onSearch} style={s.icon}><Ionicons name="search-outline" size={22} color={colors.text} /></Pressable><Pressable accessibilityLabel="Закладки" onPress={onBookmarks} style={s.icon}><Ionicons name="bookmark-outline" size={21} color={colors.text} /></Pressable></View>
    <Text style={s.title}>Твой английский.{"\n"}Каждый день.</Text>
    <MotionPressable accessibilityRole="button" onPress={() => next ? onJourney(next.id) : onLearningHub()}>
      <LinearGradient colors={['#6845DE', '#463094']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View pointerEvents="none" style={s.orbit} /><View pointerEvents="none" style={s.orbitSmall} />
        <View style={s.heroTop}><Text style={s.heroLabel}>ТВОЙ СЛЕДУЮЩИЙ ШАГ</Text><Ionicons name="sparkles" size={24} color="#D9CCFF" /></View>
        <Text style={s.heroTitle}>{next?.title || 'Новый вызов'}</Text>
        <Text style={s.heroSubtitle}>{next ? next.subtitle : 'Все темы пройдены. Выбери навык для практики.'}</Text>
        <View style={s.heroBottom}><Text style={s.heroButton}>{next ? 'Продолжить тему' : 'Выбрать практику'} →</Text><Text style={s.heroCount}>{progress.completed.length}/{lessons.length} тем</Text></View>
      </LinearGradient>
    </MotionPressable>
    <Pressable onPress={onQuickSession} style={s.quick}><View style={s.quickIcon}><Ionicons name="timer-outline" size={25} color={colors.purple} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{progress.quickSession && progress.quickSession.step < 3 ? 'Продолжить короткое занятие' : 'Всего 10 минут'}</Text><Text style={s.muted}>Тема, повторение и небольшой разговор</Text></View><Ionicons name="arrow-forward" size={21} color={colors.purple} /></Pressable>
    <View style={s.daily}><View style={s.dailyTop}><Text style={s.heading}>Маленькая цель дня</Text><Text style={s.accent}>{progress.dailyXP} / {progress.dailyGoal} XP</Text></View><ProgressBar value={progress.dailyXP / Math.max(1, progress.dailyGoal)} /><View style={s.dailyTop}><Text style={s.muted}>Каждое занятие — шаг вперёд</Text><Text style={s.streak}>🔥 {progress.streak} дн.</Text></View></View>
    <View style={s.section}><Text style={s.sectionTitle}>В своём темпе</Text><Text style={s.eyebrow}>ВЫБЕРИ НАВЫК</Text></View>
    <View style={s.grid}>{[['library-outline', 'Слова', 'С примерами и озвучкой', onReview, colors.accentSoft], ['flash-outline', 'Практика', 'Проверь свои знания', onAdaptive, colors.warningSoft], ['time-outline', 'Повторение', 'Закрепи изученное', onRetention, colors.successSoft], ['school-outline', 'Грамматика', 'Пойми, как устроен язык', onTenses, colors.dangerSoft]].map(([icon, title, subtitle, action, tint]) => <Pressable key={title} onPress={action} style={s.tile}><View style={[s.tileIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={23} color={colors.text} /></View><Text style={s.heading}>{title}</Text><Text style={s.muted}>{subtitle}</Text></Pressable>)}</View>
    <Pressable onPress={() => setPlanOpen(value => !value)} style={s.planToggle}><Text style={s.heading}>Мой план на сегодня</Text><Ionicons name={planOpen ? 'chevron-up' : 'chevron-down'} size={21} color={colors.textMuted} /></Pressable>
    {planOpen && <DailyLearningPlan progress={progress} next={next || lessons[0]} onLesson={onLesson} onJourney={onJourney} onRetention={onRetention} onMistakes={onMistakes} onReview={onReview} onDictation={onDictation} onLearningHub={onLearningHub} />}
    <SyncStatus onAccount={onAccount} onDetails={onSyncDetails} />
  </ScrollView>;
}
const s = createThemedStyles(() => ({
 content: { padding: 22, paddingBottom: 108, gap: 20 }, header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, eyebrow: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' }, greeting: { color: colors.textMuted, fontSize: 14, marginTop: 7 }, title: { color: colors.text, fontSize: 35, lineHeight: 41, letterSpacing: -1.2, fontWeight: '800' }, icon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
 hero: { borderRadius: 28, padding: 24, minHeight: 225, overflow: 'hidden', gap: 14 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroLabel: { color: '#DED4FF', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.6, maxWidth: '90%' }, heroSubtitle: { color: '#E8E0FF', fontSize: 14, lineHeight: 21, maxWidth: '85%' }, heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, heroButton: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, heroCount: { color: '#E8E0FF', fontSize: 12 }, orbit: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: '#FFFFFF22', right: -90, top: -80 }, orbitSmall: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#FFFFFF22', right: -50, top: -45 },
 quick: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 17, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, quickIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
 heading: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 }, muted: { color: colors.textMuted, fontSize: 12, lineHeight: 19 }, daily: { gap: 14, paddingVertical: 3 }, dailyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, accent: { color: colors.purple, fontSize: 12, fontWeight: '700' }, streak: { color: colors.text, fontSize: 12, fontWeight: '700' }, section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 22, padding: 18, gap: 8, borderWidth: 1, borderColor: colors.border }, tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, planToggle: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
