import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { lessons } from '../data/course';
import { buildPracticeDeck } from '../data/practiceCatalog';
import { buildUnifiedReview, validatePracticeSession } from '../utils/unifiedReview';
import { evaluateExercise } from '../utils/answer';
import { balancedOptions } from '../utils/shuffle';
import { speak, stopSpeech } from '../utils/speech';
import { useProgress } from '../store/ProgressContext';
import { PrimaryButton } from '../components/UI';
import { colors } from '../theme';
import useScreenTiming from '../components/useScreenTiming';

const skillNames = { mixed: 'Все навыки', grammar: 'Грамматика', vocabulary: 'Выражения', listening: 'Слух', writing: 'Письмо' };

export default function PracticeScreen({ onClose, review = false, initialMode = 'learn', initialLevel, initialSkill = 'mixed', onRetention, presetDeck, sessionKey, title, onComplete }) {
  useScreenTiming('practice_open');
  const { progress, savePracticeDraft, completePractice, clearPracticeDraft } = useProgress();
  const draftKey = sessionKey || (review ? 'unified-review' : initialMode === 'exam' ? 'common-exam' : 'common-practice');
  const saved = progress.practiceDrafts?.[draftKey];
  const [session, setSession] = useState(() => validatePracticeSession(saved) ? saved : null);
  const [mode, setMode] = useState(initialMode);
  const [level, setLevel] = useState(initialLevel || progress.learnerLevel?.replace('+', '') || 'A1');
  const [skill, setSkill] = useState(initialSkill);
  const [topicId, setTopicId] = useState('all');
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  const scroll = useRef(null);
  const completedRef = useRef(null);
  const current = session?.deck[session.index];
  const options = useMemo(() => current?.type === 'choice' ? balancedOptions(current.options, current.answer, session.index, session.seed) : current?.options || [], [current, session?.index, session?.seed]);
  const typed = current?.type === 'build' ? (session?.built || []).map(i => options[i]).join(' ') : session?.input || '';
  useEffect(() => {
    if (session && !finished) savePracticeDraft(draftKey, session);
  }, [session, finished, draftKey, savePracticeDraft]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [session?.index, finished]);
  useEffect(() => () => { stopSpeech(); }, []);
  const start = async () => {
    setError(''); setBusy(true);
    try {
      let deck;
      if (review) {
        const { extendedWordBank } = await import('../data/wordBank');
        deck = buildUnifiedReview(progress, [...extendedWordBank, ...(progress.customWords || [])], lessons);
      } else deck = presetDeck || buildPracticeDeck({ level, skill, topicId, size });
      deck = deck.map(item => ({ ...item, type: item.type || (item.options ? 'choice' : 'translate') }));
      if (!deck.length) { setError(review ? 'На сегодня очередь пуста. Новые задания появятся после занятий и нужного перерыва.' : 'Для этого сочетания пока нет заданий. Выбери другую тему или навык.'); return; }
      setFinished(false);
      setSession({ version: 1, id: `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`, mode: presetDeck ? 'exam' : review ? 'review' : mode, deck, index: 0, input: '', built: [], checked: false, responses: [], assisted: false, help: false, seed: Math.floor(Math.random() * 1000000) });
    } catch (cause) { setError(cause.message || 'Не удалось подготовить задания'); }
    finally { setBusy(false); }
  };
  const check = () => {
    if (!session || session.checked || !typed.trim()) return;
    Keyboard.dismiss();
    setSession({ ...session, checked: true, responses: [...session.responses, { id: current.id, input: typed, assisted: !!session.assisted }] });
  };
  const next = () => {
    if (!session?.checked) return;
    if (session.index + 1 === session.deck.length) {
      if (completedRef.current === session.id) return;
      completedRef.current = session.id;
      completePractice(draftKey, session);
      const score = session.deck.filter((item, i) => evaluateExercise(item, session.responses[i].input).correct).length;
      onComplete?.(score, session.deck.length);
      setFinished(true);
    }
    else setSession({ ...session, index: session.index + 1, input: '', built: [], checked: false, assisted: false, help: false });
  };
  const exit = () => { if (session && !finished) savePracticeDraft(draftKey, session); Keyboard.dismiss(); onClose(); };
  const feedback = session?.checked && session.mode === 'learn';
  const correct = feedback && evaluateExercise(current, typed).correct;
  const results = finished ? session.deck.map((item, i) => ({ item, answer: session.responses[i], correct: evaluateExercise(item, session.responses[i].input).correct })) : [];
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
    <View style={s.header}><Pressable onPress={exit} style={s.back}><Text style={s.link}>← Назад</Text></Pressable><Text style={s.label}>{review ? 'Единое повторение' : 'Практика'}</Text></View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>
      {!session ? <>
        <Text style={s.title}>{title || (review ? 'Повтори в нужный момент' : 'Одна практика — разные навыки')}</Text>
        <Text style={s.text}>{review ? 'Здесь встречаются ошибки, слова, сохранённые фразы и проверки памяти курса. Вопросы выбираются по сроку. Ответы откроются после всей сессии.' : 'В обучении можно открыть помощь. В самопроверке ответов и подсказок нет до конца. Результат с помощью сохраняется отдельно.'}</Text>
        {!!presetDeck && <Text style={s.text}>{presetDeck.length} вопросов. Подсказки, правильные ответы и разбор скрыты до конца. Результат учебной проверки не подтверждает CEFR или официальный IELTS Band.</Text>}
        {!review && !presetDeck && <>
          <Chips values={['learn', 'exam']} selected={mode} onSelect={setMode} labels={{ learn: 'Обучение', exam: 'Самопроверка' }} />
          <Chips values={['A1', 'A2', 'B1', 'B2', 'C1']} selected={level} onSelect={value => { setLevel(value); setTopicId('all'); }} />
          <Chips values={Object.keys(skillNames)} selected={skill} onSelect={setSkill} labels={skillNames} />
          <Chips values={[5, 10, 20]} selected={size} onSelect={setSize} />
          <Text style={s.label}>Тема</Text><ScrollView horizontal contentContainerStyle={s.chips} showsHorizontalScrollIndicator={false}>
            {[{ id: 'all', title: 'Все темы' }, ...lessons.filter(item => item.difficulty.replace('+', '') === level)].map(item => <Pressable key={item.id} onPress={() => setTopicId(item.id)} style={[s.chip, topicId === item.id && s.selected]}><Text style={s.chipText}>{item.title}</Text></Pressable>)}
          </ScrollView>
        </>}
        {!!error && <Text style={s.warning}>{error}</Text>}
        <PrimaryButton title={busy ? 'Подготовка…' : review ? 'Начать повторение' : 'Начать практику'} disabled={busy} onPress={start} />
        {review && <PrimaryButton title="Расписание проверок уроков" color={colors.cardLight} onPress={onRetention} />}
      </> : finished ? <>
        <Text style={s.title}>Результат: {results.filter(item => item.correct).length}/{results.length}</Text>
        <Text style={s.success}>+{progress.practiceResults?.[session.id]?.earnedXP || 0} XP · за самостоятельные верные ответы, один раз за вопрос в день</Text>
        <Text style={s.text}>Самостоятельно верно: {results.filter(item => item.correct && !item.answer.assisted).length}. С подсказкой: {results.filter(item => item.answer.assisted).length}. Повторная практика не выдаёт повторно награду за прохождение курса.</Text>
        {results.map(({ item, answer, correct }, i) => <View key={i} style={s.card}>
          <Text style={s.heading}>{item.prompt}</Text><Text style={s.text}>Твой ответ: {answer.input}</Text>
          <Text style={correct ? s.success : s.warning}>Ответ: {item.answer}{answer.assisted ? ' · с помощью' : ''}</Text>
          {!!item.explanation && <Text style={s.text}>{item.explanation}</Text>}
        </View>)}
        <PrimaryButton title={presetDeck ? 'Завершить' : 'К настройкам практики'} onPress={presetDeck ? onClose : () => { setSession(null); setFinished(false); }} />
      </> : <>
        <Text style={s.label}>{session.mode === 'learn' ? 'ОБУЧЕНИЕ' : 'БЕЗ ПОДСКАЗОК'} · {session.index + 1}/{session.deck.length}</Text>
        <Text style={s.text}>{current.topic || ''}{current.reason ? ` · ${current.reason}` : ''}</Text>
        <Text style={s.title}>{current.prompt}</Text>
        {!!current.context && <View style={s.card}><Text style={s.text}>{current.context}</Text></View>}
        {!!current.audio && <PrimaryButton title="Послушать запись" onPress={() => speak(current.audio, { language: 'en-US', rate: 0.85 })} />}
        {current.skill === 'listening' && <PrimaryButton title="Послушать фразу" onPress={() => speak(current.speak, { language: 'en-US', rate: 0.8 })} />}
        {current.type === 'choice' ? options.map(option => <Pressable key={option} disabled={session.checked} onPress={() => setSession({ ...session, input: option })} style={[s.card, session.input === option && s.selected]}><Text style={s.heading}>{option}</Text></Pressable>) : current.type === 'build' ? <>
          <View style={s.chips}>{session.built.map((tile, i) => <Pressable key={i} disabled={session.checked} onPress={() => setSession({ ...session, built: session.built.filter((_, index) => i !== index) })} style={s.chip}><Text style={s.chipText}>{options[tile]}</Text></Pressable>)}</View>
          <View style={s.chips}>{options.map((word, i) => <Pressable key={i} disabled={session.checked || session.built.includes(i)} onPress={() => setSession({ ...session, built: [...session.built, i] })} style={[s.chip, session.built.includes(i) && { opacity: 0.25 }]}><Text style={s.chipText}>{word}</Text></Pressable>)}</View>
        </> : <TextInput editable={!session.checked} value={session.input} onChangeText={input => setSession({ ...session, input })} placeholder={/[а-яё]/i.test(current.answer) ? 'Ответ на русском…' : 'Ответ на английском…'} placeholderTextColor={colors.textMuted} autoCorrect={false} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={s.input} />}
        {!session.checked && session.mode === 'learn' && <PrimaryButton title={session.help ? 'Помощь открыта' : 'Открыть помощь'} color={colors.cardLight} onPress={() => setSession({ ...session, help: true, assisted: true })} />}
        {session.help && <Text style={s.warning}>Пример: {current.answer}. Этот ответ будет отмечен как выполненный с помощью.</Text>}
        {feedback && <View style={s.card}><Text style={correct ? s.success : s.warning}>{correct ? 'Верно!' : `Ответ: ${current.answer}`}</Text><Text style={s.text}>{current.explanation || 'Сравни смысл и форму ответа с исходным заданием.'}</Text></View>}
        {!session.checked && <Pressable onPress={Keyboard.dismiss} style={s.back}><Text style={s.link}>Скрыть клавиатуру</Text></Pressable>}
        <PrimaryButton disabled={!session.checked && !typed.trim()} title={session.checked ? session.index + 1 === session.deck.length ? 'Завершить и посмотреть разбор' : 'Следующий вопрос' : 'Ответить'} onPress={session.checked ? next : check} />
        <Pressable onPress={() => Alert.alert('Начать заново?', 'Текущий черновик будет удалён. Результат незавершённой попытки не засчитывается.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Начать заново', style: 'destructive', onPress: () => { clearPracticeDraft(draftKey); setSession(null); } }])} style={s.back}><Text style={s.link}>Сменить настройки</Text></Pressable>
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Chips({ values, selected, onSelect, labels = {} }) { return <View style={s.chips}>{values.map(value => <Pressable key={value} onPress={() => onSelect(value)} style={[s.chip, selected === value && s.selected]}><Text style={s.chipText}>{labels[value] || value}</Text></Pressable>)}</View>; }
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 45, gap: 18 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { minHeight: 48, justifyContent: 'center' }, link: { color: colors.purple, fontSize: 16 }, label: { color: colors.mint, fontSize: 13, fontWeight: '800', flexShrink: 1 }, title: { color: 'white', fontSize: 25, fontWeight: '800' }, heading: { color: 'white', fontSize: 18, lineHeight: 27 }, text: { color: colors.textMuted, fontSize: 16, lineHeight: 24 }, card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12 }, selected: { borderColor: colors.purple, backgroundColor: '#252044' }, success: { color: colors.mint, fontSize: 16 }, warning: { color: colors.orange, fontSize: 16, lineHeight: 24 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, chip: { padding: 14, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border }, chipText: { color: 'white', fontWeight: '700' }, input: { padding: 20, borderRadius: 17, backgroundColor: colors.card, color: 'white', fontSize: 19, minHeight: 68 } });
