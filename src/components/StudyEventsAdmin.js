import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { groupDueDate, groupTopicName, groupTopics } from '../utils/groupStudy';
import { eventDate, eventDay, eventFormats, eventPracticeDeck } from '../utils/studyEvents';
import { manageStudyEvents } from '../services/studyEvents';
import PracticeScreen from '../screens/PracticeScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [formats, setFormats] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [format, setFormat] = useState('mixed');
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
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
    catch (error) { setNotice(errors[error.code === '23505' ? 'event_already_exists' : error.message] || 'Не удалось обновить события. Попробуй ещё раз.'); }
    finally { running.current = false; setBusy(false); }
  };
  const load = async page => {
    setEvents(await manageStudyEvents('list', { offset: page }));
    setOffset(page);
  };
  useEffect(() => { run(() => load(0)); }, []);
  const parsedDate = Date.parse(startsOn);
  const validInputDate = /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && Number.isFinite(parsedDate)
    && eventDate(parsedDate) === startsOn;
  const validDate = validInputDate && startsOn >= eventDate(Date.now());
  const matches = groupTopics.filter(topic => (topic.title + ' ' + topic.level).toLowerCase().includes(query.trim().toLowerCase()));
  const payload = () => ({ name: name.trim(), description: description.trim(), starts_on: startsOn, topics, formats,
    ...(draftId && { event_id: draftId }) });
  const saveDraft = () => run(async () => {
    const draft = await manageStudyEvents('save_draft', payload());
    setDraftId(draft.id);
    await load(0);
    setNotice('Черновик сохранён.');
  });
  const editDraft = event => {
    setDraftId(event.id);
    setName(event.name);
    setDescription(event.description);
    setStartsOn(event.starts_on);
    setTopics(event.topics);
    setFormats(event.formats || event.topics.map(() => 'mixed'));
    setSearching(false);
    setNotice('');
  };
  const chooseDay = index => {
    setEditing(index);
    setFormat(formats[index] || 'mixed');
    setQuery('');
    setSearching(true);
  };
  const reset = () => {
    setDraftId(null);
    setFormats([]);
    setName('');
    setDescription('');
    setStartsOn(eventDate(Date.now()));
    setSearching(false);
    setTopics([]);
  };
  const publish = () => run(async () => {
    await manageStudyEvents('publish', payload());
    reset();
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
    {!!preview && <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPreview(null)}>
      <SafeAreaView style={s.preview}>
        <PracticeScreen title={'Предпросмотр · ' + groupTopicName(preview.topic)} preview
          presetDeck={eventPracticeDeck(preview.topic, preview.format)} onClose={() => setPreview(null)} />
      </SafeAreaView>
    </Modal>}
    {report ? <EventReport event={report.event} data={report.data} onClose={() => setReport(null)} /> : <>
    <View style={s.card}>
      <Text style={s.heading}>{draftId ? 'Редактирование черновика' : 'Новое событие'}</Text>
      {!!draftId && <PrimaryButton title="Начать новое событие" variant="secondary" disabled={busy} onPress={reset} />}
      <Field label="Название события" value={name} onChangeText={setName} maxLength={80} editable={!busy} />
      <Field label="Описание" value={description} onChangeText={setDescription} maxLength={280} editable={!busy} />
      <Field label="Дата начала (ГГГГ-ММ-ДД)" value={startsOn} onChangeText={setStartsOn} autoCorrect={false} maxLength={10} editable={!busy} />
      <Text style={s.muted}>Задания открываются по одному в день в 00:00 UTC.</Text>
      {topics.map((id, index) => <View key={index} style={s.dayCard}>
        <View style={s.row}>
          <Text style={s.day}>День {index + 1} · {groupTopicName(id) || id} · {eventFormats[formats[index]] || eventFormats.mixed}</Text>
          <Pressable style={s.remove} accessibilityRole="button" accessibilityLabel={'Убрать день ' + (index + 1)}
            disabled={busy} onPress={() => {
              setTopics(items => items.filter((_, day) => day !== index));
              setFormats(items => items.filter((_, day) => day !== index));
              setSearching(false);
            }}><Text style={s.accent}>Убрать</Text></Pressable>
        </View>
        <PrimaryButton title={'Изменить день ' + (index + 1)} variant="secondary" disabled={busy} onPress={() => chooseDay(index)} />
        <PrimaryButton title={'Предпросмотр дня ' + (index + 1)} variant="secondary" disabled={!groupTopicName(id)}
          onPress={() => setPreview({ topic: id, format: formats[index] })} />
      </View>)}
      {topics.length < 14 && <PrimaryButton title="Добавить тему на день" variant="secondary" disabled={busy}
        onPress={() => chooseDay(topics.length)} />}
      {searching && <>
        <Text style={s.title}>Формат дня</Text>
        <View style={s.formats}>{Object.entries(eventFormats).map(([id, title]) =>
          <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: format === id }}
            onPress={() => setFormat(id)} style={[s.format, format === id && s.selected]}>
            <Text style={s.day}>{title}</Text>
          </Pressable>)}</View>
        <Field label="Поиск темы события" value={query} onChangeText={setQuery} autoCorrect={false} />
        {matches.slice(0, 7).map(topic => <PrimaryButton key={topic.id} title={topic.level + ' · ' + topic.title} variant="secondary"
          onPress={() => {
            setTopics(items => [...items.slice(0, editing), topic.id, ...items.slice(editing + 1)]);
            setFormats(items => [...items.slice(0, editing), format, ...items.slice(editing + 1)]);
            setSearching(false);
          }} />)}
        {matches.length > 7 && <Text style={s.muted}>Введи название, чтобы найти другие темы.</Text>}
        {!matches.length && <Text style={s.muted}>Темы не найдены.</Text>}
      </>}
      <PrimaryButton title="Сохранить черновик" variant="secondary" disabled={busy || !validInputDate} onPress={saveDraft} />
      <PrimaryButton title="Опубликовать для всех" disabled={busy || name.trim().length < 2 || !validDate || !topics.length} onPress={publish} />
    </View>
    <Text style={s.heading}>События и черновики</Text>
    {!busy && !events.length && <Text style={s.muted}>Событий пока нет.</Text>}
    {events.map(event => {
      const day = eventDay(event);
      const status = event.cancelled_at ? 'Отменено' : event.draft ? 'Черновик' : day < 0 ? 'Запланировано' : day >= event.topics.length ? 'Завершено' : 'Идёт';
      return <View key={event.id} style={s.card}>
        <Text style={s.title}>{event.name || 'Без названия'}</Text>
        <Text style={s.muted}>{status} · {groupDueDate(event.starts_on)}{event.topics.length ? ' — ' + groupDueDate(event.ends_on) : ''}</Text>
        <Text style={s.muted}>{event.topics.map(id => groupTopicName(id) || id).join(' · ')}</Text>
        {event.draft && !event.cancelled_at && <PrimaryButton title="Открыть черновик" variant="secondary" disabled={busy}
          onPress={() => editDraft(event)} />}
        {!event.draft && <PrimaryButton title="Отчёт о событии" variant="secondary" disabled={busy} onPress={() => run(async () => {
          const data = await manageStudyEvents('report', { event_id: event.id });
          setReport({ event, data });
        })} />}
        {!event.cancelled_at && <PrimaryButton title="Отменить событие" variant="secondary" disabled={busy} onPress={() => cancel(event)} />}
      </View>;
    })}
    {offset > 0 && <PrimaryButton title="Предыдущая страница" variant="secondary" disabled={busy} onPress={() => run(() => load(offset - PAGE))} />}
    {events.length === PAGE && <PrimaryButton title="Следующая страница" variant="secondary" disabled={busy} onPress={() => run(() => load(offset + PAGE))} />}
    <PrimaryButton title="Обновить события" variant="secondary" disabled={busy} onPress={() => run(() => load(offset))} />
    </>}
  </>;
}

function EventReport({ event, data, onClose }) {
  let fewest = null;
  const current = eventDay(event);
  for (const day of data.days) {
    if (day.index <= current && (!fewest || day.completed < fewest.completed)) fewest = day;
  }
  return <>
    <PrimaryButton title="Назад к событиям" variant="secondary" onPress={onClose} />
    <Text style={s.heading}>{event.name}</Text>
    <Text style={s.muted}>Участвуют {data.joined} · начали {data.started} · завершили {data.finished}</Text>
    <Text style={s.muted}>Результаты из облачной синхронизации. Ошибки считаются по первой завершённой попытке.</Text>
    {!!fewest && data.started > 0 && <Text style={s.muted}>Меньше всего завершений · день {fewest.index + 1} · {fewest.completed}</Text>}
    {data.days.map(day => {
      const deck = eventPracticeDeck(event.topics[day.index], event.formats?.[day.index]);
      return <View key={day.index} style={s.card}>
        <Text style={s.title}>День {day.index + 1} · {groupTopicName(event.topics[day.index]) || event.topics[day.index]}</Text>
        <Text style={s.muted}>Завершили {day.completed}</Text>
        {day.items.map(item => {
          const question = deck.find(exercise => exercise.id === item.id);
          return question ? <Text key={item.id} style={s.muted}>
            {question.prompt} · ошибок {item.errors} из {item.total}
          </Text> : null;
        })}
      </View>;
    })}
  </>;
}

const s = createThemedStyles(() => ({
  preview: { flex: 1, backgroundColor: colors.background },
  dayCard: { gap: 8, paddingTop: 6, borderTopWidth: 1, borderColor: colors.border },
  formats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  format: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.buttonBorder, borderRadius: 12, paddingHorizontal: 10 },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.purple },
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
