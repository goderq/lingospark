import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "../data/course";
import { tenseModules } from "../data/advancedCourse";
import { worldLocations } from "../data/lingoWorld";
import { useProgress } from "../store/ProgressContext";
import { colors, shadows } from "../theme";
import { ProgressBar, XPBadge } from "../components/UI";

export default function HomeScreen({
  onLesson,
  onReview,
  onPhrases,
  onDictation,
  onDialogues,
  onMistakes,
  onPlacement,
  onGrammar,
  onStories,
  onGame,
  onPlan,
  onVocabulary,
  onExam,
  onRewards,
  onActivity,
  onPronunciation,
  onBackup,
  onCommonMistakes,
  onPacks,
  onShadowing,
  onTenses,
  onLevels,
  onIrregular,
  onGrammarAcademy,
  onLearningHub,
  onAdaptive,
  onDailyChallenge,
  onMissions,
  onSearch,
  onBookmarks,
  onLingoWorld,
  recentScreens = [],
  onRecent,
}) {
  const { progress, isUnlocked } = useProgress();
  const [showAll, setShowAll] = useState(false);
  const draftLesson = lessons.find(
    (item) => item.id === progress.lessonDraft?.lessonId && isUnlocked(item),
  );
  const next =
    draftLesson ||
    lessons.find((item) => !progress.completed.includes(item.id)) ||
    lessons[0];
  const ratio = progress.dailyXP / Math.max(progress.dailyGoal, 1);
  const today = new Date().toISOString().slice(0, 10);
  const actions =
    progress.dailyActions?.date === today
      ? progress.dailyActions
      : { lessons: 0, reviews: 0, dictations: 0 };
  const quickMap = {
    dictation: {
      title: "Диктант",
      subtitle: "Слушай и пиши",
      icon: "ear",
      color: colors.orange,
      onPress: onDictation,
    },
    dialogues: {
      title: "Диалоги",
      subtitle: "10 ситуаций",
      icon: "chatbubbles",
      color: colors.purple,
      onPress: onDialogues,
    },
    review: {
      title: "Случайные слова",
      subtitle: "8 000+ · A1–C1",
      icon: "library",
      color: colors.mint,
      onPress: onReview,
    },
    mistakes: {
      title: "Мои ошибки",
      subtitle: `${progress.mistakes?.length || 0} записей`,
      icon: "warning",
      color: colors.pink,
      onPress: onMistakes,
    },
    adaptive: {
      title: "Для тебя",
      subtitle: "Слабые темы",
      icon: "sparkles",
      color: colors.orange,
      onPress: onAdaptive,
    },
    tenses: {
      title: "Времена",
      subtitle: `${progress.completedTenses?.length || 0}/${tenseModules.length} блоков`,
      icon: "time",
      color: colors.purple,
      onPress: onTenses,
    },
  };
  const quickActions = (
    progress.settings?.quickActions || [
      "dictation",
      "dialogues",
      "review",
      "mistakes",
    ]
  )
    .map((id) => quickMap[id])
    .filter(Boolean);
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.muted}>Good morning,</Text>
          <Text style={styles.name}>{progress.name}!</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onSearch} style={styles.headerButton}>
            <Ionicons name="search" size={22} color="white" />
          </Pressable>
          <Pressable onPress={onBookmarks} style={styles.headerButton}>
            <Ionicons name="bookmark-outline" size={21} color={colors.orange} />
          </Pressable>
          <View style={styles.streak}>
            <Text style={styles.fire}>🔥</Text>
            <Text style={styles.streakText}>{progress.streak} дн.</Text>
          </View>
        </View>
      </View>
      {recentScreens.length > 0 && (
        <View>
          <Text style={styles.recentLabel}>НЕДАВНО</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRow}
          >
            {recentScreens.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => onRecent?.(item)}
                style={styles.recentCard}
              >
                <Ionicons name="time-outline" size={18} color={colors.purple} />
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <Pressable onPress={onLingoWorld}>
        <LinearGradient
          colors={["#402D8F", "#244F72"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.worldBanner}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.worldEyebrow}>
              НОВЫЙ СЮЖЕТНЫЙ РЕЖИМ · A1–C1
            </Text>
            <Text style={styles.worldTitle}>Английская жизнь 🌍</Text>
            <Text style={styles.worldText}>
              Лондон · персонажи · решения · награды
            </Text>
          </View>
          <View style={styles.worldProgress}>
            <Text style={styles.worldProgressValue}>
              {progress.world?.completed?.length || 0}/{worldLocations.length}
            </Text>
            <Ionicons name="arrow-forward" size={22} color="white" />
          </View>
        </LinearGradient>
      </Pressable>
      <Pressable onPress={onLearningHub} style={styles.planBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planEyebrow}>НОВЫЙ КАТАЛОГ</Text>
          <Text style={styles.planTitle}>Всё обучение в одном месте</Text>
          <Text style={styles.planText}>
            Поиск · уровни A1–C1 · статистика · экзамены
          </Text>
        </View>
        <Ionicons name="grid" size={40} color={colors.mint} />
      </Pressable>
      <Pressable onPress={onAdaptive} style={styles.gameBanner}>
        <View>
          <Text style={styles.gameEyebrow}>АДАПТИВНЫЙ УРОК</Text>
          <Text style={styles.gameTitle}>Для тебя ✨</Text>
          <Text style={styles.gameText}>Ошибки · слова · слабые времена</Text>
        </View>
        <Ionicons name="sparkles" size={42} color={colors.orange} />
      </Pressable>
      <View style={styles.practiceRow}>
        <Practice
          title="Испытание дня"
          subtitle={
            progress.dailyChallenges?.[new Date().toISOString().slice(0, 10)]
              ? "Выполнено сегодня ✓"
              : "10 новых вопросов"
          }
          icon="flash"
          color={colors.orange}
          onPress={onDailyChallenge}
        />
        <Practice
          title="Сюжетные миссии"
          subtitle={`${Object.keys(progress.missionResults || {}).length}/3 историй`}
          icon="map"
          color={colors.purple}
          onPress={onMissions}
        />
      </View>
      <Pressable onPress={onPlan} style={styles.planBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planEyebrow}>ПЕРСОНАЛЬНЫЙ ПЛАН · 15 МИНУТ</Text>
          <Text style={styles.planTitle}>Что учить сегодня</Text>
          <Text style={styles.planText}>
            Задания подобраны по твоим результатам
          </Text>
        </View>
        <Ionicons name="sparkles" size={40} color={colors.mint} />
      </Pressable>
      {showAll && (
        <>
          <Pressable onPress={onPlacement} style={styles.levelBanner}>
            <View style={styles.levelIcon}>
              <Ionicons name="school" size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>
                {progress.learnerLevel
                  ? `Твой уровень: ${progress.learnerLevel}`
                  : "Узнай свой уровень"}
              </Text>
              <Text style={styles.levelText}>
                {progress.learnerLevel
                  ? "Пройти тест ещё раз"
                  : "12 вопросов · около 3 минут"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </Pressable>
          <Pressable onPress={onTenses} style={styles.tensesBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tensesEyebrow}>ПОЛНЫЙ КУРС ДО C1</Text>
              <Text style={styles.tensesTitle}>Времена и конструкции ⏰</Text>
              <Text style={styles.tensesText}>
                {progress.completedTenses?.length || 0}/{tenseModules.length}{" "}
                блоков ·{" "}
                {tenseModules.reduce(
                  (total, item) => total + item.exercises.length,
                  0,
                )}{" "}
                упражнений
              </Text>
            </View>
            <Ionicons name="time" size={45} color={colors.orange} />
          </Pressable>
          <View style={styles.practiceRow}>
            <Practice
              title="Карта A1–C1"
              subtitle={`${progress.completedBosses?.length || 0}/5 боссов`}
              icon="map"
              color={colors.purple}
              onPress={onLevels}
            />
            <Practice
              title="Неправильные глаголы"
              subtitle="30 глаголов · тест"
              icon="shuffle"
              color={colors.orange}
              onPress={onIrregular}
            />
          </View>
          <Pressable onPress={onGrammarAcademy} style={styles.phraseBanner}>
            <Ionicons name="school" size={26} color={colors.purple} />
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceTitle}>Академия грамматики</Text>
              <Text style={styles.muted}>
                {progress.completedGrammarTracks?.length || 0}/6 курсов · от A1
                до C1
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </>
      )}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Цель на сегодня</Text>
          <Text style={styles.goal}>
            {progress.dailyXP} / {progress.dailyGoal} XP
          </Text>
        </View>
        <ProgressBar value={ratio} color={colors.mint} height={12} />
        <Text style={styles.cardHint}>
          {ratio >= 1
            ? "Цель выполнена! Сегодня ты великолепен ✨"
            : "Ещё немного — ежедневная цель уже близко"}
        </Text>
      </View>
      <View style={styles.quests}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Ежедневные задания</Text>
          <Text style={styles.questCount}>
            {
              [
                actions.lessons >= 1,
                actions.reviews >= 5,
                actions.dictations >= 1,
              ].filter(Boolean).length
            }
            /3
          </Text>
        </View>
        <Quest
          title="Пройти один урок"
          done={actions.lessons >= 1}
          value={`${Math.min(actions.lessons || 0, 1)}/1`}
        />
        <Quest
          title="Изучить пять слов"
          done={actions.reviews >= 5}
          value={`${Math.min(actions.reviews || 0, 5)}/5`}
        />
        <Quest
          title="Выполнить диктант"
          done={actions.dictations >= 1}
          value={`${Math.min(actions.dictations || 0, 1)}/1`}
        />
      </View>
      <Pressable
        onPress={() => onLesson(next)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, shadows.card]}
      >
        <LinearGradient
          colors={[next.color, `${next.color}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lesson}
        >
          <View style={styles.row}>
            <View style={styles.roundIcon}>
              <Ionicons name={next.icon} size={25} color="white" />
            </View>
            <XPBadge xp={next.xp} />
          </View>
          <Text style={styles.eyebrow}>
            {draftLesson
              ? `ЗАДАНИЕ ${(progress.lessonDraft?.index || 0) + 1} ИЗ ${next.exercises.length}`
              : `ПРОДОЛЖИТЬ · ${next.difficulty}`}
          </Text>
          <Text style={styles.lessonTitle}>{next.title}</Text>
          <Text style={styles.lessonSubtitle}>
            {draftLesson ? "Незавершённый урок сохранён" : next.subtitle}
          </Text>
          <View style={styles.lessonButton}>
            <Text style={[styles.lessonButtonText, { color: next.color }]}>
              {draftLesson ? "Продолжить урок" : "Начать урок"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={next.color} />
          </View>
        </LinearGradient>
      </Pressable>
      <Text style={styles.sectionTitle}>Быстрая практика</Text>
      {quickActions.map(
        (action, index) =>
          index % 2 === 0 && (
            <View key={`${action.title}-${index}`} style={styles.practiceRow}>
              <Practice {...action} />
              {quickActions[index + 1] ? (
                <Practice {...quickActions[index + 1]} />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          ),
      )}
      <Pressable
        onPress={() => setShowAll((value) => !value)}
        style={styles.moreButton}
      >
        <Ionicons
          name={showAll ? "chevron-up" : "grid-outline"}
          size={20}
          color={colors.purple}
        />
        <Text style={styles.moreButtonText}>
          {showAll ? "Скрыть дополнительные разделы" : "Показать все разделы"}
        </Text>
      </Pressable>
      {showAll && (
        <>
          <Pressable onPress={onPhrases} style={styles.phraseBanner}>
            <Ionicons name="volume-high" size={24} color={colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceTitle}>Живые фразы</Text>
              <Text style={styles.muted}>10 полезных выражений с озвучкой</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          <Text style={styles.sectionTitle}>Тренажёры</Text>
          <View style={styles.practiceRow}>
            <Practice
              title="Грамматика"
              subtitle="С объяснениями"
              icon="book"
              color={colors.purple}
              onPress={onGrammar}
            />
            <Practice
              title="Аудиоистории"
              subtitle="Слушай и понимай"
              icon="headset"
              color={colors.mint}
              onPress={onStories}
            />
          </View>
          <Pressable onPress={onGame} style={styles.gameBanner}>
            <View>
              <Text style={styles.gameEyebrow}>МИНИ-ИГРА</Text>
              <Text style={styles.gameTitle}>Словесный блиц ⚡️</Text>
              <Text style={styles.gameText}>10 быстрых вопросов</Text>
            </View>
            <Ionicons name="game-controller" size={42} color={colors.orange} />
          </Pressable>
          <Text style={styles.sectionTitle}>Больше возможностей</Text>
          <View style={styles.practiceRow}>
            <Practice
              title="Произношение"
              subtitle="Запиши себя"
              icon="mic"
              color={colors.pink}
              onPress={onPronunciation}
            />
            <Practice
              title="Мой словарь"
              subtitle={`${progress.customWords?.length || 0} своих слов`}
              icon="bookmark"
              color={colors.mint}
              onPress={onVocabulary}
            />
          </View>
          <View style={styles.practiceRow}>
            <Practice
              title="Экзамен"
              subtitle="10 вопросов"
              icon="ribbon"
              color={colors.orange}
              onPress={onExam}
            />
            <Practice
              title="Награды"
              subtitle={`🪙 ${progress.coins || 0} монет`}
              icon="gift"
              color={colors.purple}
              onPress={onRewards}
            />
          </View>
          <Pressable onPress={onActivity} style={styles.phraseBanner}>
            <Ionicons name="calendar" size={24} color={colors.mint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceTitle}>Календарь активности</Text>
              <Text style={styles.muted}>Последние четыре недели</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          <Text style={styles.sectionTitle}>Новые режимы</Text>
          <View style={styles.practiceRow}>
            <Practice
              title="Shadowing"
              subtitle="Ритм и интонация"
              icon="repeat"
              color={colors.pink}
              onPress={onShadowing}
            />
            <Practice
              title="Типичные ошибки"
              subtitle="Для русскоязычных"
              icon="alert-circle"
              color={colors.orange}
              onPress={onCommonMistakes}
            />
          </View>
          <View style={styles.practiceRow}>
            <Practice
              title="Наборы слов"
              subtitle="6 интересов"
              icon="grid"
              color={colors.mint}
              onPress={onPacks}
            />
          </View>
          <Pressable onPress={onBackup} style={styles.backupBanner}>
            <Ionicons name="shield-checkmark" size={27} color={colors.mint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceTitle}>Резервная копия</Text>
              <Text style={styles.muted}>
                Сохрани прогресс перед обновлением
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function Practice({ title, subtitle, icon, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.practice, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={icon} size={27} color={color} />
      <Text style={styles.practiceTitle}>{title}</Text>
      <Text style={styles.muted}>{subtitle}</Text>
    </Pressable>
  );
}

function Quest({ title, done, value }) {
  return (
    <View style={styles.quest}>
      <Ionicons
        name={done ? "checkmark-circle" : "ellipse-outline"}
        size={21}
        color={done ? colors.mint : colors.textMuted}
      />
      <Text style={[styles.questTitle, done && { color: colors.mint }]}>
        {title}
      </Text>
      <Text style={styles.questValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 22 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  recentLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentRow: { gap: 8 },
  recentCard: {
    minWidth: 135,
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  recentTitle: { color: "white", fontWeight: "800", fontSize: 12, flex: 1 },
  worldBanner: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
  },
  worldEyebrow: {
    color: "#72E3D0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  worldTitle: { color: "white", fontSize: 24, fontWeight: "900", marginTop: 9 },
  worldText: { color: "rgba(255,255,255,.65)", fontSize: 12, marginTop: 7 },
  worldProgress: { alignItems: "center", gap: 8, marginLeft: 10 },
  worldProgressValue: { color: "white", fontWeight: "900", fontSize: 17 },
  muted: { color: colors.textMuted, fontSize: 14 },
  name: { color: "white", fontSize: 34, fontWeight: "900", marginTop: 3 },
  streak: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 11,
    minWidth: 68,
  },
  fire: { fontSize: 24 },
  streakText: {
    color: colors.orange,
    fontWeight: "800",
    fontSize: 12,
    marginTop: 3,
  },
  planBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 19,
    borderRadius: 23,
    backgroundColor: "rgba(46,211,183,.13)",
    borderWidth: 1,
    borderColor: "rgba(46,211,183,.25)",
  },
  planEyebrow: {
    color: colors.mint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  planTitle: { color: "white", fontSize: 20, fontWeight: "900", marginTop: 5 },
  planText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  levelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    borderRadius: 21,
    backgroundColor: colors.purple,
  },
  levelIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  levelText: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  tensesBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 23,
    backgroundColor: "rgba(255,159,67,.13)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,.27)",
  },
  tensesEyebrow: {
    color: colors.orange,
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 1.3,
  },
  tensesTitle: {
    color: "white",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 5,
  },
  tensesText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  goal: { color: colors.mint, fontWeight: "800" },
  cardHint: { color: colors.textMuted, fontSize: 12 },
  quests: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    gap: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questCount: { color: colors.purple, fontWeight: "900" },
  quest: { flexDirection: "row", alignItems: "center", gap: 9 },
  questTitle: { color: "white", fontSize: 13, fontWeight: "600", flex: 1 },
  questValue: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  lesson: { borderRadius: 28, padding: 22, gap: 7 },
  roundIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 14,
  },
  lessonTitle: { color: "white", fontSize: 29, fontWeight: "900" },
  lessonSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 15 },
  lessonButton: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    padding: 15,
    marginTop: 14,
  },
  lessonButtonText: { fontWeight: "900", fontSize: 16 },
  sectionTitle: { color: "white", fontSize: 23, fontWeight: "800" },
  moreButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(124,92,252,.12)",
    borderWidth: 1,
    borderColor: "rgba(124,92,252,.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  moreButtonText: { color: colors.purple, fontWeight: "900" },
  practiceRow: { flexDirection: "row", gap: 12 },
  practice: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  practiceTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
  },
  phraseBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backupBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 17,
    backgroundColor: "rgba(46,211,183,.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(46,211,183,.2)",
  },
  gameBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 22,
    backgroundColor: "rgba(255,159,67,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.25)",
  },
  gameEyebrow: {
    color: colors.orange,
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 1.3,
  },
  gameTitle: { color: "white", fontSize: 19, fontWeight: "900", marginTop: 5 },
  gameText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
