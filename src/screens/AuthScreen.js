import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../store/AuthContext";
import { colors , useTheme, createThemedStyles } from "../theme";

const errorText = (error) => {
  const message = error?.message || "Не удалось подключиться. Попробуй ещё раз.";
  if (/invalid login/i.test(message)) return "Неверная почта или пароль.";
  if (/already registered|already been registered/i.test(message))
    return "Аккаунт с этой почтой уже существует.";
  if (/password/i.test(message) && /characters|least/i.test(message))
    return "Пароль должен содержать минимум 6 символов.";
  if (/email/i.test(message) && /invalid/i.test(message))
    return "Проверь адрес электронной почты.";
  if (/rate limit/i.test(message)) return "Слишком много попыток. Попробуй позже.";
  return message;
};

export default function AuthScreen({ optional = false, onClose }) {
  useTheme();
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async () => {
    Keyboard.dismiss();
    setMessage(null);
    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Заполни почту и пароль." });
      return;
    }
    if (mode === "register" && !name.trim()) {
      setMessage({ type: "error", text: "Введи имя." });
      return;
    }
    if (mode === "register" && password !== confirm) {
      setMessage({ type: "error", text: "Пароли не совпадают." });
      return;
    }
    setBusy(true);
    const { data, error } =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(name, email, password);
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: errorText(error) });
      return;
    }
    if (mode === "register" && !data.session) {
      setMessage({
        type: "success",
        text: "Готово! Открой письмо от Supabase, подтверди почту, затем войди.",
      });
      setMode("login");
      setPassword("");
      setConfirm("");
    } else if (onClose) onClose();
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {optional && onClose ? (
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={27} color={colors.text} />
            </Pressable>
          ) : null}
          <LinearGradient colors={[colors.accentFill, "#49309C"]} style={styles.logo}>
            <Ionicons name="flash" size={38} color={colors.onAccent} />
          </LinearGradient>
          <Text style={styles.title}>Твой прогресс всегда рядом</Text>
          <Text style={styles.subtitle}>
            Войди, чтобы сохранять обучение в облаке и продолжать на другом iPhone.
          </Text>
          <View style={styles.switcher}>
            {[
              ["login", "Вход"],
              ["register", "Регистрация"],
            ].map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => {
                  setMode(id);
                  setMessage(null);
                }}
                style={[styles.switch, mode === id && styles.switchActive]}
              >
                <Text style={[styles.switchText, mode === id && styles.switchTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {mode === "register" && (
            <Field icon="person-outline" accessibilityLabel="Имя" placeholder="Имя" value={name} onChangeText={setName} maxLength={50} autoCapitalize="words" textContentType="name" />
          )}
          <Field
            icon="mail-outline"
            placeholder="Электронная почта"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              autoCapitalize="none"
              textContentType={mode === "register" ? "newPassword" : "password"}
            />
            <Pressable onPress={() => setSecure((value) => !value)} hitSlop={12}>
              <Ionicons
                name={secure ? "eye-outline" : "eye-off-outline"}
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
          {mode === "register" ? (
            <Field
              icon="shield-checkmark-outline"
              placeholder="Повтори пароль"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={secure}
              autoCapitalize="none"
              textContentType="newPassword"
            />
          ) : null}
          {message ? (
            <View
              style={[
                styles.message,
                message.type === "success" && styles.messageSuccess,
              ]}
            >
              <Ionicons
                name={message.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={19}
                color={message.type === "success" ? colors.mint : colors.orange}
              />
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ) : null}
          <Pressable disabled={busy} onPress={submit} style={styles.primary}>
            {busy ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <>
                <Ionicons name={mode === "login" ? "log-in" : "person-add"} size={20} color={colors.onAccent} />
                <Text style={styles.primaryText}>
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, ...props }) {
  useTheme();
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = createThemedStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 28, paddingTop: 58, paddingBottom: 42, alignItems: "center" },
  close: { position: "absolute", right: 20, top: 18, padding: 8, zIndex: 2 },
  logo: { width: 74, height: 74, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: "900", textAlign: "center", marginTop: 22 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 10, marginBottom: 25 },
  switcher: { width: "100%", flexDirection: "row", backgroundColor: colors.card, borderRadius: 17, padding: 4, marginBottom: 16 },
  switch: { flex: 1, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  switchActive: { backgroundColor: colors.accentSoft },
  switchText: { color: colors.textMuted, fontWeight: "800" },
  switchTextActive: { color: colors.text },
  field: { width: "100%", minHeight: 58, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, marginBottom: 11 },
  input: { flex: 1, color: colors.text, fontSize: 16, minHeight: 56 },
  message: { width: "100%", flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: "rgba(255,159,67,.12)", borderRadius: 16, padding: 13, marginBottom: 12 },
  messageSuccess: { backgroundColor: "rgba(46,211,183,.12)" },
  messageText: { flex: 1, color: colors.text, lineHeight: 19 },
  primary: { width: "100%", minHeight: 58, borderRadius: 18, backgroundColor: colors.accentFill, flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryText: { color: colors.onAccent, fontSize: 17, fontWeight: "900" },
}));
