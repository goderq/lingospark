import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { retentionSummary } from '../utils/retention';
import { colors , useTheme, createThemedStyles } from '../theme';
import { nextLearningStep } from '../utils/learningContinuation';

export default function DailyLearningPlan({ progress, next, onLesson, onRetention, onMistakes, onReview, onDictation, onLearningHub, onJourney }) {
  useTheme();
  const memory = retentionSummary(progress, lessons);
  const allDone = progress.completed.length === lessons.length;
  const hasMistakes = progress.mistakes?.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const fullTopic = !allDone && onJourney && progress.lessonDraft?.lessonId !== next.id;
  const actions = progress.dailyActions?.date === today ? progress.dailyActions : {};
  const continuation = nextLearningStep(progress, next.id);
  const steps = [
    { title: allDone ? 'Выбрать новую практику' : next.title,
      reason: allDone ? 'Все уроки курса пройдены — попробуй другой навык в каталоге.' : fullTopic ? `${continuation.resumed ? 'Продолжи сохранённый этап' : 'Следующий этап'}: ${continuation.stageTitle}.` : progress.lessonDraft?.lessonId === next.id ? 'У тебя есть незаконченный урок. Продолжи с сохранённого места.' : 'Следующий урок по порядку: предыдущие темы уже пройдены.',
      done: actions.lessons > 0, action: allDone ? onLearningHub : fullTopic ? () => onJourney(next.id) : () => onLesson(next) },
    memory.eligible.length || Object.keys(progress.reviewStats || {}).length || Object.keys(progress.reviewQueue || {}).length ? { title: 'Единое повторение',
      reason: memory.due.length ? `Пора проверить память: ${memory.due.length} уроков. В очередь также попадут слова и ошибки по сроку.` : 'Слова, фразы и ошибки выбираются по сроку. Если очередь пуста, приложение предложит отдохнуть.',
      done: actions.unifiedReviews > 0 || Object.values(progress.retention || {}).some(entry => entry.lastCheckedAt && new Date(entry.lastCheckedAt).toISOString().slice(0, 10) === today), action: onRetention }
      : { title: 'Короткий диктант', reason: 'Чередуй чтение и слух: послушай фразу и запиши её.', done: actions.dictations > 0, action: onDictation },
    { title: hasMistakes ? 'Разобрать свои ошибки' : 'Практика слов',
      reason: hasMistakes ? `В списке ошибок ${progress.mistakes.length} записей. Повтори то, что пока вызывает трудности.` : 'Ошибок в списке нет. Пополни словарь на выбранном уровне.',
      done: !hasMistakes && actions.reviews > 0, action: hasMistakes ? onMistakes : onReview },
  ];
  return <View style={s.plan}>
    <Text style={s.title}>Твой следующий шаг</Text>
    <Text style={s.caption}>Пройдено {progress.completed.length}/{lessons.length} · Закреплено {memory.verified}</Text>
    {steps.map((step, i) => <Pressable key={i} accessibilityRole="button" onPress={step.action} style={s.step}>
      <View style={s.number}>{step.done ? <Ionicons name="checkmark" size={21} color={colors.mint} /> : <Text style={s.numberText}>{i + 1}</Text>}</View>
      <View style={s.body}><Text style={s.stepTitle}>{step.title}</Text><Text style={s.reason}>{step.reason}</Text>{step.done && <Text style={s.done}>Сегодня уже занимался ✓</Text>}</View>
      <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
    </Pressable>)}
  </View>;
}

const s = createThemedStyles(() => ({
  plan: { borderRadius: 24, backgroundColor: colors.card, padding: 18, marginBottom: 20, gap: 12 },
  title: { fontSize: 23, fontWeight: '800', color: colors.text },
  caption: { fontSize: 15, color: colors.mint },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  number: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: colors.purple, fontWeight: '800', fontSize: 16 },
  body: { flex: 1, gap: 6 },
  stepTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  reason: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  done: { color: colors.mint, fontSize: 13 },
}));
