import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import { speak } from "../utils/speech";
import * as Haptics from "expo-haptics";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { useProgress } from "../store/ProgressContext";
import { balancedOptions } from "../utils/shuffle";
import {
  closestAnswerAnalysis,
  evaluateExercise,
} from "../utils/answer";
import ExplanationCard from "../components/ExplanationCard";
import { courseConversationTopics } from "../data/courseSupplement";
import { getCourseDialogue } from '../data/courseDialogues';
import { readLessonSession, lessonContentKey } from '../utils/lessonSession';

export default function LessonScreen({ lesson, onClose }) {
  const {
    progress,
    clearLessonDraft,
    recordExercise,
    saveLessonDraft,
    toggleFavorite,
    toggleNotebook,
  } = useProgress();
  const [draft] = useState(() => readLessonSession(lesson, progress.lessonDraft));
  const contentKey = useMemo(() => lessonContentKey(lesson), [lesson]);
  const [index, setIndex] = useState(() =>
    Math.min(draft?.index || 0, lesson.exercises.length - 1),
  );
  const [selected, setSelected] = useState(draft.selected || '');
  const [typed, setTyped] = useState(draft.typed || '');
  const [built, setBuilt] = useState(draft.built || []);
  const [checked, setChecked] = useState(!!draft.checked);
  const [correct, setCorrect] = useState(!!draft.correct);
  const [answerGrade, setAnswerGrade] = useState(draft.answerGrade || null);
  const [finished, setFinished] = useState(false);
  const [conversation, setConversation] = useState(!!draft.conversation);
  const [conversationStep, setConversationStep] = useState(draft.conversationStep || 0);
  const [conversationChoice, setConversationChoice] = useState(draft.conversationChoice || '');
  const [conversationScore, setConversationScore] = useState(draft.conversationScore || 0);
  const [conversationWrong, setConversationWrong] = useState(!!draft.conversationWrong);
  const [lessonMistakes, setLessonMistakes] = useState(draft.lessonMistakes || []);
  const [remediation, setRemediation] = useState(!!draft.remediation);
  const [remediationIndex, setRemediationIndex] = useState(draft.remediationIndex || 0);
  const [remediationAnswer, setRemediationAnswer] = useState(draft.remediationAnswer || '');
  const [remediationChecked, setRemediationChecked] = useState(!!draft.remediationChecked);
  const [remediationCorrect, setRemediationCorrect] = useState(!!draft.remediationCorrect);
  const [correctCount, setCorrectCount] = useState(draft.correctCount || 0);
  const [resultAccuracy, setResultAccuracy] = useState(0);
  const [resultCorrect, setResultCorrect] = useState(0);
  const [resultXP, setResultXP] = useState(0);
  const [optionSeed] = useState(() => draft.optionSeed || Math.floor(Math.random() * 2147483647));
  const session = { version: 2, contentKey, index, selected, typed, built, checked, correct, answerGrade, conversation, conversationStep, conversationChoice, conversationScore, conversationWrong, lessonMistakes, remediation, remediationIndex, remediationAnswer, remediationChecked, remediationCorrect, correctCount, optionSeed };
  const serializedSession = JSON.stringify(session);
  useEffect(() => {
    if (!finished) saveLessonDraft(lesson.id, JSON.parse(serializedSession));
  }, [serializedSession, finished, lesson.id, saveLessonDraft]);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = progress.settings?.reduceMotion;
  const largeText = progress.settings?.largeText;
  useEffect(() => {
    if (!checked) {
      feedbackAnim.setValue(0);
      return;
    }
    if (reduceMotion) {
      feedbackAnim.setValue(1);
      return;
    }
    Animated.spring(feedbackAnim, {
      toValue: 1,
      friction: 7,
      tension: 75,
      useNativeDriver: true,
    }).start();
  }, [checked, reduceMotion]);
  useEffect(() => {
    if (!finished) return;
    if (reduceMotion) {
      resultAnim.setValue(1);
      return;
    }
    Animated.spring(resultAnim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [finished, reduceMotion]);
  const favorite = progress.favorites?.some(
    (item) => item.type === "lesson" && item.id === lesson.id,
  );
  const exercise = lesson.exercises[index];
  const current =
    exercise.type === "choice"
      ? selected
      : exercise.type === "build"
        ? built.join(" ")
        : typed;
  const kind =
    exercise.type === "choice"
      ? "ВЫБЕРИ ОТВЕТ"
      : exercise.type === "build"
        ? "СОБЕРИ ФРАЗУ"
        : "ПЕРЕВЕДИ";
  const accepted = useMemo(
    () => [exercise.answer, ...(exercise.answers || [])],
    [exercise],
  );
  const answerAnalysis = useMemo(
    () => closestAnswerAnalysis(current, accepted),
    [current, accepted],
  );
  const reinforcement = exercise.type === "choice";
  const dialogueSteps = useMemo(() => getCourseDialogue(lesson.id), [lesson.id]);
  const check = () => {
    if (checked) return;
    const evaluation = evaluateExercise(exercise, current);
    const result = evaluation.correct;
    setAnswerGrade(evaluation);
    setCorrect(result);
    if (result) setCorrectCount((value) => value + 1);
    setChecked(true);
    recordExercise(exercise, result, {
      selected: current,
      topic: lesson.title,
      level: lesson.difficulty,
      ruleId: `course-${lesson.id}`,
    });
    if (!result) {
      setLessonMistakes((items) => [
        ...items.filter((item) => item.exercise.id !== exercise.id),
        { exercise, selected: current },
      ]);
    }
    if (progress.settings?.haptics !== false) {
      Haptics.notificationAsync(
        result
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    }
    if (progress.settings?.voiceFeedback) {
      speak(
        result
          ? "Correct"
          : evaluation.status === "close"
            ? "Almost correct"
            : "Let's review",
        {
          language: "en-US",
          rate: 0.9,
        },
      );
    }
  };
  const advance = () => {
    if (index === lesson.exercises.length - 1) {
      if (lessonMistakes.length) setRemediation(true);
      else setConversation(true);
      return;
    }
    setIndex(index + 1);
    setSelected("");
    setTyped("");
    setBuilt([]);
    setChecked(false);
    setCorrect(false);
    setAnswerGrade(null);
  };
  const checkRemediation = () => {
    const item = lessonMistakes[remediationIndex]?.exercise;
    if (!item) return;
    const right = evaluateExercise(item, remediationAnswer).correct;
    setRemediationCorrect(right);
    setRemediationChecked(true);
    recordExercise(item, right, {
      selected: remediationAnswer,
      topic: lesson.title,
      level: lesson.difficulty,
      ruleId: `course-${lesson.id}`,
    });
  };
  const advanceRemediation = () => {
    if (!remediationCorrect) {
      setRemediationChecked(false);
      return;
    }
    if (remediationIndex === lessonMistakes.length - 1) {
      setRemediation(false);
      setConversation(true);
      return;
    }
    setRemediationIndex((value) => value + 1);
    setRemediationAnswer("");
    setRemediationChecked(false);
    setRemediationCorrect(false);
  };
  const advanceConversation = () => {
    if (!evaluateExercise(dialogueSteps[conversationStep], (conversationChoice)).correct) {
      setConversationWrong(true);
      setConversationChoice('');
      return;
    }
    const gained =
      !conversationWrong ? 1 : 0;
    const nextScore = conversationScore + gained;
    if (conversationStep === 1) {
      const accuracy = Math.round(
        ((correctCount + nextScore) / (lesson.exercises.length + 2)) * 100,
      );
      setResultAccuracy(accuracy);
      setResultCorrect(correctCount + nextScore);
      setResultXP(0);
      clearLessonDraft(lesson.id);
      setFinished(true);
    } else {
      setConversationScore(nextScore);
      setConversationStep(1);
      setConversationChoice("");
      setConversationWrong(false);
    }
  };
  const requestClose = () => {
    saveLessonDraft(lesson.id, session);
    Alert.alert(
      "Выйти из урока?",
      "Ответы, результат и текущий шаг сохранены — можно продолжить позже.",
      [
        { text: "Остаться", style: "cancel" },
        { text: "Выйти", style: "destructive", onPress: onClose },
      ],
    );
  };

  if (finished)
    return (
      <Animated.View
        style={[
          styles.result,
          {
            opacity: resultAnim,
            transform: [
              {
                scale: resultAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.party}>🎉</Text>
        <Text style={styles.resultTitle}>Практика завершена!</Text>
        <Text style={styles.stars}>
          {"⭐".repeat(resultAccuracy >= 90 ? 3 : resultAccuracy >= 70 ? 2 : 1)}
        </Text>
        <Text style={styles.resultText}>
          С первой попытки {resultAccuracy}% · ошибки разобраны
        </Text>
        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatValue}>{resultCorrect}</Text>
            <Text style={styles.resultStatLabel}>верно</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: colors.orange }]}>
              {lesson.exercises.length + 2 - resultCorrect}
            </Text>
            <Text style={styles.resultStatLabel}>ошибок</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: colors.mint }]}>
              +{resultXP}
            </Text>
            <Text style={styles.resultStatLabel}>XP</Text>
          </View>
        </View>
        <Text style={styles.recommendation}>
          Вернись к этапам темы. Следующий курс открывает самопроверка с результатом от 80%; практика с разбором её не заменяет.
        </Text>
        <PrimaryButton title="Продолжить обучение" onPress={onClose} />
      </Animated.View>
    );

  if (remediation) {
    const review = lessonMistakes[remediationIndex];
    const reviewItem = review?.exercise;
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.top}>
          <Pressable onPress={requestClose} style={styles.close}>
            <Ionicons name="close" size={23} color={colors.textMuted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={(remediationIndex + 1) / lessonMistakes.length}
              color={colors.orange}
            />
          </View>
          <Text style={styles.remediationCount}>
            {remediationIndex + 1}/{lessonMistakes.length}
          </Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.content}
        >
          <Text style={[styles.kind, { color: colors.orange }]}>МИНИ-УРОК ПО ОШИБКЕ</Text>
          <Text style={styles.remediationTitle}>{reviewItem.prompt}</Text>
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonLabel}>ТВОЙ ОТВЕТ</Text>
            <Text style={styles.comparisonWrong}>{review.selected || "Ответ не дан"}</Text>
            <Text style={styles.comparisonLabel}>ПРАВИЛЬНАЯ ФОРМА</Text>
            <Text style={styles.comparisonRight}>{reviewItem.answer}</Text>
          </View>
          <ExplanationCard
            item={reviewItem}
            selected={review.selected}
            correct={false}
            context={{ topic: lesson.title }}
            accentColor={colors.orange}
          />
          <Text style={styles.retryLabel}>Теперь напиши правильный ответ самостоятельно</Text>
          <TextInput
            value={remediationAnswer}
            onChangeText={setRemediationAnswer}
            editable={!remediationChecked}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Правильный ответ…"
            placeholderTextColor={colors.textMuted}
            style={styles.remediationInput}
          />
          {remediationChecked && (
            <Text
              style={[
                styles.remediationResult,
                { color: remediationCorrect ? colors.mint : colors.orange },
              ]}
            >
              {remediationCorrect
                ? "Верно — правило закреплено и отмечено в истории."
                : `Пока нет. Запомни форму: ${reviewItem.answer}`}
            </Text>
          )}
        </ScrollView>
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={!remediationAnswer.trim()}
            title={remediationChecked ? remediationCorrect ? "Следующий разбор" : 'Попробовать ещё раз' : "Проверить себя"}
            onPress={remediationChecked ? advanceRemediation : checkRemediation}
            color={remediationChecked && remediationCorrect ? colors.mint : colors.orange}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (conversation) {
    const step = dialogueSteps[conversationStep];
    const answered = Boolean(conversationChoice);
    const right = evaluateExercise(step, (conversationChoice)).correct;
    return (
      <View style={styles.container}>
        <View style={styles.top}>
          <Pressable onPress={requestClose} style={styles.close}>
            <Ionicons name="close" size={23} color={colors.textMuted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={
                (lesson.exercises.length + conversationStep + 1) /
                (lesson.exercises.length + 2)
              }
              color={lesson.color}
            />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.kind, { color: lesson.color }]}>
            МИНИ-РАЗГОВОР · {conversationStep + 1}/2
          </Text>
          <View style={styles.dialogueBubble}>
            <Text style={styles.dialogueSpeaker}>{step.speaker}</Text>
            <Text style={styles.dialogueLine}>{step.line}</Text>
            <Pressable
              onPress={() =>
                speak(step.line, { language: "en-US", rate: 0.78 })
              }
            >
              <Ionicons name="volume-high" size={21} color={colors.purple} />
            </Pressable>
          </View>
          <Text style={styles.dialoguePrompt}>Выбери естественный ответ</Text>
          {balancedOptions(
            step.options,
            step.answer,
            conversationStep,
            optionSeed,
          ).map((option) => (
            <Pressable
              key={option}
              disabled={answered}
              onPress={() => setConversationChoice(option)}
              style={[
                styles.option,
                answered &&
                  evaluateExercise(step, (option)).correct && { borderColor: colors.mint },
                conversationChoice === option &&
                  !evaluateExercise(step, (option)).correct && { borderColor: colors.orange },
              ]}
            >
              <Text
                style={[styles.optionText, largeText && styles.optionTextLarge]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
          {answered && (
            <View style={styles.feedback}>
              <Ionicons
                name={right ? "checkmark-circle" : "chatbubble-ellipses"}
                size={24}
                color={right ? colors.mint : colors.orange}
              />
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: right ? colors.mint : colors.orange },
                ]}
              >
                {right ? "Отличный ответ!" : `Лучше сказать: ${step.answer}`}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={!answered}
            title={
              answered && !right ? 'Попробовать ещё раз' : conversationStep === 1 ? "Завершить урок" : "Продолжить разговор"
            }
            onPress={advanceConversation}
            color={
              answered ? (right ? colors.mint : colors.orange) : colors.purple
            }
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.top}>
        <Pressable onPress={requestClose} style={styles.close}>
          <Ionicons name="close" size={23} color={colors.textMuted} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar
            value={(index + 1) / lesson.exercises.length}
            color={lesson.color}
          />
        </View>
        <Pressable
          onPress={() =>
            toggleFavorite({
              type: "lesson",
              id: lesson.id,
              title: lesson.title,
              level: lesson.difficulty,
              color: lesson.color,
            })
          }
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={21}
            color={colors.pink}
          />
        </Pressable>
        <Text style={{ color: colors.mint, fontSize: 12 }}>Практика</Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.kind, { color: lesson.color }]}>{kind}</Text>
        <Text style={[styles.prompt, largeText && styles.promptLarge]}>
          {exercise.prompt}
        </Text>
        <Pressable
          onPress={() =>
            speak(exercise.speak, { language: "en-US", rate: 0.82 })
          }
          style={styles.listen}
        >
          <Ionicons name="volume-high" size={19} color={colors.purple} />
          <Text style={styles.listenText}>Послушать</Text>
        </Pressable>
        {exercise.type === "choice" && (
          <View style={styles.options}>
            {balancedOptions(
              exercise.options,
              exercise.answer,
              index,
              optionSeed,
            ).map((option) => (
              <Pressable
                key={option}
                disabled={checked}
                onPress={() => setSelected(option)}
                style={[
                  styles.option,
                  selected === option && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    largeText && styles.optionTextLarge,
                  ]}
                >
                  {option}
                </Text>
                <Ionicons
                  name={
                    selected === option ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={23}
                  color={selected === option ? colors.purple : colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
        )}
        {exercise.type === "build" && (
          <View>
            <View style={styles.sentence}>
              <Text
                style={[
                  styles.sentenceText,
                  !built.length && { color: colors.textMuted },
                ]}
              >
                {built.length ? built.join(" ") : "Нажимай на слова…"}
              </Text>
            </View>
            <View style={styles.wordWrap}>
              {exercise.options.map((word, optionIndex) => {
                const occurrence = exercise.options
                  .slice(0, optionIndex + 1)
                  .filter((item) => item === word).length;
                const used = built.filter((item) => item === word).length;
                if (used >= occurrence) return null;
                return (
                  <Pressable
                    key={`${word}-${optionIndex}`}
                    disabled={checked}
                    onPress={() => setBuilt([...built, word])}
                    style={styles.word}
                  >
                    <Text style={styles.wordText}>{word}</Text>
                  </Pressable>
                );
              })}
            </View>
            {built.length > 0 && (
              <Pressable disabled={checked} onPress={() => setBuilt([])}>
                <Text style={styles.clear}>Очистить</Text>
              </Pressable>
            )}
          </View>
        )}
        {exercise.type === "translate" && (
          <View>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={!checked}
              placeholder="Введи перевод"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              style={[styles.input, largeText && styles.inputLarge]}
            />
            <View style={styles.hint}>
              <Ionicons name="bulb" size={16} color={colors.orange} />
              <Text style={styles.hintText}>{exercise.hint}</Text>
            </View>
          </View>
        )}
        {checked && (
          <Animated.View
            style={[
              styles.feedback,
              {
                backgroundColor: `${correct ? colors.mint : answerGrade?.status === "close" ? colors.orange : colors.pink}1F`,
              },
              {
                opacity: feedbackAnim,
                transform: [
                  {
                    scale: feedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={correct ? "checkmark-circle" : "bulb"}
              size={25}
              color={
                correct
                  ? colors.mint
                  : answerGrade?.status === "close"
                    ? colors.orange
                    : colors.pink
              }
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.feedbackTitle,
                  {
                    color: correct
                      ? colors.mint
                      : answerGrade?.status === "close"
                        ? colors.orange
                        : colors.pink,
                  },
                ]}
              >
                {correct
                  ? "Верно!"
                  : answerGrade?.status === "close"
                    ? "Почти верно — смысл понятен"
                    : "Неверно — смысл или конструкция изменены"}
              </Text>
              {!correct && (
                <Text style={styles.answer}>
                  Лучший вариант: {answerAnalysis.expected}
                </Text>
              )}
              {!correct && exercise.type === "translate" && (
                <View style={styles.wordAnalysis}>
                  <View style={styles.tokenWrap}>
                    {answerAnalysis.words?.map((word, wordIndex) => (
                      <View
                        key={`${word.word}-${wordIndex}`}
                        style={[
                          styles.token,
                          word.status === "correct"
                            ? styles.tokenCorrect
                            : word.status === "form"
                              ? styles.tokenForm
                              : styles.tokenExtra,
                        ]}
                      >
                        <Text style={styles.tokenText}>{word.word}</Text>
                      </View>
                    ))}
                    {answerAnalysis.missingWords?.map((word, wordIndex) => (
                      <View
                        key={`missing-${word}-${wordIndex}`}
                        style={[styles.token, styles.tokenMissing]}
                      >
                        <Text style={styles.missingTokenText}>+ {word}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.legendText}>
                    🟢 верно 🟠 форма слова 🔴 лишнее ⚪ пропущено
                  </Text>
                  {answerAnalysis.missing.length > 0 && (
                    <Text style={styles.missingWords}>
                      Не хватает: {answerAnalysis.missing.join(", ")}
                    </Text>
                  )}
                  {answerAnalysis.extra.length > 0 && (
                    <Text style={styles.extraWords}>
                      Лишнее или замени: {answerAnalysis.extra.join(", ")}
                    </Text>
                  )}
                  {answerAnalysis.wrongForms?.length > 0 && (
                    <Text style={styles.formWords}>
                      Проверь форму: {answerAnalysis.wrongForms.join(", ")}
                    </Text>
                  )}
                  {answerAnalysis.unnaturalOrder && (
                    <Text style={styles.extraWords}>
                      Все слова есть, но такой порядок звучит неестественно
                    </Text>
                  )}
                </View>
              )}
              <ExplanationCard
                item={exercise}
                selected={current}
                correct={correct}
                context={{ topic: lesson.title }}
                reinforcement={reinforcement}
                showStatus={false}
                saved={progress.notebook?.some(
                  (item) => item.id === `lesson-rule-${exercise.id}`,
                )}
                onSave={() =>
                  toggleNotebook({
                    id: `lesson-rule-${exercise.id}`,
                    topic: lesson.title,
                    rule: exercise.explanation || exercise.hint || exercise.prompt,
                    example: exercise.answer,
                    level: lesson.difficulty,
                  })
                }
              />
            </View>
          </Animated.View>
        )}
        {checked && (
          <View style={styles.savedRow}>
            <Ionicons name="save-outline" size={15} color={colors.mint} />
            <Text style={styles.savedText}>Черновик обновлён</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottom}>
        <PrimaryButton
          disabled={!checked && !current.trim()}
          color={
            checked
              ? correct
                ? colors.mint
                : answerGrade?.status === "close"
                  ? colors.orange
                  : colors.pink
              : colors.purple
          }
          title={
            checked
              ? index === lesson.exercises.length - 1
                  ? "Завершить урок"
                  : "Дальше"
              : "Проверить"
          }
          onPress={checked ? advance : check}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  close: { padding: 5 },
  hearts: { flexDirection: "row", alignItems: "center", gap: 4 },
  heartText: { color: colors.pink, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 30 },
  kind: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  prompt: {
    color: "white",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 13,
  },
  promptLarge: { fontSize: 33, lineHeight: 41 },
  listen: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(124,92,252,0.16)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
    marginBottom: 24,
  },
  listenText: { color: "white", fontWeight: "700" },
  options: { gap: 11 },
  option: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: "rgba(124,92,252,0.16)",
    borderColor: colors.purple,
  },
  optionText: { flex: 1, color: "white", fontSize: 16, fontWeight: "600" },
  optionTextLarge: { fontSize: 18, lineHeight: 25 },
  sentence: {
    minHeight: 78,
    padding: 17,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: "center",
  },
  sentenceText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 28,
  },
  wordWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  word: {
    paddingHorizontal: 17,
    paddingVertical: 12,
    backgroundColor: colors.cardLight,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordText: { color: "white", fontWeight: "700", fontSize: 16 },
  clear: { color: colors.textMuted, fontWeight: "700", marginTop: 17 },
  input: {
    minHeight: 100,
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 17,
    textAlignVertical: "top",
  },
  inputLarge: { fontSize: 20, minHeight: 112 },
  hint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  hintText: { color: colors.textMuted, fontSize: 12 },
  feedback: {
    flexDirection: "row",
    gap: 11,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  feedbackTitle: { fontWeight: "800", fontSize: 16 },
  answer: { color: "white", marginTop: 5 },
  wordAnalysis: { gap: 4, marginTop: 9 },
  missingWords: { color: colors.orange, fontSize: 13, fontWeight: "700" },
  extraWords: { color: colors.pink, fontSize: 13, fontWeight: "700" },
  formWords: { color: colors.orange, fontSize: 13, fontWeight: "700" },
  tokenWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  token: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  tokenCorrect: {
    backgroundColor: "rgba(46,211,183,.16)",
    borderColor: colors.mint,
  },
  tokenForm: {
    backgroundColor: "rgba(255,159,67,.16)",
    borderColor: colors.orange,
  },
  tokenExtra: {
    backgroundColor: "rgba(255,92,138,.16)",
    borderColor: colors.pink,
  },
  tokenMissing: {
    backgroundColor: "rgba(255,255,255,.06)",
    borderColor: colors.textMuted,
    borderStyle: "dashed",
  },
  tokenText: { color: "white", fontSize: 12, fontWeight: "800" },
  missingTokenText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 4,
  },
  bottom: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  result: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  party: { fontSize: 82 },
  resultTitle: {
    color: "white",
    fontSize: 35,
    fontWeight: "900",
    marginTop: 16,
  },
  resultText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  stars: { fontSize: 34, marginTop: 12 },
  resultStats: { flexDirection: "row", gap: 10, marginTop: 18, width: "100%" },
  resultStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 17,
    paddingVertical: 13,
  },
  resultStatValue: { color: "white", fontSize: 20, fontWeight: "900" },
  resultStatLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  recommendation: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 15,
  },
  remediationCount: { color: colors.orange, fontWeight: "900", fontSize: 12 },
  remediationTitle: {
    color: "white",
    fontSize: 27,
    lineHeight: 35,
    fontWeight: "900",
    marginTop: 14,
  },
  comparisonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    gap: 6,
  },
  comparisonLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 4,
  },
  comparisonWrong: { color: colors.pink, fontSize: 16, fontWeight: "700" },
  comparisonRight: { color: colors.mint, fontSize: 17, fontWeight: "800" },
  retryLabel: { color: "white", fontWeight: "800", marginTop: 20, marginBottom: 9 },
  remediationInput: {
    minHeight: 62,
    color: "white",
    fontSize: 17,
    backgroundColor: colors.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  remediationResult: { fontWeight: "800", lineHeight: 21, marginTop: 12 },
  dialogueBubble: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
  },
  dialogueSpeaker: { color: colors.purple, fontSize: 11, fontWeight: "900" },
  dialogueLine: {
    color: "white",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    marginVertical: 12,
  },
  dialoguePrompt: {
    color: colors.textMuted,
    fontWeight: "800",
    marginVertical: 16,
  },
  ruleText: { color: colors.textMuted, lineHeight: 20, marginTop: 7 },
  saveRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  saveRuleText: { color: colors.orange, fontSize: 12, fontWeight: "800" },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  savedText: { color: colors.mint, fontSize: 11, fontWeight: "800" },
});
