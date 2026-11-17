import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Clipboard from 'expo-clipboard';
import {performanceSummary} from '../utils/performance';
import { nativeResourceState } from '../services/nativeResources';
import { useAuth } from "../store/AuthContext";
import { useCloudSync } from "../store/CloudSyncContext";
import { useProgress } from "../store/ProgressContext";
import { lessons } from "../data/course";
import { tenseModules } from "../data/advancedCourse";
import { grammarTracks } from "../data/grammarAcademy";
import { extendedWordBankSize, wordBankSize } from "../data/wordBank";
import { colors } from "../theme";

const yesNo = (value) => (value ? "Готово" : "Не установлено");

export default function DiagnosticsScreen({ onClose }) {
  const { user } = useAuth();
  const { progress, localUpdatedAt, storageError } = useProgress();
  const {
    status,
    lastSyncedAt,
    lastError,
    revision,
    syncNow,
    restoreFromCloud,
  } = useCloudSync();
  const [device, setDevice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [timings,setTimings]=useState(()=>performanceSummary());
  const [resources, setResources] = useState(nativeResourceState);

  const refresh = useCallback(async () => {
    setBusy(true);
    setTimings(performanceSummary());
    setResources(nativeResourceState());
    try {
      const [ai, speech] = await Promise.all([
        import("../services/localAi"),
        import("../services/offlineSpeech"),
      ]);
      const [aiModels, activeAi, speechModels, activeSpeech] = await Promise.all([
        ai.inspectModels(),
        ai.getActiveModelId(),
        speech.inspectSpeechModels(),
        speech.getActiveSpeechModelId(),
      ]);
      setDevice({
        aiInstalled: Object.values(aiModels).filter((item) => item.installed).length,
        activeAi,
        speechInstalled: Object.values(speechModels).filter((item) => item.installed).length,
        activeSpeech,
        engineLoaded: Boolean(ai.getEngineDiagnostics().loadedModelId),
      });
    } catch (error) {
      setDevice({ error: error?.message || "Не удалось проверить локальные модели" });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const forceRestore = () => Alert.alert(
    "Восстановить из облака?",
    "Локальный прогресс будет заменён последней облачной копией этого аккаунта.",
    [
      { text: "Отмена", style: "cancel" },
      { text: "Восстановить", onPress: restoreFromCloud },
    ],
  );

  const cloudLabel = {
    synced: "Синхронизировано",
    syncing: "Синхронизация…",
    pending: "Ожидает отправки",
    error: "Ошибка синхронизации",
    offline: "Только локально",
  }[status] || status;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Диагностика</Text>
        <Pressable onPress={refresh} style={styles.back}>
          <Ionicons name="refresh" size={21} color={colors.purple} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="pulse" size={34} color={colors.mint} />
          <Text style={styles.title}>Состояние LingoSpark</Text>
          <Text style={styles.muted}>Версия {Constants.expoConfig?.version || "—"} · сборка {Constants.expoConfig?.ios?.buildNumber || "—"}</Text>
        </View>

        <Section title="ОБЛАЧНОЕ СОХРАНЕНИЕ">
          <Row icon="cloud-done" label="Статус" value={cloudLabel} good={status === "synced"} />
          <Row icon="person" label="Аккаунт" value={user?.email || "Гостевой режим"} good={Boolean(user)} />
          <Row icon="git-commit" label="Ревизия копии" value={revision ? `№ ${revision}` : "Нет копии"} good={revision > 0} />
          <Row icon="time" label="Последняя синхронизация" value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("ru-RU") : "Ещё не было"} />
          {!!lastError && <Text style={styles.error}>{lastError}</Text>}
          {!!storageError && <Text style={styles.error}>{storageError}</Text>}
          <View style={styles.actions}>
            <Action title="Сохранить сейчас" icon="cloud-upload" onPress={syncNow} disabled={!user || status === "syncing"} />
            <Action title="Из облака" icon="cloud-download" onPress={forceRestore} disabled={!user || status === "syncing"} />
          </View>
        </Section>

        <Section title="ЛОКАЛЬНЫЕ ДАННЫЕ">
          <Row icon="phone-portrait" label="Локальная копия" value={localUpdatedAt ? new Date(localUpdatedAt).toLocaleString("ru-RU") : "Создаётся"} good />
          <Row icon="map" label="Курсы" value={`${progress.completed.length} / ${lessons.length}`} />
          <Row icon="time" label="Времена" value={`${progress.completedTenses?.length || 0} / ${tenseModules.length}`} />
          <Row icon="school" label="Грамматика" value={`${progress.completedGrammarTracks?.length || 0} / ${grammarTracks.length}`} />
          <Row icon="library" label="Словарь" value={`${wordBankSize} основных · ${extendedWordBankSize} всего`} good />
        </Section>

        <Section title="БЫСТРОДЕЙСТВИЕ · ТЕКУЩИЙ ЗАПУСК">
          <Row icon="hardware-chip" label="Очередь локальных движков" value={`Ожидают: ${resources.pending} · задача: ${resources.active || 'нет'}`} />
          {!timings.length&&<Text style={styles.value}>Замеры появятся после открытия экранов и прослушивания фраз.</Text>}
          {timings.map((entry)=><Row key={entry.name} icon="speedometer" label={({startup_js:'Запуск JavaScript',words_open:'Экран слов',dictionary_open:'Открытие словаря',dictionary_filter:'Поиск в словаре',speech_start:'Озвучка: вся задержка',speech_prepare:'Озвучка: подготовка',speech_stop:'Озвучка: остановка',speech_native_start:'Озвучка: нативный запуск',practice_open:'Экран практики',journey_open:'Учебная тема',learning_home_open:'Экран обучения',native_queue_wait:'Ожидание движка',ai_first_token:'Первый токен ИИ',progress_serialize:'Подготовка сохранения'})[entry.name] || entry.name} value={`${entry.last} мс · 95% до ${entry.p95} мс · замеров ${entry.count}`}/>)}
          <Text style={styles.value}>Последние 60 замеров. Открытие экрана — от начала отрисовки до следующего кадра. Запуск JS не включает загрузку iOS. Озвучка — от нажатия до события начала речи.</Text>
        </Section>

        <Section title={`СООБЩЕНИЯ ОБ ОШИБКАХ · ${progress.contentReports?.length || 0}`}>
          <Text style={styles.value}>Записи сохраняются в прогрессе. Автоматической отправки разработчику нет.</Text>
          {(progress.contentReports || []).slice(0,10).map((report)=><View key={report.key} style={{paddingVertical:10}}><Text style={styles.label}>{report.reason} · {report.topic || 'Задание'}</Text><Text style={styles.value}>{report.prompt}</Text><Text style={styles.value}>Ответ: {report.answer} · отмечено {report.count} раз</Text></View>)}
          <Action title="Скопировать все записи" icon="copy" disabled={!progress.contentReports?.length} onPress={async()=>{await Clipboard.setStringAsync(JSON.stringify({version:Constants.expoConfig?.version,reports:progress.contentReports},null,2));Alert.alert('Скопировано','Можно вставить записи в сообщение для разбора. Они включают вопросы и выбранные ответы.');}}/>
        </Section>

        <Section title="ОФЛАЙН-МОДЕЛИ">
          {busy && !device ? <ActivityIndicator color={colors.purple} /> : (
            <>
              <Row icon="hardware-chip" label="Модели ИИ" value={device?.error || `${device?.aiInstalled || 0} установлено · ${device?.activeAi || "не выбрана"}`} good={Boolean(device?.activeAi)} />
              <Row icon="mic" label="Распознавание речи" value={device?.error || `${device?.speechInstalled || 0} установлено · ${device?.activeSpeech || "не выбрана"}`} good={Boolean(device?.activeSpeech)} />
              <Row icon="flash" label="ИИ загружен в память" value={yesNo(device?.engineLoaded)} good={Boolean(device?.engineLoaded)} />
            </>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>;
}

function Row({ icon, label, value, good }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={19} color={good ? colors.mint : colors.textMuted} />
      <View style={{ flex: 1 }}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>
      {good && <Ionicons name="checkmark-circle" size={20} color={colors.mint} />}
    </View>
  );
}

function Action({ title, icon, onPress, disabled }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: 0.4 }]}><Ionicons name={icon} size={18} color={colors.purple} /><Text style={styles.actionText}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  content: { padding: 20, paddingBottom: 50 },
  hero: { alignItems: "center", padding: 22, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  title: { color: "white", fontSize: 24, fontWeight: "900", marginTop: 10 },
  muted: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  section: { marginTop: 22 },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 3 },
  row: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { color: "white", fontWeight: "800", fontSize: 13 },
  value: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  error: { color: colors.pink, fontSize: 11, lineHeight: 17, paddingVertical: 8 },
  actions: { flexDirection: "row", gap: 9, marginTop: 13 },
  action: { flex: 1, minHeight: 46, borderRadius: 15, backgroundColor: colors.cardLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  actionText: { color: "white", fontSize: 11, fontWeight: "800" },
});
