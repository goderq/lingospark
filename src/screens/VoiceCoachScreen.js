import { evaluateExercise } from '../utils/answer';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { useProgress } from "../store/ProgressContext";
import { balancedOptions } from "../utils/shuffle";
import { speak, stopSpeech } from "../utils/speech";
import { isVoicePracticeTurn } from "../utils/voiceCoachReply";
import {
  analyzeTutorConversation,
  completeVoiceCoachMessage,
  loadModel,
  saveTutorSession,
  stopGeneration,
} from "../services/localAi";
import {
  cancelSpeechRecording,
  getReadySpeechModel,
  startSpeechRecording,
  stopSpeechRecording,
  transcribeSpeechData,
} from "../services/offlineSpeech";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const SCENARIOS = [
  {
    id: "airport",
    title: "В аэропорту",
    emoji: "✈️",
    role: "an airport check-in agent",
    context: "Help the learner check in for an international flight, check their luggage and find the boarding gate.",
    opening: "Good morning! May I see your passport and ticket, please?",
    goals: ["Поздороваться и назвать рейс", "Сдать багаж", "Уточнить выход на посадку", "Завершить регистрацию"],
    hint: "I’m flying to… / I have one suitcase. / Which gate should I go to?",
  },
  {
    id: "restaurant",
    title: "В ресторане",
    emoji: "🍽️",
    role: "a friendly waiter",
    context: "Help the learner find a table, order food and a drink, ask about ingredients and request the bill.",
    opening: "Welcome! Would you like a table by the window?",
    goals: ["Попросить столик", "Заказать еду и напиток", "Уточнить состав блюда", "Попросить счёт"],
    hint: "Could I have…? / Does this contain…? / Could I get the bill?",
  },
  {
    id: "hotel",
    title: "В отеле",
    emoji: "🏨",
    role: "a hotel receptionist",
    context: "Help the learner check in, ask about breakfast and Wi-Fi, and report a problem with the room.",
    opening: "Hello! Welcome to Riverside Hotel. Do you have a reservation?",
    goals: ["Подтвердить бронь", "Уточнить время завтрака", "Спросить о Wi‑Fi", "Сообщить о проблеме в номере"],
    hint: "I have a reservation under… / What time is breakfast? / There is a problem with…",
  },
  {
    id: "interview",
    title: "Собеседование",
    emoji: "💼",
    role: "a recruiter interviewing the learner",
    context: "Ask about their background, work experience and strengths, then invite their questions.",
    opening: "Thanks for joining us today. Could you tell me a little about yourself?",
    goals: ["Рассказать о себе", "Описать опыт", "Назвать сильную сторону", "Задать вопрос работодателю"],
    hint: "I have experience in… / One of my strengths is… / Could you tell me about…?",
  },
  {
    id: "doctor",
    title: "У врача",
    emoji: "🩺",
    role: "a doctor in a fictional appointment",
    context: "Ask what the learner feels and when it started. This is language practice, not a medical consultation.",
    opening: "Hello. What seems to be the problem today?",
    goals: ["Описать симптом", "Сказать, когда он начался", "Ответить на вопросы", "Уточнить рекомендации"],
    hint: "I’ve had… since… / It hurts when… / What should I do next?",
  },
  {
    id: "small-talk",
    title: "Новое знакомство",
    emoji: "👋",
    role: "a friendly person at an international event",
    context: "Get to know the learner, ask where they come from and what they enjoy, and leave room to stay in touch.",
    opening: "Hi! I don’t think we’ve met before. I’m Alex. What’s your name?",
    goals: ["Представиться", "Рассказать, откуда ты", "Обсудить интересы", "Предложить продолжить общение"],
    hint: "Nice to meet you. / I’m from… / What do you enjoy doing?",
  },
];

const todayScenario = () => SCENARIOS[Math.floor(Date.now() / 86400000) % SCENARIOS.length];

export default function VoiceCoachScreen({ model, onClose }) {
  useTheme();
  const { progress, addCustomWord } = useProgress();
  const [stage, setStage] = useState("setup");
  const [scenario, setScenario] = useState(todayScenario());
  const [level, setLevel] = useState(progress.learnerLevel?.replace("+", "") || "A2");
  const [mode, setMode] = useState("guided");
  const [strictness, setStrictness] = useState("gentle");
  const [responseLength, setResponseLength] = useState("short");
  const [speechRate, setSpeechRate] = useState(0.86);
  const [autoContinue, setAutoContinue] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [status, setStatus] = useState("loading");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [speechModel, setSpeechModel] = useState(null);
  const processingRef = useRef(false);
  const replyRequest = useRef(null);
  const localSpeechRef = useRef(false);
  const messagesRef = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    loadModel(model)
      .then(() => {
        if (!mounted) return;
        setModelReady(true);
        setStatus("ready");
      })
      .catch((loadError) => mounted && setError(loadError?.message || "Не удалось запустить модель"));
    return () => {
      mounted = false;
      replyRequest.current?.abort();
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
      stopGeneration().catch(() => {});
      stopSpeech();
      cancelSpeechRecording().catch(() => {});
    };
  }, [model.id]);

  useEffect(() => { getReadySpeechModel().then(setSpeechModel).catch(() => {}); }, []);

  useSpeechRecognitionEvent("start", () => setStatus("listening"));
  useSpeechRecognitionEvent("end", () => {
    if (!processingRef.current && status === "listening") setStatus("ready");
  });
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript?.trim() || "";
    if (event.isFinal && text && !processingRef.current) processUserSpeech(text);
  });
  useSpeechRecognitionEvent("error", (event) => {
    if (replyRequest.current || event.error === "aborted") return;
    processingRef.current = false;
    setStatus("ready");
    setError(
      event.error === "no-speech"
        ? "Речь не услышана. Нажми на микрофон и попробуй ещё раз."
        : event.error === "language-not-supported"
          ? "На iPhone не загружено локальное распознавание English (US)."
          : "Не удалось распознать речь. Проверь разрешение микрофона.",
    );
  });

  const startListening = async () => {
    if (!modelReady || processingRef.current) return;
    setError("");
    await stopSpeech();
    if (speechModel) {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { setError("Разреши микрофон в настройках iPhone."); return; }
      try { startSpeechRecording(); localSpeechRef.current = true; setStatus("listening"); }
      catch (speechError) { setError(speechError?.message || "Не удалось начать запись."); }
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError("Разреши микрофон и распознавание речи в настройках iPhone.");
      return;
    }
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
      iosVoiceProcessingEnabled: true,
    });
  };

  const stopListening = async () => {
    if (!localSpeechRef.current) { ExpoSpeechRecognitionModule.stop(); return; }
    setStatus("transcribing");
    try {
      const recording = await stopSpeechRecording();
      localSpeechRef.current = false;
      const result = await transcribeSpeechData(speechModel, recording.pcm16);
      const text = String(result?.result || "").trim();
      if (!text) { setStatus("ready"); setError("Речь не распознана. Попробуй произнести фразу чуть громче."); return; }
      await processUserSpeech(text);
    } catch (speechError) {
      localSpeechRef.current = false;
      setStatus("ready");
      setError(speechError?.message || "Не удалось распознать речь.");
    }
  };

  const processUserSpeech = async (text) => {
    if (processingRef.current) return;
    const request = new AbortController();
    replyRequest.current = request;
    processingRef.current = true;
    ExpoSpeechRecognitionModule.stop();
    setStatus("thinking");
    const userMessage = { id: `voice-user-${Date.now()}`, role: "user", content: text };
    const next = [...messagesRef.current, userMessage];
    setMessages(next);
    try {
      const response = await completeVoiceCoachMessage({
        model,
        level,
        scenario,
        mode,
        strictness,
        responseLength,
        messages: next,
        signal: request.signal,
      });
      if (request.signal.aborted) return;
      const reply = response.text;
      const assistant = { id: `voice-ai-${Date.now()}`, role: "assistant", content: reply, comment: response.comment };
      const completed = [...next, assistant];
      setMessages(completed);
      messagesRef.current = completed;
      setStatus("speaking");
      speak(reply, {
        language: "en-US",
        rate: speechRate,
        onDone: () => {
          setStatus("ready");
          if (autoContinue) setTimeout(startListening, 450);
        },
        onStopped: () => setStatus("ready"),
        onError: () => setStatus("ready"),
      });
    } catch (replyError) {
      if (request.signal.aborted) return;
      setStatus("ready");
      setError(replyError?.message || "Не удалось получить голосовой ответ");
    } finally {
      if (replyRequest.current === request) {
        replyRequest.current = null;
        processingRef.current = false;
      }
    }
  };

  const startSession = () => {
    if (!modelReady) return;
    const opening = { id: `voice-opening-${Date.now()}`, role: "assistant", content: scenario.opening };
    setMessages([opening]);
    messagesRef.current = [opening];
    setStage("session");
    setStatus("speaking");
    speak(scenario.opening, {
      language: "en-US",
      rate: speechRate,
      onDone: () => setStatus("ready"),
      onError: () => setStatus("ready"),
    });
  };

  const finishSession = async () => {
    if (messages.filter((item) => item.role === "user").length < 2) {
      setError("Скажи хотя бы две фразы, чтобы получить полезную оценку.");
      return;
    }
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {}
    if (replyRequest.current) {
      replyRequest.current.abort();
      await stopGeneration();
    }
    await stopSpeech();
    setStage("result");
    setStatus("analyzing");
    try {
      const result = await analyzeTutorConversation({
        model,
        level,
        topic: `Голосовой сценарий: ${scenario.title}`,
        messages,
      });
      setAnalysis(result);
      setStatus("ready");
      await saveTutorSession({
        id: `voice-${scenario.id}-${Date.now()}`,
        modelId: model.id,
        modelTitle: model.shortTitle || model.title,
        level,
        topic: `Голосовой тренер · ${scenario.title}`,
        title: `${scenario.emoji} ${scenario.title}`,
        messages,
        analysis: result,
        createdAt: Date.now(),
      });
    } catch (analysisError) {
      setError(analysisError?.message || "Не удалось составить итог разговора");
      setStatus("ready");
    }
  };

  if (stage === "setup") {
    return (
      <VoiceSetup
        model={model}
        modelReady={modelReady}
        scenario={scenario}
        setScenario={setScenario}
        level={level}
        setLevel={setLevel}
        mode={mode}
        setMode={setMode}
        strictness={strictness}
        setStrictness={setStrictness}
        responseLength={responseLength}
        setResponseLength={setResponseLength}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        autoContinue={autoContinue}
        setAutoContinue={setAutoContinue}
        onStart={startSession}
        onClose={onClose}
      />
    );
  }

  if (stage === "result") {
    return (
      <VoiceResult
        scenario={scenario}
        analysis={analysis}
        analyzing={status === "analyzing"}
        progress={progress}
        onAddWord={addCustomWord}
        onRetry={() => {
          setAnalysis(null);
          setMessages([]);
          setStage("setup");
        }}
        onClose={onClose}
      />
    );
  }

  const userTurns = messages.filter(item => item.role === "user" && isVoicePracticeTurn(item.content)).length;
  const goalIndex = Math.min(userTurns, scenario.goals.length);
  const statusLabel = {
    loading: "Запускаю модель…",
    ready: "Нажми и говори",
    listening: "Слушаю — закончи фразу",
    transcribing: `Whisper распознаёт${speechModel ? ` · ${speechModel.title}` : ""}…`,
    thinking: "Lingo думает на iPhone…",
    speaking: "Lingo отвечает",
  }[status];

  return (
    <View style={s.container}>
      <View style={s.sessionHeader}>
        <Pressable onPress={onClose} style={s.headerButton}>
          <Ionicons name="close" size={25} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.sessionTitle}>{scenario.emoji} {scenario.title}</Text>
          <Text style={s.sessionMeta}>{level} · {mode === "english" ? "только English" : "с объяснениями"}</Text>
        </View>
        <Pressable onPress={finishSession} style={s.finishButton}>
          <Text style={s.finishText}>Завершить</Text>
        </Pressable>
      </View>

      <View style={s.goalBlock}>
        <View style={s.goalTop}>
          <Text style={s.goalLabel}>ЦЕЛИ СЦЕНАРИЯ</Text>
          <Text style={s.goalCount}>{goalIndex}/{scenario.goals.length}</Text>
        </View>
        <ProgressBar value={goalIndex / scenario.goals.length} color={colors.mint} height={7} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.goalChips}>
          {scenario.goals.map((goal, index) => (
            <View key={goal} style={[s.goalChip, index < goalIndex && s.goalDone]}>
              <Ionicons name={index < goalIndex ? "checkmark" : "ellipse-outline"} size={13} color={index < goalIndex ? colors.mint : colors.textMuted} />
              <Text style={s.goalText}>{goal}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.dialogue}
        contentContainerStyle={s.dialogueContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.slice(-6).map((message) => (
          <View key={message.id} style={[s.subtitleBubble, message.role === "user" ? s.userSubtitle : s.aiSubtitle]}>
            <Text style={s.subtitleSpeaker}>{message.role === "user" ? "YOU" : "LINGO"}</Text>
            <Text style={s.subtitleText}>{message.content}</Text>
            {!!message.comment && <Text style={s.hintText}>{message.comment}</Text>}
            {message.role === "assistant" ? (
              <Pressable onPress={() => speak(message.content, { language: "en-US", rate: speechRate })} style={s.replay}>
                <Ionicons name="volume-medium" size={17} color={colors.purple} />
                <Text style={s.replayText}>Повторить</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={s.voiceControls}>
        {showHint ? (
          <View style={s.hintCard}>
            <Ionicons name="bulb" size={18} color={colors.orange} />
            <Text style={s.hintText}>{scenario.hint}</Text>
            <Pressable onPress={() => setShowHint(false)}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setShowHint(true)} style={s.showHint}>
            <Ionicons name="bulb-outline" size={18} color={colors.orange} />
            <Text style={s.showHintText}>Показать подсказку</Text>
          </Pressable>
        )}
        <Text style={s.statusText}>{statusLabel}</Text>
        <Pressable
          disabled={status === "thinking" || status === "speaking" || status === "loading" || status === "transcribing"}
          onPress={status === "listening" ? stopListening : startListening}
          style={[s.micOrb, status === "listening" && s.micListening, (status === "thinking" || status === "speaking") && s.micBusy]}
        >
          {status === "thinking" || status === "transcribing" ? <ActivityIndicator size="large" color={colors.text} /> : (
            <Ionicons name={status === "listening" ? "stop" : status === "speaking" ? "volume-high" : "mic"} size={42} color={colors.text} />
          )}
        </Pressable>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

function VoiceSetup(props) {
  useTheme();
  const {
    model, modelReady, scenario, setScenario, level, setLevel, mode, setMode,
    strictness, setStrictness, responseLength, setResponseLength, speechRate,
    setSpeechRate, autoContinue, setAutoContinue, onStart, onClose,
  } = props;
  const daily = todayScenario();
  return (
    <View style={s.container}>
      <View style={s.sessionHeader}>
        <Pressable onPress={onClose} style={s.headerButton}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.sessionTitle}>Голосовой тренер</Text>
          <Text style={s.sessionMeta}>{model.shortTitle || model.title} · локально</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.setupContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setScenario(daily)} style={[s.dailyCard, scenario.id === daily.id && { borderColor: colors.orange }]}>
          <View style={s.dailyIcon}><Text style={{ fontSize: 28 }}>{daily.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.dailyLabel}>МИССИЯ ДНЯ</Text>
            <Text style={s.cardTitle}>{daily.title}</Text>
            <Text style={s.cardText}>Пройди {daily.goals.length} этапа живого разговора</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Text style={s.section}>ВЫБЕРИ СЦЕНАРИЙ</Text>
        <View style={s.scenarioGrid}>
          {SCENARIOS.map((item) => (
            <Pressable key={item.id} onPress={() => setScenario(item)} style={[s.scenarioCard, scenario.id === item.id && s.scenarioActive]}>
              <Text style={s.scenarioEmoji}>{item.emoji}</Text>
              <Text style={s.scenarioTitle}>{item.title}</Text>
              <Text style={s.scenarioSteps}>{item.goals.length} этапа</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>УРОВЕНЬ</Text>
        <View style={s.segmentRow}>
          {LEVELS.map((item) => (
            <Pressable key={item} onPress={() => setLevel(item)} style={[s.levelButton, level === item && s.segmentActive]}>
              <Text style={[s.segmentText, level === item && { color: colors.text }]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>РЕЖИМ ПРЕПОДАВАТЕЛЯ</Text>
        <OptionRow options={[["guided", "С объяснениями", "English + короткий разбор"], ["english", "Только English", "Полное погружение"]]} value={mode} onChange={setMode} />
        <OptionRow options={[["gentle", "Мягко", "Только важные ошибки"], ["strict", "Строго", "Исправлять всё заметное"]]} value={strictness} onChange={setStrictness} />
        <OptionRow options={[["short", "Коротко", "До двух предложений"], ["normal", "Обычно", "До пяти предложений"]]} value={responseLength} onChange={setResponseLength} />

        <Text style={s.section}>ГОЛОС И АВТОМАТИКА</Text>
        <OptionRow options={[[0.72, "Медленно", "Для внимательного слуха"], [0.86, "Обычно", "Естественный темп"]]} value={speechRate} onChange={setSpeechRate} />
        <Pressable onPress={() => setAutoContinue(!autoContinue)} style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>Автодиалог</Text>
            <Text style={s.optionText}>После ответа Lingo микрофон включится снова</Text>
          </View>
          <View style={[s.toggle, autoContinue && s.toggleOn]}><View style={[s.toggleKnob, autoContinue && s.toggleKnobOn]} /></View>
        </Pressable>

        <Pressable disabled={!modelReady} onPress={onStart} style={[s.startButton, !modelReady && { opacity: 0.45 }]}>
          {modelReady ? <Ionicons name="mic" size={22} color={colors.onAccent} /> : <ActivityIndicator color={colors.onAccent} />}
          <Text style={s.startText}>{modelReady ? `Начать · ${scenario.title}` : "Запускаю модель…"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function OptionRow({ options, value, onChange }) {
  useTheme();
  return (
    <View style={s.optionRow}>
      {options.map(([id, title, text]) => (
        <Pressable key={String(id)} onPress={() => onChange(id)} style={[s.optionCard, value === id && s.optionActive]}>
          <View style={[s.radio, value === id && s.radioActive]}>{value === id ? <View style={s.radioDot} /> : null}</View>
          <View style={{ flex: 1 }}><Text style={s.optionTitle}>{title}</Text><Text style={s.optionText}>{text}</Text></View>
        </Pressable>
      ))}
    </View>
  );
}

function VoiceResult({ scenario, analysis, analyzing, progress, onAddWord, onRetry, onClose }) {
  useTheme();
  const [selected, setSelected] = useState({});
  const [added, setAdded] = useState([]);
  if (analyzing) return (
    <View style={s.container}>
      <View style={s.resultLoading}><ActivityIndicator size="large" color={colors.purple} /><Text style={s.resultTitle}>Оцениваю разговор</Text><Text style={s.cardText}>Ищу ошибки и создаю задания на этом iPhone…</Text></View>
    </View>
  );
  if (!analysis) return (
    <View style={s.container}><View style={s.resultLoading}><Text style={s.resultTitle}>Не удалось получить оценку</Text><Pressable onPress={onRetry} style={s.startButton}><Text style={s.startText}>Попробовать снова</Text></Pressable></View></View>
  );
  const existing = new Set((progress.customWords || []).map((item) => item.english.toLowerCase()));
  return (
    <View style={s.container}>
      <View style={s.sessionHeader}>
        <Pressable onPress={onClose} style={s.headerButton}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={s.sessionTitle}>Результат · {scenario.title}</Text><Text style={s.sessionMeta}>Сохранено в истории ИИ</Text></View>
      </View>
      <ScrollView contentContainerStyle={s.resultContent}>
        <View style={s.resultHero}><Text style={{ fontSize: 42 }}>🎙️</Text><Text style={s.resultTitle}>{analysis.summary}</Text></View>
        <View style={s.resultScores}>
          {[["grammar", "Грамматика"], ["vocabulary", "Словарь"], ["fluency", "Связность"]].map(([key, title]) => (
            <View key={key} style={s.resultScore}><Text style={s.resultScoreValue}>{analysis.scores?.[key] || 0}</Text><Text style={s.resultScoreLabel}>{title}</Text></View>
          ))}
        </View>
        <Text style={s.section}>ИСПРАВЛЕНИЯ</Text>
        {analysis.mistakes?.length ? analysis.mistakes.map((item, index) => (
          <View key={`${item.original}-${index}`} style={s.correctionCard}><Text style={s.wrongPhrase}>✕ {item.original}</Text><Text style={s.rightPhrase}>✓ {item.corrected}</Text><Text style={s.cardText}>{item.explanation}</Text></View>
        )) : <View style={s.successCard}><Text style={{ fontSize: 27 }}>🎉</Text><Text style={s.optionTitle}>Серьёзных ошибок нет</Text></View>}
        {analysis.words?.length ? <><Text style={s.section}>НОВЫЕ СЛОВА</Text>{analysis.words.map((word) => {
          const isAdded = existing.has(word.english.toLowerCase()) || added.includes(word.english.toLowerCase());
          return <View key={word.english} style={s.wordRow}><View style={{ flex: 1 }}><Text style={s.wordEnglish}>{word.english}</Text><Text style={s.wordRussian}>{word.russian}</Text></View><Pressable disabled={isAdded} onPress={() => { onAddWord(word.english, word.russian, word.example || "Голосовой тренер"); setAdded((old) => [...old, word.english.toLowerCase()]); }} style={[s.addWord, isAdded && { backgroundColor: "rgba(46,211,183,.15)" }]}><Ionicons name={isAdded ? "checkmark" : "add"} size={21} color={isAdded ? colors.mint : "white"} /></Pressable></View>;
        })}</> : null}
        <Text style={s.section}>ЗАКРЕПИ ОШИБКИ</Text>
        {(analysis.exercises || []).slice(0, 5).map((exercise, index) => (
          <View key={`${exercise.prompt}-${index}`} style={s.taskCard}>
            <Text style={s.taskNumber}>ЗАДАНИЕ {index + 1}</Text><Text style={s.taskPrompt}>{exercise.prompt}</Text>
            {balancedOptions(exercise.options, exercise.answer, index, scenario.id).map((option) => {
              const choice = selected[index]; const correct = choice && evaluateExercise(exercise, (option)).correct; const wrong = choice === option && !evaluateExercise(exercise, (option)).correct;
              return <Pressable key={option} disabled={Boolean(choice)} onPress={() => setSelected((old) => ({ ...old, [index]: option }))} style={[s.taskOption, correct && s.taskCorrect, wrong && s.taskWrong]}><Text style={s.taskOptionText}>{option}</Text></Pressable>;
            })}
            {selected[index] ? <Text style={s.taskExplain}>{exercise.explanation}</Text> : null}
          </View>
        ))}
        <Pressable onPress={onRetry} style={s.startButton}><Ionicons name="refresh" size={21} color={colors.onAccent} /><Text style={s.startText}>Новый разговор</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const s = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.background },
  sessionHeader: { minHeight: 68, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderColor: colors.border },
  headerButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  sessionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sessionMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  finishButton: { height: 38, borderRadius: 12, backgroundColor: "rgba(255,159,67,.14)", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  finishText: { color: colors.orange, fontSize: 11, fontWeight: "900" },
  setupContent: { padding: 18, paddingBottom: 36 },
  dailyCard: { minHeight: 96, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,159,67,.08)", padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  dailyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  dailyLabel: { color: colors.orange, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 3 },
  cardText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  section: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 24, marginBottom: 10 },
  scenarioGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  scenarioCard: { width: "48%", minHeight: 112, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14 },
  scenarioActive: { borderColor: colors.purple, backgroundColor: "rgba(124,92,252,.12)" },
  scenarioEmoji: { fontSize: 27 },
  scenarioTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 8 },
  scenarioSteps: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  segmentRow: { flexDirection: "row", gap: 7 },
  levelButton: { flex: 1, height: 45, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.accentSoft },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: "900" },
  optionRow: { flexDirection: "row", gap: 9, marginBottom: 9 },
  optionCard: { flex: 1, minHeight: 72, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  optionActive: { borderColor: colors.purple, backgroundColor: "rgba(124,92,252,.1)" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentSoft },
  optionTitle: { color: colors.text, fontSize: 12, fontWeight: "900" },
  optionText: { color: colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  toggleRow: { minHeight: 70, borderRadius: 17, backgroundColor: colors.card, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.cardLight, padding: 3 },
  toggleOn: { backgroundColor: colors.accentSoft },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card },
  toggleKnobOn: { alignSelf: "flex-end" },
  startButton: { minHeight: 56, borderRadius: 18, backgroundColor: colors.accentFill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, paddingHorizontal: 18 },
  startText: { color: colors.text, fontSize: 15, fontWeight: "900" },
  goalBlock: { padding: 14, borderBottomWidth: 1, borderColor: colors.border },
  goalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  goalLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  goalCount: { color: colors.mint, fontSize: 10, fontWeight: "900" },
  goalChips: { gap: 7, paddingTop: 10 },
  goalChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 11, backgroundColor: colors.card, paddingHorizontal: 10, height: 30 },
  goalDone: { backgroundColor: "rgba(46,211,183,.1)" },
  goalText: { color: colors.textMuted, fontSize: 9, fontWeight: "700" },
  dialogue: { flex: 1 },
  dialogueContent: { padding: 16, gap: 10 },
  subtitleBubble: { maxWidth: "88%", borderRadius: 18, padding: 13 },
  aiSubtitle: { alignSelf: "flex-start", backgroundColor: colors.card, borderTopLeftRadius: 5 },
  userSubtitle: { alignSelf: "flex-end", backgroundColor: colors.accentSoft, borderTopRightRadius: 5 },
  subtitleSpeaker: { color: colors.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6 },
  subtitleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  replay: { flexDirection: "row", gap: 5, alignItems: "center", marginTop: 9 },
  replayText: { color: colors.purple, fontSize: 10, fontWeight: "800" },
  voiceControls: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, alignItems: "center", borderTopWidth: 1, borderColor: colors.border },
  hintCard: { width: "100%", minHeight: 51, borderRadius: 15, backgroundColor: "rgba(255,159,67,.09)", padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  hintText: { color: colors.text, flex: 1, fontSize: 10, lineHeight: 15 },
  showHint: { flexDirection: "row", alignItems: "center", gap: 6, height: 40 },
  showHintText: { color: colors.orange, fontSize: 11, fontWeight: "800" },
  statusText: { color: colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 10, marginBottom: 8 },
  micOrb: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", shadowColor: colors.purple, shadowOpacity: .45, shadowRadius: 18, shadowOffset: { width: 0, height: 5 } },
  micListening: { backgroundColor: colors.pink, shadowColor: colors.pink, transform: [{ scale: 1.06 }] },
  micBusy: { backgroundColor: "#51467D" },
  errorText: { color: colors.pink, fontSize: 10, textAlign: "center", marginTop: 8 },
  resultLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 13, paddingHorizontal: 32 },
  resultContent: { padding: 18, paddingBottom: 38 },
  resultHero: { borderRadius: 22, backgroundColor: "rgba(124,92,252,.12)", borderWidth: 1, borderColor: "rgba(124,92,252,.3)", padding: 18, alignItems: "center", gap: 10 },
  resultTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "900", textAlign: "center" },
  resultScores: { flexDirection: "row", gap: 9, marginTop: 13 },
  resultScore: { flex: 1, minHeight: 86, backgroundColor: colors.card, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  resultScoreValue: { color: colors.mint, fontSize: 23, fontWeight: "900" },
  resultScoreLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  correctionCard: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 9 },
  wrongPhrase: { color: colors.pink, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  rightPhrase: { color: colors.mint, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  successCard: { backgroundColor: "rgba(46,211,183,.1)", borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  wordRow: { minHeight: 67, backgroundColor: colors.card, borderRadius: 17, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  wordEnglish: { color: colors.text, fontSize: 16, fontWeight: "900" },
  wordRussian: { color: colors.mint, fontSize: 11, marginTop: 3 },
  addWord: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  taskCard: { backgroundColor: colors.card, borderRadius: 19, padding: 14, marginBottom: 10 },
  taskNumber: { color: colors.purple, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  taskPrompt: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "800", marginVertical: 10 },
  taskOption: { minHeight: 42, borderRadius: 12, backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border, justifyContent: "center", paddingHorizontal: 12, marginBottom: 7 },
  taskCorrect: { borderColor: colors.mint, backgroundColor: "rgba(46,211,183,.1)" },
  taskWrong: { borderColor: colors.pink, backgroundColor: "rgba(255,92,138,.1)" },
  taskOptionText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  taskExplain: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
}));
