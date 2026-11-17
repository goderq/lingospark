import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useCloudSync } from '../store/CloudSyncContext';
import { useProgressSelector } from '../store/ProgressContext';
import { snapshotSummary, backupEnvelope } from '../utils/snapshot';
import { colors , useTheme } from '../theme';

export default function CloudConflictGate({ children }) {
  useTheme();
  const { conflict, conflictVisible, resolveConflict, deferConflict, lastError } = useCloudSync();
  const { progress, localUpdatedAt } = useProgressSelector(state => ({ progress: state.progress, localUpdatedAt: state.localUpdatedAt }));
  const [busy, setBusy] = useState(false);
  if (!conflict || !conflictVisible) return children;
  const choose = async choice => { setBusy(true); try { await resolveConflict(choice); } finally { setBusy(false); } };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 50 }}>
    <Text style={{ color: colors.text, fontSize: 29, fontWeight: '800' }}>Найдены две версии прогресса</Text>
    <Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 25 }}>Обе версии содержат занятия. Автоматическая замена остановлена. Сравни их и выбери, какую использовать. Перед заменой обе копии сохраняются на устройстве.</Text>
    {[['На устройстве', progress, localUpdatedAt], ['В облаке', conflict.progress, conflict.device_updated_at || conflict.updated_at]].map(([label, snapshot, date]) => {
      const summary = snapshotSummary(snapshot);
      return <View key={label} style={{ padding: 20, borderRadius: 20, backgroundColor: colors.card, gap: 10 }}><Text style={{ color: colors.mint, fontSize: 21, fontWeight: '700' }}>{label}</Text><Text style={{ color: colors.textMuted }}>{date ? new Date(date).toLocaleString('ru-RU') : 'Дата неизвестна'}</Text><Text style={{ color: colors.text, fontSize: 16, lineHeight: 26 }}>Уроки: {summary.lessons} · времена: {summary.tenses}{'\n'}Слова в практике: {summary.words} · этапы: {summary.stages}{'\n'}XP: {summary.xp}</Text></View>;
    })}
    {!!lastError && <Text style={{ color: colors.orange }}>{lastError}</Text>}
    {[['Использовать версию с устройства', () => choose('local')], ['Использовать облачную версию', () => choose('cloud')], ['Скопировать обе версии', () => Clipboard.setStringAsync(JSON.stringify({ format: 'LingoSpark Conflict', local: backupEnvelope(progress), cloud: backupEnvelope(conflict.progress) }))], ['Решить позже · продолжить локально', deferConflict]].map(([label, action]) => <Pressable key={label} disabled={busy} onPress={action} style={{ padding: 18, minHeight: 52, backgroundColor: colors.cardLight, borderRadius: 16, opacity: busy ? 0.4 : 1 }}><Text style={{ color: colors.text, textAlign: 'center', fontSize: 16, fontWeight: '700' }}>{label}</Text></Pressable>)}
  </ScrollView></SafeAreaView>;
}
