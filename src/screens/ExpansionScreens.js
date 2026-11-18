import { evaluateExercise } from '../utils/answer';
import React, { useMemo, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../store/AuthContext';
import { recoveryKey } from '../store/CloudSyncContext';
import { backupEnvelope, parseBackup, snapshotSummary } from '../utils/snapshot';
import {
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
import * as Clipboard from "expo-clipboard";
import { speak } from "../utils/speech";
import { expandExplanation } from "../utils/explanations";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { requestLearningNotifications, sendTestNotification } from '../services/learningNotifications';
import { notificationPreferences } from '../utils/notificationPlans';
import { Base64 } from "js-base64";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import {
  commonMistakes,
  shadowingLines,
  thematicPacks,
} from "../data/expansion";
import { useProgress } from "../store/ProgressContext";
import { colors , useTheme, createThemedStyles } from "../theme";
import AppearancePicker from '../components/AppearancePicker';
import { PrimaryButton, ProgressBar } from "../components/UI";
import { balancedOptions } from "../utils/shuffle";

function Header({ title, onClose }) {
  useTheme();
  return (
    <View style={s.header}>
      <Pressable onPress={onClose} style={s.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function BackupScreen({ onClose, initialMode = 'export' }) {
  useTheme();
  const { progress, restoreProgress } = useProgress();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState(initialMode);
  const backupData = useMemo(() => backupEnvelope(progress), [progress]);
  const backup = useMemo(() => Base64.encode(JSON.stringify(backupData)), [backupData]);
  const copy = async () => {
    await Clipboard.setStringAsync(backup);
    Alert.alert(
      "Скопировано",
      "Сохраните код в «Заметках» или отправьте себе сообщением.",
    );
  };
  const restore = () => {
    try {
      const parsed = parseBackup(JSON.parse(Base64.decode(code.trim())));
      const summary = snapshotSummary(parsed);
      Alert.alert('Восстановить копию?', `Уроков: ${summary.lessons}, слов: ${summary.words}, XP: ${summary.xp}. Текущий прогресс будет заменён.`, [{ text: 'Отмена', style: 'cancel' }, { text: 'Восстановить', onPress: () => { restoreProgress(parsed); setCode(''); } }]);
    } catch (error) {
      Alert.alert("Неверный код", error.message || "Проверьте, что код скопирован полностью.");
    }
  };
  const exportFile = async () => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      const uri = `${FileSystem.cacheDirectory}LingoSpark-backup-${date}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(backupData, null, 2));
      if (!(await Sharing.isAvailableAsync())) throw new Error("sharing");
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: "Сохранить резервную копию LingoSpark",
        UTI: "public.json",
      });
    } catch {
      Alert.alert("Не удалось сохранить", "Попробуйте скопировать резервный код ниже.");
    }
  };
  const exportRecovery = async () => {
    try {
      const raw = user && await AsyncStorage.getItem(recoveryKey(user.id));
      if (!raw) { Alert.alert('Копий нет', 'Здесь появятся обе версии после разрешения облачного конфликта.'); return; }
      const saved = JSON.parse(raw);
      const share = async key => {
        const uri = `${FileSystem.cacheDirectory}LingoSpark-recovery-${key}.json`;
        await FileSystem.writeAsStringAsync(uri, JSON.stringify(saved[key], null, 2));
        await Sharing.shareAsync(uri, { mimeType: 'application/json' });
      };
      Alert.alert('Копии до замены', 'Выбери версию для экспорта. Текущий прогресс не меняется.', [{ text: 'Отмена', style: 'cancel' }, { text: 'С устройства', onPress: () => share('local').catch(() => Alert.alert('Ошибка экспорта')) }, { text: 'Из облака', onPress: () => share('cloud').catch(() => Alert.alert('Ошибка экспорта')) }]);
    } catch { Alert.alert('Не удалось прочитать сохранённые копии'); }
  };
  const importFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled) return;
      const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
      const parsed = JSON.parse(raw);
      const restored = parseBackup(parsed);
      Alert.alert(
        "Восстановить прогресс?",
        `Копия создана ${parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString("ru-RU") : "ранее"}. Текущие данные будут заменены.`,
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Восстановить",
            style: "destructive",
            onPress: () => {
              restoreProgress(restored);
              Alert.alert("Готово", "Все данные восстановлены из файла.");
            },
          },
        ],
      );
    } catch {
      Alert.alert("Файл не подходит", "Выберите JSON-файл, созданный в LingoSpark.");
    }
  };
  return (
    <View style={s.container}>
      <Header title="Резервная копия" onClose={onClose} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.segment}>
          <Pressable
            onPress={() => setMode("export")}
            style={[s.segmentButton, mode === "export" && s.segmentActive]}
          >
            <Text style={s.segmentText}>Сохранить</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("import")}
            style={[s.segmentButton, mode === "import" && s.segmentActive]}
          >
            <Text style={s.segmentText}>Восстановить</Text>
          </Pressable>
        </View>
        {mode === "export" ? (
          <>
            <View style={s.hero}>
              <Text style={s.heroEmoji}>🔐</Text>
              <Text style={s.bigTitle}>Сохрани прогресс</Text>
              <Text style={s.subtitle}>
                Код содержит XP, уроки, словарь, ошибки, монеты и настройки.
                Сохрани его в надёжном месте.
              </Text>
            </View>
            <View style={s.codeBox}>
              <Text numberOfLines={5} style={s.code}>
                {backup}
              </Text>
            </View>
            <PrimaryButton title="Сохранить файл .json" icon="download" onPress={exportFile} />
            <View style={{ height: 9 }} />
            <PrimaryButton title="Скопировать код" icon="copy" onPress={copy} />
            <View style={{ height: 9 }} />
            <PrimaryButton title="Копии до облачной замены" onPress={exportRecovery} color={colors.cardLight} />
            <Text style={s.backupHint}>Файл удобнее переносить между версиями IPA. Код оставлен как запасной способ.</Text>
          </>
        ) : (
          <>
            <Text style={s.bigTitle}>Вставь код</Text>
            <Text style={s.subtitleLeft}>
              Старые данные на этом устройстве будут заменены резервной копией.
            </Text>
            <PrimaryButton title="Выбрать файл резервной копии" icon="folder-open" onPress={importFile} />
            <Text style={s.orText}>ИЛИ ВСТАВЬТЕ РЕЗЕРВНЫЙ КОД</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Вставьте код восстановления…"
              placeholderTextColor={colors.textMuted}
              style={s.codeInput}
            />
            <PrimaryButton
              title="Восстановить прогресс"
              onPress={restore}
              disabled={!code.trim()}
              color={colors.orange}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function SettingsScreen({ onClose }) {
  const appearance = useTheme();
  const { progress, updateSettings } = useProgress();
  const settings = {
    accent: "en-US",
    speechRate: 0.78,
    strictChecking: false,
    lessonSize: 5,
    challengeMode: false,
    largeText: false,
    reduceMotion: false,
    haptics: true,
    voiceFeedback: false,
    quickActions: ["dictation", "dialogues", "review", "mistakes"],
    ...progress.settings,
  };
  const sample = () =>
    speak("Practice makes progress", {
      language: settings.accent,
      rate: settings.speechRate,
    });
  const notifications = notificationPreferences(settings);
  const allowNotifications = async () => {
    if (await requestLearningNotifications()) return true;
    Alert.alert("Уведомления выключены", "Разреши уведомления для LingoSpark в настройках устройства.");
    return false;
  };
  const setNotificationOption = async (key, enabled) => {
    try {
      if (!enabled || await allowNotifications()) updateSettings({ [key]: enabled });
    } catch {
      Alert.alert("Не удалось изменить настройку уведомлений");
    }
  };
  const testReminder = async () => {
    try {
      if (await allowNotifications()) await sendTestNotification();
    } catch {
      Alert.alert("Не удалось отправить тестовое уведомление");
    }
  };
  return (
    <View style={s.container}>
      <Header title="Настройки" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Оформление</Text>
        <AppearancePicker />
        <Text style={s.sectionTitle}>Напоминания</Text>
        <View style={s.card}>
          <SettingRow
            title="Пора повторить"
            detail="Когда подошёл срок повторения слов, фраз или урока"
            value={notifications.review}
            onChange={enabled => setNotificationOption('reviewReminderEnabled', enabled)}
          />
          <SettingRow
            title="Продолжить занятие"
            detail="Если остался сохранённый шаг и сегодня ещё не занимался"
            value={notifications.resume}
            onChange={enabled => setNotificationOption('resumeReminderEnabled', enabled)}
          />
          <SettingRow
            title="Модель скачана"
            detail="Когда локальная ИИ-модель проверена и готова к запуску"
            value={notifications.model}
            onChange={enabled => setNotificationOption('modelNotificationEnabled', enabled)}
          />
          <Text style={s.label}>Время учебного напоминания</Text>
          <Text style={s.cardText}>До одного напоминания в день. Если уже занимался, следующее придёт в другой день.</Text>
          <View style={s.choices}>
            {[
              [9, "09:00"],
              [14, "14:00"],
              [19, "19:00"],
              [21, "21:00"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => updateSettings({ reminderHour: value })}
                style={[s.choice, notifications.hour === value && s.choiceActive]}
              >
                <Text style={s.choiceText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={testReminder} style={s.testVoice}>
            <Ionicons name="notifications" size={20} color={colors.orange} />
            <Text style={[s.testVoiceText, { color: colors.orange }]}>Проверить уведомление</Text>
          </Pressable>
        </View>
        <Text style={s.sectionTitle}>Быстрые действия</Text>
        <View style={s.card}>
          <Text style={s.cardText}>
            Выбери до четырёх кнопок для главного экрана
          </Text>
          <View style={s.choices}>
            {[
              ["dictation", "Диктант"],
              ["dialogues", "Диалоги"],
              ["review", "Случайные слова"],
              ["mistakes", "Ошибки"],
              ["adaptive", "Для тебя"],
              ["tenses", "Времена"],
            ].map(([value, label]) => {
              const selected = settings.quickActions.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    const current = settings.quickActions;
                    const next = selected
                      ? current.length > 2
                        ? current.filter((item) => item !== value)
                        : current
                      : current.length < 4
                        ? [...current, value]
                        : [...current.slice(1), value];
                    updateSettings({ quickActions: next });
                  }}
                  style={[s.choice, selected && s.choiceActive]}
                >
                  <Text style={s.choiceText}>
                    {selected ? `✓ ${label}` : label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={s.sectionTitle}>Интерфейс</Text>
        <View style={s.card}>
          <SettingRow
            title="Увеличенный текст"
            detail="Крупнее вопросы и варианты в уроках"
            value={settings.largeText}
            onChange={(value) => updateSettings({ largeText: value })}
          />
          <SettingRow
            title="Меньше анимаций"
            detail={appearance.reduceMotion && !appearance.userReduceMotion ? 'Движение уменьшено в системных настройках' : 'Отключить движения и оставить только смену цвета'}
            value={appearance.userReduceMotion || settings.reduceMotion}
            onChange={(value) => { appearance.setReduceMotion(value); updateSettings({ reduceMotion: value }); }}
          />
          <SettingRow
            title="Вибрация ответов"
            detail="Лёгкий отклик после проверки"
            value={settings.haptics}
            onChange={(value) => updateSettings({ haptics: value })}
          />
          <SettingRow
            title="Голосовой отклик"
            detail="Произносить Correct или Try again"
            value={settings.voiceFeedback}
            onChange={(value) => updateSettings({ voiceFeedback: value })}
          />
        </View>
        <Text style={s.sectionTitle}>Произношение</Text>
        <View style={s.card}>
          <Text style={s.label}>Акцент</Text>
          <View style={s.choices}>
            {[
              ["en-US", "🇺🇸 США"],
              ["en-GB", "🇬🇧 Британия"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => updateSettings({ accent: value })}
                style={[s.choice, settings.accent === value && s.choiceActive]}
              >
                <Text style={s.choiceText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.label}>Скорость речи</Text>
          <View style={s.choices}>
            {[
              [0.58, "Медленно"],
              [0.78, "Обычно"],
              [0.95, "Быстро"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => updateSettings({ speechRate: value })}
                style={[
                  s.choice,
                  settings.speechRate === value && s.choiceActive,
                ]}
              >
                <Text style={s.choiceText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={sample} style={s.testVoice}>
            <Ionicons name="volume-high" size={20} color={colors.purple} />
            <Text style={s.testVoiceText}>Проверить голос</Text>
          </Pressable>
        </View>
        <Text style={s.sectionTitle}>Сложность</Text>
        <View style={s.card}>
          <Text style={s.label}>Размер тренировки</Text>
          <View style={s.choices}>
            {[5, 10, 15].map((value) => (
              <Pressable
                key={value}
                onPress={() => updateSettings({ lessonSize: value })}
                style={[
                  s.choice,
                  settings.lessonSize === value && s.choiceActive,
                ]}
              >
                <Text style={s.choiceText}>{value} заданий</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
function SettingRow({ title, detail, value, onChange }) {
  useTheme();
  return (
    <View style={s.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardText}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cardLight, true: colors.purple }}
      />
    </View>
  );
}

export function CommonMistakesScreen({ onClose }) {
  useTheme();
  const { recordExercise } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [optionSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const item = commonMistakes[index];
  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const right = evaluateExercise(item, (option)).correct;
    if (right) setScore(score + 1);
    recordExercise(
      { id: item.id, prompt: `Исправь: ${item.wrong}`, answer: item.correct },
      right,
    );
  };
  const next = () => {
    if (index === commonMistakes.length - 1) setDone(true);
    else {
      setIndex(index + 1);
      setSelected("");
    }
  };
  if (done)
    return (
      <View style={s.container}>
        <Header title="Типичные ошибки" onClose={onClose} />
        <View style={s.center}>
          <Text style={s.heroEmoji}>🎯</Text>
          <Text style={s.result}>
            {score}/{commonMistakes.length}
          </Text>
          <Text style={s.subtitle}>Ошибки добавлены в персональный журнал</Text>
          <View style={{ width: "100%" }}>
            <PrimaryButton title="Завершить" onPress={onClose} />
          </View>
        </View>
      </View>
    );
  return (
    <View style={s.container}>
      <Header title="Типичные ошибки" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <ProgressBar
          value={(index + 1) / commonMistakes.length}
          color={colors.pink}
        />
        <Text style={s.topic}>{item.topic}</Text>
        <Text style={s.prompt}>Исправь ошибку:</Text>
        <View style={s.wrongBox}>
          <Ionicons name="close-circle" size={24} color={colors.pink} />
          <Text style={s.wrong}>{item.wrong}</Text>
        </View>
        {balancedOptions(item.options, item.answer, index, optionSeed).map(
          (option) => (
            <Pressable
              key={option}
              onPress={() => choose(option)}
              style={[
                s.option,
                selected &&
                  evaluateExercise(item, (option)).correct && { borderColor: colors.mint },
                selected === option &&
                  !evaluateExercise(item, (option)).correct && { borderColor: colors.orange },
              ]}
            >
              <Text style={s.optionText}>{option}</Text>
            </Pressable>
          ),
        )}
        {selected && (
          <View style={s.explanation}>
            <Ionicons name="bulb" size={22} color={colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={s.correct}>{item.correct}</Text>
              <Text style={s.rule}>
                {expandExplanation(
                  {
                    prompt: item.wrong,
                    answer: item.correct,
                    type: "build",
                    explanation: item.rule,
                  },
                  { selected, topic: item.topic },
                )}
              </Text>
            </View>
          </View>
        )}
        {selected && (
          <PrimaryButton
            title={index === commonMistakes.length - 1 ? "Результат" : "Дальше"}
            onPress={next}
            color={evaluateExercise(item, (selected)).correct ? colors.mint : colors.orange}
          />
        )}
      </ScrollView>
    </View>
  );
}

export function PacksScreen({ onClose }) {
  useTheme();
  const [pack, setPack] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (!pack)
    return (
      <View style={s.container}>
        <Header title="Тематические наборы" onClose={onClose} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.bigTitle}>Выбери интерес</Text>
          <Text style={s.subtitleLeft}>
            48 новых слов для реальных ситуаций
          </Text>
          {thematicPacks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setPack(item);
                setIndex(0);
                setRevealed(false);
              }}
              style={s.pack}
            >
              <View
                style={[s.packIcon, { backgroundColor: `${item.color}25` }]}
              >
                <Text style={s.packEmoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardText}>{item.words.length} слов</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  const word = pack.words[index];
  const next = () => {
    setIndex((index + 1) % pack.words.length);
    setRevealed(false);
  };
  return (
    <View style={s.container}>
      <Header title={pack.title} onClose={() => setPack(null)} />
      <View style={[s.content, { flex: 1 }]}>
        <ProgressBar
          value={(index + 1) / pack.words.length}
          color={pack.color}
        />
        <Pressable
          onPress={() => setRevealed(!revealed)}
          style={[s.flashcard, { borderColor: `${pack.color}55` }]}
        >
          <Text style={s.packEmoji}>{pack.emoji}</Text>
          <Text style={s.flashWord}>{revealed ? word[1] : word[0]}</Text>
          <Text style={s.flashHint}>
            {revealed
              ? "Нажми, чтобы увидеть слово"
              : "Вспомни перевод и нажми"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => speak(word[0], { language: "en-US" })}
          style={s.listen}
        >
          <Ionicons name="volume-high" size={21} color={pack.color} />
          <Text style={[s.listenText, { color: pack.color }]}>Послушать</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <PrimaryButton
          title="Следующее слово"
          onPress={next}
          color={pack.color}
        />
      </View>
    </View>
  );
}

export function ShadowingScreen({ onClose }) {
  useTheme();
  const { progress } = useProgress();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const player = useAudioPlayer();
  const [index, setIndex] = useState(0);
  const [part, setPart] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const line = shadowingLines[index];
  const accent = progress.settings?.accent || "en-US";
  const rate = progress.settings?.speechRate || 0.78;
  const listen = (text = line.parts[part]) =>
    speak(text, { language: accent, rate });
  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return Alert.alert("Разрешите микрофон");
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecorded(false);
  };
  const stop = async () => {
    await recorder.stop();
    setRecorded(Boolean(recorder.uri));
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  };
  const playMine = () => {
    if (recorder.uri) {
      player.replace(recorder.uri);
      player.play();
    }
  };
  const next = () => {
    if (part < line.parts.length - 1) setPart(part + 1);
    else {
      setIndex((index + 1) % shadowingLines.length);
      setPart(0);
    }
    setRecorded(false);
  };
  return (
    <View style={s.container}>
      <Header title="Shadowing" onClose={onClose} />
      <View style={[s.content, { flex: 1 }]}>
        <Text style={s.topic}>
          {line.level} · ЧАСТЬ {part + 1}/{line.parts.length}
        </Text>
        <Text style={s.shadowFull}>{line.text}</Text>
        <View style={s.shadowPart}>
          <Text style={s.shadowText}>{line.parts[part]}</Text>
          <Pressable onPress={() => listen()} style={s.play}>
            <Ionicons name="play" size={24} color={colors.onAccent} />
          </Pressable>
        </View>
        <Text style={s.shadowTranslation}>{line.translation}</Text>
        <View style={s.shadowSteps}>
          <Text style={s.step}>1. Послушай несколько раз</Text>
          <Text style={s.step}>2. Повтори с тем же ритмом</Text>
          <Text style={s.step}>3. Сравни свою запись</Text>
        </View>
        <Pressable
          onPress={state.isRecording ? stop : start}
          style={[
            s.record,
            state.isRecording && { backgroundColor: colors.pink },
          ]}
        >
          <Ionicons
            name={state.isRecording ? "stop" : "mic"}
            size={31}
            color={colors.onAccent}
          />
        </Pressable>
        {recorded && (
          <View style={s.compare}>
            <Pressable onPress={playMine} style={s.compareButton}>
              <Ionicons name="play" size={19} color={colors.mint} />
              <Text style={s.compareText}>Моя запись</Text>
            </Pressable>
            <Pressable onPress={next} style={s.compareButton}>
              <Text style={s.compareText}>Дальше</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.mint} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const s = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 45 },
  bigTitle: { color: colors.text, fontSize: 32, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 9,
    marginBottom: 20,
  },
  subtitleLeft: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 20,
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 13,
  },
  segmentActive: { backgroundColor: colors.accentSoft },
  segmentText: { color: colors.text, fontWeight: "800" },
  hero: { alignItems: "center", marginVertical: 15 },
  heroEmoji: { fontSize: 65 },
  codeBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
  },
  code: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  backupHint: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 12 },
  orText: { color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, textAlign: "center", marginVertical: 18 },
  codeInput: {
    minHeight: 180,
    backgroundColor: colors.card,
    borderRadius: 19,
    color: colors.text,
    padding: 15,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
  },
  label: { color: colors.text, fontWeight: "800", marginBottom: 10, marginTop: 7 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 13 },
  choice: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  choiceActive: {
    borderColor: colors.purple,
    backgroundColor: "rgba(124,92,252,.18)",
  },
  choiceText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  testVoice: {
    flexDirection: "row",
    gap: 7,
    padding: 13,
    justifyContent: "center",
  },
  testVoiceText: { color: colors.purple, fontWeight: "800" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  cardText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  result: { color: colors.text, fontSize: 45, fontWeight: "900", marginTop: 15 },
  topic: {
    color: colors.pink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 20,
  },
  prompt: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 15,
  },
  wrongBox: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    backgroundColor: "rgba(255,92,138,.12)",
    padding: 17,
    borderRadius: 18,
    marginBottom: 18,
  },
  wrong: { color: colors.text, fontSize: 19, fontWeight: "700" },
  option: {
    padding: 16,
    minHeight: 58,
    backgroundColor: colors.card,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  explanation: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 18,
    marginVertical: 10,
  },
  correct: { color: colors.mint, fontWeight: "900", fontSize: 16 },
  rule: { color: colors.textMuted, lineHeight: 19, marginTop: 5 },
  pack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 20,
    marginBottom: 11,
  },
  packIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  packEmoji: { fontSize: 31 },
  flashcard: {
    minHeight: 330,
    borderRadius: 29,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 25,
  },
  flashWord: {
    color: colors.text,
    fontSize: 35,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },
  flashHint: { color: colors.textMuted, marginTop: 15 },
  listen: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    padding: 16,
  },
  listenText: { fontWeight: "800" },
  shadowFull: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  shadowPart: {
    minHeight: 155,
    backgroundColor: colors.card,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 20,
  },
  shadowText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentFill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  shadowTranslation: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 13,
  },
  shadowSteps: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    gap: 7,
    marginTop: 16,
  },
  step: { color: colors.textMuted, fontSize: 12 },
  record: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    backgroundColor: colors.accentFill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  compare: { flexDirection: "row", gap: 10, marginTop: 15 },
  compareButton: {
    flex: 1,
    minHeight: 51,
    borderRadius: 16,
    backgroundColor: "rgba(46,211,183,.13)",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  compareText: { color: colors.mint, fontWeight: "800" },
}));
