import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { lessons } from "../data/course";

const STORAGE_KEY = "@lingospark/progress-v1";
const initial = {
  onboarded: false,
  name: "Друг",
  learnerLevel: null,
  dailyGoal: 30,
  totalXP: 0,
  dailyXP: 0,
  streak: 0,
  completed: [],
  completedTenses: [],
  completedBosses: [],
  completedGrammarTracks: [],
  tenseExamBest: 0,
  c1ExamBest: 0,
  c1Certificate: false,
  levelExamBest: {},
  writingCompleted: [],
  lexicalReviewStats: {},
  branchingResults: {},
  ieltsProgress: {
    readingBest: 0,
    listeningBest: 0,
    writingCompleted: [],
    speakingCompleted: [],
  },
  workCompleted: [],
  readingCompleted: [],
  storyGame: { chapter: 0, score: 0, choices: [], completed: false },
  world: {
    completed: [],
    stars: {},
    inventory: [],
    history: [],
    decisions: {},
    relationships: {},
    messages: [],
    homeItems: [],
    money: 150,
    reputation: 0,
    career: null,
    events: {},
    replies: {},
  },
  marathons: {},
  dailyExams: {},
  careerCompleted: [],
  seasonTwo: { chapter: 0, score: 0, choices: [], completed: false },
  fullIeltsBest: 0,
  courseCheckpoints: {},
  lessonResults: {},
  notebook: [],
  lessonDraft: null,
  favorites: [],
  dailyChallenges: {},
  missionResults: {},
  unlockedAll: false,
  reviewStats: {},
  wordPreferences: {
    favorites: [],
    hard: [],
    hidden: [],
    customTranslations: {},
  },
  mistakes: [],
  dailyActions: {
    date: null,
    lessons: 0,
    reviews: 0,
    dictations: 0,
    dialogues: 0,
  },
  stats: {
    reviewCorrect: 0,
    reviewTotal: 0,
    dictationCorrect: 0,
    dictationTotal: 0,
    grammarCorrect: 0,
    grammarTotal: 0,
    storiesCompleted: 0,
    dialoguesCompleted: 0,
    gamesPlayed: 0,
    gameBest: 0,
  },
  coins: 0,
  ownedRewards: [],
  customWords: [],
  activity: {},
  settings: {
    accent: "en-US",
    speechRate: 0.78,
    strictChecking: false,
    lessonSize: 5,
    challengeMode: false,
    largeText: false,
    reduceMotion: false,
    haptics: true,
    voiceFeedback: false,
    quickActions: ["dictation", "dialogues", "review", "mistakes"],
  },
  lastStudyDate: null,
  dailyDate: null,
  seenUpdate: null,
};

const ProgressContext = createContext(null);
const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const contiguousCompleted = (completed = []) => {
  const saved = new Set(completed);
  const result = [];
  for (const lesson of lessons) {
    if (!saved.has(lesson.id)) break;
    result.push(lesson.id);
  }
  return result;
};

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = { ...initial, ...JSON.parse(raw) };
        saved.completed = contiguousCompleted(saved.completed);
        saved.unlockedAll = false;
        if (saved.dailyDate !== dateKey()) saved.dailyXP = 0;
        setProgress(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(
        () => {},
      );
  }, [progress, ready]);

  const finishOnboarding = (name, dailyGoal) => {
    setProgress((old) => ({
      ...old,
      onboarded: true,
      name: name.trim() || "Друг",
      dailyGoal,
    }));
  };

  const completeLesson = (lesson, result = null) => {
    setProgress((old) => {
      const today = dateKey();
      if (old.completed.includes(lesson.id)) {
        const actions =
          old.dailyActions?.date === today
            ? old.dailyActions
            : {
                date: today,
                lessons: 0,
                reviews: 0,
                dictations: 0,
                dialogues: 0,
              };
        return {
          ...old,
          lessonResults: result
            ? {
                ...(old.lessonResults || {}),
                [lesson.id]: {
                  ...result,
                  bestAccuracy: Math.max(
                    old.lessonResults?.[lesson.id]?.bestAccuracy || 0,
                    result.accuracy,
                  ),
                },
              }
            : old.lessonResults,
          lessonDraft:
            old.lessonDraft?.lessonId === lesson.id ? null : old.lessonDraft,
          coins: (old.coins || 0) + 3,
          activity: {
            ...old.activity,
            [today]: (old.activity?.[today] || 0) + 1,
          },
          dailyActions: { ...actions, lessons: (actions.lessons || 0) + 1 },
        };
      }
      const yesterday = dateKey(new Date(Date.now() - 86400000));
      const streak =
        old.lastStudyDate === today
          ? old.streak
          : old.lastStudyDate === yesterday
            ? old.streak + 1
            : 1;
      return {
        ...old,
        totalXP: old.totalXP + lesson.xp,
        dailyXP: (old.dailyDate === today ? old.dailyXP : 0) + lesson.xp,
        dailyDate: today,
        lastStudyDate: today,
        streak,
        completed: [...old.completed, lesson.id],
        lessonResults: result
          ? {
              ...(old.lessonResults || {}),
              [lesson.id]: {
                ...result,
                bestAccuracy: Math.max(
                  old.lessonResults?.[lesson.id]?.bestAccuracy || 0,
                  result.accuracy,
                ),
              },
            }
          : old.lessonResults,
        lessonDraft:
          old.lessonDraft?.lessonId === lesson.id ? null : old.lessonDraft,
        coins: (old.coins || 0) + 10,
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        dailyActions: {
          ...(old.dailyActions?.date === today
            ? old.dailyActions
            : {
                date: today,
                lessons: 0,
                reviews: 0,
                dictations: 0,
                dialogues: 0,
              }),
          lessons:
            (old.dailyActions?.date === today
              ? old.dailyActions.lessons || 0
              : 0) + 1,
        },
      };
    });
  };

  const recordReview = (card, isCorrect, direction) => {
    setProgress((old) => {
      const today = dateKey();
      const previous = old.reviewStats?.[card.id] || {
        interval: 0,
        correct: 0,
        total: 0,
      };
      const intervals = [1, 3, 7, 14, 30];
      const interval = isCorrect
        ? intervals.find((value) => value > (previous.interval || 0)) || 30
        : 0;
      const dueDate = dateKey(new Date(Date.now() + interval * 86400000));
      const mistakeId = `review-${card.id}-${direction}`;
      const withoutCurrent = (old.mistakes || []).filter(
        (item) => item.id !== mistakeId,
      );
      const mistakes = isCorrect
        ? withoutCurrent
        : [
            {
              id: mistakeId,
              type: "Слово",
              prompt: direction === "en-ru" ? card.english : card.russian,
              answer: direction === "en-ru" ? card.russian : card.english,
              explanation:
                direction === "en-ru"
                  ? `Запоминай слово в контексте: ${card.example || card.english}.`
                  : `Свяжи перевод «${card.russian}» с формой ${card.english}.`,
              date: today,
            },
            ...withoutCurrent,
          ].slice(0, 50);
      const actions =
        old.dailyActions?.date === today
          ? old.dailyActions
          : {
              date: today,
              lessons: 0,
              reviews: 0,
              dictations: 0,
              dialogues: 0,
            };
      const wordPreferences = {
        ...initial.wordPreferences,
        ...(old.wordPreferences || {}),
      };
      const hardWords = wordPreferences.hard || [];
      return {
        ...old,
        reviewStats: {
          ...old.reviewStats,
          [card.id]: {
            interval,
            dueDate,
            correct: previous.correct + (isCorrect ? 1 : 0),
            total: previous.total + 1,
          },
        },
        mistakes,
        wordPreferences: {
          ...wordPreferences,
          hard:
            !isCorrect && !hardWords.includes(card.id)
              ? [card.id, ...hardWords]
              : hardWords,
        },
        stats: {
          ...old.stats,
          reviewCorrect: (old.stats?.reviewCorrect || 0) + (isCorrect ? 1 : 0),
          reviewTotal: (old.stats?.reviewTotal || 0) + 1,
        },
        coins: (old.coins || 0) + (isCorrect ? 2 : 0),
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        dailyActions: {
          ...actions,
          reviews: (actions.reviews || 0) + (isCorrect ? 1 : 0),
        },
      };
    });
  };
  const toggleWordPreference = (kind, wordId) =>
    setProgress((old) => {
      const preferences = {
        ...initial.wordPreferences,
        ...(old.wordPreferences || {}),
      };
      const current = preferences[kind] || [];
      return {
        ...old,
        wordPreferences: {
          ...preferences,
          [kind]: current.includes(wordId)
            ? current.filter((id) => id !== wordId)
            : [wordId, ...current],
        },
      };
    });
  const hideWord = (wordId) =>
    setProgress((old) => {
      const preferences = {
        ...initial.wordPreferences,
        ...(old.wordPreferences || {}),
      };
      return {
        ...old,
        wordPreferences: {
          ...preferences,
          hidden: preferences.hidden.includes(wordId)
            ? preferences.hidden
            : [wordId, ...preferences.hidden],
        },
      };
    });
  const updateWordTranslation = (wordId, translation) =>
    setProgress((old) => {
      const preferences = {
        ...initial.wordPreferences,
        ...(old.wordPreferences || {}),
      };
      const customTranslations = { ...preferences.customTranslations };
      if (translation.trim()) customTranslations[wordId] = translation.trim();
      else delete customTranslations[wordId];
      return {
        ...old,
        wordPreferences: { ...preferences, customTranslations },
      };
    });

  const recordExercise = (exercise, isCorrect) => {
    setProgress((old) => {
      const mistakeId = `lesson-${exercise.id}`;
      const remaining = (old.mistakes || []).filter(
        (item) => item.id !== mistakeId,
      );
      return {
        ...old,
        mistakes: isCorrect
          ? remaining
          : [
              {
                id: mistakeId,
                type: "Урок",
                prompt: exercise.prompt,
                answer: exercise.answer,
                explanation:
                  exercise.explanation ||
                  exercise.hint ||
                  "Сравни смысл задания с правильной формой и повтори ответ вслух.",
                date: dateKey(),
              },
              ...remaining,
            ].slice(0, 50),
      };
    });
  };
  const resolveMistake = (id) =>
    setProgress((old) => ({
      ...old,
      mistakes: (old.mistakes || []).filter((item) => item.id !== id),
      coins: (old.coins || 0) + 2,
    }));

  const recordDictation = (item, isCorrect) => {
    setProgress((old) => {
      const today = dateKey();
      const mistakeId = `dictation-${item.id}`;
      const remaining = (old.mistakes || []).filter(
        (entry) => entry.id !== mistakeId,
      );
      const mistakes = isCorrect
        ? remaining
        : [
            {
              id: mistakeId,
              type: "Диктант",
              prompt: item.translation,
              answer: item.text,
              explanation:
                "В диктанте сначала улови смысловые слова, затем проверь окончания, артикли и порядок слов.",
              date: today,
            },
            ...remaining,
          ].slice(0, 50);
      const actions =
        old.dailyActions?.date === today
          ? old.dailyActions
          : {
              date: today,
              lessons: 0,
              reviews: 0,
              dictations: 0,
              dialogues: 0,
            };
      return {
        ...old,
        mistakes,
        coins: (old.coins || 0) + (isCorrect ? 4 : 0),
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          dictationCorrect:
            (old.stats?.dictationCorrect || 0) + (isCorrect ? 1 : 0),
          dictationTotal: (old.stats?.dictationTotal || 0) + 1,
        },
        dailyActions: {
          ...actions,
          dictations: (actions.dictations || 0) + (isCorrect ? 1 : 0),
        },
      };
    });
  };

  const recordDialogue = () => {
    setProgress((old) => {
      const today = dateKey();
      const actions =
        old.dailyActions?.date === today
          ? old.dailyActions
          : {
              date: today,
              lessons: 0,
              reviews: 0,
              dictations: 0,
              dialogues: 0,
            };
      return {
        ...old,
        coins: (old.coins || 0) + 6,
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          dialoguesCompleted: (old.stats?.dialoguesCompleted || 0) + 1,
        },
        dailyActions: { ...actions, dialogues: (actions.dialogues || 0) + 1 },
      };
    });
  };

  const setPlacementResult = (level) =>
    setProgress((old) => ({
      ...old,
      learnerLevel: level,
      unlockedAll: level !== "A1",
    }));

  const recordGrammar = (question, isCorrect) => {
    setProgress((old) => {
      const mistakeId = `grammar-${question.id}`;
      const remaining = (old.mistakes || []).filter(
        (item) => item.id !== mistakeId,
      );
      const mistakes = isCorrect
        ? remaining
        : [
            {
              id: mistakeId,
              type: "Грамматика",
              prompt: question.prompt,
              answer: question.answer,
              explanation:
                question.explanation ||
                question.hint ||
                "Обрати внимание на форму глагола и слова-маркеры в предложении.",
              date: dateKey(),
            },
            ...remaining,
          ].slice(0, 50);
      const today = dateKey();
      return {
        ...old,
        mistakes,
        coins: (old.coins || 0) + (isCorrect ? 3 : 0),
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          grammarCorrect:
            (old.stats?.grammarCorrect || 0) + (isCorrect ? 1 : 0),
          grammarTotal: (old.stats?.grammarTotal || 0) + 1,
        },
      };
    });
  };

  const completeTense = (tenseId) =>
    setProgress((old) =>
      old.completedTenses?.includes(tenseId)
        ? old
        : {
            ...old,
            completedTenses: [...(old.completedTenses || []), tenseId],
            coins: (old.coins || 0) + 12,
          },
    );
  const completeBoss = (level) =>
    setProgress((old) =>
      old.completedBosses?.includes(level)
        ? old
        : {
            ...old,
            completedBosses: [...(old.completedBosses || []), level],
            coins: (old.coins || 0) + 25,
          },
    );
  const completeGrammarTrack = (trackId) =>
    setProgress((old) =>
      old.completedGrammarTracks?.includes(trackId)
        ? old
        : {
            ...old,
            completedGrammarTracks: [
              ...(old.completedGrammarTracks || []),
              trackId,
            ],
            coins: (old.coins || 0) + 15,
          },
    );
  const recordTenseExam = (score) =>
    setProgress((old) => ({
      ...old,
      tenseExamBest: Math.max(old.tenseExamBest || 0, score),
      coins: (old.coins || 0) + score,
    }));
  const recordC1Exam = (score) =>
    setProgress((old) => ({
      ...old,
      c1ExamBest: Math.max(old.c1ExamBest || 0, score),
      c1Certificate: old.c1Certificate || score >= 24,
      coins: (old.coins || 0) + score * 2,
    }));
  const recordLevelExam = (level, score) =>
    setProgress((old) => ({
      ...old,
      levelExamBest: {
        ...(old.levelExamBest || {}),
        [level]: Math.max(old.levelExamBest?.[level] || 0, score),
      },
      coins: (old.coins || 0) + score * 2,
    }));
  const completeWriting = (taskId) =>
    setProgress((old) =>
      old.writingCompleted?.includes(taskId)
        ? old
        : {
            ...old,
            writingCompleted: [...(old.writingCompleted || []), taskId],
            coins: (old.coins || 0) + 8,
          },
    );
  const recordLexiconReview = (wordId, rating) =>
    setProgress((old) => {
      const previous = old.lexicalReviewStats?.[wordId] || {
        box: 0,
        reviews: 0,
      };
      const box =
        rating === "again"
          ? 0
          : Math.max(
              0,
              Math.min(
                4,
                previous.box +
                  (rating === "easy" ? 2 : rating === "good" ? 1 : 0),
              ),
            );
      const interval = rating === "again" ? 0 : [1, 3, 7, 14, 30][box];
      const dueDate = dateKey(new Date(Date.now() + interval * 86400000));
      return {
        ...old,
        lexicalReviewStats: {
          ...(old.lexicalReviewStats || {}),
          [wordId]: {
            box,
            interval,
            dueDate,
            reviews: previous.reviews + 1,
            lastRating: rating,
          },
        },
        coins: (old.coins || 0) + (rating === "again" ? 0 : 1),
      };
    });
  const recordBranchingDialogue = (dialogueId, ending, score) =>
    setProgress((old) => ({
      ...old,
      branchingResults: {
        ...(old.branchingResults || {}),
        [dialogueId]: { ending, score, date: dateKey() },
      },
      coins: (old.coins || 0) + score * 2,
    }));
  const recordIelts = (module, value) =>
    setProgress((old) => {
      const current = old.ieltsProgress || initial.ieltsProgress;
      if (module === "reading" || module === "listening")
        return {
          ...old,
          ieltsProgress: {
            ...current,
            [`${module}Best`]: Math.max(current[`${module}Best`] || 0, value),
          },
          coins: (old.coins || 0) + value,
        };
      const key = `${module}Completed`;
      const completed = current[key] || [];
      return completed.includes(value)
        ? old
        : {
            ...old,
            ieltsProgress: { ...current, [key]: [...completed, value] },
            coins: (old.coins || 0) + 5,
          };
    });
  const completeWorkModule = (moduleId) =>
    setProgress((old) =>
      old.workCompleted?.includes(moduleId)
        ? old
        : {
            ...old,
            workCompleted: [...(old.workCompleted || []), moduleId],
            coins: (old.coins || 0) + 12,
          },
    );
  const completeReading = (textId, score) =>
    setProgress((old) => ({
      ...old,
      readingCompleted: (old.readingCompleted || []).includes(textId)
        ? old.readingCompleted
        : [...(old.readingCompleted || []), textId],
      coins: (old.coins || 0) + score * 3,
    }));
  const saveStoryGame = (chapter, score, choice, completed = false) =>
    setProgress((old) => ({
      ...old,
      storyGame: {
        chapter,
        score,
        choices: [...(old.storyGame?.choices || []), choice],
        completed,
      },
      coins: (old.coins || 0) + (completed ? 20 : 3),
    }));
  const completeWorldLocation = (
    location,
    score,
    stars,
    consequences = [],
    decision = null,
  ) =>
    setProgress((old) => {
      const alreadyCompleted = old.world?.completed?.includes(location.id);
      const inventory = old.world?.inventory || [];
      const today = dateKey();
      const previousDecision = old.world?.decisions?.[location.id];
      const applyDecision = decision && !previousDecision;
      const relationshipName = decision?.relation?.name;
      const relationships = old.world?.relationships || {};
      const homeItems = old.world?.homeItems || [];
      return {
        ...old,
        totalXP: old.totalXP + (alreadyCompleted ? 5 : 25 + location.order * 5),
        dailyXP:
          (old.dailyDate === today ? old.dailyXP : 0) +
          (alreadyCompleted ? 5 : 25 + location.order * 5),
        dailyDate: today,
        coins: (old.coins || 0) + (alreadyCompleted ? 2 : 10 + stars * 3),
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        world: {
          completed: alreadyCompleted
            ? old.world.completed
            : [...(old.world?.completed || []), location.id],
          stars: {
            ...(old.world?.stars || {}),
            [location.id]: Math.max(
              old.world?.stars?.[location.id] || 0,
              stars,
            ),
          },
          inventory: inventory.some((item) => item.id === location.reward.id)
            ? inventory
            : [...inventory, location.reward],
          history: [
            {
              locationId: location.id,
              score,
              consequences,
              date: today,
            },
            ...(old.world?.history || []),
          ].slice(0, 30),
          decisions: {
            ...(old.world?.decisions || {}),
            ...(applyDecision ? { [location.id]: decision } : {}),
          },
          relationships:
            applyDecision && relationshipName
              ? {
                  ...relationships,
                  [relationshipName]:
                    (relationships[relationshipName] || 0) +
                    decision.relation.delta,
                }
              : relationships,
          messages:
            applyDecision && decision.message
              ? [
                  {
                    ...decision.message,
                    id: `${location.id}-${decision.id}`,
                    date: today,
                  },
                  ...(old.world?.messages || []),
                ]
              : old.world?.messages || [],
          homeItems:
            applyDecision &&
            decision.homeItem &&
            !homeItems.some((item) => item.id === decision.homeItem.id)
              ? [...homeItems, decision.homeItem]
              : homeItems,
          money:
            (old.world?.money ?? 150) +
            (applyDecision ? decision.money || 0 : 0),
          reputation:
            (old.world?.reputation || 0) +
            (applyDecision ? decision.reputation || 0 : 0),
          career:
            applyDecision && decision.career
              ? decision.career
              : old.world?.career || null,
          events: old.world?.events || {},
          replies: old.world?.replies || {},
        },
      };
    });
  const buyWorldHomeItem = (item) =>
    setProgress((old) => {
      const money = old.world?.money ?? 150;
      const homeItems = old.world?.homeItems || [];
      if (money < item.cost || homeItems.some((entry) => entry.id === item.id))
        return old;
      return {
        ...old,
        world: {
          ...initial.world,
          ...(old.world || {}),
          money: money - item.cost,
          homeItems: [...homeItems, item],
        },
      };
    });
  const completeWorldEvent = (event, correct) =>
    setProgress((old) => {
      const events = old.world?.events || {};
      const today = dateKey();
      const key = `${today}-${event.id}`;
      if (events[key]) return old;
      return {
        ...old,
        world: {
          ...initial.world,
          ...(old.world || {}),
          money: (old.world?.money ?? 150) + (correct ? event.reward : 0),
          reputation: (old.world?.reputation || 0) + (correct ? 1 : 0),
          events: { ...events, [key]: { correct, date: today } },
        },
      };
    });
  const replyWorldMessage = (message, reply) =>
    setProgress((old) => {
      const replies = old.world?.replies || {};
      if (replies[message.id]) return old;
      const relationships = old.world?.relationships || {};
      const relationshipKey =
        Object.keys(relationships).find((name) =>
          name.toLowerCase().includes(message.from.toLowerCase()),
        ) || message.from;
      return {
        ...old,
        world: {
          ...initial.world,
          ...(old.world || {}),
          replies: {
            ...replies,
            [message.id]: { text: reply, date: dateKey() },
          },
          relationships: {
            ...relationships,
            [relationshipKey]: Math.min(
              5,
              (relationships[relationshipKey] || 0) + 1,
            ),
          },
        },
      };
    });
  const updateMarathon = (days, dayIndex) =>
    setProgress((old) => {
      const key = `${days}`;
      const current = old.marathons?.[key] || {
        startedAt: dateKey(),
        completed: [],
      };
      return current.completed.includes(dayIndex)
        ? old
        : {
            ...old,
            marathons: {
              ...(old.marathons || {}),
              [key]: {
                ...current,
                completed: [...current.completed, dayIndex],
              },
            },
            coins: (old.coins || 0) + 5,
          };
    });
  const recordDailyExam = (score, total) =>
    setProgress((old) => {
      const key = dateKey();
      const previous = old.dailyExams?.[key];
      return {
        ...old,
        dailyExams: {
          ...(old.dailyExams || {}),
          [key]: { score: Math.max(previous?.score || 0, score), total },
        },
        coins: (old.coins || 0) + (previous ? 0 : score * 2),
        activity: {
          ...(old.activity || {}),
          [key]: (old.activity?.[key] || 0) + 1,
        },
      };
    });
  const completeCareer = (trackId) =>
    setProgress((old) =>
      old.careerCompleted?.includes(trackId)
        ? old
        : {
            ...old,
            careerCompleted: [...(old.careerCompleted || []), trackId],
            coins: (old.coins || 0) + 15,
          },
    );
  const saveSeasonTwo = (chapter, score, choice, completed = false) =>
    setProgress((old) => ({
      ...old,
      seasonTwo: {
        chapter,
        score,
        choices: [...(old.seasonTwo?.choices || []), choice],
        completed,
      },
      coins: (old.coins || 0) + (completed ? 25 : 3),
    }));
  const recordFullIelts = (band) =>
    setProgress((old) => ({
      ...old,
      fullIeltsBest: Math.max(old.fullIeltsBest || 0, band),
      coins: (old.coins || 0) + Math.round(band * 5),
    }));
  const completeCourseCheckpoint = (level, score) =>
    setProgress((old) => ({
      ...old,
      courseCheckpoints: {
        ...(old.courseCheckpoints || {}),
        [level]: Math.max(old.courseCheckpoints?.[level] || 0, score),
      },
      coins: (old.coins || 0) + (score >= 8 ? 25 : score),
    }));
  const toggleNotebook = (item) =>
    setProgress((old) => {
      const exists = (old.notebook || []).some((entry) => entry.id === item.id);
      return {
        ...old,
        notebook: exists
          ? old.notebook.filter((entry) => entry.id !== item.id)
          : [item, ...(old.notebook || [])],
      };
    });
  const saveLessonDraft = (lessonId, index, lives) =>
    setProgress((old) => ({
      ...old,
      lessonDraft: { lessonId, index, lives, updatedAt: Date.now() },
    }));
  const clearLessonDraft = (lessonId) =>
    setProgress((old) =>
      old.lessonDraft?.lessonId === lessonId
        ? { ...old, lessonDraft: null }
        : old,
    );
  const toggleFavorite = (item) =>
    setProgress((old) => {
      const exists = (old.favorites || []).some(
        (favorite) => favorite.id === item.id && favorite.type === item.type,
      );
      return {
        ...old,
        favorites: exists
          ? old.favorites.filter(
              (favorite) =>
                favorite.id !== item.id || favorite.type !== item.type,
            )
          : [item, ...(old.favorites || [])],
      };
    });
  const recordDailyChallenge = (score, total) =>
    setProgress((old) => {
      const today = dateKey();
      const previous = old.dailyChallenges?.[today];
      const reward = previous ? 0 : score === total ? 30 : score;
      return {
        ...old,
        coins: (old.coins || 0) + reward,
        dailyChallenges: {
          ...(old.dailyChallenges || {}),
          [today]: {
            score: Math.max(previous?.score || 0, score),
            total,
            completed: true,
          },
        },
      };
    });
  const recordMission = (missionId, ending, score) =>
    setProgress((old) => ({
      ...old,
      coins: (old.coins || 0) + score * 3,
      missionResults: {
        ...(old.missionResults || {}),
        [missionId]: { ending, score, completedAt: dateKey() },
      },
    }));

  const recordStory = () =>
    setProgress((old) => {
      const today = dateKey();
      return {
        ...old,
        coins: (old.coins || 0) + 6,
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          storiesCompleted: (old.stats?.storiesCompleted || 0) + 1,
        },
      };
    });
  const recordGame = (score) =>
    setProgress((old) => {
      const today = dateKey();
      return {
        ...old,
        coins: (old.coins || 0) + score,
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          gamesPlayed: (old.stats?.gamesPlayed || 0) + 1,
          gameBest: Math.max(old.stats?.gameBest || 0, score),
        },
      };
    });

  const addCustomWord = (english, russian, example) =>
    setProgress((old) => ({
      ...old,
      customWords: [
        {
          id: `custom-${Date.now()}`,
          english: english.trim(),
          russian: russian.trim(),
          example: example.trim(),
        },
        ...(old.customWords || []),
      ],
    }));
  const removeCustomWord = (id) =>
    setProgress((old) => ({
      ...old,
      customWords: (old.customWords || []).filter((item) => item.id !== id),
    }));
  const buyReward = (id, cost) =>
    setProgress((old) =>
      (old.coins || 0) >= cost && !old.ownedRewards?.includes(id)
        ? {
            ...old,
            coins: (old.coins || 0) - cost,
            ownedRewards: [...(old.ownedRewards || []), id],
          }
        : old,
    );
  const recordExam = (score) =>
    setProgress((old) => {
      const today = dateKey();
      return {
        ...old,
        coins: (old.coins || 0) + score * 2,
        activity: {
          ...old.activity,
          [today]: (old.activity?.[today] || 0) + 1,
        },
        stats: {
          ...old.stats,
          examsTaken: (old.stats?.examsTaken || 0) + 1,
          examBest: Math.max(old.stats?.examBest || 0, score),
        },
      };
    });
  const updateSettings = (changes) =>
    setProgress((old) => ({
      ...old,
      settings: { ...initial.settings, ...old.settings, ...changes },
    }));
  const restoreProgress = (restored) =>
    setProgress({
      ...initial,
      ...restored,
      onboarded: true,
      settings: { ...initial.settings, ...(restored.settings || {}) },
    });

  const reset = () =>
    setProgress((old) => ({
      ...initial,
      onboarded: true,
      name: old.name,
      dailyGoal: old.dailyGoal,
    }));
  const unlockAll = () => setProgress((old) => ({ ...old, unlockedAll: true }));
  const markUpdateSeen = (version) =>
    setProgress((old) => ({ ...old, seenUpdate: version }));
  const isUnlocked = (lesson) => {
    const index = lessons.findIndex((item) => item.id === lesson.id);
    if (index <= 0) return true;
    return lessons
      .slice(0, index)
      .every((item) => progress.completed.includes(item.id));
  };

  const value = useMemo(
    () => ({
      progress,
      ready,
      finishOnboarding,
      completeLesson,
      completeTense,
      completeBoss,
      completeGrammarTrack,
      recordTenseExam,
      recordC1Exam,
      recordLevelExam,
      completeWriting,
      recordLexiconReview,
      recordBranchingDialogue,
      recordIelts,
      completeWorkModule,
      completeReading,
      saveStoryGame,
      completeWorldLocation,
      buyWorldHomeItem,
      completeWorldEvent,
      replyWorldMessage,
      updateMarathon,
      recordDailyExam,
      completeCareer,
      saveSeasonTwo,
      recordFullIelts,
      completeCourseCheckpoint,
      toggleNotebook,
      saveLessonDraft,
      clearLessonDraft,
      toggleFavorite,
      recordDailyChallenge,
      recordMission,
      recordReview,
      toggleWordPreference,
      hideWord,
      updateWordTranslation,
      recordExercise,
      resolveMistake,
      recordDictation,
      recordDialogue,
      setPlacementResult,
      recordGrammar,
      recordStory,
      recordGame,
      addCustomWord,
      removeCustomWord,
      buyReward,
      recordExam,
      updateSettings,
      restoreProgress,
      reset,
      unlockAll,
      markUpdateSeen,
      isUnlocked,
    }),
    [progress, ready],
  );
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
