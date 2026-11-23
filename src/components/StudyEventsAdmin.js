import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { groupDueDate, groupTopicName, groupTopics } from '../utils/groupStudy';
import { eventDate, eventDay } from '../utils/studyEvents';
import { manageStudyEvents } from '../services/studyEvents';
import { PrimaryButton } from './UI';
import { colors, createThemedStyles, useTheme } from '../theme';

const PAGE = 30;
const errors = {
  invalid_event_date: 'Укажи сегодняшнюю или будущую дату в формате ГГГГ-ММ-ДД.',
  event_already_exists: 'Событие с таким названием и датой уже опубликовано.',
  invalid_event_topics: 'Выбери от 1 до 14 тем.',
  admin_required: 'Права администратора больше не действуют.',
};

function Field({ label, ...props }) {
  return <View style={s.field}>
    <Text style={s.title}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={s.input} {...props} />
  </View>;
}

export default function StudyEventsAdmin() {
  useTheme();
  const [events, setEvents] = useState([]);
  const [offset, setOffset] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsOn, setStartsOn] = useState(() => eventDate(Date.now()));
  const [topics, setTopics] = useState([]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = async task => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setNotice('');
    try { await task(); }
    catch (error) { setNotice(errors[error.message] || 'Не удалось обновить события. Попробуй ещё раз.'); }
    finally { running.current = false; setBusy(false); }
  };
  const load = async page => {
    setEvents(await manageStudyEvents('list', { offset: page }));
    setOffset(page);
  };
  useEffect(() => { run(() => load(0)); }, []);
  const parsedDate = Date.parse(startsOn);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && Number.isFinite(parsedDate)
    && eventDate(parsedDate) === startsOn && startsOn >= eventDate(Date.now());
  const matches = groupTopics.filter(topic => (topic.title + ' ' + topic.level).toLowerCase().includes(query.trim().toLowerCase()));
  const publish = () => run(async () => {
    await manageStudyEvents('publish', { name: name.trim(), description: description.trim(), starts_on: startsOn, topics });
    setName('');
    setDescription('');
    setSearching(false);
    setTopics([]);
    await load(0);
    setNotice('Событие опубликовано.');
  });
  const cancel = event => Alert.alert('Отменить событие?', event.name, [
    { text: 'Назад', style: 'cancel' }, { text: 'Отменить событие', style: 'destructive', onPress: () => run(async () => {
      await manageStudyEvents('cancel', { event_id: event.id });
      await load(offset);
    }) },
  ]);

  return <>
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    {busy && <ActivityIndicator color={colors.purple} />}
    <View style={s.card}>
      <Text style={s.heading}>Новое событие</Text>
      <Field label="Название события" value={name} onChangeText={setName} maxLength={80} editable={!busy} />
      <Field label="Описание" value={description} onChangeText={setDescription} maxLength={280} editable={!busy} />
      <Field label="Дата начала (ГГГГ-ММ-ДД)" value={startsOn} onChangeText={setStartsOn} autoCorrect={false} maxLength={10} editable={!busy} />
      <Text style={s.muted}>Задания открываются по одному в день в 00:00 UTC.</Text>
      {topics.map((id, index) => <View key={index} style={s.row}>
        <Text style={s.day}>День {index + 1} · {groupTopicName(id)}</Text>
        <Pressable style={s.remove} accessibilityRole="button" accessibilityLabel={'Убрать день ' + (index + 1)}
          disabled={busy} onPress={() => setTopics(items => items.filter((_, day) => day !== index))}>
          <Text style={s.accent}>Убрать</Text>
        </Pressable>
      </View>)}
      {topics.length < 14 && <PrimaryButton title="Добавить тему на день" variant="secondary" disabled={busy}
        onPress={() => { setQuery(''); setSearching(value => !value); }} />}
      {searching && <>
        <Field label="Поиск темы события" value={query} onChangeText={setQuery} autoCorrect={false} />
        {matches.slice(0, 7).map(topic => <PrimaryButton key={topic.id} title={topic.level + ' · ' + topic.title} variant="secondary"
          onPress={() => { setTopics(items => [...items, topic.id]); setSearching(false); }} />)}
        {matches.length > 7 && <Text style={s.muted}>Введи название, чтобы найти другие темы.</Text>}
        {!matches.length && <Text style={s.muted}>Темы не найдены.</Text>}
      </>}
      <PrimaryButton title="Опубликовать для всех" disabled={busy || name.trim().length < 2 || !validDate || !topics.length} onPress={publish} />
    </View>
    <Text style={s.heading}>Опубликованные события</Text>
    {!busy && !events.length && <Text style={s.muted}>Событий пока нет.</Text>}
    {events.map(event => {
      const day = eventDay(event);
      const status = event.cancelled_at ? 'Отменено' : day < 0 ? 'Запланировано' : day >= event.topics.length ? 'Завершено' : 'Идёт';
      return <View key={event.id} style={s.card}>
        <Text style={s.title}>{event.name}</Text>
        <Text style={s.muted}>{status} · {groupDueDate(event.starts_on)} — {groupDueDate(event.ends_on)}</Text>
        <Text style={s.muted}>{event.topics.map(id => groupTopicName(id) || id).join(' · ')}</Text>
        {!event.cancelled_at && <PrimaryButton title="Отменить событие" variant="secondary" disabled={busy} onPress={() => cancel(event)} />}
      </View>;
    })}
    {offset > 0 && <PrimaryButton title="Предыдущая страница" variant="secondary" disabled={busy} onPress={() => run(() => load(offset - PAGE))} />}
    {events.length === PAGE && <PrimaryButton title="Следующая страница" variant="secondary" disabled={busy} onPress={() => run(() => load(offset + PAGE))} />}
    <PrimaryButton title="Обновить события" variant="secondary" disabled={busy} onPress={() => run(() => load(offset))} />
  </>;
}

const s = createThemedStyles(() => ({
  card: { gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.card },
  field: { gap: 6 },
  input: { minHeight: 48, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.background, borderColor: colors.buttonBorder, borderWidth: 1, borderRadius: 12 },
  heading: { color: colors.text, fontWeight: '800', fontSize: 20 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  day: { flex: 1, color: colors.text, fontSize: 14 },
  remove: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  accent: { color: colors.purple, fontWeight: '700' },
  notice: { padding: 12, color: colors.text, backgroundColor: colors.accentSoft, borderRadius: 12 },
}));
