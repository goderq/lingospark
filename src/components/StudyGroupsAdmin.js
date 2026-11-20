import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { manageStudyGroups } from '../services/studyGroups';
import { groupDueDate, groupTopicName, groupTopics } from '../utils/groupStudy';
import { PrimaryButton } from './UI';
import { colors, createThemedStyles, useTheme } from '../theme';

const PAGE = 30;
const memberStatus = { new: 'Не начал', started: 'В процессе', completed: 'Выполнено' };
const groupErrors = {
  account_not_found: 'Аккаунт с подтверждённой почтой не найден.',
  invalid_group_name: 'Название должно содержать от 2 до 80 символов.',
  group_archived: 'Сначала восстанови группу.',
  invalid_assignment_days: 'Укажи срок от 1 до 60 дней.',
  admin_required: 'Права администратора больше не действуют.',
};

function Field({ label, ...props }) {
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={s.input} {...props} />
  </View>;
}

function confirm(title, description, action) {
  Alert.alert(title, description, [
    { text: 'Отмена', style: 'cancel' }, { text: 'Подтвердить', onPress: action },
  ]);
}

export default function StudyGroupsAdmin() {
  useTheme();
  const [directory, setDirectory] = useState(null);
  const [offset, setOffset] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState(null);
  const [report, setReport] = useState(null);
  const [topic, setTopic] = useState(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [choosingTopic, setChoosingTopic] = useState(false);
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);

  const run = async (task) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try { await task(); }
    catch (reason) { setError(groupErrors[reason?.message] || 'Не удалось обновить данные группы. Попробуй ещё раз.'); }
    finally {
      running.current = false;
      setBusy(false);
    }
  };
  const loadGroups = async (page) => {
    setDirectory(await manageStudyGroups('list_groups', { offset: page }));
    setOffset(page);
  };
  const loadGroup = async (groupId) => {
    setDetails(await manageStudyGroups('group_detail', { group_id: groupId }));
  };
  useEffect(() => { run(() => loadGroups(0)); }, []);

  const openGroup = (id) => run(async () => {
    await loadGroup(id);
    setEmail('');
    setTopic(null);
    setChoosingTopic(false);
    setDays('7');
  });
  const create = () => run(async () => {
    const group = await manageStudyGroups('create_group', { name: name.trim() });
    setName('');
    await loadGroup(group.id);
  });
  const update = (action, options = {}) => run(async () => {
    await manageStudyGroups(action, { group_id: details.group.id, ...options });
    if (action === 'add_member') setEmail('');
    await loadGroup(details.group.id);
  });
  const showReport = (assignment) => run(async () => {
    const members = await manageStudyGroups('assignment_report', { group_id: details.group.id, assignment_id: assignment.id });
    setReport({ assignment, members });
  });
  const backToGroups = () => run(async () => { await loadGroups(offset); setDetails(null); });
  const availableTopics = groupTopics.filter(item => !topicSearch.trim() ||
    (item.title + ' ' + item.level).toLowerCase().includes(topicSearch.trim().toLowerCase()));
  const note = !!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>;
  const loading = busy && <ActivityIndicator color={colors.purple} />;

  if (report) {
    return <>
      <PrimaryButton title="Назад к группе" variant="secondary" disabled={busy} onPress={() => setReport(null)} />
      <Text style={s.heading}>{groupTopicName(report.assignment.topic_id) || report.assignment.topic_id}</Text>
      <Text style={s.muted}>Результаты по последней облачной синхронизации каждого участника</Text>
      {note}{loading}
      {!report.members.length && <Text style={s.muted}>В группе пока нет участников.</Text>}
      {report.members.map(member => <View key={member.id} style={s.card}>
        <Text style={s.label}>{member.name || member.email}</Text>
        {!!member.name && <Text style={s.muted}>{member.email}</Text>}
        <Text style={s.muted}>{memberStatus[member.status]}{member.total ? ' · Ошибок ' + member.errors + ' из ' + member.total : ''}</Text>
      </View>)}
      <PrimaryButton title="Обновить результаты" variant="secondary" disabled={busy} onPress={() => showReport(report.assignment)} />
    </>;
  }

  if (details) {
    const { group, members, assignments } = details;
    const worst = assignments.reduce((selected, item) => item.answers && item.errors &&
      (!selected || item.errors * selected.answers > selected.errors * item.answers) ? item : selected, null);
    const validDays = /^\d+$/.test(days) && Number(days) >= 1 && Number(days) <= 60;
    return <>
      <PrimaryButton title="К списку групп" variant="secondary" disabled={busy} onPress={backToGroups} />
      <Text style={s.heading}>{group.name}</Text>
      {note}{loading}
      <View style={s.card}>
        <Text style={s.label}>Участники · {members.length}</Text>
        {!group.archived_at && <>
          <Field label="Почта участника" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" editable={!busy} maxLength={254} />
          <PrimaryButton title="Добавить участника" variant="secondary" disabled={busy || !email.trim()} onPress={() => update('add_member', { email: email.trim() })} />
        </>}
        {members.map(member => <View key={member.id} style={s.row}>
          <View style={s.grow}><Text style={s.label}>{member.name || member.email}</Text>
            {!!member.name && <Text style={s.muted}>{member.email}</Text>}</View>
          {!group.archived_at && <Pressable style={s.rowAction} accessibilityRole="button" accessibilityLabel={'Удалить ' + member.email}
            disabled={busy} onPress={() => confirm('Убрать участника?', member.email,
              () => update('remove_member', { user_id: member.id }))}>
            <Text style={s.accent}>Убрать</Text>
          </Pressable>}
        </View>)}
      </View>
      {!group.archived_at && <View style={s.card}>
        <Text style={s.label}>Назначить тему</Text>
        <PrimaryButton title={topic ? topic.title : 'Выбрать тему'} variant="secondary" disabled={busy}
          onPress={() => { setTopicSearch(''); setChoosingTopic(value => !value); }} />
        {choosingTopic && <>
          <Field label="Поиск темы" value={topicSearch} onChangeText={setTopicSearch} autoCorrect={false} />
          {availableTopics.slice(0, 8).map(item => <PrimaryButton key={item.id} title={item.level + ' · ' + item.title}
            variant="secondary" onPress={() => { setTopic(item); setChoosingTopic(false); }} />)}
          {!availableTopics.length && <Text style={s.muted}>Темы не найдены.</Text>}
          {availableTopics.length > 8 && <Text style={s.muted}>Введи название или уровень, чтобы найти другие темы.</Text>}
        </>}
        <Field label="Срок в днях" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={2} editable={!busy} />
        <PrimaryButton title="Назначить группе" disabled={busy || !topic || !validDays}
          onPress={() => update('assign_topic', { topic_id: topic.id, days: Number(days) })} />
      </View>}
      <Text style={s.heading}>Задания</Text>
      {!assignments.length && <Text style={s.muted}>Темы пока не назначены.</Text>}
      {!!worst && <Text style={s.muted}>Самая высокая доля ошибок · {groupTopicName(worst.topic_id) || worst.topic_id} · {Math.round(100 * worst.errors / worst.answers)}%</Text>}
      {assignments.map(assignment => <View key={assignment.id} style={s.card}>
        <Text style={s.label}>{groupTopicName(assignment.topic_id) || assignment.topic_id}</Text>
        <Text style={s.muted}>Срок до {groupDueDate(assignment.due_on)} · выполнено {assignment.completed} из {members.length} · в процессе {assignment.started}</Text>
        {!!assignment.answers && <Text style={s.muted}>Ошибок {assignment.errors} из {assignment.answers} ответов</Text>}
        <PrimaryButton title="Результаты участников" variant="secondary" disabled={busy} onPress={() => showReport(assignment)} />
        {!group.archived_at && <PrimaryButton title="Отменить задание" variant="secondary" disabled={busy}
          onPress={() => confirm('Отменить задание?', groupTopicName(assignment.topic_id) || assignment.topic_id,
            () => update('cancel_assignment', { assignment_id: assignment.id }))} />}
      </View>)}
      <PrimaryButton title="Обновить группу" variant="secondary" disabled={busy} onPress={() => run(() => loadGroup(group.id))} />
      <PrimaryButton title={group.archived_at ? 'Восстановить группу' : 'Архивировать группу'} variant="secondary" disabled={busy}
        onPress={() => group.archived_at ? update('restore_group') : confirm('Архивировать группу?', 'Назначенные темы исчезнут с экрана «Сегодня» у участников.',
          () => update('archive_group'))} />
    </>;
  }

  return <>
    {note}{loading}
    <View style={s.card}>
      <Field label="Название группы" value={name} onChangeText={setName} maxLength={80} editable={!busy} />
      <PrimaryButton title="Создать группу" disabled={busy || name.trim().length < 2} onPress={create} />
    </View>
    {!busy && directory?.groups.length === 0 && <Text style={s.muted}>Учебных групп пока нет.</Text>}
    {directory?.groups.map(group => <Pressable key={group.id} style={s.card} accessibilityRole="button"
      disabled={busy} onPress={() => openGroup(group.id)}>
      <Text style={s.label}>{group.name}</Text>
      <Text style={s.muted}>Участников {group.member_count}{group.archived_at ? ' · В архиве' : ''}</Text>
    </Pressable>)}
    {offset > 0 && <PrimaryButton title="Предыдущая страница" variant="secondary" disabled={busy} onPress={() => run(() => loadGroups(offset - PAGE))} />}
    {directory?.has_more && <PrimaryButton title="Следующая страница" variant="secondary" disabled={busy} onPress={() => run(() => loadGroups(offset + PAGE))} />}
    <PrimaryButton title="Обновить список" variant="secondary" disabled={busy} onPress={() => run(() => loadGroups(offset))} />
  </>;
}

const s = createThemedStyles(() => ({
  card: { gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  heading: { color: colors.text, fontSize: 21, fontWeight: '800' },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  accent: { color: colors.purple, fontWeight: '800' },
  field: { gap: 6 },
  input: { color: colors.text, backgroundColor: colors.background, minHeight: 48, borderColor: colors.buttonBorder,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: colors.border, paddingTop: 9 },
  rowAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  grow: { flex: 1, gap: 4 },
  error: { color: colors.text, backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12 },
}));
