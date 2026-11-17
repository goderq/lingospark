import { evaluateExercise } from '../utils/answer';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { readStudyDraft, studySourceKey } from '../utils/studyDraft';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speak } from "../utils/speech";
import { tenseModules } from "../data/advancedCourse";
import { useProgress } from "../store/ProgressContext";
import { colors , useTheme, createThemedStyles } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions } from "../utils/shuffle";
import { getTenseGuide } from "../data/tenseGuides";
import ExplanationCard from "../components/ExplanationCard";
import { trainingPassed } from '../utils/trainingResult';

const groupColor = (name) =>
  name.startsWith("Present")
    ? colors.mint
    : name.startsWith("Past")
      ? colors.orange
      : colors.purple;

export default function TensesScreen({ onClose, onChallenge, onWeak }) {
  useTheme();
  const { recordGrammar, completeTense, toggleFavorite, progress, saveStudyDraft, clearStudyDraft } = useProgress();
  const draft = useRef(readStudyDraft(progress.studyDrafts?.tenses, tenseModules)).current;
  const [module, setModule] = useState(null);
  const [learning, setLearning] = useState(draft.learning || false);
  const [index, setIndex] = useState(draft.index || 0);
  const [selected, setSelected] = useState(draft.selected || '');
  const [score, setScore] = useState(draft.score || 0);
  const [done, setDone] = useState(false);
  const [gate, setGate] = useState(draft.gate || false);
  const [gateIndex, setGateIndex] = useState(draft.gateIndex || 0);
  const [gateSelected, setGateSelected] = useState(draft.gateSelected || '');
  const [gateScore, setGateScore] = useState(draft.gateScore || 0);
  const [optionSeed, setOptionSeed] = useState(() => draft.seed ?? Math.floor(Math.random() * 2147483647));
  const contentKey = useMemo(() => module ? studySourceKey(module) : '', [module]);
  const serializedDraft = JSON.stringify({ version: 1, sourceId: module?.id, contentKey, learning, index, selected, score, gate, gateIndex, gateSelected, gateScore, seed: optionSeed });
  useEffect(() => { if (module && !done) saveStudyDraft('tenses', JSON.parse(serializedDraft)); if (done) clearStudyDraft('tenses'); }, [serializedDraft, done, saveStudyDraft, clearStudyDraft]);
  const openModule = item => {
    const saved = readStudyDraft(progress.studyDrafts?.tenses, tenseModules);
    const state = saved.sourceId === item.id ? saved : {};
    setLearning(state.learning || false); setIndex(state.index || 0); setSelected(state.selected || ''); setScore(state.score || 0); setGate(state.gate || false); setGateIndex(state.gateIndex || 0); setGateSelected(state.gateSelected || ''); setGateScore(state.gateScore || 0); setOptionSeed(state.seed ?? Math.floor(Math.random() * 2147483647)); setModule(item); setDone(false);
  };
  const back = () => {
    if (module) {
      setModule(null);
      setLearning(false);
      setIndex(0);
      setSelected("");
      setScore(0);
      setDone(false);
      setGate(false);
      setGateIndex(0);
      setGateSelected("");
      setGateScore(0);
    } else onClose();
  };
  if (!module)
    return (
      <View style={styles.container}>
        <Header title="Все времена" onClose={onClose} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Времена английского</Text>
          <Text style={styles.subtitle}>
            {progress.completedTenses?.length || 0} из {tenseModules.length}{" "}
            блоков выполнено
          </Text>
          <View style={styles.challengeRow}>
            <Pressable onPress={onChallenge} style={styles.challengeCard}>
              <Ionicons name="trophy" size={27} color={colors.orange} />
              <Text style={styles.challengeTitle}>Смешанный экзамен</Text>
              <Text style={styles.challengeText}>
                15 вопросов · лучший {progress.tenseExamBest || 0}
              </Text>
            </Pressable>
            <Pressable onPress={onWeak} style={styles.challengeCard}>
              <Ionicons name="fitness" size={27} color={colors.pink} />
              <Text style={styles.challengeTitle}>Слабые времена</Text>
              <Text style={styles.challengeText}>По твоим ошибкам</Text>
            </Pressable>
          </View>
          {["Present", "Past", "Future", "Advanced"].map((group) => (
            <View key={group}>
              <Text
                style={[
                  styles.group,
                  {
                    color:
                      group === "Present"
                        ? colors.mint
                        : group === "Past"
                          ? colors.orange
                          : colors.purple,
                  },
                ]}
              >
                {group.toUpperCase()}
              </Text>
              {tenseModules
                .filter((item) =>
                  group === "Advanced"
                    ? item.group === "Advanced"
                    : item.name.startsWith(group),
                )
                .map((item) => {
                  const complete = progress.completedTenses?.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => openModule(item)}
                      style={[styles.module, complete && styles.moduleComplete]}
                    >
                      <View
                        style={[
                          styles.moduleIcon,
                          { backgroundColor: `${groupColor(item.name)}20` },
                        ]}
                      >
                        <Ionicons
                          name={
                            complete
                              ? "checkmark-circle"
                              : group === "Present"
                                ? "radio-button-on"
                                : group === "Past"
                                  ? "play-back"
                                  : "play-forward"
                          }
                          size={24}
                          color={complete ? colors.mint : groupColor(item.name)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.moduleName}>{item.name}</Text>
                        <Text style={styles.moduleUse} numberOfLines={1}>
                          {complete ? "Выполнено ✓" : draft.sourceId === item.id ? 'Есть сохранённое занятие · продолжить' : item.use}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.level,
                          {
                            color: complete
                              ? colors.mint
                              : groupColor(item.name),
                          },
                        ]}
                      >
                        {item.level}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  const guide = getTenseGuide(module);
  const favorite = progress.favorites?.some(
    (item) => item.type === "tense" && item.id === module.id,
  );
  if (done)
    return (
      <View style={styles.container}>
        <Header title={module.name} onClose={back} />
        <View style={styles.result}>
          <Text style={styles.resultEmoji}>
            {score === module.exercises.length ? "⏰" : "📖"}
          </Text>
          <Text style={styles.resultTitle}>
            {score}/{module.exercises.length}
          </Text>
          <Text style={styles.subtitle}>
            {trainingPassed(score, module.exercises.length)
              ? "Практика пройдена. Позже проверь навык без подсказок."
              : "Нужно от 80%. Разбери ошибки и повтори практику."}
          </Text>
          <View style={{ width: "100%" }}>
            {!trainingPassed(score, module.exercises.length) && <PrimaryButton title="Повторить практику" onPress={() => { setIndex(0); setSelected(''); setScore(0); setDone(false); }} />}
            <PrimaryButton title="К списку времён" onPress={back} />
          </View>
        </View>
      </View>
    );
  if (!learning && !gate)
    return (
      <View style={styles.container}>
        <Header title={module.name} onClose={back} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stageRow}>
            <View
              style={[
                styles.stageDot,
                { backgroundColor: groupColor(module.name) },
              ]}
            >
              <Text style={styles.stageNumber}>1</Text>
            </View>
            <Text style={styles.stageActive}>Сначала разберись</Text>
            <View style={styles.stageLine} />
            <View style={styles.stageDotMuted}>
              <Text style={styles.stageNumber}>2</Text>
            </View>
            <Text style={styles.stageMuted}>Потом практика</Text>
          </View>
          <View
            style={[
              styles.theoryHero,
              { borderColor: `${groupColor(module.name)}50` },
            ]}
          >
            <Text style={[styles.level, { color: groupColor(module.name) }]}>
              {module.level} · ТЕОРИЯ
            </Text>
            <Text style={styles.theoryName}>{module.name}</Text>
            <Text style={styles.formula}>{module.formula}</Text>
            <Pressable
              onPress={() =>
                toggleFavorite({
                  type: "tense",
                  id: module.id,
                  title: module.name,
                  level: module.level,
                  color: groupColor(module.name),
                })
              }
              style={styles.favoriteButton}
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={21}
                color={colors.pink}
              />
              <Text style={styles.favoriteText}>
                {favorite ? "В избранном" : "Добавить в избранное"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.storyCard}>
            <Text style={styles.storyEmoji}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.storyTitle}>Представь это так</Text>
              <Text style={styles.storyText}>{guide.hook}</Text>
            </View>
          </View>
          <View
            style={[
              styles.timeline,
              { borderColor: `${groupColor(module.name)}55` },
            ]}
          >
            <Text style={styles.timelineLabel}>ВРЕМЕННАЯ ЛИНИЯ</Text>
            <Text
              style={[styles.timelineText, { color: groupColor(module.name) }]}
            >
              {guide.timeline}
            </Text>
          </View>
          <Theory title="Когда используется" text={module.use} icon="bulb" />
          <Theory title="Слова-подсказки" text={module.markers} icon="flag" />
          <Theory title="Как выбрать это время" text={guide.decision} icon="git-compare" />
          <Theory title="С чем его не путать" text={guide.contrast} icon="swap-horizontal" />
          <Text style={styles.miniTitle}>Как построить предложение</Text>
          {guide.forms.map((form, formIndex) => (
            <View key={form} style={styles.formRow}>
              <Text
                style={[styles.formIndex, { color: groupColor(module.name) }]}
              >
                {formIndex + 1}
              </Text>
              <Text style={styles.formText}>
                {form.replace(/^[✅❌❓1️⃣2️⃣3️⃣]\s*/, "")}
              </Text>
            </View>
          ))}
          <View style={styles.example}>
            <Text style={styles.exampleLabel}>ЖИВОЙ ПРИМЕР</Text>
            <Text style={styles.exampleText}>{module.example}</Text>
            <Pressable
              onPress={() =>
                speak(module.example, {
                  language: progress.settings?.accent || "en-US",
                  rate: progress.settings?.speechRate || 0.78,
                })
              }
              style={styles.listenExample}
            >
              <Ionicons
                name="volume-high"
                size={22}
                color={groupColor(module.name)}
              />
              <Text
                style={[
                  styles.listenExampleText,
                  { color: groupColor(module.name) },
                ]}
              >
                Послушать
              </Text>
            </Pressable>
          </View>
          <View style={styles.warning}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Не попадайся</Text>
              <Text style={styles.warningText}>{guide.mistake}</Text>
            </View>
          </View>
          <PrimaryButton
            title={`Я понял — начать ${module.exercises.length} заданий`}
            onPress={() => setGate(true)}
            color={groupColor(module.name)}
          />
        </ScrollView>
      </View>
    );
  if (gate && !learning) {
    const gateQuestion = module.exercises[gateIndex];
    const gateCorrect = evaluateExercise(gateQuestion, (gateSelected)).correct;
    const chooseGate = (option) => {
      if (gateSelected) return;
      setGateSelected(option);
      const right = evaluateExercise(gateQuestion, (option)).correct;
      if (right) setGateScore((value) => value + 1);
      recordGrammar(
        { id: `gate-${module.id}-${gateIndex}`, prompt: gateQuestion.prompt, answer: gateQuestion.answer },
        right,
      );
    };
    const nextGate = () => {
      if (gateIndex === 1) {
        if (gateScore === 2) {
          setGate(false);
          setLearning(true);
        } else {
          setGateIndex(0);
          setGateSelected("");
          setGateScore(0);
        }
      } else {
        setGateIndex(1);
        setGateSelected("");
      }
    };
    return (
      <View style={styles.container}>
        <Header title="Проверка понимания" onClose={() => setGate(false)} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stageRow}>
            <View style={[styles.stageDot, { backgroundColor: groupColor(module.name) }]}><Text style={styles.stageNumber}>✓</Text></View>
            <Text style={styles.stageActive}>Мини-тест {gateIndex + 1}/2</Text>
            <View style={styles.stageLine} />
            <Text style={styles.stageMuted}>Нужно 2 из 2</Text>
          </View>
          <Text style={styles.question}>{gateQuestion.prompt}</Text>
          {balancedOptions(gateQuestion.options, gateQuestion.answer, gateIndex, optionSeed).map((option) => (
            <Pressable key={option} onPress={() => chooseGate(option)} style={[styles.option, gateSelected && evaluateExercise(gateQuestion, (option)).correct && { borderColor: colors.mint }, gateSelected === option && !evaluateExercise(gateQuestion, (option)).correct && { borderColor: colors.orange }]}>
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          ))}
          {gateSelected && <ExplanationCard item={{ ...gateQuestion, type: "choice" }} selected={gateSelected} correct={gateCorrect} context={{ topic: module.name, formula: module.formula, use: module.use, markers: module.markers }} reinforcement accentColor={groupColor(module.name)} />}
          {gateSelected && <PrimaryButton title={gateIndex === 1 ? (gateScore === 2 ? "Открыть практику" : "Повторить мини-тест") : "Следующий вопрос"} onPress={nextGate} color={gateCorrect ? colors.mint : colors.orange} />}
        </ScrollView>
      </View>
    );
  }
  const question = module.exercises[index];
  const correct = evaluateExercise(question, (selected)).correct;
  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const right = evaluateExercise(question, (option)).correct;
    if (right) setScore(score + 1);
    recordGrammar(
      {
        id: `tense-${module.id}-${index}`,
        prompt: question.prompt,
        answer: question.answer,
      },
      right,
    );
  };
  const next = () => {
    if (index === module.exercises.length - 1) {
      if (trainingPassed(score, module.exercises.length)) completeTense(module.id);
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected("");
    }
  };
  return (
    <View style={styles.container}>
      <Header title={module.name} onClose={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressRow}>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={(index + 1) / module.exercises.length}
              color={groupColor(module.name)}
            />
          </View>
          <Text style={{ color: colors.mint }}>Практика · без жизней</Text>
        </View>
        <Text style={styles.question}>{question.prompt}</Text>
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
              styles.option,
              selected &&
                evaluateExercise(question, (option)).correct && { borderColor: colors.mint },
              selected === option &&
                !evaluateExercise(question, (option)).correct && { borderColor: colors.orange },
            ]}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
        {selected && (
          <ExplanationCard
            item={{ ...question, type: "choice" }}
            selected={selected}
            correct={correct}
            context={{
              topic: module.name,
              formula: module.formula,
              use: module.use,
              markers: module.markers,
            }}
            reinforcement
            accentColor={groupColor(module.name)}
          />
        )}
        {selected && (
          <PrimaryButton
            title={
              index === module.exercises.length - 1
                  ? "Результат"
                  : "Дальше"
            }
            onPress={next}
            color={correct ? colors.mint : colors.orange}
          />
        )}
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
function Theory({ title, text, icon }) {
  useTheme();
  return (
    <View style={styles.theory}>
      <Ionicons name={icon} size={22} color={colors.purple} />
      <View style={{ flex: 1 }}>
        <Text style={styles.theoryTitle}>{title}</Text>
        <Text style={styles.theoryText}>{text}</Text>
      </View>
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
  headerTitle: { color: colors.text, fontWeight: "800", fontSize: 17 },
  content: { padding: 20, paddingBottom: 50 },
  challengeRow: { flexDirection: "row", gap: 11, marginBottom: 8 },
  challengeCard: { flex: 1, minHeight: 125, backgroundColor: colors.card, borderRadius: 20, padding: 16, justifyContent: "space-between", borderWidth: 1, borderColor: colors.border },
  challengeTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 10 },
  challengeText: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  stageRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  stageDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stageDotMuted: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardLight,
  },
  stageNumber: { color: colors.text, fontWeight: "900", fontSize: 12 },
  stageActive: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 7,
  },
  stageMuted: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 7,
  },
  stageLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  storyCard: {
    flexDirection: "row",
    gap: 13,
    padding: 18,
    borderRadius: 21,
    backgroundColor: "rgba(124,92,252,.13)",
    marginTop: 14,
  },
  storyEmoji: { fontSize: 30 },
  storyTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  storyText: { color: colors.textMuted, lineHeight: 21, marginTop: 6 },
  timeline: {
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    marginTop: 13,
  },
  timelineLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "900",
  },
  timelineText: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
    letterSpacing: 0.5,
  },
  miniTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  formIndex: { width: 25, fontSize: 17, fontWeight: "900" },
  formText: { color: colors.text, flex: 1, fontSize: 15, fontWeight: "700" },
  listenExample: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
  },
  listenExampleText: { fontWeight: "800" },
  warning: {
    flexDirection: "row",
    gap: 12,
    padding: 17,
    borderRadius: 19,
    backgroundColor: "rgba(255,159,67,.12)",
    marginBottom: 18,
  },
  warningEmoji: { fontSize: 24 },
  warningTitle: { color: colors.orange, fontWeight: "900", fontSize: 16 },
  warningText: { color: colors.textMuted, lineHeight: 20, marginTop: 5 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  lives: { flexDirection: "row", alignItems: "center", gap: 4 },
  livesText: { color: colors.pink, fontWeight: "900" },
  title: { color: colors.text, fontSize: 34, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 7,
    marginBottom: 20,
    textAlign: "center",
  },
  group: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 9,
  },
  module: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 19,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  moduleComplete: {
    borderColor: "rgba(46,211,183,.45)",
    backgroundColor: "rgba(46,211,183,.08)",
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  moduleUse: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  level: { fontSize: 11, fontWeight: "900" },
  theoryHero: {
    alignItems: "center",
    padding: 25,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  theoryName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  formula: {
    color: colors.mint,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 13,
  },
  favoriteButton: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 17, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 15, backgroundColor: "rgba(255,92,138,.12)" },
  favoriteText: { color: colors.pink, fontWeight: "800", fontSize: 12 },
  theory: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 19,
    marginTop: 13,
  },
  theoryTitle: { color: colors.text, fontWeight: "800" },
  theoryText: { color: colors.textMuted, lineHeight: 20, marginTop: 5 },
  example: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(124,92,252,.12)",
    marginVertical: 15,
  },
  exampleLabel: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  exampleText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 27,
    marginVertical: 10,
  },
  question: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    marginVertical: 25,
  },
  option: {
    minHeight: 59,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  explain: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 18,
    marginVertical: 10,
  },
  explainTitle: { fontSize: 16, fontWeight: "900" },
  explainText: { color: colors.textMuted, lineHeight: 20, marginTop: 5 },
  result: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  resultEmoji: { fontSize: 75 },
  resultTitle: {
    color: colors.text,
    fontSize: 43,
    fontWeight: "900",
    marginTop: 16,
  },
}));
