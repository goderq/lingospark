import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { colors , useTheme, createThemedStyles } from "../theme";
import {
  AI_MODELS,
  addTutorMemoryGoal,
  clearIncompleteModels,
  clearTutorFeedback,
  clearTutorMemory,
  clearTutorSessions,
  getAiSettings,
  getEngineDiagnostics,
  getFreeSpace,
  inspectModels,
  loadTutorMemory,
  loadTutorFeedback,
  loadTutorSessions,
  removeTutorMemoryEntry,
  setAiSettings,
  unloadModel,
} from "../services/localAi";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "—";
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} ГБ`
    : `${Math.round(bytes / 1024 ** 2)} МБ`;
};

export default function AICenterScreen({ onClose, onPronunciation, onSpeechModels }) {
  useTheme();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [memoryGoal, setMemoryGoal] = useState("");
  const refresh = useCallback(async () => {
    const [models, freeSpace, sessions, settings, tutorMemory, feedback] = await Promise.all([
      inspectModels(), getFreeSpace(), loadTutorSessions(), getAiSettings(), loadTutorMemory(), loadTutorFeedback(),
    ]);
    setData({ models, freeSpace, sessions, settings, tutorMemory, feedback, engine: getEngineDiagnostics() });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!data) return <View style={styles.center}><ActivityIndicator color={colors.purple} size="large" /></View>;

  const installedBytes = AI_MODELS.reduce((sum, model) => sum + (data.models[model.id]?.installed ? data.models[model.id].bytes : 0), 0);
  const partialBytes = AI_MODELS.reduce((sum, model) => sum + (!data.models[model.id]?.installed ? data.models[model.id]?.bytes || 0 : 0), 0);
  const deviceMemory = Device.totalMemory || 0;
  const riskFor = (model) => !deviceMemory ? "Неизвестно" : model.size > deviceMemory * 0.35 ? "Высокая нагрузка" : model.size > deviceMemory * 0.2 ? "Средняя нагрузка" : "Лёгкая нагрузка";
  const remembered = data.tutorMemory;
  const memoryScores = remembered.recentScores.flatMap((item) => [item.grammar, item.vocabulary, item.fluency]).filter(Number.isFinite);
  const memoryAverage = memoryScores.length ? Math.round(memoryScores.reduce((sum, value) => sum + value, 0) / memoryScores.length) : 0;

  const confirmClearHistory = () => Alert.alert(
    "Очистить историю ИИ?",
    "Диалоги и их разборы будут удалены. Прогресс курсов и слова останутся.",
    [
      { text: "Отмена", style: "cancel" },
      { text: "Очистить", style: "destructive", onPress: async () => { await clearTutorSessions(); await refresh(); } },
    ],
  );
  const confirmClearMemory = () => Alert.alert(
    "Очистить память преподавателя?",
    "Lingo забудет цели, интересы, повторяющиеся ошибки, слова и выполненные разговорные миссии. История чатов останется.",
    [
      { text: "Отмена", style: "cancel" },
      { text: "Очистить", style: "destructive", onPress: async () => { await clearTutorMemory(); await refresh(); } },
    ],
  );
  const confirmClearFeedback = () => Alert.alert(
    "Сбросить оценки ответов?",
    "Lingo перестанет учитывать отметки «неправильно», «однотипно», «сложно» и «легко».",
    [
      { text: "Отмена", style: "cancel" },
      { text: "Сбросить", style: "destructive", onPress: async () => { await clearTutorFeedback(); await refresh(); } },
    ],
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.round}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.title}>Центр ИИ</Text><Text style={styles.muted}>Память, скорость и надёжность</Text></View>
        <View style={[styles.statusDot, { backgroundColor: data.engine.loadedModelId ? colors.mint : colors.textMuted }]} />
      </View>

      <Pressable onPress={onPronunciation} style={styles.labCard}>
        <View style={styles.labIcon}><Ionicons name="mic" size={28} color={colors.text} /></View>
        <View style={{ flex: 1 }}><Text style={styles.labTitle}>Лаборатория произношения</Text><Text style={styles.labText}>Пары звуков, запись голоса, оценка и экзамен</Text></View>
        <Ionicons name="chevron-forward" size={22} color={colors.text} />
      </Pressable>

      <Pressable onPress={onSpeechModels} style={styles.speechCard}>
        <View style={styles.speechIcon}><Ionicons name="hardware-chip-outline" size={25} color={colors.mint} /></View>
        <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Офлайн-модель речи</Text><Text style={styles.rowSub}>Whisper: лёгкая, обычная или продвинутая</Text></View>
        <Ionicons name="download-outline" size={22} color={colors.mint} />
      </Pressable>

      <Text style={styles.section}>УСТРОЙСТВО И ДВИЖОК</Text>
      <View style={styles.card}>
        <Row icon="phone-portrait-outline" title={Device.modelName || "iPhone"} value={deviceMemory ? `${formatBytes(deviceMemory)} RAM` : "iOS"} />
        <Row icon="hardware-chip-outline" title="Ускорение Metal" value={data.engine.gpu === false ? "Недоступно" : "Автоматически"} good={data.engine.gpu !== false} />
        <Row icon="speedometer-outline" title="Скорость генерации" value={data.engine.tokensPerSecond ? `${data.engine.tokensPerSecond.toFixed(1)} ток./с` : "После первого ответа"} />
        <Row icon="cube-outline" title="Модель в памяти" value={AI_MODELS.find((item) => item.id === data.engine.loadedModelId)?.shortTitle || "Не загружена"} />
        <Pressable disabled={!data.engine.loadedModelId} onPress={async () => { await unloadModel(); await refresh(); }} style={[styles.outlineButton, !data.engine.loadedModelId && { opacity: 0.4 }]}>
          <Ionicons name="power-outline" size={19} color={colors.orange} /><Text style={styles.outlineText}>Выгрузить модель из памяти</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>РЕЖИМ РАБОТЫ</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Экономичный режим</Text><Text style={styles.rowSub}>Меньше контекст и нагрев, стабильнее на старых iPhone</Text></View>
          <Switch value={data.settings.economyMode} trackColor={{ false: colors.border, true: `${colors.mint}88` }} thumbColor={data.settings.economyMode ? colors.mint : colors.textMuted} onValueChange={async (value) => { await setAiSettings({ economyMode: value }); await unloadModel(); await refresh(); }} />
        </View>
        <View style={styles.notice}><Ionicons name="information-circle" color={colors.purple} size={20} /><Text style={styles.noticeText}>Изменение применится при следующем запуске модели. iOS не отдаёт приложению точную температуру, поэтому нагрузка ниже — это безопасная оценка.</Text></View>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Дополнительная редактура</Text><Text style={styles.rowSub}>Дополнительный проход для ясности и разнообразия. Ответ занимает больше времени.</Text></View>
          <Switch value={data.settings.qualityMode} trackColor={{ false: colors.border, true: `${colors.purple}88` }} thumbColor={data.settings.qualityMode ? colors.purple : colors.textMuted} onValueChange={async (value) => { await setAiSettings({ qualityMode: value }); await refresh(); }} />
        </View>
        <View style={styles.notice}><Ionicons name="hourglass-outline" color={colors.orange} size={20} /><Text style={styles.noticeText}>Высокое качество примерно вдвое медленнее: сначала создаётся черновик, затем локальная модель проверяет и редактирует его.</Text></View>
      </View>

      <Text style={styles.section}>ЛОКАЛЬНАЯ ПАМЯТЬ ПРЕПОДАВАТЕЛЯ</Text>
      <View style={styles.card}>
        <View style={styles.memoryStats}>
          <MemoryStat value={remembered.goals.length} label="целей" color={colors.purple} />
          <MemoryStat value={remembered.recurringMistakes.length} label="ошибок" color={colors.orange} />
          <MemoryStat value={remembered.usefulWords.length} label="слов" color={colors.mint} />
          <MemoryStat value={memoryAverage || "—"} label="среднее" color={colors.pink} />
        </View>
        {remembered.interests.length || remembered.goals.length ? (
          <View>
            <Text style={styles.memoryCaption}>ЦЕЛИ И ИНТЕРЕСЫ</Text>
            <View style={styles.tags}>{[
              ...remembered.goals.map((value) => ({ value, section: "goals" })),
              ...remembered.interests.map((value) => ({ value, section: "interests" })),
            ].slice(0, 10).map((item, index) => <View key={`${item.value}-${index}`} style={styles.tag}><Text numberOfLines={1} style={styles.tagText}>{item.value}</Text><Pressable hitSlop={8} onPress={async () => { await removeTutorMemoryEntry(item.section, item.value); await refresh(); }}><Ionicons name="close" size={14} color={colors.textMuted} /></Pressable></View>)}</View>
          </View>
        ) : null}
        <View>
          <Text style={styles.memoryCaption}>ДОБАВИТЬ ЦЕЛЬ ВРУЧНУЮ</Text>
          <View style={styles.memoryInputRow}>
            <TextInput value={memoryGoal} onChangeText={setMemoryGoal} placeholder="Например: пройти собеседование" placeholderTextColor={colors.textMuted} style={styles.memoryInput} maxLength={90} returnKeyType="done" />
            <Pressable disabled={!memoryGoal.trim()} onPress={async () => { await addTutorMemoryGoal(memoryGoal); setMemoryGoal(""); await refresh(); }} style={[styles.memoryAdd, !memoryGoal.trim() && { opacity: 0.35 }]}><Ionicons name="add" size={22} color={colors.text} /></Pressable>
          </View>
        </View>
        {remembered.recurringMistakes.length ? (
          <View>
            <Text style={styles.memoryCaption}>ЧТО LINGO БУДЕТ ПОВТОРЯТЬ</Text>
            {remembered.recurringMistakes.slice(0, 5).map((item, index) => <View key={`${item.key}-${index}`} style={styles.memoryMistake}><Ionicons name="refresh" size={16} color={colors.orange} /><Text style={styles.memoryMistakeText}>{item.explanation || item.corrected}</Text><Text style={styles.memoryCount}>×{item.count || 1}</Text><Pressable hitSlop={8} onPress={async () => { await removeTutorMemoryEntry("recurringMistakes", item.key); await refresh(); }}><Ionicons name="close-circle-outline" size={18} color={colors.textMuted} /></Pressable></View>)}
          </View>
        ) : null}
        {remembered.usefulWords.length ? <View><Text style={styles.memoryCaption}>СЛОВА В ПАМЯТИ</Text><View style={styles.tags}>{remembered.usefulWords.slice(0, 12).map((item, index) => <View key={`${item.key}-${index}`} style={[styles.tag, { backgroundColor: "rgba(46,211,183,0.1)" }]}><Text style={styles.tagText}>{item.english}</Text><Pressable hitSlop={8} onPress={async () => { await removeTutorMemoryEntry("usefulWords", item.key); await refresh(); }}><Ionicons name="close" size={14} color={colors.textMuted} /></Pressable></View>)}</View></View> : null}
        {!remembered.goals.length && !remembered.interests.length && !remembered.recurringMistakes.length ? <View style={styles.notice}><Ionicons name="bulb-outline" color={colors.purple} size={20} /><Text style={styles.noticeText}>Память заполнится после первого разбора разговора. Lingo будет использовать её только на этом iPhone.</Text></View> : null}
      </View>

      <Text style={styles.section}>ХРАНИЛИЩЕ</Text>
      <View style={styles.storageGrid}>
        <Stat label="Модели" value={formatBytes(installedBytes)} color={colors.purple} />
        <Stat label="Свободно" value={formatBytes(data.freeSpace)} color={colors.mint} />
        <Stat label="История" value={`${data.sessions.length} диалогов`} color={colors.orange} />
      </View>
      {AI_MODELS.map((model) => {
        const state = data.models[model.id];
        return state?.installed ? <View key={model.id} style={styles.modelRow}><View style={[styles.modelMark, { backgroundColor: `${model.color}22` }]}><Ionicons name="checkmark-circle" color={model.color} size={24} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{model.shortTitle || model.title} · {model.sizeLabel}</Text><Text style={styles.rowSub}>Заголовок GGUF проверен · {riskFor(model)} по размеру файла</Text></View></View> : null;
      })}

      <Text style={styles.section}>ОБСЛУЖИВАНИЕ</Text>
      <View style={styles.card}>
        <Pressable disabled={busy} onPress={async () => { setBusy(true); await clearIncompleteModels(); await refresh(); setBusy(false); }} style={styles.actionRow}><Ionicons name="sparkles-outline" size={22} color={colors.mint} /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Очистить незавершённые файлы</Text><Text style={styles.rowSub}>{partialBytes ? `Можно освободить ${formatBytes(partialBytes)}` : "Лишних файлов не найдено"}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>
        <Pressable onPress={confirmClearHistory} style={styles.actionRow}><Ionicons name="trash-outline" size={22} color={colors.pink} /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Очистить историю ИИ</Text><Text style={styles.rowSub}>Не затрагивает курсы и словарь</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>
        <Pressable onPress={confirmClearMemory} style={styles.actionRow}><Ionicons name="bulb-outline" size={22} color={colors.orange} /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Очистить память преподавателя</Text><Text style={styles.rowSub}>Цели, ошибки, слова и разговорные миссии</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>
        <Pressable onPress={confirmClearFeedback} style={styles.actionRow}><Ionicons name="thumbs-up-outline" size={22} color={colors.purple} /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Сбросить оценки ответов</Text><Text style={styles.rowSub}>{data.feedback.length ? `${data.feedback.length} локальных оценок влияют на стиль Lingo` : "Оценок пока нет"}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ icon, title, value, good }) {
  useTheme(); return <View style={styles.row}><Ionicons name={icon} size={21} color={good ? colors.mint : colors.textMuted} /><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
function Stat({ label, value, color }) {
  useTheme(); return <View style={styles.stat}><View style={[styles.statDot, { backgroundColor: color }]} /><Text style={styles.statValue}>{value}</Text><Text style={styles.rowSub}>{label}</Text></View>; }
function MemoryStat({ value, label, color }) {
  useTheme(); return <View style={styles.memoryStat}><Text style={[styles.memoryValue, { color }]}>{value}</Text><Text style={styles.memoryStatLabel}>{label}</Text></View>; }

const styles = createThemedStyles(() => ({
  page: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 130 }, center: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 22 }, round: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontWeight: "900", fontSize: 28 }, muted: { color: colors.textMuted, marginTop: 3 }, statusDot: { width: 11, height: 11, borderRadius: 6 },
  labCard: { backgroundColor: colors.accentSoft, borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }, labIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#ffffff22", alignItems: "center", justifyContent: "center" }, labTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, labText: { color: "#E9E3FF", marginTop: 4, lineHeight: 19 },
  speechCard: { backgroundColor: colors.card, borderRadius: 19, borderWidth: 1, borderColor: `${colors.mint}44`, padding: 14, marginTop: 11, flexDirection: "row", alignItems: "center", gap: 12 }, speechIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: `${colors.mint}15`, alignItems: "center", justifyContent: "center" },
  section: { color: colors.textMuted, fontSize: 12, letterSpacing: 2, fontWeight: "900", marginTop: 27, marginBottom: 10 }, card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 17, gap: 15 }, row: { flexDirection: "row", alignItems: "center", gap: 11 }, rowTitle: { color: colors.text, fontSize: 15, fontWeight: "800", flex: 1 }, rowValue: { color: colors.textMuted, fontWeight: "700", maxWidth: "45%", textAlign: "right" }, rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  outlineButton: { borderWidth: 1, borderColor: `${colors.orange}66`, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, outlineText: { color: colors.orange, fontWeight: "900" }, switchRow: { flexDirection: "row", alignItems: "center", gap: 14 }, notice: { backgroundColor: `${colors.purple}12`, padding: 12, borderRadius: 14, flexDirection: "row", gap: 9 }, noticeText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  storageGrid: { flexDirection: "row", gap: 9 }, stat: { flex: 1, minHeight: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13, justifyContent: "center" }, statDot: { width: 9, height: 9, borderRadius: 5, marginBottom: 10 }, statValue: { color: colors.text, fontWeight: "900", fontSize: 16 }, modelRow: { marginTop: 9, backgroundColor: colors.card, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, modelMark: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, actionRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 },
  memoryStats: { flexDirection: "row", gap: 7 }, memoryStat: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 14, paddingVertical: 11, alignItems: "center" }, memoryValue: { fontSize: 20, fontWeight: "900" }, memoryStatLabel: { color: colors.textMuted, fontSize: 9, marginTop: 2 }, memoryCaption: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, tag: { maxWidth: "100%", backgroundColor: "rgba(124,92,252,0.13)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 5 }, tagText: { color: colors.text, fontSize: 11, fontWeight: "700", maxWidth: 220 }, memoryMistake: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 }, memoryMistakeText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 16 }, memoryCount: { color: colors.orange, fontSize: 10, fontWeight: "900" }, memoryInputRow: { flexDirection: "row", gap: 8 }, memoryInput: { flex: 1, minHeight: 44, backgroundColor: colors.cardLight, borderRadius: 13, color: colors.text, paddingHorizontal: 12, fontSize: 12 }, memoryAdd: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
}));
