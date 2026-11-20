import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackHandler, Keyboard, Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ProgressProvider, useProgressSelector, useProgressActions } from "./src/store/ProgressContext";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { AccessProvider, useAccess } from "./src/store/AccessContext";
import { CloudSyncProvider, useCloudBootstrap } from "./src/store/CloudSyncContext";
import CloudConflictGate from './src/components/CloudConflictGate';
import { LoadingScreen } from "./src/components/UI";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";

import { mainTabs, navigationTarget, practiceAlias } from './src/utils/appNavigation';

import AuthScreen from "./src/screens/AuthScreen";

import { colors , useTheme, createThemedStyles , ThemeProvider } from "./src/theme";
import { lessons } from "./src/data/course";
import {markStartup,beginScreenTransition} from './src/utils/performance';
import useLearningNotifications from './src/components/useLearningNotifications';

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
const AccessScreen = React.lazy(() => import("./src/screens/AccessScreen"));
const AdminScreen = lazyNamed(() => import("./src/screens/AccessScreen"), "AdminScreen");
const ProfileScreen = React.lazy(() => import("./src/screens/ProfileScreen"));
const PhrasebookScreen = React.lazy(() => import("./src/screens/PhrasebookScreen"));
const LessonScreen = React.lazy(() => import("./src/screens/LessonScreen"));
const DictationScreen = React.lazy(() => import("./src/screens/DictationScreen"));
const ContextDialoguesScreen = React.lazy(() => import("./src/screens/ContextDialoguesScreen"));
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

import { ScreenFrame, MotionPressable } from './src/components/Motion';

const NAV_KEY = "@lingospark/navigation-v1";
export default function App() {
  return (
    <ThemeProvider>
    <SafeAreaProvider>
      <ThemeStatusBar />
      <AuthProvider>
        <AccessProvider>
          <ProgressProvider>
            <CloudSyncProvider>
              <React.Suspense fallback={<LoadingScreen />}>
                <CloudConflictGate><AppContent /></CloudConflictGate>
              </React.Suspense>
            </CloudSyncProvider>
          </ProgressProvider>
        </AccessProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}

function ThemeStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function AppContent() {
  const appearance = useTheme();
  const { ready, onboarded, dailyGoal, loadError, progressName } = useProgressSelector(state => ({ ready: state.ready, onboarded: state.progress.onboarded, dailyGoal: state.progress.dailyGoal, loadError: state.loadError, progressName: state.progress.name }));
  const { finishOnboarding, updateName } = useProgressActions();
  const savedReduceMotion = useProgressSelector(state => !!state.progress.settings?.reduceMotion);
  useEffect(() => { if (savedReduceMotion && !appearance.userReduceMotion) appearance.setReduceMotion(true); }, [savedReduceMotion, appearance.userReduceMotion]);
  const progress = { onboarded, dailyGoal };
  const {
    ready: authReady,
    user,
    guestMode,
  } = useAuth();
  const access = useAccess();
  const cloudRestoring = useCloudBootstrap() && !access.offline;
  const [tab, rawSetTab] = useState("home");
  const [overlay, rawSetOverlay] = useState(null);
  const setTab = useCallback(value => { if (value !== tab) beginScreenTransition(value); rawSetTab(value); }, [tab]);
  const setOverlay = useCallback(value => { beginScreenTransition(value?.type); rawSetOverlay(value); }, []);

  const [aiImmersive, setAiImmersive] = useState(false);
  const [worldImmersive, setWorldImmersive] = useState(false);
  const [aiPractice, setAiPractice] = useState(null);
  const [modelNotice, setModelNotice] = useState(null);
  useEffect(() => { if (tab !== 'ai') setModelNotice(null); }, [tab]);
  const [navigationReady, setNavigationReady] = useState(false);
  useEffect(()=>{if(ready&&authReady&&navigationReady&&(!user||!cloudRestoring))markStartup();},[ready,authReady,navigationReady,user,cloudRestoring]);
  const accountName = user?.user_metadata?.display_name?.trim() || "";
  useEffect(() => {
    if (!ready || loadError || !user || cloudRestoring || !accountName) return;
    if (!progress.onboarded) finishOnboarding(accountName, progress.dailyGoal || 30);
    else if (progressName !== accountName) updateName(accountName);
  }, [ready, user?.id, cloudRestoring, progress.onboarded, progress.dailyGoal, progressName, accountName, loadError, finishOnboarding, updateName]);

  useEffect(() => { AsyncStorage.removeItem(NAV_KEY).catch(() => {}).finally(() => setNavigationReady(true)); }, []);

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
  const openStudyTarget = (target, noticeKey) => {
    if (target.type === 'learn') { navigate('learn'); return; }
    if (target.type === 'lesson') {
      const lesson = lessons.find(item => item.id === target.id);
      if (lesson) setOverlay({ type: 'lesson', lesson, noticeKey });
      return;
    }
    setOverlay({ type: target.type, topicId: target.id, stageId: target.stageId, noticeKey, shortReview: target.type === 'unifiedReview' });
  };
  const notificationsReady = ready && navigationReady && authReady && !cloudRestoring;
  useLearningNotifications({
    ready: notificationsReady,
    active: notificationsReady && !loadError && onboarded && access.allowed,
    onOpen: notice => {
      setAiImmersive(false);
      setWorldImmersive(false);
      if (notice.kind === 'model') {
        setAiPractice(null);
        setModelNotice(notice);
        setOverlay(null);
        setTab('ai');
      } else {
        setTab('home');
        openStudyTarget(notice.kind === 'review' ? { type: 'unifiedReview' } : notice.target, notice.key);
      }
    },
  });
  if (!ready || !navigationReady || !authReady) return <LoadingScreen />;
  if (!user && !guestMode) return <AuthScreen />;
  if (!access.allowed) return <ScreenFrame transitionKey="access" style={styles.safe}>
    {overlay?.type === "account"
      ? <AuthScreen optional onClose={() => setOverlay(null)} />
      : <AccessScreen key={user?.id || "guest"} onAccount={() => setOverlay({ type: "account" })} />}
  </ScreenFrame>;
  if (overlay?.type === "access") return <ScreenFrame transitionKey="access" style={styles.safe}>
    <AccessScreen onClose={() => setOverlay(null)} />
  </ScreenFrame>;
  if (overlay?.type === "admin") return <ScreenFrame transitionKey="admin" style={styles.safe}>
    <AdminScreen onClose={() => setOverlay(null)} />
  </ScreenFrame>;
  if (loadError && !cloudRestoring) return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><RecoveryScreen error={loadError} /></ScreenFrame>;
  if (user && (cloudRestoring || (!progress.onboarded && accountName)))
    return <LoadingScreen />;
  if (!progress.onboarded) return <OnboardingScreen />;
  if (practiceAlias(overlay?.type)) return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><PracticeScreen key={overlay.noticeKey || overlay.type} {...practiceAlias(overlay.type)} autoStartReview={!!overlay.shortReview} reviewLimit={overlay.shortReview ? 5 : undefined} onClose={() => setOverlay(null)} onRetention={() => setOverlay({ type: 'retention' })} /></ScreenFrame>;
  if (overlay?.type === "account")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <AuthScreen optional onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "levelProgress")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LevelProgressScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "streakCalendar")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <StreakCalendarScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "smartSearch")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
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
      </ScreenFrame>
    );
  if (overlay?.type === "bookmarks" || overlay?.type === "favorites")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
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
      </ScreenFrame>
    );
  if (overlay?.type === 'course')
    return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><CourseScreen initialLevel={overlay.level} onClose={() => setOverlay(null)} onLesson={lesson => setOverlay({ type: 'journey', topicId: lesson.id })} onCheckpoint={level => setOverlay({ type: 'courseCheckpoint', level })} /></ScreenFrame>;
  if (overlay?.type === 'review')
    return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><View style={styles.overlayBack}><Pressable onPress={() => setOverlay(null)} style={styles.backButton}><Text style={styles.backText}>← Обучение</Text></Pressable><Pressable onPress={() => setOverlay({ type: 'vocabulary' })} style={styles.backButton}><Text style={styles.backText}>Словарь →</Text></Pressable></View><ReviewScreen /></ScreenFrame>;
  if (overlay?.type === 'courseTest') return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><CourseTestScreen topicId={overlay.topicId} onClose={() => setOverlay({ type: 'journey', topicId: overlay.topicId })} /></ScreenFrame>;
  if (overlay?.type === 'quickSession') return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><QuickSessionScreen key={overlay.noticeKey} onClose={() => setOverlay(null)} onJourney={topicId => setOverlay({ type: 'journey', topicId })} onRetention={() => setOverlay({ type: 'retention' })} onAI={practice => { setAiPractice({ ...practice, requestId: Date.now() }); navigate('ai'); }} /></ScreenFrame>;
  if (overlay?.type === 'journey')
    return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><LearningJourneyScreen key={overlay.noticeKey} initialStageId={overlay.stageId} topicId={overlay.topicId || 'greetings'} onClose={() => setOverlay(null)} onTest={topicId => setOverlay({ type: 'courseTest', topicId })} onCourse={topicId => setOverlay({ type: 'lesson', lesson: lessons.find(item => item.id === topicId), returnTo: 'journey' })} onRetention={() => setOverlay({ type: 'retention' })} onWorld={() => navigate('world')} onContextDialogue={sceneId => setOverlay({ type: 'contextDialogues', sceneId, topicId: overlay.topicId })} onAI={practice => { setAiPractice({ ...practice, requestId: Date.now() }); navigate('ai'); }} /></ScreenFrame>;
  if (overlay?.type === "lingoWorld")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LingoWorldScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "lesson")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LessonScreen
          key={overlay.noticeKey}
          lesson={overlay.lesson}
          onClose={() => setOverlay(overlay.returnTo ? { type: overlay.returnTo, topicId: overlay.lesson.id } : null)}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "courseCheckpoint")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LevelCheckpointScreen
          level={overlay.level}
          onClose={() => setOverlay(null)}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "notebook")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <NotebookScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "articlesPrepositions")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ArticlesPrepositionsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "skillSprint")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SkillSprintScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "phrases")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <PhrasebookScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "dictation")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <DictationScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === 'contextDialogues') return <ScreenFrame transitionKey={overlay.type} style={styles.safe}>
    <ContextDialoguesScreen initialSceneId={overlay.sceneId} onClose={() => setOverlay(overlay.topicId ? { type: 'journey', topicId: overlay.topicId } : null)} />
  </ScreenFrame>;
  if (overlay?.type === "dialogues")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <DialogueScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "mistakes")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <MistakesScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "placement")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <PlacementScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "grammar")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <GrammarScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "stories")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <StoriesScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "game")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <WordGameScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "plan")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
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
      </ScreenFrame>
    );
  if (overlay?.type === "vocabulary")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <VocabularyScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "exam")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <WeeklyExamScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "rewards")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <RewardsScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "activity")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ActivityScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "pronunciation")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <PronunciationScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "backup")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <BackupScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "settings")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SettingsScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "diagnostics")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <DiagnosticsScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "commonMistakes")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <CommonMistakesScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "packs")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <PacksScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "shadowing")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ShadowingScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "tenses")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <TensesScreen
          onClose={() => setOverlay(null)}
          onChallenge={() => setOverlay({ type: "tenseChallenge" })}
          onWeak={() => setOverlay({ type: "weakTenses" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "levels")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LevelMapScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "irregular")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <IrregularVerbsScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "grammarAcademy")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <GrammarAcademyScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "tenseChallenge")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <TenseChallengeScreen onClose={() => setOverlay({ type: "tenses" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "weakTenses")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <TenseChallengeScreen
          mode="weak"
          onClose={() => setOverlay({ type: "tenses" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "learningHub")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LearningHubScreen
          onClose={() => setOverlay(null)}
          onLesson={(lesson) => setOverlay({ type: "journey", topicId: lesson.id })}
          onNavigate={navigate}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "grammarCenter")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <GrammarCenterScreen
          onClose={() => setOverlay({ type: "learningHub" })}
          onNavigate={(type) => setOverlay({ type })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "examCenter")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ExamCenterScreen
          onClose={() => setOverlay({ type: "learningHub" })}
          onNavigate={(type) => setOverlay({ type })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "analytics")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LearningAnalyticsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "sentenceBuilder")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SentenceBuilderScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "c1Exam")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <C1ExamScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "retention")
    return <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}><RetentionScreen onClose={() => setOverlay(null)} /></ScreenFrame>;
  if (overlay?.type === "adaptive")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <AdaptiveLessonScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "reviewCalendar")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ReviewCalendarScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "dailyChallenge")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <DailyChallengeScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "achievements")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <AchievementsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "skills")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SkillsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "missions")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <MissionsScreen onClose={() => setOverlay(null)} />
      </ScreenFrame>
    );
  if (overlay?.type === "lexicon")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LexiconScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "listeningLab")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ListeningLabScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "writingStudio")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <WritingStudioScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "levelExams")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <LevelExamsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "minimalPairs")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <MinimalPairsScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "spacedRepetition")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SpacedRepetitionScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "branchingDialogues")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <BranchingDialoguesScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "ielts")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <IeltsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "smartCoach")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SmartCoachScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "workEnglish")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <WorkEnglishScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "readingLab")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <ReadingLabScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "storyGame")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <StoryGameScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "marathons")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <MarathonsScreen onClose={() => setOverlay({ type: "learningHub" })} />
      </ScreenFrame>
    );
  if (overlay?.type === "dailyMixedExam")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <DailyMixedExamScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "knowledgeMap")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <SkillEvidenceScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "writtenVocabulary")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <WrittenVocabularyScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "careerCourses")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <CareerCoursesScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "storySeasonTwo")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <StorySeasonTwoScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  if (overlay?.type === "fullIeltsMock")
    return (
      <ScreenFrame transitionKey={overlay?.type || tab} style={styles.safe}>
        <FullIeltsMockScreen
          onClose={() => setOverlay({ type: "learningHub" })}
        />
      </ScreenFrame>
    );
  const openLesson = (lesson) => setOverlay({ type: "lesson", lesson });
  return (
    <ScreenFrame transitionKey={overlay?.type || tab} edges={["top"]} style={styles.safe}>
      <View style={styles.body}>
        {tab === "home" && (
          <HomeScreen
            onRetention={() => setOverlay({ type: "unifiedReview" })}
            onLesson={openLesson}
            onReview={() => navigate('review')}
            onJourney={(topicId = 'greetings') => setOverlay({ type: 'journey', topicId })}
            onAccount={() => setOverlay({ type: 'account' })}
            onSyncDetails={() => setOverlay({ type: 'diagnostics' })}
            onStartStudy={openStudyTarget}
            onQuickSession={() => setOverlay({ type: 'quickSession' })}
            onLearning={() => navigate('learn')}
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

          />
        )}
        {tab === 'learn' && <LearningHomeScreen onNavigate={navigate} onJourney={(topicId = 'greetings') => setOverlay({ type: 'journey', topicId })} onCourse={level => setOverlay({ type: 'course', level })} />}
        {tab === 'world' && <LingoWorldScreen onClose={() => setTab('home')} onImmersiveChange={setWorldImmersive} />}
        {tab === "ai" && (
          <React.Suspense fallback={<LoadingScreen />}>
            <AITutorScreen modelNotice={modelNotice} onModelNoticeConsumed={() => setModelNotice(null)} practice={aiPractice} onPracticeConsumed={() => setAiPractice(null)} onImmersiveChange={setAiImmersive} onNavigate={({ type, target }) => {
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
            onAccount={() => setOverlay({ type: user ? "settings" : "account" })}
            onDiagnostics={() => setOverlay({ type: "diagnostics" })}
            onAccess={() => setOverlay({ type: "access" })}
            onAdmin={access.isAdmin ? () => setOverlay({ type: "admin" }) : undefined}
          />
        )}
      </View>
      {!aiImmersive && !(tab === 'world' && worldImmersive) && <TabBar tab={tab} setTab={setTab} />}
    </ScreenFrame>
  );
}

const tabs = mainTabs;
function TabBar({ tab, setTab }) {
  useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false));
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
      shown.remove();
      hidden.remove();
    };
  }, []);
  if (keyboardVisible) return null;
  return (
    <View style={styles.tabs}>
      {tabs.map(([id, icon, label]) => {
        const active = id === tab;
        return (
          <MotionPressable containerStyle={{ flex: 1 }} accessibilityRole="tab" accessibilityLabel={id === 'world' ? 'Английская жизнь' : label} accessibilityState={{ selected: active }} key={id} onPress={() => setTab(id)} style={[styles.tab, active && { backgroundColor: colors.accentSoft }]}>
            <Ionicons
              name={active ? icon : `${icon}-outline`}
              size={24}
              color={active ? colors.purple : colors.textMuted}
            />
            <Text style={[styles.tabText, active && { color: colors.purple }]}>
              {label}
            </Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}
const styles = createThemedStyles(() => ({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  overlayBack: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backButton: { minHeight: 48, justifyContent: 'center' },
  backText: { color: colors.purple, fontSize: 17, fontWeight: '700' },
  tabs: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 0,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: { minHeight: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 4 },
  tabText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
}));
