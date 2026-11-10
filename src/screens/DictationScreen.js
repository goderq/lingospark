import React, { useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { dictations } from "../data/course";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";

const clean = (value) =>
  value
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .trim()
    .replace(/\s+/g, " ");
const KEYBOARD_ACCESSORY_ID = "dictation-keyboard-toolbar";

export default function DictationScreen({ onClose }) {
  const { recordDictation } = useProgress();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [speed, setSpeed] = useState(0.82);
  const item = dictations[index];
  const play = (rate = speed) =>
    Speech.speak(item.text, { language: "en-US", rate });
  const check = () => {
    Keyboard.dismiss();
    const result = clean(answer) === clean(item.text);
    setCorrect(result);
    setChecked(true);
    recordDictation(item, result);
    Haptics.notificationAsync(
      result
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
  };
  const next = () => {
    Keyboard.dismiss();
    setIndex((index + 1) % dictations.length);
    setAnswer("");
    setChecked(false);
    setCorrect(false);
  };
  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.back}>
              <Ionicons name="chevron-back" size={25} color="white" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <ProgressBar
                value={(index + 1) / dictations.length}
                color={colors.orange}
              />
            </View>
            <Text style={styles.level}>{item.level}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.eyebrow}>ДИКТАНТ НА СЛУХ</Text>
            <Text style={styles.title}>Запиши фразу, которую услышишь</Text>
            <View style={styles.audioCard}>
              <Pressable onPress={() => play()} style={styles.play}>
                <Ionicons name="play" size={35} color="white" />
              </Pressable>
              <Text style={styles.audioHint}>Нажми и слушай внимательно</Text>
              <View style={styles.speedRow}>
                <Pressable
                  onPress={() => {
                    setSpeed(0.58);
                    play(0.58);
                  }}
                  style={styles.speed}
                >
                  <Text style={styles.speedText}>🐢 Медленно</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSpeed(0.82);
                    play(0.82);
                  }}
                  style={styles.speed}
                >
                  <Text style={styles.speedText}>Обычно</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.translation}>
              Подсказка: {item.translation}
            </Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              editable={!checked}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              inputAccessoryViewID={
                Platform.OS === "ios" ? KEYBOARD_ACCESSORY_ID : undefined
              }
              placeholder="Напиши услышанное по-английски…"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                checked && {
                  borderColor: correct ? colors.mint : colors.orange,
                },
              ]}
            />
            {checked && (
              <View
                style={[
                  styles.feedback,
                  {
                    backgroundColor: `${correct ? colors.mint : colors.orange}1F`,
                  },
                ]}
              >
                <Ionicons
                  name={correct ? "checkmark-circle" : "ear"}
                  size={26}
                  color={correct ? colors.mint : colors.orange}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.feedbackTitle,
                      { color: correct ? colors.mint : colors.orange },
                    ]}
                  >
                    {correct ? "Идеально услышано!" : "Правильная фраза:"}
                  </Text>
                  {!correct && (
                    <Text style={styles.correctText}>{item.text}</Text>
                  )}
                </View>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <PrimaryButton
              title={checked ? "Следующий диктант" : "Проверить"}
              onPress={checked ? next : check}
              disabled={!checked && !answer.trim()}
              color={
                checked
                  ? correct
                    ? colors.mint
                    : colors.orange
                  : colors.purple
              }
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <View style={styles.keyboardToolbar}>
            <Pressable onPress={Keyboard.dismiss} style={styles.keyboardDone}>
              <Text style={styles.keyboardDoneText}>Готово</Text>
              <Ionicons name="chevron-down" size={19} color="white" />
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  level: { color: colors.orange, fontWeight: "900" },
  content: { flex: 1, padding: 20, paddingBottom: 26 },
  eyebrow: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: "white",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 10,
  },
  audioCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    marginTop: 24,
  },
  play: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  audioHint: { color: "white", fontWeight: "700", marginTop: 15 },
  speedRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  speed: {
    backgroundColor: colors.cardLight,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
  },
  speedText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  translation: { color: colors.textMuted, fontSize: 13, marginTop: 16 },
  input: {
    minHeight: 64,
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlignVertical: "center",
  },
  feedback: {
    flexDirection: "row",
    gap: 11,
    padding: 15,
    borderRadius: 18,
    marginTop: 12,
  },
  feedbackTitle: { fontSize: 16, fontWeight: "900" },
  correctText: { color: "white", fontWeight: "700", marginTop: 5 },
  keyboardToolbar: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  keyboardDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  keyboardDoneText: { color: "white", fontSize: 16, fontWeight: "800" },
});
