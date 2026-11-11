import React, { useEffect, useMemo, useState } from "react";
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
import { speak } from "../utils/speech";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { vocabularyTopics } from "../data/megaPractice";
import {
  branchingDialogues,
  ieltsReading,
  ieltsListening,
  ieltsWriting,
  ieltsSpeaking,
} from "../data/deepLearning";
import { grammarQuestions } from "../data/practice";
import { extendedVocabularyTopics } from "../data/growthContent";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions, shuffleOptions } from "../utils/shuffle";
import { answersMatch } from "../utils/answer";

const today = () => new Date().toISOString().slice(0, 10);
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
function Timer({ minutes }) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    const id = setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  const urgent = seconds < 60;
  return (
    <View
      style={[s.timer, urgent && { backgroundColor: "rgba(255,92,138,.18)" }]}
    >
      <Ionicons
        name="timer-outline"
        size={19}
        color={urgent ? colors.pink : colors.orange}
      />
      <Text style={[s.timerText, urgent && { color: colors.pink }]}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </Text>
    </View>
  );
}

export function SpacedRepetitionScreen({ onClose }) {
  const { progress, recordLexiconReview } = useProgress();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const stats = progress.lexicalReviewStats || {};
  const words = [...vocabularyTopics, ...extendedVocabularyTopics].flatMap(
    (topic) => topic.words.map((word) => ({ ...word, topic: topic.title })),
  );
  const due = words.filter(
    (word) =>
      !stats[word.id] ||
      !stats[word.id].dueDate ||
      stats[word.id].dueDate <= today(),
  );
  const deck = useMemo(
    () => shuffleOptions(due, `${Date.now()}`).slice(0, 15),
    [started],
  );
  const item = deck[index];
  const mastered = words.filter(
    (word) => (stats[word.id]?.box || 0) >= 4,
  ).length;
  const learning = words.filter((word) => stats[word.id]).length - mastered;
  if (!started)
    return (
      <View style={s.container}>
        <Header title="Повторение слов" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Память по расписанию</Text>
          <Text style={s.subtitle}>
            Слова возвращаются через 1 · 3 · 7 · 14 · 30 дней
          </Text>
          <View style={s.stats}>
            <Stat value={due.length} label="сегодня" color={colors.orange} />
            <Stat value={learning} label="учишь" color={colors.purple} />
            <Stat value={mastered} label="освоено" color={colors.mint} />
          </View>
          <View style={s.info}>
            <Ionicons name="bulb" size={25} color={colors.orange} />
            <Text style={s.infoText}>
              «Снова» вернёт слово в текущую сессию. «Легко» быстрее увеличит
              интервал.
            </Text>
          </View>
          <PrimaryButton
            disabled={!due.length}
            title={
              due.length
                ? `Начать · ${Math.min(15, due.length)} слов`
                : "На сегодня всё выполнено"
            }
            onPress={() => setStarted(true)}
          />
        </ScrollView>
      </View>
    );
  if (done || !item)
    return (
      <View style={s.container}>
        <Header title="Повторение слов" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>🧠</Text>
          <Text style={s.result}>Сессия готова</Text>
          <Text style={s.subtitle}>Следующие слова появятся по расписанию</Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  const rate = (rating) => {
    recordLexiconReview(item.id, rating);
    if (rating === "again") {
      setRevealed(false);
      return;
    }
    if (index === deck.length - 1) setDone(true);
    else {
      setIndex(index + 1);
      setRevealed(false);
    }
  };
  return (
    <View style={s.container}>
      <Header title="Интервальное повторение" onClose={onClose} />
      <View style={[s.content, { flex: 1 }]}>
        <ProgressBar value={(index + 1) / deck.length} color={colors.purple} />
        <Text style={s.eyebrow}>
          {item.topic} · {index + 1}/{deck.length}
        </Text>
        <Pressable onPress={() => setRevealed(true)} style={s.flashcard}>
          <Text style={s.flashWord}>{item.english}</Text>
          <Pressable
            onPress={() =>
              speak(item.english, { language: "en-US", rate: 0.7 })
            }
            style={s.sound}
          >
            <Ionicons name="volume-high" size={23} color={colors.purple} />
          </Pressable>
          {revealed ? (
            <>
              <Text style={s.flashTranslation}>{item.russian}</Text>
              <Text style={s.example}>{item.example}</Text>
            </>
          ) : (
            <Text style={s.tapHint}>Вспомни перевод и нажми на карточку</Text>
          )}
        </Pressable>
        <View style={{ flex: 1 }} />
        {revealed ? (
          <>
            <Text style={s.rateTitle}>Насколько хорошо вспомнил?</Text>
            <View style={s.ratings}>
              {[
                ["again", "Снова", "сейчас", colors.pink],
                ["hard", "Трудно", "1 день", colors.orange],
                ["good", "Хорошо", "3+ дня", colors.purple],
                ["easy", "Легко", "7+ дней", colors.mint],
              ].map(([id, label, hint, color]) => (
                <Pressable key={id} onPress={() => rate(id)} style={s.rating}>
                  <Text style={[s.ratingLabel, { color }]}>{label}</Text>
                  <Text style={s.ratingHint}>{hint}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <PrimaryButton
            title="Показать перевод"
            onPress={() => setRevealed(true)}
          />
        )}
      </View>
    </View>
  );
}

export function BranchingDialoguesScreen({ onClose }) {
  const { progress, recordBranchingDialogue } = useProgress();
  const [dialogue, setDialogue] = useState(null);
  const [nodeId, setNodeId] = useState(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  if (!dialogue)
    return (
      <View style={s.container}>
        <Header title="Диалоги с выбором" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Твои ответы меняют историю</Text>
          <Text style={s.subtitle}>
            {branchingDialogues.length} ситуаций · несколько путей · разные концовки
          </Text>
          {branchingDialogues.map((item) => {
            const result = progress.branchingResults?.[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setDialogue(item);
                  setNodeId(item.start);
                  setScore(0);
                  setHistory([]);
                }}
                style={s.scenario}
              >
                <Text style={s.scenarioEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={s.rowTop}>
                    <Text style={s.cardTitle}>{item.title}</Text>
                    <Text style={s.badge}>{item.level}</Text>
                  </View>
                  <Text style={s.cardText}>{item.intro}</Text>
                  {result && (
                    <Text style={s.complete}>
                      ✓ {result.ending} · {result.score} очков
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  const node = dialogue.nodes[nodeId];
  if (node.ending) {
    const color =
      node.tone === "success"
        ? colors.mint
        : node.tone === "fail"
          ? colors.pink
          : colors.orange;
    return (
      <View style={s.container}>
        <Header title={dialogue.title} onClose={() => setDialogue(null)} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>
            {node.tone === "success"
              ? "🏆"
              : node.tone === "fail"
                ? "🔄"
                : "🤝"}
          </Text>
          <Text style={[s.result, { color }]}>{node.ending}</Text>
          <Text style={s.endingText}>{node.text}</Text>
          <Text style={s.score}>
            {score} очков · {history.length} решений
          </Text>
          <View style={{ width: "100%", gap: 10 }}>
            <PrimaryButton
              title="Сохранить результат"
              onPress={() => {
                recordBranchingDialogue(dialogue.id, node.ending, score);
                setDialogue(null);
              }}
              color={color}
            />
            <PrimaryButton
              title="Пройти другим путём"
              onPress={() => {
                setNodeId(dialogue.start);
                setScore(0);
                setHistory([]);
              }}
            />
          </View>
        </View>
      </View>
    );
  }
  const choose = ([text, next, points]) => {
    setHistory([
      ...history,
      { speaker: node.speaker, line: node.line, answer: text },
    ]);
    setScore(score + points);
    setNodeId(next);
  };
  return (
    <View style={s.container}>
      <Header title={dialogue.title} onClose={() => setDialogue(null)} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar
          value={Math.min(0.9, (history.length + 1) / 4)}
          color={colors.mint}
        />
        <Text style={s.eyebrow}>РЕШЕНИЕ {history.length + 1}</Text>
        {history.slice(-2).map((entry, i) => (
          <View key={`${entry.speaker}-${i}`} style={s.history}>
            <Text style={s.historySpeaker}>{entry.speaker}</Text>
            <Text style={s.historyLine}>{entry.line}</Text>
            <Text style={s.historyAnswer}>Ты: {entry.answer}</Text>
          </View>
        ))}
        <View style={s.speech}>
          <Text style={s.speaker}>{node.speaker}</Text>
          <Text style={s.speechText}>{node.line}</Text>
          <Pressable
            onPress={() =>
              speak(node.line, { language: "en-US", rate: 0.74 })
            }
          >
            <Ionicons name="volume-high" size={21} color={colors.purple} />
          </Pressable>
        </View>
        <Text style={s.chooseTitle}>Как ответишь?</Text>
        {node.choices.map((choice, i) => (
          <Pressable
            key={choice[0]}
            onPress={() => choose(choice)}
            style={s.choice}
          >
            <Text style={s.choiceNumber}>{i + 1}</Text>
            <Text style={s.choiceText}>{choice[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function QuizModule({ title, items, listening, onFinish, onClose }) {
  const [itemIndex, setItemIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  const item = items[itemIndex];
  const row = item.questions[questionIndex];
  const question = {
    prompt: row[0],
    answer: row[1],
    options: [row[1], ...row[2]],
  };
  const total = items.length * 3;
  const current = itemIndex * 3 + questionIndex;
  if (done)
    return (
      <View style={s.container}>
        <Header title={title} onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>📈</Text>
          <Text style={s.result}>
            {score}/{total}
          </Text>
          <Text style={s.subtitle}>Лучший результат сохранён</Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  const next = () => {
    const nextScore = score + (selected === question.answer ? 1 : 0);
    if (questionIndex === 2 && itemIndex === items.length - 1) {
      setScore(nextScore);
      onFinish(nextScore);
      setDone(true);
    } else {
      setScore(nextScore);
      setSelected("");
      if (questionIndex === 2) {
        setItemIndex(itemIndex + 1);
        setQuestionIndex(0);
      } else setQuestionIndex(questionIndex + 1);
    }
  };
  return (
    <View style={s.container}>
      <Header title={title} onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.timerRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={(current + 1) / total} color={colors.orange} />
          </View>
          <Timer minutes={listening ? 15 : 20} />
        </View>
        <Text style={s.eyebrow}>
          {item.title} · {current + 1}/{total}
        </Text>
        {listening ? (
          <View style={s.audioBox}>
            <Pressable
              onPress={() =>
                speak(item.text, { language: "en-US", rate: 0.72 })
              }
              style={s.play}
            >
              <Ionicons name="play" size={30} color="white" />
            </Pressable>
            <Text style={s.cardText}>
              Запись можно прослушать несколько раз
            </Text>
          </View>
        ) : (
          <View style={s.passage}>
            <Text style={s.passageText}>{item.passage}</Text>
          </View>
        )}
        <Text style={s.question}>{question.prompt}</Text>
        {balancedOptions(question.options, question.answer, current, seed).map(
          (option) => (
            <Pressable
              key={option}
              disabled={!!selected}
              onPress={() => setSelected(option)}
              style={[
                s.option,
                selected && option === question.answer && s.correct,
                selected === option && option !== question.answer && s.wrong,
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ),
        )}
        {selected && (
          <PrimaryButton
            title={current === total - 1 ? "Результат" : "Дальше"}
            onPress={next}
            color={selected === question.answer ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
}

export function IeltsScreen({ onClose }) {
  const { progress, recordIelts } = useProgress();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer();
  const [hasRecording, setHasRecording] = useState(false);
  const [module, setModule] = useState(null);
  const [writing, setWriting] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [text, setText] = useState("");
  const p = progress.ieltsProgress || {};
  const startSpeakingRecording = async () => { const permission = await requestRecordingPermissionsAsync(); if (!permission.granted) return Alert.alert("Нужен микрофон", "Разрешите доступ к микрофону для записи IELTS Speaking."); await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); await recorder.prepareToRecordAsync(); recorder.record(); setHasRecording(false); };
  const stopSpeakingRecording = async () => { await recorder.stop(); setHasRecording(Boolean(recorder.uri)); await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); };
  const playSpeakingRecording = () => { if (recorder.uri) { player.replace(recorder.uri); player.play(); } };
  if (module === "reading")
    return (
      <QuizModule
        title="IELTS Reading"
        items={ieltsReading}
        onFinish={(v) => recordIelts("reading", v)}
        onClose={() => setModule(null)}
      />
    );
  if (module === "listening")
    return (
      <QuizModule
        title="IELTS Listening"
        items={ieltsListening}
        listening
        onFinish={(v) => recordIelts("listening", v)}
        onClose={() => setModule(null)}
      />
    );
  if (writing) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return (
      <View style={s.container}>
        <Header
          title={`IELTS ${writing.type}`}
          onClose={() => setWriting(null)}
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          <Timer minutes={40} />
          <Text style={s.title}>{writing.title}</Text>
          <Text style={s.prompt}>{writing.prompt}</Text>
          <TextInput
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            placeholder="Write your answer here…"
            placeholderTextColor={colors.textMuted}
            style={s.editor}
          />
          <Text style={s.wordCount}>{words} words</Text>
          <Text style={s.section}>CHECKLIST</Text>
          {writing.checklist.map((x) => (
            <View key={x} style={s.check}>
              <Ionicons name="checkbox-outline" size={20} color={colors.mint} />
              <Text style={s.checkText}>{x}</Text>
            </View>
          ))}
          <PrimaryButton
            disabled={words < 10}
            title={
              p.writingCompleted?.includes(writing.title)
                ? "Выполнено ✓"
                : "Отметить выполненным"
            }
            onPress={() => recordIelts("writing", writing.title)}
          />
        </ScrollView>
      </View>
    );
  }
  if (speaking)
    return (
      <View style={s.container}>
        <Header title="IELTS Speaking" onClose={() => setSpeaking(null)} />
        <View style={[s.content, { flex: 1 }]}>
          <Timer minutes={2} />
          <Text style={s.eyebrow}>{speaking.part}</Text>
          <Text style={s.title}>{speaking.title}</Text>
          <View style={s.speakingCard}>
            <Text style={s.speakingPrompt}>{speaking.prompt}</Text>
            <Pressable
              onPress={() =>
                speak(speaking.prompt, { language: "en-US", rate: 0.72 })
              }
              style={s.listenButton}
            >
              <Ionicons name="volume-high" size={21} color={colors.purple} />
              <Text style={s.listenText}>Послушать вопрос</Text>
            </Pressable>
          </View>
          <Text style={s.speakingTip}>
            Говори 1–2 минуты. Используй причину, пример и вывод.
          </Text>
          <Pressable onPress={recorderState.isRecording ? stopSpeakingRecording : startSpeakingRecording} style={[s.recordSpeaking, recorderState.isRecording && { backgroundColor: colors.pink }]}>
            <Ionicons name={recorderState.isRecording ? "stop" : "mic"} size={29} color="white" />
            <Text style={s.recordSpeakingText}>{recorderState.isRecording ? `Остановить · ${Math.round((recorderState.durationMillis || 0) / 1000)} сек` : "Записать свой ответ"}</Text>
          </Pressable>
          {hasRecording && <Pressable onPress={playSpeakingRecording} style={s.playMine}><Ionicons name="play" size={20} color={colors.mint}/><Text style={s.playMineText}>Прослушать мою запись</Text></Pressable>}
          <View style={{ flex: 1 }} />
          <PrimaryButton
            title={
              p.speakingCompleted?.includes(speaking.id)
                ? "Выполнено ✓"
                : "Отметить практику"
            }
            onPress={() => recordIelts("speaking", speaking.id)}
          />
        </View>
      </View>
    );
  if (module === "writing")
    return (
      <View style={s.container}>
        <Header title="IELTS Writing" onClose={() => setModule(null)} />
        <ScrollView contentContainerStyle={s.content}>
          {ieltsWriting.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => {
                setWriting(item);
                setText("");
              }}
              style={s.row}
            >
              <View style={s.moduleIcon}>
                <Ionicons name="create" size={23} color={colors.mint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>
                  {item.type} · {item.prompt}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  if (module === "speaking")
    return (
      <View style={s.container}>
        <Header title="IELTS Speaking" onClose={() => setModule(null)} />
        <ScrollView contentContainerStyle={s.content}>
          {ieltsSpeaking.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSpeaking(item)}
              style={s.row}
            >
              <View style={s.moduleIcon}>
                <Ionicons name="mic" size={23} color={colors.pink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>
                  {item.part} · {item.prompt}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  return (
    <View style={s.container}>
      <Header title="IELTS Trainer" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Подготовка по 4 навыкам</Text>
        <Text style={s.subtitle}>
          Задания формата IELTS от Band 6.0 до 7.5+
        </Text>
        {[
          [
            "reading",
            "book",
            "Reading",
            "4 текста · 12 вопросов",
            `${p.readingBest || 0}/12`,
            colors.purple,
          ],
          [
            "listening",
            "headset",
            "Listening",
            "4 записи · 12 вопросов",
            `${p.listeningBest || 0}/12`,
            colors.orange,
          ],
          [
            "writing",
            "create",
            "Writing",
            "6 заданий Task 1 и Task 2",
            `${p.writingCompleted?.length || 0}/6`,
            colors.mint,
          ],
          [
            "speaking",
            "mic",
            "Speaking",
            "12 вопросов Parts 1–3",
            `${p.speakingCompleted?.length || 0}/12`,
            colors.pink,
          ],
        ].map(([id, icon, title, detail, result, color]) => (
          <Pressable
            key={id}
            onPress={() => setModule(id)}
            style={s.ieltsModule}
          >
            <View style={[s.ieltsIcon, { backgroundColor: `${color}20` }]}>
              <Ionicons name={icon} size={27} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{title}</Text>
              <Text style={s.cardText}>{detail}</Text>
            </View>
            <Text style={[s.moduleResult, { color }]}>{result}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function SmartCoachScreen({ onClose }) {
  const { progress, resolveMistake, recordGrammar } = useProgress();
  const mistakes = progress.mistakes || [];
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [seed] = useState(() => Date.now());
  const mistakeDeck = useMemo(() => mistakes.slice(0, 10), [started]);
  const fallback = useMemo(
    () => shuffleOptions(grammarQuestions, seed).slice(0, 10),
    [],
  );
  const useMistakes = mistakeDeck.length > 0;
  const deck = useMistakes ? mistakeDeck : fallback;
  const item = deck[index];
  const grammarAccuracy = progress.stats?.grammarTotal
    ? Math.round(
        (progress.stats.grammarCorrect / progress.stats.grammarTotal) * 100,
      )
    : 0;
  const dictationAccuracy = progress.stats?.dictationTotal
    ? Math.round(
        (progress.stats.dictationCorrect / progress.stats.dictationTotal) * 100,
      )
    : 0;
  if (!started)
    return (
      <View style={s.container}>
        <Header title="Умный тренер" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Урок собран для тебя</Text>
          <Text style={s.subtitle}>
            Тренер анализирует журнал ошибок и результаты занятий
          </Text>
          <View style={s.coachCard}>
            <Text style={s.coachEmoji}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>
                {mistakes.length
                  ? `${mistakes.length} ошибок требуют внимания`
                  : "Ошибок пока нет — закрепим грамматику"}
              </Text>
              <Text style={s.cardText}>
                {mistakes.length
                  ? "Сначала появятся самые свежие ошибки."
                  : "Я выбрал смешанный набор подходящего уровня."}
              </Text>
            </View>
          </View>
          <Text style={s.section}>АНАЛИЗ НАВЫКОВ</Text>
          <Skill
            label="Грамматика"
            value={grammarAccuracy}
            color={colors.purple}
          />
          <Skill
            label="Диктанты"
            value={dictationAccuracy}
            color={colors.orange}
          />
          <Skill
            label="Пройденные курсы"
            value={Math.min(
              100,
              Math.round((progress.completed.length / 43) * 100),
            )}
            color={colors.mint}
          />
          <View style={s.info}>
            <Ionicons name="sparkles" size={24} color={colors.orange} />
            <Text style={s.infoText}>
              Неверный ответ останется в журнале. Правильный ответ удалит ошибку
              и принесёт монеты.
            </Text>
          </View>
          <PrimaryButton
            title={`Начать персональный урок · ${deck.length}`}
            onPress={() => setStarted(true)}
          />
        </ScrollView>
      </View>
    );
  if (done)
    return (
      <View style={s.container}>
        <Header title="Умный тренер" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.bigEmoji}>✨</Text>
          <Text style={s.result}>
            {score}/{deck.length}
          </Text>
          <Text style={s.subtitle}>
            {useMistakes ? "Журнал ошибок стал чище" : "Грамматика закреплена"}
          </Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  const right = useMistakes
    ? answersMatch(answer, item.answer)
    : selected === item.answer;
  const check = () => {
    const ok = useMistakes
      ? answersMatch(answer, item.answer)
      : selected === item.answer;
    setChecked(true);
    if (ok) {
      setScore(score + 1);
      if (useMistakes) resolveMistake(item.id);
      else recordGrammar(item, true);
    } else if (!useMistakes) recordGrammar(item, false);
  };
  const next = () => {
    if (index === deck.length - 1) setDone(true);
    else {
      setIndex(index + 1);
      setAnswer("");
      setSelected("");
      setChecked(false);
    }
  };
  return (
    <View style={s.container}>
      <Header title="Персональный урок" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar value={(index + 1) / deck.length} color={colors.purple} />
        <Text style={s.eyebrow}>
          {useMistakes ? item.type : "ГРАММАТИКА"} · {index + 1}/{deck.length}
        </Text>
        <Text style={s.question}>{item.prompt}</Text>
        {useMistakes ? (
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            editable={!checked}
            placeholder="Напиши правильный ответ"
            placeholderTextColor={colors.textMuted}
            style={s.answerInput}
          />
        ) : (
          item.options.map((option) => (
            <Pressable
              key={option}
              disabled={!!selected}
              onPress={() => setSelected(option)}
              style={[
                s.option,
                checked && option === item.answer && s.correct,
                checked &&
                  selected === option &&
                  option !== item.answer &&
                  s.wrong,
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ))
        )}
        {checked && (
          <View style={s.feedback}>
            <Text
              style={[
                s.feedbackTitle,
                { color: right ? colors.mint : colors.orange },
              ]}
            >
              {right ? "Верно!" : `Правильно: ${item.answer}`}
            </Text>
          </View>
        )}
        <PrimaryButton
          disabled={useMistakes ? !answer.trim() : !selected}
          title={
            checked
              ? index === deck.length - 1
                ? "Результат"
                : "Дальше"
              : "Проверить"
          }
          onPress={checked ? next : check}
          color={
            checked ? (right ? colors.mint : colors.orange) : colors.purple
          }
        />
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}
function Skill({ label, value, color }) {
  return (
    <View style={s.skill}>
      <View style={s.rowTop}>
        <Text style={s.cardTitle}>{label}</Text>
        <Text style={[s.skillValue, { color }]}>{value}%</Text>
      </View>
      <ProgressBar value={value / 100} color={color} height={8} />
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
  headerTitle: { color: "white", fontSize: 17, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 50 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timer: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,159,67,.14)", borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, marginBottom: 10 },
  timerText: { color: colors.orange, fontWeight: "900", fontVariant: ["tabular-nums"] },
  recordSpeaking: { minHeight: 58, borderRadius: 18, backgroundColor: colors.purple, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 18 },
  recordSpeakingText: { color: "white", fontWeight: "900" },
  playMine: { minHeight: 54, borderRadius: 17, backgroundColor: "rgba(46,211,183,.13)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  playMineText: { color: colors.mint, fontWeight: "800" },
  title: { color: "white", fontSize: 33, lineHeight: 40, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 22,
  },
  stats: { flexDirection: "row", gap: 10, marginVertical: 18 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 15,
    alignItems: "center",
  },
  statValue: { fontSize: 27, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  info: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,159,67,.11)",
    borderRadius: 19,
    padding: 16,
    marginVertical: 18,
  },
  infoText: { color: colors.textMuted, lineHeight: 20, flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  bigEmoji: { fontSize: 72 },
  result: {
    color: "white",
    fontSize: 35,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },
  eyebrow: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 22,
  },
  flashcard: {
    minHeight: 330,
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  flashWord: {
    color: "white",
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
  },
  sound: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(124,92,252,.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  flashTranslation: {
    color: colors.mint,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 20,
    textAlign: "center",
  },
  example: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 15,
  },
  tapHint: { color: colors.textMuted, marginTop: 20 },
  rateTitle: {
    color: "white",
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 12,
  },
  ratings: { flexDirection: "row", gap: 7 },
  rating: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  ratingLabel: { fontSize: 12, fontWeight: "900" },
  ratingHint: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  scenario: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 11,
  },
  scenarioEmoji: { fontSize: 35 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  cardText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  badge: { color: colors.purple, fontSize: 11, fontWeight: "900" },
  complete: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },
  endingText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginVertical: 14,
  },
  score: { color: colors.orange, fontWeight: "900", marginBottom: 25 },
  history: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 12,
    marginTop: 10,
    opacity: 0.65,
  },
  historySpeaker: { color: colors.purple, fontSize: 10, fontWeight: "900" },
  historyLine: { color: "white", marginTop: 4 },
  historyAnswer: { color: colors.mint, fontSize: 12, marginTop: 6 },
  speech: {
    backgroundColor: colors.card,
    borderRadius: 25,
    padding: 20,
    marginTop: 16,
  },
  speaker: { color: colors.purple, fontSize: 12, fontWeight: "900" },
  speechText: {
    color: "white",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    marginVertical: 12,
  },
  chooseTitle: { color: "white", fontWeight: "900", marginVertical: 16 },
  choice: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(124,92,252,.2)",
    color: colors.purple,
    textAlign: "center",
    paddingTop: 5,
    fontWeight: "900",
  },
  choiceText: { color: "white", fontSize: 15, lineHeight: 21, flex: 1 },
  audioBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    marginTop: 18,
  },
  play: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  passage: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 17,
    marginTop: 18,
  },
  passageText: { color: "white", lineHeight: 24 },
  question: {
    color: "white",
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "900",
    marginVertical: 22,
  },
  option: {
    minHeight: 57,
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
  prompt: {
    color: "white",
    fontSize: 17,
    lineHeight: 25,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 16,
    marginTop: 17,
  },
  editor: {
    minHeight: 220,
    color: "white",
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 16,
    marginTop: 13,
  },
  wordCount: { color: colors.textMuted, textAlign: "right", marginTop: 7 },
  section: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 9,
  },
  check: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  checkText: { color: "white", flex: 1 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 10,
  },
  moduleIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "rgba(46,211,183,.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  speakingCard: {
    backgroundColor: colors.card,
    borderRadius: 25,
    padding: 22,
    marginTop: 18,
  },
  speakingPrompt: {
    color: "white",
    fontSize: 24,
    lineHeight: 33,
    fontWeight: "900",
  },
  listenButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 20,
  },
  listenText: { color: colors.purple, fontWeight: "800" },
  speakingTip: { color: colors.textMuted, lineHeight: 22, marginTop: 18 },
  ieltsModule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 21,
    padding: 15,
    marginBottom: 11,
  },
  ieltsIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleResult: { fontWeight: "900" },
  coachCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 23,
    padding: 18,
  },
  coachEmoji: { fontSize: 43 },
  skill: {
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
  },
  skillValue: { fontWeight: "900" },
  answerInput: {
    minHeight: 110,
    color: "white",
    fontSize: 17,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    textAlignVertical: "top",
  },
  feedback: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  feedbackTitle: { fontWeight: "900" },
});
