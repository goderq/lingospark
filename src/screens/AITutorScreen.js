import { now, recordTiming } from '../utils/performance';
import { evaluateExercise } from '../utils/answer';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { courseTutorContext } from '../utils/learningJourney';
import { courseDialogueEvidence, learnerTurns } from '../utils/conversationCoach';
import { interviewContext, interviewProgress, interviewReview } from '../utils/interview';
import { tutorPracticeFor } from '../utils/tutorPractice';
import ToolSheet from '../components/ToolSheet';
import useKeyboardDock from '../components/useKeyboardDock';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { requestRecordingPermissionsAsync } from "expo-audio";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { colors , useTheme, createThemedStyles } from "../theme";
import { ProgressBar } from "../components/UI";
import { speak, stopSpeech } from "../utils/speech";
import { useProgressActions, useProgressSelector } from "../store/ProgressContext";
import { balancedOptions } from "../utils/shuffle";
import { foregroundFor } from '../design/palettes';
import llamaLicense from '../data/llamaLicense.json';
import VoiceCoachScreen from "./VoiceCoachScreen";
import AICenterScreen from "./AICenterScreen";
import PronunciationLabScreen from "./PronunciationLabScreen";
import SpeechModelsScreen from "./SpeechModelsScreen";
import AIDirectorScreen from "./AIDirectorScreen";
import {
  AI_MODELS,
  analyzeTutorConversation,
  cancelModelDownload,
  completeTutorMessage,
  deleteTutorSession,
  deleteModel,
  downloadModel,
  getActiveModelId,
  getDownloadState,
  getDailyTutorMission,
  getFreeSpace,
  getTutorMissionProgress,
  inspectModels,
  loadModel,
  loadTutorMemory,
  loadTutorFeedback,
  loadTutorSessions,
  markTutorMissionCompleted,
  pauseActiveModelDownload,
  restorePendingModelDownload,
  resumePendingModelDownload,
  saveTutorSession,
  saveTutorFeedback,
  setActiveModelId,
  stopGeneration,
  subscribeToDownload,
  unloadModel,
} from "../services/localAi";
import {
  cancelSpeechRecording,
  getReadySpeechModel,
  startSpeechRecording,
  stopSpeechRecording,
  transcribeSpeechData,
  resumeSpeechModelDownload,
} from "../services/offlineSpeech";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TOPICS = ["Свободный разговор", "Путешествия", "Работа", "Грамматика", "Экзамен"];
const DIALOGUE_MODES = [
  { id: "conversation", title: "Живой", icon: "chatbubbles", hint: "Вопросы, выбор и неожиданные повороты" },
  { id: "roleplay", title: "Ролевая игра", icon: "people", hint: "ИИ остаётся персонажем выбранной ситуации" },
  { id: "interview", title: "Собеседование", icon: "briefcase-outline", hint: "Представься, расскажи об опыте и задай вопрос" },
  { id: "debate", title: "Дебаты", icon: "megaphone", hint: "Защищай мнение и отвечай на возражения" },
  { id: "story", title: "История", icon: "book", hint: "Продолжай сюжет через решения A или B" },
  { id: "strict", title: "Строгий", icon: "school", hint: "Каждая ошибка разбирается коротко и точно" },
];
const RESPONSE_ACTIONS = [
  { id: "simpler", title: "Проще", icon: "contract", instruction: "Объясни этот ответ проще: короткие предложения, одна идея за раз и уровень ученика. Не меняй смысл." },
  { id: "detail", title: "Подробнее", icon: "expand", instruction: "Объясни этот ответ подробнее, но без воды. Добавь причину и один полезный нюанс." },
  { id: "example", title: "Пример", icon: "bulb", instruction: "Покажи два естественных примера по теме: один простой и один немного сложнее. Добавь русский перевод." },
  { id: "exercise", title: "Задание", icon: "school", instruction: "Создай одно короткое задание по этому ответу. Сначала задай вопрос и не показывай правильный ответ." },
  { id: "translate", title: "Перевод", icon: "language" },
  { id: "retry", title: "Иначе", icon: "refresh", instruction: "Ответь заново другим способом: не повторяй структуру, начало и вопрос из прежнего ответа." },
];

const welcomeFor = (level, topic, modeId = "conversation") => ({
  id: `welcome-${Date.now()}`,
  role: "assistant",
  content: modeId === "interview"
    ? 'Thanks for coming in today. Let’s start with your background.'
    : modeId === "roleplay"
    ? 'Let’s practise a real situation. Where are we, and who am I?'
    : modeId === "debate"
      ? 'Let’s discuss an opinion. What would you like to debate?'
      : modeId === "story"
        ? 'Let’s create a story together. Who is our main character?'
        : modeId === "strict"
          ? 'Write a sentence in English. I will help you make it clear and natural.'
          : 'Hi! I’m Lingo. Let’s speak English. What would you like to talk about today?',
});

function formatSpace(bytes) {
  if (!Number.isFinite(bytes)) return "";
  return bytes >= 1e9
    ? `${(bytes / 1e9).toFixed(2)} ГБ`
    : `${Math.round(bytes / 1e6)} МБ`;
}

export default function AITutorScreen({ onImmersiveChange, onNavigate, practice, onPracticeConsumed, modelNotice, onModelNoticeConsumed }) {
  useTheme();
  const [requestedPractice, setRequestedPractice] = useState(practice);
  const [installed, setInstalled] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [screen, setScreen] = useState("models");
  const [loading, setLoading] = useState(true);
  const modelNoticeRef = useRef(modelNotice);
  modelNoticeRef.current = modelNotice;

  const refresh = useCallback(async (openActive = false) => {
    const [state, storedId] = await Promise.all([inspectModels(), getActiveModelId()]);
    const usableId = state[storedId]?.installed ? storedId : null;
    const currentDownload = getDownloadState();
    setInstalled(state);
    setActiveId(usableId);
    if (usableId && openActive && !modelNoticeRef.current && !['downloading', 'paused', 'interrupted', 'disconnected', 'pausing', 'verifying'].includes(currentDownload.status)) setScreen("chat");
    setLoading(false);
  }, []);

  useEffect(() => {
    restorePendingModelDownload().catch(() => {}).then(() => refresh(true)).catch(() => setLoading(false));
    resumeSpeechModelDownload().catch(() => {});
  }, []);

  useEffect(() => {
    if (!modelNotice) return;
    setRequestedPractice(null);
    setScreen('models');
    if (!loading) refresh().catch(() => {});
  }, [modelNotice?.key, refresh]);

  useEffect(() => () => {
    onImmersiveChange?.(false);
    unloadModel().catch(() => {});
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} size="large" />
        <Text style={styles.muted}>Проверяю локальные модели…</Text>
      </View>
    );
  }

  const activeModel = AI_MODELS.find((item) => item.id === activeId);
  if (screen === "director") {
    return (
      <AIDirectorScreen
        onClose={() => setScreen(activeModel ? "chat" : "models")}
        onOpenChat={() => setScreen(activeModel ? "chat" : "models")}
        onOpenPronunciation={() => setScreen("pronunciation")}
        onNavigate={onNavigate}
      />
    );
  }
  if (screen === "center") {
    return <AICenterScreen onClose={() => setScreen("models")} onPronunciation={() => setScreen("pronunciation")} onSpeechModels={() => setScreen("speechModels")} />;
  }
  if (screen === "speechModels") {
    return <SpeechModelsScreen onClose={() => setScreen("center")} />;
  }
  if (screen === "pronunciation") {
    return <PronunciationLabScreen onClose={() => setScreen("center")} onSpeechModels={() => setScreen("speechModels")} />;
  }
  if (screen === "voice" && activeModel) {
    return (
      <VoiceCoachScreen
        model={activeModel}
        onClose={() => {
          onImmersiveChange?.(false);
          setScreen("chat");
        }}
      />
    );
  }
  if (screen === "chat" && activeModel) {
    return (
      <TutorChat
        practice={requestedPractice}
        onPracticeConsumed={onPracticeConsumed}
        model={activeModel}
        onModels={() => setScreen("models")}
        onDirector={() => setScreen("director")}
        onNavigate={onNavigate}
        onVoice={() => {
          onImmersiveChange?.(true);
          setScreen("voice");
        }}
      />
    );
  }

  return (
    <ModelLibrary
      installed={installed}
      activeId={activeId}
      modelNotice={modelNotice}
      onRefresh={refresh}
      onCenter={() => { onModelNoticeConsumed?.(); setScreen("center"); }}
      onPronunciation={() => { onModelNoticeConsumed?.(); setScreen("pronunciation"); }}
      onDirector={() => { onModelNoticeConsumed?.(); setScreen("director"); }}
      onStart={async (model) => {
        await setActiveModelId(model.id);
        setActiveId(model.id);
        onModelNoticeConsumed?.();
        setScreen("chat");
      }}
    />
  );
}

export function ModelLibrary({ installed, activeId, onRefresh, onStart, onCenter, onPronunciation, onDirector, modelNotice }) {
  const { reduceMotion } = useTheme();
  const [download, setDownload] = useState(getDownloadState());
  const [freeSpace, setFreeSpace] = useState(null);
  const [error, setError] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [licenseModel, setLicenseModel] = useState(null);
  const cancelledRef = useRef(false);
  const modelList = useRef(null);
  const focusedNotice = useRef(null);
  const focusId = modelNotice?.modelId;

  useEffect(() => {
    getFreeSpace().then(setFreeSpace);
  }, []);

  useEffect(() =>
    subscribeToDownload((state) => {
      setDownload(state);
      if (state.status === "completed") onRefresh();
    }),
  [onRefresh]);

  const install = async (model) => {
    cancelledRef.current = false;
    setError("");
    const resuming = download.modelId === model.id && download.canResume;
    const remaining = model.size - (resuming ? Math.min(download.written, model.size) : 0);
    const required = remaining + model.size * 0.25;
    const available = await getFreeSpace();
    setFreeSpace(available);
    if (Number.isFinite(available) && available < required) {
      setError(`Для загрузки нужно около ${formatSpace(required)} свободного места с запасом.`);
      return;
    }
    try {
      if (resuming) await resumePendingModelDownload();
      else await downloadModel(model);
      await onRefresh();
    } catch (downloadError) {
      if (!cancelledRef.current && !['paused', 'interrupted', 'disconnected', 'error'].includes(getDownloadState().status)) {
        setError(downloadError?.message || "Не удалось скачать модель. Проверьте интернет и свободное место.");
      }
    }
  };

  const cancel = async () => {
    cancelledRef.current = true;
    try {
      await cancelModelDownload();
      await onRefresh();
    } catch {
      setError('Не удалось отменить загрузку. Попробуй ещё раз.');
    }
  };

  const remove = (model) => {
    Alert.alert(
      `Удалить модель «${model.title}»?`,
      `Освободится около ${model.sizeLabel}. История обучения и прогресс не удалятся.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await deleteModel(model);
            await onRefresh();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      key={modelNotice?.key}
      ref={modelList}
      style={styles.page}
      contentContainerStyle={styles.modelContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroRow}>
        <View style={styles.aiLogo}>
          <Ionicons name="sparkles" color={colors.text} size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>РАБОТАЕТ НА IPHONE</Text>
          <Text style={styles.title}>ИИ-преподаватель</Text>
        </View>
        <Pressable onPress={onCenter} style={styles.headerButton}>
          <Ionicons name="options-outline" color={colors.text} size={22} />
        </Pressable>
      </View>
      <Text style={styles.lead}>
        Выбери и скачай модель один раз. После этого диалоги, исправления и объяснения работают без интернета.
      </Text>

      <View style={styles.privacyCard}>
        <Ionicons name="shield-checkmark" size={22} color={colors.mint} />
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Разговор остаётся на устройстве</Text>
          <Text style={styles.smallMuted}>Сообщения не отправляются на сервер. Модель можно удалить в любой момент.</Text>
        </View>
      </View>

      <Pressable onPress={onDirector} style={styles.directorBanner}>
        <View style={styles.directorIcon}><Ionicons name="sparkles" size={25} color={colors.text} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>ИИ-маршрут на сегодня</Text>
          <Text style={styles.smallMuted}>План на 10–30 минут из твоего прогресса и ошибок</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
      </Pressable>

      <Pressable onPress={onPronunciation} style={styles.pronunciationBanner}>
        <View style={styles.pronunciationIcon}><Ionicons name="mic" size={25} color={colors.text} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Лаборатория произношения</Text>
          <Text style={styles.smallMuted}>Запиши фразу, сравни результат и пройди экзамен</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Выбери мощность</Text>
        {freeSpace ? <Text style={styles.storage}>Свободно {formatSpace(freeSpace)}</Text> : null}
      </View>

      <Text style={styles.smallMuted}>Начни с Llama 1B. Gemma 1B — альтернативный вариант, Llama 3B требует больше памяти. Скачивание запускается только по нажатию.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showLegacy }} onPress={() => setShowLegacy(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.speakText}>{showLegacy ? 'Скрыть неустановленные Qwen' : 'Показать прежние модели Qwen'}</Text></Pressable>
      {AI_MODELS.filter(model => !model.legacy || showLegacy || focusId === model.id || installed[model.id]?.installed || activeId === model.id || download.modelId === model.id).map((model) => {
        const accent = model.tier === 'light' ? colors.mint : model.tier === 'advanced' ? colors.orange : colors.purple;
        const isInstalled = installed[model.id]?.installed;
        const isDownloading = download.status === "downloading" && download.modelId === model.id;
        const busy = ['downloading', 'pausing', 'verifying', 'cancelling'].includes(download.status);
        const isBusyHere = busy && download.modelId === model.id;
        const isInterrupted = ['paused', 'disconnected', 'interrupted', 'error'].includes(download.status) && download.modelId === model.id;
        const blocked = (busy && !isBusyHere) || (download.canResume && download.modelId !== model.id);
        return (
          <View
            key={model.id}
            onLayout={focusId === model.id ? ({ nativeEvent: { layout } }) => {
              if (!modelList.current || focusedNotice.current === modelNotice.key) return;
              focusedNotice.current = modelNotice.key;
              modelList.current.scrollTo({ y: Math.max(0, layout.y - 12), animated: false });
            } : undefined}
            style={[
              styles.modelCard,
              (activeId === model.id || isDownloading || focusId === model.id) && { borderColor: accent },
            ]}
          >
            <View style={styles.modelTop}>
              <View style={[styles.modelIcon, { backgroundColor: `${accent}22` }]}>
                <Ionicons name={model.icon} size={23} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.modelTitle}>{model.title}</Text>
                  {model.recommended ? <Text style={styles.recommended}>ДЛЯ СТАРТА</Text> : null}
                </View>
                <Text style={styles.modelSubtitle}>{model.subtitle}</Text>
              </View>
              <Text style={[styles.size, { color: accent }]}>{model.sizeLabel}</Text>
            </View>
            <View style={styles.modelFacts}>
              <Text style={styles.fact}>{model.model}</Text>
              <Text style={styles.fact}>{model.device}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              <Pressable accessibilityRole="link" accessibilityLabel={`Источник ${model.shortTitle || model.title}`} onPress={() => Linking.openURL(model.sourceUrl).catch(() => setError('Не удалось открыть источник модели.'))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.speakText}>Источник</Text></Pressable>
              <Pressable accessibilityRole={model.family === 'llama' ? 'button' : 'link'} accessibilityLabel={`Условия ${model.shortTitle || model.title}`} onPress={() => model.family === 'llama' ? setLicenseModel(model) : Linking.openURL(model.licenseUrl).catch(() => setError('Не удалось открыть условия модели.'))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.speakText}>{model.license}</Text></Pressable>
            </View>

            {isBusyHere ? (
              <View style={styles.downloadBox}>
                <View style={styles.downloadLabels}>
                  <Text style={styles.downloadText}>{isDownloading ? `Загрузка ${Math.round(download.progress * 100)}%` : ({ pausing: 'Сохраняю точку продолжения…', verifying: 'Проверяю файл…', cancelling: 'Отменяю загрузку…' })[download.status]}</Text>
                  <Text style={styles.smallMuted}>{formatSpace(download.written)} из {model.sizeLabel}</Text>
                </View>
                <ProgressBar value={download.progress} color={accent} height={8} />
                <Text style={styles.backgroundHint}>На iPhone загрузку в фоне выполняет iOS.</Text>
                {!!download.error && <Text style={styles.smallMuted}>{download.error}</Text>}
                {isDownloading && <Pressable onPress={pauseActiveModelDownload} style={styles.cancelButton}>
                  <Text style={styles.speakText}>Пауза</Text>
                </Pressable>}
                {isDownloading && <Pressable onPress={cancel} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Отменить загрузку</Text>
                </Pressable>}
              </View>
            ) : isInterrupted && !isInstalled ? (
              <View style={styles.downloadBox}>
                <Text style={styles.downloadText}>{({ paused: 'На паузе', disconnected: 'Связь потеряна', interrupted: 'Загрузка прервана', error: 'Ошибка загрузки' })[download.status]}</Text>
                {!!download.error && <Text style={styles.smallMuted}>{download.error}</Text>}
                <Text style={styles.smallMuted}>{download.canResume ? `Сохранена точка продолжения · ${formatSpace(download.written)}` : 'Новая попытка начнётся с начала.'}</Text>
                <Pressable onPress={() => install(model)} style={styles.installButton}>
                  <Text style={[styles.installText, { color: accent }]}>{download.canResume ? 'Продолжить загрузку' : 'Скачать заново'}</Text>
                </Pressable>
                <Pressable onPress={cancel} style={styles.cancelButton}><Text style={styles.cancelText}>Отменить загрузку</Text></Pressable>
              </View>
            ) : isInstalled ? (
              <View style={styles.installedActions}>
                <Pressable onPress={() => onStart(model)} style={[styles.startButton, { backgroundColor: accent }]}>
                  <Ionicons name="chatbubbles" size={19} color={foregroundFor(accent)} />
                  <Text style={[styles.startText, { color: foregroundFor(accent) }]}>{activeId === model.id ? "Продолжить диалог" : "Выбрать и запустить"}</Text>
                </Pressable>
                <Pressable onPress={() => remove(model)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={blocked}
                onPress={() => install(model)}
                style={[styles.installButton, blocked && { backgroundColor: colors.disabledBackground, borderColor: colors.buttonBorder }]}
              >
                <Ionicons name="cloud-download-outline" size={20} color={blocked ? colors.disabledText : accent} />
                <Text style={[styles.installText, { color: blocked ? colors.disabledText : accent }]}>Скачать модель</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" color={colors.pink} size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <Text style={styles.licenseText}>Built with Llama · Gemma от Google · квантованные GGUF от bartowski. У каждой семьи собственные условия использования.</Text>
      {!!licenseModel && <Modal transparent animationType={reduceMotion ? 'none' : 'fade'} visible onRequestClose={() => setLicenseModel(null)}>
        <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}><View accessibilityViewIsModal style={{ maxHeight: '88%', backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={[styles.modelTitle, { flex: 1 }]}>Условия Llama 3.2</Text><Pressable accessibilityLabel="Закрыть условия" onPress={() => setLicenseModel(null)} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>
          <ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 16 }}><Text style={styles.smallMuted}>Llama 3.2 is licensed under the Llama 3.2 Community License, Copyright © Meta Platforms, Inc. All Rights Reserved.</Text><Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{llamaLicense}</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL(licenseModel.licenseUrl).catch(() => setError('Не удалось открыть условия модели.'))} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={styles.speakText}>Официальный источник</Text></Pressable></ScrollView>
        </View></View>
      </Modal>}
    </ScrollView>
  );
}

const tabDrafts = new Map();

export function TutorChat({ model, onModels, onVoice, onDirector, onNavigate, practice, onPracticeConsumed }) {
  useTheme();
  const keyboard = useKeyboardDock();
  const progress = useProgressSelector(({ progress: value }) => ({ notebook: value.notebook, customWords: value.customWords, mistakes: value.mistakes }));
  const { toggleNotebook, addCustomWord, addReviewPhrase, addConstructionReview } = useProgressActions();
  const [restoredDraft] = useState(() => {
    const draft = tabDrafts.get(model.id);
    return practice?.requestId && practice.requestId !== draft?.coursePractice?.requestId ? null : draft;
  });
  const [level, setLevel] = useState(restoredDraft?.level || "A2");
  const [topic, setTopic] = useState(restoredDraft?.topic || TOPICS[0]);
  const [coursePractice, setCoursePractice] = useState(restoredDraft?.coursePractice || null);
  const [toolsPanel, setToolsPanel] = useState(null);
  const [lessonHelp, setLessonHelp] = useState(0);
  const [courseGoalOpen, setCourseGoalOpen] = useState(false);
  const [goalSummaryOpen, setGoalSummaryOpen] = useState(false);
  useEffect(() => {
    setCourseGoalOpen(false);
    setGoalSummaryOpen(false);
    setLessonHelp(0);
  }, [coursePractice?.topicId, coursePractice?.requestId]);
  const [dialogueMode, setDialogueMode] = useState(restoredDraft?.dialogueMode || "conversation");
  const [interviewHint, setInterviewHint] = useState(null);
  const [interviewSummary, setInterviewSummary] = useState(false);
  const [mission, setMission] = useState(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [messages, setMessages] = useState(() => restoredDraft?.messages || [welcomeFor("A2", TOPICS[0])]);
  const interview = useMemo(() => dialogueMode === 'interview' ? interviewProgress(messages) : null, [dialogueMode, messages]);
  const interviewEnded = !!interview && (!interview.next || messages.length >= 56);
  const review = useMemo(() => interview && (interviewSummary || interviewEnded) ? interviewReview(messages) : null, [interview, interviewSummary, interviewEnded, messages]);
  const interviewExercises = useMemo(() => review?.exercise ? [review.exercise] : [], [review?.exercise]);
  const lastInterviewAttempt = interview?.attempts.at(-1);
  const evidenceKey = learnerTurns(messages).map(item => item.content).join('\u0000');
  const dialogueEvidence = useMemo(() => coursePractice?.topicId ? courseDialogueEvidence(coursePractice.topicId, messages) : [], [coursePractice?.topicId, evidenceKey]);
  const dialogueTurns = useMemo(() => learnerTurns(messages).length, [messages]);
  const [sessionId, setSessionId] = useState(() => restoredDraft?.sessionId || `ai-${Date.now()}`);
  const [sessions, setSessions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [input, updateInput] = useState(restoredDraft?.text || '');
  const [practiceOpenFor, setPracticeOpenFor] = useState(null);
  const [practiceSavedFor, setPracticeSavedFor] = useState(null);
  const lastLearner = learnerTurns(messages).at(-1);
  const followUp = useMemo(() => tutorPracticeFor(lastLearner?.content), [lastLearner?.content]);
  const followUpExercises = useMemo(() => followUp ? [followUp.exercise] : [], [followUp]);
  const rememberDraft = (text, draftMessages = messages) => {
    if (text.trim()) tabDrafts.set(model.id, { text, sessionId, level, topic, dialogueMode, coursePractice, messages: draftMessages.filter(item => item.id !== 'streaming') });
    else tabDrafts.delete(model.id);
  };
  const setInput = text => {
    rememberDraft(text);
    updateInput(text);
  };
  useEffect(() => {
    if (input.trim()) rememberDraft(input);
  }, [input, sessionId, level, topic, dialogueMode, coursePractice, messages]);
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechModel, setSpeechModel] = useState(null);
  const [speechTranscribing, setSpeechTranscribing] = useState(false);
  const [error, setError] = useState("");
  const keyboardVisible = keyboard.visible;
  const [replyStage, setReplyStage] = useState('thinking');
  const [retryRequest, setRetryRequest] = useState(null);
  const requestRef = useRef(null);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const scrollRef = useRef(null);
  const followTail = useRef(true);
  const generationText = useRef("");
  const historyReady = useRef(false);
  const historySaveTimer = useRef(null);
  const localSpeechRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    loadModel(model, (value) => mounted && setLoadProgress(value))
      .then(() => mounted && setModelReady(true))
      .catch((loadError) => mounted && setError(loadError?.message || "Не удалось запустить модель"));
    return () => {
      mounted = false;
      requestRef.current?.abort();
      stopGeneration().catch(() => {});
      stopSpeech();
      cancelSpeechRecording().catch(() => {});
    };
  }, [model.id]);

  useEffect(() => { getReadySpeechModel().then(setSpeechModel).catch(() => {}); }, []);

  useEffect(() => {
    loadTutorFeedback().then((items) => setFeedbackMap(Object.fromEntries(items.map((item) => [item.messageId, item])))).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    loadTutorMemory().then((memory) => {
      if (!mounted) return;
      const daily = getDailyTutorMission({ level, topic, memory });
      setMission({ ...daily, alreadyCompleted: memory.completedMissions.includes(daily.id) });
    });
    return () => { mounted = false; };
  }, [level, topic, analysis]);

  useEffect(() => {
    let mounted = true;
    historyReady.current = false;
    loadTutorSessions().then((allSessions) => {
      if (!mounted) return;
      const modelSessions = allSessions.filter((item) => item.modelId === model.id);
      setSessions(modelSessions);
      const requestedId = practice?.requestId ? `ai-course-${model.id}-${practice.requestId}` : null;
      const recent = requestedId ? modelSessions.find(item => item.id === requestedId) : null;
      if (restoredDraft && (!requestedId || restoredDraft.sessionId === requestedId)) {
        setAnalysis(modelSessions.find(item => item.id === restoredDraft.sessionId)?.analysis || null);
      } else if (recent) {
        setSessionId(recent.id);
        setLevel(recent.level || "A2");
        setTopic(recent.topic || TOPICS[0]);
        setDialogueMode(recent.dialogueMode || "conversation");
        setMessages(recent.messages?.length ? recent.messages : [welcomeFor("A2", TOPICS[0], recent.dialogueMode)]);
        setAnalysis(recent.analysis || null);
        setCoursePractice(recent.coursePractice || null);
      } else if (requestedId) {
        setSessionId(requestedId);
        setLevel(practice.level);
        setTopic(practice.topic);
        setDialogueMode('conversation');
        setCoursePractice(practice);
        setMessages([{ id: `${requestedId}-opening`, role: 'assistant', content: practice.opening }]);
        setAnalysis(null);
      }
      historyReady.current = true;
      if (requestedId) onPracticeConsumed?.();
    });
    return () => {
      mounted = false;
    };
  }, [model.id, practice?.requestId]);

  useEffect(() => {
    if (!historyReady.current) return;
    const timer = setTimeout(() => {
      const cleanMessages = messages.filter((item) => item.id !== "streaming").slice(-60);
      const firstUser = cleanMessages.find((item) => item.role === "user")?.content;
      saveTutorSession({
        id: sessionId,
        modelId: model.id,
        modelTitle: model.shortTitle || model.title,
        level,
        topic,
        dialogueMode,
        coursePractice,
        title: dialogueMode === 'interview' ? 'Собеседование' : firstUser ? firstUser.slice(0, 42) : topic,
        messages: cleanMessages,
        analysis,
        createdAt: sessions.find((item) => item.id === sessionId)?.createdAt || Date.now(),
      }).then((allSessions) =>
        setSessions(allSessions.filter((item) => item.modelId === model.id)),
      ).catch(() => setError('Не удалось сохранить историю ИИ на устройстве.'));
    }, 450);
    historySaveTimer.current = timer;
    return () => clearTimeout(timer);
  }, [messages, level, topic, dialogueMode, sessionId, model.id, analysis, coursePractice]);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript || "";
    if (transcript) setInput(transcript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    setError(
      event.error === "language-not-supported"
        ? "На устройстве не загружено локальное распознавание английского. Добавьте English в настройках iOS."
        : "Не удалось распознать речь. Проверьте доступ к микрофону.",
    );
  });

  const liveMissionProgress = getTutorMissionProgress(mission, messages);
  const missionProgress = mission?.alreadyCompleted
    ? { ...liveMissionProgress, current: liveMissionProgress.target, completed: true }
    : liveMissionProgress;

  useEffect(() => {
    if (interview || !mission || !missionProgress.completed || mission.alreadyCompleted) return;
    markTutorMissionCompleted(mission.id)
      .then(() => setMission((current) => current?.id === mission.id ? { ...current, alreadyCompleted: true } : current))
      .catch(() => {});
  }, [dialogueMode, mission?.id, mission?.alreadyCompleted, missionProgress.completed]);

  const startListening = async () => {
    setError("");
    if (speechTranscribing) return;
    if (listening && localSpeechRef.current) {
      setListening(false); setSpeechTranscribing(true);
      try {
        const recording = await stopSpeechRecording();
        localSpeechRef.current = false;
        const result = await transcribeSpeechData(speechModel, recording.pcm16);
        setInput(String(result?.result || "").trim());
      } catch (speechError) {
        localSpeechRef.current = false;
        setError(speechError?.message || "Не удалось распознать речь.");
      } finally { setSpeechTranscribing(false); }
      return;
    }
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (speechModel) {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { setError("Разрешите доступ к микрофону в настройках iPhone."); return; }
      setInput("");
      try { startSpeechRecording(); localSpeechRef.current = true; setListening(true); }
      catch (speechError) { setError(speechError?.message || "Не удалось начать запись."); }
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError("Разрешите доступ к микрофону и распознаванию речи в настройках iPhone.");
      return;
    }
    setInput("");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
      iosTaskHint: "dictation",
      iosCategory: {
        category: "playAndRecord",
        categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
        mode: "measurement",
      },
    });
  };

  const submitMessage = async (rawText, options = {}) => {
    const text = String(rawText || "").trim();
    const translationTargetId = options.translationTargetId;
    if (!text || generating || requestRef.current || !modelReady) return;
    if (interviewEnded && !translationTargetId && !options.retry) return;
    if (translationTargetId && !messages.some(item => item.id === translationTargetId)) return;
    const requestedAt = now();
    Keyboard.dismiss();
    if (options.kind !== "command") setInput("");
    setOpenActionsId(null);
    setError("");
    setRetryRequest(null);
    if (!translationTargetId) followTail.current = true;
    setReplyStage('thinking');
    const request = new AbortController();
    requestRef.current = request;
    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content: text,
      displayContent: options.displayContent || text,
      kind: options.kind || "message",
      action: options.action || null,
      ...(options.action === 'translate' ? { translationSource: text } : {}),
      ...(interview?.next && options.kind !== 'command' ? { interviewStepId: interview.next.id } : {}),
    };
    const nextMessages = (options.retry && !translationTargetId
      ? messages.filter(item => item.id !== 'streaming')
      : [...messages, userMessage]).slice(-59);
    let scenarioContext = '';
    if (interview && options.kind !== 'command') {
      scenarioContext = interviewContext(interviewProgress(nextMessages.slice(0, -1)), interviewProgress(nextMessages));
    }
    if (!translationTargetId) setMessages([...nextMessages, { id: "streaming", role: "assistant", content: "" }]);
    setGenerating(true);
    generationText.current = "";
    try {
      const result = await completeTutorMessage({
        model,
        level,
        topic,
        dialogueMode,
        courseContext: courseTutorContext(coursePractice, level, topic, progress),
        scenarioContext,
        messages: nextMessages,
        analysis,
        signal: request.signal,
        onStatus: stage => { if (!request.signal.aborted) setReplyStage(stage); },
        onToken: (token) => {
          if (!request.signal.aborted) generationText.current += token;
        },
      });
      if (request.signal.aborted) return;
      const finalText = (result?.text || generationText.current).trim();
      const timing = result?.quality?.source === 'local-opening' ? 'ai_opening_ready'
        : result?.quality?.source === 'context-recovery' ? 'ai_context_recovery_ready'
        : translationTargetId ? 'ai_translation_ready' : 'ai_reply_ready';
      recordTiming(timing, now() - requestedAt);
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: finalText,
        ...(options.action === 'translate' ? { action: 'translate' } : {}),
        quality: result?.quality || null,
      };
      const completedMessages = translationTargetId
        ? messages.map(item => item.id === translationTargetId ? { ...item, translation: finalText } : item)
        : [...nextMessages, assistantMessage];
      setMessages(completedMessages);
      await saveTutorSession({
        id: sessionId,
        modelId: model.id,
        modelTitle: model.title,
        level,
        topic,
        dialogueMode,
        title: dialogueMode === 'interview' ? 'Собеседование' : nextMessages.find((item) => item.role === "user")?.content?.slice(0, 42) || topic,
        coursePractice,
        messages: completedMessages.slice(-60),
        analysis,
        createdAt: sessions.find((item) => item.id === sessionId)?.createdAt || Date.now(),
      }).catch(() => { if (!request.signal.aborted) setError('Ответ получен, но сохранить разговор на устройстве не удалось.'); });
    } catch (generationError) {
      if (request.signal.aborted) return;
      recordTiming('ai_reply_failed', now() - requestedAt);
      setMessages((current) => current.filter((item) => item.id !== "streaming"));
      setError(generationError?.message || "Не удалось получить ответ");
      setRetryRequest({ text, options, messageId: nextMessages.at(-1)?.id });
    } finally {
      if (requestRef.current === request) requestRef.current = null;
      setGenerating(false);
    }
  };

  const send = () => submitMessage(input);

  const editFailedReply = () => {
    if (!retryRequest?.messageId || retryRequest.options.kind === 'command' || requestRef.current) return;
    const revised = messages.filter(item => item.id !== retryRequest.messageId);
    setMessages(revised);
    updateInput(retryRequest.text);
    rememberDraft(retryRequest.text, revised);
    setRetryRequest(null);
    setError('');
  };

  const runResponseAction = (message, action) => {
    const content = String(message.content || '');
    const text = action.id === 'translate'
      ? content
      : `${action.instruction}\n\nОтвет Lingo, с которым нужно работать:\n${content.slice(0, 1200)}`;
    submitMessage(text, {
      kind: "command",
      displayContent: action.title,
      action: action.id,
      ...(interviewEnded && action.id === 'translate' ? { translationTargetId: message.id } : {}),
    });
  };

  const recordFeedback = async (message, rating, reason = "") => {
    const entry = { messageId: message.id, rating, reason, text: String(message.content || "").slice(0, 1200) };
    const next = await saveTutorFeedback(entry);
    setFeedbackMap(Object.fromEntries(next.map((item) => [item.messageId, item])));
  };

  const dislike = (message) => Alert.alert(
    "Что не так с ответом?",
    "Выбор сохранится только на iPhone и изменит следующие ответы Lingo.",
    [
      { text: "Неправильно", onPress: () => recordFeedback(message, "down", "wrong") },
      { text: "Однотипно", onPress: () => recordFeedback(message, "down", "repetitive") },
      { text: "Слишком сложно", onPress: () => recordFeedback(message, "down", "hard") },
      { text: "Слишком легко", onPress: () => recordFeedback(message, "down", "easy") },
      { text: "Отмена", style: "cancel" },
    ],
  );

  const stop = async () => {
    requestRef.current?.abort();
    setReplyStage('stopped');
    setMessages(current => current.filter(item => item.id !== 'streaming'));
    setRetryRequest(null);
    try { await stopGeneration(); } catch { /* Completion owns the error UI. */ }
  };

  const speakMessage = (text, language = 'en-US') => speak(text, { language, rate: 0.88 });
  const progressLabel = loadProgress > 0 ? `${Math.round(loadProgress * 100)}%` : "подготовка";

  const startConversation = (mode) => {
    if (requestRef.current) return;
    setCoursePractice(null);
    const id = `ai-${Date.now()}`;
    setSessionId(id);
    setDialogueMode(mode);
    if (mode === 'interview') setTopic('Работа');
    setMessages([welcomeFor(level, topic, mode)]);
    setInterviewHint(null);
    setInterviewSummary(false);
    setInput('');
    setAnalysis(null);
    setRetryRequest(null); setError('');
    setHistoryOpen(false);
  };
  const newConversation = () => startConversation(dialogueMode);

  const openSession = (session) => {
    if (requestRef.current) return;
    setCoursePractice(session.coursePractice || null);
    setSessionId(session.id);
    setLevel(session.level || "A2");
    setTopic(session.topic || TOPICS[0]);
    setDialogueMode(session.dialogueMode || "conversation");
    setInterviewSummary(false);
    setInterviewHint(null);
    setInput('');
    setMessages(session.messages?.length ? session.messages : [welcomeFor(session.level || "A2", session.topic || TOPICS[0], session.dialogueMode)]);
    setAnalysis(session.analysis || null);
    setRetryRequest(null); setError('');
    setHistoryOpen(false);
  };

  const removeSession = async (session) => {
    const isCurrent = session.id === sessionId;
    if (isCurrent && requestRef.current) return;
    if (isCurrent) clearTimeout(historySaveTimer.current);
    try {
      const next = await deleteTutorSession(session.id);
      setSessions(next.filter(item => item.modelId === model.id));
      if (isCurrent) newConversation();
    } catch {
      Alert.alert('Не удалось удалить диалог', 'Попробуй ещё раз.');
    }
  };

  const noteForMessage = (message, index) => {
    const userMessage = [...messages.slice(0, index)].reverse().find((item) => item.role === "user");
    return {
      id: `ai-note-${message.id}`,
      topic: `ИИ-диалог · ${topic}`,
      rule: message.content,
      example: userMessage?.content || "Разговор с Lingo",
      level,
    };
  };

  const runAnalysis = async () => {
    if (generating || analyzing) return;
    const userCount = messages.filter((item) => item.role === "user" && item.kind !== "command").length;
    if (userCount < 2) {
      setError("Для разбора напиши или скажи хотя бы две фразы по-английски.");
      return;
    }
    setError("");
    setAnalysisOpen(true);
    setAnalyzing(true);
    try {
      const result = await analyzeTutorConversation({ model, level, topic, messages });
      setAnalysis(result);
    } catch (analysisError) {
      const message = analysisError?.message || "";
      setError(/json|parse|unexpected|незаверш/i.test(message)
        ? "Разбор не успел завершиться. Нажми ещё раз — он будет создан в сокращённом формате."
        : message || "Не удалось разобрать разговор. Попробуйте ещё раз.");
      setAnalysisOpen(false);
    } finally {
      setAnalyzing(false);
    }
  };

  if (analysisOpen) {
    return (
      <ConversationAnalysis
        analysis={analysis}
        analyzing={analyzing}
        level={level}
        topic={topic}
        progress={progress}
        onAddWord={(english, russian, example) => { addCustomWord(english, russian, example); addReviewPhrase({ english, russian, topic: `ИИ · ${topic}` }); }}
        onBack={() => setAnalysisOpen(false)}
        onRetry={runAnalysis}
      />
    );
  }

  if (historyOpen) {
    return (
      <View style={styles.chatPage}>
        <View style={styles.chatHeader}>
          <Pressable onPress={() => setHistoryOpen(false)} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>История разговоров</Text>
            <Text style={styles.chatStatus}>Хранится только на этом iPhone</Text>
          </View>
          <Pressable onPress={newConversation} style={[styles.headerButton, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="add" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.historyContent}>
          {sessions.length ? sessions.map((session) => (
            <Pressable key={session.id} onPress={() => openSession(session)} style={[styles.historyCard, session.id === sessionId && styles.historyCardActive]}>
              <View style={styles.historyIcon}>
                <Ionicons name="chatbubble-ellipses" size={21} color={colors.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.historyTitle}>{session.title || session.topic}</Text>
                <Text style={styles.historyMeta}>{session.level} · {DIALOGUE_MODES.find((item) => item.id === session.dialogueMode)?.title || "Живой"} · {Math.max(0, (session.messages?.length || 1) - 1)} сообщений</Text>
              </View>
              <Pressable disabled={generating && session.id === sessionId} onPress={(event) => { event.stopPropagation(); removeSession(session); }} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          )) : (
            <View style={styles.emptyHistory}>
              <Text style={{ fontSize: 42 }}>💬</Text>
              <Text style={styles.modelLoadingTitle}>Разговоров пока нет</Text>
              <Text style={styles.smallMuted}>Начни диалог — он сохранится автоматически.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View ref={keyboard.ref} collapsable={false} onLayout={keyboard.onLayout} style={[styles.chatPage, { paddingBottom: keyboard.inset }]}>
      <View style={styles.chatHeader}>
        <View style={[styles.onlineDot, { backgroundColor: modelReady ? colors.mint : colors.orange }]} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.chatTitle}>Lingo · {model.shortTitle || model.title}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.chatStatus}>{!modelReady ? `Загружаю модель · ${progressLabel}` : speechTranscribing ? 'Распознаю речь…' : listening ? 'Слушаю…' : generating ? replyStage === 'stopped' ? 'Останавливаю…' : replyStage === 'rewriting' ? 'Переформулирую ответ…' : replyStage === 'checking' ? 'Проверяю язык и повторы…' : 'Обдумываю ответ…' : replyStage === 'stopped' ? 'Ответ остановлен' : 'Английский диалог · офлайн'}</Text>
        </View>
        <Pressable accessibilityLabel={keyboardVisible ? 'Скрыть клавиатуру' : 'Инструменты разговора'} onPress={() => { Keyboard.dismiss(); if (!keyboardVisible) setToolsPanel('menu'); }} style={styles.headerButton}><Ionicons name={keyboardVisible ? 'chevron-down' : 'ellipsis-horizontal'} size={25} color={colors.text} /></Pressable>
        {toolsPanel && <ToolSheet visible onClose={() => setToolsPanel(null)} title={toolsPanel === 'settings' ? 'Настройки диалога' : 'Твой разговор'} actions={toolsPanel === 'menu' ? [
          { title: 'Настройки диалога', detail: `${level} · ${topic} · ${DIALOGUE_MODES.find(item => item.id === dialogueMode)?.title || 'Живой'}`, icon: 'options-outline', onPress: () => setToolsPanel('settings') },
          { title: 'Новое собеседование', detail: 'Три шага и короткий разбор', icon: 'briefcase-outline', onPress: () => startConversation('interview') },
          { title: 'Голосовой режим', detail: 'Практика речи с собеседником', icon: 'mic-outline', onPress: onVoice },
          { title: 'История разговоров', detail: 'Открой сохранённый диалог вручную', icon: 'time-outline', onPress: () => setHistoryOpen(true) },
          { title: 'Локальные модели', detail: 'Выбрать и скачать модель', icon: 'hardware-chip-outline', onPress: onModels },
        ] : []}>
          {toolsPanel === 'settings' && <>
            <Text style={styles.settingsLabel}>Уровень</Text>
            <View style={styles.settingsChoices}>
              {LEVELS.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: level === item, disabled: generating }} disabled={generating} onPress={() => { if (item !== level) { setLevel(item); setCoursePractice(null); } }} style={[styles.settingsChoice, level === item && styles.settingsChoiceActive]}>
                <Text style={styles.settingsChoiceText}>{item}</Text>
              </Pressable>)}
            </View>
            {!interview && <>
              <Text style={styles.settingsLabel}>Тема</Text>
              <View style={styles.settingsChoices}>
                {TOPICS.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: topic === item, disabled: generating }} disabled={generating} onPress={() => { if (item !== topic) { setTopic(item); setCoursePractice(null); } }} style={[styles.settingsChoice, topic === item && styles.settingsChoiceActive]}>
                  <Text style={styles.settingsChoiceText}>{item}</Text>
                </Pressable>)}
              </View>
            </>}
            <Text style={styles.settingsLabel}>Режим</Text>
            <View style={styles.settingsChoices}>
              {DIALOGUE_MODES.map(item => {
                const active = dialogueMode === item.id;
                return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: active, disabled: generating }} disabled={generating} onPress={() => {
                  if (active) return;
                  if (interview || item.id === 'interview') {
                    startConversation(item.id);
                    setToolsPanel(null);
                  } else {
                    setDialogueMode(item.id);
                    setCoursePractice(null);
                  }
                }} style={[styles.settingsChoice, active && styles.settingsChoiceActive]}>
                  <Ionicons name={item.icon} size={18} color={active ? colors.purple : colors.textMuted} />
                  <Text style={styles.settingsChoiceText}>{item.title}</Text>
                </Pressable>;
              })}
            </View>
            <Text style={styles.smallMuted}>{DIALOGUE_MODES.find(item => item.id === dialogueMode)?.hint}</Text>
          </>}
        </ToolSheet>}
      </View>

      {!keyboardVisible && !!courseTutorContext(coursePractice, level, topic) && <View style={styles.courseGoal}>
        <Pressable accessibilityRole="button" accessibilityLabel={courseGoalOpen ? 'Свернуть цель урока' : 'Раскрыть цель урока'} accessibilityState={{ expanded: courseGoalOpen }} onPress={() => setCourseGoalOpen(open => !open)} style={styles.courseGoalToggle}>
          <Ionicons name="flag-outline" size={17} color={colors.mint} />
          <Text style={styles.courseGoalTitle} numberOfLines={1}>Цель: {coursePractice.goal || topic}</Text>
          <Ionicons name={courseGoalOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
        {courseGoalOpen && <ScrollView style={{ maxHeight: 190, flexGrow: 0 }} contentContainerStyle={styles.courseGoalDetails}>
          <Text style={styles.courseGoalTitle}>{coursePractice.goal || topic}</Text>
          <Text style={{ color: colors.textMuted, lineHeight: 21 }}>Помощь открывается по шагам; разговор не засчитывает прохождение курса.</Text>
          {dialogueTurns >= 2 && <Pressable onPress={() => setGoalSummaryOpen(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.mint }}>{goalSummaryOpen ? 'Свернуть итог по цели' : 'Посмотреть итог по цели'}</Text></Pressable>}
          {dialogueTurns >= 2 && goalSummaryOpen && <>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Что получилось применить</Text>
            {dialogueEvidence.map(item => <Text key={item.prompt} style={{ color: item.matched ? colors.mint : colors.textMuted, lineHeight: 22 }}>{item.matched ? '✓ Есть совпадение с образцом' : '○ Пока нет совпадения с образцом'}: {item.prompt}</Text>)}
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Проверяются только подготовленные формулировки в твоих репликах. Другой правильный ответ может не совпасть; это не оценка качества всего диалога.</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!coursePractice.goalReached }} onPress={() => setCoursePractice(value => ({ ...value, goalReached: !value.goalReached }))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.mint }}>{coursePractice.goalReached ? '✓ По моей оценке, цель разговора достигнута' : 'Отметить: я смог добиться цели разговора'}</Text></Pressable>
            {!!coursePractice.phrases?.length && <Text style={{ color: colors.text, lineHeight: 23 }}>Полезные выражения: {coursePractice.phrases.map(item => item.english).join(' · ')}</Text>}
          </>}
          <Pressable onPress={() => setLessonHelp(value => Math.min(3, value + 1))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.purple, fontWeight: '700' }}>{lessonHelp === 0 ? 'Нужен намёк' : lessonHelp === 1 ? 'Покажи начало фразы' : 'Покажи пример'}</Text></Pressable>
          {lessonHelp > 0 && <Text style={{ color: colors.text, lineHeight: 23 }}>{lessonHelp === 1 ? 'Ответь на один вопрос собеседника. Используй выражения изученной темы.' : lessonHelp === 2 ? `${coursePractice.phrases?.[0]?.english?.split(' ').slice(0, 3).join(' ') || 'Попробуй короткую фразу'}…` : coursePractice.phrases?.[0]?.english || 'Открой примеры в учебной теме.'}</Text>}
          {lessonHelp >= 3 && !!coursePractice.phrases?.[0] && <Pressable onPress={() => addReviewPhrase({ ...coursePractice.phrases[0], topic })} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.mint }}>Добавить эту фразу в повторение</Text></Pressable>}
        </ScrollView>}
      </View>}

      {!modelReady && !error ? (
        <View style={styles.loadingModel}>
          <ActivityIndicator color={model.color} size="large" />
          <Text style={styles.modelLoadingTitle}>Запускаю преподавателя</Text>
          <Text style={styles.smallMuted}>Первый запуск может занять несколько секунд. Модель загружается только в память iPhone.</Text>
        </View>
      ) : (
        <FlatList
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          data={messages}
          keyExtractor={item => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          keyboardDismissMode="interactive"
          onScroll={event => { const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent; followTail.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80; }}
          scrollEventThrottle={80}
          onContentSizeChange={() => { if (followTail.current) scrollRef.current?.scrollToEnd({ animated: false }); }}
          onLayout={() => { if (followTail.current) scrollRef.current?.scrollToEnd({ animated: false }); }}
          ListHeaderComponent={mission && !interview ? (
            <View style={[styles.missionCard, missionProgress.completed && styles.missionCardDone]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: missionOpen }} onPress={() => setMissionOpen(value => !value)} style={[styles.missionTop, { minHeight: 44 }]}>
                <View style={[styles.missionIcon, missionProgress.completed && { backgroundColor: "rgba(46,211,183,0.16)" }]}>
                  <Ionicons name={missionProgress.completed ? "checkmark" : "flag"} size={20} color={missionProgress.completed ? colors.mint : colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.missionLabel}>МИССИЯ ДНЯ</Text>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                </View>
                <Ionicons name={missionOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </Pressable>
              {missionOpen && <>
              <Text style={styles.missionDescription}>{mission.description}</Text>
              <ProgressBar value={missionProgress.current / Math.max(1, missionProgress.target)} color={missionProgress.completed ? colors.mint : colors.orange} height={6} />
              {missionProgress.completed ? <Text style={styles.missionDone}>Миссия выполнена — Lingo запомнил результат</Text> : null}
              <Pressable onPress={onDirector} style={styles.routeLink}><Ionicons name="sparkles" size={15} color={colors.purple} /><Text style={styles.routeLinkText}>Открыть полный ИИ-маршрут</Text><Ionicons name="chevron-forward" size={16} color={colors.purple} /></Pressable>
              </>}
            </View>
          ) : null}
          renderItem={({ item: message, index }) => {
            const note = message.role === "assistant" && message.id !== "streaming" ? noteForMessage(message, index) : null;
            const saved = note && progress.notebook?.some((item) => item.id === note.id);
            return (
            <View key={message.id} style={[styles.messageRow, message.role === "user" && styles.messageRowUser]}>
              <View style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.aiBubble]}>
                {message.role === "assistant" ? <Text style={styles.lingoLabel}>✦ LINGO</Text> : null}
                {message.role === "user" && message.kind === "command" ? <Text style={styles.commandLabel}>ДЕЙСТВИЕ С ОТВЕТОМ</Text> : null}
                {message.id === "streaming" && !message.content ? (
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.purple} />
                    <Text style={styles.smallMuted}>{replyStage === 'rewriting' ? 'Уточняю формулировку…' : replyStage === 'checking' ? 'Проверяю ответ…' : 'Думаю на устройстве…'}</Text>
                  </View>
                ) : (
                  <Text style={styles.messageText}>{message.displayContent || message.content}</Text>
                )}
                {message.role === "assistant" && message.content && message.id !== "streaming" ? (
                  <>
                    <View style={styles.bubbleActions}>
                      <Pressable onPress={() => speakMessage(message.content, message.action === 'translate' ? 'ru-RU' : 'en-US')} style={styles.speakButton}>
                        <Ionicons name="volume-medium" size={17} color={colors.purple} />
                        <Text style={styles.speakText}>Озвучить</Text>
                      </Pressable>
                      {!message.id.startsWith("welcome") ? <Pressable onPress={() => setOpenActionsId((current) => current === message.id ? null : message.id)} style={styles.speakButton}><Ionicons name="options" size={16} color={openActionsId === message.id ? colors.mint : colors.textMuted} /><Text style={[styles.speakText, { color: openActionsId === message.id ? colors.mint : colors.textMuted }]}>Действия</Text></Pressable> : null}
                    </View>
                    {!!message.translation && <View style={styles.responsePanel}>
                      <Text style={styles.responsePanelTitle}>ПЕРЕВОД</Text>
                      <Text style={styles.messageText}>{message.translation}</Text>
                      <Pressable onPress={() => speakMessage(message.translation, 'ru-RU')} style={styles.speakButton}>
                        <Ionicons name="volume-medium" size={17} color={colors.purple} />
                        <Text style={styles.speakText}>Озвучить перевод</Text>
                      </Pressable>
                    </View>}
                    {openActionsId === message.id && !message.id.startsWith("welcome") ? <View style={styles.feedbackRow}>
                      <Text style={styles.feedbackLabel}>Полезный ответ?</Text>
                      <Pressable hitSlop={8} onPress={() => recordFeedback(message, "up")} style={[styles.feedbackButton, feedbackMap[message.id]?.rating === "up" && styles.feedbackButtonUp]}><Ionicons name={feedbackMap[message.id]?.rating === "up" ? "thumbs-up" : "thumbs-up-outline"} size={15} color={feedbackMap[message.id]?.rating === "up" ? colors.mint : colors.textMuted} /></Pressable>
                      <Pressable hitSlop={8} onPress={() => dislike(message)} style={[styles.feedbackButton, feedbackMap[message.id]?.rating === "down" && styles.feedbackButtonDown]}><Ionicons name={feedbackMap[message.id]?.rating === "down" ? "thumbs-down" : "thumbs-down-outline"} size={15} color={feedbackMap[message.id]?.rating === "down" ? colors.pink : colors.textMuted} /></Pressable>
                    </View> : null}
                    {openActionsId === message.id ? <View style={styles.responsePanel}>
                      {note && <Pressable onPress={() => toggleNotebook(note)} style={[styles.speakButton, { minHeight: 44 }]}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.orange} /><Text style={styles.speakText}>{saved ? 'Сохранено в тетради' : 'Сохранить в тетрадь'}</Text></Pressable>}
                      {!interviewEnded && <Text style={styles.responsePanelTitle}>ИЗМЕНИТЬ ОТВЕТ</Text>}
                      <View style={styles.responseActionGrid}>{RESPONSE_ACTIONS.filter(action => !interviewEnded || action.id === 'translate').map((action) => <Pressable key={action.id} disabled={generating} onPress={() => runResponseAction(message, action)} style={styles.responseAction}><Ionicons name={action.icon} size={16} color={colors.purple} /><Text style={styles.responseActionText}>{action.title}</Text></Pressable>)}</View>
                      <Text style={styles.responsePanelTitle}>ОТКРЫТЬ УПРАЖНЕНИЕ</Text>
                      <View style={styles.toolGrid}>
                        <Pressable onPress={() => onNavigate?.({ type: "tab", target: "review" })} style={styles.toolButton}><Ionicons name="library" size={16} color={colors.mint} /><Text style={styles.toolText}>Слова</Text></Pressable>
                        <Pressable onPress={() => onNavigate?.({ type: "overlay", target: "tenses" })} style={styles.toolButton}><Ionicons name="time" size={16} color={colors.orange} /><Text style={styles.toolText}>Времена</Text></Pressable>
                        <Pressable onPress={() => onNavigate?.({ type: "overlay", target: "grammarAcademy" })} style={styles.toolButton}><Ionicons name="school" size={16} color={colors.blue} /><Text style={styles.toolText}>Грамматика</Text></Pressable>
                        <Pressable onPress={() => onNavigate?.({ type: "overlay", target: "dictation" })} style={styles.toolButton}><Ionicons name="headset" size={16} color={colors.pink} /><Text style={styles.toolText}>Диктант</Text></Pressable>
                      </View>
                    </View> : null}
                  </>
                ) : null}
              </View>
            </View>
          ); }}
          ListFooterComponent={<>
          {!interview && !!followUp && !generating && !retryRequest && <View style={styles.exerciseCard}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: practiceOpenFor === lastLearner.id }} onPress={() => setPracticeOpenFor(current => current === lastLearner.id ? null : lastLearner.id)} style={styles.routeLink}>
              <Text style={styles.speakText}>{practiceOpenFor === lastLearner.id ? 'Свернуть закрепление' : 'Закрепить на новой фразе'}</Text>
            </Pressable>
            {practiceOpenFor === lastLearner.id && <>
              <Text style={styles.smallMuted}>{followUp.explanation}</Text>
              <MiniLesson exercises={followUpExercises} />
              <Pressable accessibilityRole="button" disabled={practiceSavedFor === lastLearner.id} onPress={() => {
                addConstructionReview(followUp.construction);
                setPracticeSavedFor(lastLearner.id);
              }} style={styles.routeLink}><Text style={styles.speakText}>{practiceSavedFor === lastLearner.id ? 'Добавлено на завтра' : 'Повторить завтра'}</Text></Pressable>
            </>}
          </View>}
          {interview ? (
            <View style={{ gap: 12, paddingTop: 12 }}>
              {!interviewEnded && !generating && !retryRequest && <>
                <View style={styles.exerciseCard}>
                  <Text style={styles.exerciseCount}>Собеседование · шаг {interview.completed.length + 1} из 3</Text>
                  <Text style={styles.smallMuted}>{interview.next.goal}</Text>
                  <Text accessibilityLiveRegion="polite" style={styles.exercisePrompt}>{interview.next.question}</Text>
                  <Pressable accessibilityRole="button" onPress={() => speakMessage(interview.next.question)} style={styles.routeLink}><Text style={styles.speakText}>Послушать вопрос</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: interviewHint === interview.next.id }} onPress={() => setInterviewHint(value => value === interview.next.id ? null : interview.next.id)} style={styles.routeLink}>
                    <Text style={styles.speakText}>{interviewHint === interview.next.id ? 'Скрыть подсказку' : 'Подсказка'}</Text>
                  </Pressable>
                  {interviewHint === interview.next.id && <Text style={styles.smallMuted}>{interview.next.hint}</Text>}
                  {lastInterviewAttempt?.step.id === interview.next.id && /[a-z]{2,}/i.test(lastInterviewAttempt.text) && <Pressable accessibilityRole="button" style={styles.routeLink} onPress={() => {
                    setMessages(current => current.map(item => item.id === lastInterviewAttempt.id ? { ...item, interviewConfirmed: true } : item));
                  }}><Text style={styles.speakText}>Мой ответ по теме · следующий шаг</Text></Pressable>}
                </View>
                {interview.attempts.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: interviewSummary }} onPress={() => setInterviewSummary(value => !value)} style={styles.routeLink}>
                  <Text style={styles.speakText}>{interviewSummary ? 'Свернуть разбор' : 'Короткий разбор'}</Text>
                </Pressable>}
              </>}
              {!generating && review && <>
                <View style={styles.exerciseCard}>
                  <Text style={styles.exercisePrompt}>Итог собеседования</Text>
                  <Text style={styles.smallMuted}>Пройдено шагов — {review.completed.length} из 3.</Text>
                  {review.completed.some(item => item.confirmed) && <Text style={styles.smallMuted}>Ты самостоятельно подтвердил часть ответов по теме.</Text>}
                  {review.strength && <Text style={styles.exerciseOptionText}>Удачная фраза — «{review.strength.text}»</Text>}
                  {review.mistake ? <>
                    <Text style={styles.exerciseOptionText}>Твоя фраза — «{review.mistake.original}»</Text>
                    <Text style={styles.exerciseOptionText}>Исправление — «{review.mistake.corrected}»</Text>
                    <Text style={styles.smallMuted}>{review.mistake.explanation}</Text>
                  </> : <Text style={styles.smallMuted}>Среди проверяемых конструкций явной ошибки не найдено.</Text>}
                </View>
                <MiniLesson exercises={interviewExercises} />
                {interviewEnded && <Pressable accessibilityRole="button" onPress={newConversation} style={styles.routeLink}><Text style={styles.speakText}>Начать новое собеседование</Text></Pressable>}
              </>}
            </View>
          ) : dialogueTurns >= 2 ? (
            <Pressable disabled={generating} onPress={runAnalysis} style={styles.analysisBanner}>
              <View style={styles.analysisBannerIcon}>
                <Ionicons name="school" size={23} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.analysisBannerTitle}>Разобрать разговор</Text>
                <Text style={styles.smallMuted}>Оценка, ошибки, новые слова и мини-урок</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
          </>}
        />
      )}

      {error ? (
        <View style={styles.chatError} accessibilityLiveRegion="polite">
          <View style={styles.chatErrorMessage}>
            <Ionicons name="alert-circle" color={colors.orange} size={18} />
            <Text style={styles.chatErrorText}>{error}</Text>
          </View>
          {!!retryRequest && <View style={styles.chatErrorActions}>
            <Pressable accessibilityRole="button" onPress={() => submitMessage(retryRequest.text, { ...retryRequest.options, retry: true })} style={styles.chatErrorAction}>
              <Text style={styles.speakText}>Повторить ответ</Text>
            </Pressable>
            {retryRequest.options.kind !== 'command' && <Pressable accessibilityRole="button" onPress={editFailedReply} style={styles.chatErrorAction}>
              <Text style={styles.speakText}>Изменить реплику</Text>
            </Pressable>}
          </View>}
        </View>
      ) : null}

      {interviewEnded && generating && <View style={[styles.composer, { marginBottom: 82, justifyContent: 'flex-end' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Остановить ответ" onPress={stop} style={styles.sendButton}>
          <Ionicons name="stop" size={22} color={colors.onAccent} />
        </Pressable>
      </View>}
      {!interviewEnded && <View style={[styles.composer, { marginBottom: keyboardVisible ? 0 : 82 }]}>
        <Pressable onPress={startListening} disabled={!modelReady || generating || speechTranscribing} style={[styles.micButton, listening && styles.micActive]}>
          {speechTranscribing ? <ActivityIndicator size="small" color={colors.text} /> : <Ionicons name={listening ? "stop" : "mic"} size={22} color={colors.text} />}
        </Pressable>
        <TextInput
          accessibilityLabel="Сообщение Lingo"
          value={input}
          onChangeText={setInput}
          placeholder={speechTranscribing ? "Распознаю на iPhone…" : listening ? `Слушаю${speechModel ? " · Whisper" : ""}…` : "Напиши по-английски…"}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={800}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={send}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={generating ? 'Остановить ответ' : 'Отправить сообщение'}
          onPress={generating ? stop : send}
          disabled={!generating && (!input.trim() || !modelReady)}
          style={[styles.sendButton, !generating && (!input.trim() || !modelReady) && { opacity: 0.35 }]}
        >
          <Ionicons name={generating ? "stop" : "arrow-up"} size={22} color={colors.onAccent} />
        </Pressable>
      </View>}
    </View>
  );
}

function ConversationAnalysis({ analysis, analyzing, level, topic, progress, onAddWord, onBack, onRetry }) {
  useTheme();
  const [addedWords, setAddedWords] = useState([]);
  const existingWords = new Set(
    (progress.customWords || []).map((item) => item.english.trim().toLowerCase()),
  );

  const addWord = (word) => {
    onAddWord(word.english, word.russian, word.example || `${word.english} — ${word.russian}`);
    setAddedWords((current) => [...current, word.english.toLowerCase()]);
  };

  return (
    <View style={styles.analysisPage}>
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>Разбор разговора</Text>
          <Text style={styles.chatStatus}>{level} · {topic} · локальный анализ</Text>
        </View>
        {!analyzing && analysis ? (
          <Pressable onPress={onRetry} style={styles.headerButton}>
            <Ionicons name="refresh" size={21} color={colors.text} />
          </Pressable>
        ) : <View style={{ width: 42 }} />}
      </View>

      {analyzing ? (
        <View style={styles.analysisLoading}>
          <View style={styles.analysisPulse}>
            <Ionicons name="sparkles" size={34} color={colors.purple} />
          </View>
          <Text style={styles.modelLoadingTitle}>Анализирую разговор</Text>
          <Text style={[styles.smallMuted, { textAlign: "center" }]}>ИИ проверяет только твои реплики, ищет реальные ошибки и составляет персональный мини-урок.</Text>
          <ActivityIndicator color={colors.purple} size="small" />
        </View>
      ) : analysis ? (
        <ScrollView contentContainerStyle={styles.analysisContent} showsVerticalScrollIndicator={false}>
          <View style={styles.analysisHero}>
            <Text style={styles.eyebrow}>ИТОГ РАЗГОВОРА</Text>
            <Text style={styles.analysisSummary}>{analysis.summary}</Text>
            {!!analysis.scope && <Text style={styles.smallMuted}>Разобраны последние {analysis.scope.included} из {analysis.scope.total} реплик. Оценки — рекомендация локальной модели, а не результат экзамена.</Text>}
          </View>

          <Text style={styles.analysisSection}>ТВОИ ОЦЕНКИ</Text>
          <View style={styles.scoreGrid}>
            {[
              ["grammar", "Грамматика", "school", colors.purple],
              ["vocabulary", "Словарь", "library", colors.mint],
              ["fluency", "Связность", "chatbubbles", colors.orange],
            ].map(([key, title, icon, color]) => (
              <View key={key} style={styles.scoreCard}>
                <Ionicons name={icon} size={20} color={color} />
                <Text style={[styles.scoreValue, { color }]}>{analysis.scores?.[key] || 0}</Text>
                <Text style={styles.scoreLabel}>{title}</Text>
              </View>
            ))}
          </View>

          {analysis.strengths?.length ? (
            <>
              <Text style={styles.analysisSection}>ЧТО УЖЕ ХОРОШО</Text>
              <View style={styles.strengthCard}>
                {analysis.strengths.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.strengthRow}>
                    <Ionicons name="checkmark-circle" size={19} color={colors.mint} />
                    <Text style={styles.analysisText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.analysisSection}>ИСПРАВЛЕНИЯ</Text>
          {analysis.mistakes?.length ? analysis.mistakes.map((mistake, index) => (
            <View key={`${mistake.original}-${index}`} style={styles.mistakeCard}>
              <Text style={styles.mistakeNumber}>ОШИБКА {index + 1}</Text>
              <View style={styles.phraseRow}>
                <Ionicons name="close-circle" size={18} color={colors.pink} />
                <Text style={[styles.phraseText, { color: "#FF9BB7" }]}>{mistake.original}</Text>
              </View>
              <View style={styles.phraseRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.mint} />
                <Text style={[styles.phraseText, { color: colors.mint }]}>{mistake.corrected}</Text>
              </View>
              <Text style={styles.mistakeExplain}>{mistake.explanation}</Text>
            </View>
          )) : (
            <View style={styles.noMistakes}>
              <Text style={{ fontSize: 28 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Серьёзных ошибок нет</Text>
                <Text style={styles.smallMuted}>Мини-урок ниже поможет сделать речь ещё естественнее.</Text>
              </View>
            </View>
          )}

          {analysis.words?.length ? (
            <>
              <Text style={styles.analysisSection}>СЛОВА ИЗ РАЗГОВОРА</Text>
              {analysis.words.map((word, index) => {
                const added = existingWords.has(word.english.toLowerCase()) || addedWords.includes(word.english.toLowerCase());
                return (
                  <View key={`${word.english}-${index}`} style={styles.wordCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wordEnglish}>{word.english}</Text>
                      <Text style={styles.wordRussian}>{word.russian}</Text>
                      {word.example ? <Text style={styles.wordExample}>{word.example}</Text> : null}
                    </View>
                    <Pressable disabled={added} onPress={() => addWord(word)} style={[styles.wordAdd, added && styles.wordAdded]}>
                      <Ionicons name={added ? "checkmark" : "add"} size={21} color={added ? colors.mint : "white"} />
                    </Pressable>
                  </View>
                );
              })}
            </>
          ) : null}

          <Text style={styles.analysisSection}>ПЕРСОНАЛЬНЫЙ МИНИ-УРОК</Text>
          <MiniLesson exercises={analysis.exercises || []} />
        </ScrollView>
      ) : (
        <View style={styles.analysisLoading}>
          <Text style={styles.modelLoadingTitle}>Разбор не готов</Text>
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.startText}>Попробовать ещё раз</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MiniLesson({ exercises }) {
  useTheme();
  const [selected, setSelected] = useState({});
  useEffect(() => {
    setSelected({});
  }, [exercises]);
  if (!exercises.length) {
    return (
      <View style={styles.noMistakes}>
        <Ionicons name="construct" size={24} color={colors.orange} />
        <Text style={styles.smallMuted}>Для этого короткого разговора заданий пока недостаточно.</Text>
      </View>
    );
  }
  const finished = exercises.every((_, index) => Object.prototype.hasOwnProperty.call(selected, index));
  const score = exercises.filter((item, index) => evaluateExercise(item, (selected[index])).correct).length;
  return (
    <View style={{ gap: 12 }}>
      {exercises.map((exercise, index) => {
        const choice = selected[index];
        const hasChoice = Object.prototype.hasOwnProperty.call(selected, index);
        const cleanKey = (value) => String(value || "").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim();
        const promptKey = cleanKey(exercise.prompt);
        const answerKey = cleanKey(exercise.answer);
        const promptRevealsAnswer = answerKey.length > 5 && (promptKey === answerKey || promptKey.includes(answerKey));
        const visiblePrompt = promptRevealsAnswer
          ? "Выбери английскую фразу, которая лучше всего подходит к ситуации:"
          : exercise.prompt;
        const options = balancedOptions(exercise.options, exercise.answer, index, visiblePrompt);
        return (
          <View key={`${exercise.prompt}-${index}`} style={styles.exerciseCard}>
            <Text style={styles.exerciseCount}>ЗАДАНИЕ {index + 1} ИЗ {exercises.length}</Text>
            <Text style={styles.exercisePrompt}>{visiblePrompt}</Text>
            <View style={{ gap: 8 }}>
              {options.map((option) => {
                const correct = hasChoice && evaluateExercise(exercise, (option)).correct;
                const wrong = hasChoice && choice === option && !evaluateExercise(exercise, (option)).correct;
                return (
                  <Pressable
                    key={option}
                    disabled={hasChoice}
                    onPress={() => setSelected((current) => ({ ...current, [index]: option }))}
                    style={[styles.exerciseOption, correct && styles.exerciseCorrect, wrong && styles.exerciseWrong]}
                  >
                    <Text style={styles.exerciseOptionText}>{option}</Text>
                    {correct ? <Ionicons name="checkmark-circle" size={19} color={colors.mint} /> : null}
                    {wrong ? <Ionicons name="close-circle" size={19} color={colors.pink} /> : null}
                  </Pressable>
                );
              })}
            </View>
            {hasChoice ? <Text style={styles.exerciseExplain}>{exercise.explanation}</Text> : null}
          </View>
        );
      })}
      {finished ? (
        <View style={styles.lessonResult}>
          <Text style={{ fontSize: 30 }}>{score === exercises.length ? "🏆" : "💪"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>Мини-урок завершён</Text>
            <Text style={styles.smallMuted}>{score} из {exercises.length} правильных · ошибки можно повторить, создав новый разбор.</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = createThemedStyles(() => ({
  page: { flex: 1, backgroundColor: colors.background },
  modelContent: { padding: 24, paddingBottom: 116 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: colors.background },
  muted: { color: colors.textMuted, fontSize: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  aiLogo: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.7, marginBottom: 3 },
  title: { color: colors.text, fontSize: 29, fontWeight: "900" },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 18 },
  privacyCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(46,211,183,0.09)", borderColor: "rgba(46,211,183,0.22)", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 18 },
  pronunciationBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  pronunciationIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  directorBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(124,92,252,0.11)", borderColor: "rgba(124,92,252,0.32)", borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 12 },
  directorIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  privacyTitle: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  smallMuted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  storage: { color: colors.textMuted, fontSize: 11 },
  modelCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 17, marginBottom: 14 },
  modelTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  modelIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  modelTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  recommended: { color: colors.purple, backgroundColor: "rgba(124,92,252,0.14)", fontSize: 8, fontWeight: "900", letterSpacing: 0.7, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  modelSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  size: { fontSize: 13, fontWeight: "900" },
  modelFacts: { borderTopWidth: 1, borderColor: colors.border, marginTop: 14, paddingTop: 12, gap: 5 },
  fact: { color: colors.textMuted, fontSize: 11 },
  installButton: { marginTop: 14, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  installText: { fontSize: 14, fontWeight: "900" },
  installedActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  startButton: { flex: 1, minHeight: 48, borderRadius: 15, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  startText: { color: colors.text, fontSize: 14, fontWeight: "900" },
  deleteButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" },
  downloadBox: { marginTop: 15 },
  downloadLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  downloadText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  cancelButton: { alignSelf: "center", padding: 9, marginTop: 4 },
  cancelText: { color: colors.pink, fontSize: 12, fontWeight: "800" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,92,138,0.1)", padding: 14, borderRadius: 14 },
  errorText: { color: colors.text, fontSize: 12, lineHeight: 17, flex: 1 },
  licenseText: { color: colors.textMuted, opacity: 0.7, textAlign: "center", fontSize: 10, marginTop: 8 },
  chatPage: { flex: 1, backgroundColor: colors.background },
  chatHeader: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: colors.border },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  chatTitle: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  chatStatus: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 5 },
  headerButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  chatHeaderButton: { width: 54, height: 56, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 },
  chatHeaderButtonPrimary: { backgroundColor: colors.accentSoft, borderColor: colors.purple },
  chatHeaderButtonPressed: { opacity: 0.65, transform: [{ scale: 0.94 }] },
  chatHeaderButtonText: { color: colors.textMuted, fontSize: 8, lineHeight: 10, fontWeight: "800" },
  settingsLabel: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  settingsChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  settingsChoice: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  settingsChoiceActive: { backgroundColor: colors.accentSoft, borderColor: colors.purple },
  settingsChoiceText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  courseGoal: { backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  courseGoalToggle: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseGoalTitle: { flexShrink: 1, flexGrow: 1, color: colors.mint, fontSize: 13, fontWeight: '800' },
  courseGoalDetails: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  loadingModel: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 12 },
  modelLoadingTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24, gap: 12 },
  missionCard: { backgroundColor: "rgba(255,159,67,0.08)", borderWidth: 1, borderColor: "rgba(255,159,67,0.32)", borderRadius: 19, padding: 14, gap: 10 },
  missionCardDone: { backgroundColor: "rgba(46,211,183,0.07)", borderColor: "rgba(46,211,183,0.3)" },
  missionTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  missionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,159,67,0.14)", alignItems: "center", justifyContent: "center" },
  missionLabel: { color: colors.orange, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  missionTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 2 },
  missionCount: { color: colors.orange, fontSize: 16, fontWeight: "900" },
  missionDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  missionDone: { color: colors.mint, fontSize: 10, fontWeight: "800" },
  routeLink: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  routeLinkText: { color: colors.purple, fontSize: 10, fontWeight: "900" },
  messageRow: { flexDirection: "row", justifyContent: "flex-start" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { maxWidth: "88%", padding: 14, borderRadius: 18 },
  aiBubble: { backgroundColor: colors.card, borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: colors.accentSoft, borderTopRightRadius: 6 },
  lingoLabel: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  commandLabel: { color: colors.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  qualityBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.cardLight, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginBottom: 8 },
  qualityText: { color: colors.textMuted, fontSize: 8, fontWeight: "800" },
  messageText: { color: colors.text, fontSize: 16, lineHeight: 25 },
  thinkingRow: { flexDirection: "row", gap: 9, alignItems: "center" },
  speakButton: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-start" },
  speakText: { color: colors.purple, fontSize: 11, fontWeight: "800" },
  bubbleActions: { flexDirection: "row", alignItems: "center", gap: 18 },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border },
  feedbackLabel: { color: colors.textMuted, fontSize: 9, flex: 1 },
  feedbackButton: { width: 30, height: 28, borderRadius: 9, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" },
  feedbackButtonUp: { backgroundColor: "rgba(46,211,183,0.12)", borderWidth: 1, borderColor: "rgba(46,211,183,0.25)" },
  feedbackButtonDown: { backgroundColor: "rgba(255,92,138,0.12)", borderWidth: 1, borderColor: "rgba(255,92,138,0.25)" },
  responsePanel: { marginTop: 10, backgroundColor: colors.cardLight, borderRadius: 15, padding: 10, gap: 8 },
  responsePanelTitle: { color: colors.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  responseActionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  responseAction: { minWidth: "30%", flexGrow: 1, height: 36, borderRadius: 10, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 7 },
  responseActionText: { color: colors.text, fontSize: 9, fontWeight: "800" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toolButton: { width: "48%", flexGrow: 1, height: 38, borderRadius: 10, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  toolText: { color: colors.text, fontSize: 9, fontWeight: "800" },
  chatError: { marginHorizontal: 14, marginBottom: 7, backgroundColor: "rgba(255,159,67,0.12)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  chatErrorMessage: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  chatErrorText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 },
  chatErrorActions: { flexDirection: "row", flexWrap: "wrap", columnGap: 14 },
  chatErrorAction: { minHeight: 44, justifyContent: "center" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  micButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" },
  micActive: { backgroundColor: colors.pink },
  input: { flex: 1, minHeight: 46, maxHeight: 108, color: colors.text, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14 },
  sendButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accentFill, alignItems: "center", justifyContent: "center" },
  backgroundHint: { color: colors.mint, fontSize: 10, textAlign: "center", marginTop: 9 },
  historyContent: { padding: 16, paddingBottom: 110, gap: 10 },
  historyCard: { minHeight: 74, borderRadius: 18, padding: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 11 },
  historyCardActive: { borderColor: colors.purple, backgroundColor: "rgba(124,92,252,0.09)" },
  historyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(124,92,252,0.13)", alignItems: "center", justifyContent: "center" },
  historyTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  historyMeta: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  emptyHistory: { alignItems: "center", paddingTop: 90, gap: 10 },
  analysisBanner: { minHeight: 72, borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,159,67,0.35)", backgroundColor: "rgba(255,159,67,0.09)", padding: 13, flexDirection: "row", alignItems: "center", gap: 11, marginTop: 4 },
  analysisBannerIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "rgba(255,159,67,0.14)", alignItems: "center", justifyContent: "center" },
  analysisBannerTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginBottom: 3 },
  keyboardToolbar: { height: 46, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 },
  keyboardToolbarText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  keyboardDone: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentSoft, paddingHorizontal: 13, height: 32, borderRadius: 11 },
  keyboardDoneText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  analysisPage: { flex: 1, backgroundColor: colors.background, paddingBottom: 86 },
  analysisContent: { padding: 18, paddingBottom: 36 },
  analysisLoading: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 38, gap: 13 },
  analysisPulse: { width: 76, height: 76, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,92,252,0.13)", borderWidth: 1, borderColor: "rgba(124,92,252,0.35)" },
  analysisHero: { backgroundColor: "rgba(124,92,252,0.12)", borderWidth: 1, borderColor: "rgba(124,92,252,0.3)", padding: 18, borderRadius: 21 },
  analysisSummary: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: 8 },
  analysisSection: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 24, marginBottom: 10 },
  scoreGrid: { flexDirection: "row", gap: 9 },
  scoreCard: { flex: 1, minHeight: 105, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 4 },
  scoreValue: { fontSize: 24, fontWeight: "900" },
  scoreLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "700" },
  strengthCard: { backgroundColor: "rgba(46,211,183,0.08)", borderWidth: 1, borderColor: "rgba(46,211,183,0.22)", borderRadius: 18, padding: 15, gap: 11 },
  strengthRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  analysisText: { color: colors.text, fontSize: 13, lineHeight: 18, flex: 1 },
  mistakeCard: { backgroundColor: colors.card, borderRadius: 19, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 10 },
  mistakeNumber: { color: colors.orange, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 11 },
  phraseRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  phraseText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  mistakeExplain: { color: colors.textMuted, fontSize: 12, lineHeight: 18, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, marginTop: 3 },
  noMistakes: { backgroundColor: colors.card, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  wordCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 9 },
  wordEnglish: { color: colors.text, fontSize: 17, fontWeight: "900" },
  wordRussian: { color: colors.mint, fontSize: 12, fontWeight: "700", marginTop: 3 },
  wordExample: { color: colors.textMuted, fontSize: 11, fontStyle: "italic", marginTop: 6 },
  wordAdd: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  wordAdded: { backgroundColor: "rgba(46,211,183,0.13)", borderWidth: 1, borderColor: "rgba(46,211,183,0.28)" },
  exerciseCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15 },
  exerciseCount: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  exercisePrompt: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "800", marginTop: 8, marginBottom: 13 },
  exerciseOption: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardLight, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  exerciseCorrect: { borderColor: colors.mint, backgroundColor: "rgba(46,211,183,0.1)" },
  exerciseWrong: { borderColor: colors.pink, backgroundColor: "rgba(255,92,138,0.1)" },
  exerciseOptionText: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: "700", flex: 1 },
  exerciseExplain: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 11 },
  lessonResult: { backgroundColor: "rgba(124,92,252,0.12)", borderWidth: 1, borderColor: "rgba(124,92,252,0.3)", borderRadius: 19, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  retryButton: { minHeight: 48, borderRadius: 15, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
}));
