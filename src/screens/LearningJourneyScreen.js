import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getJourney } from '../data/learningJourney';
import { stageAvailable, gradeJourneyStage, readJourneyDraft, isJourneyUnlocked } from '../utils/learningJourney';
import { evaluateExercise } from '../utils/answer';
import { balancedOptions } from '../utils/shuffle';
import { speak, stopSpeech } from '../utils/speech';
import { useProgress } from '../store/ProgressContext';
import { colors } from '../theme';
import ExplanationCard from '../components/ExplanationCard';
import { getCoursePracticePhrases } from '../data/courseDialogues';
import useScreenTiming from '../components/useScreenTiming';

export default function LearningJourneyScreen({ topicId = 'greetings', onClose, onCourse, onTest, onRetention, onAI, onWorld }) {
  useScreenTiming('journey_open');
  const { progress } = useProgress();
  const journey = getJourney(topicId);
  const [active, setActive] = useState(null);
  if (!journey) return <View style={s.content}><Text style={s.title}>Тема пока недоступна</Text><Button title="Назад" onPress={onClose} /></View>;
  if (!isJourneyUnlocked(progress, topicId)) return <View style={s.content}><Text style={s.title}>Сначала пройди предыдущий урок курса</Text><Button title="Назад" onPress={onClose} /></View>;
  if (active) return <JourneyStage key={active} journey={journey} stage={journey.stages.find(item => item.id === active)} onClose={() => setActive(null)} />;
  const saved = progress.journeys?.[topicId] || {};
  const done = journey.stages.filter(stage => saved.stages?.[stage.id]?.completedAt).length;
  const courseDone = progress.completed.includes(topicId);
  return <View style={s.root}>
    <Header title={journey.title} onClose={onClose} />
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.label}>МАРШРУТ · {journey.level}</Text>
      <Text style={s.title}>{journey.goal}</Text>
      <Text style={s.muted}>Пройдено этапов: {done}/{journey.stages.length}. Ошибки ведут к разбору; жизни здесь не теряются.</Text>
      {journey.stages.map((stage, index) => {
        const available = stageAvailable(progress, topicId, stage.id);
        const state = saved.stages?.[stage.id];
        const draft = saved.draft?.stageId === stage.id;
        return <Pressable key={stage.id} disabled={!available} onPress={() => setActive(stage.id)} style={[s.card, !available && { opacity: 0.5 }]}>
          <Text style={s.stepTitle}>{index + 1}. {stage.title} {state?.completedAt ? '✓' : !available ? '🔒' : ''}</Text>
          <Text style={s.muted}>{!available ? 'Сначала заверши предыдущий этап' : draft ? 'Продолжить с сохранённого места →' : state?.attempts ? `Последняя попытка ${state.accuracy}% · повторить →` : `${stage.exercises.length} задания · начать →`}</Text>
        </Pressable>;
      })}
      <Text style={s.stepTitle}>Проверь тему без подсказок</Text>
      <Text style={s.muted}>После пяти учебных этапов пройди самопроверку. От 80% — тема пройдена и открыт следующий курс. Закрепление памяти проверяется отдельно после перерыва.</Text>
      <Button disabled={done < journey.stages.length && !courseDone} title={courseDone ? 'Повторить самопроверку' : 'Самопроверка темы'} onPress={() => onTest(topicId)} />
      <Button title={progress.lessonDraft?.lessonId === topicId ? 'Продолжить сохранённую практику' : 'Дополнительная практика с разбором'} onPress={() => onCourse(topicId)} secondary />
      <Button title="Проверки памяти и расписание" onPress={onRetention} secondary />
      <Text style={s.stepTitle}>Примени в разговоре</Text>
      <Text style={s.muted}>ИИ получит тему и цель этой встречи. Модель устанавливается по выбору в разделе ИИ. Учебные этапы выше работают без неё.</Text>
      <Button title="Продолжить эту тему с ИИ" onPress={() => onAI({ ...journey.ai, topicId, goal: journey.goal, focusMistakeIds: (progress.mistakes || []).filter(item => item.topic === journey.title).slice(0, 3).map(item => item.id), phrases: getCoursePracticePhrases(topicId) })} />
      <Button title="Открыть «Английскую жизнь»" onPress={onWorld} secondary />
      <Text style={s.muted}>Примени изученные выражения в подходящей сцене мира. Прохождение мира не засчитывается автоматически.</Text>
    </ScrollView>
  </View>;
}

export function JourneyStage({ journey, stage, onClose, onDone, onComplete }) {
  const { progress, saveJourneyDraft, completeJourneyStage } = useProgress();
  const draft = progress.journeys?.[journey.id]?.draft;
  const initial = readJourneyDraft(journey.id, stage.id, draft);
  const [index, setIndex] = useState(Math.min(initial.index || 0, stage.exercises.length - 1));
  const [responses, setResponses] = useState(initial.responses || []);
  const [input, setInput] = useState(initial.input || '');
  const [built, setBuilt] = useState(initial.built || []);
  const [checked, setChecked] = useState(!!initial.checked);
  const [teaching, setTeaching] = useState(initial.teaching ?? stage.cards.length > 0);
  const [details, setDetails] = useState(false);
  const [result, setResult] = useState(null);
  const [attemptId] = useState(initial.attemptId || `journey-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [seed] = useState(initial.seed || Math.floor(Math.random() * 1000000));
  const scroll = useRef(null);
  const exercise = stage.exercises[index];
  const options = useMemo(() => exercise.type === 'choice' ? balancedOptions(exercise.options, exercise.answer, index, seed) : exercise.options || [], [exercise, index, seed]);
  const current = exercise.type === 'build' ? built.map(i => options[i]).join(' ') : input;
  const evaluation = checked ? evaluateExercise(exercise, current) : null;
  useEffect(() => {
    if (result) return;
    saveJourneyDraft(journey.id, { version: 1, stageId: stage.id, index, responses, input, built, checked, teaching, attemptId, seed });
  }, [index, responses, input, built, checked, teaching, result, attemptId, seed, journey.id, stage.id, saveJourneyDraft]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [index, teaching, result]);
  useEffect(() => () => { stopSpeech(); }, []);
  const check = () => {
    if (checked || !current.trim()) return;
    Keyboard.dismiss();
    setResponses([...responses.slice(0, index), { id: exercise.id, input: current }]);
    setChecked(true);
  };
  const next = () => {
    if (!checked) return;
    if (index + 1 === stage.exercises.length) {
      const grade = gradeJourneyStage(journey.id, stage.id, responses);
      completeJourneyStage(journey.id, stage.id, responses, attemptId);
      setResult(grade);
      onComplete?.(grade);
    } else {
      setIndex(index + 1); setInput(''); setBuilt([]); setChecked(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
    <Header title={stage.title} onClose={onClose} />
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>
      {result ? <>
        <Text style={s.title}>{result.passed ? 'Этап пройден ✓' : 'Давай ещё потренируемся'}</Text>
        <Text style={s.muted}>Верно {result.correct} из {result.total} · {result.accuracy}%. Для следующего этапа нужно от 80%. Это результат заданий, а не оценка уровня языка.</Text>
        <Button title={onDone ? 'Продолжить короткое занятие' : 'Вернуться к маршруту'} onPress={onDone ? () => onDone(result) : onClose} />
      </> : teaching ? <>
        <Text style={s.muted}>{stage.intro}</Text>
        {stage.cards.some(card => card.detail) && <Button title={details ? 'Объясни проще' : 'Подробнее и с нюансами'} onPress={() => setDetails(!details)} secondary />}
        {stage.cards.map(card => <View style={s.card} key={card.title}>
          <Text style={s.stepTitle}>{card.title}</Text>
          <Text style={s.body}>{details && card.detail ? card.detail : card.simple}</Text>
          <Text style={s.example}>{card.example}</Text><Text style={s.muted}>{card.translation}</Text>
          <Button title="Послушать пример" onPress={() => speak(card.example.split(' / ')[0], { language: 'en-US', rate: 0.8 })} secondary />
        </View>)}
        <Button title="Попробовать самостоятельно" onPress={() => setTeaching(false)} />
      </> : <>
        <Text style={s.label}>{index + 1} ИЗ {stage.exercises.length} · {journey.title}</Text>
        <Text style={s.muted}>{stage.intro}</Text>
        {!!exercise.line && <View style={s.card}><Text style={s.example}>{exercise.speaker || 'Собеседник'}: {exercise.line}</Text><Button title="Послушать реплику" onPress={() => speak(exercise.line, { language: 'en-US' })} secondary /></View>}
        <Text style={s.title}>{exercise.prompt}</Text>
        {stage.mode === 'listen' && <View style={s.card}>
          <Button title="Послушать" onPress={() => speak(exercise.speak, { language: 'en-US', rate: 0.9 })} />
          <Button title="Медленнее" onPress={() => speak(exercise.speak, { language: 'en-US', rate: 0.65 })} secondary />
        </View>}
        {exercise.type === 'choice' ? options.map(option => <Pressable key={option} disabled={checked} onPress={() => setInput(option)} style={[s.card, input === option && s.selected]}><Text style={s.body}>{option}</Text></Pressable>) : exercise.type === 'build' ? <>
          <View style={s.tiles}>{built.map((tile, position) => <Pressable key={position} disabled={checked} onPress={() => setBuilt(built.filter((_, i) => position !== i))} style={s.tile}><Text style={s.body}>{options[tile]}</Text></Pressable>)}</View>
          <View style={s.tiles}>{options.map((word, tile) => <Pressable key={tile} disabled={checked || built.includes(tile)} onPress={() => setBuilt([...built, tile])} style={[s.tile, built.includes(tile) && { opacity: 0.25 }]}><Text style={s.body}>{word}</Text></Pressable>)}</View>
        </> : <TextInput value={input} onChangeText={setInput} editable={!checked} placeholder="Напиши по-английски…" placeholderTextColor={colors.textMuted} style={s.input} autoCorrect={false} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />}
        {!checked && <Button title="Скрыть клавиатуру" onPress={Keyboard.dismiss} secondary />}
        {checked && <ExplanationCard key={exercise.id} item={exercise} selected={current} correct={evaluation.correct} />}
        <Button title={checked ? index + 1 === stage.exercises.length ? 'Результат этапа' : 'Дальше' : 'Проверить'} disabled={!current.trim()} onPress={checked ? next : check} />
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Header({ title, onClose }) { return <View style={s.header}><Pressable accessibilityLabel="Назад" onPress={onClose} style={s.back}><Ionicons name="chevron-back" size={25} color="white" /></Pressable><Text style={s.stepTitle}>{title}</Text></View>; }
function Button({ title, onPress, secondary, disabled }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: 0.4 }]}><Text style={s.buttonText}>{title}</Text></Pressable>; }
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 45, gap: 18 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.card },
  title: { fontSize: 25, fontWeight: '800', color: 'white' }, stepTitle: { fontSize: 19, fontWeight: '800', color: 'white', flexShrink: 1 }, label: { color: colors.purple, fontWeight: '800', fontSize: 13 },
  body: { color: 'white', fontSize: 17, lineHeight: 26 }, muted: { color: colors.textMuted, fontSize: 15, lineHeight: 23 }, example: { color: colors.mint, fontSize: 19, lineHeight: 28 },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 }, selected: { borderColor: colors.purple },
  button: { backgroundColor: colors.purple, borderRadius: 16, padding: 17, minHeight: 52, alignItems: 'center' }, secondary: { backgroundColor: colors.cardLight }, buttonText: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  input: { backgroundColor: colors.card, borderRadius: 16, color: 'white', padding: 20, fontSize: 19, minHeight: 65 }, tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, minHeight: 50 }, tile: { backgroundColor: colors.cardLight, padding: 14, borderRadius: 13 },
});
