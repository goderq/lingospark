import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackHandler, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ProgressProvider, useProgress } from "./src/store/ProgressContext";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { CloudSyncProvider } from "./src/store/CloudSyncContext";
import { LoadingScreen } from "./src/components/UI";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CourseScreen from "./src/screens/CourseScreen";
import LevelCheckpointScreen from "./src/screens/LevelCheckpointScreen";
import {
  NotebookScreen,
  ArticlesPrepositionsScreen,
} from "./src/screens/StudyToolsScreens";
import ReviewScreen from "./src/screens/ReviewScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AuthScreen from "./src/screens/AuthScreen";
import PhrasebookScreen from "./src/screens/PhrasebookScreen";
import LessonScreen from "./src/screens/LessonScreen";
import DictationScreen from "./src/screens/DictationScreen";
import DialogueScreen from "./src/screens/DialogueScreen";
import MistakesScreen from "./src/screens/MistakesScreen";
import PlacementScreen from "./src/screens/PlacementScreen";
import GrammarScreen from "./src/screens/GrammarScreen";
import StoriesScreen from "./src/screens/StoriesScreen";
import WordGameScreen from "./src/screens/WordGameScreen";
import {
  ActivityScreen,
  PlanScreen,
  PronunciationScreen,
  RewardsScreen,
  VocabularyScreen,
  WeeklyExamScreen,
} from "./src/screens/AdvancedScreens";
import {
  BackupScreen,
  CommonMistakesScreen,
  PacksScreen,
  SettingsScreen,
  ShadowingScreen,
} from "./src/screens/ExpansionScreens";
import TensesScreen from "./src/screens/TensesScreen";
import {
  IrregularVerbsScreen,
  LevelMapScreen,
} from "./src/screens/MasteryScreens";
import GrammarAcademyScreen from "./src/screens/GrammarAcademyScreen";
import TenseChallengeScreen from "./src/screens/TenseChallengeScreen";
import LearningHubScreen, {
  LearningAnalyticsScreen,
} from "./src/screens/LearningHubScreen";
import SentenceBuilderScreen from "./src/screens/SentenceBuilderScreen";
import C1ExamScreen from "./src/screens/C1ExamScreen";
import SkillSprintScreen from "./src/screens/SkillSprintScreen";
import {
  LevelProgressScreen,
  StreakCalendarScreen,
} from "./src/screens/InterfaceExpansionScreens";
import {
  BookmarksScreen,
  SmartSearchScreen,
} from "./src/screens/SmartLearningScreens";
import LingoWorldScreen from "./src/screens/LingoWorldScreen";
import {
  AdaptiveLessonScreen,
  ReviewCalendarScreen,
} from "./src/screens/AdaptiveScreens";
import {
  AchievementsScreen,
  DailyChallengeScreen,
  SkillsScreen,
} from "./src/screens/EngagementScreens";
import MissionsScreen from "./src/screens/MissionsScreen";
import {
  LexiconScreen,
  ListeningLabScreen,
  WritingStudioScreen,
  LevelExamsScreen,
  MinimalPairsScreen,
} from "./src/screens/MegaPracticeScreens";
import {
  SpacedRepetitionScreen,
  BranchingDialoguesScreen,
  IeltsScreen,
  SmartCoachScreen,
} from "./src/screens/DeepLearningScreens";
import {
  WorkEnglishScreen,
  ReadingLabScreen,
  StoryGameScreen,
  MarathonsScreen,
} from "./src/screens/GrowthScreens";
import {
  DailyMixedExamScreen,
  KnowledgeMapScreen,
} from "./src/screens/ProgressionScreens";
import {
  WrittenVocabularyScreen,
  CareerCoursesScreen,
  StorySeasonTwoScreen,
  FullIeltsMockScreen,
} from "./src/screens/PremiumScreens";
import { colors } from "./src/theme";
import { lessons } from "./src/data/course";

const AITutorScreen = React.lazy(() => import("./src/screens/AITutorScreen"));

const NAV_KEY = "@lingospark/navigation-v1";
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <ProgressProvider>
          <CloudSyncProvider>
            <AppContent />
          </CloudSyncProvider>
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { ready, progress } = useProgress();
  const {
    ready: authReady,
    user,
    guestMode,
  } = useAuth();
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null);
  const [recentScreens, setRecentScreens] = useState([]);
  const [aiImmersive, setAiImmersive] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const serializeOverlay = (value) =>
    value
      ? value.type === "lesson"
        ? { type: "lesson", lessonId: value.lesson.id }
        : { type: value.type, level: value.level }
      : null;
  const hydrateOverlay = (value) => {
    if (!value) return null;
    if (value.type === "lesson") {
      const lesson = lessons.find((item) => item.id === value.lessonId);
      return lesson ? { type: "lesson", lesson } : null;
    }
    return value;
  };
  useEffect(() => {
    AsyncStorage.getItem(NAV_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        // Always enter through the lightweight home screen. Restoring an AI,
        // speech or unfinished lesson screen during process launch can invoke
        // a native module before iOS has finished activating the application.
        setTab("home");
        setOverlay(null);
        setRecentScreens(saved.recentScreens || []);
      })
      .catch(() => {})
      .finally(() => setNavigationReady(true));
  }, []);
  useEffect(() => {
    if (!navigationReady) return;
    AsyncStorage.setItem(
      NAV_KEY,
      JSON.stringify({
        tab,
        overlay: serializeOverlay(overlay),
        recentScreens,
      }),
    ).catch(() => {});
  }, [tab, overlay, recentScreens, navigationReady]);
  useEffect(() => {
    if (!navigationReady) return;
    const serialized = serializeOverlay(overlay);
    const key = serialized
      ? `${serialized.type}-${serialized.lessonId || serialized.level || ""}`
      : `tab-${tab}`;
    if (key === "tab-home") return;
    const labels = {
      course: "Курс",
      ai: "ИИ-преподаватель",
      review: "Слова",
      profile: "Профиль",
      learningHub: "Каталог",
      settings: "Настройки",
      tenses: "Времена",
      adaptive: "Урок для тебя",
      dictation: "Диктант",
      dialogues: "Диалоги",
      mistakes: "Мои ошибки",
      grammarAcademy: "Академия грамматики",
      skillSprint: "Гибкая практика",
      levelProgress: "Прогресс A1–C1",
      streakCalendar: "Календарь серии",
      smartSearch: "Поиск",
      bookmarks: "Закладки",
      lingoWorld: "Английская жизнь",
    };
    const title =
      serialized?.type === "lesson"
        ? lessons.find((item) => item.id === serialized.lessonId)?.title ||
          "Урок"
        : labels[serialized?.type || tab] || "Раздел обучения";
    setRecentScreens((current) =>
      current[0]?.key === key
        ? current
        : [
            { key, title, tab: serialized ? null : tab, overlay: serialized },
            ...current.filter((item) => item.key !== key),
          ].slice(0, 5),
    );
  }, [tab, overlay, navigationReady]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (overlay) {
          setOverlay(null);
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [overlay]);
  if (!ready || !navigationReady || !authReady) return <LoadingScreen />;
  if (!progress.onboarded) return <OnboardingScreen />;
  if (!user && !guestMode) return <AuthScreen />;
  if (overlay?.type === "account")
    return (
      <SafeAreaView style={styles.safe}>
        <AuthScreen optional onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "levelProgress")
    return (
      <SafeAreaView style={styles.safe}>
        <LevelProgressScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "lesson", lesson })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "streakCalendar")
    return (
      <SafeAreaView style={styles.safe}>
        <StreakCalendarScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "smartSearch")
    return (
      <SafeAreaView style={styles.safe}>
        <SmartSearchScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "lesson", lesson })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              setTab("review");
            } else setOverlay({ type });
          }}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "bookmarks" || overlay?.type === "favorites")
    return (
      <SafeAreaView style={styles.safe}>
        <BookmarksScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "lesson", lesson })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              setTab("review");
            } else setOverlay({ type });
          }}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "lingoWorld")
    return (
      <SafeAreaView style={styles.safe}>
        <LingoWorldScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "lesson")
    return (
      <SafeAreaView style={styles.safe}>
        <LessonScreen
          lesson={overlay.lesson}
          onClose={() => setOverlay(null)}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "courseCheckpoint")
    return (
      <SafeAreaView style={styles.safe}>
        <LevelCheckpointScreen
          level={overlay.level}
          onClose={() => setOverlay(null)}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "notebook")
    return (
      <SafeAreaView style={styles.safe}>
        <NotebookScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "articlesPrepositions")
    return (
      <SafeAreaView style={styles.safe}>
        <ArticlesPrepositionsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "skillSprint")
    return (
      <SafeAreaView style={styles.safe}>
        <SkillSprintScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "phrases")
    return (
      <SafeAreaView style={styles.safe}>
        <PhrasebookScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "dictation")
    return (
      <SafeAreaView style={styles.safe}>
        <DictationScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "dialogues")
    return (
      <SafeAreaView style={styles.safe}>
        <DialogueScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "mistakes")
    return (
      <SafeAreaView style={styles.safe}>
        <MistakesScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "placement")
    return (
      <SafeAreaView style={styles.safe}>
        <PlacementScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "grammar")
    return (
      <SafeAreaView style={styles.safe}>
        <GrammarScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "stories")
    return (
      <SafeAreaView style={styles.safe}>
        <StoriesScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "game")
    return (
      <SafeAreaView style={styles.safe}>
        <WordGameScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "plan")
    return (
      <SafeAreaView style={styles.safe}>
        <PlanScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "lesson", lesson })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              setTab("review");
            } else setOverlay({ type });
          }}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "vocabulary")
    return (
      <SafeAreaView style={styles.safe}>
        <VocabularyScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "exam")
    return (
      <SafeAreaView style={styles.safe}>
        <WeeklyExamScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "rewards")
    return (
      <SafeAreaView style={styles.safe}>
        <RewardsScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "activity")
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "pronunciation")
    return (
      <SafeAreaView style={styles.safe}>
        <PronunciationScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "backup")
    return (
      <SafeAreaView style={styles.safe}>
        <BackupScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "settings")
    return (
      <SafeAreaView style={styles.safe}>
        <SettingsScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "commonMistakes")
    return (
      <SafeAreaView style={styles.safe}>
        <CommonMistakesScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "packs")
    return (
      <SafeAreaView style={styles.safe}>
        <PacksScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "shadowing")
    return (
      <SafeAreaView style={styles.safe}>
        <ShadowingScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "tenses")
    return (
      <SafeAreaView style={styles.safe}>
        <TensesScreen
          onClose={() => setOverlay(null)}
          onChallenge={() => setOverlay({ type: "tenseChallenge" })}
          onWeak={() => setOverlay({ type: "weakTenses" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "levels")
    return (
      <SafeAreaView style={styles.safe}>
        <LevelMapScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "irregular")
    return (
      <SafeAreaView style={styles.safe}>
        <IrregularVerbsScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "grammarAcademy")
    return (
      <SafeAreaView style={styles.safe}>
        <GrammarAcademyScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "tenseChallenge")
    return (
      <SafeAreaView style={styles.safe}>
        <TenseChallengeScreen onClose={() => setOverlay({ type: "tenses" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "weakTenses")
    return (
      <SafeAreaView style={styles.safe}>
        <TenseChallengeScreen
          mode="weak"
          onClose={() => setOverlay({ type: "tenses" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "learningHub")
    return (
      <SafeAreaView style={styles.safe}>
        <LearningHubScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "lesson", lesson })}
          onNavigate={(type) => setOverlay({ type })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "analytics")
    return (
      <SafeAreaView style={styles.safe}>
        <LearningAnalyticsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "sentenceBuilder")
    return (
      <SafeAreaView style={styles.safe}>
        <SentenceBuilderScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "c1Exam")
    return (
      <SafeAreaView style={styles.safe}>
        <C1ExamScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "adaptive")
    return (
      <SafeAreaView style={styles.safe}>
        <AdaptiveLessonScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "reviewCalendar")
    return (
      <SafeAreaView style={styles.safe}>
        <ReviewCalendarScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "dailyChallenge")
    return (
      <SafeAreaView style={styles.safe}>
        <DailyChallengeScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "achievements")
    return (
      <SafeAreaView style={styles.safe}>
        <AchievementsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "skills")
    return (
      <SafeAreaView style={styles.safe}>
        <SkillsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "missions")
    return (
      <SafeAreaView style={styles.safe}>
        <MissionsScreen onClose={() => setOverlay(null)} />
      </SafeAreaView>
    );
  if (overlay?.type === "lexicon")
    return (
      <SafeAreaView style={styles.safe}>
        <LexiconScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "listeningLab")
    return (
      <SafeAreaView style={styles.safe}>
        <ListeningLabScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "writingStudio")
    return (
      <SafeAreaView style={styles.safe}>
        <WritingStudioScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "levelExams")
    return (
      <SafeAreaView style={styles.safe}>
        <LevelExamsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "minimalPairs")
    return (
      <SafeAreaView style={styles.safe}>
        <MinimalPairsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "spacedRepetition")
    return (
      <SafeAreaView style={styles.safe}>
        <SpacedRepetitionScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "branchingDialogues")
    return (
      <SafeAreaView style={styles.safe}>
        <BranchingDialoguesScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "ielts")
    return (
      <SafeAreaView style={styles.safe}>
        <IeltsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "smartCoach")
    return (
      <SafeAreaView style={styles.safe}>
        <SmartCoachScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "workEnglish")
    return (
      <SafeAreaView style={styles.safe}>
        <WorkEnglishScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "readingLab")
    return (
      <SafeAreaView style={styles.safe}>
        <ReadingLabScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "storyGame")
    return (
      <SafeAreaView style={styles.safe}>
        <StoryGameScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "marathons")
    return (
      <SafeAreaView style={styles.safe}>
        <MarathonsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </SafeAreaView>
    );
  if (overlay?.type === "dailyMixedExam")
    return (
      <SafeAreaView style={styles.safe}>
        <DailyMixedExamScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "knowledgeMap")
    return (
      <SafeAreaView style={styles.safe}>
        <KnowledgeMapScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "writtenVocabulary")
    return (
      <SafeAreaView style={styles.safe}>
        <WrittenVocabularyScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "careerCourses")
    return (
      <SafeAreaView style={styles.safe}>
        <CareerCoursesScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "storySeasonTwo")
    return (
      <SafeAreaView style={styles.safe}>
        <StorySeasonTwoScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "fullIeltsMock")
    return (
      <SafeAreaView style={styles.safe}>
        <FullIeltsMockScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </SafeAreaView>
    );
  const openLesson = (lesson) => setOverlay({ type: "lesson", lesson });
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.body}>
        {tab === "home" && (
          <HomeScreen
            onLesson={openLesson}
            onReview={() => setTab("review")}
            onPhrases={() => setOverlay({ type: "phrases" })}
            onDictation={() => setOverlay({ type: "dictation" })}
            onDialogues={() => setOverlay({ type: "dialogues" })}
            onMistakes={() => setOverlay({ type: "mistakes" })}
            onPlacement={() => setOverlay({ type: "placement" })}
            onGrammar={() => setOverlay({ type: "grammar" })}
            onStories={() => setOverlay({ type: "stories" })}
            onGame={() => setOverlay({ type: "game" })}
            onPlan={() => setOverlay({ type: "plan" })}
            onVocabulary={() => setOverlay({ type: "vocabulary" })}
            onExam={() => setOverlay({ type: "exam" })}
            onRewards={() => setOverlay({ type: "rewards" })}
            onActivity={() => setOverlay({ type: "activity" })}
            onPronunciation={() => setOverlay({ type: "pronunciation" })}
            onBackup={() => setOverlay({ type: "backup" })}
            onCommonMistakes={() => setOverlay({ type: "commonMistakes" })}
            onPacks={() => setOverlay({ type: "packs" })}
            onShadowing={() => setOverlay({ type: "shadowing" })}
            onTenses={() => setOverlay({ type: "tenses" })}
            onLevels={() => setOverlay({ type: "levels" })}
            onIrregular={() => setOverlay({ type: "irregular" })}
            onGrammarAcademy={() => setOverlay({ type: "grammarAcademy" })}
            onLearningHub={() => setOverlay({ type: "learningHub" })}
            onAdaptive={() => setOverlay({ type: "adaptive" })}
            onDailyChallenge={() => setOverlay({ type: "dailyChallenge" })}
            onMissions={() => setOverlay({ type: "missions" })}
            onSearch={() => setOverlay({ type: "smartSearch" })}
            onBookmarks={() => setOverlay({ type: "bookmarks" })}
            onLingoWorld={() => setOverlay({ type: "lingoWorld" })}
            recentScreens={recentScreens}
            onRecent={(item) => {
              if (item.overlay) setOverlay(hydrateOverlay(item.overlay));
              else {
                setOverlay(null);
                setTab(item.tab || "home");
              }
            }}
          />
        )}
        {tab === "course" && (
          <CourseScreen
            onLesson={openLesson}
            onCheckpoint={(level) =>
              setOverlay({ type: "courseCheckpoint", level })
            }
          />
        )}
        {tab === "review" && <ReviewScreen />}
        {tab === "ai" && (
          <React.Suspense fallback={<LoadingScreen />}>
            <AITutorScreen onImmersiveChange={setAiImmersive} onNavigate={({ type, target }) => {
              setAiImmersive(false);
              if (type === "tab") {
                setOverlay(null);
                setTab(target);
              } else {
                setOverlay({ type: target });
              }
            }} />
          </React.Suspense>
        )}
        {tab === "profile" && (
          <ProfileScreen
            onSettings={() => setOverlay({ type: "settings" })}
            onVocabulary={() => setOverlay({ type: "vocabulary" })}
            onBackup={() => setOverlay({ type: "backup" })}
            onLevels={() => setOverlay({ type: "levelProgress" })}
            onStreak={() => setOverlay({ type: "streakCalendar" })}
            onAccount={() => setOverlay({ type: "account" })}
          />
        )}
      </View>
      {!aiImmersive && <TabBar tab={tab} setTab={setTab} />}
    </SafeAreaView>
  );
}

const tabs = [
  ["home", "sparkles", "Сегодня"],
  ["course", "map", "Курс"],
  ["ai", "chatbubbles", "ИИ"],
  ["review", "library", "Слова"],
  ["profile", "person-circle", "Профиль"],
];
function TabBar({ tab, setTab }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboardVisible) return null;
  return (
    <View style={styles.tabs}>
      {tabs.map(([id, icon, label]) => {
        const active = id === tab;
        return (
          <Pressable key={id} onPress={() => setTab(id)} style={styles.tab}>
            <Ionicons
              name={active ? icon : `${icon}-outline`}
              size={24}
              color={active ? colors.purple : colors.textMuted}
            />
            <Text style={[styles.tabText, active && { color: colors.purple }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  tabs: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22,25,39,0.97)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 5,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
});
