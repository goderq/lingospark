import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors , useTheme, createThemedStyles } from "../theme";
import { ProgressBar } from "../components/UI";
import { lessons } from "../data/course";
import { useProgress } from "../store/ProgressContext";
import { loadTutorMemory } from "../services/localAi";

const DIRECTOR_KEY = "@lingospark/ai-director-v1";
const DURATIONS = [10, 20, 30];
const todayKey = () => new Date().toISOString().slice(0, 10);

function accuracy(correct, total) {
  return total ? Math.round((correct / total) * 100) : null;
}

function buildCandidates(progress, memory) {
  const reviewAccuracy = accuracy(progress.stats?.reviewCorrect || 0, progress.stats?.reviewTotal || 0);
  const grammarAccuracy = accuracy(progress.stats?.grammarCorrect || 0, progress.stats?.grammarTotal || 0);
  const completed = new Set(progress.completed || []);
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id));
  const resultEntries = Object.entries(progress.lessonResults || {})
    .map(([id, result]) => ({ lesson: lessons.find((item) => item.id === id), score: result.bestAccuracy ?? result.accuracy ?? 100 }))
    .filter((item) => item.lesson)
    .sort((a, b) => a.score - b.score);
  const weakLesson = resultEntries[0];
  const recurring = memory.recurringMistakes?.[0];
  const dueWords = Object.values(progress.reviewStats || {}).filter((item) => !item.dueDate || item.dueDate <= todayKey()).length;
  const targetWords = memory.usefulWords?.slice(0, 3).map((item) => item.english).filter(Boolean) || [];

  return [
    {
      id: "conversation",
      type: "internal",
      target: "chat",
      icon: "chatbubbles",
      color: colors.purple,
      title: "Разговорная разминка",
      reason: recurring ? `Lingo мягко вернёт ошибку: ${recurring.explanation || recurring.corrected}` : "Разговор активирует английский перед остальными заданиями.",
      minutes: 4,
    },
    (progress.mistakes || []).length || recurring ? {
      id: "mistakes",
      type: "overlay",
      target: "mistakes",
      icon: "refresh-circle",
      color: colors.orange,
      title: "Исправь слабое место",
      reason: `${(progress.mistakes || []).length} ошибок в упражнениях${recurring ? " и повторяющаяся ошибка из разговоров" : ""}.`,
      minutes: 4,
    } : null,
    {
      id: "words",
      type: "tab",
      target: "review",
      icon: "library",
      color: colors.mint,
      title: targetWords.length ? `Верни слова: ${targetWords.join(", ")}` : "Умное повторение слов",
      reason: reviewAccuracy === null ? "Нужно собрать первые данные о запоминании слов." : `Точность словаря ${reviewAccuracy}%${dueWords ? ` · к повторению ${dueWords}` : ""}.`,
      minutes: 4,
    },
    grammarAccuracy === null || grammarAccuracy < 82 ? {
      id: "grammar",
      type: "overlay",
      target: "grammarAcademy",
      icon: "school",
      color: colors.blue,
      title: "Грамматика по слабым местам",
      reason: grammarAccuracy === null ? "Пройди короткий блок, чтобы определить слабую тему." : `Текущая точность грамматики ${grammarAccuracy}% — её стоит закрепить.`,
      minutes: 5,
    } : {
      id: "tenses",
      type: "overlay",
      target: "tenses",
      icon: "time",
      color: colors.blue,
      title: "Следующий блок времён",
      reason: `Пройдено блоков времён: ${(progress.completedTenses || []).length}. Пора расширить активную грамматику.`,
      minutes: 5,
    },
    {
      id: "course",
      type: "tab",
      target: "course",
      icon: "map",
      color: "#F06BEA",
      title: nextLesson ? `Продолжи курс: ${nextLesson.title}` : weakLesson ? `Улучши результат: ${weakLesson.lesson.title}` : "Закрепи курс",
      reason: nextLesson ? `Это следующий доступный урок уровня ${nextLesson.difficulty}.` : weakLesson ? `Самый низкий результат среди уроков — ${weakLesson.score}%.` : "Курс даст системе больше данных для персонализации.",
      minutes: 6,
    },
    {
      id: "pronunciation",
      type: "internal",
      target: "pronunciation",
      icon: "mic",
      color: colors.pink,
      title: "Произношение вслух",
      reason: "Короткая голосовая практика закрепляет слова в активной речи.",
      minutes: 4,
    },
    {
      id: "exam",
      type: "overlay",
      target: "dailyMixedExam",
      icon: "ribbon",
      color: colors.orange,
      title: "Итоговый мини-экзамен",
      reason: "Смешанная проверка покажет, что действительно осталось в памяти.",
      minutes: 4,
    },
  ].filter(Boolean);
}

function fitPlan(candidates, duration) {
  const wanted = duration === 10 ? ["conversation", "words", "exam"] : duration === 20 ? ["conversation", "mistakes", "words", "grammar", "tenses", "pronunciation", "exam"] : candidates.map((item) => item.id);
  let selected = wanted.map((id) => candidates.find((item) => item.id === id)).filter(Boolean);
  for (const item of candidates) {
    if (selected.length >= (duration === 10 ? 3 : duration === 20 ? 5 : 7)) break;
    if (!selected.some((step) => step.id === item.id)) selected.push(item);
  }
  selected = selected.slice(0, duration === 10 ? 3 : duration === 20 ? 5 : 7);
  const originalTotal = selected.reduce((sum, item) => sum + item.minutes, 0);
  let remaining = duration;
  return selected.map((item, index) => {
    const minutes = index === selected.length - 1 ? remaining : Math.max(2, Math.round((item.minutes / originalTotal) * duration));
    remaining -= minutes;
    return { ...item, minutes: Math.max(1, minutes) };
  });
}

export default function AIDirectorScreen({ onClose, onOpenChat, onOpenPronunciation, onNavigate }) {
  useTheme();
  const { progress } = useProgress();
  const [duration, setDuration] = useState(progress.dailyGoal >= 30 ? 30 : progress.dailyGoal >= 20 ? 20 : 10);
  const [memory, setMemory] = useState(null);
  const [saved, setSaved] = useState({});

  useEffect(() => {
    Promise.all([loadTutorMemory(), AsyncStorage.getItem(DIRECTOR_KEY)])
      .then(([loadedMemory, raw]) => { setMemory(loadedMemory); setSaved(raw ? JSON.parse(raw) : {}); })
      .catch(() => setMemory({ recurringMistakes: [], usefulWords: [] }));
  }, []);

  const candidates = useMemo(() => buildCandidates(progress, memory || {}), [progress, memory]);
  const steps = useMemo(() => fitPlan(candidates, duration), [candidates, duration]);
  const planId = `${todayKey()}-${duration}`;
  const completed = saved[planId] || [];
  const done = steps.filter((step) => completed.includes(step.id)).length;

  const toggle = async (stepId) => {
    const nextCompleted = completed.includes(stepId) ? completed.filter((id) => id !== stepId) : [...completed, stepId];
    const next = { ...saved, [planId]: nextCompleted };
    setSaved(next);
    await AsyncStorage.setItem(DIRECTOR_KEY, JSON.stringify(next));
  };
  const start = (step) => {
    if (step.target === "chat") onOpenChat();
    else if (step.target === "pronunciation") onOpenPronunciation();
    else onNavigate?.({ type: step.type, target: step.target });
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Pressable onPress={onClose} style={s.round}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={s.title}>ИИ-маршрут</Text><Text style={s.muted}>Один план связывает всё обучение</Text></View>
        <View style={s.planBadge}><Ionicons name="sparkles" size={18} color={colors.purple} /></View>
      </View>

      <View style={s.hero}>
        <Text style={s.heroLabel}>ПЛАН НА СЕГОДНЯ</Text>
        <Text style={s.heroTitle}>{done === steps.length ? "Маршрут завершён" : `${duration} минут без случайных заданий`}</Text>
        <Text style={s.heroText}>{done === steps.length ? "Все шаги выполнены. Завтра маршрут перестроится по новым результатам." : "Каждый шаг выбран из реального прогресса, ошибок и памяти Lingo."}</Text>
        <View style={s.heroProgress}><ProgressBar value={done / Math.max(1, steps.length)} color={done === steps.length ? colors.mint : colors.purple} height={8} /><Text style={s.progressText}>{done}/{steps.length}</Text></View>
      </View>

      <Text style={s.section}>СКОЛЬКО ЕСТЬ ВРЕМЕНИ</Text>
      <View style={s.durationRow}>{DURATIONS.map((item) => <Pressable key={item} onPress={() => setDuration(item)} style={[s.duration, duration === item && s.durationActive]}><Text style={[s.durationValue, duration === item && { color: colors.text }]}>{item}</Text><Text style={s.durationLabel}>минут</Text></Pressable>)}</View>

      <Text style={s.section}>ПОРЯДОК ЗАНЯТИЯ</Text>
      {steps.map((step, index) => {
        const isDone = completed.includes(step.id);
        return <View key={step.id} style={[s.step, isDone && s.stepDone]}>
          <View style={s.stepLine}><View style={[s.stepIcon, { backgroundColor: `${step.color}20` }]}><Ionicons name={isDone ? "checkmark" : step.icon} size={23} color={isDone ? colors.mint : step.color} /></View>{index < steps.length - 1 ? <View style={s.connector} /> : null}</View>
          <View style={{ flex: 1 }}>
            <View style={s.stepHeader}><Text style={s.stepNumber}>ШАГ {index + 1}</Text><Text style={s.minutes}>{step.minutes} мин</Text></View>
            <Text style={[s.stepTitle, isDone && { color: colors.textMuted }]}>{step.title}</Text>
            <Text style={s.reason}>{step.reason}</Text>
            <View style={s.actions}><Pressable onPress={() => start(step)} style={s.startButton}><Text style={s.startText}>{isDone ? "Открыть снова" : "Начать"}</Text><Ionicons name="arrow-forward" size={17} color={colors.onAccent} /></Pressable><Pressable onPress={() => toggle(step.id)} style={[s.doneButton, isDone && s.doneButtonActive]}><Ionicons name={isDone ? "checkmark-circle" : "ellipse-outline"} size={19} color={isDone ? colors.mint : colors.textMuted} /><Text style={[s.doneText, isDone && { color: colors.mint }]}>{isDone ? "Готово" : "Отметить"}</Text></Pressable></View>
          </View>
        </View>;
      })}

      <View style={s.explain}><Ionicons name="shield-checkmark" size={22} color={colors.mint} /><Text style={s.explainText}>Маршрут собирается на iPhone из результатов приложения. Локальная модель помогает внутри упражнений, но не может выдумать несуществующий раздел.</Text></View>
    </ScrollView>
  );
}

const s = createThemedStyles(() => ({
  page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 130 }, header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }, round: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontSize: 27, fontWeight: "900" }, muted: { color: colors.textMuted, fontSize: 11, marginTop: 3 }, planBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(124,92,252,0.13)", alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: "rgba(124,92,252,0.13)", borderWidth: 1, borderColor: "rgba(124,92,252,0.35)", borderRadius: 24, padding: 20 }, heroLabel: { color: colors.purple, fontSize: 10, letterSpacing: 1.6, fontWeight: "900" }, heroTitle: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: "900", marginTop: 8 }, heroText: { color: colors.textMuted, lineHeight: 20, marginTop: 7 }, heroProgress: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 17 }, progressText: { color: colors.text, fontWeight: "900", fontSize: 12 }, section: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: "900", marginTop: 24, marginBottom: 10 },
  durationRow: { flexDirection: "row", gap: 9 }, duration: { flex: 1, height: 66, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, durationActive: { backgroundColor: colors.accentSoft, borderColor: colors.purple }, durationValue: { color: colors.textMuted, fontSize: 20, fontWeight: "900" }, durationLabel: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  step: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 21, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 11 }, stepDone: { opacity: 0.82, borderColor: "rgba(46,211,183,0.25)" }, stepLine: { alignItems: "center" }, stepIcon: { width: 47, height: 47, borderRadius: 15, alignItems: "center", justifyContent: "center" }, connector: { width: 2, flex: 1, minHeight: 60, backgroundColor: colors.border, marginTop: 8 }, stepHeader: { flexDirection: "row", justifyContent: "space-between" }, stepNumber: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, minutes: { color: colors.textMuted, fontSize: 10, fontWeight: "800" }, stepTitle: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: "900", marginTop: 5 }, reason: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 }, actions: { flexDirection: "row", gap: 8, marginTop: 13 }, startButton: { minHeight: 40, flex: 1, borderRadius: 12, backgroundColor: colors.accentFill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, startText: { color: colors.text, fontSize: 11, fontWeight: "900" }, doneButton: { minHeight: 40, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.cardLight, flexDirection: "row", alignItems: "center", gap: 5 }, doneButtonActive: { backgroundColor: "rgba(46,211,183,0.1)" }, doneText: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  explain: { flexDirection: "row", gap: 10, backgroundColor: "rgba(46,211,183,0.07)", borderRadius: 17, padding: 14, marginTop: 10 }, explainText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
}));
