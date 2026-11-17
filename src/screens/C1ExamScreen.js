import PracticeScreen from './PracticeScreen';
import { sampleExamQuestions } from '../utils/examDeck';
import { evaluateExercise } from '../utils/answer';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tenseModules } from '../data/advancedCourse';
import { grammarTracks } from '../data/grammarAcademy';
import { grammarQuestions } from '../data/practice';
import { useProgress } from '../store/ProgressContext';
import { colors } from '../theme';
import { PrimaryButton, ProgressBar } from '../components/UI';
import { balancedOptions } from '../utils/shuffle';
import { expandExplanation } from '../utils/explanations';

const random = (items) => [...items].sort(() => Math.random() - .5);

export default function C1ExamScreen({ onClose }) {
  const { recordC1Exam } = useProgress();
  const [seed] = useState(Date.now);
  const deck = useMemo(() => {
    const tensePool = tenseModules.filter(module => ['B2', 'C1'].includes(module.level)).flatMap(module => module.exercises.map(question => ({ ...question, topic: module.name })));
    const academyPool = grammarTracks.filter(track => ['conditionals', 'modals', 'passive', 'gerund-infinitive'].includes(track.id)).flatMap(track => track.exercises.map(question => ({ ...question, topic: track.title })));
    return sampleExamQuestions([...tensePool, ...academyPool, ...grammarQuestions.filter(question => ['B2', 'C1'].includes(question.level))], 30, seed);
  }, [seed]);
  return <PracticeScreen title="Учебная проверка C1" sessionKey="exam-c1" presetDeck={deck} onComplete={recordC1Exam} onClose={onClose} />;
}

function Rule({ icon, text }) { return <View style={styles.rule}><Ionicons name={icon} size={22} color={colors.purple} /><Text style={styles.ruleText}>{text}</Text></View>; }
function Header({ onClose }) { return <View style={styles.header}><Pressable onPress={onClose} style={styles.back}><Ionicons name="chevron-back" size={24} color="white" /></Pressable><Text style={styles.headerTitle}>Экзамен C1</Text><View style={{ width: 40 }} /></View>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: 'white', fontWeight: '800', fontSize: 17 }, intro: { padding: 25, paddingBottom: 50, alignItems: 'center' }, trophy: { fontSize: 76 }, title: { color: 'white', fontSize: 34, lineHeight: 41, fontWeight: '900', textAlign: 'center', marginTop: 15 }, subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }, rules: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 23, padding: 17, gap: 16, marginVertical: 25 }, rule: { flexDirection: 'row', alignItems: 'center', gap: 12 }, ruleText: { color: 'white', flex: 1, lineHeight: 20, fontWeight: '600' }, content: { padding: 20, paddingBottom: 45 }, meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 23 }, topic: { color: colors.purple, fontWeight: '900', fontSize: 11, textTransform: 'uppercase' }, counter: { color: colors.textMuted, fontWeight: '800' }, question: { color: 'white', fontSize: 28, lineHeight: 36, fontWeight: '900', marginVertical: 22 }, option: { minHeight: 59, padding: 16, backgroundColor: colors.card, borderRadius: 17, borderWidth: 1.5, borderColor: colors.border, marginBottom: 10 }, optionText: { color: 'white', fontSize: 16, fontWeight: '600' }, feedback: { backgroundColor: colors.card, borderRadius: 17, padding: 15, marginVertical: 10 }, feedbackTitle: { fontWeight: '900', fontSize: 16 }, feedbackText: { color: colors.textMuted, lineHeight: 20, marginTop: 6 }, result: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 27 }, resultTitle: { color: 'white', fontSize: 48, fontWeight: '900', marginTop: 10 }, resultMessage: { color: colors.textMuted, fontSize: 18, marginTop: 7 }, certificate: { width: '100%', alignItems: 'center', backgroundColor: 'rgba(255,159,67,.12)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,159,67,.4)', padding: 22, marginTop: 23 }, certificateSmall: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, certificateLevel: { color: 'white', fontSize: 64, fontWeight: '900', marginTop: 5 }, certificateText: { color: colors.textMuted, fontWeight: '700' } });
