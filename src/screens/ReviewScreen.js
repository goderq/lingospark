import { readWordSession } from '../utils/wordSession';
import React, { useEffect, useMemo, useState } from "react";
import WordMeanings from '../components/WordMeanings';
import WordContext from '../components/WordContext';
import { wordAmountLabel, wordLearningState, wordStateLabels } from '../utils/wordDictionary';
import { wordLearningDetails } from '../data/wordLearningData';
import { sampleWithoutReplacement } from '../utils/sampling';
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { speak as speakNow } from "../utils/speech";
import { expandExplanation } from "../utils/explanations";
import * as Haptics from "expo-haptics";
import {
  getWordCandidates,
  extendedWordBank,
  extendedWordBankSize,
  extendedWordCountsByLevel,
  extendedWordsByLevel,
  wordBank,
  wordBankSize,
  wordCountsByLevel,
  wordLevels,
  wordsByLevel,
} from "../data/wordBank";
import { wordThemes } from "../data/wordThemes";
import { colors , useTheme, createThemedStyles } from "../theme";
import { foregroundFor } from '../design/palettes';
import { PrimaryButton, ProgressBar } from "../components/UI";
import { useProgressActions, useProgressSelector } from "../store/ProgressContext";
import { evaluateExercise } from "../utils/answer";
import { balancedOptions, shuffleOptions } from "../utils/shuffle";
import {distinctDistractors} from '../utils/contentQuality';
import useScreenTiming from '../components/useScreenTiming';
import ContentReportButton from '../components/ContentReportButton';

const levelColors = {
  A1: "#4CB963",
  A2: "#36B8D9",
  B1: "#7C5CFC",
  B2: "#FF9F43",
  C1: "#D15BE3",
};

const modes = [
  ["typing", "Письмо", "pencil", "Напиши перевод"],
  ["choice", "Выбор", "list", "Выбери перевод"],
  ["listening", "На слух", "headset", "Услышь и напиши"],
  ["letters", "Буквы", "text", "Собери слово"],
  ["definition", "Значение", "help-circle", "Найди английское слово"],
];

const takeRandom = sampleWithoutReplacement;

export default function ReviewScreen() {
  useTheme();
  useScreenTiming('words_open');
  const progress = useProgressSelector(({ progress: value }) => ({ reviewStats: value.reviewStats, settings: value.settings, wordPreferences: value.wordPreferences, wordSessionDraft: value.wordSessionDraft }));
  const {
    recordReview,
    saveWordSession,
    clearWordSession,
    toggleWordPreference,
    hideWord,
    updateWordTranslation,
  } = useProgressActions();
  const [draft] = useState(() => readWordSession(progress.wordSessionDraft));
  const [sessionId, setSessionId] = useState(draft.sessionId || `words-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [optionSeed, setOptionSeed] = useState(() => draft.optionSeed ?? Math.floor(Math.random() * 2147483647));
  const [level, setLevel] = useState(draft.level ?? "A1");
  const [catalogMode, setCatalogMode] = useState(draft.catalogMode ?? "core");
  const [theme, setTheme] = useState(draft.theme ?? "all");
  const [statusFilter, setStatusFilter] = useState(draft.statusFilter ?? "new");
  const [mode, setMode] = useState(draft.mode ?? "typing");
  const [amount, setAmount] = useState(draft.amount ?? 10);
  const [directionMode, setDirectionMode] = useState(draft.directionMode ?? "mixed");
  const [deck, setDeck] = useState(null);
  const [index, setIndex] = useState(draft.index ?? 0);
  const [phase, setPhase] = useState(draft.phase ?? "learn");
  const [answer, setAnswer] = useState(draft.answer ?? "");
  const [checked, setChecked] = useState(draft.checked ?? false);
  const [correct, setCorrect] = useState(draft.correct ?? false);
  const [grade, setGrade] = useState(draft.grade ?? "");
  const [score, setScore] = useState(draft.score ?? 0);
  const [finished, setFinished] = useState(draft.finished ?? false);
  const [letterTiles, setLetterTiles] = useState(draft.letterTiles ?? []);
  const [usedLetters, setUsedLetters] = useState(draft.usedLetters ?? []);
  const [editingTranslation, setEditingTranslation] = useState(draft.editingTranslation ?? false);
  const [translationDraft, setTranslationDraft] = useState(draft.translationDraft ?? "");


  const serializedWordSession = useMemo(() => deck ? JSON.stringify({ version: 1, sessionId, optionSeed, level, catalogMode, theme, statusFilter, mode, amount, directionMode, deck, index, phase, answer, checked, correct, grade, score, letterTiles, usedLetters, editingTranslation, translationDraft }) : null, [sessionId, optionSeed, level, catalogMode, theme, statusFilter, mode, amount, directionMode, deck, index, phase, answer, checked, correct, grade, score, letterTiles, usedLetters, editingTranslation, translationDraft]);
  useEffect(() => { if (deck && !finished) saveWordSession(JSON.parse(serializedWordSession)); if (finished) clearWordSession(); }, [serializedWordSession, finished, saveWordSession, clearWordSession]);
  const today = new Date().toISOString().slice(0, 10);
  const stats = progress.reviewStats || {};
  const preferences = useMemo(
    () => ({
      favorites: [],
      hard: [],
      hidden: [],
      customTranslations: {},
      ...(progress.wordPreferences || {}),
    }),
    [progress.wordPreferences],
  );
  const studiedIds = useMemo(() => new Set(Object.keys(stats)), [stats]);
  const activeWordBank = catalogMode === "core" ? wordBank : extendedWordBank;
  const activeWordsByLevel = catalogMode === "core" ? wordsByLevel : extendedWordsByLevel;
  const activeCountsByLevel = catalogMode === "core" ? wordCountsByLevel : extendedWordCountsByLevel;
  const activeWordBankSize = catalogMode === "core" ? wordBankSize : extendedWordBankSize;
  const favoriteIds = useMemo(
    () => new Set(preferences.favorites),
    [preferences.favorites],
  );
  const hardIds = useMemo(
    () => new Set(preferences.hard),
    [preferences.hard],
  );
  const hiddenIds = useMemo(
    () => new Set(preferences.hidden),
    [preferences.hidden],
  );
  const knownAtLevel = useMemo(
    () =>
      level === "Все"
        ? activeWordBank.reduce((total, word) => total + (studiedIds.has(word.id) ? 1 : 0), 0)
        : activeWordsByLevel[level].reduce(
            (total, word) => total + (studiedIds.has(word.id) ? 1 : 0),
            0,
          ),
    [level, studiedIds, activeWordsByLevel, activeWordBank],
  );
  const levelCount =
    level === "Все" ? activeWordBankSize : activeCountsByLevel[level];

  const summary = useMemo(
    () =>
      activeWordBank.reduce(
        (result, word) => {
          if (hiddenIds.has(word.id)) return result;
          result[wordLearningState(stats[word.id], today)] += 1;
          return result;
        },
        { new: 0, learning: 0, learned: 0, due: 0 },
      ),
    [stats, today, activeWordBank, hiddenIds],
  );
  const selectedTheme = useMemo(
    () => wordThemes.find((item) => item.id === theme),
    [theme],
  );
  const basePool = useMemo(
    () =>
      (selectedTheme
        ? selectedTheme.words
        : level === "Все"
          ? activeWordBank
          : activeWordsByLevel[level]
      ).filter((word) => !hiddenIds.has(word.id)),
    [selectedTheme, level, hiddenIds, activeWordBank, activeWordsByLevel],
  );
  const selectedPool = useMemo(
    () =>
      basePool.filter((word) => {
        const wordStat = stats[word.id];
        if (wordStateLabels[statusFilter]) return wordLearningState(wordStat, today) === statusFilter;
        if (statusFilter === "hard") return hardIds.has(word.id);
        if (statusFilter === "favorites") return favoriteIds.has(word.id);
        return true;
      }),
    [basePool, stats, statusFilter, today, hardIds, favoriteIds],
  );
  const dateSeed = Number(today.replaceAll("-", ""));
  const wordChoices=useMemo(()=>{
    const card=deck?.[index];
    if(!card)return [];
    const custom=preferences.customTranslations[card.id];
    const ru=custom || card.russian,reverse=card.direction==='en-ru';
    const expected=reverse?ru:card.english;
    const accepted=reverse?[ru,...(custom?[]:(card.translations || []))]:[card.english];
    const candidates=getWordCandidates(card.id,24,activeWordBank).map((word)=>reverse?word.russian:word.english);
    return balancedOptions([expected,...distinctDistractors(candidates,accepted)],expected,index,optionSeed);
  },[deck,index,preferences.customTranslations,activeWordBank,optionSeed]);
  const wordOfDay = activeWordBank[dateSeed % activeWordBank.length];

  const startSession = (forcedPool = null) => {
    const source = forcedPool || selectedPool;
    if (!source.length) return;
    const session = takeRandom(source, forcedPool ? forcedPool.length : amount).map((word, cardIndex) => ({
      ...word,
      direction:
        mode === "listening"
          ? "en-ru"
          : mode === "letters" || mode === "definition"
            ? "ru-en"
            : directionMode === "mixed"
          ? cardIndex % 2 === 0
            ? "en-ru"
            : "ru-en"
          : directionMode,
    }));
    setOptionSeed(Math.floor(Math.random() * 2147483647));
    setSessionId(`words-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    setDeck(session);
    setIndex(0);
    setPhase("learn");
    setAnswer("");
    setChecked(false);
    setCorrect(false);
    setGrade("");
    setScore(0);
    setFinished(false);
    setLetterTiles([]);
    setUsedLetters([]);
    setEditingTranslation(false);
  };

  const resumeWords = () => {
    const saved = readWordSession(progress.wordSessionDraft);
    if (!saved.deck) return;
    setSessionId(saved.sessionId);
    setOptionSeed(saved.optionSeed);
    setLevel(saved.level);
    setCatalogMode(saved.catalogMode);
    setTheme(saved.theme);
    setStatusFilter(saved.statusFilter);
    setMode(saved.mode);
    setAmount(saved.amount);
    setDirectionMode(saved.directionMode);
    setDeck(saved.deck);
    setIndex(saved.index);
    setPhase(saved.phase);
    setAnswer(saved.answer);
    setChecked(saved.checked);
    setCorrect(saved.correct);
    setGrade(saved.grade);
    setScore(saved.score);
    setLetterTiles(saved.letterTiles);
    setUsedLetters(saved.usedLetters);
    setEditingTranslation(saved.editingTranslation);
    setTranslationDraft(saved.translationDraft);
    setFinished(false);
  };

  if (!deck)
    return (
      <ScrollView
        contentContainerStyle={styles.setup}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📚</Text>
          <Text style={styles.setupTitle}>Слова в контексте</Text>
          <Text style={styles.setupSubtitle}>
            {activeWordBankSize.toLocaleString("ru-RU")} слов работают без интернета
          </Text>
        </View>

        {!!progress.wordSessionDraft && <PrimaryButton title="Продолжить сохранённую сессию" onPress={resumeWords} />}
        <View style={styles.catalogSwitch}>
          {[
            ["core", "Основные", `${wordBankSize.toLocaleString("ru-RU")} полезных`],
            ["extended", "Расширенные", `${extendedWordBankSize.toLocaleString("ru-RU")} всего`],
          ].map(([id, title, subtitle]) => (
            <Pressable
              key={id}
              onPress={() => {
                setCatalogMode(id);
                setTheme("all");
              }}
              style={[styles.catalogOption, catalogMode === id && styles.catalogOptionActive]}
            >
              <Text style={[styles.catalogTitle, catalogMode === id && { color: colors.text }]}>{title}</Text>
              <Text style={styles.catalogSubtitle}>{subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => startSession([wordOfDay])}
          style={styles.dailyWord}
        >
          <View style={styles.dailyIcon}><Text style={styles.dailyEmoji}>☀️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dailyLabel}>СЛОВО ДНЯ · {wordOfDay.level}</Text>
            <Text style={styles.dailyTitle}>{wordOfDay.english}</Text>
            <Text style={styles.dailyText}>{wordOfDay.russian}</Text>
          </View>
          <Ionicons name="play" size={21} color={colors.orange} />
        </Pressable>

        <View style={styles.statsGrid}>
          <MiniStat value={summary.new} label="новых" color={colors.purple} />
          <MiniStat value={summary.learning} label="изучаются" color={colors.orange} />
          <MiniStat value={summary.learned} label="выучено" color={colors.mint} />
          <MiniStat value={summary.due} label="пора повторить" color={colors.pink} />
        </View>

        <Text style={styles.section}>ВЫБЕРИ СЛОЖНОСТЬ</Text>
        <View style={styles.levels}>
          {[...wordLevels, "Все"].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setLevel(item);
                setTheme("all");
              }}
              style={[
                styles.level,
                level === item && {
                  backgroundColor:
                    item === "Все" ? colors.accentFill : levelColors[item],
                  borderColor:
                    item === "Все" ? colors.purple : levelColors[item],
                },
              ]}
            >
              <Text
                style={[styles.levelName, level === item && { color: foregroundFor(item === 'Все' ? colors.accentFill : levelColors[item]) }]}
              >
                {item}
              </Text>
              <Text
                style={[
                  styles.levelCount,
                  level === item && { color: foregroundFor(item === 'Все' ? colors.accentFill : levelColors[item]) },
                ]}
              >
                {item === "Все" ? activeWordBankSize : activeCountsByLevel[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>ТЕМАТИЧЕСКИЕ НАБОРЫ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themes}>
          <Pressable onPress={() => setTheme("all")} style={[styles.theme, theme === "all" && styles.themeActive]}>
            <Text style={styles.themeEmoji}>🎲</Text>
            <Text style={styles.themeTitle}>Все темы</Text>
          </Pressable>
          {wordThemes.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setTheme(item.id);
                setLevel("Все");
              }}
              style={[styles.theme, theme === item.id && styles.themeActive]}
            >
              <Text style={styles.themeEmoji}>{item.emoji}</Text>
              <Text style={styles.themeTitle}>{item.title}</Text>
              <Text style={styles.themeCount}>{item.words.length} слов</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.section}>КАКИЕ СЛОВА ПОКАЗАТЬ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            ["new", "Новые"],
            ["learning", "Изучаются"],
            ["due", "Повторить"],
            ["learned", "Выучены"],
            ["hard", "Сложные"],
            ["favorites", "Избранные"],
            ["all", "Все"],
          ].map(([id, label]) => (
            <Pressable key={id} onPress={() => setStatusFilter(id)} style={[styles.filterChip, statusFilter === id && styles.filterChipActive]}>
              <Text style={[styles.filterText, statusFilter === id && { color: colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.availableText}>Доступно для выбранной сессии: {selectedPool.length}</Text>

        <Text style={styles.section}>РЕЖИМ ТРЕНИРОВКИ</Text>
        <View style={styles.modes}>
          {modes.map(([id, title, icon, detail]) => (
            <Pressable key={id} onPress={() => setMode(id)} style={[styles.mode, mode === id && styles.modeActive]}>
              <Ionicons name={icon} size={23} color={mode === id ? colors.purple : colors.textMuted} />
              <Text style={styles.modeTitle}>{title}</Text>
              <Text style={styles.modeText}>{detail}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.cardTitle}>Изучено на уровне {level}</Text>
            <Text style={styles.progressValue}>
              {knownAtLevel}/{levelCount}
            </Text>
          </View>
          <ProgressBar
            value={knownAtLevel / Math.max(1, levelCount)}
            color={level === "Все" ? colors.purple : levelColors[level]}
            height={9}
          />
        </View>

        <Text style={styles.section}>РАЗМЕР СЕССИИ</Text>
        <View style={styles.segmented}>
          {[10, 20, 30, 50].map((item) => (
            <Pressable
              key={item}
              onPress={() => setAmount(item)}
              style={[styles.segment, amount === item && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  amount === item && { color: colors.text },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {(mode === "typing" || mode === "choice") && <><Text style={styles.section}>НАПРАВЛЕНИЕ ПЕРЕВОДА</Text>
        <View style={styles.directionList}>
          {[
            ["mixed", "В обе стороны", "English ↔ Русский", "swap-horizontal"],
            ["en-ru", "На русский", "English → Русский", "arrow-forward"],
            ["ru-en", "На английский", "Русский → English", "arrow-back"],
          ].map(([id, title, detail, icon]) => (
            <Pressable
              key={id}
              onPress={() => setDirectionMode(id)}
              style={[
                styles.directionChoice,
                directionMode === id && styles.directionActive,
              ]}
            >
              <Ionicons
                name={icon}
                size={22}
                color={directionMode === id ? colors.purple : colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardText}>{detail}</Text>
              </View>
              <Ionicons
                name={
                  directionMode === id ? "radio-button-on" : "radio-button-off"
                }
                size={21}
                color={directionMode === id ? colors.purple : colors.textMuted}
              />
            </Pressable>
          ))}
        </View></>}

        <PrimaryButton
          title={selectedPool.length ? `Начать · ${wordAmountLabel(Math.min(amount, selectedPool.length))}` : "В этой категории пока нет слов"}
          icon="sparkles"
          onPress={() => startSession()}
          disabled={!selectedPool.length}
        />
        <Text style={styles.source}>
          Проверенная англо-русская база · более 8 000 слов
        </Text>
      </ScrollView>
    );

  if (finished)
    return (
      <View style={styles.result}>
        <Text style={styles.resultEmoji}>
          {score >= deck.length * 0.8 ? "🏆" : "📖"}
        </Text>
        <Text style={styles.resultTitle}>
          {score}/{deck.length}
        </Text>
        <Text style={styles.resultSubtitle}>
          {score >= deck.length * 0.8
            ? "Отличная сессия! Новые слова добавлены в прогресс."
            : "Хорошее начало. Ошибки появятся в журнале для повторения."}
        </Text>
        <View style={styles.resultButtons}>
          <PrimaryButton
            title="Ещё случайные слова"
            onPress={() => startSession()}
            color={colors.mint}
          />
          <PrimaryButton
            title="Изменить сложность"
            onPress={() => setDeck(null)}
            color={colors.cardLight}
          />
        </View>
      </View>
    );

  const card = deck[index];
  const customTranslation = preferences.customTranslations[card.id];
  const activeCard = {
    ...card,
    ...wordLearningDetails(card.english, customTranslation || card.russian),
    ...(customTranslation ? {
        russian: customTranslation,
        fullTranslation: customTranslation,
        translations: [customTranslation],
      } : {}),
  };
  const englishToRussian = card.direction === "en-ru";
  const prompt = englishToRussian ? activeCard.english : activeCard.russian;
  const expected = englishToRussian ? activeCard.russian : activeCard.english;
  const acceptedAnswers = englishToRussian
    ? [activeCard.russian, ...(activeCard.translations || [])]
    : [activeCard.english];
  const direction = englishToRussian
    ? "ПЕРЕВЕДИ НА РУССКИЙ"
    : "ПЕРЕВЕДИ НА АНГЛИЙСКИЙ";
  const choiceOptions = wordChoices;
  const favorite = preferences.favorites.includes(card.id);
  const hard = preferences.hard.includes(card.id);
  const currentStat = stats[card.id];
  const statusText = wordStateLabels[wordLearningState(currentStat, today)];

  const check = (submittedAnswer = answer) => {
    Keyboard.dismiss();
    const evaluation = evaluateExercise(
      { answer: acceptedAnswers[0], answers: acceptedAnswers.slice(1) },
      submittedAnswer,
    );
    const result = evaluation.correct;
    setGrade(evaluation.status);
    setCorrect(result);
    setChecked(true);
    setAnswer(submittedAnswer);
    if (result) setScore((value) => value + 1);
    recordReview(activeCard, result, card.direction, `${sessionId}-${index}`);
    Haptics.notificationAsync(
      result
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
  };

  const next = () => {
    if (index === deck.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setPhase("learn");
    setAnswer("");
    setChecked(false);
    setCorrect(false);
    setGrade("");
    setLetterTiles([]);
    setUsedLetters([]);
    setEditingTranslation(false);
  };

  const beginTest = () => {
    setPhase("test");
    setAnswer("");
    if (mode === "letters") {
      setLetterTiles(
        shuffleOptions(
          activeCard.english.split("").map((letter, tileIndex) => ({
            id: `${tileIndex}-${letter}`,
            letter,
          })),
          `${activeCard.id}-${index}`,
        ),
      );
      setUsedLetters([]);
    }
    if (mode === "listening")
      setTimeout(
        () =>
          speakNow(activeCard.english, {
            language: progress.settings?.accent || "en-US",
            rate: progress.settings?.speechRate || 0.8,
          }),
        120,
      );
  };

  const useLetter = (tile) => {
    if (checked || usedLetters.includes(tile.id)) return;
    setUsedLetters((current) => [...current, tile.id]);
    setAnswer((current) => `${current}${tile.letter}`);
  };

  const skipHiddenWord = () => {
    hideWord(card.id);
    next();
  };

  const speak = () =>
    speakNow(activeCard.english, {
      language: progress.settings?.accent || "en-US",
      rate: progress.settings?.speechRate || 0.8,
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sessionHeader}>
          <Pressable onPress={() => setDeck(null)} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={(index + 1) / deck.length}
              color={levelColors[card.level]}
            />
          </View>
          <Text
            style={[styles.sessionLevel, { color: levelColors[card.level] }]}
          >
            {card.level}
          </Text>
        </View>
        <Text style={styles.sessionMeta}>
          СЛОВО {index + 1} ИЗ {deck.length} · {card.frequency ? `ЧАСТОТНОСТЬ #${card.frequency}` : 'ПОЛЕЗНАЯ ЛЕКСИКА'}
        </Text>
        <View style={styles.wordToolbar}>
          <View style={styles.statusChip}><Text style={styles.statusChipText}>{statusText}</Text></View>
          <Pressable onPress={() => toggleWordPreference("favorites", card.id)} style={styles.toolButton}><Ionicons name={favorite ? "star" : "star-outline"} size={21} color={favorite ? colors.orange : colors.textMuted} /></Pressable>
          <Pressable onPress={() => toggleWordPreference("hard", card.id)} style={styles.toolButton}><Ionicons name={hard ? "alert-circle" : "alert-circle-outline"} size={21} color={hard ? colors.pink : colors.textMuted} /></Pressable>
          <Pressable onPress={() => { setEditingTranslation(!editingTranslation); setTranslationDraft(activeCard.russian); }} style={styles.toolButton}><Ionicons name="pencil" size={19} color={colors.purple} /></Pressable>
          <Pressable onPress={skipHiddenWord} style={styles.toolButton}><Ionicons name="eye-off-outline" size={20} color={colors.textMuted} /></Pressable>
        </View>

        <ContentReportButton item={{id:activeCard.id,type:'translate',prompt:activeCard.english,answer:activeCard.fullTranslation}} context={{topic:'Слова',selected:answer}}/>
        {phase === "learn" ? (
          <>
            <LinearGradient
              colors={[colors.card, colors.cardLight]}
              style={styles.studyCard}
            >
              <Text style={styles.cardEmoji}>{activeCard.emoji}</Text>
              <Text style={styles.englishWord}>{activeCard.english}</Text>
              {!!activeCard.transcription && (
                <Text style={styles.transcription}>{activeCard.transcription}</Text>
              )}
              {!!activeCard.partOfSpeech && (
                <Text style={styles.partOfSpeech}>{activeCard.partOfSpeechInferred && !activeCard.partOfSpeech.startsWith('Часть речи') ? `По переводу: ${activeCard.partOfSpeech.toLowerCase()}` : activeCard.partOfSpeech}</Text>
              )}
              <View style={styles.divider} />
              <Text style={styles.russianWord}>{activeCard.russian}</Text>
              <WordMeanings key={activeCard.id} word={activeCard} />
              <WordContext key={`example-${activeCard.id}`} word={activeCard} accent={progress.settings?.accent || 'en-US'} rate={progress.settings?.speechRate || 0.78} />
              <Pressable onPress={speak} style={styles.speakButton}>
                <Ionicons name="volume-high" size={21} color={colors.text} />
                <Text style={styles.speakText}>Послушать</Text>
              </Pressable>
            </LinearGradient>
            {editingTranslation && (
              <View style={styles.editTranslation}>
                <Text style={styles.editLabel}>СВОЙ ПЕРЕВОД</Text>
                <TextInput value={translationDraft} onChangeText={setTranslationDraft} placeholder="Исправленный перевод" placeholderTextColor={colors.textMuted} style={styles.editInput} />
                <View style={styles.editActions}>
                  <Pressable onPress={() => { updateWordTranslation(card.id, ""); setTranslationDraft(card.russian); }}><Text style={styles.resetTranslation}>Вернуть исходный</Text></Pressable>
                  <Pressable onPress={() => { updateWordTranslation(card.id, translationDraft); setEditingTranslation(false); }} style={styles.saveTranslation}><Text style={styles.saveTranslationText}>Сохранить</Text></Pressable>
                </View>
              </View>
            )}
            <View style={styles.learningHint}>
              <Ionicons name="bulb" size={21} color={colors.orange} />
              <Text style={styles.learningHintText}>
                Прочитай слово и перевод, послушай произношение, затем проверь
                себя.
              </Text>
            </View>
            <PrimaryButton
              title="Запомнил — проверить"
              onPress={beginTest}
              color={levelColors[card.level]}
            />
          </>
        ) : (
          <>
            <LinearGradient
              colors={[colors.accentSoft, colors.card]}
              style={styles.testCard}
            >
              <Text style={styles.directionBadge}>
                {mode === "listening"
                  ? "АУДИРОВАНИЕ"
                  : mode === "letters"
                    ? "СОБЕРИ АНГЛИЙСКОЕ СЛОВО"
                    : mode === "definition"
                      ? "ВЫБЕРИ СЛОВО ПО ЗНАЧЕНИЮ"
                      : direction}
              </Text>
              {mode === "listening" ? (
                <Pressable onPress={speak} style={styles.bigListen}>
                  <Ionicons name="headset" size={58} color={colors.text} />
                  <Text style={styles.bigListenText}>Нажми и послушай</Text>
                </Pressable>
              ) : (
                <Text style={styles.testPrompt}>{prompt}</Text>
              )}
              <Text style={styles.testInstruction}>
                {checked
                  ? "Ответ проверен"
                  : mode === "choice" || mode === "definition"
                    ? "Выбери один вариант"
                    : mode === "letters"
                      ? "Нажимай буквы по порядку"
                      : "Напиши перевод самостоятельно"}
              </Text>
            </LinearGradient>
            {(mode === "typing" || mode === "listening") && (
              <><View
                style={[
                  styles.answerBox,
                  checked && {
                    borderColor: correct
                      ? colors.mint
                      : grade === "close"
                        ? colors.orange
                        : colors.pink,
                  },
                ]}
              >
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  editable={!checked}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => answer.trim() && !checked && check()}
                  placeholder={englishToRussian ? "Перевод на русском…" : "Translation in English…"}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
              {!checked && <PrimaryButton title="Проверить перевод" onPress={() => check()} disabled={!answer.trim()} />}</>
            )}
            {(mode === "choice" || mode === "definition") && (
              <View style={styles.choiceList}>
                {choiceOptions.map((option) => (
                  <Pressable key={option} disabled={checked} onPress={() => check(option)} style={[styles.choiceOption, checked && option === expected && styles.choiceCorrect, checked && answer === option && option !== expected && styles.choiceWrong]}>
                    <Text style={styles.choiceOptionText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {mode === "letters" && (
              <View>
                <View style={[styles.letterAnswer, checked && { borderColor: correct ? colors.mint : colors.pink }]}>
                  <Text style={styles.letterAnswerText}>{answer || "_"}</Text>
                  {!checked && !!answer && <Pressable onPress={() => { setAnswer(""); setUsedLetters([]); }}><Ionicons name="backspace-outline" size={23} color={colors.textMuted} /></Pressable>}
                </View>
                <View style={styles.letters}>
                  {letterTiles.map((tile) => {
                    const used = usedLetters.includes(tile.id);
                    return <Pressable key={tile.id} disabled={used || checked} onPress={() => useLetter(tile)} style={[styles.letter, used && styles.letterUsed]}><Text style={styles.letterText}>{tile.letter === " " ? "␣" : tile.letter}</Text></Pressable>;
                  })}
                </View>
                {!checked && <PrimaryButton title="Проверить слово" onPress={() => check()} disabled={!answer.trim()} />}
              </View>
            )}
            {checked && (
              <>
                <View
                  style={[
                    styles.feedback,
                    {
                      backgroundColor: `${correct ? colors.mint : grade === "close" ? colors.orange : colors.pink}1F`,
                    },
                  ]}
                >
                  <Ionicons
                    name={correct ? "checkmark-circle" : "bulb"}
                    size={27}
                    color={
                      correct
                        ? colors.mint
                        : grade === "close"
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
                            : grade === "close"
                              ? colors.orange
                              : colors.pink,
                        },
                      ]}
                    >
                      {correct
                        ? "Верно!"
                        : grade === "close"
                          ? "Почти верно"
                          : "Неверно"}
                    </Text>
                    {!correct && (
                      <Text style={styles.correctAnswer}>{expected}</Text>
                    )}
                    <Text style={styles.fullAnswer}>
                      {activeCard.fullTranslation}
                    </Text>
                    <Text style={styles.explanationDetail}>
                      {expandExplanation(
                        {
                          prompt: activeCard.english,
                          answer: expected,
                          type: englishToRussian ? "translate" : "build",
                          explanation:
                            "Здесь проверяется основное значение слова в выбранном направлении перевода. Связывай написание, произношение и значение как одну карточку.",
                        },
                        { selected: answer, topic: "Словарный повтор" },
                      )}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={speak} style={styles.listen}>
                  <Ionicons
                    name="volume-high"
                    size={20}
                    color={colors.purple}
                  />
                  <Text style={styles.listenText}>Послушать произношение</Text>
                </Pressable>
                <PrimaryButton
                  title={
                    index === deck.length - 1 ? "Результат" : "Следующее слово"
                  }
                  onPress={next}
                  color={correct ? colors.mint : colors.orange}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MiniStat({ value, label, color }) {
  useTheme();
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = createThemedStyles(() => ({
  container: { flex: 1 },
  setup: { padding: 20, paddingBottom: 125 },
  hero: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroEmoji: { fontSize: 60 },
  setupTitle: { color: colors.text, fontSize: 32, fontWeight: "900", marginTop: 8 },
  setupSubtitle: { color: colors.textMuted, textAlign: "center", marginTop: 6 },
  catalogSwitch: { flexDirection: "row", gap: 9, marginTop: 12 },
  catalogOption: {
    flex: 1,
    padding: 13,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catalogOptionActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.purple,
  },
  catalogTitle: { color: colors.textMuted, fontSize: 13, fontWeight: "900" },
  catalogSubtitle: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  dailyWord: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 15,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,159,67,.10)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,.28)",
  },
  dailyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,159,67,.14)",
  },
  dailyEmoji: { fontSize: 25 },
  dailyLabel: { color: colors.orange, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  dailyTitle: { color: colors.text, fontSize: 21, fontWeight: "900", marginTop: 2 },
  dailyText: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  miniStat: {
    width: "48.5%",
    padding: 13,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniValue: { fontSize: 20, fontWeight: "900" },
  miniLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 23,
    marginBottom: 10,
  },
  levels: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  level: {
    width: "31%",
    minHeight: 68,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelName: { color: colors.textMuted, fontSize: 17, fontWeight: "900" },
  levelCount: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  themes: { gap: 9, paddingRight: 20 },
  theme: {
    width: 124,
    minHeight: 105,
    padding: 13,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeActive: { borderColor: colors.purple, backgroundColor: colors.accentSoft },
  themeEmoji: { fontSize: 27 },
  themeTitle: { color: colors.text, fontWeight: "800", fontSize: 12, marginTop: 8 },
  themeCount: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  filterRow: { gap: 7, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.purple },
  filterText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
  availableText: { color: colors.textMuted, fontSize: 10, marginTop: 8 },
  modes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mode: {
    width: "48.5%",
    minHeight: 102,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeActive: { borderColor: colors.purple, backgroundColor: colors.accentSoft },
  modeTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 8 },
  modeText: { color: colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 15,
    marginTop: 12,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressValue: { color: colors.mint, fontWeight: "900" },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  cardText: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  segmented: { flexDirection: "row", gap: 7 },
  segment: {
    flex: 1,
    minHeight: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  segmentActive: { backgroundColor: colors.accentSoft },
  segmentText: { color: colors.textMuted, fontWeight: "900" },
  directionList: { gap: 8, marginBottom: 18 },
  directionChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionActive: {
    borderColor: colors.purple,
    backgroundColor: colors.accentSoft,
  },
  source: {
    color: colors.textMuted,
    fontSize: 9,
    textAlign: "center",
    marginTop: 13,
  },
  scroll: { padding: 20, paddingBottom: 125 },
  sessionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionLevel: { width: 30, fontWeight: "900", textAlign: "right" },
  sessionMeta: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 16,
    textAlign: "center",
  },
  wordToolbar: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 },
  statusChip: {
    flex: 1,
    paddingHorizontal: 11,
    height: 37,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  statusChipText: { color: colors.purple, fontSize: 10, fontWeight: "900" },
  toolButton: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  studyCard: {
    minHeight: 390,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmoji: { fontSize: 48 },
  englishWord: {
    color: colors.text,
    fontSize: 39,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },
  transcription: { color: colors.textMuted, fontSize: 15, marginTop: 7 },
  partOfSpeech: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 7,
  },
  divider: {
    width: 55,
    height: 2,
    backgroundColor: colors.track,
    marginVertical: 18,
  },
  russianWord: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    textAlign: "center",
  },
  wordExample: {
    color: colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  wordExampleRu: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 3,
  },
  otherMeanings: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },
  editTranslation: { backgroundColor: colors.card, padding: 14, borderRadius: 18, marginTop: 11 },
  editLabel: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  editInput: { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12 },
  editActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 11 },
  resetTranslation: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  saveTranslation: { backgroundColor: colors.accentSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11 },
  saveTranslationText: { color: colors.text, fontSize: 10, fontWeight: "900" },
  speakButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 13,
    marginTop: 18,
  },
  speakText: { color: colors.text, fontWeight: "800" },
  learningHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginVertical: 13,
  },
  learningHintText: {
    color: colors.textMuted,
    flex: 1,
    lineHeight: 19,
    fontSize: 12,
  },
  testCard: {
    minHeight: 260,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 16,
  },
  directionBadge: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  testPrompt: {
    color: colors.text,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 24,
  },
  testInstruction: { color: colors.textMuted, marginTop: 18 },
  bigListen: { alignItems: "center", marginTop: 24 },
  bigListenText: { color: colors.text, fontWeight: "800", marginTop: 10 },
  answerBox: {
    minHeight: 59,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 17,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    paddingVertical: 16,
  },
  choiceList: { gap: 8, marginTop: 14 },
  choiceOption: {
    minHeight: 55,
    borderRadius: 17,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  choiceCorrect: { borderColor: colors.mint, backgroundColor: "rgba(41,205,170,.12)" },
  choiceWrong: { borderColor: colors.pink, backgroundColor: "rgba(236,72,153,.12)" },
  choiceOptionText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  letterAnswer: {
    minHeight: 62,
    marginTop: 14,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  letterAnswerText: { color: colors.text, fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  letters: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7, marginVertical: 14 },
  letter: { minWidth: 43, height: 45, paddingHorizontal: 11, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.purple },
  letterUsed: { opacity: 0.18 },
  letterText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  feedback: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    marginTop: 2,
  },
  feedbackTitle: { fontSize: 17, fontWeight: "900" },
  explanationDetail: { color: colors.textMuted, lineHeight: 21, marginTop: 12 },
  correctAnswer: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 5,
  },
  fullAnswer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  listen: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 15,
  },
  listenText: { color: colors.text, fontWeight: "700" },
  result: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  resultEmoji: { fontSize: 80 },
  resultTitle: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "900",
    marginTop: 12,
  },
  resultSubtitle: {
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 9,
  },
  resultButtons: { width: "100%", gap: 9, marginTop: 25 },
}));
