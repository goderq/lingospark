import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useCloudSync } from '../store/CloudSyncContext';
import { colors , useTheme, createThemedStyles } from '../theme';
import { useProgressSelector } from '../store/ProgressContext';

export default function SyncStatus({ onAccount, onDetails }) {
  useTheme();
  const { status, lastSyncedAt, lastError, showConflict } = useCloudSync();
  const storageError = useProgressSelector(state => state.storageError || '');
  const text = status === 'synced' ? `Облако: сохранено${lastSyncedAt ? ` в ${new Date(lastSyncedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}`
    : status === 'syncing' ? 'Облако: синхронизация…' : status === 'pending' ? 'Облако: изменения ожидают отправки'
      : status === 'error' ? 'Облако: не удалось синхронизировать · подробнее' : 'Локальный прогресс · настроить облако';
  return <Pressable accessibilityRole="button" accessibilityLabel={storageError || (lastError ? `${text}. ${lastError}` : text)} onPress={storageError ? onDetails : status === 'conflict' ? showConflict : status === 'offline' ? onAccount : onDetails} style={s.root}><Text style={[s.text, (status === 'error' || storageError) && { color: colors.orange }]}>{storageError ? 'Ошибка сохранения на устройстве · подробнее' : status === 'conflict' ? 'Две версии прогресса · выбрать сохранение' : text}</Text></Pressable>;
}
const s = createThemedStyles(() => ({ root: { minHeight: 44, justifyContent: 'center', marginBottom: 14 }, text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 } }));
