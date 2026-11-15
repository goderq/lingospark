import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lessons } from '../data/course';
import { useProgress } from '../store/ProgressContext';
import { retentionDeck, retentionSummary } from '../utils/retention';
import { evaluateExercise } from '../utils/answer';
import { colors } from '../theme';
import ExplanationCard from '../components/ExplanationCard';

const date = value => new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function RetentionScreen({ onClose }) {
  const { progress, recordRetention } = useProgress();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const summary = retentionSummary(progress, lessons, now);
  const ordered = [...summary.due, ...summary.eligible.filter(lesson => !summary.due.includes(lesson))];
  const exercise = session?.deck[answers.length];
  const start = lesson => {
    const dueAt = progress.retention?.[lesson.id]?.dueAt;
    if (!dueAt || dueAt > Date.now()) return;
    setSession({ lesson, dueAt, deck: retentionDeck(lesson) });
    setAnswers([]); setSelected(null); setFinished(false);
  };
  const submit = () => {
    if (selected === null || !exercise || finished) return;
    const next = [...answers, { id: exercise.id, input: selected }];
    setAnswers(next); setSelected(null);
    if (next.length === session.deck.length) {
      recordRetention(session.lesson.id, session.dueAt, next);
      setFinished(true);
    }
  };
  const correct = finished ? session.deck.filter((item, i) => evaluateExercise(item, answers[i].input).correct).length : 0;
  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable accessibilityLabel="Назад" hitSlop={10} onPress={session ? () => setSession(null) : onClose} style={s.back}>
          <Ionicons name="chevron-back" size={26} color="white" />
        </Pressable>
        <Text style={s.title}>Проверка памяти</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {!session ? <>
          <Text style={s.body}>Урок пройден — теперь проверим, что осталось в памяти. Две проверки с результатом от 80% закрепляют урок. Интервалы: 1 день, затем 3 дня; дальше — раз в неделю.</Text>
          <Text style={s.accent}>Закреплено: {summary.verified} из {summary.eligible.length} · На сегодня: {summary.due.length}</Text>
          <Text style={s.body}>Подсказок нет. Ответы и разбор появятся только после всей проверки. При выходе незавершённая попытка не засчитывается.</Text>
          {!summary.eligible.length && <Text style={s.title}>Сначала пройди первый урок курса.</Text>}
          {ordered.map(lesson => {
            const entry = progress.retention?.[lesson.id];
            const due = entry?.dueAt <= now;
            return <Pressable key={lesson.id} disabled={!due} onPress={() => start(lesson)} style={s.card}>
              <Text style={s.title}>{lesson.title}</Text>
              <Text style={s.body}>{entry?.verifiedAt ? 'Закреплено' : 'Урок пройден · ещё закрепляем'}{entry?.attempts ? ` · последняя проверка ${entry.accuracy}%` : ''}</Text>
              <Text style={due ? s.accent : s.body}>{due ? 'Начать проверку →' : entry ? `Проверка: ${date(entry.dueAt)}` : 'Проверка появится через день'}</Text>
            </Pressable>;
          })}
        </> : finished ? <>
          <Text style={s.title}>Результат: {correct} из {session.deck.length}</Text>
          <Text style={s.body}>{Math.round(correct / session.deck.length * 100) >= 80 ? 'Хороший результат! Следующая проверка поможет сохранить навык.' : 'Материал ещё нужно повторить. Следующая проверка будет через день.'}</Text>
          {progress.retention?.[session.lesson.id]?.dueAt && <Text style={s.accent}>Следующая проверка: {date(progress.retention[session.lesson.id].dueAt)}</Text>}
          {session.deck.map((item, i) => <View key={item.id} style={s.card}>
            <Text style={s.title}>{item.prompt}</Text>
            <Text style={s.body}>Твой ответ: {answers[i].input}</Text>
            <Text style={{ ...s.body, color: evaluateExercise(item, answers[i].input).correct ? colors.mint : colors.orange }}>Правильный ответ: {item.answer}</Text>
            <ExplanationCard item={item} selected={answers[i].input} correct={evaluateExercise(item, answers[i].input).correct} context={{ topic: session.lesson.title }} showStatus={false} />
          </View>)}
          <Pressable style={s.button} onPress={() => setSession(null)}><Text style={s.buttonText}>К проверкам</Text></Pressable>
        </> : <>
          <Text style={s.body}>{session.lesson.title} · {answers.length + 1} из {session.deck.length}</Text>
          <Text style={s.title}>{exercise.prompt}</Text>
          {exercise.options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: selected === option }} onPress={() => setSelected(option)} style={[s.card, selected === option && s.selected]}>
            <Text style={s.option}>{option}</Text>
          </Pressable>)}
          <Pressable disabled={selected === null} onPress={submit} style={[s.button, selected === null && { opacity: 0.4 }]}><Text style={s.buttonText}>{answers.length + 1 === session.deck.length ? 'Завершить проверку' : 'Следующий вопрос'}</Text></Pressable>
        </>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  back: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: colors.card },
  content: { padding: 20, paddingBottom: 50, gap: 18 },
  title: { color: 'white', fontSize: 21, fontWeight: '800', flexShrink: 1 },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  accent: { color: colors.mint, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 10 },
  selected: { borderColor: colors.purple, backgroundColor: '#252044' },
  option: { color: 'white', fontSize: 18, lineHeight: 26 },
  button: { backgroundColor: colors.purple, padding: 20, borderRadius: 20, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '800' },
});
