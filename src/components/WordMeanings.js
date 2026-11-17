import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors , useTheme } from '../theme';

// Additional dictionary senses stay available without crowding a new word's card.
export default function WordMeanings({ word }) {
  useTheme();
  const [expanded, setExpanded] = useState(false);
  const alternatives = [...new Set(word.translations || [])].filter(value => value && value !== word.russian);
  if (!alternatives.length) return null;
  return <View style={{ gap: 10 }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: colors.purple, fontSize: 15, fontWeight: '700' }}>{expanded ? 'Скрыть другие значения' : `Другие значения · ${alternatives.length}`}</Text>
    </Pressable>
    {expanded && <><Text style={{ color: colors.textMuted, fontSize: 15, lineHeight: 23 }}>{alternatives.join(' · ')}</Text><Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>Значение зависит от контекста. В этой тренировке принимаются переводы из списка; в тематических заданиях проверяется значение конкретной фразы.</Text></>}
  </View>;
}
