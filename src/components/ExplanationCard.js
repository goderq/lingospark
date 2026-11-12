import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useProgress } from "../store/ProgressContext";
import { balancedOptions } from "../utils/shuffle";
import {
  explainSelectedOption,
  getExplanationExamples,
  getExplanationSections,
  getRelevantReinforcement,
} from "../utils/explanations";

const detailIds = new Set(["rule", "steps", "memory", "check"]);

export default function ExplanationCard({
  item,
  selected,
  context = {},
  correct = false,
  reinforcement = null,
  onSave,
  saved = false,
  accentColor,
  showStatus = true,
}) {
  const { recordExercise } = useProgress();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mistakeOpen, setMistakeOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [alternativesOpen, setAlternativesOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceSelected, setPracticeSelected] = useState("");
  const sections = useMemo(
    () => getExplanationSections(item, { ...context, selected }),
    [item, context, selected],
  );
  const examples = useMemo(
    () => getExplanationExamples(item, { ...context, selected }),
    [item, context, selected],
  );
  const why = sections.find((section) => section.id === "why")?.text;
  const details = sections.filter((section) => detailIds.has(section.id));
  const color = accentColor || (correct ? colors.mint : colors.orange);
  const relevantReinforcement = useMemo(
    () => getRelevantReinforcement(item, Boolean(reinforcement), context),
    [item, reinforcement, context],
  );
  const practiceOptions = useMemo(
    () => relevantReinforcement?.type === "choice"
      ? balancedOptions(
          relevantReinforcement.options,
          relevantReinforcement.answer,
          0,
          String(relevantReinforcement.id || relevantReinforcement.prompt).length * 7919,
        )
      : [],
    [relevantReinforcement],
  );

  useEffect(() => {
    setDetailsOpen(false);
    setMistakeOpen(false);
    setExamplesOpen(false);
    setAlternativesOpen(false);
    setPracticeOpen(false);
    setPracticeSelected("");
  }, [item?.id, item?.prompt]);

  return (
    <View style={[styles.card, { borderColor: `${color}55` }]}>
      {showStatus && <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={correct ? "checkmark" : "school"} size={21} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.status, { color }]}>
            {correct ? "Ответ верный" : `Правильный ответ: ${item.answer}`}
          </Text>
          <Text style={styles.short}>{why}</Text>
        </View>
      </View>}

      <View style={styles.actions}>
        <Action
          icon={detailsOpen ? "chevron-up" : "reader-outline"}
          title={detailsOpen ? "Свернуть" : "Подробный разбор"}
          active={detailsOpen}
          onPress={() => setDetailsOpen((value) => !value)}
        />
        {!correct && (
          <Action
            icon="close-circle-outline"
            title="Почему ошибка"
            active={mistakeOpen}
            onPress={() => setMistakeOpen((value) => !value)}
          />
        )}
        <Action
          icon="albums-outline"
          title="Примеры"
          active={examplesOpen}
          onPress={() => setExamplesOpen((value) => !value)}
        />
        {!!item.options?.length && (
          <Action
            icon="list-circle-outline"
            title="Другие варианты"
            active={alternativesOpen}
            onPress={() => setAlternativesOpen((value) => !value)}
          />
        )}
      </View>

      {mistakeOpen && (
        <Section
          icon="git-compare-outline"
          title="Разбор выбранного варианта"
          text={explainSelectedOption(item, { ...context, selected })}
          color={colors.orange}
        />
      )}
      {detailsOpen && details.map((section) => (
        <Section
          key={section.id}
          icon={
            section.id === "rule"
              ? "book-outline"
              : section.id === "steps"
                ? "list-outline"
                : section.id === "memory"
                  ? "bulb-outline"
                  : "help-circle-outline"
          }
          title={section.title}
          text={section.text}
          color={color}
        />
      ))}
      {alternativesOpen && item.options
        .filter((option) => option !== item.answer)
        .map((option) => (
          <Section
            key={option}
            icon="close-circle-outline"
            title={`Почему не «${option}»`}
            text={explainSelectedOption(item, { ...context, selected: option })}
            color={colors.pink}
          />
        ))}
      {examplesOpen && (
        <View style={styles.examples}>
          {examples.length ? examples.map((example, index) => (
            <Section
              key={`${example.label}-${index}`}
              icon="chatbox-ellipses-outline"
              title={example.label}
              text={example.text}
              color={colors.purple}
            />
          )) : (
            <Text style={styles.muted}>Прочитай правильный ответ вслух и придумай собственную ситуацию с этой конструкцией.</Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        {!!relevantReinforcement && (
          <Pressable
            onPress={() => {
              setPracticeOpen((value) => !value);
              setPracticeSelected("");
            }}
            style={[styles.footerButton, practiceOpen && styles.footerButtonActive]}
          >
            <Ionicons name="flash-outline" size={17} color={colors.mint} />
            <Text style={styles.practiceText}>Закрепить</Text>
          </Pressable>
        )}
        {!!onSave && (
          <Pressable onPress={onSave} style={styles.footerButton}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={17} color={colors.orange} />
            <Text style={styles.saveText}>{saved ? "В тетради" : "В тетрадь"}</Text>
          </Pressable>
        )}
      </View>

      {practiceOpen && relevantReinforcement?.type === "choice" && (
        <View style={styles.practice}>
          <Text style={styles.practiceLabel}>ЗАКРЕПЛЕНИЕ ЭТОГО ЖЕ НАВЫКА</Text>
          <Text style={styles.practicePrompt}>{relevantReinforcement.prompt}</Text>
          {practiceOptions.map((option) => {
            const answered = Boolean(practiceSelected);
            const right = option === relevantReinforcement.answer;
            const chosen = option === practiceSelected;
            return (
              <Pressable
                key={option}
                disabled={answered}
                onPress={() => {
                  setPracticeSelected(option);
                  if (relevantReinforcement.isNew) {
                    recordExercise(relevantReinforcement, right, {
                      selected: option,
                      topic: relevantReinforcement.skill,
                      ruleId: `reinforcement-${relevantReinforcement.sourceId || relevantReinforcement.skill}`,
                    });
                  }
                }}
                style={[
                  styles.practiceOption,
                  answered && right && styles.practiceCorrect,
                  answered && chosen && !right && styles.practiceWrong,
                ]}
              >
                <Text style={styles.practiceOptionText}>{option}</Text>
              </Pressable>
            );
          })}
          {!!practiceSelected && (
            <Text style={[
              styles.practiceResult,
              { color: practiceSelected === relevantReinforcement.answer ? colors.mint : colors.orange },
            ]}>
              {practiceSelected === relevantReinforcement.answer
                ? "Верно — правило закреплено."
                : `Ответ: ${relevantReinforcement.answer}. Сравни его со своим вариантом и попробуй объяснить отличие.`}
            </Text>
          )}
          {!!practiceSelected && !!relevantReinforcement.explanation && (
            <Text style={styles.muted}>{relevantReinforcement.explanation}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function Action({ icon, title, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive]}>
      <Ionicons name={icon} size={16} color={active ? "white" : colors.textMuted} />
      <Text style={[styles.actionText, active && { color: "white" }]}>{title}</Text>
    </Pressable>
  );
}

function Section({ icon, title, text, color }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={17} color={color} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    marginTop: 12,
  },
  header: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  status: { fontWeight: "900", fontSize: 15 },
  short: { color: "white", lineHeight: 21, marginTop: 5 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
  },
  actionActive: { backgroundColor: colors.purple },
  actionText: { color: colors.textMuted, fontWeight: "800", fontSize: 11 },
  section: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, marginTop: 13 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionTitle: { fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  sectionText: { color: colors.textMuted, lineHeight: 21, marginTop: 7 },
  examples: { marginTop: 1 },
  muted: { color: colors.textMuted, lineHeight: 20, marginTop: 12 },
  footer: { flexDirection: "row", gap: 8, marginTop: 14 },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: colors.cardLight,
  },
  footerButtonActive: { borderWidth: 1, borderColor: colors.mint },
  practiceText: { color: colors.mint, fontWeight: "900", fontSize: 12 },
  saveText: { color: colors.orange, fontWeight: "900", fontSize: 12 },
  practice: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 14 },
  practiceLabel: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  practicePrompt: { color: "white", fontSize: 18, lineHeight: 25, fontWeight: "800", marginVertical: 12 },
  practiceOption: { backgroundColor: colors.cardLight, borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 7 },
  practiceCorrect: { borderColor: colors.mint },
  practiceWrong: { borderColor: colors.orange },
  practiceOptionText: { color: "white", fontWeight: "700" },
  practiceResult: { fontWeight: "800", lineHeight: 20, marginTop: 5 },
});
