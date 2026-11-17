import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { skillSprintQuestions } from '../data/skillSprint';
import { useProgress } from '../store/ProgressContext';
import { colors } from '../theme';
import { PrimaryButton, ProgressBar } from '../components/UI';
import { balancedOptions, shuffleOptions } from '../utils/shuffle';
import { expandExplanation } from '../utils/explanations';
import { evaluateExercise } from '../utils/answer';

export default function SkillSprintScreen({ onClose }) {
  const { recordExercise } = useProgress();
  const [seed] = useState(() => Date.now());
  const deck = useMemo(() => shuffleOptions(skillSprintQuestions, seed), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const item = deck[index];
  const right = evaluateExercise(item, selected).correct;
  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const correct = evaluateExercise(item, option).correct;
    if (correct) setScore((value) => value + 1);
    recordExercise({ id: `sprint-${item.id}`, prompt: item.prompt, answer: item.answer, type: item.type }, correct, { selected: option, topic: 'Гибкая практика' });
  };
  const next = () => {
    if (index === deck.length - 1) setDone(true);
    else { setIndex((value) => value + 1); setSelected(''); }
  };
  if (done) return <View style={s.container}><Header onClose={onClose} /><View style={s.result}><Text style={s.resultEmoji}>{score >= 13 ? '🏆' : '🧠'}</Text><Text style={s.resultTitle}>{score}/{deck.length}</Text><Text style={s.resultText}>Ошибки добавлены в персональное повторение</Text><View style={{ width: '100%', marginTop: 24 }}><PrimaryButton title="Завершить" onPress={onClose} /></View></View></View>;
  return <View style={s.container}><Header onClose={onClose} /><ScrollView contentContainerStyle={s.content}><ProgressBar value={(index + 1) / deck.length} color={colors.purple} /><Text style={s.meta}>{item.type} · {index + 1}/{deck.length}</Text><Text style={s.prompt}>{item.prompt}</Text>{balancedOptions(item.options, item.answer, index, seed).map((option) => <Pressable key={option} disabled={!!selected} onPress={() => choose(option)} style={[s.option, selected && evaluateExercise(item, (option)).correct && s.correct, selected === option && !evaluateExercise(item, (option)).correct && s.wrong]}><Text style={s.optionText}>{option}</Text>{selected && evaluateExercise(item, (option)).correct && <Ionicons name="checkmark-circle" size={21} color={colors.mint} />}</Pressable>)}{selected && <View style={s.explain}><Text style={[s.explainTitle, { color: right ? colors.mint : colors.orange }]}>{right ? 'Верно!' : `Правильный ответ: ${item.answer}`}</Text><Text style={s.explainText}>{expandExplanation(item, { selected, topic: item.type })}</Text></View>}{selected && <PrimaryButton title={index === deck.length - 1 ? 'Результат' : 'Следующее задание'} onPress={next} color={right ? colors.mint : colors.orange} />}</ScrollView></View>;
}

function Header({ onClose }) { return <View style={s.header}><Pressable onPress={onClose} style={s.back}><Ionicons name="chevron-back" size={24} color="white" /></Pressable><Text style={s.headerTitle}>Гибкая практика</Text><View style={{ width: 40 }} /></View>; }
const s = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: 'white', fontWeight: '900', fontSize: 17 }, content: { padding: 20, paddingBottom: 50 }, meta: { color: colors.purple, fontWeight: '900', fontSize: 11, letterSpacing: 1.2, marginTop: 24 }, prompt: { color: 'white', fontSize: 27, lineHeight: 36, fontWeight: '900', marginVertical: 20 }, option: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, padding: 16, marginBottom: 10 }, correct: { borderColor: colors.mint }, wrong: { borderColor: colors.orange }, optionText: { color: 'white', fontSize: 15, lineHeight: 21, fontWeight: '650', flex: 1 }, explain: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginVertical: 12 }, explainTitle: { fontWeight: '900', fontSize: 16 }, explainText: { color: colors.textMuted, lineHeight: 20, marginTop: 7 }, result: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }, resultEmoji: { fontSize: 76 }, resultTitle: { color: 'white', fontSize: 45, fontWeight: '900', marginTop: 14 }, resultText: { color: colors.textMuted, textAlign: 'center', marginTop: 8 } });
