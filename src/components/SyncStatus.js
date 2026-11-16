import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useCloudSync } from '../store/CloudSyncContext';
import { colors } from '../theme';

export default function SyncStatus({ onAccount, onDetails }) {
  const { status, lastSyncedAt, lastError } = useCloudSync();
  const text = status === 'synced' ? `Облако: сохранено${lastSyncedAt ? ` в ${new Date(lastSyncedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}`
    : status === 'syncing' ? 'Облако: синхронизация…' : status === 'pending' ? 'Облако: изменения ожидают отправки'
      : status === 'error' ? 'Облако: не удалось синхронизировать · подробнее' : 'Локальный прогресс · настроить облако';
  return <Pressable accessibilityRole="button" accessibilityLabel={lastError ? `${text}. ${lastError}` : text} onPress={status === 'offline' ? onAccount : onDetails} style={s.root}><Text style={[s.text, status === 'error' && { color: colors.orange }]}>{text}</Text></Pressable>;
}
const s = StyleSheet.create({ root: { minHeight: 44, justifyContent: 'center', marginBottom: 14 }, text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 } });
