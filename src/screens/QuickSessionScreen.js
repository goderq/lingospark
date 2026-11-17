import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { getJourney } from '../data/learningJourney';
import { getCourseDialogue, getCoursePracticePhrases } from '../data/courseDialogues';
import { nextLearningStep, readQuickSession } from '../utils/learningContinuation';
import { useProgress } from '../store/ProgressContext';
import { JourneyStage } from './LearningJourneyScreen';
import CourseTestScreen from './CourseTestScreen';
import PracticeScreen from './PracticeScreen';
import { PrimaryButton } from '../components/UI';
import { colors } from '../theme';

const names = ['Продолжить тему', 'Повторить по сроку', 'Письменный разговор'];
export default function QuickSessionScreen({ onClose, onJourney, onAI, onRetention }) {
  const { progress, saveQuickSession, clearPracticeDraft } = useProgress();
  const [session, setSession] = useState(() => readQuickSession(progress.quickSession, progress));
  const [active, setActive] = useState(null);
  const next = nextLearningStep(progress);
  const journey = getJourney(session?.topicId || next.topicId);
  useEffect(() => { if (session) saveQuickSession(session); }, [session, saveQuickSession]);
  const dialogue = useMemo(() => getCourseDialogue(journey.id).map((item, i) => ({ ...item, id: `quick-dialogue-${journey.id}-${i}`, type: 'translate', skill: 'conversation', context: `${item.speaker}: ${item.line}`, topic: journey.title, explanation: `Допустимый ответ: ${item.answer}` })), [journey.id]);
  const begin = () => {
    const target = nextLearningStep(progress);
    clearPracticeDraft('quick-review'); clearPracticeDraft('quick-dialogue');
    setSession({ version: 1, id: `quick-${Date.now()}`, topicId: target.topicId, stageId: target.stageId, step: 0, results: [] });
    setActive(0);
  };
  useEffect(() => {
    if (!session) begin();
    else if (session.step < 3) setActive(session.step);
  }, []);
  const finish = (step, correct, total, skipped = false) => setSession(old => old?.step === step ? { ...old, step: step + 1, results: [...old.results, { correct, total, skipped }] } : old);
  const pause = () => setActive(null);
  if (active === 0 && session) {
    const stage = journey.stages.find(item => item.id === session.stageId);
    return stage ? <JourneyStage journey={journey} stage={stage} onClose={pause} onComplete={grade => finish(0, grade.correct, grade.total)} onDone={pause} />
      : <CourseTestScreen topicId={journey.id} onClose={pause} onComplete={(score, total) => finish(0, score, total)} />;
  }
  if (active === 1 && session) return <View style={{ flex: 1 }}>
    {session.step === 1 && <Pressable onPress={() => Alert.alert('Пропустить повторение?', 'Проверки не будут засчитаны. Их срок сохранится.', [{ text: 'Остаться', style: 'cancel' }, { text: 'Пропустить', onPress: () => { finish(1, 0, 0, true); pause(); } }])} style={{ padding: 16, minHeight: 48 }}><Text style={{ color: colors.textMuted }}>Нет времени или очередь пуста? Пропустить шаг</Text></Pressable>}
    <PracticeScreen review reviewLimit={5} sessionKey="quick-review" onRetention={onRetention} onClose={pause} onComplete={(score, total) => finish(1, score, total)} />
  </View>;
  if (active === 2 && session) return <PracticeScreen presetDeck={dialogue} presetMode="learn" title={`Разговор: ${journey.title}`} sessionKey="quick-dialogue" onClose={pause} onComplete={(score, total) => finish(2, score, total)} />;
  const complete = session?.step === 3;
  return <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, gap: 20 }}>
    <Pressable onPress={onClose} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.purple, fontSize: 17 }}>← Назад</Text></Pressable>
    <Text style={{ color: 'white', fontSize: 29, fontWeight: '800' }}>{complete ? 'Короткое занятие завершено' : 'Английский за 10 минут'}</Text>
    <Text style={{ color: colors.textMuted, lineHeight: 25, fontSize: 16 }}>Один этап темы, до пяти вопросов повторения и две письменные реплики. Время примерное: можно остановиться и продолжить позже.</Text>
    <Text style={{ color: colors.mint, fontSize: 20 }}>{journey.title}</Text>
    {names.map((name, index) => <View key={name} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 20, gap: 10 }}>
      <Text style={{ color: 'white', fontSize: 19, fontWeight: '700' }}>{index + 1}. {name}</Text>
      <Text style={{ color: colors.textMuted }}>{session?.results[index] ? session.results[index].skipped ? 'Пропущено — результат не засчитан' : `Верно ${session.results[index].correct}/${session.results[index].total}` : index === 0 ? session?.stageId ? journey.stages.find(stage => stage.id === session.stageId)?.title : next.stageTitle : index === 1 ? 'Только задания, срок которых наступил' : 'Собеседник и цель из этой же темы'}</Text>
    </View>)}
    {!session ? <PrimaryButton title="Начать занятие" onPress={begin} /> : !complete ? <PrimaryButton title={`Продолжить · ${names[session.step]}`} onPress={() => setActive(session.step)} /> : <>
      <Text style={{ color: colors.textMuted, lineHeight: 24 }}>Самостоятельная точность и ответы с помощью сохраняются в обычных результатах. Пропущенный шаг не считается выполненным; следующий курс открывается по правилам маршрута.</Text>
      <PrimaryButton title="К учебной теме" onPress={() => onJourney(journey.id)} />
      <PrimaryButton title="Продолжить тему с ИИ" onPress={() => onAI({ ...journey.ai, topicId: journey.id, goal: journey.goal, phrases: getCoursePracticePhrases(journey.id) })} />
      <PrimaryButton title="Новое короткое занятие" onPress={begin} />
    </>}
  </ScrollView>;
}
