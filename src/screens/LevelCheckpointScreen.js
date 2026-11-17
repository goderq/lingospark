import PracticeScreen from './PracticeScreen';
import { sampleExamQuestions } from '../utils/examDeck';
import { evaluateExercise } from '../utils/answer';
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { placementQuestions, grammarQuestions } from "../data/practice";
import { grammarTracks } from "../data/grammarAcademy";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions, shuffleOptions } from "../utils/shuffle";
import { expandExplanation } from "../utils/explanations";

const levelIndex = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 };
export default function LevelCheckpointScreen({ level, onClose }) {
  const { completeCourseCheckpoint } = useProgress();
  const [seed] = useState(Date.now);
  const deck = useMemo(() => {
    const direct = [...placementQuestions, ...grammarQuestions].filter(q => levelIndex[q.level] <= levelIndex[level]);
    const academy = grammarTracks.filter(track => levelIndex[track.level] <= levelIndex[level]).flatMap(track => track.exercises);
    return sampleExamQuestions([...direct, ...academy], 10, seed);
  }, [level, seed]);
  return <PracticeScreen key={level} title={'Контрольная ' + level} sessionKey={'checkpoint-' + level} presetDeck={deck} onComplete={score => completeCourseCheckpoint(level, score)} onClose={onClose} />;
}
function Header({ title, onClose }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onClose} style={s.back}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "white", fontWeight: "800", fontSize: 17 },
  content: { padding: 20, paddingBottom: 50 },
  meta: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 22,
  },
  question: {
    color: "white",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    marginVertical: 22,
  },
  option: {
    minHeight: 59,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: { color: "white", fontSize: 16, fontWeight: "650" },
  explanation: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
  },
  explanationText: { color: colors.textMuted, lineHeight: 21 },
  correct: { borderColor: colors.mint },
  wrong: { borderColor: colors.orange },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emoji: { fontSize: 76 },
  score: { color: "white", fontSize: 47, fontWeight: "900", marginTop: 12 },
  title: {
    color: "white",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 18,
  },
  reward: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,159,67,.13)",
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,
  },
  rewardText: { color: colors.orange, fontWeight: "800", flex: 1 },
});
