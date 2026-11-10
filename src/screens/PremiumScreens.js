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
import * as Speech from "expo-speech";
import { vocabularyTopics } from "../data/megaPractice";
import { extendedVocabularyTopics } from "../data/growthContent";
import { ieltsReading, ieltsListening } from "../data/deepLearning";
import { careerTracks, seasonTwoChapters } from "../data/premiumContent";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions, shuffleOptions } from "../utils/shuffle";
import { answersMatch } from "../utils/answer";
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
const words = [...vocabularyTopics, ...extendedVocabularyTopics].flatMap(
  (x) => x.words,
);

export function WrittenVocabularyScreen({ onClose }) {
  const { recordExercise, recordLexiconReview } = useProgress();
  const [seed] = useState(() => Date.now());
  const deck = useMemo(
    () =>
      shuffleOptions(words, seed)
        .slice(0, 15)
        .map((word, i) => ({ ...word, direction: i % 2 ? "ru-en" : "en-ru" })),
    [],
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const item = deck[index];
  const expected = item.direction === "ru-en" ? item.english : item.russian;
  const right = answersMatch(answer, expected);
  const check = () => {
    setChecked(true);
    if (right) setScore(score + 1);
    recordExercise(
      {
        id: `written-${item.id}-${item.direction}`,
        prompt: item.direction === "ru-en" ? item.russian : item.english,
        answer: expected,
      },
      right,
    );
    recordLexiconReview(item.id, right ? "good" : "again");
  };
  const next = () => {
    if (index === 14) setDone(true);
    else {
      setIndex(index + 1);
      setAnswer("");
      setChecked(false);
    }
  };
  if (done)
    return (
      <View style={s.container}>
        <Header title="Письменный перевод" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>✍️</Text>
          <Text style={s.result}>{score}/15</Text>
          <Text style={s.subtitle}>
            Ошибки добавлены в повторение, правильные слова получили новый
            интервал.
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  return (
    <View style={s.container}>
      <Header title="Письменный перевод" onClose={onClose} />
      <View style={[s.content, { flex: 1 }]}>
        <ProgressBar value={(index + 1) / 15} color={colors.mint} />
        <Text style={s.eyebrow}>
          {item.direction === "ru-en"
            ? "РУССКИЙ → АНГЛИЙСКИЙ"
            : "АНГЛИЙСКИЙ → РУССКИЙ"}{" "}
          · {index + 1}/15
        </Text>
        <Text style={s.prompt}>
          {item.direction === "ru-en" ? item.russian : item.english}
        </Text>
        {item.direction === "en-ru" && (
          <Pressable
            onPress={() =>
              Speech.speak(item.english, { language: "en-US", rate: 0.7 })
            }
            style={s.listen}
          >
            <Ionicons name="volume-high" size={20} color={colors.purple} />
            <Text style={s.listenText}>Послушать</Text>
          </Pressable>
        )}
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          editable={!checked}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Напиши перевод без вариантов…"
          placeholderTextColor={colors.textMuted}
          style={[
            s.input,
            checked && { borderColor: right ? colors.mint : colors.orange },
          ]}
        />
        {checked && (
          <View style={s.feedback}>
            <Text
              style={{
                color: right ? colors.mint : colors.orange,
                fontWeight: "900",
              }}
            >
              {right ? "Верно!" : `Правильно: ${expected}`}
            </Text>
            <Text style={s.example}>{item.example}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <PrimaryButton
          disabled={!answer.trim()}
          title={
            checked
              ? index === 14
                ? "Результат"
                : "Следующее слово"
              : "Проверить"
          }
          onPress={checked ? next : check}
          color={
            checked ? (right ? colors.mint : colors.orange) : colors.purple
          }
        />
      </View>
    </View>
  );
}

export function CareerCoursesScreen({ onClose }) {
  const { progress, completeCareer } = useProgress();
  const [track, setTrack] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  if (!track)
    return (
      <View style={s.container}>
        <Header title="Профессиональные курсы" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Английский для профессии</Text>
          <Text style={s.subtitle}>
            5 направлений · реальные термины и рабочие фразы
          </Text>
          {careerTracks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setTrack(item);
                setIndex(0);
                setSelected("");
                setScore(0);
                setDone(false);
              }}
              style={s.card}
            >
              <Text style={s.cardEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.level}>{item.level}</Text>
                </View>
                <Text style={s.cardText}>{item.description}</Text>
              </View>
              <Ionicons
                name={
                  progress.careerCompleted?.includes(item.id)
                    ? "checkmark-circle"
                    : "chevron-forward"
                }
                size={23}
                color={
                  progress.careerCompleted?.includes(item.id)
                    ? colors.mint
                    : colors.textMuted
                }
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  if (done)
    return (
      <View style={s.container}>
        <Header title={track.title} onClose={() => setTrack(null)} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>{score >= 5 ? "🎓" : track.emoji}</Text>
          <Text style={s.result}>{score}/6</Text>
          <Text style={s.subtitle}>
            {score >= 5
              ? "Специализация выполнена"
              : "Для выполнения нужно минимум 5 правильных ответов"}
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton
              title="К направлениям"
              onPress={() => setTrack(null)}
            />
          </View>
        </View>
      </View>
    );
  const item = track.exercises[index];
  const next = () => {
    const final = score + (selected === item.answer ? 1 : 0);
    if (index === 5) {
      setScore(final);
      if (final >= 5) completeCareer(track.id);
      setDone(true);
    } else {
      setScore(final);
      setIndex(index + 1);
      setSelected("");
    }
  };
  return (
    <View style={s.container}>
      <Header title={track.title} onClose={() => setTrack(null)} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar value={(index + 1) / 6} color={colors.purple} />
        <Text style={s.eyebrow}>
          {track.level} · {index + 1}/6
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
          <PrimaryButton
            title={index === 5 ? "Результат" : "Дальше"}
            onPress={next}
            color={selected === item.answer ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
}

export function StorySeasonTwoScreen({ onClose }) {
  const { progress, saveSeasonTwo } = useProgress();
  const saved = progress.seasonTwo || {};
  const [index, setIndex] = useState(
    saved.completed ? 0 : Math.min(saved.chapter || 0, 9),
  );
  const [score, setScore] = useState(saved.completed ? 0 : saved.score || 0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const item = seasonTwoChapters[index];
  const next = () => {
    const final = score + selected[2];
    const complete = index === 9;
    saveSeasonTwo(
      complete ? 10 : index + 1,
      final,
      { chapter: item.id, choice: selected[1] },
      complete,
    );
    setScore(final);
    if (complete) setDone(true);
    else {
      setIndex(index + 1);
      setSelected(null);
    }
  };
  if (done)
    return (
      <View style={s.container}>
        <Header title="Сезон 2" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>{score >= 25 ? "👑" : "🧭"}</Text>
          <Text style={s.result}>{score}/30</Text>
          <Text style={s.title}>
            {score >= 25 ? "Лидер доверия" : "Опытный специалист"}
          </Text>
          <Text style={s.subtitle}>
            Финал зависит от решений во всех десяти главах.
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить сезон" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  return (
    <View style={s.container}>
      <Header title="Сюжет · Сезон 2" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar value={(index + 1) / 10} color={colors.orange} />
        <Text style={s.eyebrow}>ГЛАВА {index + 1} ИЗ 10</Text>
        <Text style={s.storyEmoji}>{item.emoji}</Text>
        <Text style={s.title}>{item.title}</Text>
        <View style={s.story}>
          <Text style={s.storyText}>{item.text}</Text>
        </View>
        {item.choices.map((choice, i) => (
          <Pressable
            key={choice[1]}
            disabled={!!selected}
            onPress={() => setSelected(choice)}
            style={[
              s.choice,
              selected?.[1] === choice[1] && {
                borderColor: choice[2] >= 2 ? colors.mint : colors.orange,
              },
            ]}
          >
            <Text style={s.choiceNumber}>{i + 1}</Text>
            <Text style={s.choiceText}>{choice[0]}</Text>
          </Pressable>
        ))}
        {selected && (
          <PrimaryButton
            title={index === 9 ? "Финал" : "Следующая глава"}
            onPress={next}
            color={selected[2] >= 2 ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
}

const mockQuestions = [
  ...ieltsReading.flatMap((set) =>
    set.questions.map((row, i) => ({
      id: `r-${set.id}-${i}`,
      section: "Reading",
      context: set.passage,
      prompt: row[0],
      answer: row[1],
      options: [row[1], ...row[2]],
    })),
  ),
  ...ieltsListening.flatMap((set) =>
    set.questions.map((row, i) => ({
      id: `l-${set.id}-${i}`,
      section: "Listening",
      audio: set.text,
      prompt: row[0],
      answer: row[1],
      options: [row[1], ...row[2]],
    })),
  ),
];
export function FullIeltsMockScreen({ onClose }) {
  const { progress, recordFullIelts } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  const deck = useMemo(
    () => shuffleOptions(mockQuestions, seed).slice(0, 20),
    [],
  );
  const item = deck[index];
  if (done) {
    const band = Math.round((1 + (score / 20) * 8) * 2) / 2;
    return (
      <View style={s.container}>
        <Header title="IELTS Mock" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>🏅</Text>
          <Text style={s.band}>Band {band.toFixed(1)}</Text>
          <Text style={s.subtitle}>
            {score}/20 правильных · лучший Band{" "}
            {Math.max(progress.fullIeltsBest || 0, band).toFixed(1)}
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton
              title="Сохранить и завершить"
              onPress={() => {
                recordFullIelts(band);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    );
  }
  const next = () => {
    const final = score + (selected === item.answer ? 1 : 0);
    if (index === 19) {
      setScore(final);
      setDone(true);
    } else {
      setScore(final);
      setIndex(index + 1);
      setSelected("");
    }
  };
  return (
    <View style={s.container}>
      <Header title="Полный IELTS Mock" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar value={(index + 1) / 20} color={colors.pink} />
        <Text style={s.eyebrow}>
          {item.section} · {index + 1}/20
        </Text>
        {item.audio ? (
          <View style={s.audio}>
            <Pressable
              onPress={() =>
                Speech.speak(item.audio, { language: "en-US", rate: 0.72 })
              }
            >
              <Ionicons name="play-circle" size={55} color={colors.orange} />
            </Pressable>
            <Text style={s.cardText}>Прослушай запись и ответь</Text>
          </View>
        ) : (
          <View style={s.story}>
            <Text style={s.storyText}>{item.context}</Text>
          </View>
        )}
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
          <PrimaryButton
            title={index === 19 ? "Рассчитать Band" : "Дальше"}
            onPress={next}
            color={selected === item.answer ? colors.mint : colors.orange}
          />
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
  title: { color: "white", fontSize: 32, lineHeight: 39, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  bigEmoji: { fontSize: 70 },
  result: { color: "white", fontSize: 47, fontWeight: "900", marginTop: 10 },
  eyebrow: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 22,
  },
  prompt: {
    color: "white",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    marginTop: 28,
  },
  listen: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12 },
  listenText: { color: colors.purple, fontWeight: "800" },
  input: {
    minHeight: 105,
    color: "white",
    fontSize: 18,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 16,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlignVertical: "top",
  },
  feedback: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 15,
    marginTop: 13,
  },
  example: { color: colors.textMuted, fontStyle: "italic", marginTop: 7 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 35 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  cardText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  level: { color: colors.purple, fontSize: 10, fontWeight: "900" },
  question: {
    color: "white",
    fontSize: 26,
    lineHeight: 34,
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
  optionText: { color: "white", fontSize: 15, fontWeight: "650" },
  correct: { borderColor: colors.mint },
  wrong: { borderColor: colors.orange },
  storyEmoji: { fontSize: 58, textAlign: "center", marginTop: 20 },
  story: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 17,
    marginVertical: 16,
  },
  storyText: { color: "white", fontSize: 16, lineHeight: 24 },
  choice: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  choiceNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.cardLight,
    color: colors.purple,
    textAlign: "center",
    paddingTop: 5,
    fontWeight: "900",
  },
  choiceText: { color: "white", lineHeight: 21, flex: 1 },
  audio: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
  },
  band: { color: colors.mint, fontSize: 46, fontWeight: "900", marginTop: 12 },
});
