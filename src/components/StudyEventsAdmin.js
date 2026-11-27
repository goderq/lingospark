import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { groupDueDate, groupTopicName, groupTopics } from '../utils/groupStudy';
import { eventDate, eventDay, eventDayDeck, eventFormats } from '../utils/studyEvents';
import { eventAiLevels, eventExerciseRequest, eventPlanRequest, validEventExercisePair } from '../utils/studyEventAi';
import { manageStudyEvents } from '../services/studyEvents';
import { useAuth } from '../store/AuthContext';
import PracticeScreen from '../screens/PracticeScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './UI';
import { colors, createThemedStyles, useTheme } from '../theme';

const PAGE = 30;
const errors = {
  invalid_event_date: 'Укажи сегодняшнюю или будущую дату в формате ГГГГ-ММ-ДД.',
  event_already_exists: 'Событие с таким названием и датой уже опубликовано.',
  invalid_event_topics: 'Выбери от 1 до 14 тем.',
  invalid_event_exercises: 'Проверь задания и варианты для повторения. Перед публикацией подтверди правильные ответы.',
  admin_required: 'Права администратора больше не действуют.',
};

function Field({ label, ...props }) {
  return <View style={s.field}>
    <Text style={s.title}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={s.input} {...props} />
  </View>;
}

export default function StudyEventsAdmin({ localOnly = false }) {
  useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [offset, setOffset] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsOn, setStartsOn] = useState(() => eventDate(Date.now()));
  const [topics, setTopics] = useState([]);
  const [formats, setFormats] = useState([]);
  const [customDays, setCustomDays] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [format, setFormat] = useState('mixed');
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [brief, setBrief] = useState('');
  const [level, setLevel] = useState('A2');
  const [duration, setDuration] = useState('5');
  const [suggestion, setSuggestion] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [checkingDay, setCheckingDay] = useState(null);
  const aiRequest = useRef(null);
  const working = busy || Boolean(generating);
  const running = useRef(false);
  const run = async task => {
    if (running.current || aiRequest.current) return;
    running.current = true;
    setBusy(true);
    setNotice('');
    try { await task(); }
    catch (error) { setNotice(errors[error.code === '23505' ? 'event_already_exists' : error.message] || 'Не удалось обновить события. Попробуй ещё раз.'); }
    finally { running.current = false; setBusy(false); }
  };
  const load = async page => {
    setEvents(await manageStudyEvents('list', { offset: page, include_custom: true }));
    setOffset(page);
  };
  useEffect(() => { if (!localOnly) run(() => load(0)); }, [localOnly]);
  useEffect(() => () => aiRequest.current?.abort(), []);
  const parsedDate = Date.parse(startsOn);
  const validInputDate = /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && Number.isFinite(parsedDate)
    && eventDate(parsedDate) === startsOn;
  const validDate = validInputDate && startsOn >= eventDate(Date.now());
  const matches = groupTopics.filter(topic => (topic.title + ' ' + topic.level).toLowerCase().includes(query.trim().toLowerCase()));
  const hasCustom = customDays.some(Boolean);
  const invalidCustom = customDays.some(pair => pair && !validEventExercisePair(pair));
  const unapproved = customDays.some(pair => pair && !pair.approved);
  const draftKey = user?.id && `@lingospark/event-admin-draft/${user.id}`;
  const payload = () => ({ name: name.trim(), description: description.trim(), starts_on: startsOn, topics, formats,
    custom_days: hasCustom ? topics.map((_, index) => customDays[index] || null) : null,
    ...(draftId && { event_id: draftId }) });
  const saveDraft = () => run(async () => {
    const draft = await manageStudyEvents('save_draft', payload());
    setDraftId(draft.id);
    await load(0);
    setNotice('Черновик сохранён.');
  });
  const editDraft = event => {
    setDraftId(event.id || event.event_id || null);
    setName(event.name);
    setDescription(event.description);
    setStartsOn(event.starts_on);
    setTopics(event.topics);
    setFormats(event.formats || event.topics.map(() => 'mixed'));
    setCustomDays(event.custom_days || []);
    setSearching(false);
    setSuggestion(null);
    setCheckingDay(null);
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
    setCustomDays([]);
    setCheckingDay(null);
    setSuggestion(null);
  };
  const saveOnDevice = () => run(async () => {
    await AsyncStorage.setItem(draftKey, JSON.stringify(payload()));
    setNotice('Черновик сохранён на этом устройстве.');
  });
  const openFromDevice = () => run(async () => {
    const saved = await AsyncStorage.getItem(draftKey);
    if (!saved) { setNotice('На этом устройстве пока нет черновика.'); return; }
    editDraft(JSON.parse(saved));
    setNotice('Черновик открыт с устройства.');
  });
  const updateCustom = (index, pair) => setCustomDays(previous => topics.map((_, day) => day === index ? pair : previous[day] || null));
  const chooseTopic = (index, topic, nextFormat) => {
    if (topic !== topics[index] || nextFormat !== formats[index]) updateCustom(index, null);
    setTopics(items => [...items.slice(0, index), topic, ...items.slice(index + 1)]);
    setFormats(items => [...items.slice(0, index), nextFormat, ...items.slice(index + 1)]);
    setSearching(false);
    setCheckingDay(null);
    setSuggestion(null);
  };
  const generate = async (kind, index) => {
    if (running.current || aiRequest.current) return;
    const controller = new AbortController();
    aiRequest.current = controller;
    setGenerating({ kind, index });
    setSuggestion(null);
    setNotice('');
    try {
      const request = kind === 'exercise' ? eventExerciseRequest(topics[index], brief)
        : eventPlanRequest({ brief: brief.trim() || [name, description, groupTopicName(topics[index])].filter(Boolean).join('. ').slice(0, 400),
          level: kind === 'day' ? groupTopics.find(topic => topic.id === topics[index])?.level : level,
          count: kind === 'day' ? 1 : Number(duration),
          ...(kind === 'day' && { exclude: { index, topic: topics[index], format: formats[index] || 'mixed' },
            previous: topics.map(groupTopicName).join(', ').slice(0, 350) }) });
      const { generateStudyEvent } = await import('../services/localAi');
      const value = await generateStudyEvent(request, controller.signal);
      if (!controller.signal.aborted) setSuggestion({ kind, index, value });
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error.message || 'Не удалось подготовить вариант события.');
    } finally {
      aiRequest.current = null;
      if (controller.signal.aborted) setNotice('Генерация остановлена.');
      setGenerating(null);
    }
  };
  const applySuggestion = () => {
    const { kind, index, value } = suggestion;
    if (kind === 'plan') editDraft({ ...value, starts_on: startsOn, topics: value.days.map(day => day.topic), formats: value.days.map(day => day.format) });
    if (kind === 'day') chooseTopic(index, value.topic, value.format);
    if (kind === 'exercise') { updateCustom(index, value); setCheckingDay(index); }
    setSuggestion(null);
  };
  const aiResult = (index) => <>
    {generating && generating.index === index && <View style={s.dayCard}>
      <Text accessibilityLiveRegion="polite" style={s.muted}>Локальная модель готовит вариант…</Text>
      <PrimaryButton title="Остановить генерацию" variant="secondary" onPress={() => aiRequest.current?.abort()} />
    </View>}
    {suggestion && suggestion.index === index && <View style={s.dayCard}>
      {suggestion.kind === 'plan' ? <>
        <Text style={s.title}>{suggestion.value.name}</Text>
        <Text style={s.muted}>{suggestion.value.description}</Text>
        {suggestion.value.days.map((day, i) => <Text key={i} style={s.muted}>{i + 1}. {groupTopicName(day.topic)} · {eventFormats[day.format]}</Text>)}
      </> : <Text style={s.title}>{suggestion.kind === 'day'
        ? `${groupTopicName(suggestion.value.topic)} · ${eventFormats[suggestion.value.format]}`
        : suggestion.value.question.prompt}</Text>}
      {suggestion.kind === 'day' && customDays[index] && <Text style={s.muted}>При замене дня собственное упражнение будет убрано из черновика.</Text>}
      <PrimaryButton title={suggestion.kind === 'plan' ? 'Открыть план в редакторе' : suggestion.kind === 'day' ? 'Применить вариант дня' : 'Открыть проверку упражнения'}
        disabled={working} onPress={applySuggestion} />
      <PrimaryButton title="Отбросить предложение" variant="secondary" disabled={working} onPress={() => setSuggestion(null)} />
    </View>}
  </>;
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
    {localOnly && <Text style={s.muted}>Офлайн можно подготовить событие и сохранить его на устройстве. Для публикации подключись к интернету.</Text>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    {busy && <ActivityIndicator color={colors.purple} />}
    {!!preview && <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPreview(null)}>
      <SafeAreaView style={s.preview}>
        <PracticeScreen title={preview.title} preview presetDeck={preview.deck} onClose={() => setPreview(null)} />
      </SafeAreaView>
    </Modal>}
    {report ? <EventReport event={report.event} data={report.data} onClose={() => setReport(null)} /> : <>
    <View style={s.card}>
      <Text style={s.heading}>{draftId ? 'Редактирование черновика' : 'Новое событие'}</Text>
      {!!draftId && <PrimaryButton title="Начать новое событие" variant="secondary" disabled={working} onPress={reset} />}
      <PrimaryButton title={showAi ? 'Скрыть помощника' : 'Создать событие с ИИ'} variant="secondary" disabled={working} onPress={() => setShowAi(value => !value)} />
      {showAi && <View style={s.dayCard}>
        <Field label="Идея события" value={brief} onChangeText={setBrief} maxLength={400} editable={!working}
          placeholder="Английский для поездок и общения в отеле" multiline />
        <View style={s.formats}>{eventAiLevels.map(id => <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: level === id }}
          disabled={working} onPress={() => setLevel(id)} style={[s.format, level === id && s.selected]}><Text style={s.day}>{id}</Text></Pressable>)}</View>
        <Field label="Количество дней (1–14)" value={duration} onChangeText={setDuration} maxLength={2} editable={!working} keyboardType="number-pad" />
        <PrimaryButton title="Сгенерировать план" disabled={working || brief.trim().length < 3 || !/^(?:[1-9]|1[0-4])$/.test(duration)} onPress={() => generate('plan')} />
        <Text style={s.muted}>План и упражнения создаются на устройстве с помощью скачанной модели.</Text>
        <Text style={s.muted}>Свои упражнения можно добавить в дни смешанной практики.</Text>
      </View>}
      {aiResult()}
      <Field label="Название события" value={name} onChangeText={setName} maxLength={80} editable={!working} />
      <Field label="Описание" value={description} onChangeText={setDescription} maxLength={280} editable={!working} />
      <Field label="Дата начала (ГГГГ-ММ-ДД)" value={startsOn} onChangeText={setStartsOn} autoCorrect={false} maxLength={10} editable={!working} />
      <Text style={s.muted}>Задания открываются по одному в день в 00:00 UTC.</Text>
      {topics.map((id, index) => <View key={index} style={s.dayCard}>
        <View style={s.row}>
          <Text style={s.day}>День {index + 1} · {groupTopicName(id) || id} · {eventFormats[formats[index]] || eventFormats.mixed}</Text>
          <Pressable style={s.remove} accessibilityRole="button" accessibilityLabel={'Убрать день ' + (index + 1)}
            disabled={working} onPress={() => {
              setTopics(items => items.filter((_, day) => day !== index));
              setFormats(items => items.filter((_, day) => day !== index));
              setCustomDays(items => items.filter((_, day) => day !== index));
              setCheckingDay(null);
              setSuggestion(null);
              setSearching(false);
            }}><Text style={s.accent}>Убрать</Text></Pressable>
        </View>
        <PrimaryButton title={'Изменить день ' + (index + 1)} variant="secondary" disabled={working} onPress={() => chooseDay(index)} />
        <PrimaryButton title={'Предпросмотр дня ' + (index + 1)} variant="secondary" disabled={working || !groupTopicName(id)}
          onPress={() => setPreview({ title: 'Предпросмотр · ' + groupTopicName(id), deck: eventDayDeck({ topics, formats, custom_days: customDays }, index, true) })} />
        {showAi && <PrimaryButton title={'Предложить другой вариант дня ' + (index + 1)} variant="secondary" disabled={working} onPress={() => generate('day', index)} />}
        {showAi && formats[index] === 'mixed' && <PrimaryButton title={'Создать упражнение для дня ' + (index + 1)} variant="secondary" disabled={working} onPress={() => generate('exercise', index)} />}
        {aiResult(index)}
        {!!customDays[index] && <>
          <Text style={s.muted}>{customDays[index].approved ? 'Собственное упражнение проверено' : 'Собственное упражнение ждёт проверки'}</Text>
          <PrimaryButton title={checkingDay === index ? 'Свернуть проверку' : 'Проверить упражнение'} variant="secondary" disabled={working}
            onPress={() => setCheckingDay(checkingDay === index ? null : index)} />
          {checkingDay === index && <EventExerciseEditor pair={customDays[index]} disabled={working}
            onChange={pair => updateCustom(index, pair)} onRemove={() => { updateCustom(index, null); setCheckingDay(null); }}
            onPreview={() => {
              const exercise = eventDayDeck({ topics, formats, custom_days: customDays }, index, true).at(-1)?.reviewVariant;
              if (exercise) setPreview({ title: 'Предпросмотр повтора', deck: [{ ...exercise, id: 'preview-event-review' }] });
            }} />}
        </>}
      </View>)}
      {topics.length < 14 && <PrimaryButton title="Добавить тему на день" variant="secondary" disabled={working}
        onPress={() => chooseDay(topics.length)} />}
      {searching && <>
        <Text style={s.title}>Формат дня</Text>
        <View style={s.formats}>{Object.entries(eventFormats).map(([id, title]) =>
          <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: format === id }}
            disabled={working} onPress={() => setFormat(id)} style={[s.format, format === id && s.selected]}>
            <Text style={s.day}>{title}</Text>
          </Pressable>)}</View>
        <Field label="Поиск темы события" value={query} onChangeText={setQuery} autoCorrect={false} editable={!working} />
        {matches.slice(0, 7).map(topic => <PrimaryButton key={topic.id} title={topic.level + ' · ' + topic.title} variant="secondary"
          disabled={working} onPress={() => chooseTopic(editing, topic.id, format)} />)}
        {matches.length > 7 && <Text style={s.muted}>Введи название, чтобы найти другие темы.</Text>}
        {!matches.length && <Text style={s.muted}>Темы не найдены.</Text>}
      </>}
      {!!draftKey && <>
        <PrimaryButton title="Сохранить на устройстве" variant="secondary" disabled={working} onPress={saveOnDevice} />
        <PrimaryButton title="Открыть с устройства" variant="secondary" disabled={working} onPress={openFromDevice} />
      </>}
      {!localOnly && <PrimaryButton title="Сохранить черновик" variant="secondary" disabled={working || !validInputDate || invalidCustom} onPress={saveDraft} />}
      {unapproved && <Text style={s.muted}>Подтверди собственные упражнения, чтобы опубликовать событие.</Text>}
      {!localOnly && <PrimaryButton title="Опубликовать для всех" disabled={working || name.trim().length < 2 || !validDate || !topics.length || invalidCustom || unapproved} onPress={publish} />}
    </View>
    {!localOnly && <>
    <Text style={s.heading}>События и черновики</Text>
    {!busy && !events.length && <Text style={s.muted}>Событий пока нет.</Text>}
    {events.map(event => {
      const day = eventDay(event);
      const status = event.cancelled_at ? 'Отменено' : event.draft ? 'Черновик' : day < 0 ? 'Запланировано' : day >= event.topics.length ? 'Завершено' : 'Идёт';
      return <View key={event.id} style={s.card}>
        <Text style={s.title}>{event.name || 'Без названия'}</Text>
        <Text style={s.muted}>{status} · {groupDueDate(event.starts_on)}{event.topics.length ? ' — ' + groupDueDate(event.ends_on) : ''}</Text>
        <Text style={s.muted}>{event.topics.map(id => groupTopicName(id) || id).join(' · ')}</Text>
        {event.draft && !event.cancelled_at && <PrimaryButton title="Открыть черновик" variant="secondary" disabled={working}
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
    </>}
  </>;
}

function EventExerciseEditor({ pair, disabled, onChange, onRemove, onPreview }) {
  const valid = validEventExercisePair(pair);
  const update = (part, item) => onChange({ ...pair, [part]: item, approved: false });
  return <>
    {['question', 'review'].map(part => {
      const item = pair[part];
      const label = part === 'question' ? 'Основное задание' : 'Повторение по ошибке';
      return <View key={part} style={s.dayCard}>
        <Text style={s.title}>{label}</Text>
        <Field label={`${label} · вопрос`} value={item.prompt} maxLength={220} multiline editable={!disabled}
          onChangeText={prompt => update(part, { ...item, prompt })} />
        {item.options.map((option, i) => <Field key={i} label={`${label} · вариант ${i + 1}`} value={option} maxLength={120} editable={!disabled}
          onChangeText={value => update(part, { ...item, options: item.options.map((other, index) => i === index ? value : other) })} />)}
        <Text style={s.muted}>Правильный вариант</Text>
        <View style={s.formats}>{item.options.map((_, i) => <Pressable key={i} accessibilityRole="radio"
          accessibilityLabel={`${label} · правильный вариант ${i + 1}`} accessibilityState={{ checked: item.answer === i }} disabled={disabled}
          onPress={() => update(part, { ...item, answer: i })} style={[s.format, item.answer === i && s.selected]}><Text style={s.day}>{i + 1}</Text></Pressable>)}</View>
        <Field label={`${label} · объяснение`} value={item.explanation} maxLength={240} multiline editable={!disabled}
          onChangeText={explanation => update(part, { ...item, explanation })} />
      </View>;
    })}
    {!valid && <Text style={s.muted}>Проверь формулировки, объяснения и три разных английских варианта. В повторении нужна новая фраза по тому же правилу.</Text>}
    <PrimaryButton title="Предпросмотр повтора" variant="secondary" disabled={disabled || !valid} onPress={onPreview} />
    <PrimaryButton title={pair.approved ? 'Ответы подтверждены' : 'Подтвердить правильные ответы'} disabled={disabled || !valid || pair.approved}
      onPress={() => onChange({ ...pair, approved: true })} />
    <PrimaryButton title="Убрать упражнение" variant="secondary" disabled={disabled} onPress={onRemove} />
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
      const deck = eventDayDeck(event, day.index);
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
