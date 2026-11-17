import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text } from 'react-native';
import { useProgressActions } from '../store/ProgressContext';
import { useCloudSync } from '../store/CloudSyncContext';
import { useAuth } from '../store/AuthContext';
import AuthScreen from './AuthScreen';
import { colors , useTheme } from '../theme';

const BackupScreen = React.lazy(() => import('./ExpansionScreens').then(module => ({ default: module.BackupScreen })));
export default function RecoveryScreen({ error }) {
  useTheme();
  const { retryLocalLoad, reset } = useProgressActions();
  const { restoreFromCloud, lastError } = useCloudSync();
  const { user } = useAuth();
  const [mode, setMode] = useState(null);
  if (mode === 'backup') return <BackupScreen initialMode="import" onClose={() => setMode(null)} />;
  if (mode === 'login') return <AuthScreen optional onClose={() => setMode(null)} />;
  return <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50, gap: 20 }}>
    <Text style={{ color: colors.text, fontSize: 29, fontWeight: '800' }}>Восстановление прогресса</Text>
    <Text style={{ color: colors.textMuted, fontSize: 17, lineHeight: 26 }}>Локальные копии не удалось прочитать. Можно повторить чтение, восстановить файл или получить сохранение из аккаунта. Автоматический сброс остановлен.</Text>
    <Text style={{ color: colors.orange }}>{error}{lastError ? `\n${lastError}` : ''}</Text>
    {[
      ['Повторить чтение', retryLocalLoad],
      ['Восстановить файл или код', () => setMode('backup')],
      [user ? 'Проверить облачную копию' : 'Войти для восстановления из облака', user ? restoreFromCloud : () => setMode('login')],
      ['Начать заново', () => Alert.alert('Создать новый прогресс?', 'Учебный прогресс будет сброшен. Используй этот вариант, если восстановить копию не удалось.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Сбросить', style: 'destructive', onPress: reset }])],
    ].map(([title, action]) => <Pressable key={title} onPress={action} style={{ padding: 18, backgroundColor: colors.card, borderRadius: 18, minHeight: 52 }}><Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{title}</Text></Pressable>)}
  </ScrollView>;
}
