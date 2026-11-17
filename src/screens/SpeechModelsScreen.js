import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors , useTheme, createThemedStyles } from "../theme";
import { ProgressBar } from "../components/UI";
import { getFreeSpace } from "../services/localAi";
import {
  SPEECH_MODELS,
  cancelSpeechModelDownload,
  deleteSpeechModel,
  downloadSpeechModel,
  getActiveSpeechModelId,
  getSpeechDownloadState,
  inspectSpeechModels,
  setActiveSpeechModelId,
  subscribeSpeechDownload,
} from "../services/offlineSpeech";

const size = (bytes) => bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} ГБ` : `${Math.round(bytes / 1024 ** 2)} МБ`;

export default function SpeechModelsScreen({ onClose }) {
  useTheme();
  const [installed, setInstalled] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [download, setDownload] = useState(getSpeechDownloadState());
  const [free, setFree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    const [models, id, space] = await Promise.all([inspectSpeechModels(), getActiveSpeechModelId(), getFreeSpace()]);
    setInstalled(models); setActiveId(models[id]?.installed ? id : null); setFree(space); setLoading(false);
  };
  useEffect(() => { refresh().catch(() => setLoading(false)); }, []);
  useEffect(() => subscribeSpeechDownload((value) => { setDownload(value); if (value.status === "completed") refresh(); if (value.status === "error") setError(value.error); }), []);

  const install = async (model) => {
    setError("");
    if (free && free < model.size * 1.4) { setError(`Недостаточно места. Освободите минимум ${model.sizeLabel}.`); return; }
    try { await downloadSpeechModel(model); await refresh(); } catch (e) { if (!["paused", "cancelled"].includes(getSpeechDownloadState().status)) setError(e?.message || "Не удалось скачать модель"); }
  };
  const remove = (model) => Alert.alert(`Удалить «${model.title}»?`, `Освободится около ${model.sizeLabel}. Записи и прогресс останутся.`, [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: async () => { await deleteSpeechModel(model); await refresh(); } }]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.purple} /></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={s.header}><Pressable onPress={onClose} style={s.round}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={s.title}>Офлайн-речь</Text><Text style={s.muted}>Whisper работает только на iPhone</Text></View><View style={s.offline}><Ionicons name="airplane" size={18} color={colors.mint} /></View></View>
    <View style={s.hero}><View style={s.heroIcon}><Ionicons name="waveform" size={30} color={colors.text} /></View><View style={{ flex: 1 }}><Text style={s.heroTitle}>Скачай один раз</Text><Text style={s.heroText}>После загрузки интернет не нужен. Модель слышит слова, пропуски и замены без распознавания Apple.</Text></View></View>
    <View style={s.info}><Ionicons name="information-circle" size={20} color={colors.orange} /><Text style={s.infoText}>Whisper оценивает понятность слов, паузы и темп. Точную позицию языка и отдельные фонемы он не измеряет.</Text></View>
    <View style={s.sectionRow}><Text style={s.section}>ВЫБЕРИ ТОЧНОСТЬ</Text>{free ? <Text style={s.free}>Свободно {size(free)}</Text> : null}</View>
    {SPEECH_MODELS.map((model) => {
      const ready = installed[model.id]?.installed;
      const downloading = download.status === "downloading" && download.modelId === model.id;
      const blocked = download.status === "downloading" && !downloading;
      return <View key={model.id} style={[s.card, (activeId === model.id || downloading) && { borderColor: model.color }]}>
        <View style={s.cardTop}><View style={[s.modelIcon, { backgroundColor: `${model.color}20` }]}><Ionicons name={model.id === "speech-light" ? "flash" : model.id === "speech-standard" ? "mic" : "diamond"} size={23} color={model.color} /></View><View style={{ flex: 1 }}><View style={s.nameRow}><Text style={s.modelTitle}>{model.title}</Text>{model.recommended ? <Text style={s.recommended}>СОВЕТУЕМ</Text> : null}</View><Text style={s.subtitle}>{model.subtitle}</Text></View><Text style={[s.modelSize, { color: model.color }]}>{model.sizeLabel}</Text></View>
        <View style={s.facts}><Text style={s.fact}>{model.model}</Text><Text style={s.fact}>{model.device}</Text></View>
        {downloading ? <View style={s.download}><View style={s.progressRow}><Text style={s.progressText}>Загрузка {Math.round(download.progress * 100)}%</Text><Text style={s.muted}>{size(download.written)} из {model.sizeLabel}</Text></View><ProgressBar value={download.progress} color={model.color} height={8} /><Text style={s.background}>Можно переключать вкладки — загрузка восстановится</Text><Pressable onPress={cancelSpeechModelDownload} style={s.cancel}><Text style={s.cancelText}>Отменить</Text></Pressable></View> : ready ? <View style={s.actions}><Pressable onPress={async () => { await setActiveSpeechModelId(model.id); setActiveId(model.id); }} style={[s.select, { backgroundColor: activeId === model.id ? model.color : colors.cardLight }]}><Ionicons name={activeId === model.id ? "checkmark-circle" : "radio-button-off"} size={19} color={colors.text} /><Text style={s.selectText}>{activeId === model.id ? "Используется" : "Выбрать"}</Text></Pressable><Pressable onPress={() => remove(model)} style={s.delete}><Ionicons name="trash-outline" size={20} color={colors.textMuted} /></Pressable></View> : <Pressable disabled={blocked} onPress={() => install(model)} style={[s.install, blocked && { opacity: 0.35 }]}><Ionicons name="cloud-download-outline" size={20} color={model.color} /><Text style={[s.installText, { color: model.color }]}>Скачать</Text></Pressable>}
      </View>;
    })}
    {error ? <View style={s.error}><Ionicons name="alert-circle" size={20} color={colors.pink} /><Text style={s.errorText}>{error}</Text></View> : null}
    <Text style={s.license}>Whisper.cpp · модели OpenAI Whisper · файлы GGML Q5</Text>
  </ScrollView>;
}

const s = createThemedStyles(() => ({
  page: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 130 }, center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }, header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }, round: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontSize: 27, fontWeight: "900" }, muted: { color: colors.textMuted, fontSize: 11 }, offline: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(46,211,183,0.12)", alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: "rgba(124,92,252,0.13)", borderWidth: 1, borderColor: "rgba(124,92,252,0.35)", borderRadius: 22, padding: 17, flexDirection: "row", gap: 13, alignItems: "center" }, heroIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }, heroTitle: { color: colors.text, fontSize: 18, fontWeight: "900" }, heroText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }, info: { flexDirection: "row", gap: 9, backgroundColor: "rgba(255,159,67,0.09)", borderRadius: 16, padding: 13, marginTop: 12 }, infoText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, flex: 1 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 }, section: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: "900" }, free: { color: colors.textMuted, fontSize: 10 }, card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 11 }, modelIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, nameRow: { flexDirection: "row", alignItems: "center", gap: 6 }, modelTitle: { color: colors.text, fontSize: 17, fontWeight: "900" }, recommended: { color: colors.purple, fontSize: 8, fontWeight: "900", backgroundColor: "rgba(124,92,252,0.14)", borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 }, subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 }, modelSize: { fontSize: 12, fontWeight: "900" }, facts: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 11, marginTop: 12, gap: 4 }, fact: { color: colors.textMuted, fontSize: 10 },
  install: { height: 47, marginTop: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, installText: { fontWeight: "900", fontSize: 13 }, download: { marginTop: 13 }, progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }, progressText: { color: colors.text, fontSize: 11, fontWeight: "800" }, background: { color: colors.mint, fontSize: 9, textAlign: "center", marginTop: 8 }, cancel: { alignSelf: "center", padding: 9 }, cancelText: { color: colors.pink, fontSize: 11, fontWeight: "800" }, actions: { flexDirection: "row", gap: 8, marginTop: 13 }, select: { flex: 1, height: 47, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, selectText: { color: colors.text, fontWeight: "900", fontSize: 12 }, delete: { width: 47, height: 47, borderRadius: 14, backgroundColor: colors.cardLight, alignItems: "center", justifyContent: "center" }, error: { flexDirection: "row", gap: 8, backgroundColor: "rgba(255,92,138,0.1)", borderRadius: 14, padding: 13 }, errorText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 16 }, license: { color: colors.textMuted, textAlign: "center", fontSize: 9, marginTop: 8 },
}));
