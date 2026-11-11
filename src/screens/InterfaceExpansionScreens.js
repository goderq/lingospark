import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "../data/course";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";
import { PrimaryButton, ProgressBar } from "../components/UI";

const baseLevel = (value) => value.replace("+", "");
const levels = ["A1", "A2", "B1", "B2", "C1"];
function Header({ title, onClose }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onClose} style={s.back}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function LevelProgressScreen({ onClose, onLesson }) {
  const { progress, isUnlocked } = useProgress();
  const [level, setLevel] = useState(baseLevel(progress.learnerLevel || "A1"));
  const pool = lessons.filter((item) => baseLevel(item.difficulty) === level);
  const completed = pool.filter((item) => progress.completed.includes(item.id));
  const results = completed
    .map((item) => progress.lessonResults?.[item.id])
    .filter(Boolean);
  const accuracy = results.length
    ? Math.round(
        results.reduce(
          (sum, item) => sum + (item.bestAccuracy || item.accuracy || 0),
          0,
        ) / results.length,
      )
    : 0;
  const tasks = pool.reduce((sum, item) => sum + item.exercises.length, 0);
  return (
    <View style={s.container}>
      <Header title="Прогресс A1–C1" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Твои уровни</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.levelTabs}
        >
          {levels.map((item) => {
            const levelPool = lessons.filter(
              (lesson) => baseLevel(lesson.difficulty) === item,
            );
            const done = levelPool.filter((lesson) =>
              progress.completed.includes(lesson.id),
            ).length;
            return (
              <Pressable
                key={item}
                onPress={() => setLevel(item)}
                style={[s.levelTab, level === item && s.levelTabActive]}
              >
                <Text
                  style={[s.levelCode, level === item && { color: "white" }]}
                >
                  {item}
                </Text>
                <Text style={s.levelCount}>
                  {done}/{levelPool.length}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroLevel}>{level}</Text>
            <Text style={s.heroPercent}>
              {Math.round((completed.length / Math.max(1, pool.length)) * 100)}%
            </Text>
          </View>
          <ProgressBar
            value={completed.length / Math.max(1, pool.length)}
            color={colors.mint}
          />
          <View style={s.metrics}>
            <Metric value={tasks} label="заданий" />
            <Metric value={`${accuracy}%`} label="точность" />
            <Metric
              value={`${progress.courseCheckpoints?.[level] || 0}/10`}
              label="экзамен"
            />
          </View>
        </View>
        <Text style={s.section}>КУРСЫ УРОВНЯ</Text>
        {pool.map((lesson) => {
          const done = progress.completed.includes(lesson.id);
          const unlocked = isUnlocked(lesson);
          const result = progress.lessonResults?.[lesson.id];
          return (
            <Pressable
              key={lesson.id}
              disabled={!unlocked}
              onPress={() => onLesson(lesson)}
              style={[s.lesson, !unlocked && { opacity: 0.4 }]}
            >
              <View
                style={[s.lessonIcon, { backgroundColor: `${lesson.color}22` }]}
              >
                <Ionicons
                  name={
                    done
                      ? "checkmark-circle"
                      : unlocked
                        ? lesson.icon
                        : "lock-closed"
                  }
                  size={24}
                  color={
                    done
                      ? colors.mint
                      : unlocked
                        ? lesson.color
                        : colors.textMuted
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lessonTitle}>{lesson.title}</Text>
                <Text style={s.lessonText}>
                  {done
                    ? `${"⭐".repeat(result?.stars || 1)} · ${result?.bestAccuracy || result?.accuracy || 0}%`
                    : `${lesson.exercises.length} заданий · ${lesson.subtitle}`}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={19}
                color={colors.textMuted}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function StreakCalendarScreen({ onClose }) {
  const { progress } = useProgress();
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(Date.now() - (34 - index) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return { key, day: date.getDate(), count: progress.activity?.[key] || 0 };
  });
  const active = days.filter((item) => item.count > 0).length;
  const milestones = [
    [7, "Неделя в ритме", "🔥"],
    [30, "Месяц английского", "🏅"],
    [100, "Железная привычка", "👑"],
  ];
  return (
    <View style={s.container}>
      <Header title="Серия дней" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.streakHero}>
          <Text style={s.streakEmoji}>🔥</Text>
          <Text style={s.streakValue}>{progress.streak}</Text>
          <Text style={s.streakLabel}>
            дней подряд · {active} активных дней за 5 недель
          </Text>
        </View>
        <View style={s.calendar}>
          {days.map((item) => (
            <View
              key={item.key}
              style={[
                s.day,
                item.count > 0 && {
                  backgroundColor:
                    item.count >= 3 ? colors.mint : "rgba(46,211,183,.35)",
                },
              ]}
            >
              <Text style={[s.dayText, item.count > 0 && { color: "white" }]}>
                {item.day}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.section}>НАГРАДЫ ЗА СЕРИЮ</Text>
        {milestones.map(([daysCount, title, emoji]) => {
          const done = progress.streak >= daysCount;
          return (
            <View
              key={daysCount}
              style={[s.milestone, !done && { opacity: 0.45 }]}
            >
              <Text style={s.milestoneEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.lessonTitle}>{title}</Text>
                <Text style={s.lessonText}>
                  {done
                    ? "Получено ✓"
                    : `Осталось ${daysCount - progress.streak} дней`}
                </Text>
              </View>
              <Text style={s.levelCode}>{daysCount}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function WhatsNewScreen({ onClose }) {
  const updates = [
    [
      "shield-checkmark",
      "Контроль качества ответов",
      "Lingo распознаёт повторы, технический текст и потерю смысла, а плохой ответ автоматически создаёт заново перед показом.",
    ],
    [
      "library",
      "Офлайн-справочник A1–C1",
      "Локальная база правил подбирает только подходящую грамматику для ответа и разбора разговора.",
    ],
    [
      "create",
      "Редактируемая память",
      "Добавляй учебные цели вручную и удаляй неверно запомненные интересы, ошибки или слова в Центре ИИ.",
    ],
    [
      "bulb",
      "Локальная память Lingo",
      "Преподаватель запоминает цели, интересы, повторяющиеся ошибки, полезные слова и последние оценки только на твоём iPhone.",
    ],
    [
      "flag",
      "Персональные миссии дня",
      "Каждый день в чате появляется измеримая цель: поддержать разговор, задать вопросы, добавить подробности, использовать время или вернуть слова в речь.",
    ],
    [
      "library",
      "Проверенные правила для ИИ",
      "Перед исправлением Lingo получает локальную грамматическую памятку и меньше выдумывает несуществующие правила.",
    ],
    [
      "hardware-chip",
      "Новый Центр ИИ",
      "Смотри свободное место, проверку моделей, скорость генерации и нагрузку. Здесь же можно включить экономичный режим и освободить память.",
    ],
    [
      "mic-circle",
      "Лаборатория произношения",
      "Тренируй TH, V/W, R/L, гласные и окончания: слушай образец, записывай себя, получай оценку и проходи экзамен из пяти фраз.",
    ],
    [
      "refresh-circle",
      "Загрузка переживает паузу",
      "Модель безопасно ставится на паузу в фоне и продолжает загрузку после возвращения в приложение. Незавершённый файл не теряется.",
    ],
    [
      "shield-checkmark",
      "Проверка и защита ИИ",
      "Приложение проверяет размер и заголовок GGUF, останавливает зависший ответ и автоматически освобождает память при выходе из раздела ИИ.",
    ],
    [
      "mic",
      "Полноэкранный голосовой тренер",
      "Говори вслух, читай субтитры и получай озвученный ответ локального ИИ без сервера.",
    ],
    [
      "people",
      "Шесть ролевых сценариев",
      "Аэропорт, ресторан, отель, собеседование, врач и новое знакомство — у каждого разговора есть цели и подсказки.",
    ],
    [
      "options",
      "Настрой преподавателя",
      "Выбирай уровень, скорость речи, мягкие или строгие исправления, длину ответа и режим полного погружения.",
    ],
    [
      "today",
      "Разговорная миссия дня",
      "Каждый день приложение предлагает новый практический сценарий, а после завершения сохраняет результат в историю.",
    ],
    [
      "analytics",
      "Персональный разбор разговора",
      "Локальный ИИ оценивает грамматику, словарь и связность, показывает исправления и запоминает слабые места.",
    ],
    [
      "school",
      "Мини-урок из твоих ошибок",
      "После разговора ИИ создаёт задания именно по твоим фразам, а варианты ответов перемешиваются.",
    ],
    [
      "add-circle",
      "Новые слова сразу в словарь",
      "Выбирай полезные слова из разбора и добавляй их в личную базу одним нажатием.",
    ],
    [
      "keypad",
      "Клавиатура больше не перекрывает ввод",
      "Поле поднято выше клавиатуры, нижняя навигация скрывается, а отдельная кнопка всегда позволяет убрать клавиатуру.",
    ],
    [
      "time",
      "История ИИ-разговоров",
      "Диалоги сохраняются на iPhone автоматически. Создавай новые беседы, возвращайся к старым и удаляй ненужные.",
    ],
    [
      "download",
      "Загрузка продолжается",
      "Переключайся между вкладками во время скачивания модели — процент и сама загрузка больше не сбрасываются.",
    ],
    [
      "bookmark",
      "Ответы ИИ в тетради",
      "Полезное объяснение или фразу можно одним нажатием сохранить в «Мою тетрадь» для повторения.",
    ],
    [
      "chatbubbles",
      "Локальный ИИ-преподаватель",
      "Скачай лёгкую, обычную или продвинутую модель в новой вкладке «ИИ» и разговаривай с преподавателем без сервера.",
    ],
    [
      "mic",
      "Голосовой разговор",
      "Говори по-английски, получай исправления и озвучивай ответы. Распознавание можно выполнять прямо на iPhone.",
    ],
    [
      "school",
      "Большие объяснения везде",
      "После каждого ответа показываются причина, правило, разобранный пример и частая ошибка — даже если ответ был правильным.",
    ],
    [
      "volume-high",
      "Озвучивание без очереди",
      "Голосовой движок запускается заранее, а новое нажатие звучит сразу вместо ожидания предыдущей фразы.",
    ],
    [
      "cloud-download",
      "Надёжное восстановление",
      "После переустановки облачная копия загружается первой и новый пустой профиль больше не может стереть занятия.",
    ],
    [
      "speedometer",
      "Быстрый раздел «Слова»",
      "Поиск, фильтры и варианты ответов переработаны: длинные списки больше не пересчитываются при каждом нажатии.",
    ],
    [
      "cloud-done",
      "Аккаунт и облачный прогресс",
      "Регистрируйся по почте: занятия автоматически сохраняются и восстанавливаются после переустановки.",
    ],
    [
      "person-circle",
      "Имя вводится один раз",
      "Имя из первого запуска автоматически используется в профиле и при создании аккаунта.",
    ],
    [
      "phone-portrait",
      "Офлайн по-прежнему работает",
      "Интернет нужен только для входа и синхронизации — уроки, словарь и времена остаются на iPhone.",
    ],
    [
      "notifications",
      "Напоминания без интернета",
      "Выбери время занятия в настройках — iPhone напомнит локально, без сервера.",
    ],
    [
      "book",
      "Полный офлайн-словарь",
      "Более 8 000 проверенных слов: исправлены омонимы, обрывки примеров и неверные основные значения.",
    ],
    [
      "download",
      "Резервная копия файлом",
      "Сохраняй весь прогресс в JSON и восстанавливай его после установки новой IPA.",
    ],
    [
      "sparkles",
      "Умный план дня",
      "Маршрут учитывает просроченные повторения, сложные слова, грамматику и дневную цель.",
    ],
    [
      "library",
      "Академия 8 000+ слов",
      "Пять режимов, темы, слово дня, статусы, избранное и интервальные повторения — полностью без интернета.",
    ],
    [
      "options",
      "Свой словарь",
      "Помечай сложные слова, скрывай ненужные и исправляй перевод прямо на карточке.",
    ],
    [
      "earth",
      "Английская жизнь",
      "20 глав, 68 сцен, три профессии, ответы на сообщения и несколько финалов.",
    ],
    [
      "search",
      "Единый поиск",
      "Находи курсы, времена, правила и слова по одному запросу.",
    ],
    [
      "bookmark",
      "Закладки",
      "Сохраняй материалы и возвращайся к ним из главного экрана.",
    ],
    [
      "bulb",
      "Разбор ошибок",
      "Журнал объясняет правило и позволяет сохранить его в тетрадь.",
    ],
    [
      "today",
      "Умный план дня",
      "Маршрут учитывает точность, ошибки и незавершённые темы.",
    ],
    [
      "sparkles",
      "Настраиваемый главный экран",
      "Выбирай быстрые действия в настройках профиля.",
    ],
    [
      "time",
      "Недавние занятия",
      "Возвращайся к пяти последним урокам и разделам.",
    ],
    [
      "map",
      "Прогресс A1–C1",
      "Новый экран показывает курсы, точность и экзамен каждого уровня.",
    ],
    [
      "flame",
      "Календарь серии",
      "Следи за активностью и открывай награды за регулярность.",
    ],
    [
      "funnel",
      "Фильтры ошибок",
      "Слова, уроки, грамматику и диктанты можно смотреть отдельно.",
    ],
  ];
  return (
    <View style={s.container}>
      <Header title="Что нового" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.newEmoji}>✨</Text>
        <Text style={s.title}>Теперь можно говорить с Lingo</Text>
        <Text style={s.newSubtitle}>
          Проходи голосовые сценарии, слушай ответы и получай персональный разбор прямо на iPhone.
        </Text>
        {updates.map(([icon, title, text]) => (
          <View key={title} style={s.update}>
            <View style={s.updateIcon}>
              <Ionicons name={icon} size={23} color={colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lessonTitle}>{title}</Text>
              <Text style={s.lessonText}>{text}</Text>
            </View>
          </View>
        ))}
        <PrimaryButton title="Начать обучение" onPress={onClose} />
      </ScrollView>
    </View>
  );
}

function Metric({ value, label }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
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
  headerTitle: { color: "white", fontWeight: "900", fontSize: 17 },
  content: { padding: 20, paddingBottom: 55 },
  title: { color: "white", fontSize: 34, fontWeight: "900" },
  levelTabs: { gap: 8, paddingVertical: 18 },
  levelTab: {
    width: 67,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 17,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelTabActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  levelCode: { color: colors.purple, fontWeight: "900" },
  levelCount: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  hero: { backgroundColor: colors.card, borderRadius: 24, padding: 18 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  heroLevel: { color: "white", fontSize: 27, fontWeight: "900" },
  heroPercent: { color: colors.mint, fontSize: 24, fontWeight: "900" },
  metrics: { flexDirection: "row", gap: 9, marginTop: 17 },
  metric: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.cardLight,
    borderRadius: 15,
    paddingVertical: 11,
  },
  metricValue: { color: "white", fontWeight: "900", fontSize: 16 },
  metricLabel: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 23,
    marginBottom: 10,
  },
  lesson: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 13,
    marginBottom: 9,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonTitle: { color: "white", fontWeight: "900", fontSize: 15 },
  lessonText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  streakHero: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 27,
    padding: 25,
  },
  streakEmoji: { fontSize: 54 },
  streakValue: { color: colors.orange, fontSize: 48, fontWeight: "900" },
  streakLabel: { color: colors.textMuted, textAlign: "center" },
  calendar: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 },
  day: {
    width: "11.7%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
  milestone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
  },
  milestoneEmoji: { fontSize: 34 },
  newEmoji: { fontSize: 66, textAlign: "center", marginTop: 10 },
  newSubtitle: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 20,
  },
  update: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
  },
  updateIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(124,92,252,.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
