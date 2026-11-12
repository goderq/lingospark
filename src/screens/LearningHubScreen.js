import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "../data/course";
import { tenseModules } from "../data/advancedCourse";
import { grammarTracks } from "../data/grammarAcademy";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { ProgressBar } from "../components/UI";

const tools = [
  {
    id: "lingoWorld",
    title: "Английская жизнь",
    subtitle: "Открытый мир A1–C1 · 20 глав · 68 сцен",
    icon: "earth",
    color: "#2ED3B7",
  },
  {
    id: "smartSearch",
    title: "Умный поиск",
    subtitle: "Курсы · времена · правила · слова",
    icon: "search",
    color: "#36B8D9",
  },
  {
    id: "notebook",
    title: "Моя тетрадь",
    subtitle: "Сохранённые правила и примеры",
    icon: "bookmarks",
    color: "#F4B942",
  },
  {
    id: "skillSprint",
    title: "Гибкая практика",
    subtitle: "16 заданий · ошибки · лишние слова · диалоги",
    icon: "color-wand",
    color: "#FF5C8A",
  },
  {
    id: "articlesPrepositions",
    title: "Точная грамматика",
    subtitle: "Артикли · предлоги · фразовые глаголы",
    icon: "locate",
    color: "#7C5CFC",
  },
  {
    id: "writtenVocabulary",
    title: "Письменный перевод",
    subtitle: "Без вариантов ответа · два направления",
    icon: "pencil",
    color: "#2ED3B7",
  },
  {
    id: "fullIeltsMock",
    title: "Полный IELTS Mock",
    subtitle: "20 вопросов · результат Band 1–9",
    icon: "ribbon",
    color: "#FF5C8A",
  },
  {
    id: "careerCourses",
    title: "Английский для профессий",
    subtitle: "IT · медицина · продажи · туризм · переезд",
    icon: "briefcase",
    color: "#36B8D9",
  },
  {
    id: "storySeasonTwo",
    title: "Сюжетная игра · Сезон 2",
    subtitle: "10 новых глав и итоговая роль",
    icon: "trail-sign",
    color: "#FF9F43",
  },
  {
    id: "dailyMixedExam",
    title: "Ежедневный экзамен",
    subtitle: "20 новых вопросов из разных навыков",
    icon: "flash",
    color: "#FF9F43",
  },
  {
    id: "knowledgeMap",
    title: "Карта знаний",
    subtitle: "Процент освоения каждого навыка",
    icon: "analytics",
    color: "#2ED3B7",
  },
  {
    id: "workEnglish",
    title: "Английский для работы",
    subtitle: "8 модулей · 40 деловых ситуаций",
    icon: "briefcase",
    color: "#36B8D9",
  },
  {
    id: "storyGame",
    title: "Сюжетная игра",
    subtitle: "5 глав · выборы · разные результаты",
    icon: "compass",
    color: "#FF9F43",
  },
  {
    id: "readingLab",
    title: "Тренировка чтения",
    subtitle: "12 текстов и 24 вопроса A1–C1",
    icon: "book",
    color: "#2ED3B7",
  },
  {
    id: "marathons",
    title: "Марафоны",
    subtitle: "Планы на 7 и 30 дней",
    icon: "flame",
    color: "#FF5C8A",
  },
  {
    id: "smartCoach",
    title: "Умный тренер",
    subtitle: "Персональный урок из твоих ошибок",
    icon: "sparkles",
    color: "#F4B942",
  },
  {
    id: "spacedRepetition",
    title: "Повторение слов",
    subtitle: "Интервалы 1 · 3 · 7 · 14 · 30 дней",
    icon: "sync-circle",
    color: "#2ED3B7",
  },
  {
    id: "branchingDialogues",
    title: "Диалоги с выбором",
    subtitle: "10 ситуаций с разными концовками",
    icon: "git-branch",
    color: "#7C5CFC",
  },
  {
    id: "ielts",
    title: "IELTS Trainer",
    subtitle: "Reading · Listening · Writing · Speaking",
    icon: "school",
    color: "#FF5C8A",
  },
  {
    id: "lexicon",
    title: "Словарь и выражения",
    subtitle: "200 слов · 40 phrasal verbs · 30 идиом",
    icon: "library",
    color: "#7C5CFC",
  },
  {
    id: "listeningLab",
    title: "Живое аудирование",
    subtitle: "20 сцен от A1 до C1 с вопросами",
    icon: "headset",
    color: "#FF9F43",
  },
  {
    id: "writingStudio",
    title: "Письменная практика",
    subtitle: "18 заданий, образцы и самопроверка",
    icon: "create",
    color: "#2ED3B7",
  },
  {
    id: "levelExams",
    title: "Экзамены A1–C1",
    subtitle: "5 экзаменов и сертификаты",
    icon: "ribbon",
    color: "#FF5C8A",
  },
  {
    id: "minimalPairs",
    title: "Тренажёр звуков",
    subtitle: "20 сложных пар: ship/sheep, west/vest",
    icon: "mic",
    color: "#36B8D9",
  },
  {
    id: "mistakes",
    title: "Умное повторение ошибок",
    subtitle: "Тренировка только по неверным ответам",
    icon: "refresh-circle",
    color: "#F4B942",
  },
  {
    id: "dailyChallenge",
    title: "Испытание дня",
    subtitle: "Новый набор и награда каждый день",
    icon: "flash",
    color: "#FF9F43",
  },
  {
    id: "missions",
    title: "Сюжетные миссии",
    subtitle: "Три истории с разными концовками",
    icon: "map",
    color: "#7C5CFC",
  },
  {
    id: "skills",
    title: "Карта навыков",
    subtitle: "Сильные стороны и рекомендации",
    icon: "analytics",
    color: "#2ED3B7",
  },
  {
    id: "achievements",
    title: "Достижения",
    subtitle: "Медали и особые цели",
    icon: "trophy",
    color: "#F4B942",
  },
  {
    id: "favorites",
    title: "Закладки",
    subtitle: "Курсы, времена, слова и правила",
    icon: "bookmark",
    color: "#FF5C8A",
  },
  {
    id: "adaptive",
    title: "Персональная тренировка",
    subtitle: "Ошибки · слабые правила · слова к повтору",
    icon: "sparkles",
    color: "#F4B942",
  },
  {
    id: "reviewCalendar",
    title: "Календарь повторений",
    subtitle: "Интервалы 1 · 3 · 7 · 14 дней",
    icon: "calendar",
    color: "#2ED3B7",
  },
  {
    id: "tenses",
    title: "Времена A1–C1",
    subtitle: "29 блоков · теория и практика",
    icon: "time",
    color: "#FF9F43",
  },
  {
    id: "grammarAcademy",
    title: "Академия грамматики",
    subtitle: "20 больших курсов · 120 заданий",
    icon: "school",
    color: "#7C5CFC",
  },
  {
    id: "sentenceBuilder",
    title: "Конструктор предложений",
    subtitle: "150 предложений A1–C1",
    icon: "construct",
    color: "#2ED3B7",
  },
  {
    id: "irregular",
    title: "Неправильные глаголы",
    subtitle: "100 глаголов и тест",
    icon: "shuffle",
    color: "#36B8D9",
  },
  {
    id: "dictation",
    title: "Аудирование и диктант",
    subtitle: "100 фраз: слушай и пиши",
    icon: "ear",
    color: "#F4B942",
  },
  {
    id: "stories",
    title: "Аудиоистории",
    subtitle: "20 историй и 40 вопросов",
    icon: "headset",
    color: "#4CB963",
  },
  {
    id: "analytics",
    title: "Подробная статистика",
    subtitle: "Сильные и слабые темы",
    icon: "stats-chart",
    color: "#FF5C8A",
  },
  {
    id: "c1Exam",
    title: "Финальный экзамен C1",
    subtitle: "30 вопросов · сертификат",
    icon: "ribbon",
    color: "#D15BE3",
  },
];

export default function LearningHubScreen({ onClose, onLesson, onNavigate }) {
  const { progress, isUnlocked } = useProgress();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Все");
  const [section, setSection] = useState("Для меня");
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (progress.settings?.reduceMotion) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [section, query, level, progress.settings?.reduceMotion]);
  const normalized = query.trim().toLowerCase();
  const groups = {
    "Для меня": [
      "adaptive",
      "reviewCalendar",
      "knowledgeMap",
    ],
    Грамматика: [
      "grammarAcademy",
      "tenses",
      "sentenceBuilder",
      "irregular",
      "notebook",
    ],
    Практика: [
      "lingoWorld",
      "lexicon",
      "listeningLab",
      "writingStudio",
      "readingLab",
      "branchingDialogues",
      "workEnglish",
    ],
    Экзамены: [
      "levelExams",
      "ielts",
      "c1Exam",
      "analytics",
    ],
  };
  const filteredTools = tools.filter(
    (item) =>
      (normalized || groups[section]?.includes(item.id)) &&
      (!normalized ||
        `${item.title} ${item.subtitle}`.toLowerCase().includes(normalized)),
  );
  const filteredLessons = lessons.filter(
    (lesson) =>
      (level === "Все" || lesson.difficulty === level) &&
      (!normalized ||
        `${lesson.title} ${lesson.subtitle}`
          .toLowerCase()
          .includes(normalized)),
  );
  const continueLesson =
    lessons.find(
      (item) => item.id === progress.lessonDraft?.lessonId && isUnlocked(item),
    ) ||
    lessons.find(
      (item) => !progress.completed.includes(item.id) && isUnlocked(item),
    );
  return (
    <View style={styles.container}>
      <Header title="Каталог обучения" onClose={onClose} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Один понятный маршрут</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Найти любой курс или старый режим"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {["Для меня", "Курсы", "Грамматика", "Практика", "Экзамены"].map(
            (item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setSection(item);
                  setLevel("Все");
                }}
                style={[
                  styles.category,
                  section === item && styles.categoryActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    section === item && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ),
          )}
        </ScrollView>
        {section === "Курсы" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {["Все", "A1", "A2", "B1", "B2", "C1"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setLevel(item)}
                style={[styles.filter, level === item && styles.filterActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    level === item && { color: "white" },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Animated.View
          style={{
            opacity: fade,
            transform: [
              {
                translateY: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {section === "Для меня" && continueLesson && !normalized && (
            <Pressable
              onPress={() => onLesson(continueLesson)}
              style={[
                styles.continueCard,
                { borderColor: `${continueLesson.color}77` },
              ]}
            >
              <View
                style={[
                  styles.toolIcon,
                  { backgroundColor: `${continueLesson.color}22` },
                ]}
              >
                <Ionicons name="play" size={23} color={continueLesson.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>ПРОДОЛЖИТЬ</Text>
                <Text style={styles.continueTitle}>{continueLesson.title}</Text>
                <Text style={styles.toolText}>
                  {continueLesson.difficulty} ·{" "}
                  {continueLesson.exercises.length} заданий
                </Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={21}
                color={continueLesson.color}
              />
            </Pressable>
          )}
          {section !== "Курсы" && filteredTools.length > 0 && (
            <>
              <Text style={styles.section}>
                {section === "Для меня" ? "ТРИ ЛУЧШИХ ДЕЙСТВИЯ" : "ОСНОВНЫЕ РАЗДЕЛЫ"}
              </Text>
              {filteredTools.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onNavigate(item.id)}
                  style={styles.tool}
                >
                  <View
                    style={[
                      styles.toolIcon,
                      { backgroundColor: `${item.color}22` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={25} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toolTitle}>{item.title}</Text>
                    <Text style={styles.toolText}>{item.subtitle}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </>
          )}
          {section === "Курсы" && (
            <Text style={styles.section}>КУРСЫ · {filteredLessons.length}</Text>
          )}
          {section === "Курсы" &&
            filteredLessons.map((lesson) => {
              const complete = progress.completed.includes(lesson.id);
              const unlocked = isUnlocked(lesson);
              return (
                <Pressable
                  key={lesson.id}
                  disabled={!unlocked}
                  onPress={() => onLesson(lesson)}
                  style={[styles.lesson, !unlocked && styles.lessonLocked]}
                >
                  <View
                    style={[
                      styles.lessonIcon,
                      {
                        backgroundColor: unlocked
                          ? `${lesson.color}22`
                          : colors.cardLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        complete
                          ? "checkmark-circle"
                          : unlocked
                            ? lesson.icon
                            : "lock-closed"
                      }
                      size={25}
                      color={
                        complete
                          ? colors.mint
                          : unlocked
                            ? lesson.color
                            : colors.textMuted
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.level,
                        { color: unlocked ? lesson.color : colors.textMuted },
                      ]}
                    >
                      {lesson.difficulty}
                    </Text>
                    <Text style={styles.toolTitle}>{lesson.title}</Text>
                    <Text style={styles.toolText}>
                      {complete
                        ? "Выполнено ✓"
                        : unlocked
                          ? `${lesson.exercises.length} заданий · ${lesson.subtitle}`
                          : "Пройди предыдущий блок или босса уровня"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          {!filteredTools.length && section !== "Курсы" && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.toolTitle}>Ничего не найдено</Text>
              <Text style={styles.toolText}>
                Попробуй другое слово или уровень
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export function LearningAnalyticsScreen({ onClose }) {
  const { progress } = useProgress();
  const mistakes = progress.mistakes || [];
  const tenseStats = ["A1", "A2", "B1", "B2", "C1"].map((level) => {
    const pool = tenseModules.filter((module) => module.level === level);
    return {
      level,
      total: pool.length,
      complete: pool.filter((module) =>
        progress.completedTenses?.includes(module.id),
      ).length,
      mistakes: pool.reduce(
        (sum, module) =>
          sum +
          mistakes.filter((item) =>
            item.id.startsWith(`grammar-tense-${module.id}-`),
          ).length,
        0,
      ),
    };
  });
  const weakest = tenseModules
    .map((module) => ({
      module,
      count: mistakes.filter((item) =>
        item.id.startsWith(`grammar-tense-${module.id}-`),
      ).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const stats = progress.stats || {};
  const accuracy = (correct, total) =>
    total ? Math.round((correct / total) * 100) : 0;
  return (
    <View style={styles.container}>
      <Header title="Статистика обучения" onClose={onClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Твой прогресс</Text>
        <View style={styles.statGrid}>
          <Stat
            value={`${progress.completed.length}/${lessons.length}`}
            label="курсов"
            color={colors.mint}
          />
          <Stat
            value={`${progress.completedTenses?.length || 0}/${tenseModules.length}`}
            label="времён"
            color={colors.orange}
          />
          <Stat
            value={`${progress.completedGrammarTracks?.length || 0}/${grammarTracks.length}`}
            label="грамматика"
            color={colors.purple}
          />
          <Stat
            value={`${mistakes.length}`}
            label="ошибок"
            color={colors.pink}
          />
        </View>
        <Text style={styles.section}>ТОЧНОСТЬ</Text>
        <View style={styles.accuracy}>
          <Accuracy
            title="Слова"
            value={accuracy(stats.reviewCorrect, stats.reviewTotal)}
            color={colors.mint}
          />
          <Accuracy
            title="Грамматика"
            value={accuracy(stats.grammarCorrect, stats.grammarTotal)}
            color={colors.purple}
          />
          <Accuracy
            title="Диктанты"
            value={accuracy(stats.dictationCorrect, stats.dictationTotal)}
            color={colors.orange}
          />
        </View>
        <Text style={styles.section}>ВРЕМЕНА ПО УРОВНЯМ</Text>
        {tenseStats.map((item) => (
          <View key={item.level} style={styles.levelRow}>
            <Text style={styles.levelBadge}>{item.level}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.levelTop}>
                <Text style={styles.toolTitle}>
                  {item.complete}/{item.total} блоков
                </Text>
                <Text style={styles.toolText}>{item.mistakes} ошибок</Text>
              </View>
              <ProgressBar
                value={item.total ? item.complete / item.total : 0}
                color={item.mistakes ? colors.orange : colors.mint}
                height={8}
              />
            </View>
          </View>
        ))}
        <Text style={styles.section}>СЛАБЫЕ ТЕМЫ</Text>
        {weakest.length ? (
          weakest.map(({ module, count }) => (
            <View key={module.id} style={styles.weak}>
              <Ionicons name="warning" size={20} color={colors.orange} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>{module.name}</Text>
                <Text style={styles.toolText}>
                  {count} ошибок · уровень {module.level}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.toolTitle}>Слабых тем пока нет</Text>
          </View>
        )}
        <View style={styles.certificate}>
          <Ionicons
            name={progress.c1Certificate ? "ribbon" : "lock-closed"}
            size={35}
            color={progress.c1Certificate ? colors.orange : colors.textMuted}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.toolTitle}>Сертификат C1</Text>
            <Text style={styles.toolText}>
              {progress.c1Certificate
                ? "Получен! Отличная работа."
                : `Лучший экзамен: ${progress.c1ExamBest || 0}/30`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Accuracy({ title, value, color }) {
  return (
    <View style={styles.accuracyRow}>
      <Text style={styles.toolTitle}>{title}</Text>
      <View style={{ flex: 1 }}>
        <ProgressBar value={value / 100} color={color} height={8} />
      </View>
      <Text style={[styles.accuracyValue, { color }]}>{value}%</Text>
    </View>
  );
}
function Stat({ value, label, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.toolText}>{label}</Text>
    </View>
  );
}
function Header({ title, onClose }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
const styles = StyleSheet.create({
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
  headerTitle: { color: "white", fontWeight: "800", fontSize: 17 },
  content: { padding: 20, paddingBottom: 50 },
  title: { color: "white", fontSize: 34, fontWeight: "900", marginBottom: 18 },
  search: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: "white", fontSize: 16 },
  filters: { gap: 8, paddingVertical: 15 },
  categories: { gap: 8, paddingTop: 15, paddingBottom: 6 },
  category: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  categoryText: { color: colors.textMuted, fontWeight: "900", fontSize: 12 },
  categoryTextActive: { color: "white" },
  filter: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  filterActive: { backgroundColor: colors.purple },
  filterText: { color: colors.textMuted, fontWeight: "800" },
  section: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 18,
    marginBottom: 10,
  },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 15,
    marginTop: 16,
    borderWidth: 1.5,
  },
  continueLabel: {
    color: colors.mint,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  continueTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: { color: "white", fontSize: 15, fontWeight: "800" },
  toolText: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  lesson: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
  },
  lessonLocked: { opacity: 0.42 },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  level: { fontSize: 10, fontWeight: "900" },
  empty: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 27,
    marginTop: 10,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 17,
  },
  statValue: { fontSize: 25, fontWeight: "900" },
  accuracy: {
    backgroundColor: colors.card,
    borderRadius: 21,
    padding: 16,
    gap: 16,
  },
  accuracyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  accuracyValue: { width: 42, textAlign: "right", fontWeight: "900" },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
  },
  levelBadge: {
    color: colors.purple,
    fontSize: 16,
    fontWeight: "900",
    width: 30,
  },
  levelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: 17,
    padding: 14,
    marginBottom: 8,
  },
  certificate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,159,67,.12)",
    borderRadius: 21,
    padding: 18,
    marginTop: 22,
  },
});
