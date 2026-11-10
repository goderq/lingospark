import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { ProgressBar } from "../components/UI";

export default function ProfileScreen({
  onSettings,
  onLevels,
  onStreak,
  onWhatsNew,
}) {
  const { progress, reset } = useProgress();
  const level = Math.floor(progress.totalXP / 100) + 1;
  const data = progress.stats || {};
  const reviewAccuracy = data.reviewTotal
    ? Math.round(((data.reviewCorrect || 0) / data.reviewTotal) * 100)
    : 0;
  const grammarAccuracy = data.grammarTotal
    ? Math.round(((data.grammarCorrect || 0) / data.grammarTotal) * 100)
    : 0;
  const confirm = () =>
    Alert.alert(
      "Сбросить прогресс?",
      "Пройденные уроки, XP и серия будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Сбросить", style: "destructive", onPress: reset },
      ],
    );
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.purple, colors.mint]}
        style={styles.avatar}
      >
        <Text style={styles.initial}>
          {progress.name.slice(0, 1).toUpperCase()}
        </Text>
      </LinearGradient>
      <Text style={styles.name}>{progress.name}</Text>
      <Text style={styles.subtitle}>
        Уровень приложения {level} · английский{" "}
        {progress.learnerLevel || "не определён"}
      </Text>
      <View style={styles.stats}>
        <Stat emoji="🔥" value={progress.streak} label="дней" />
        <Stat emoji="⚡️" value={progress.totalXP} label="всего XP" />
        <Stat emoji="✓" value={progress.completed.length} label="уроков" />
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>До уровня {level + 1}</Text>
          <Text style={styles.subtitle}>{progress.totalXP % 100} / 100 XP</Text>
        </View>
        <ProgressBar value={(progress.totalXP % 100) / 100} />
      </View>
      <Text style={styles.section}>Статистика</Text>
      <View style={styles.metrics}>
        <Metric label="Точность слов" value={`${reviewAccuracy}%`} />
        <Metric label="Грамматика" value={`${grammarAccuracy}%`} />
        <Metric label="Историй" value={data.storiesCompleted || 0} />
        <Metric label="Диалогов" value={data.dialoguesCompleted || 0} />
        <Metric label="Лучший блиц" value={`${data.gameBest || 0}/10`} />
        <Metric label="Ошибок" value={progress.mistakes?.length || 0} />
      </View>
      <Pressable onPress={onSettings} style={styles.settingsCard}>
        <View style={styles.settingsIcon}>
          <Ionicons name="settings" size={24} color={colors.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Настройки приложения</Text>
          <Text style={styles.subtitle}>
            Текст · анимации · голос · сложность
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
      </Pressable>
      <View style={styles.profileLinks}>
        <ProfileLink
          icon="school"
          title="Прогресс A1–C1"
          detail="Курсы, точность и экзамены"
          onPress={onLevels}
        />
        <ProfileLink
          icon="flame"
          title="Календарь серии"
          detail={`${progress.streak} дней подряд`}
          onPress={onStreak}
        />
        <ProfileLink
          icon="sparkles"
          title="Что нового"
          detail="Возможности последнего обновления"
          onPress={onWhatsNew}
        />
      </View>
      <Text style={styles.section}>Достижения</Text>
      <View style={styles.stats}>
        <Achievement
          emoji="🌱"
          name="Первый шаг"
          active={progress.totalXP > 0}
        />
        <Achievement emoji="🔥" name="На огне" active={progress.streak >= 3} />
        <Achievement
          emoji="🏆"
          name="Знаток"
          active={progress.totalXP >= 300}
        />
      </View>
      <Pressable onPress={confirm} style={styles.reset}>
        <Ionicons name="refresh" color={colors.pink} size={18} />
        <Text style={styles.resetText}>Сбросить прогресс</Text>
      </Pressable>
    </ScrollView>
  );
}
function Stat({ emoji, value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function Achievement({ emoji, name, active }) {
  return (
    <View style={[styles.stat, { opacity: active ? 1 : 0.32 }]}>
      <Text style={styles.achievement}>{emoji}</Text>
      <Text style={styles.achievementName}>{name}</Text>
    </View>
  );
}
function ProfileLink({ icon, title, detail, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.profileLink}>
      <Ionicons name={icon} size={22} color={colors.mint} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.linkDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, alignItems: "center", paddingBottom: 120 },
  settingsCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 21,
    padding: 15,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,92,252,.14)",
  },
  profileLinks: { width: "100%", gap: 8, marginTop: 10 },
  profileLink: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkDetail: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  initial: { color: "white", fontSize: 40, fontWeight: "900" },
  name: { color: "white", fontSize: 27, fontWeight: "900", marginTop: 12 },
  subtitle: { color: colors.textMuted, marginTop: 5 },
  stats: { flexDirection: "row", gap: 10, width: "100%", marginTop: 24 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: { fontSize: 22 },
  statValue: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 5 },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { color: "white", fontWeight: "700", fontSize: 16 },
  section: {
    width: "100%",
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 25,
  },
  metrics: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  metric: {
    width: "31%",
    minHeight: 78,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  metricValue: { color: "white", fontSize: 20, fontWeight: "900" },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
  achievement: { fontSize: 34 },
  achievementName: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  reset: { flexDirection: "row", gap: 7, padding: 18, marginTop: 22 },
  resetText: { color: colors.pink, fontWeight: "700" },
});
