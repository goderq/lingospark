import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { lessons, phrases, reviewWords } from "../data/course";
import { grammarQuestions, placementQuestions } from "../data/practice";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions } from "../utils/shuffle";

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

export function PlanScreen({ onClose, onNavigate, onLesson }) {
  const { progress } = useProgress();
  const stats = progress.stats || {};
  const today = new Date().toISOString().slice(0, 10);
  const actions =
    progress.dailyActions?.date === today ? progress.dailyActions : {};
  const grammarAccuracy = stats.grammarTotal
    ? stats.grammarCorrect / stats.grammarTotal
    : 0;
  const reviewAccuracy = stats.reviewTotal
    ? stats.reviewCorrect / stats.reviewTotal
    : 0;
  const nextLesson =
    lessons.find((item) => !progress.completed.includes(item.id)) || lessons[0];
  const mistakes = progress.mistakes || [];
  const tasks = [
    {
      type: "lesson",
      lesson: nextLesson,
      icon: nextLesson.icon,
      color: nextLesson.color,
      title: nextLesson.title,
      detail: `${nextLesson.exercises.length} заданий · следующий курс ${nextLesson.difficulty}`,
      reason: "Продолжает твой маршрут без пропусков",
      done: (actions.lessons || 0) >= 1,
    },
    {
      type: "review",
      icon: "albums",
      color: colors.mint,
      title: reviewAccuracy < 0.75 ? "Изучи новые слова" : "Расширь словарь",
      detail: "5 случайных слов · сложность на выбор",
      reason:
        reviewAccuracy < 0.75
          ? `Точность слов ${Math.round(reviewAccuracy * 100)}%`
          : "Пора поддержать выученные слова",
      done: (actions.reviews || 0) >= 5,
    },
    {
      type: "articlesPrepositions",
      icon: "book",
      color: colors.purple,
      title:
        grammarAccuracy < 0.75
          ? "Разбери точную грамматику"
          : "Грамматический вызов",
      detail: "Правило + 3 вопроса",
      reason:
        grammarAccuracy < 0.75
          ? `Точность грамматики ${Math.round(grammarAccuracy * 100)}%`
          : "Точность высокая — нужен вызов",
      done: false,
    },
    {
      type: mistakes.length ? "mistakes" : "skillSprint",
      icon: "warning",
      color: colors.pink,
      title: mistakes.length
        ? `Разбери ошибки · ${Math.min(3, mistakes.length)}`
        : "Гибкая практика",
      detail: "3 коротких задания с объяснениями",
      reason: mistakes.length
        ? `В журнале осталось ${mistakes.length}`
        : "Ошибок нет — повышаем сложность",
      done: mistakes.length === 0,
    },
    {
      type: "dictation",
      icon: "ear",
      color: colors.orange,
      title: "Тренируй слух",
      detail: "3 мин · один диктант",
      reason: "Балансируем чтение и аудирование",
      done: (actions.dictations || 0) >= 1,
    },
  ];
  return (
    <View style={s.container}>
      <Header title="План на сегодня" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.bigTitle}>Твой личный маршрут</Text>
        <Text style={s.subtitle}>
          12–17 заданий · около 15 минут · план меняется по результатам
        </Text>
        <View style={s.planScore}>
          <Text style={s.planNumber}>
            {tasks.filter((t) => t.done).length}/{tasks.length}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Выполнено сегодня</Text>
            <ProgressBar
              value={tasks.filter((t) => t.done).length / tasks.length}
              color={colors.mint}
            />
          </View>
          <Text style={{ color: colors.orange, fontWeight: "900" }}>
            15 мин
          </Text>
        </View>
        {tasks.map((task, i) => (
          <Pressable
            key={`${task.type}-${i}`}
            onPress={() =>
              task.lesson ? onLesson(task.lesson) : onNavigate(task.type)
            }
            style={s.planTask}
          >
            <View style={[s.number, { backgroundColor: `${task.color}25` }]}>
              {task.done ? (
                <Ionicons name="checkmark" size={22} color={task.color} />
              ) : (
                <Text style={[s.numberText, { color: task.color }]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{task.title}</Text>
              <Text style={s.cardText}>{task.detail}</Text>
              <Text style={s.planReason}>Почему: {task.reason}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function VocabularyScreen({ onClose }) {
  const { progress, addCustomWord, removeCustomWord } = useProgress();
  const [english, setEnglish] = useState("");
  const [russian, setRussian] = useState("");
  const [example, setExample] = useState("");
  const [adding, setAdding] = useState(false);
  const save = () => {
    if (!english.trim() || !russian.trim()) return;
    addCustomWord(english, russian, example);
    setEnglish("");
    setRussian("");
    setExample("");
    setAdding(false);
  };
  const words = [...(progress.customWords || []), ...reviewWords];
  return (
    <View style={s.container}>
      <Header title="Личный словарь" onClose={onClose} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.row}>
          <View>
            <Text style={s.bigTitle}>Мои слова</Text>
            <Text style={s.subtitleLeft}>{words.length} слов</Text>
          </View>
          <Pressable onPress={() => setAdding(!adding)} style={s.add}>
            <Ionicons name={adding ? "close" : "add"} size={26} color="white" />
          </Pressable>
        </View>
        {adding && (
          <View style={s.form}>
            <TextInput
              value={english}
              onChangeText={setEnglish}
              placeholder="Слово на английском"
              placeholderTextColor={colors.textMuted}
              style={s.input}
              autoCapitalize="none"
            />
            <TextInput
              value={russian}
              onChangeText={setRussian}
              placeholder="Перевод"
              placeholderTextColor={colors.textMuted}
              style={s.input}
            />
            <TextInput
              value={example}
              onChangeText={setExample}
              placeholder="Пример (необязательно)"
              placeholderTextColor={colors.textMuted}
              style={s.input}
            />
            <PrimaryButton
              title="Добавить слово"
              onPress={save}
              disabled={!english.trim() || !russian.trim()}
            />
          </View>
        )}
        {words.map((word) => (
          <View key={word.id} style={s.wordRow}>
            <Pressable
              onPress={() => Speech.speak(word.english, { language: "en-US" })}
              style={s.sound}
            >
              <Ionicons name="volume-high" size={20} color={colors.purple} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.wordEnglish}>{word.english}</Text>
              <Text style={s.wordRussian}>{word.russian}</Text>
              {word.example ? (
                <Text style={s.wordExample}>{word.example}</Text>
              ) : null}
            </View>
            {word.id.startsWith("custom-") && (
              <Pressable onPress={() => removeCustomWord(word.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.pink} />
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function WeeklyExamScreen({ onClose }) {
  const { recordExam } = useProgress();
  const questions = useMemo(
    () =>
      [...placementQuestions.slice(2, 8), ...grammarQuestions.slice(0, 6)]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10),
    [],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [optionSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const question = questions[index];
  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === question.answer) setScore(score + 1);
  };
  const next = () => {
    if (index === questions.length - 1) {
      recordExam(score);
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected("");
    }
  };
  if (done)
    return (
      <View style={s.container}>
        <Header title="Недельный экзамен" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.trophy}>{score >= 8 ? "🏆" : "📝"}</Text>
          <Text style={s.resultTitle}>{score}/10</Text>
          <Text style={s.subtitle}>
            {score >= 8
              ? "Отличный результат! Сертификат получен."
              : "Ошибки покажут, что повторить на следующей неделе."}
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  return (
    <View style={s.container}>
      <Header title="Недельный экзамен" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar
          value={(index + 1) / questions.length}
          color={colors.orange}
        />
        <Text style={s.examMeta}>
          ВОПРОС {index + 1} ИЗ {questions.length}
        </Text>
        <Text style={s.examQuestion}>{question.prompt}</Text>
        {balancedOptions(
          question.options,
          question.answer,
          index,
          optionSeed,
        ).map((option) => (
          <Pressable
            key={option}
            onPress={() => choose(option)}
            style={[
              s.examOption,
              selected &&
                option === question.answer && { borderColor: colors.mint },
              selected === option &&
                option !== question.answer && { borderColor: colors.orange },
            ]}
          >
            <Text style={s.optionText}>{option}</Text>
          </Pressable>
        ))}
        {selected && (
          <PrimaryButton
            title={index === questions.length - 1 ? "Результат" : "Дальше"}
            onPress={next}
            color={selected === question.answer ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
}

const rewards = [
  {
    id: "shield",
    emoji: "🛡️",
    title: "Защита серии",
    detail: "Особая награда профиля",
    cost: 40,
  },
  {
    id: "night",
    emoji: "🌌",
    title: "Тема «Космос»",
    detail: "Коллекционная тема",
    cost: 70,
  },
  {
    id: "scholar",
    emoji: "🎓",
    title: "Аватар «Знаток»",
    detail: "Редкий аватар",
    cost: 100,
  },
  {
    id: "gold",
    emoji: "👑",
    title: "Золотой статус",
    detail: "Легендарная награда",
    cost: 180,
  },
];
export function RewardsScreen({ onClose }) {
  const { progress, buyReward } = useProgress();
  return (
    <View style={s.container}>
      <Header title="Награды" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.balance}>
          <Text style={s.coin}>🪙</Text>
          <View>
            <Text style={s.balanceValue}>{progress.coins || 0}</Text>
            <Text style={s.cardText}>твой баланс</Text>
          </View>
        </View>
        <Text style={s.bigTitle}>Магазин наград</Text>
        <Text style={s.subtitleLeft}>Получай монеты за правильные ответы</Text>
        {rewards.map((item) => {
          const owned = progress.ownedRewards?.includes(item.id);
          const enough = (progress.coins || 0) >= item.cost;
          return (
            <View key={item.id} style={s.reward}>
              <Text style={s.rewardEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>{item.detail}</Text>
              </View>
              <Pressable
                disabled={owned || !enough}
                onPress={() => buyReward(item.id, item.cost)}
                style={[s.price, { opacity: owned || !enough ? 0.4 : 1 }]}
              >
                <Text style={s.priceText}>
                  {owned ? "Куплено" : `🪙 ${item.cost}`}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ActivityScreen({ onClose }) {
  const { progress } = useProgress();
  const days = Array.from({ length: 28 }, (_, offset) => {
    const date = new Date(Date.now() - (27 - offset) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return { key, count: progress.activity?.[key] || 0, day: date.getDate() };
  });
  const active = days.filter((d) => d.count > 0).length;
  return (
    <View style={s.container}>
      <Header title="Активность" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.bigTitle}>Последние 4 недели</Text>
        <Text style={s.subtitleLeft}>
          {active} активных дней · серия {progress.streak}
        </Text>
        <View style={s.calendar}>
          {days.map((day) => (
            <View
              key={day.key}
              style={[
                s.day,
                {
                  backgroundColor:
                    day.count >= 4
                      ? colors.mint
                      : day.count >= 2
                        ? "rgba(46,211,183,0.55)"
                        : day.count >= 1
                          ? "rgba(46,211,183,0.25)"
                          : colors.card,
                },
              ]}
            >
              <Text style={[s.dayText, day.count > 0 && { color: "white" }]}>
                {day.day}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.legend}>
          <Text style={s.cardText}>Меньше</Text>
          {[0, 1, 2, 4].map((n) => (
            <View
              key={n}
              style={[
                s.legendBox,
                { opacity: n ? Math.min(1, 0.2 + n / 5) : 0.08 },
              ]}
            />
          ))}
          <Text style={s.cardText}>Больше</Text>
        </View>
        <View style={s.planScore}>
          <Text style={s.trophySmall}>📅</Text>
          <View>
            <Text style={s.cardTitle}>Цель: 5 дней в неделю</Text>
            <Text style={s.cardText}>Регулярность важнее длинных занятий</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function PronunciationScreen({ onClose }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer();
  const [index, setIndex] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const phrase = phrases[index][0];
  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted)
      return Alert.alert(
        "Нужен микрофон",
        "Разрешите доступ к микрофону для записи произношения.",
      );
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setHasRecording(false);
  };
  const stop = async () => {
    await recorder.stop();
    setHasRecording(Boolean(recorder.uri));
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  };
  const playMine = () => {
    if (recorder.uri) {
      player.replace(recorder.uri);
      player.play();
    }
  };
  const next = () => {
    setIndex((index + 1) % phrases.length);
    setHasRecording(false);
  };
  return (
    <View style={s.container}>
      <Header title="Произношение" onClose={onClose} />
      <View style={[s.content, { flex: 1 }]}>
        <Text style={s.examMeta}>СЛУШАЙ · ПОВТОРЯЙ · СРАВНИВАЙ</Text>
        <View style={s.pronounceCard}>
          <Text style={s.pronouncePhrase}>{phrase}</Text>
          <Text style={s.wordRussian}>{phrases[index][1]}</Text>
          <Pressable
            onPress={() =>
              Speech.speak(phrase, { language: "en-US", rate: 0.75 })
            }
            style={s.listen}
          >
            <Ionicons name="volume-high" size={22} color={colors.purple} />
            <Text style={s.listenText}>Послушать оригинал</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={recorderState.isRecording ? stop : start}
          style={[
            s.record,
            recorderState.isRecording && { backgroundColor: colors.pink },
          ]}
        >
          <Ionicons
            name={recorderState.isRecording ? "stop" : "mic"}
            size={34}
            color="white"
          />
        </Pressable>
        <Text style={s.recordHint}>
          {recorderState.isRecording
            ? `Запись… ${Math.round((recorderState.durationMillis || 0) / 1000)} сек`
            : "Нажми и произнеси фразу"}
        </Text>
        {hasRecording && (
          <View style={s.compare}>
            <Pressable onPress={playMine} style={s.compareButton}>
              <Ionicons name="play" size={20} color={colors.mint} />
              <Text style={s.compareText}>Моя запись</Text>
            </Pressable>
            <Pressable onPress={next} style={s.compareButton}>
              <Text style={s.compareText}>Следующая</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.mint} />
            </Pressable>
          </View>
        )}
      </View>
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
  content: { padding: 20, paddingBottom: 45 },
  bigTitle: { color: "white", fontSize: 32, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  subtitleLeft: { color: colors.textMuted, marginTop: 6, marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  cardText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  planScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 22,
    marginVertical: 20,
  },
  planNumber: { color: colors.mint, fontSize: 28, fontWeight: "900" },
  planTask: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 11,
  },
  number: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontSize: 17, fontWeight: "900" },
  planReason: {
    color: colors.orange,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 15,
    gap: 10,
    marginVertical: 18,
  },
  input: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: colors.cardLight,
    paddingHorizontal: 14,
    color: "white",
    fontSize: 16,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 10,
  },
  sound: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(124,92,252,.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  wordEnglish: { color: "white", fontSize: 17, fontWeight: "800" },
  wordRussian: { color: colors.textMuted, marginTop: 3 },
  wordExample: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  trophy: { fontSize: 80 },
  resultTitle: {
    color: "white",
    fontSize: 45,
    fontWeight: "900",
    marginTop: 16,
  },
  examMeta: {
    color: colors.orange,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 22,
  },
  examQuestion: {
    color: "white",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    marginVertical: 22,
  },
  examOption: {
    minHeight: 59,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: { color: "white", fontSize: 16, fontWeight: "600" },
  balance: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    backgroundColor: "rgba(255,159,67,.14)",
    borderRadius: 23,
    padding: 20,
    marginBottom: 25,
  },
  coin: { fontSize: 46 },
  balanceValue: { color: colors.orange, fontSize: 30, fontWeight: "900" },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 20,
    marginBottom: 11,
  },
  rewardEmoji: { fontSize: 36 },
  price: {
    backgroundColor: "rgba(255,159,67,.16)",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 13,
  },
  priceText: { color: colors.orange, fontWeight: "800", fontSize: 12 },
  calendar: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 },
  day: {
    width: "12%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 17,
  },
  legendBox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },
  trophySmall: { fontSize: 38 },
  pronounceCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 235,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    marginTop: 18,
  },
  pronouncePhrase: {
    color: "white",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
  },
  listen: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 14,
    marginTop: 17,
  },
  listenText: { color: "white", fontWeight: "700" },
  record: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 27,
  },
  recordHint: { color: colors.textMuted, textAlign: "center", marginTop: 11 },
  compare: { flexDirection: "row", gap: 12, marginTop: 23 },
  compareButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: "rgba(46,211,183,.13)",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  compareText: { color: colors.mint, fontWeight: "800" },
});
