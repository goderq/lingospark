import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackHandler, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ProgressProvider, useProgressSelector, useProgressActions } from "./src/store/ProgressContext";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { CloudSyncProvider, useCloudBootstrap } from "./src/store/CloudSyncContext";
import CloudConflictGate from './src/components/CloudConflictGate';
import { LoadingScreen } from "./src/components/UI";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";

import { mainTabs, navigationTarget, practiceAlias } from './src/utils/appNavigation';

import AuthScreen from "./src/screens/AuthScreen";

import { colors } from "./src/theme";
import { lessons } from "./src/data/course";
import {markStartup,beginScreenTransition} from './src/utils/performance';

const CourseScreen = React.lazy(() => import("./src/screens/CourseScreen"));
const AITutorScreen = React.lazy(() => import("./src/screens/AITutorScreen"));
const ReviewScreen = React.lazy(() => import("./src/screens/ReviewScreen"));
const DiagnosticsScreen = React.lazy(() => import("./src/screens/DiagnosticsScreen"));
const lazyNamed = (loader, name) =>
  React.lazy(() => loader().then((module) => ({ default: module[name] })));
const advancedScreens = () => import("./src/screens/AdvancedScreens");
const smartLearningScreens = () => import("./src/screens/SmartLearningScreens");
const ActivityScreen = lazyNamed(advancedScreens, "ActivityScreen");
const PlanScreen = lazyNamed(advancedScreens, "PlanScreen");
const PronunciationScreen = lazyNamed(advancedScreens, "PronunciationScreen");
const RewardsScreen = lazyNamed(advancedScreens, "RewardsScreen");
const VocabularyScreen = lazyNamed(advancedScreens, "VocabularyScreen");
const WeeklyExamScreen = lazyNamed(advancedScreens, "WeeklyExamScreen");
const BookmarksScreen = lazyNamed(smartLearningScreens, "BookmarksScreen");
const SmartSearchScreen = lazyNamed(smartLearningScreens, "SmartSearchScreen");

const RetentionScreen = React.lazy(() => import("./src/screens/RetentionScreen"));
const LearningHomeScreen = React.lazy(() => import("./src/screens/LearningHomeScreen"));
const LearningJourneyScreen = React.lazy(() => import("./src/screens/LearningJourneyScreen"));
const SkillEvidenceScreen = React.lazy(() => import("./src/screens/SkillEvidenceScreen"));
const LevelCheckpointScreen = React.lazy(() => import("./src/screens/LevelCheckpointScreen"));
const NotebookScreen = lazyNamed(() => import("./src/screens/StudyToolsScreens"), "NotebookScreen");
const ArticlesPrepositionsScreen = lazyNamed(() => import("./src/screens/StudyToolsScreens"), "ArticlesPrepositionsScreen");
const ProfileScreen = React.lazy(() => import("./src/screens/ProfileScreen"));
const PhrasebookScreen = React.lazy(() => import("./src/screens/PhrasebookScreen"));
const LessonScreen = React.lazy(() => import("./src/screens/LessonScreen"));
const DictationScreen = React.lazy(() => import("./src/screens/DictationScreen"));
const DialogueScreen = React.lazy(() => import("./src/screens/DialogueScreen"));
const MistakesScreen = React.lazy(() => import("./src/screens/MistakesScreen"));
const PlacementScreen = React.lazy(() => import("./src/screens/PlacementScreen"));
const GrammarScreen = React.lazy(() => import("./src/screens/GrammarScreen"));
const StoriesScreen = React.lazy(() => import("./src/screens/StoriesScreen"));
const WordGameScreen = React.lazy(() => import("./src/screens/WordGameScreen"));
const BackupScreen = lazyNamed(() => import("./src/screens/ExpansionScreens"), "BackupScreen");
const CommonMistakesScreen = lazyNamed(() => import("./src/screens/ExpansionScreens"), "CommonMistakesScreen");
const PacksScreen = lazyNamed(() => import("./src/screens/ExpansionScreens"), "PacksScreen");
const SettingsScreen = lazyNamed(() => import("./src/screens/ExpansionScreens"), "SettingsScreen");
const ShadowingScreen = lazyNamed(() => import("./src/screens/ExpansionScreens"), "ShadowingScreen");
const TensesScreen = React.lazy(() => import("./src/screens/TensesScreen"));
const IrregularVerbsScreen = lazyNamed(() => import("./src/screens/MasteryScreens"), "IrregularVerbsScreen");
const LevelMapScreen = lazyNamed(() => import("./src/screens/MasteryScreens"), "LevelMapScreen");
const GrammarAcademyScreen = React.lazy(() => import("./src/screens/GrammarAcademyScreen"));
const TenseChallengeScreen = React.lazy(() => import("./src/screens/TenseChallengeScreen"));
const LearningHubScreen = React.lazy(() => import("./src/screens/LearningHubScreen"));
const LearningAnalyticsScreen = lazyNamed(() => import("./src/screens/LearningHubScreen"), "LearningAnalyticsScreen");
const ExamCenterScreen = lazyNamed(() => import("./src/screens/LearningCentersScreen"), "ExamCenterScreen");
const GrammarCenterScreen = lazyNamed(() => import("./src/screens/LearningCentersScreen"), "GrammarCenterScreen");
const SentenceBuilderScreen = React.lazy(() => import("./src/screens/SentenceBuilderScreen"));
const C1ExamScreen = React.lazy(() => import("./src/screens/C1ExamScreen"));
const SkillSprintScreen = React.lazy(() => import("./src/screens/SkillSprintScreen"));
const LevelProgressScreen = lazyNamed(() => import("./src/screens/InterfaceExpansionScreens"), "LevelProgressScreen");
const StreakCalendarScreen = lazyNamed(() => import("./src/screens/InterfaceExpansionScreens"), "StreakCalendarScreen");
const LingoWorldScreen = React.lazy(() => import("./src/screens/LingoWorldScreen"));
const AdaptiveLessonScreen = lazyNamed(() => import("./src/screens/AdaptiveScreens"), "AdaptiveLessonScreen");
const ReviewCalendarScreen = lazyNamed(() => import("./src/screens/AdaptiveScreens"), "ReviewCalendarScreen");
const AchievementsScreen = lazyNamed(() => import("./src/screens/EngagementScreens"), "AchievementsScreen");
const DailyChallengeScreen = lazyNamed(() => import("./src/screens/EngagementScreens"), "DailyChallengeScreen");
const SkillsScreen = lazyNamed(() => import("./src/screens/EngagementScreens"), "SkillsScreen");
const MissionsScreen = React.lazy(() => import("./src/screens/MissionsScreen"));
const LexiconScreen = lazyNamed(() => import("./src/screens/MegaPracticeScreens"), "LexiconScreen");
const ListeningLabScreen = lazyNamed(() => import("./src/screens/MegaPracticeScreens"), "ListeningLabScreen");
const WritingStudioScreen = lazyNamed(() => import("./src/screens/MegaPracticeScreens"), "WritingStudioScreen");
const LevelExamsScreen = lazyNamed(() => import("./src/screens/MegaPracticeScreens"), "LevelExamsScreen");
const MinimalPairsScreen = lazyNamed(() => import("./src/screens/MegaPracticeScreens"), "MinimalPairsScreen");
const SpacedRepetitionScreen = lazyNamed(() => import("./src/screens/DeepLearningScreens"), "SpacedRepetitionScreen");
const BranchingDialoguesScreen = lazyNamed(() => import("./src/screens/DeepLearningScreens"), "BranchingDialoguesScreen");
const IeltsScreen = lazyNamed(() => import("./src/screens/DeepLearningScreens"), "IeltsScreen");
const SmartCoachScreen = lazyNamed(() => import("./src/screens/DeepLearningScreens"), "SmartCoachScreen");
const WorkEnglishScreen = lazyNamed(() => import("./src/screens/GrowthScreens"), "WorkEnglishScreen");
const ReadingLabScreen = lazyNamed(() => import("./src/screens/GrowthScreens"), "ReadingLabScreen");
const StoryGameScreen = lazyNamed(() => import("./src/screens/GrowthScreens"), "StoryGameScreen");
const MarathonsScreen = lazyNamed(() => import("./src/screens/GrowthScreens"), "MarathonsScreen");
const DailyMixedExamScreen = lazyNamed(() => import("./src/screens/ProgressionScreens"), "DailyMixedExamScreen");
const WrittenVocabularyScreen = lazyNamed(() => import("./src/screens/PremiumScreens"), "WrittenVocabularyScreen");
const CareerCoursesScreen = lazyNamed(() => import("./src/screens/PremiumScreens"), "CareerCoursesScreen");
const StorySeasonTwoScreen = lazyNamed(() => import("./src/screens/PremiumScreens"), "StorySeasonTwoScreen");
const FullIeltsMockScreen = lazyNamed(() => import("./src/screens/PremiumScreens"), "FullIeltsMockScreen");

const RecoveryScreen = React.lazy(() => import("./src/screens/RecoveryScreen"));
const CourseTestScreen = React.lazy(() => import("./src/screens/CourseTestScreen"));
const QuickSessionScreen = React.lazy(() => import("./src/screens/QuickSessionScreen"));
const PracticeScreen = React.lazy(() => import("./src/screens/PracticeScreen"));

const NAV_KEY = "@lingospark/navigation-v1";
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <ProgressProvider>
          <CloudSyncProvider>
            <React.Suspense fallback={<LoadingScreen />}>
              <CloudConflictGate><AppContent /></CloudConflictGate>
            </React.Suspense>
          </CloudSyncProvider>
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { ready, onboarded, dailyGoal, loadError } = useProgressSelector(state => ({ ready: state.ready, onboarded: state.progress.onboarded, dailyGoal: state.progress.dailyGoal, loadError: state.loadError }));
  const { finishOnboarding } = useProgressActions();
  const progress = { onboarded, dailyGoal };
  const {
    ready: authReady,
    user,
    guestMode,
  } = useAuth();
  const cloudRestoring = useCloudBootstrap();
  const [tab, rawSetTab] = useState("home");
  const [overlay, rawSetOverlay] = useState(null);
  const setTab = useCallback(value => { if (value !== tab) beginScreenTransition(value); rawSetTab(value); }, [tab]);
  const setOverlay = useCallback(value => { beginScreenTransition(value?.type); rawSetOverlay(value); }, []);
  const [recentScreens, setRecentScreens] = useState([]);
  const [aiImmersive, setAiImmersive] = useState(false);
  const [worldImmersive, setWorldImmersive] = useState(false);
  const [aiPractice, setAiPractice] = useState(null);
  const [navigationReady, setNavigationReady] = useState(false);
  useEffect(()=>{if(ready&&authReady&&navigationReady&&(!user||!cloudRestoring))markStartup();},[ready,authReady,navigationReady,user,cloudRestoring]);
  const accountName = user?.user_metadata?.display_name?.trim() || "";
  useEffect(() => {
    if (!loadError && user && !cloudRestoring && !progress.onboarded && accountName) {
      finishOnboarding(accountName, progress.dailyGoal || 30);
    }
  }, [user?.id, cloudRestoring, progress.onboarded, accountName, loadError]);
  const serializeOverlay = (value) =>
    value
      ? value.type === "lesson"
        ? { type: "lesson", lessonId: value.lesson.id, returnTo: value.returnTo }
        : { type: value.type, level: value.level, topicId: value.topicId }
      : null;
  const hydrateOverlay = (value) => {
    if (!value) return null;
    if (value.type === "lesson") {
      const lesson = lessons.find((item) => item.id === value.lessonId);
      return lesson ? { type: "lesson", lesson, returnTo: value.returnTo } : null;
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
      ? `${serialized.type}-${serialized.lessonId || serialized.topicId || serialized.level || ""}`
      : `tab-${tab}`;
    if (key === "tab-home") return;
    const labels = {
      course: "Курс",
      learn: 'Обучение',
      world: 'Английская жизнь',
      journey: 'Учебная тема',
      quickSession: 'Занятие на 10 минут',
      ai: "ИИ-преподаватель",
      review: "Слова",
      profile: "Профиль",
      learningHub: "Каталог",
      grammarCenter: "Центр грамматики",
      examCenter: "Центр экзаменов",
      settings: "Настройки",
      diagnostics: "Диагностика",
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
      ['journey', 'courseTest'].includes(serialized?.type) ? lessons.find(item => item.id === serialized.topicId)?.title || 'Учебная тема' :
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
  const navigate = target => {
    const destination = navigationTarget(target);
    setAiImmersive(false);
    if (destination.tab) setTab(destination.tab);
    setOverlay(destination.overlay);
  };
  if (!ready || !navigationReady || !authReady) return <LoadingScreen />;
  if (!user && !guestMode) return <AuthScreen />;
  if (loadError && !cloudRestoring) return <SafeAreaView style={styles.safe}><RecoveryScreen error={loadError} /></SafeAreaView>;
  if (user && (cloudRestoring || (!progress.onboarded && accountName)))
    return <LoadingScreen />;
  if (!progress.onboarded) return <OnboardingScreen />;
  if (practiceAlias(overlay?.type)) return <SafeAreaView style={styles.safe}><PracticeScreen key={overlay.type} {...practiceAlias(overlay.type)} onClose={() => setOverlay(null)} onRetention={() => setOverlay({ type: 'retention' })} /></SafeAreaView>;
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
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
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
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              navigate('review');
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
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              navigate('review');
            } else setOverlay({ type });
          }}
        />
      </SafeAreaView>
    );
  if (overlay?.type === 'course')
    return <SafeAreaView style={styles.safe}><CourseScreen initialLevel={overlay.level} onClose={() => setOverlay(null)} onLesson={lesson => setOverlay({ type: 'journey', topicId: lesson.id })} onCheckpoint={level => setOverlay({ type: 'courseCheckpoint', level })} /></SafeAreaView>;
  if (overlay?.type === 'review')
    return <SafeAreaView style={styles.safe}><View style={styles.overlayBack}><Pressable onPress={() => setOverlay(null)} style={styles.backButton}><Text style={styles.backText}>← Обучение</Text></Pressable><Pressable onPress={() => setOverlay({ type: 'vocabulary' })} style={styles.backButton}><Text style={styles.backText}>Словарь →</Text></Pressable></View><ReviewScreen /></SafeAreaView>;
  if (overlay?.type === 'courseTest') return <SafeAreaView style={styles.safe}><CourseTestScreen topicId={overlay.topicId} onClose={() => setOverlay({ type: 'journey', topicId: overlay.topicId })} /></SafeAreaView>;
  if (overlay?.type === 'quickSession') return <SafeAreaView style={styles.safe}><QuickSessionScreen onClose={() => setOverlay(null)} onJourney={topicId => setOverlay({ type: 'journey', topicId })} onRetention={() => setOverlay({ type: 'retention' })} onAI={practice => { setAiPractice({ ...practice, requestId: Date.now() }); navigate('ai'); }} /></SafeAreaView>;
  if (overlay?.type === 'journey')
    return <SafeAreaView style={styles.safe}><LearningJourneyScreen topicId={overlay.topicId || 'greetings'} onClose={() => setOverlay(null)} onTest={topicId => setOverlay({ type: 'courseTest', topicId })} onCourse={topicId => setOverlay({ type: 'lesson', lesson: lessons.find(item => item.id === topicId), returnTo: 'journey' })} onRetention={() => setOverlay({ type: 'retention' })} onWorld={() => navigate('world')} onAI={practice => { setAiPractice({ ...practice, requestId: Date.now() }); navigate('ai'); }} /></SafeAreaView>;
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
          onClose={() => setOverlay(overlay.returnTo ? { type: overlay.returnTo, topicId: overlay.lesson.id } : null)}
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
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
          onNavigate={(type) => {
            if (type === "review") {
              setOverlay(null);
              navigate('review');
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
  if (overlay?.type === "diagnostics")
    return (
      <SafeAreaView style={styles.safe}>
        <DiagnosticsScreen onClose={() => setOverlay(null)} />
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
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
          onNavigate={navigate}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "grammarCenter")
    return (
      <SafeAreaView style={styles.safe}>
        <GrammarCenterScreen
          onClose={() => setOverlay({ type: "learningHub" })}
          onNavigate={(type) => setOverlay({ type })}
        />
      </SafeAreaView>
    );
  if (overlay?.type === "examCenter")
    return (
      <SafeAreaView style={styles.safe}>
        <ExamCenterScreen
          onClose={() => setOverlay({ type: "learningHub" })}
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
  if (overlay?.type === "retention")
    return <SafeAreaView style={styles.safe}><RetentionScreen onClose={() => setOverlay(null)} /></SafeAreaView>;
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
        <SkillEvidenceScreen
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
            onRetention={() => setOverlay({ type: "unifiedReview" })}
            onLesson={openLesson}
            onReview={() => navigate('review')}
            onJourney={(topicId = 'greetings') => setOverlay({ type: 'journey', topicId })}
            onAccount={() => setOverlay({ type: 'account' })}
            onSyncDetails={() => setOverlay({ type: 'diagnostics' })}
            onQuickSession={() => setOverlay({ type: 'quickSession' })}
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
            onLearningHub={() => navigate('learn')}
            onAdaptive={() => setOverlay({ type: "adaptive" })}
            onDailyChallenge={() => setOverlay({ type: "dailyChallenge" })}
            onMissions={() => setOverlay({ type: "missions" })}
            onSearch={() => setOverlay({ type: "smartSearch" })}
            onBookmarks={() => setOverlay({ type: "bookmarks" })}
            onLingoWorld={() => navigate('world')}
            recentScreens={recentScreens}
            onRecent={(item) => {
              if (item.overlay) setOverlay(hydrateOverlay(item.overlay));
              else {
                setOverlay(null);
                navigate(item.tab || 'home');
              }
            }}
          />
        )}
        {tab === 'learn' && <LearningHomeScreen onNavigate={navigate} onJourney={(topicId = 'greetings') => setOverlay({ type: 'journey', topicId })} onCourse={level => setOverlay({ type: 'course', level })} />}
        {tab === 'world' && <LingoWorldScreen onClose={() => setTab('home')} onImmersiveChange={setWorldImmersive} />}
        {tab === "ai" && (
          <React.Suspense fallback={<LoadingScreen />}>
            <AITutorScreen practice={aiPractice} onPracticeConsumed={() => setAiPractice(null)} onImmersiveChange={setAiImmersive} onNavigate={({ type, target }) => {
              setAiImmersive(false);
              if (type === "tab") {
                setOverlay(null);
                navigate(target);
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
            onDiagnostics={() => setOverlay({ type: "diagnostics" })}
          />
        )}
      </View>
      {!aiImmersive && !(tab === 'world' && worldImmersive) && <TabBar tab={tab} setTab={setTab} />}
    </SafeAreaView>
  );
}

const tabs = mainTabs;
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
          <Pressable accessibilityRole="tab" accessibilityLabel={id === 'world' ? 'Английская жизнь' : label} accessibilityState={{ selected: active }} key={id} onPress={() => setTab(id)} style={styles.tab}>
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
  overlayBack: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backButton: { minHeight: 48, justifyContent: 'center' },
  backText: { color: colors.purple, fontSize: 17, fontWeight: '700' },
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
