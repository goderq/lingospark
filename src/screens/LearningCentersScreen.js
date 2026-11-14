import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../store/ProgressContext";
import { tenseModules } from "../data/advancedCourse";
import { grammarTracks } from "../data/grammarAcademy";
import { colors } from "../theme";
import { ProgressBar } from "../components/UI";

const grammarItems = [
  ["grammarAcademy", "Правила и конструкции", "20 курсов с объяснениями и практикой", "school", colors.purple],
  ["tenses", "Времена A1–C1", "29 блоков: теория, сравнения и задания", "time", colors.orange],
  ["articlesPrepositions", "Точная грамматика", "Артикли, предлоги и фразовые глаголы", "locate", colors.mint],
  ["irregular", "Неправильные глаголы", "Формы, произношение и проверка", "shuffle", "#36B8D9"],
  ["sentenceBuilder", "Порядок слов", "Собирай естественные английские предложения", "construct", colors.pink],
];

const examItems = [
  ["levelExams", "Экзамены A1–C1", "Проверка каждого уровня и сертификаты", "ribbon", colors.purple],
  ["ielts", "IELTS Trainer", "Reading, Listening, Writing и Speaking", "school", colors.pink],
  ["fullIeltsMock", "Полный IELTS Mock", "Итоговый пробный экзамен с Band 1–9", "document-text", colors.orange],
  ["c1Exam", "Финальный C1", "30 сложных вопросов и итог курса", "diamond", "#D15BE3"],
];

export function GrammarCenterScreen({ onClose, onNavigate }) {
  const { progress } = useProgress();
  const grammarDone = progress.completedGrammarTracks?.length || 0;
  const tensesDone = progress.completedTenses?.length || 0;
  const complete = grammarDone + tensesDone;
  const total = grammarTracks.length + tenseModules.length;
  return (
    <CenterLayout
      title="Центр грамматики"
      subtitle="Один маршрут от базового порядка слов до конструкций C1"
      icon="school"
      progress={complete / Math.max(1, total)}
      progressText={`${complete} из ${total} блоков завершено`}
      items={grammarItems}
      onClose={onClose}
      onNavigate={onNavigate}
    />
  );
}

export function ExamCenterScreen({ onClose, onNavigate }) {
  const { progress } = useProgress();
  const levelScores = Object.values(progress.levelExamBest || {});
  const passedLevels = levelScores.filter((score) => score >= 12).length;
  const ielts = progress.ieltsProgress || {};
  const activity = passedLevels
    + (progress.c1ExamBest ? 1 : 0)
    + (ielts.readingBest ? 1 : 0)
    + (ielts.listeningBest ? 1 : 0)
    + (ielts.writingCompleted?.length ? 1 : 0)
    + (ielts.speakingCompleted?.length ? 1 : 0)
    + (progress.fullIeltsBest ? 1 : 0);
  return (
    <CenterLayout
      title="Центр экзаменов"
      subtitle="Проверяй уровень в одном месте — от A1 до C1 и IELTS"
      icon="ribbon"
      progress={activity / 11}
      progressText={activity ? `${activity} экзаменационных результатов сохранено` : "Начни с экзамена своего уровня"}
      items={examItems}
      onClose={onClose}
      onNavigate={onNavigate}
    />
  );
}

function CenterLayout({ title, subtitle, icon, progress, progressText, items, onClose, onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name={icon} size={33} color={colors.purple} /></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.progress}><ProgressBar value={Math.min(1, progress)} color={colors.mint} height={9} /></View>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>
        <Text style={styles.section}>ВЫБЕРИ НАПРАВЛЕНИЕ</Text>
        {items.map(([id, itemTitle, detail, itemIcon, color]) => (
          <Pressable key={id} onPress={() => onNavigate(id)} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: `${color}20` }]}>
              <Ionicons name={itemIcon} size={25} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{itemTitle}</Text>
              <Text style={styles.cardText}>{detail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  content: { padding: 20, paddingBottom: 45 },
  hero: { alignItems: "center", backgroundColor: colors.card, borderRadius: 27, padding: 24, borderWidth: 1, borderColor: colors.border },
  heroIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: "rgba(124,92,252,.16)", alignItems: "center", justifyContent: "center" },
  title: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 14 },
  subtitle: { color: colors.textMuted, textAlign: "center", lineHeight: 21, marginTop: 7 },
  progress: { width: "100%", marginTop: 20 },
  progressText: { color: colors.mint, fontSize: 11, fontWeight: "800", marginTop: 8 },
  section: { color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 24, marginBottom: 10 },
  card: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  cardIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  cardText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 3 },
});
