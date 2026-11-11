import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { colors } from "../theme";
import { ProgressBar } from "../components/UI";
import { speak, stopSpeech } from "../utils/speech";
import { useProgress } from "../store/ProgressContext";
import {
  AI_MODELS,
  cancelModelDownload,
  completeTutorMessage,
  deleteTutorSession,
  deleteModel,
  downloadModel,
  getActiveModelId,
  getDownloadState,
  getFreeSpace,
  inspectModels,
  loadModel,
  loadTutorSessions,
  saveTutorSession,
  setActiveModelId,
  stopGeneration,
  subscribeToDownload,
} from "../services/localAi";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TOPICS = ["Свободный разговор", "Путешествия", "Работа", "Грамматика", "Экзамен"];

const welcomeFor = (level, topic) => ({
  id: `welcome-${Date.now()}`,
  role: "assistant",
  content: `Привет! Я Lingo — твой локальный преподаватель. Сейчас уровень ${level}, тема «${topic}». Напиши или скажи фразу по-английски — я продолжу разговор и спокойно объясню ошибки.`,
});

function formatSpace(bytes) {
  if (!Number.isFinite(bytes)) return "";
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} ГБ`
    : `${Math.round(bytes / 1024 ** 2)} МБ`;
}

export default function AITutorScreen() {
  const [installed, setInstalled] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [screen, setScreen] = useState("models");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (openActive = false) => {
    const [state, storedId] = await Promise.all([inspectModels(), getActiveModelId()]);
    const usableId = state[storedId]?.installed ? storedId : null;
    const currentDownload = getDownloadState();
    setInstalled(state);
    setActiveId(usableId);
    if (usableId && openActive && currentDownload.status !== "downloading") setScreen("chat");
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh(true).catch(() => setLoading(false));
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
  if (screen === "chat" && activeModel) {
    return <TutorChat model={activeModel} onModels={() => setScreen("models")} />;
  }

  return (
    <ModelLibrary
      installed={installed}
      activeId={activeId}
      onRefresh={refresh}
      onStart={async (model) => {
        await setActiveModelId(model.id);
        setActiveId(model.id);
        setScreen("chat");
      }}
    />
  );
}

function ModelLibrary({ installed, activeId, onRefresh, onStart }) {
  const [download, setDownload] = useState(getDownloadState());
  const [freeSpace, setFreeSpace] = useState(null);
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    getFreeSpace().then(setFreeSpace);
  }, []);

  useEffect(() =>
    subscribeToDownload((state) => {
      setDownload(state);
      if (state.status === "completed") onRefresh();
      if (state.status === "error") setError(state.error);
    }),
  [onRefresh]);

  const install = async (model) => {
    cancelledRef.current = false;
    setError("");
    if (freeSpace && freeSpace < model.size * 1.25) {
      setError(`Недостаточно места. Освободите не менее ${model.sizeLabel}.`);
      return;
    }
    try {
      await downloadModel(model);
      await onRefresh();
    } catch (downloadError) {
      if (!cancelledRef.current) {
        setError(downloadError?.message || "Не удалось скачать модель. Проверьте интернет и свободное место.");
      }
    } finally {
    }
  };

  const cancel = async () => {
    cancelledRef.current = true;
    await cancelModelDownload();
    await onRefresh();
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
      style={styles.page}
      contentContainerStyle={styles.modelContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroRow}>
        <View style={styles.aiLogo}>
          <Ionicons name="sparkles" color="white" size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>РАБОТАЕТ НА IPHONE</Text>
          <Text style={styles.title}>ИИ-преподаватель</Text>
        </View>
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

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Выбери мощность</Text>
        {freeSpace ? <Text style={styles.storage}>Свободно {formatSpace(freeSpace)}</Text> : null}
      </View>

      {AI_MODELS.map((model) => {
        const isInstalled = installed[model.id]?.installed;
        const isDownloading = download.status === "downloading" && download.modelId === model.id;
        const blocked = download.status === "downloading" && !isDownloading;
        return (
          <View
            key={model.id}
            style={[
              styles.modelCard,
              (activeId === model.id || isDownloading) && { borderColor: model.color },
            ]}
          >
            <View style={styles.modelTop}>
              <View style={[styles.modelIcon, { backgroundColor: `${model.color}22` }]}>
                <Ionicons name={model.icon} size={23} color={model.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.modelTitle}>{model.title}</Text>
                  {model.recommended ? <Text style={styles.recommended}>СОВЕТУЕМ</Text> : null}
                </View>
                <Text style={styles.modelSubtitle}>{model.subtitle}</Text>
              </View>
              <Text style={[styles.size, { color: model.color }]}>{model.sizeLabel}</Text>
            </View>
            <View style={styles.modelFacts}>
              <Text style={styles.fact}>{model.model}</Text>
              <Text style={styles.fact}>{model.device}</Text>
            </View>

            {isDownloading ? (
              <View style={styles.downloadBox}>
                <View style={styles.downloadLabels}>
                  <Text style={styles.downloadText}>Загрузка {Math.round(download.progress * 100)}%</Text>
                  <Text style={styles.smallMuted}>{formatSpace(download.written)} из {model.sizeLabel}</Text>
                </View>
                <ProgressBar value={download.progress} color={model.color} height={8} />
                <Text style={styles.backgroundHint}>Можно перейти в другой раздел — загрузка продолжится</Text>
                <Pressable onPress={cancel} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Отменить загрузку</Text>
                </Pressable>
              </View>
            ) : isInstalled ? (
              <View style={styles.installedActions}>
                <Pressable onPress={() => onStart(model)} style={[styles.startButton, { backgroundColor: model.color }]}>
                  <Ionicons name="chatbubbles" size={19} color="white" />
                  <Text style={styles.startText}>{activeId === model.id ? "Продолжить диалог" : "Выбрать и запустить"}</Text>
                </Pressable>
                <Pressable onPress={() => remove(model)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={blocked}
                onPress={() => install(model)}
                style={[styles.installButton, blocked && { opacity: 0.35 }]}
              >
                <Ionicons name="cloud-download-outline" size={20} color={model.color} />
                <Text style={[styles.installText, { color: model.color }]}>Скачать модель</Text>
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
      <Text style={styles.licenseText}>Модели Qwen 2.5 Instruct · формат GGUF · лицензия Apache 2.0</Text>
    </ScrollView>
  );
}

function TutorChat({ model, onModels }) {
  const { progress, toggleNotebook } = useProgress();
  const [level, setLevel] = useState("A2");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState([welcomeFor("A2", TOPICS[0])]);
  const [sessionId, setSessionId] = useState(`ai-${Date.now()}`);
  const [sessions, setSessions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);
  const generationText = useRef("");
  const updateTimer = useRef(null);
  const historyReady = useRef(false);

  useEffect(() => {
    let mounted = true;
    loadModel(model, (value) => mounted && setLoadProgress(value))
      .then(() => mounted && setModelReady(true))
      .catch((loadError) => mounted && setError(loadError?.message || "Не удалось запустить модель"));
    return () => {
      mounted = false;
      if (updateTimer.current) clearTimeout(updateTimer.current);
      stopSpeech();
    };
  }, [model.id]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    historyReady.current = false;
    loadTutorSessions().then((allSessions) => {
      if (!mounted) return;
      const modelSessions = allSessions.filter((item) => item.modelId === model.id);
      setSessions(modelSessions);
      const recent = modelSessions[0];
      if (recent) {
        setSessionId(recent.id);
        setLevel(recent.level || "A2");
        setTopic(recent.topic || TOPICS[0]);
        setMessages(recent.messages?.length ? recent.messages : [welcomeFor("A2", TOPICS[0])]);
      }
      historyReady.current = true;
    });
    return () => {
      mounted = false;
    };
  }, [model.id]);

  useEffect(() => {
    if (!historyReady.current) return;
    const timer = setTimeout(() => {
      const cleanMessages = messages.filter((item) => item.id !== "streaming").slice(-60);
      const firstUser = cleanMessages.find((item) => item.role === "user")?.content;
      saveTutorSession({
        id: sessionId,
        modelId: model.id,
        modelTitle: model.title,
        level,
        topic,
        title: firstUser ? firstUser.slice(0, 42) : topic,
        messages: cleanMessages,
        createdAt: sessions.find((item) => item.id === sessionId)?.createdAt || Date.now(),
      }).then((allSessions) =>
        setSessions(allSessions.filter((item) => item.modelId === model.id)),
      );
    }, 450);
    return () => clearTimeout(timer);
  }, [messages, level, topic, sessionId, model.id]);

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

  const startListening = async () => {
    setError("");
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
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

  const updateStreamingMessage = (content) => {
    setMessages((current) =>
      current.map((item) => (item.id === "streaming" ? { ...item, content } : item)),
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text || generating || !modelReady) return;
    Keyboard.dismiss();
    setInput("");
    setError("");
    const userMessage = { id: `user-${Date.now()}`, role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { id: "streaming", role: "assistant", content: "" }]);
    setGenerating(true);
    generationText.current = "";
    try {
      const result = await completeTutorMessage({
        model,
        level,
        topic,
        messages: nextMessages,
        onToken: (token) => {
          generationText.current += token;
          if (!updateTimer.current) {
            updateTimer.current = setTimeout(() => {
              updateTimer.current = null;
              updateStreamingMessage(generationText.current);
            }, 70);
          }
        },
      });
      const finalText = (result?.text || generationText.current).trim();
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: finalText || "Попробуем ещё раз.",
      };
      const completedMessages = [...nextMessages, assistantMessage];
      setMessages(completedMessages);
      await saveTutorSession({
        id: sessionId,
        modelId: model.id,
        modelTitle: model.title,
        level,
        topic,
        title: nextMessages.find((item) => item.role === "user")?.content?.slice(0, 42) || topic,
        messages: completedMessages.slice(-60),
        createdAt: sessions.find((item) => item.id === sessionId)?.createdAt || Date.now(),
      });
    } catch (generationError) {
      setMessages((current) => current.filter((item) => item.id !== "streaming"));
      setError(generationError?.message || "Не удалось получить ответ");
    } finally {
      setGenerating(false);
    }
  };

  const stop = async () => {
    await stopGeneration();
    const partial = generationText.current.trim();
    setMessages((current) =>
      current.map((item) =>
        item.id === "streaming"
          ? {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: partial || "Ответ остановлен.",
            }
          : item,
      ),
    );
    setGenerating(false);
  };

  const speakMessage = (text) => speak(text, { language: "en-US", rate: 0.88 });
  const progressLabel = loadProgress > 0 ? `${Math.round(loadProgress * 100)}%` : "подготовка";

  const newConversation = () => {
    const id = `ai-${Date.now()}`;
    setSessionId(id);
    setMessages([welcomeFor(level, topic)]);
    setHistoryOpen(false);
  };

  const openSession = (session) => {
    setSessionId(session.id);
    setLevel(session.level || "A2");
    setTopic(session.topic || TOPICS[0]);
    setMessages(session.messages?.length ? session.messages : [welcomeFor(session.level || "A2", session.topic || TOPICS[0])]);
    setHistoryOpen(false);
  };

  const removeSession = async (session) => {
    const next = await deleteTutorSession(session.id);
    const filtered = next.filter((item) => item.modelId === model.id);
    setSessions(filtered);
    if (session.id === sessionId) newConversation();
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

  if (historyOpen) {
    return (
      <View style={styles.chatPage}>
        <View style={styles.chatHeader}>
          <Pressable onPress={() => setHistoryOpen(false)} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={22} color="white" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>История разговоров</Text>
            <Text style={styles.chatStatus}>Хранится только на этом iPhone</Text>
          </View>
          <Pressable onPress={newConversation} style={[styles.headerButton, { backgroundColor: colors.purple }]}>
            <Ionicons name="add" size={24} color="white" />
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
                <Text style={styles.historyMeta}>{session.level} · {session.topic} · {Math.max(0, (session.messages?.length || 1) - 1)} сообщений</Text>
              </View>
              <Pressable onPress={(event) => { event.stopPropagation(); removeSession(session); }} hitSlop={10}>
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
    <KeyboardAvoidingView
      style={styles.chatPage}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={styles.chatHeader}>
        <View style={[styles.onlineDot, { backgroundColor: modelReady ? colors.mint : colors.orange }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>Lingo · {model.title}</Text>
          <Text style={styles.chatStatus}>{modelReady ? "Локально · без интернета" : `Запуск модели · ${progressLabel}`}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setHistoryOpen(true)} style={styles.headerButton}>
            <Ionicons name="time-outline" size={22} color={colors.white} />
          </Pressable>
          <Pressable onPress={onModels} style={styles.headerButton}>
            <Ionicons name="hardware-chip-outline" size={22} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.optionsStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {LEVELS.map((item) => (
            <Pressable key={item} onPress={() => setLevel(item)} style={[styles.chip, level === item && styles.chipActive]}>
              <Text style={[styles.chipText, level === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
          {TOPICS.map((item) => (
            <Pressable key={item} onPress={() => setTopic(item)} style={[styles.topicChip, topic === item && styles.topicChipActive]}>
              <Text style={[styles.topicText, topic === item && { color: colors.white }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {!modelReady && !error ? (
        <View style={styles.loadingModel}>
          <ActivityIndicator color={model.color} size="large" />
          <Text style={styles.modelLoadingTitle}>Запускаю преподавателя</Text>
          <Text style={styles.smallMuted}>Первый запуск может занять несколько секунд. Модель загружается только в память iPhone.</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => {
            const note = message.role === "assistant" && message.id !== "streaming" ? noteForMessage(message, index) : null;
            const saved = note && progress.notebook?.some((item) => item.id === note.id);
            return (
            <View key={message.id} style={[styles.messageRow, message.role === "user" && styles.messageRowUser]}>
              <View style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.aiBubble]}>
                {message.role === "assistant" ? <Text style={styles.lingoLabel}>✦ LINGO</Text> : null}
                {message.id === "streaming" && !message.content ? (
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.purple} />
                    <Text style={styles.smallMuted}>Думаю на устройстве…</Text>
                  </View>
                ) : (
                  <Text style={styles.messageText}>{message.content}</Text>
                )}
                {message.role === "assistant" && message.content ? (
                  <View style={styles.bubbleActions}>
                    <Pressable onPress={() => speakMessage(message.content)} style={styles.speakButton}>
                      <Ionicons name="volume-medium" size={17} color={colors.purple} />
                      <Text style={styles.speakText}>Озвучить</Text>
                    </Pressable>
                    {note ? (
                      <Pressable onPress={() => toggleNotebook(note)} style={styles.speakButton}>
                        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={16} color={saved ? colors.orange : colors.textMuted} />
                        <Text style={[styles.speakText, saved && { color: colors.orange }]}>{saved ? "Сохранено" : "В тетрадь"}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          )})}
        </ScrollView>
      )}

      {error ? (
        <View style={styles.chatError}>
          <Ionicons name="alert-circle" color={colors.orange} size={18} />
          <Text style={styles.chatErrorText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.composer, { marginBottom: keyboardVisible ? 0 : 86 }]}>
        <Pressable onPress={startListening} disabled={!modelReady || generating} style={[styles.micButton, listening && styles.micActive]}>
          <Ionicons name={listening ? "stop" : "mic"} size={22} color="white" />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Слушаю…" : "Напиши по-английски…"}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={800}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={send}
        />
        <Pressable
          onPress={generating ? stop : send}
          disabled={!generating && (!input.trim() || !modelReady)}
          style={[styles.sendButton, !generating && (!input.trim() || !modelReady) && { opacity: 0.35 }]}
        >
          <Ionicons name={generating ? "stop" : "arrow-up"} size={22} color="white" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  modelContent: { padding: 24, paddingBottom: 116 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: colors.background },
  muted: { color: colors.textMuted, fontSize: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  aiLogo: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.7, marginBottom: 3 },
  title: { color: "white", fontSize: 29, fontWeight: "900" },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 18 },
  privacyCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(46,211,183,0.09)", borderColor: "rgba(46,211,183,0.22)", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 18 },
  privacyTitle: { color: "white", fontSize: 14, fontWeight: "800", marginBottom: 4 },
  smallMuted: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: "white", fontSize: 19, fontWeight: "900" },
  storage: { color: colors.textMuted, fontSize: 11 },
  modelCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 17, marginBottom: 14 },
  modelTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  modelIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  modelTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  recommended: { color: colors.purple, backgroundColor: "rgba(124,92,252,0.14)", fontSize: 8, fontWeight: "900", letterSpacing: 0.7, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  modelSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  size: { fontSize: 13, fontWeight: "900" },
  modelFacts: { borderTopWidth: 1, borderColor: colors.border, marginTop: 14, paddingTop: 12, gap: 5 },
  fact: { color: colors.textMuted, fontSize: 11 },
  installButton: { marginTop: 14, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  installText: { fontSize: 14, fontWeight: "900" },
  installedActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  startButton: { flex: 1, minHeight: 48, borderRadius: 15, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  startText: { color: "white", fontSize: 14, fontWeight: "900" },
  deleteButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" },
  downloadBox: { marginTop: 15 },
  downloadLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  downloadText: { color: "white", fontSize: 12, fontWeight: "800" },
  cancelButton: { alignSelf: "center", padding: 9, marginTop: 4 },
  cancelText: { color: colors.pink, fontSize: 12, fontWeight: "800" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,92,138,0.1)", padding: 14, borderRadius: 14 },
  errorText: { color: "white", fontSize: 12, lineHeight: 17, flex: 1 },
  licenseText: { color: colors.textMuted, opacity: 0.7, textAlign: "center", fontSize: 10, marginTop: 8 },
  chatPage: { flex: 1, backgroundColor: colors.background },
  chatHeader: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, borderBottomWidth: 1, borderColor: colors.border },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  chatTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  chatStatus: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 7 },
  headerButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  optionsStrip: { borderBottomWidth: 1, borderColor: colors.border },
  chips: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  chip: { height: 34, minWidth: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: colors.purple },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: "900" },
  chipTextActive: { color: "white" },
  topicChip: { height: 34, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  topicChipActive: { borderColor: colors.purple, backgroundColor: "rgba(124,92,252,0.14)" },
  topicText: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  loadingModel: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 12 },
  modelLoadingTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24, gap: 12 },
  messageRow: { flexDirection: "row", justifyContent: "flex-start" },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { maxWidth: "88%", padding: 14, borderRadius: 18 },
  aiBubble: { backgroundColor: colors.card, borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: colors.purple, borderTopRightRadius: 6 },
  lingoLabel: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
  messageText: { color: "white", fontSize: 15, lineHeight: 21 },
  thinkingRow: { flexDirection: "row", gap: 9, alignItems: "center" },
  speakButton: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-start" },
  speakText: { color: colors.purple, fontSize: 11, fontWeight: "800" },
  bubbleActions: { flexDirection: "row", alignItems: "center", gap: 18 },
  chatError: { marginHorizontal: 14, marginBottom: 7, backgroundColor: "rgba(255,159,67,0.12)", borderRadius: 12, padding: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  chatErrorText: { color: "white", fontSize: 11, lineHeight: 15, flex: 1 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  micButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" },
  micActive: { backgroundColor: colors.pink },
  input: { flex: 1, minHeight: 46, maxHeight: 108, color: "white", backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14 },
  sendButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center" },
  backgroundHint: { color: colors.mint, fontSize: 10, textAlign: "center", marginTop: 9 },
  historyContent: { padding: 16, paddingBottom: 110, gap: 10 },
  historyCard: { minHeight: 74, borderRadius: 18, padding: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 11 },
  historyCardActive: { borderColor: colors.purple, backgroundColor: "rgba(124,92,252,0.09)" },
  historyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(124,92,252,0.13)", alignItems: "center", justifyContent: "center" },
  historyTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  historyMeta: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  emptyHistory: { alignItems: "center", paddingTop: 90, gap: 10 },
});
