import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton } from "../components/UI";
import { evaluateExercise } from "../utils/answer";
import { expandExplanation } from "../utils/explanations";
import ExplanationCard from "../components/ExplanationCard";

const filters = ["Все", "Слово", "Урок", "Грамматика", "Диктант"];
const fallbackExplanation = (item) => {
  if (item.type === "Слово")
    return "Запоминай слово вместе с коротким примером, а не отдельно от контекста.";
  if (item.type === "Диктант")
    return "Сначала услышь ключевые слова, затем проверь артикли, окончания и порядок слов.";
  if (item.type === "Грамматика")
    return "Найди слово-маркер и определи, какая форма глагола нужна в этой ситуации.";
  return "Сравни смысл задания с правильным ответом и повтори всю фразу вслух.";
};

export default function MistakesScreen({ onClose }) {
  const { progress, resolveMistake, toggleNotebook } = useProgress();
  const mistakes = progress.mistakes || [];
  const rules = useMemo(
    () => Object.values(progress.ruleMastery || {}).sort(
      (first, second) => second.lastAttemptAt - first.lastAttemptAt,
    ),
    [progress.ruleMastery],
  );
  const masteredRules = rules.filter((rule) => rule.mastered).length;
  const [filter, setFilter] = useState("Все");
  const [training, setTraining] = useState(false);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const filtered = useMemo(
    () =>
      filter === "Все"
        ? mistakes
        : mistakes.filter((item) => item.type === filter),
    [filter, mistakes],
  );
  const item = filtered[0];
  const explanation =
    item &&
    expandExplanation(item, {
      selected: answer,
      topic: item.type,
      explanation: item.explanation || fallbackExplanation(item),
    });
  const noteId = item && `mistake-note-${item.id}`;
  const noteSaved = progress.notebook?.some((entry) => entry.id === noteId);
  const saveExplanation = () =>
    toggleNotebook({
      id: noteId,
      level: item.type,
      topic: item.prompt,
      rule: explanation,
      example: item.answer,
    });

  const resetAttempt = () => {
    setAnswer("");
    setChecked(false);
    setCorrect(false);
  };
  const check = () => {
    const right = evaluateExercise(item, answer).correct;
    setCorrect(right);
    setChecked(true);
  };
  const continueTraining = () => {
    if (correct) resolveMistake(item.id);
    resetAttempt();
    if (correct && filtered.length <= 1) setTraining(false);
  };

  if (training && item)
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              setTraining(false);
              resetAttempt();
            }}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={25} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Тренировка ошибок</Text>
          <Text style={styles.counter}>{filtered.length}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.practice}>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.practicePrompt}>{item.prompt}</Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            editable={!checked}
            placeholder="Напиши правильный ответ"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          {checked && (
            <View style={styles.feedback}>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: correct ? colors.mint : colors.orange },
                ]}
              >
                {correct
                  ? "Верно! Ошибка будет удалена"
                  : `Правильно: ${item.answer}`}
              </Text>
              <ExplanationCard
                item={{ ...item, type: "translate" }}
                selected={answer}
                correct={correct}
                context={{ topic: item.type }}
                showStatus={false}
                saved={noteSaved}
                onSave={saveExplanation}
              />
            </View>
          )}
          <PrimaryButton
            disabled={!answer.trim()}
            title={
              checked
                ? correct
                  ? "Следующая ошибка"
                  : "Попробовать снова"
                : "Проверить"
            }
            onPress={checked ? continueTraining : check}
            color={
              checked ? (correct ? colors.mint : colors.orange) : colors.purple
            }
          />
        </ScrollView>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.back}>
          <Ionicons name="chevron-back" size={25} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Мои ошибки</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Журнал ошибок</Text>
        <Text style={styles.subtitle}>
          Выбери категорию и повтори только то, что пока не получается
        </Text>
        {!!rules.length && (
          <View style={styles.masteryCard}>
            <View style={styles.masteryTop}>
              <View>
                <Text style={styles.masteryEyebrow}>ИСТОРИЯ ПРАВИЛ</Text>
                <Text style={styles.masteryTitle}>
                  Освоено {masteredRules} из {rules.length}
                </Text>
              </View>
              <Ionicons name="school" size={26} color={colors.purple} />
            </View>
            {rules.slice(0, 5).map((rule) => (
              <View key={rule.id} style={styles.ruleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleTopic}>{rule.topic}</Text>
                  <Text style={styles.ruleMeta}>
                    {rule.accuracy}% · серия {rule.streak} · повтор {rule.nextReviewAt}
                  </Text>
                </View>
                <View style={[
                  styles.ruleStatus,
                  { backgroundColor: `${rule.mastered ? colors.mint : colors.orange}22` },
                ]}>
                  <Text style={{ color: rule.mastered ? colors.mint : colors.orange, fontWeight: "900", fontSize: 10 }}>
                    {rule.mastered ? "ОСВОЕНО" : "УЧУ"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((name) => {
            const count =
              name === "Все"
                ? mistakes.length
                : mistakes.filter((entry) => entry.type === name).length;
            return (
              <Pressable
                key={name}
                onPress={() => setFilter(name)}
                style={[styles.filter, filter === name && styles.filterActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === name && styles.filterTextActive,
                  ]}
                >
                  {name} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {filtered.length > 0 && (
          <PrimaryButton
            title={`Тренировать · ${filtered.length}`}
            onPress={() => setTraining(true)}
          />
        )}
        {!filtered.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>
              {mistakes.length ? "В этой категории чисто" : "Здесь пока пусто"}
            </Text>
            <Text style={styles.emptyText}>
              {mistakes.length
                ? "Выбери другую категорию — или продолжай учиться."
                : "Ошибки из уроков, карточек и диктантов появятся здесь автоматически."}
            </Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <View key={entry.id} style={styles.mistake}>
              <View style={styles.typeRow}>
                <Text style={styles.type}>{entry.type}</Text>
                <Text style={styles.date}>{entry.date}</Text>
              </View>
              <Text style={styles.prompt}>{entry.prompt}</Text>
              <View style={styles.answerRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.mint}
                />
                <Text style={styles.answer}>{entry.answer}</Text>
              </View>
              {!!entry.selected && (
                <Text style={styles.previousAnswer}>Твой ответ: {entry.selected}</Text>
              )}
              <View style={styles.whyRow}>
                <Ionicons name="bulb-outline" size={17} color={colors.orange} />
                <Text style={styles.whyText}>
                  {entry.explanation || fallbackExplanation(entry)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  counter: {
    color: colors.orange,
    fontWeight: "900",
    width: 40,
    textAlign: "center",
  },
  content: { padding: 20, paddingBottom: 50, gap: 12 },
  title: { color: "white", fontSize: 34, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 2,
  },
  masteryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,92,252,.35)",
    padding: 16,
    gap: 11,
    marginVertical: 5,
  },
  masteryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  masteryEyebrow: { color: colors.purple, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  masteryTitle: { color: "white", fontSize: 18, fontWeight: "900", marginTop: 4 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  ruleTopic: { color: "white", fontWeight: "800", fontSize: 13 },
  ruleMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  ruleStatus: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  filters: { gap: 8, paddingVertical: 6 },
  filter: {
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: "rgba(124,92,252,.18)",
    borderColor: colors.purple,
  },
  filterText: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
  filterTextActive: { color: "white" },
  empty: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 25,
    padding: 30,
    marginTop: 8,
  },
  emptyEmoji: { fontSize: 55 },
  emptyTitle: {
    color: "white",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  mistake: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeRow: { flexDirection: "row", justifyContent: "space-between" },
  type: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  date: { color: colors.textMuted, fontSize: 10 },
  prompt: { color: "white", fontSize: 17, fontWeight: "700", marginTop: 10 },
  answerRow: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    marginTop: 11,
  },
  answer: { color: colors.mint, fontWeight: "700", flex: 1 },
  previousAnswer: { color: colors.pink, fontSize: 12, marginTop: 7 },
  practice: { flexGrow: 1, padding: 22, paddingBottom: 35 },
  practicePrompt: {
    color: "white",
    fontSize: 29,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 16,
  },
  input: {
    minHeight: 100,
    color: "white",
    fontSize: 17,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 25,
    textAlignVertical: "top",
  },
  feedback: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 15,
    marginTop: 13,
  },
  feedbackTitle: { fontWeight: "900", fontSize: 15 },
  explanation: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
  saveRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
  saveRuleText: { color: colors.purple, fontWeight: "800", fontSize: 12 },
  whyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  whyText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
