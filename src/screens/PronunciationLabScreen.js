import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { requestRecordingPermissionsAsync, useAudioPlayer } from "expo-audio";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { colors , useTheme, createThemedStyles } from "../theme";
import { speak, stopSpeech } from "../utils/speech";
import {
  alignSpeechWords,
  cancelSpeechRecording,
  getReadySpeechModel,
  startSpeechRecording,
  stopSpeechRecording,
  transcribeSpeechData,
} from "../services/offlineSpeech";

const PROGRESS_KEY = "@lingospark/pronunciation-lab-v1";
const SETS = [
  { id: "th", title: "TH без С и З", icon: "👅", color: colors.purple, tip: "Кончик языка слегка между зубами. Воздух проходит свободно — не прижимай язык слишком сильно.", items: ["I think this is the right thing", "Three healthy meals", "The weather is getting better", "Thank you for everything"] },
  { id: "vw", title: "V и W", icon: "🌊", color: colors.mint, tip: "Для V коснись нижней губы верхними зубами. Для W округли губы, не касаясь зубов.", items: ["Very well", "We visited Vienna", "Victor wore a warm vest", "Would you wait for me"] },
  { id: "rl", title: "R и L", icon: "🎯", color: colors.orange, tip: "В английском R язык не касается нёба. Для L кончик языка касается бугорка за верхними зубами.", items: ["A really long road", "Laura rarely arrives early", "Turn right at the red light", "The little train is late"] },
  { id: "vowels", title: "Ship или sheep", icon: "🐑", color: "#48C774", tip: "Долгий /iː/ произноси чуть дольше и с лёгкой улыбкой. Короткий /ɪ/ расслабленнее.", items: ["The sheep is on the ship", "Please leave the key with me", "This meal is really cheap", "He lives near the beach"] },
  { id: "endings", title: "Окончания слов", icon: "🔚", color: "#EF5DA8", tip: "Не проглатывай последний согласный. В -ed отдельный слог появляется только после t и d: wanted, needed.", items: ["She worked and asked", "We wanted to visit", "He played and smiled", "They watched the last match"] },
];

const normalize = (text) => String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
function distance(a, b) {
  const x = normalize(a), y = normalize(b);
  const dp = Array.from({ length: x.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return dp[x.length][y.length];
}
const scoreText = (target, heard, confidence) => {
  const similarity = Math.max(0, 1 - distance(target, heard) / Math.max(1, normalize(target).length));
  return Math.round(similarity * 100);
};

export default function PronunciationLabScreen({ onClose, onSpeechModels }) {
  useTheme();
  const [selected, setSelected] = useState(SETS[0]);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [progress, setProgress] = useState({ best: {}, history: [] });
  const [exam, setExam] = useState(false);
  const [examItems, setExamItems] = useState([]);
  const [examScores, setExamScores] = useState([]);
  const [speechModel, setSpeechModel] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [alignment, setAlignment] = useState(null);
  const localRecordingRef = useRef(false);
  const player = useAudioPlayer(null);
  const target = exam ? examItems[index] : selected.items[index % selected.items.length];

  useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY).then((raw) => raw && setProgress(JSON.parse(raw))).catch(() => {});
    getReadySpeechModel().then(setSpeechModel).catch(() => {});
    return () => { stopSpeech(); ExpoSpeechRecognitionModule.abort(); cancelSpeechRecording().catch(() => {}); };
  }, []);
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("audioend", (event) => { if (event?.uri) setRecordingUri(event.uri); });
  useSpeechRecognitionEvent("result", (event) => {
    if (!event.isFinal) { setHeard(event.results?.[0]?.transcript || ""); return; }
    const result = event.results?.[0];
    const transcript = result?.transcript || "";
    applyRecognizedResult(transcript, scoreText(target, transcript, result?.confidence || 0), null);
  });
  useSpeechRecognitionEvent("error", () => setListening(false));

  const average = useMemo(() => progress.history?.length ? Math.round(progress.history.reduce((a, b) => a + b, 0) / progress.history.length) : 0, [progress.history]);
  function applyRecognizedResult(transcript, nextScore, nextAlignment) {
    if (!transcript.trim()) { setHeard(''); setScore(null); setAlignment(null); Alert.alert('Речь не распознана', 'Результат не засчитан. Проверь запись и попробуй ещё раз.'); return; }
    setHeard(transcript); setScore(nextScore); setAlignment(nextAlignment);
    setProgress((old) => {
      const nextProgress = { best: { ...old.best, [target]: Math.max(old.best[target] || 0, nextScore) }, history: [...(old.history || []), nextScore].slice(-12) };
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(nextProgress)).catch(() => {});
      return nextProgress;
    });
    if (exam) setExamScores((old) => { if (old[index] !== undefined) return old; const next = [...old]; next[index] = nextScore; return next; });
  }
  const startRecording = async () => {
    if (transcribing) return;
    if (listening && localRecordingRef.current) {
      setListening(false); setTranscribing(true); setVoiceLevel(0); setTranscribeProgress(2);
      try {
        const recording = await stopSpeechRecording();
        localRecordingRef.current = false;
        setRecordingUri(recording.uri);
        const result = await transcribeSpeechData(speechModel, recording.pcm16, setTranscribeProgress);
        const transcript = String(result?.result || "").trim();
        const comparison = alignSpeechWords(target, transcript);
        applyRecognizedResult(transcript, comparison.score, comparison);
      } catch (error) {
        localRecordingRef.current = false;
        Alert.alert("Не удалось распознать речь", error?.message || "Попробуйте записать фразу ещё раз.");
      } finally { setTranscribing(false); setTranscribeProgress(0); }
      return;
    }
    if (listening) { ExpoSpeechRecognitionModule.stop(); return; }
    setHeard(""); setScore(null); setRecordingUri(null); setAlignment(null);
    if (speechModel) {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { Alert.alert("Нужен микрофон", "Разрешите доступ к микрофону в настройках iPhone."); return; }
      try {
        startSpeechRecording(setVoiceLevel);
        localRecordingRef.current = true;
        setListening(true);
      } catch (error) { Alert.alert("Запись не началась", error?.message || "Попробуйте ещё раз."); }
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return;
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false, maxAlternatives: 5, requiresOnDeviceRecognition: true, addsPunctuation: true, iosTaskHint: "confirmation", recordingOptions: { persist: true }, iosCategory: { category: "playAndRecord", categoryOptions: ["defaultToSpeaker", "allowBluetooth"], mode: "measurement" } });
  };
  const next = () => {
    setHeard(""); setScore(null); setRecordingUri(null); setAlignment(null);
    if (exam && index >= examItems.length - 1) { setExam(false); setIndex(0); return; }
    setIndex((value) => exam ? value + 1 : (value + 1) % selected.items.length);
  };
  const startExam = () => {
    const all = SETS.flatMap((set) => set.items);
    setExamItems([...all].sort(() => Math.random() - 0.5).slice(0, 5));
    setExamScores([]); setExam(true); setIndex(0); setScore(null); setHeard(""); setAlignment(null);
  };
  const playRecording = () => { if (recordingUri) { player.replace({ uri: recordingUri }); player.play(); } };
  const scoreColor = score >= 85 ? colors.mint : score >= 65 ? colors.orange : colors.pink;
  const completedExam = !exam && examScores.length === 5;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable onPress={onClose} style={styles.round}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={styles.title}>Произношение</Text><Text style={styles.muted}>Тренажёр слышит слова, а не только микрофон</Text></View><Pressable onPress={onSpeechModels} style={[styles.round, speechModel && { borderWidth: 1, borderColor: colors.mint }]}><Ionicons name="hardware-chip-outline" size={23} color={speechModel ? colors.mint : colors.textMuted} /></Pressable></View>

      <Pressable onPress={onSpeechModels} style={styles.engineBanner}><View style={[styles.engineDot, { backgroundColor: speechModel ? colors.mint : colors.orange }]} /><View style={{ flex: 1 }}><Text style={styles.engineTitle}>{speechModel ? `Whisper · ${speechModel.title}` : "Распознавание iPhone"}</Text><Text style={styles.engineText}>{speechModel ? "Полностью локально · нажми, чтобы сменить модель" : "Скачай Whisper для точной офлайн-проверки по словам"}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable>

      {completedExam ? <View style={styles.examResult}><Text style={{ fontSize: 40 }}>🏆</Text><Text style={styles.examResultTitle}>Проверка текста завершена</Text><Text style={styles.examResultValue}>{Math.round(examScores.reduce((a, b) => a + b, 0) / 5)} / 100</Text><Text style={styles.muted}>Совпадение распознанного текста с образцом · не оценка произношения</Text><Pressable onPress={startExam} style={styles.smallButton}><Text style={styles.smallButtonText}>Повторить экзамен</Text></Pressable></View> : null}

      {!exam ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sets}>{SETS.map((set) => <Pressable key={set.id} onPress={() => { setSelected(set); setIndex(0); setScore(null); setHeard(""); }} style={[styles.setChip, selected.id === set.id && { borderColor: set.color, backgroundColor: `${set.color}18` }]}><Text style={{ fontSize: 22 }}>{set.icon}</Text><Text style={[styles.setText, selected.id === set.id && { color: colors.text }]}>{set.title}</Text></Pressable>)}</ScrollView> : <View style={styles.examBanner}><Ionicons name="ribbon" color={colors.orange} size={23} /><Text style={styles.examBannerText}>Экзамен · фраза {index + 1} из 5</Text></View>}

      <View style={[styles.practiceCard, { borderColor: exam ? colors.orange : selected.color }]}>
        <Text style={styles.label}>{exam ? "ПРОИЗНЕСИ БЕЗ ПОДСКАЗКИ" : `ФРАЗА ${index + 1} ИЗ ${selected.items.length}`}</Text>
        <Text style={styles.phrase}>{target}</Text>
        <View style={styles.listenRow}><Pressable onPress={() => speak(target, { language: "en-US", rate: 0.82 })} style={styles.listenButton}><Ionicons name="volume-medium" size={20} color={colors.purple} /><Text style={styles.listenText}>Медленно</Text></Pressable><Pressable onPress={() => speak(target, { language: "en-US", rate: 1 })} style={styles.listenButton}><Ionicons name="play" size={18} color={colors.mint} /><Text style={[styles.listenText, { color: colors.mint }]}>Обычно</Text></Pressable></View>
        {!exam ? <View style={styles.tip}><Text style={{ fontSize: 23 }}>💡</Text><Text style={styles.tipText}>{selected.tip}</Text></View> : null}
        <Pressable disabled={transcribing} onPress={startRecording} style={[styles.recordButton, listening && { backgroundColor: colors.pink }, transcribing && { opacity: 0.75 }]}>{transcribing ? <ActivityIndicator color={colors.onAccent} /> : <Ionicons name={listening ? "stop" : "mic"} size={28} color={colors.onAccent} />}<Text style={styles.recordText}>{transcribing ? `Распознаю · ${transcribeProgress}%` : listening ? "Остановить и проверить" : "Произнести фразу"}</Text></Pressable>
        {listening && speechModel ? <View style={styles.meter}><View style={[styles.meterFill, { width: `${Math.max(4, voiceLevel * 100)}%` }]} /></View> : null}
      </View>

      {heard || score !== null ? <View style={styles.resultCard}><View style={styles.resultTop}><View style={{ flex: 1 }}><Text style={styles.label}>{speechModel ? "WHISPER УСЛЫШАЛ" : "IPHONE УСЛЫШАЛ"}</Text><Text style={styles.heard}>{heard || "Фраза не распознана"}</Text></View>{score !== null ? <View style={[styles.score, { borderColor: scoreColor }]}><Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text></View> : null}</View>{alignment ? <View style={styles.wordMap}>{alignment.aligned.map((item, i) => <View key={`${item.expected}-${i}`} style={[styles.wordChip, item.status === "correct" ? styles.wordCorrect : item.status === "missing" ? styles.wordMissing : styles.wordChanged]}><Text style={styles.wordExpected}>{item.expected}</Text>{item.status === "changed" ? <Text style={styles.wordHeard}>→ {item.heard}</Text> : item.status === "missing" ? <Text style={styles.wordHeard}>пропущено</Text> : null}</View>)}{alignment.extras.map((word, i) => <View key={`extra-${word}-${i}`} style={[styles.wordChip, styles.wordExtra]}><Text style={styles.wordExpected}>+ {word}</Text></View>)}</View> : null}{score !== null ? <Text style={[styles.feedback, { color: scoreColor }]}>{score >= 85 ? "Распознанный текст совпал с образцом. Это не оценка акцента или произношения." : score >= 65 ? "Часть текста распознана иначе. Сравни запись с образцом." : "Текст распознан неполностью. Причиной может быть шум или ошибка распознавания. Проверь запись."}</Text> : null}<View style={styles.resultActions}>{recordingUri ? <Pressable onPress={playRecording} style={styles.smallButton}><Ionicons name="headset" size={18} color={colors.text} /><Text style={styles.smallButtonText}>Моя запись</Text></Pressable> : null}<Pressable onPress={next} style={[styles.smallButton, { backgroundColor: colors.accentSoft }]}><Text style={styles.smallButtonText}>{exam && index === 4 ? "Завершить" : "Следующая"}</Text><Ionicons name="arrow-forward" size={18} color={colors.text} /></Pressable></View></View> : null}

      <View style={styles.chart}><View style={styles.chartHeader}><Text style={styles.chartTitle}>Последние попытки</Text><Pressable onPress={startExam}><Text style={styles.examLink}>Экзамен · 5 фраз</Text></Pressable></View><View style={styles.bars}>{(progress.history || []).slice(-10).map((value, i) => <View key={`${i}-${value}`} style={[styles.bar, { height: Math.max(8, value * 0.55), backgroundColor: value >= 80 ? colors.mint : value >= 60 ? colors.orange : colors.pink }]} />)}{!progress.history?.length ? <Text style={styles.muted}>Здесь появится рост оценки после первой записи.</Text> : null}</View></View>
      <Text style={styles.disclaimer}>Оценка сравнивает распознанные слова с образцом. Это полезная тренировка понятности речи, но не анализ положения языка или отдельных фонем.</Text>
    </ScrollView>
  );
}

const styles = createThemedStyles(() => ({
  page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 130 }, header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }, round: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontSize: 27, fontWeight: "900" }, muted: { color: colors.textMuted, fontSize: 12, lineHeight: 18 }, average: { alignItems: "center", minWidth: 57 }, averageValue: { color: colors.mint, fontSize: 22, fontWeight: "900" }, averageLabel: { color: colors.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  engineBanner: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 60, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }, engineDot: { width: 9, height: 9, borderRadius: 5 }, engineTitle: { color: colors.text, fontSize: 13, fontWeight: "900" }, engineText: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  sets: { gap: 9, paddingBottom: 15 }, setChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, height: 52, flexDirection: "row", gap: 8, alignItems: "center" }, setText: { color: colors.textMuted, fontWeight: "800" }, examBanner: { backgroundColor: `${colors.orange}18`, padding: 13, borderRadius: 15, flexDirection: "row", gap: 9, marginBottom: 14 }, examBannerText: { color: colors.orange, fontWeight: "900" },
  practiceCard: { backgroundColor: colors.card, borderWidth: 1, borderRadius: 27, padding: 22 }, label: { color: colors.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 1.6 }, phrase: { color: colors.text, fontSize: 30, lineHeight: 39, fontWeight: "900", marginTop: 17 }, listenRow: { flexDirection: "row", gap: 10, marginTop: 18 }, listenButton: { backgroundColor: colors.cardLight, paddingHorizontal: 13, height: 42, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 6 }, listenText: { color: colors.purple, fontWeight: "900" }, tip: { backgroundColor: colors.cardLight, borderRadius: 16, padding: 13, marginTop: 18, flexDirection: "row", gap: 10 }, tipText: { color: colors.textMuted, lineHeight: 20, flex: 1 }, recordButton: { backgroundColor: colors.accentFill, height: 60, borderRadius: 18, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }, recordText: { color: colors.text, fontSize: 17, fontWeight: "900" },
  meter: { height: 5, backgroundColor: colors.border, borderRadius: 3, marginTop: 10, overflow: "hidden" }, meterFill: { height: "100%", backgroundColor: colors.mint, borderRadius: 3 },
  resultCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, marginTop: 14 }, resultTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, heard: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 7, flexShrink: 1 }, score: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, alignItems: "center", justifyContent: "center" }, scoreValue: { fontSize: 21, fontWeight: "900" }, feedback: { fontWeight: "800", lineHeight: 20, marginTop: 13 }, resultActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 14 }, smallButton: { backgroundColor: colors.cardLight, paddingHorizontal: 14, height: 42, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, smallButtonText: { color: colors.text, fontWeight: "900" },
  wordMap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }, wordChip: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1 }, wordCorrect: { backgroundColor: `${colors.mint}16`, borderColor: `${colors.mint}66` }, wordChanged: { backgroundColor: `${colors.orange}16`, borderColor: `${colors.orange}66` }, wordMissing: { backgroundColor: `${colors.pink}16`, borderColor: `${colors.pink}66` }, wordExtra: { backgroundColor: `${colors.purple}16`, borderColor: `${colors.purple}66` }, wordExpected: { color: colors.text, fontSize: 11, fontWeight: "800" }, wordHeard: { color: colors.textMuted, fontSize: 8, marginTop: 2 },
  chart: { backgroundColor: colors.card, borderRadius: 20, padding: 17, marginTop: 16 }, chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, chartTitle: { color: colors.text, fontWeight: "900" }, examLink: { color: colors.purple, fontWeight: "900" }, bars: { minHeight: 66, flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 14 }, bar: { flex: 1, maxWidth: 24, borderRadius: 5 }, disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 17 },
  examResult: { backgroundColor: `${colors.orange}15`, borderWidth: 1, borderColor: `${colors.orange}55`, borderRadius: 22, padding: 20, alignItems: "center", marginBottom: 14 }, examResultTitle: { color: colors.text, fontSize: 20, fontWeight: "900" }, examResultValue: { color: colors.orange, fontSize: 34, fontWeight: "900", marginVertical: 6 },
}));
