import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupDueDate, groupTopicName } from '../utils/groupStudy';
import { canOpenEventDay, eventDay, eventFormats } from '../utils/studyEvents';
import { eventPersonalResult } from '../utils/studyEventReview';
import { useProgressActions, useProgressSelector } from '../store/ProgressContext';
import { PrimaryButton, ProgressBar } from '../components/UI';
import { colors, createThemedStyles, useTheme } from '../theme';

export default function StudyEventScreen({ event, onOpen, onReview, onClose, closeTitle = 'К экрану «Сегодня»', reminders }) {
  useTheme();
  const { joinEvent } = useProgressActions();
  const [savingReminder, setSavingReminder] = useState(false);
  const [message, setMessage] = useState('');
  const result = useProgressSelector(state => state.progress.studyEventResults?.[event.id]);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  const summary = React.useMemo(() => eventPersonalResult(event, result), [event, result]);
  const completed = summary.days.filter(day => day.completed).length;
  const scored = summary.days.filter(day => day.total);
  const missed = scored.reduce((total, day) => total + day.total - day.correct, 0);
  const ended = eventDay(event, now) >= event.topics.length;
  return <ScrollView contentContainerStyle={s.content}>
    <PrimaryButton title={closeTitle} icon="chevron-back" variant="secondary" onPress={onClose} />
    <Text accessibilityRole="header" style={s.heading}>{event.name}</Text>
    {!!event.description && <Text style={s.text}>{event.description}</Text>}
    <Text style={s.text}>{groupDueDate(event.starts_on)} — {groupDueDate(event.ends_on)}</Text>
    <Text style={s.text}>Выполнено {completed} из {event.topics.length}</Text>
    <ProgressBar value={completed / event.topics.length} />
    {!result && !ended && <PrimaryButton title="Участвовать" onPress={() => joinEvent(event)} />}
    {!!result && !ended && !result.badgeAt && <PrimaryButton variant="secondary"
      title={reminders?.enabled[event.id] ? 'Выключить напоминания' : 'Включить напоминания'}
      disabled={savingReminder || !reminders?.loaded} onPress={async () => {
        setSavingReminder(true);
        setMessage('');
        try { if (!await reminders.toggle(event.id)) setMessage('Разреши уведомления для LingoSpark на iPhone.'); }
        catch { setMessage('Не удалось сохранить настройку уведомлений.'); }
        finally { setSavingReminder(false); }
      }} />}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.text}>{message}</Text>}
    {result?.badgeAt ? <View style={s.badge}><Ionicons name="ribbon-outline" size={24} color={colors.mint} />
      <Text style={s.text}>Значок получен и сохранён в профиле.</Text></View>
      : <Text style={s.text}>{ended ? 'Событие завершилось.' : 'Новый день открывается в 00:00 UTC. Выполни все задания до окончания события, чтобы получить значок.'}</Text>}
    {completed > 0 && <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>Мой итог</Text>
      {scored.length > 0 && <Text style={s.text}>Верных ответов {scored.reduce((total, day) => total + day.correct, 0)} из {scored.reduce((total, day) => total + day.total, 0)}</Text>}
      {summary.focus && <Text style={s.text}>Навык для повторения — {summary.focus.toLocaleLowerCase('ru')}</Text>}
      {summary.deck.length > 0 && <PrimaryButton title="Повторить мои ошибки" onPress={() => onReview(summary.deck)} />}
      {missed > 0 && summary.deck.length === 0 && <Text style={s.text}>Для этих ошибок пока нет новых заданий.</Text>}
      {missed === 0 && scored.length > 0 && <Text style={s.text}>В сохранённых ответах ошибок нет.</Text>}
    </View>}
    {event.topics.map((topic, index) => {
      const title = groupTopicName(topic);
      const open = !!title && canOpenEventDay(event, index, now);
      const { completed: done, correct, total } = summary.days[index];
      return <View key={index} style={s.card}>
        <Text style={s.text}>День {index + 1} · {eventFormats[event.formats?.[index]] || eventFormats.mixed}</Text>
        <Text style={s.title}>{title || 'Тема доступна в новой версии'}</Text>
        {done && <Text style={s.text}>{total ? `Верно ${correct} из ${total}` : 'Выполнено · оценка недоступна'}</Text>}
        {open ? <PrimaryButton title={done ? 'Повторить' : 'Начать задание'}
          variant="secondary" onPress={() => { if (canOpenEventDay(event, index)) onOpen(index); }} />
          : !done && <Text style={s.text}>{ended ? 'Событие завершилось' : title ? 'Ещё не открыто' : 'Обнови приложение'}</Text>}
      </View>;
    })}
  </ScrollView>;
}

const s = createThemedStyles(() => ({
  content: { padding: 22, paddingBottom: 45, gap: 14 },
  heading: { fontSize: 27, color: colors.text, fontWeight: '900' },
  title: { fontSize: 17, color: colors.text, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  card: { gap: 8, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.successSoft },
}));
