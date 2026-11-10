import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "../data/course";
import { wordBank } from "../data/wordBank";
import { tenseModules } from "../data/advancedCourse";
import { grammarTracks } from "../data/grammarAcademy";
import { useProgress } from "../store/ProgressContext";
import { colors } from "../theme";

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

const categories = ["Все", "Курсы", "Времена", "Правила", "Слова"];

export function SmartSearchScreen({ onClose, onLesson, onNavigate }) {
  const { progress, toggleFavorite } = useProgress();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const normalized = query.trim().toLocaleLowerCase("ru");
  const results = useMemo(() => {
    if (normalized.length < 2) return [];
    const contains = (...values) =>
      values
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru")
        .includes(normalized);
    return [
      ...lessons
        .filter((item) =>
          contains(
            item.title,
            item.subtitle,
            item.difficulty,
            ...item.exercises.flatMap((exercise) => [
              exercise.prompt,
              exercise.answer,
            ]),
          ),
        )
        .map((item) => ({
          key: `lesson-${item.id}`,
          id: item.id,
          type: "lesson",
          category: "Курсы",
          title: item.title,
          subtitle: `${item.difficulty} · ${item.subtitle}`,
          icon: item.icon,
          color: item.color,
          source: item,
        })),
      ...tenseModules
        .filter((item) =>
          contains(
            item.name,
            item.level,
            item.formula,
            item.story,
            item.explanation,
          ),
        )
        .map((item) => ({
          key: `tense-${item.id}`,
          id: item.id,
          type: "tense",
          category: "Времена",
          title: item.name,
          subtitle: `${item.level} · ${item.formula}`,
          icon: "time",
          color: colors.orange,
        })),
      ...grammarTracks
        .filter((item) =>
          contains(item.title, item.level, item.hook, item.formula),
        )
        .map((item) => ({
          key: `grammar-${item.id}`,
          id: item.id,
          type: "grammar",
          category: "Правила",
          title: item.title,
          subtitle: `${item.level} · ${item.formula}`,
          icon: "school",
          color: item.color,
        })),
      ...wordBank
        .filter((item) =>
          contains(
            item.english,
            item.russian,
            item.fullTranslation,
            ...(item.translations || []),
            item.transcription,
          ),
        )
        .map((item) => ({
          key: `word-${item.id}`,
          id: item.id,
          type: "word",
          category: "Слова",
          title: item.english,
          subtitle: `${item.level} · ${item.russian}${item.transcription ? ` · ${item.transcription}` : ""}`,
          icon: "text",
          color: colors.mint,
        })),
    ]
      .filter((item) => category === "Все" || item.category === category)
      .slice(0, 60);
  }, [normalized, category]);

  const open = (item) => {
    Keyboard.dismiss();
    if (item.type === "lesson") onLesson(item.source);
    else if (item.type === "tense") onNavigate("tenses");
    else if (item.type === "grammar") onNavigate("grammarAcademy");
    else onNavigate("review");
  };
  const favoriteKeys = new Set(
    (progress.favorites || []).map((item) => `${item.type}-${item.id}`),
  );

  return (
    <View style={s.container}>
      <Header title="Поиск" onClose={onClose} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={s.content}
      >
        <Text style={s.title}>Найди что угодно</Text>
        <Text style={s.subtitle}>
          Курсы, времена, правила и слова ищутся в одном месте
        </Text>
        <View style={s.search}>
          <Ionicons name="search" size={21} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Например: условные или путешествие"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={s.searchInput}
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[s.chip, category === item && s.chipActive]}
            >
              <Text
                style={[s.chipText, category === item && { color: "white" }]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {normalized.length < 2 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔎</Text>
            <Text style={s.cardTitle}>Начни вводить запрос</Text>
            <Text style={s.cardText}>
              Достаточно двух букв на русском или английском
            </Text>
          </View>
        ) : !results.length ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🧭</Text>
            <Text style={s.cardTitle}>Ничего не найдено</Text>
            <Text style={s.cardText}>
              Попробуй более короткое слово или другую категорию
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.resultCount}>НАЙДЕНО: {results.length}</Text>
            {results.map((item) => {
              const saved = favoriteKeys.has(`${item.type}-${item.id}`);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => open(item)}
                  style={s.result}
                >
                  <View
                    style={[
                      s.resultIcon,
                      { backgroundColor: `${item.color}22` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={23} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.category}>{item.category}</Text>
                    <Text style={s.cardTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={s.cardText}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleFavorite({
                        type: item.type,
                        id: item.id,
                        title: item.title,
                        level: item.subtitle,
                        color: item.color,
                      });
                    }}
                  >
                    <Ionicons
                      name={saved ? "bookmark" : "bookmark-outline"}
                      size={23}
                      color={saved ? colors.orange : colors.textMuted}
                    />
                  </Pressable>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function BookmarksScreen({ onClose, onLesson, onNavigate }) {
  const { progress, toggleFavorite, toggleNotebook } = useProgress();
  const [filter, setFilter] = useState("Все");
  const favorites = (progress.favorites || []).map((item) => ({
    ...item,
    key: `${item.type}-${item.id}`,
    group:
      item.type === "lesson"
        ? "Курсы"
        : item.type === "tense"
          ? "Времена"
          : item.type === "word" || item.type === "lexicon"
            ? "Слова"
            : "Правила",
  }));
  const notes = (progress.notebook || []).map((item) => ({
    ...item,
    key: `note-${item.id}`,
    type: "note",
    group: "Правила",
    title: item.topic || "Сохранённое правило",
    level: item.rule,
    color: colors.purple,
  }));
  const all = [...favorites, ...notes];
  const visible =
    filter === "Все" ? all : all.filter((item) => item.group === filter);
  const open = (item) => {
    if (item.type === "lesson") {
      const lesson = lessons.find((entry) => entry.id === item.id);
      if (lesson) onLesson(lesson);
    } else if (item.type === "tense") onNavigate("tenses");
    else if (item.type === "grammar") onNavigate("grammarAcademy");
    else if (item.type === "note") onNavigate("notebook");
    else onNavigate("review");
  };
  return (
    <View style={s.container}>
      <Header title="Закладки" onClose={onClose} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Сохранённое</Text>
        <Text style={s.subtitle}>
          {all.length} материалов для быстрого возвращения
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[s.chip, filter === item && s.chipActive]}
            >
              <Text style={[s.chipText, filter === item && { color: "white" }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {!visible.length ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔖</Text>
            <Text style={s.cardTitle}>Здесь пока пусто</Text>
            <Text style={s.cardText}>
              Нажимай значок закладки в поиске, уроках и правилах
            </Text>
          </View>
        ) : (
          visible.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => open(item)}
              style={s.result}
            >
              <View
                style={[
                  s.resultIcon,
                  { backgroundColor: `${item.color || colors.purple}22` },
                ]}
              >
                <Ionicons
                  name={item.type === "note" ? "document-text" : "bookmark"}
                  size={22}
                  color={item.color || colors.purple}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.category}>{item.group}</Text>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={s.cardText}>
                  {item.level || item.subtitle || item.example}
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={(event) => {
                  event.stopPropagation();
                  item.type === "note"
                    ? toggleNotebook(item)
                    : toggleFavorite(item);
                }}
              >
                <Ionicons name="trash-outline" size={21} color={colors.pink} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
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
  headerTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  content: { padding: 20, paddingBottom: 55 },
  title: { color: "white", fontSize: 34, fontWeight: "900" },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 17,
  },
  search: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: "white", fontSize: 15 },
  chips: { gap: 8, paddingVertical: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
  resultCount: {
    color: colors.textMuted,
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 1.1,
    marginVertical: 7,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 19,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  category: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  cardText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 29,
    marginTop: 15,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
});
