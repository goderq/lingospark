import { evaluateExercise } from '../utils/answer';
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { grammarTracks } from "../data/grammarAcademy";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions, shuffleOptions } from "../utils/shuffle";
import { expandExplanation } from "../utils/explanations";

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
export function NotebookScreen({ onClose }) {
  const { progress, toggleNotebook } = useProgress();
  const items = progress.notebook || [];
  return (
    <View style={s.container}>
      <Header title="Моя тетрадь" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Сохранённые правила</Text>
        <Text style={s.subtitle}>{items.length} заметок из твоих ошибок</Text>
        {!items.length ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📓</Text>
            <Text style={s.cardTitle}>Тетрадь пока пустая</Text>
            <Text style={s.cardText}>
              После неправильного ответа нажми «Сохранить правило».
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={s.note}>
              <View style={s.noteTop}>
                <Text style={s.level}>{item.level}</Text>
                <Text style={s.topic}>{item.topic}</Text>
                <Pressable onPress={() => toggleNotebook(item)}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.pink}
                  />
                </Pressable>
              </View>
              <Text style={s.rule}>{item.rule}</Text>
              <View style={s.example}>
                <Text style={s.exampleLabel}>ПРИМЕР</Text>
                <Text style={s.exampleText}>{item.example}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export function ArticlesPrepositionsScreen({ onClose }) {
  const { toggleNotebook, progress } = useProgress();
  const [topic, setTopic] = useState("articles");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  const track = grammarTracks.find((item) => item.id === topic);
  const deck = useMemo(
    () => (track ? shuffleOptions(track.exercises, `${seed}-${topic}`) : []),
    [topic, started],
  );
  const item = deck[index];
  const reset = (id) => {
    setTopic(id);
    setStarted(false);
    setIndex(0);
    setSelected("");
    setScore(0);
    setDone(false);
  };
  if (!started)
    return (
      <View style={s.container}>
        <Header title="Точная грамматика" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Точность в мелочах</Text>
          <Text style={s.subtitle}>
            Три больших тренажёра от A1 до C1 с объяснением каждого правила
          </Text>
          <View style={s.tabs}>
            {[
              ["articles", "Артикли", "🔎"],
              ["prepositions", "Предлоги", "🧭"],
              ["phrasal-verbs", "Phrasal verbs", "🧩"],
            ].map(([id, label, emoji]) => (
              <Pressable
                key={id}
                onPress={() => reset(id)}
                style={[s.tab, topic === id && s.tabActive]}
              >
                <Text style={s.tabEmoji}>{emoji}</Text>
                <Text style={s.tabTitle}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.theory}>
            <Text style={s.theoryTitle}>{track?.hook}</Text>
            <Text style={s.formula}>{track?.formula}</Text>
          </View>
          <PrimaryButton
            title={`Начать · ${deck.length} заданий`}
            onPress={() => setStarted(true)}
          />
        </ScrollView>
      </View>
    );
  if (done)
    return (
      <View style={s.container}>
        <Header title={track.title} onClose={onClose} />
        <View style={s.center}>
          <Text style={s.emptyEmoji}>
            {score >= deck.length - 1 ? "🏆" : "🧩"}
          </Text>
          <Text style={s.result}>
            {score}/{deck.length}
          </Text>
          <Text style={s.subtitle}>
            Сохранённые правила доступны в личной тетради
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  const right = evaluateExercise(item, (selected)).correct;
  const next = () => {
    const final = score + (right ? 1 : 0);
    if (index === deck.length - 1) {
      setScore(final);
      setDone(true);
    } else {
      setScore(final);
      setIndex(index + 1);
      setSelected("");
    }
  };
  const note = {
    id: `focus-${topic}-${index}-${item.answer}`,
    topic: track.title,
    rule: expandExplanation(item, { topic: track.title }),
    example: `${item.prompt} → ${item.answer}`,
    level: track.level,
  };
  const saved = progress.notebook?.some((entry) => entry.id === note.id);
  return (
    <View style={s.container}>
      <Header title={track.title} onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar value={(index + 1) / deck.length} color={track.color} />
        <Text style={s.meta}>
          {track.level} · {index + 1}/{deck.length}
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
                selected && evaluateExercise(item, (option)).correct && s.correct,
                selected === option && !evaluateExercise(item, (option)).correct && s.wrong,
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ),
        )}
        {selected && (
          <>
            <View style={s.explain}>
              <Text
                style={[
                  s.explainTitle,
                  { color: right ? colors.mint : colors.orange },
                ]}
              >
                {right ? "Правильно!" : `Ответ: ${item.answer}`}
              </Text>
              <Text style={s.explainText}>
                {expandExplanation(item, {
                  selected,
                  topic: track.title,
                  formula: track.formula,
                })}
              </Text>
              <Pressable onPress={() => toggleNotebook(note)} style={s.save}>
                <Ionicons
                  name={saved ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={colors.orange}
                />
                <Text style={s.saveText}>
                  {saved ? "Сохранено в тетради" : "Сохранить правило"}
                </Text>
              </Pressable>
            </View>
            <PrimaryButton
              title={index === deck.length - 1 ? "Результат" : "Дальше"}
              onPress={next}
              color={right ? colors.mint : colors.orange}
            />
          </>
        )}
      </ScrollView>
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
  title: { color: "white", fontSize: 33, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 22,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
  },
  emptyEmoji: { fontSize: 60 },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900", marginTop: 10 },
  cardText: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
  note: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 11,
  },
  noteTop: { flexDirection: "row", gap: 8, alignItems: "center" },
  level: { color: colors.purple, fontSize: 10, fontWeight: "900" },
  topic: { color: colors.textMuted, fontSize: 11, flex: 1 },
  rule: {
    color: "white",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 12,
  },
  example: {
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  exampleLabel: { color: colors.mint, fontSize: 9, fontWeight: "900" },
  exampleText: { color: "white", marginTop: 5 },
  tabs: { flexDirection: "row", gap: 10 },
  tab: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tabActive: { borderColor: colors.purple },
  tabEmoji: { fontSize: 34 },
  tabTitle: { color: "white", fontWeight: "900", marginTop: 7 },
  theory: {
    backgroundColor: colors.card,
    borderRadius: 21,
    padding: 17,
    marginVertical: 18,
  },
  theoryTitle: { color: "white", lineHeight: 23 },
  formula: { color: colors.purple, fontWeight: "900", marginTop: 10 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  result: { color: "white", fontSize: 46, fontWeight: "900", marginTop: 12 },
  meta: {
    color: colors.purple,
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
    minHeight: 58,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: { color: "white", fontSize: 16, fontWeight: "650" },
  correct: { borderColor: colors.mint },
  wrong: { borderColor: colors.orange },
  explain: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 15,
    marginBottom: 14,
  },
  explainTitle: { fontWeight: "900" },
  explainText: { color: colors.textMuted, lineHeight: 20, marginTop: 7 },
  save: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 11 },
  saveText: { color: colors.orange, fontSize: 12, fontWeight: "800" },
});
