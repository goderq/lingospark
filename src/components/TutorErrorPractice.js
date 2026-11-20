import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, createThemedStyles, useTheme } from '../theme';
import { constructionReviews } from '../data/constructionPractice';
import { evaluateExercise } from '../utils/answer';
import { balancedOptions } from '../utils/shuffle';
import { reviewId } from '../utils/unifiedReview';
import { PrimaryButton } from './UI';

export default function TutorErrorPractice({ practice, progress, onSave }) {
  useTheme();
  const [choice, setChoice] = useState(null);
  const { original, explanation, exercise, construction } = practice;
  const review = constructionReviews[construction];
  const saved = review && !!progress.reviewQueue?.[reviewId(review)];
  const result = choice === null ? null : evaluateExercise(exercise, choice);
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.title}>Закрепи ошибку из разговора</Text>
    <Text style={s.muted}>Твоя фраза</Text>
    <Text style={s.text}>{original}</Text>
    <Text style={s.muted}>{explanation}</Text>
    <Text style={s.title}>{exercise.prompt}</Text>
    {balancedOptions(exercise.options, exercise.answer, 0, original).map(option => {
      const correct = result && evaluateExercise(exercise, option).correct;
      const wrong = result && option === choice && !result.correct;
      return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: option === choice, disabled: !!result }}
        disabled={!!result} onPress={() => setChoice(option)}
        style={[s.option, correct && s.correct, wrong && s.wrong]}>
        <Text style={s.text}>{option}</Text>
      </Pressable>;
    })}
    {!!result && <Text accessibilityLiveRegion="polite" style={s.muted}>
      {result.correct ? 'Верно!' : 'Правильный вариант — ' + exercise.answer}
    </Text>}
    <PrimaryButton title={saved ? 'Сохранено для повторения' : 'Сохранить для повторения'}
      variant="secondary" disabled={saved} onPress={() => onSave(construction)} />
  </View>;
}

const s = createThemedStyles(() => ({
  card: { gap: 10, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 18 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16, lineHeight: 22 },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  option: { minHeight: 44, justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: colors.buttonBorder, borderRadius: 12 },
  correct: { borderColor: colors.mint, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.pink, backgroundColor: colors.dangerSoft },
}));
