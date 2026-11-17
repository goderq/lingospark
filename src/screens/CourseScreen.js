import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "../data/course";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { ProgressBar, XPBadge } from "../components/UI";
import { nextLearningStep } from '../utils/learningContinuation';
const baseLevel = (value) => value.replace("+", "");
const levels = ["Все", "A1", "A2", "B1", "B2", "C1"];
export default function CourseScreen({ onLesson, onCheckpoint, onClose, initialLevel = 'Все' }) {
  const { progress, isUnlocked } = useProgress();
  const [filter, setFilter] = useState(initialLevel);
  const [query, setQuery] = useState("");
  const scrollRef = useRef(null);
  const currentY = useRef(0);
  const current =
    lessons.find((item) => !progress.completed.includes(item.id)) ||
    lessons[lessons.length - 1];
  const currentLevel = baseLevel(current.difficulty);
  const remaining = lessons.filter(
    (item) =>
      baseLevel(item.difficulty) === currentLevel &&
      !progress.completed.includes(item.id),
  ).length;
  const filtered = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          (filter === "Все" || baseLevel(lesson.difficulty) === filter) &&
          (!query.trim() ||
            `${lesson.title} ${lesson.subtitle}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [filter, query],
  );
  const checkpointAfter = (lesson) => {
    const i = lessons.findIndex((item) => item.id === lesson.id);
    return (
      !lessons[i + 1] ||
      baseLevel(lessons[i + 1].difficulty) !== baseLevel(lesson.difficulty)
    );
  };
  return (
    <FlatList
      ref={scrollRef} data={filtered} keyExtractor={item => item.id}
      initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
      contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      ListHeaderComponent={<View>
      {!!onClose && <Pressable onPress={onClose} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.purple, fontSize: 17, fontWeight: '700' }}>← Обучение</Text></Pressable>}
      <Text style={s.title}>Твой маршрут</Text>
      <Text style={s.subtitle}>
        {lessons.length} курсов · от A1 до C1 ·{" "}
        {lessons.reduce((sum, x) => sum + x.exercises.length, 0)} заданий
      </Text>
      <Pressable onPress={() => onLesson(current)} style={s.continue}>
        <View style={s.continueIcon}>
          <Ionicons name="play" size={25} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.continueLabel}>ПРОДОЛЖИТЬ КУРС</Text>
          <Text style={s.continueTitle}>{current.title}</Text>
          <Text style={s.continueText}>
            {currentLevel} · до следующего уровня {remaining} уроков
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="white" />
      </Pressable>
      <View style={s.progressCard}>
        <View style={s.progressRow}>
          <Text style={s.progressTitle}>Прогресс курса</Text>
          <Text style={s.progressValue}>
            {progress.completed.length} / {lessons.length}
          </Text>
        </View>
        <ProgressBar
          value={progress.completed.length / lessons.length}
          color={colors.mint}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.levelOverview}
      >
        {["A1", "A2", "B1", "B2", "C1"].map((stage) => {
          const stageLessons = lessons.filter(
            (item) => baseLevel(item.difficulty) === stage,
          );
          const completed = stageLessons.filter((item) =>
            progress.completed.includes(item.id),
          ).length;
          const percent = Math.round(
            (completed / Math.max(1, stageLessons.length)) * 100,
          );
          return (
            <Pressable
              key={stage}
              onPress={() => setFilter(filter === stage ? "Все" : stage)}
              style={[s.levelSummary, filter === stage && s.levelSummaryActive]}
            >
              <Text
                style={[
                  s.levelSummaryCode,
                  filter === stage && { color: "white" },
                ]}
              >
                {stage}
              </Text>
              <Text style={s.levelSummaryPercent}>{percent}%</Text>
              <Text style={s.levelSummaryText}>
                {completed}/{stageLessons.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={s.search}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Найти курс"
          placeholderTextColor={colors.textMuted}
          style={s.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
      >
        {levels.map((level) => (
          <Pressable
            key={level}
            onPress={() => setFilter(level)}
            style={[s.filter, filter === level && s.filterActive]}
          >
            <Text
              style={[s.filterText, filter === level && { color: "white" }]}
            >
              {level}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      </View>}
      renderItem={({ item: lesson, index: listIndex }) => {
        const unlocked = isUnlocked(lesson);
        const complete = progress.completed.includes(lesson.id);
        const isCurrent = lesson.id === current.id;
        const stage = baseLevel(lesson.difficulty);
        const stageComplete = lessons
          .filter((item) => baseLevel(item.difficulty) === stage)
          .every((item) => progress.completed.includes(item.id));
        const checkpointScore = progress.courseCheckpoints?.[stage] || 0;
        return (
          <Fragment key={lesson.id}>
            {listIndex > 0 && (
              <View
                style={[
                  s.routeLine,
                  {
                    backgroundColor: complete
                      ? colors.mint
                      : unlocked
                        ? `${lesson.color}88`
                        : colors.border,
                  },
                ]}
              />
            )}
            <Pressable
              onLayout={(event) => {
                if (isCurrent) currentY.current = event.nativeEvent.layout.y;
              }}
              onPress={() => onLesson(unlocked ? lesson : lessons.find(item => item.id === nextLearningStep(progress, lesson.id).topicId))}
              style={({ pressed }) => [
                s.lesson,
                isCurrent && s.currentLesson,
                { opacity: !unlocked ? 0.45 : pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  s.icon,
                  {
                    backgroundColor: unlocked
                      ? lesson.color
                      : `${lesson.color}22`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    complete
                      ? "checkmark"
                      : unlocked
                        ? lesson.icon
                        : "lock-closed"
                  }
                  size={27}
                  color={unlocked ? "white" : colors.textMuted}
                />
              </View>
              <View style={s.body}>
                <Text style={[s.unit, { color: lesson.color }]}>
                  БЛОК {lesson.unit} · {lesson.difficulty}
                  {isCurrent ? " · СЕЙЧАС" : ""}
                </Text>
                <Text style={s.lessonTitle}>{lesson.title}</Text>
                <Text style={s.detail} numberOfLines={1}>
                  {complete
                    ? progress.lessonResults?.[lesson.id]
                      ? `${progress.retention?.[lesson.id]?.verifiedAt ? 'Закреплено' : 'Пройдено'} · ${"⭐".repeat(progress.lessonResults[lesson.id].stars || 1)} · ${progress.lessonResults[lesson.id].bestAccuracy || progress.lessonResults[lesson.id].accuracy}%`
                      : progress.retention?.[lesson.id]?.verifiedAt ? 'Закреплено' : 'Пройдено'
                    : !unlocked
                      ? `Перейти к «${current.title}» · ${nextLearningStep(progress, lesson.id).stageTitle}`
                      : lesson.subtitle}
                </Text>
              </View>
              <XPBadge xp={lesson.xp} />
            </Pressable>
            {checkpointAfter(lesson) && (
              <Pressable
                disabled={!stageComplete}
                onPress={() => onCheckpoint(stage)}
                style={[s.checkpoint, !stageComplete && { opacity: 0.45 }]}
              >
                <View
                  style={[
                    s.checkpointIcon,
                    {
                      backgroundColor:
                        checkpointScore >= 8
                          ? `${colors.mint}22`
                          : `${colors.orange}20`,
                    },
                  ]}
                >
                  <Ionicons
                    name={checkpointScore >= 8 ? "ribbon" : "shield-checkmark"}
                    size={26}
                    color={checkpointScore >= 8 ? colors.mint : colors.orange}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.checkpointTitle}>Контрольная {stage}</Text>
                  <Text style={s.checkpointText}>
                    {checkpointScore
                      ? `Лучший результат ${checkpointScore}/10${checkpointScore >= 8 ? " · выполнено ✓" : ""}`
                      : stageComplete
                        ? "10 вопросов · награда за уровень"
                        : `Откроется после всех уроков ${stage}`}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </Fragment>
        );

      }}
      ListEmptyComponent={<Text style={s.subtitle}>Курсы не найдены</Text>}
    />
  );
}
const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  title: { color: "white", fontSize: 35, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  continue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.purple,
    borderRadius: 23,
    padding: 16,
    marginBottom: 14,
  },
  continueIcon: {
    width: 51,
    height: 51,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  continueLabel: {
    color: "rgba(255,255,255,.7)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  continueTitle: {
    color: "white",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 3,
  },
  continueText: { color: "rgba(255,255,255,.72)", fontSize: 12, marginTop: 3 },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressTitle: { color: "white", fontWeight: "700" },
  progressValue: { color: colors.mint, fontWeight: "800" },
  levelOverview: { gap: 9, paddingBottom: 12 },
  levelSummary: {
    width: 76,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  levelSummaryActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  levelSummaryCode: { color: colors.purple, fontWeight: "900", fontSize: 13 },
  levelSummaryPercent: {
    color: "white",
    fontWeight: "900",
    fontSize: 17,
    marginTop: 4,
  },
  levelSummaryText: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  search: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: "white", fontSize: 15 },
  filters: { gap: 8, paddingVertical: 12 },
  filter: {
    minWidth: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  filterActive: { backgroundColor: colors.purple },
  filterText: { color: colors.textMuted, fontWeight: "900" },
  lesson: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentLesson: { borderColor: colors.purple, borderWidth: 2 },
  routeLine: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginLeft: 31,
    marginTop: -12,
    marginBottom: -1,
  },
  icon: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  unit: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  lessonTitle: {
    color: "white",
    fontWeight: "800",
    fontSize: 17,
    marginTop: 5,
  },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  checkpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,159,67,.08)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,159,67,.22)",
  },
  checkpointIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkpointTitle: { color: "white", fontWeight: "900" },
  checkpointText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  empty: { alignItems: "center", padding: 35 },
  emptyEmoji: { fontSize: 48 },
});
