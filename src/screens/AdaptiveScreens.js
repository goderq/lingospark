import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { reviewWords } from "../data/course";
import { tenseModules } from "../data/advancedCourse";
import { useProgress } from "../store/ProgressContext";
import { colors , useTheme, createThemedStyles } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { evaluateExercise, analyzeAnswer } from "../utils/answer";
import { expandExplanation } from "../utils/explanations";

const random = (items) => [...items].sort(() => Math.random() - 0.5);
const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export function AdaptiveLessonScreen({ onClose }) {
  useTheme();
  const { progress, resolveMistake, recordReview, recordGrammar, recordExercise } =
    useProgress();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [grade, setGrade] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState([]);
  const deck = useMemo(() => {
    const mistakes = (progress.mistakes || []).map((item) => ({
      id: `adaptive-${item.id}`,
      type: "mistake",
      mistakeId: item.id,
      label: item.type,
      prompt: item.prompt,
      answer: item.answer,
    }));
    const today = dateKey();
    const weakRules = Object.values(progress.ruleMastery || {})
      .filter((rule) => !rule.mastered && (!rule.nextReviewAt || rule.nextReviewAt <= today))
      .sort((first, second) => first.accuracy - second.accuracy || first.lastAttemptAt - second.lastAttemptAt)
      .map((rule) => ({
        id: `adaptive-rule-${rule.id}`,
        type: "rule",
        ruleId: rule.id,
        label: `${rule.level ? `${rule.level} · ` : ""}${rule.topic}`,
        prompt: rule.prompt,
        answer: rule.answer,
        explanation: rule.explanation,
      }));
    const dueWords = reviewWords
      .filter(
        (word) =>
          !progress.reviewStats?.[word.id]?.dueDate ||
          progress.reviewStats[word.id].dueDate <= today,
      )
      .map((word) => ({
        id: `adaptive-word-${word.id}`,
        type: "word",
        word,
        label: "Словарь",
        prompt: `Переведи: ${word.english}`,
        answer: word.russian,
      }));
    const weakIds = tenseModules.filter((module) =>
      mistakes.some((mistake) =>
        mistake.mistakeId?.startsWith(`grammar-tense-${module.id}-`),
      ),
    );
    const tensePool = (
      weakIds.length
        ? weakIds
        : tenseModules.filter((module) => ["B2", "C1"].includes(module.level))
    ).flatMap((module) =>
      module.exercises.map((question, questionIndex) => ({
        id: `adaptive-tense-${module.id}-${questionIndex}`,
        type: "tense",
        module,
        questionIndex,
        label: `${module.level} · ${module.name}`,
        prompt: question.prompt,
        answer: question.answer,
        explanation: question.explanation,
      })),
    );
    const priority = [
      ...mistakes.slice(0, 4),
      ...weakRules.slice(0, 4),
      ...random(dueWords).slice(0, 4),
      ...random(tensePool).slice(0, 6),
    ];
    return random(priority).slice(0, 14);
  }, []);
  const item = deck[index];
  const analysis = analyzeAnswer(answer, item?.answer || "");
  const check = () => {
    const evaluation = evaluateExercise(item, answer);
    const right = evaluation.correct;
    setGrade(evaluation.status);
    setCorrect(right);
    setChecked(true);
    setResults((value) => [...value, { label: item.label, correct: right }]);
    if (right) setScore((value) => value + 1);
    else if (evaluation.status === "wrong")
      setLives((value) => Math.max(0, value - 1));
    if (item.type === "word") recordReview(item.word, right, "en-ru");
    if (item.type === "tense")
      recordGrammar(
        {
          id: `tense-${item.module.id}-${item.questionIndex}`,
          prompt: item.prompt,
          answer: item.answer,
        },
        right,
      );
    if (item.type === "rule")
      recordExercise(
        {
          id: `adaptive-${item.ruleId}`,
          prompt: item.prompt,
          answer: item.answer,
          explanation: item.explanation,
        },
        right,
        { ruleId: item.ruleId, topic: item.label, selected: answer },
      );
  };
  const restart = () => {
    setIndex(0);
    setAnswer("");
    setChecked(false);
    setCorrect(false);
    setGrade("");
    setScore(0);
    setLives(3);
    setResults([]);
  };
  const next = () => {
    if (correct && item.mistakeId) resolveMistake(item.mistakeId);
    if (index === deck.length - 1) setDone(true);
    else {
      setIndex((value) => value + 1);
      setAnswer("");
      setChecked(false);
      setCorrect(false);
      setGrade("");
    }
  };
  if (done) {
    const weak = results
      .filter((entry) => !entry.correct)
      .reduce(
        (counts, entry) => ({
          ...counts,
          [entry.label]: (counts[entry.label] || 0) + 1,
        }),
        {},
      );
    const focus = Object.entries(weak).sort((a, b) => b[1] - a[1])[0]?.[0];
    return (
      <View style={styles.container}>
        <Header title="Урок для тебя" onClose={onClose} />
        <View style={styles.result}>
          <Text style={styles.resultEmoji}>✨</Text>
          <Text style={styles.resultTitle}>
            {score}/{deck.length}
          </Text>
          <Text style={styles.subtitle}>
            {focus
              ? `Следующий фокус: ${focus}`
              : "Слабых тем не найдено — отличный результат!"}
          </Text>
          <View style={styles.personalPlan}>
            <Text style={styles.planTitle}>Что будет дальше</Text>
            <Text style={styles.feedbackText}>
              Ошибки вернутся в повторении, а слабая тема получит больше
              заданий.
            </Text>
          </View>
          <View style={{ width: "100%", marginTop: 24 }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Header title="Урок для тебя" onClose={onClose} />
      <Pressable onPress={Keyboard.dismiss} style={styles.practice}>
        <View style={styles.progress}>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={(index + 1) / deck.length}
              color={colors.mint}
            />
          </View>
          <Text style={styles.hearts}>❤️ {lives}</Text>
        </View>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.prompt}>{item.prompt}</Text>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          editable={!checked}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          placeholder="Напиши ответ самостоятельно…"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            checked && {
              borderColor: correct
                ? colors.mint
                : grade === "close"
                  ? colors.orange
                  : colors.pink,
            },
          ]}
        />
        {checked && (
          <View style={styles.feedback}>
            <Text
              style={[
                styles.feedbackTitle,
                {
                  color: correct
                    ? colors.mint
                    : grade === "close"
                      ? colors.orange
                      : colors.pink,
                },
              ]}
            >
              {correct
                ? "Верно!"
                : grade === "close"
                  ? "Почти верно — смысл понятен"
                  : "Неверно — смысл изменён"}
            </Text>
            {!correct && (
              <Text style={styles.feedbackText}>
                Лучший вариант: {item.answer}
              </Text>
            )}
            {!correct && analysis.missing.length > 0 && (
              <Text style={styles.missing}>
                Не хватает: {analysis.missing.join(", ")}
              </Text>
            )}
            {!correct && analysis.extra.length > 0 && (
              <Text style={styles.extra}>
                Лишнее или замени: {analysis.extra.join(", ")}
              </Text>
            )}
            {!correct && analysis.unnaturalOrder && (
              <Text style={styles.extra}>
                Все слова есть, но порядок неестественный
              </Text>
            )}
            <Text style={styles.feedbackText}>
              {expandExplanation(item, {
                selected: answer,
                topic: item.label,
                formula: item.module?.formula,
                use: item.module?.use,
                markers: item.module?.markers,
              })}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <PrimaryButton
          disabled={!answer.trim()}
          title={
            checked
              ? lives === 0
                ? "Жизни закончились — заново"
                : index === deck.length - 1
                  ? "Результат"
                  : "Дальше"
              : "Проверить"
          }
          onPress={checked ? (lives === 0 ? restart : next) : check}
          color={
            checked
              ? correct
                ? colors.mint
                : grade === "close"
                  ? colors.orange
                  : colors.pink
              : colors.purple
          }
        />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

export function ReviewCalendarScreen({ onClose }) {
  useTheme();
  const { progress } = useProgress();
  const today = new Date();
  const days = Array.from({ length: 15 }, (_, offset) => {
    const date = new Date(today.getTime() + offset * 86400000);
    const key = dateKey(date);
    const words = reviewWords.filter(
      (word) => progress.reviewStats?.[word.id]?.dueDate === key,
    );
    return { key, date, words };
  });
  const unscheduled = reviewWords.filter(
    (word) => !progress.reviewStats?.[word.id]?.dueDate,
  ).length;
  return (
    <View style={styles.container}>
      <Header title="Календарь повторений" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.calendarTitle}>Следующие 14 дней</Text>
        <Text style={styles.subtitleLeft}>
          Слова возвращаются через 1, 3, 7 и 14 дней. Ошибка переносит слово на
          сегодня.
        </Text>
        <View style={styles.scheduleInfo}>
          <Ionicons name="time" size={27} color={colors.purple} />
          <View>
            <Text style={styles.scheduleTitle}>Интервальная память</Text>
            <Text style={styles.feedbackText}>
              1 день → 3 дня → 7 дней → 14 дней → 30 дней
            </Text>
          </View>
        </View>
        {unscheduled > 0 && (
          <View style={styles.todayCard}>
            <Text style={styles.dayNumber}>Сегодня</Text>
            <Text style={styles.todayCount}>{unscheduled} новых слов</Text>
          </View>
        )}
        {days.map((day, offset) => (
          <View
            key={day.key}
            style={[styles.day, offset === 0 && styles.dayToday]}
          >
            <View style={styles.dateBox}>
              <Text style={styles.weekday}>
                {offset === 0
                  ? "СЕГОДНЯ"
                  : day.date
                      .toLocaleDateString("ru-RU", { weekday: "short" })
                      .toUpperCase()}
              </Text>
              <Text style={styles.dateNumber}>{day.date.getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayTitle}>
                {day.words.length
                  ? `${day.words.length} слов к повторению`
                  : "Повторений нет"}
              </Text>
              {day.words.slice(0, 3).map((word) => (
                <Text key={word.id} style={styles.word}>
                  {word.english} — {word.russian}
                </Text>
              ))}
              {day.words.length > 3 && (
                <Text style={styles.more}>и ещё {day.words.length - 3}…</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Header({ title, onClose }) {
  useTheme();
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
const styles = createThemedStyles(() => ({
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
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  practice: { flex: 1, padding: 20, paddingBottom: 25 },
  progress: { flexDirection: "row", alignItems: "center", gap: 13 },
  hearts: { color: colors.pink, fontWeight: "900" },
  label: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 28,
  },
  prompt: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 10,
  },
  input: {
    minHeight: 105,
    color: colors.text,
    fontSize: 18,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 16,
    textAlignVertical: "top",
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 24,
  },
  feedback: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 15,
    marginTop: 13,
  },
  feedbackTitle: { fontWeight: "900", fontSize: 16 },
  feedbackText: { color: colors.textMuted, lineHeight: 20, marginTop: 5 },
  missing: { color: colors.orange, fontWeight: "700", marginTop: 7 },
  extra: { color: colors.pink, fontWeight: "700", marginTop: 5 },
  personalPlan: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  planTitle: { color: colors.mint, fontWeight: "900" },
  result: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  resultEmoji: { fontSize: 77 },
  resultTitle: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "900",
    marginTop: 15,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 16,
    marginTop: 8,
  },
  content: { padding: 20, paddingBottom: 50 },
  calendarTitle: { color: colors.text, fontSize: 34, fontWeight: "900" },
  subtitleLeft: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  scheduleInfo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 17,
    backgroundColor: "rgba(124,92,252,.13)",
    borderRadius: 20,
    marginBottom: 14,
  },
  scheduleTitle: { color: colors.text, fontWeight: "900" },
  todayCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(46,211,183,.13)",
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
  },
  dayNumber: { color: colors.mint, fontWeight: "900" },
  todayCount: { color: colors.text, fontWeight: "800" },
  day: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayToday: { borderColor: "rgba(46,211,183,.45)" },
  dateBox: { width: 52, alignItems: "center" },
  weekday: { color: colors.textMuted, fontSize: 9, fontWeight: "900" },
  dateNumber: { color: colors.text, fontSize: 25, fontWeight: "900", marginTop: 3 },
  dayTitle: { color: colors.text, fontWeight: "800" },
  word: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  more: { color: colors.purple, fontSize: 11, marginTop: 4 },
}));
