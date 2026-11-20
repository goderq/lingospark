import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';
import { useProgress } from '../store/ProgressContext';
import { useAuth } from '../store/AuthContext';
import { useCloudSync } from '../store/CloudSyncContext';
import { ProgressBar } from '../components/UI';
import AppearancePicker from '../components/AppearancePicker';

export default function ProfileScreen({ onSettings, onVocabulary, onBackup, onLevels, onStreak, onAccount, onDiagnostics, onAccess, onAdmin }) {
  useTheme();
  const { progress, reset } = useProgress();
  const { user, signOut } = useAuth();
  const { status, lastSyncedAt, syncNow } = useCloudSync();
  const data = progress.stats || {};
  const level = Math.floor(progress.totalXP / 100) + 1;
  const metrics = [
    ['Слова', data.reviewTotal ? Math.round(data.reviewCorrect / data.reviewTotal * 100) + '%' : 'Нет данных'],
    ['Грамматика', data.grammarTotal ? Math.round(data.grammarCorrect / data.grammarTotal * 100) + '%' : 'Нет данных'],
    ['Истории', data.storiesCompleted || 0], ['Диалоги', data.dialoguesCompleted || 0], ['Лучший блиц', (data.gameBest || 0) + '/10'], ['Ошибки для разбора', progress.mistakes?.length || 0],
  ];
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
    <View style={s.top}><View style={{ flex: 1 }}><Text style={s.eyebrow}>ТВОЙ ПРОГРЕСС</Text><Text style={s.title}>Каждый шаг важен</Text></View><Pressable accessibilityLabel="Настройки" onPress={onSettings} style={s.gear}><Ionicons name="settings-outline" size={23} color={colors.text} /></Pressable></View>
    <View style={s.identity}><View style={s.avatar}><Text style={s.initial}>{progress.name.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={s.name}>{progress.name}</Text><Text style={s.muted}>{progress.learnerLevel ? 'Выбранный уровень: ' + progress.learnerLevel : 'Твой личный учебный маршрут'}</Text></View></View>
    <View style={s.stats}>{[['flame-outline', progress.streak, 'дней подряд'], ['flash-outline', progress.totalXP, 'всего XP'], ['checkmark-circle-outline', progress.completed.length, 'тем пройдено']].map(([icon, value, label]) => <View key={label} style={s.stat}><Ionicons name={icon} size={22} color={colors.purple} /><Text style={s.number}>{value}</Text><Text style={s.small}>{label}</Text></View>)}</View>
    <View style={s.card}><View style={s.top}><Text style={s.heading}>Уровень активности {level}</Text><Text style={s.muted}>{progress.totalXP % 100}/100 XP</Text></View><ProgressBar value={(progress.totalXP % 100) / 100} /><Text style={s.small}>XP отражает занятия. Уровень английского определяется отдельно.</Text></View>
    <Text style={s.section}>Как тебе удобнее?</Text><AppearancePicker />
    <Pressable onPress={onAccount} style={s.link}><View style={s.icon}><Ionicons name={user ? 'cloud-done-outline' : 'cloud-upload-outline'} size={24} color={colors.purple} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>{user ? 'Твой аккаунт' : 'Сохраняй прогресс в облаке'}</Text><Text style={s.muted}>{user ? ({ synced: 'Синхронизировано', pending: 'Изменения ожидают отправки', syncing: 'Сохраняем…', conflict: 'Нужно выбрать версию прогресса', error: 'Нужна проверка подключения' }[status] || 'Доступно локально') : 'Войти или создать аккаунт'}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></Pressable>
    {user && <Pressable onPress={syncNow} style={s.inline}><Text style={s.accent}>Синхронизировать сейчас</Text><Text style={s.small}>{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('ru-RU') : 'Ожидаем сохранение'}</Text></Pressable>}
    <Text style={s.section}>Результаты практики</Text><View style={s.grid}>{metrics.map(([label, value]) => <View key={label} style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.muted}>{label}</Text></View>)}</View>
    <Text style={s.section}>Всё под рукой</Text>
    {[['school-outline', 'Прогресс A1–C1', onLevels], ['calendar-outline', 'Календарь занятий', onStreak], ['book-outline', 'Мой словарь', onVocabulary], ['save-outline', 'Резервная копия', onBackup], ['options-outline', 'Настройки профиля и обучения', onSettings], ['key-outline', 'Лицензия и промокоды', onAccess], ['shield-outline', 'Админ-панель', onAdmin], ['pulse-outline', 'Диагностика', onDiagnostics]].filter(([, , onPress]) => !!onPress).map(([icon, label, onPress]) => <Pressable key={label} onPress={onPress} style={s.link}><View style={s.icon}><Ionicons name={icon} size={23} color={colors.purple} /></View><Text style={[s.heading, { flex: 1 }]}>{label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>)}
    <Text style={s.section}>Твои достижения</Text><View style={s.achievements}>{[['🌱', 'Первый шаг', progress.totalXP > 0], ['🔥', 'На огне', progress.streak >= 3], ['🏆', 'Знаток', progress.totalXP >= 300]].map(([emoji, title, achieved]) => <View key={title} style={[s.achievement, !achieved && { opacity: 0.45 }]}><Text style={{ fontSize: 30 }}>{emoji}</Text><Text style={s.small}>{title}</Text></View>)}</View>
    {!!user && <Pressable style={s.inline} onPress={() => Alert.alert('Выйти из аккаунта?', 'Чтобы продолжить обучение, снова войди в аккаунт.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Выйти', onPress: signOut }])}><Text style={s.muted}>Выйти из аккаунта</Text></Pressable>}
    <Pressable style={s.inline} onPress={() => Alert.alert('Сбросить учебный прогресс?', 'Пройденные темы, XP и серия будут удалены.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Сбросить', style: 'destructive', onPress: reset }])}><Text style={{ color: colors.pink, fontSize: 13 }}>Сбросить прогресс</Text></Pressable>
  </ScrollView>;
}
const s = createThemedStyles(() => ({
 content: { padding: 22, paddingBottom: 110, gap: 16 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, eyebrow: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' }, title: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 8 }, gear: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 8 }, avatar: { width: 76, height: 76, borderRadius: 25, backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.onAccent, fontSize: 33, fontWeight: '800' }, name: { color: colors.text, fontSize: 25, fontWeight: '800' }, muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 }, small: { color: colors.textMuted, fontSize: 11, lineHeight: 17 }, stats: { flexDirection: 'row', padding: 18, backgroundColor: colors.card, borderRadius: 24 }, stat: { flex: 1, gap: 8, alignItems: 'center' }, number: { color: colors.text, fontSize: 26, fontWeight: '800' }, card: { padding: 20, borderRadius: 24, backgroundColor: colors.card, gap: 16 }, heading: { color: colors.text, fontSize: 16, fontWeight: '700' }, section: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 10, letterSpacing: -0.4 }, link: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 20, backgroundColor: colors.card }, icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }, inline: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }, accent: { color: colors.purple, fontSize: 13, fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { width: '48%', flexGrow: 1, padding: 18, borderRadius: 20, backgroundColor: colors.card, gap: 8 }, metricValue: { color: colors.text, fontSize: 25, fontWeight: '800' }, achievements: { flexDirection: 'row', gap: 10 }, achievement: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 10 },
}));
