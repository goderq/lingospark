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
  const { progress, completeCourseCheckpoint } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  const questions = useMemo(() => {
    const direct = [...placementQuestions, ...grammarQuestions].filter(
      (q) => levelIndex[q.level] <= levelIndex[level],
    );
    const academy = grammarTracks
      .filter((track) => track.level.includes(level))
      .flatMap((track, ti) =>
        track.exercises.map((q, qi) => ({
          ...q,
          id: `checkpoint-${level}-${ti}-${qi}`,
          level,
        })),
      );
    return shuffleOptions([...direct, ...academy], `${seed}-${level}`).slice(
      0,
      10,
    );
  }, []);
  const item = questions[index];
  if (done) {
    const passed = score >= 8;
    const next = { A1: "A2", A2: "B1", B1: "B2", B2: "C1", C1: "Полный курс" }[
      level
    ];
    return (
      <View style={s.container}>
        <Header title={`Контрольная ${level}`} onClose={onClose} />
        <View style={s.center}>
          <Text style={s.emoji}>{passed ? "🎓" : "📘"}</Text>
          <Text style={s.score}>{score}/10</Text>
          <Text style={s.title}>
            {passed ? `Уровень ${level} закреплён!` : "Повтори сложные темы"}
          </Text>
          <Text style={s.subtitle}>
            {passed
              ? level === "C1"
                ? "Ты завершил контрольные всего маршрута."
                : `Следующий этап: ${next}`
              : "Для награды нужно минимум 8 правильных ответов. Маршрут при этом не блокируется."}
          </Text>
          {passed && (
            <View style={s.reward}>
              <Ionicons name="gift" size={28} color={colors.orange} />
              <Text style={s.rewardText}>
                Награда: 25 монет · достижение уровня
              </Text>
            </View>
          )}
          <View style={{ width: "100%" }}>
            <PrimaryButton
              title="Вернуться к курсу"
              onPress={onClose}
              color={passed ? colors.mint : colors.purple}
            />
          </View>
        </View>
      </View>
    );
  }
  const next = () => {
    const final = score + (selected === item.answer ? 1 : 0);
    if (index === questions.length - 1) {
      setScore(final);
      completeCourseCheckpoint(level, final);
      setDone(true);
    } else {
      setScore(final);
      setIndex(index + 1);
      setSelected("");
    }
  };
  return (
    <View style={s.container}>
      <Header title={`Контрольная ${level}`} onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar
          value={(index + 1) / questions.length}
          color={colors.orange}
        />
        <Text style={s.meta}>
          ВОПРОС {index + 1} ИЗ {questions.length}
        </Text>
        <Text style={s.question}>{item.prompt}</Text>
        {balancedOptions(item.options, item.answer, index, seed).map(
          (option) => (
            <Pressable
              key={option}
              disabled={!!selected}
              onPress={() => setSelected(option)}
              style={[
                s.option,
                selected && option === item.answer && s.correct,
                selected === option && option !== item.answer && s.wrong,
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ),
        )}
        {selected && (
          <View style={s.explanation}>
            <Text style={s.explanationText}>
              {expandExplanation(item, {
                selected,
                topic: `Контрольная ${level}`,
              })}
            </Text>
          </View>
        )}
        {selected && (
          <PrimaryButton
            title={index === questions.length - 1 ? "Результат" : "Дальше"}
            onPress={next}
            color={selected === item.answer ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
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
