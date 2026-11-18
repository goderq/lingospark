import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';
import { MotionPressable } from './Motion';
import WordMeanings from './WordMeanings';
import WordContext from './WordContext';
import ContentReportButton from './ContentReportButton';
import { speak } from '../utils/speech';
import { wordStateLabels } from '../utils/wordDictionary';

function DictionaryWordRow({ word, opened, favorite, hard, translation, state, accent, rate, setExpanded, togglePreference, removeWord }) {
  useTheme();
  const custom = word.id.startsWith('custom-');
  const statusColor = state === 'due' ? colors.orange : state === 'learned' ? colors.mint : colors.purple;
  return <View style={[s.card, opened && s.opened]}>
    <View style={s.row}>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Послушать ${word.english}`} onPress={() => speak(word.english, { language: accent, rate })} style={s.sound}><Ionicons name="volume-high" size={21} color={colors.purple} /></MotionPressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${word.english}, ${translation}. ${wordStateLabels[state]}`} accessibilityState={{ expanded: opened }} onPress={() => setExpanded(current => current === word.id ? null : word.id)} style={s.main}>
        <View style={s.title}><Text style={s.english}>{word.english}</Text><Text style={s.level}>{word.level}</Text></View>
        <Text style={s.russian} numberOfLines={opened ? undefined : 2}>{translation}</Text>
        <View style={s.status}><View style={[s.dot, { backgroundColor: statusColor }]} /><Text style={[s.statusText, { color: statusColor }]}>{wordStateLabels[state]}</Text><Ionicons name={opened ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} /></View>
      </Pressable>
      <View>
        {custom ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Удалить ${word.english}`} onPress={() => removeWord(word.id)} style={s.action}><Ionicons name="trash-outline" size={21} color={colors.pink} /></MotionPressable> : <>
          <MotionPressable accessibilityRole="button" accessibilityLabel={favorite ? 'Убрать из избранного' : 'Добавить в избранное'} accessibilityState={{ selected: favorite }} onPress={() => togglePreference('favorites', word.id)} style={s.action}><Ionicons name={favorite ? 'star' : 'star-outline'} size={21} color={favorite ? colors.orange : colors.textMuted} /></MotionPressable>
          <MotionPressable accessibilityRole="button" accessibilityLabel={hard ? 'Убрать отметку сложного слова' : 'Отметить сложным'} accessibilityState={{ selected: hard }} onPress={() => togglePreference('hard', word.id)} style={s.action}><Ionicons name={hard ? 'alert-circle' : 'alert-circle-outline'} size={21} color={hard ? colors.pink : colors.textMuted} /></MotionPressable>
        </>}
      </View>
    </View>
    {opened && <View style={s.details}>
      {!!word.transcription && <Text style={s.transcription}>{word.transcription}</Text>}
      {!!word.partOfSpeech && <Text style={s.part}>{word.partOfSpeechInferred ? `По переводу: ${word.partOfSpeech.toLowerCase()}` : word.partOfSpeech}</Text>}
      {translation === word.russian && <WordMeanings key={word.id} word={word} />}<WordContext key={`example-${word.id}`} word={word} accent={accent} rate={rate} />
      <ContentReportButton item={{ id: word.id, type: 'translate', prompt: word.english, answer: word.fullTranslation || translation }} context={{ topic: 'Словарь' }} />
    </View>}
  </View>;
}
export default memo(DictionaryWordRow);
const s = createThemedStyles(() => ({ card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, marginBottom: 12, padding: 12 }, opened: { borderColor: colors.purple }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sound: { width: 44, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }, main: { flex: 1, minHeight: 92, justifyContent: 'center', gap: 5 }, title: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, english: { color: colors.text, fontSize: 21, fontWeight: '800', flexShrink: 1 }, level: { color: colors.mint, backgroundColor: colors.successSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, fontSize: 11, fontWeight: '800' }, russian: { color: colors.text, fontSize: 16, lineHeight: 23 }, status: { flexDirection: 'row', alignItems: 'center', gap: 5 }, dot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 12, fontWeight: '700' }, action: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, details: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12, gap: 5 }, transcription: { color: colors.purple, fontSize: 15 }, part: { color: colors.textMuted, fontSize: 13, lineHeight: 20 } }));
