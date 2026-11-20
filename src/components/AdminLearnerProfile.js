import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { lessons } from '../data/course';
import { loadAdminProfile } from '../store/AccessContext';
import { colors, createThemedStyles, useTheme } from '../theme';
import { PrimaryButton } from './UI';

const PAGE = 12;
const lessonNames = new Map(lessons.map(lesson => [lesson.id, lesson.title]));
const roleNames = { owner: 'Владелец', admin: 'Администратор' };
const count = (value) => typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';
const percent = (value) => count(value) === '—' ? '—' : value + '%';
const yesNo = (value) => value === true ? 'Да' : value === false ? 'Нет' : '—';
const dateTime = (value) => value ? new Date(value).toLocaleString('ru-RU') : '—';
const day = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('.') : '—';

function Section({ title, rows, pageSize = rows.length, empty = 'Нет данных' }) {
  const [visible, setVisible] = useState(pageSize);
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.title}>{title}</Text>
    {!rows.length && <Text style={s.muted}>{empty}</Text>}
    {rows.slice(0, visible).map(([label, value], index) => <View key={index} style={s.row}>
      <Text style={s.label}>{label}</Text><Text style={s.value}>{value ?? '—'}</Text>
    </View>)}
    {rows.length > visible && <PrimaryButton title="Показать ещё" variant="secondary"
      onPress={() => setVisible(size => size + PAGE)} />}
  </View>;
}

function ProgressDetails({ cloud }) {
  const { summary, stats, settings, completed, lesson_results: results, journey_stages: stages, level_exam_best: exams, counts, words, activity } = cloud;
  const topics = [...new Set([...completed, ...Object.keys(results), ...Object.keys(stages)])];
  const correctResult = (correct, total) => total > 0 ? count(correct) + ' из ' + total : '—';
  return <>
    <Section title="Облачная копия" rows={[
      ['Последняя синхронизация', dateTime(cloud.updated_at)], ['Изменено на устройстве', dateTime(cloud.device_updated_at)],
    ]} />
    <Section title="Учебный профиль" rows={[
      ['Уровень английского', summary.learnerLevel], ['Дневная цель, XP', count(summary.dailyGoal)],
      ['Всего XP', count(summary.totalXP)], ['Дневной XP' + (summary.dailyDate ? ' · ' + day(summary.dailyDate) : ''), count(summary.dailyXP)],
      ['Серия, дней', count(summary.streak)], ['Последнее занятие', day(summary.lastStudyDate)],
      ['Монеты', count(summary.coins)], ['Награды', count(counts?.ownedRewards)], ['Вводный экран пройден', yesNo(summary.onboarded)],
    ]} />
    <Section title={'Прогресс по темам · пройдено ' + completed.length} pageSize={PAGE}
      rows={topics.map(id => {
        const result = results[id];
        const detail = [
          completed.includes(id) ? 'Пройдена' : 'В процессе',
          stages[id] ? 'Этапов ' + stages[id] : '',
          result?.attempts != null ? 'Попыток ' + result.attempts : '',
          result?.bestAccuracy != null ? 'Лучший результат ' + percent(result.bestAccuracy) : '',
        ].filter(Boolean).join(' · ');
        return [lessonNames.get(id) || id, detail];
      })} />
    <Section title="Результаты практики" rows={[
      ['Слова', correctResult(stats.reviewCorrect, stats.reviewTotal)],
      ['Грамматика', correctResult(stats.grammarCorrect, stats.grammarTotal)],
      ['Диктанты', correctResult(stats.dictationCorrect, stats.dictationTotal)],
      ['Истории', count(stats.storiesCompleted)], ['Диалоги', count(stats.dialoguesCompleted)],
      ['Игр сыграно', count(stats.gamesPlayed)], ['Лучший блиц', count(stats.gameBest)],
      ['Тем по временам', count(counts?.completedTenses)], ['Тем по грамматике', count(counts?.completedGrammarTracks)],
      ['Тексты', count(counts?.readingCompleted)], ['Письменные задания', count(counts?.writingCompleted)],
      ['Рабочий английский', count(counts?.workCompleted)], ['Карьерные курсы', count(counts?.careerCompleted)],
    ]} />
    <Section title="Экзамены и достижения" rows={[
      ...['A1', 'A2', 'B1', 'B2', 'C1'].map(level => ['Лучший результат ' + level, count(exams[level])]),
      ['Экзамен по временам', count(summary.tenseExamBest)], ['Экзамен C1', count(summary.c1ExamBest)],
      ['Сертификат C1', yesNo(summary.c1Certificate)], ['IELTS, лучший балл', count(summary.fullIeltsBest)],
      ['Первый шаг', yesNo(summary.totalXP > 0)], ['На огне', yesNo(summary.streak >= 3)], ['Знаток', yesNo(summary.totalXP >= 300)],
    ]} />
    <Section title="Словарь и повторение" rows={[
      ['Слова в статистике', count(counts?.reviewStats)], ['Свои слова', count(counts?.customWords)],
      ['Задания в очереди', count(counts?.reviewQueue)], ['Ошибки для разбора', count(counts?.mistakes)],
      ['Записи в тетради', count(counts?.notebook)], ['Избранное', count(counts?.favorites)],
    ]} />
    <Section title="Свои слова" pageSize={PAGE} rows={words.map(word => [word.english, word.russian])} />
    <Section title="Календарь занятий" pageSize={PAGE} rows={Object.entries(activity)
      .sort(([first], [second]) => second.localeCompare(first)).map(([date, total]) => [day(date), count(total)])} />
    <Section title="Настройки обучения" rows={[
      ['Вариант озвучки', settings.accent], ['Скорость речи', count(settings.speechRate)],
      ['Размер занятия', count(settings.lessonSize)], ['Строгая проверка', yesNo(settings.strictChecking)],
      ['Режим испытания', yesNo(settings.challengeMode)], ['Крупный текст', yesNo(settings.largeText)],
      ['Меньше анимаций', yesNo(settings.reduceMotion)], ['Вибрация', yesNo(settings.haptics)], ['Голосовая обратная связь', yesNo(settings.voiceFeedback)],
    ]} />
  </>;
}

export default function AdminLearnerProfile({ userId }) {
  useTheme();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(null);
  useEffect(() => {
    const request = new AbortController();
    setState(null);
    loadAdminProfile(userId, request.signal).then(data => {
      if (!request.signal.aborted) setState({ data });
    }).catch(reason => {
      if (!request.signal.aborted) setState({ error: reason.message });
    });
    return () => request.abort();
  }, [userId, attempt]);

  if (!state) return <ActivityIndicator accessibilityLabel="Загрузка профиля" color={colors.purple} />;
  if (state.error || !state.data) return <View style={s.card}>
    <Text accessibilityLiveRegion="polite" style={s.label}>{state.error === 'admin_required'
      ? 'Права администратора больше не действуют.' : 'Не удалось загрузить профиль.'}</Text>
    <PrimaryButton title="Повторить загрузку" onPress={() => setAttempt(value => value + 1)} />
  </View>;

  const { account, cloud } = state.data;
  const license = account.licensed
    ? (account.expires_at ? 'До ' + dateTime(account.expires_at) : 'Бессрочный')
    : account.revoked_at ? 'Лицензия отозвана' : account.expires_at ? 'Срок истёк' : 'Нет доступа';
  return <>
    <Section title="Аккаунт" rows={[
      ['Имя', account.name], ['Почта', account.email], ['ID аккаунта', account.id],
      ['Зарегистрирован', dateTime(account.created_at)], ['Почта подтверждена', account.email_confirmed_at ? 'Да · ' + dateTime(account.email_confirmed_at) : 'Нет'],
      ['Последний вход', dateTime(account.last_sign_in_at)], ['Роль', roleNames[account.role] || 'Пользователь'],
      ['Доступ', account.role ? 'По роли' : account.licensed ? 'По лицензии' : 'Нет доступа'],
      ['Лицензия', license], ...(account.revoked_at ? [['Лицензия отозвана', dateTime(account.revoked_at)]] : []),
    ]} />
    <PrimaryButton title="Обновить профиль" variant="secondary" onPress={() => setAttempt(value => value + 1)} />
    {cloud ? <ProgressDetails cloud={cloud} /> : <Text style={s.muted}>Учебный прогресс ещё не синхронизирован.</Text>}
  </>;
}

const s = createThemedStyles(() => ({
  card: { padding: 16, gap: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  title: { color: colors.text, fontWeight: '800', fontSize: 17 },
  row: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.textMuted, fontSize: 14 },
}));
