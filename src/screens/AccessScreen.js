import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import StudyEventsAdmin from '../components/StudyEventsAdmin';
import StudyGroupsAdmin from '../components/StudyGroupsAdmin';
import AdminLearnerProfile from '../components/AdminLearnerProfile';
import { useAuth } from '../store/AuthContext';
import { loadAccessEvents, manageAccess, useAccess } from '../store/AccessContext';
import { offlineRemaining } from '../utils/licenseTiming';
import { colors, useTheme, createThemedStyles } from '../theme';

const errorMessage = error => ({
  promo_unavailable: 'Проверь промокод. Возможно, он отключён, истёк или его уже использовали.',
  admin_required: 'Права администратора больше не действуют.',
  owner_required: 'Назначать администраторов может владелец.',
  account_required: 'Войди в аккаунт ещё раз.',
  account_not_found: 'Аккаунт с подтверждённой почтой не найден.',
  invalid_license_days: 'Укажи срок от 1 до 3650 дней.',
  invalid_license_reason: 'Укажи причину длиной от 3 до 200 символов.',
  license_already_permanent: 'У аккаунта уже есть бессрочная лицензия.',
}[error?.message] || 'Не удалось выполнить действие. Проверь подключение и попробуй ещё раз.');

const displayDate = value => new Date(value).toLocaleDateString('ru-RU');
const licenseStatus = license => {
  if (license.licensed) return license.expires_at ? 'Доступ до ' + displayTime(license.expires_at) : 'Бессрочный доступ';
  if (license.revoked_at) return 'Лицензия отозвана';
  if (license.expires_at && Date.parse(license.expires_at) <= Date.now()) return 'Срок лицензии истёк';
  return 'Нет активной лицензии';
};

function AccessLayout({ title, onClose, children }) {
  useTheme();
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        {onClose && <Pressable accessibilityRole="button" accessibilityLabel="Назад" style={s.back} onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>}
        <Text accessibilityRole="header" style={s.title}>{title}</Text>
      </View>
      {children}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Button({ title, onPress, disabled, secondary = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    style={[s.button, secondary && s.secondary, disabled && s.disabled]}>
    <Text style={secondary ? s.secondaryText : s.buttonText}>{title}</Text>
  </Pressable>;
}

function Field({ label, ...props }) {
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} style={s.input} placeholderTextColor={colors.textMuted} {...props} />
  </View>;
}

export function EditName({ initialName }) {
  useTheme();
  const { updateDisplayName } = useAuth();
  const [name, setName] = useState(initialName || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => setName(initialName || ''), [initialName]);
  const save = async () => {
    setBusy(true);
    try {
      const { error } = await updateDisplayName(name);
      if (error) throw error;
      setMessage('Имя сохранено.');
    } catch {
      setMessage('Имя не сохранилось. Проверь подключение и попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  };
  return <View style={s.card}>
    <Field label="Имя профиля" value={name} onChangeText={value => { setName(value); setMessage(''); }} maxLength={50} textContentType="name" autoCapitalize="words" editable={!busy} />
    <Button title={busy ? 'Сохраняем…' : 'Сохранить имя'} onPress={save} disabled={busy || !name.trim() || name.trim() === initialName} secondary />
    {!!message && <Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
  </View>;
}

export default function AccessScreen({ onClose, onAccount }) {
  const { user, signOut } = useAuth();
  const { licensed, expires_at, revoked_at, expired, verifiedAt, offlineUntil, offline, staffOffline, isAdmin, error, loading, refresh, redeem } = useAccess();
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const status = loading ? 'Проверяем доступ…' : licensed ? licenseStatus({ licensed, expires_at }) :
    staffOffline ? 'Офлайн-доступ к обучению' : revoked_at ? 'Лицензия отозвана' : expired ? 'Срок лицензии истёк' :
    offline && verifiedAt ? 'Срок офлайн-доступа истёк' : isAdmin ? 'Доступ администратора' : 'Нет активной лицензии';
  const activate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await redeem(code);
      setCode('');
      setMessage(result.already_redeemed ? 'Ты уже использовал этот промокод.' : result.permanent_access ? 'У тебя уже есть бессрочный доступ.' : 'Лицензия активирована.');
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return <AccessLayout title="Доступ к LingoSpark" onClose={onClose}>
    {!user ? <>
      <Text style={s.muted}>Войди или создай аккаунт, чтобы активировать промокод.</Text>
      <Button title="Войти или создать аккаунт" onPress={onAccount} />
    </> : <>
      <View style={s.card}>
        <Text style={s.label}>{status}</Text>
        {isAdmin && status !== 'Доступ администратора' && <Text style={s.muted}>Доступ администратора активен.</Text>}
        {!licensed && !!expires_at && <Text style={s.muted}>Срок лицензии был до {displayTime(expires_at)}</Text>}
        {!!verifiedAt && <Text style={s.muted}>Последняя проверка {displayTime(verifiedAt)}</Text>}
        {(licensed || isAdmin || staffOffline) && offlineUntil > Date.now() && <Text style={s.muted}>Офлайн до {displayTime(offlineUntil)} · ещё {offlineRemaining(offlineUntil)}</Text>}
        {staffOffline && <Text style={s.muted}>Чтобы открыть админ-панель, подключись к интернету.</Text>}
        {offline && !licensed && !staffOffline && <Text style={s.muted}>Подключись к интернету и обнови статус.</Text>}
        {!offline && !licensed && !isAdmin && !loading && <Text style={s.muted}>Введи промокод, чтобы открыть обучение, словарь, «Английскую жизнь» и ИИ.</Text>}
        {loading && <ActivityIndicator color={colors.purple} />}
        {!!error && <Text accessibilityLiveRegion="polite" style={s.muted}>{error}</Text>}
        <Button title="Обновить статус" secondary disabled={loading || busy} onPress={refresh} />
      </View>
      {licensed && !showCode && <Button title="Продлить по промокоду" onPress={() => setShowCode(true)} disabled={loading} />}
      {(!licensed || showCode) && <View style={s.card}>
        <Field label="Промокод" placeholder="Введи или вставь код" value={code} onChangeText={setCode} autoCorrect={false} autoCapitalize="characters" maxLength={48} editable={!busy} />
        <Button title={busy ? 'Активируем…' : 'Активировать'} onPress={activate} disabled={busy || !code.trim()} />
        {!!message && <Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
      </View>}
      {!onClose && <>
        <EditName initialName={user.user_metadata?.display_name} />
        <Button title="Выйти из аккаунта" onPress={signOut} secondary />
      </>}
    </>}
  </AccessLayout>;
}

const PAGE_SIZE = 50;
const DIRECTORY_PAGE_SIZE = 30;
const eventTitles = {
  promo_created: 'Промокод создан',
  promo_disabled: 'Промокод отключён',
  promo_redeemed: 'Промокод активирован',
  license_revoked: 'Лицензия отозвана',
  license_granted: 'Лицензия выдана',
  license_extended: 'Лицензия продлена',
};
const displayTime = value => new Date(value).toLocaleString('ru-RU', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

const roleTitle = role => ({ owner: 'Владелец', admin: 'Администратор' }[role] || 'Пользователь');
const integer = (value, max) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= max;
const userFilters = { all: 'Все', active: 'Активная лицензия', expiring: 'Скоро истечёт', none: 'Без доступа' };
const promoFilters = { all: 'Все', active: 'Действующие', expired: 'Просроченные', exhausted: 'Исчерпанные', disabled: 'Отключённые' };
const promoStatus = { active: 'Действует', expired: 'Истёк срок', exhausted: 'Активации исчерпаны', disabled: 'Отключён' };
const roleOptions = {};

const confirmAction = (title, description, action) => Alert.alert(title, description, [
  { text: 'Отмена', style: 'cancel' },
  { text: 'Подтвердить', onPress: action },
]);

function FilterButtons({ options, selected, onSelect, disabled }) {
  return <View style={s.filters}>
    {Object.entries(options).map(([key, title]) => <Pressable key={key} accessibilityRole="button"
      accessibilityState={{ selected: selected === key, disabled: !!disabled }}
      disabled={disabled} onPress={() => onSelect(key)} style={[s.filter, selected === key && s.filterSelected]}>
      <Text style={selected === key ? s.label : s.muted}>{title}</Text>
    </Pressable>)}
  </View>;
}

function useAdminPage(action, options, field) {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const revision = useRef(0);
  const load = useCallback(async nextOffset => {
    const request = ++revision.current;
    setLoading(true);
    setError('');
    try {
      const result = await manageAccess(action, { ...options, offset: nextOffset });
      if (request !== revision.current) return;
      setItems(result[field]);
      setHasMore(result.has_more);
      setOffset(nextOffset);
    } catch (reason) {
      if (request === revision.current) setError(errorMessage(reason));
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, [action, options, field]);
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(false);
    load(0);
    return () => { revision.current++; };
  }, [load]);
  return { items, offset, hasMore, loading, error, load };
}

function ListControls({ page }) {
  return <>
    {!!page.error && <Text accessibilityLiveRegion="polite" style={s.notice}>{page.error}</Text>}
    {page.offset > 0 && <Button title="Предыдущая страница" secondary disabled={page.loading} onPress={() => page.load(page.offset - DIRECTORY_PAGE_SIZE)} />}
    {page.hasMore && <Button title="Следующая страница" secondary disabled={page.loading} onPress={() => page.load(page.offset + DIRECTORY_PAGE_SIZE)} />}
    <Button title="Обновить список" secondary disabled={page.loading} onPress={() => page.load(page.offset)} />
  </>;
}

function AdminUsers({ criteria, setCriteria, onAccount, onClose }) {
  const [query, setQuery] = useState(criteria.query);
  const page = useAdminPage('list_users', criteria, 'users');
  const search = (filter = criteria.filter) => setCriteria({ query: query.trim(), filter });
  return <AccessLayout title="Пользователи" onClose={onClose}>
    <Field label="Имя или почта" value={query} onChangeText={setQuery} maxLength={254} autoCorrect={false}
      autoCapitalize="none" returnKeyType="search" onSubmitEditing={() => search()} />
    <Button title="Найти пользователей" secondary onPress={() => search()} />
    <FilterButtons options={userFilters} selected={criteria.filter} onSelect={search} />
    {criteria.filter === 'expiring' && <Text style={s.muted}>Лицензии, которые истекут в ближайшие 7 дней.</Text>}
    {page.loading && <ActivityIndicator color={colors.purple} />}
    {!page.loading && !page.error && !page.items.length && <Text style={s.muted}>Пользователи не найдены.</Text>}
    {!page.loading && page.items.map(account => <Pressable key={account.id} accessibilityRole="button"
      style={s.card} onPress={() => onAccount(account)}>
      <Text style={s.label}>{account.name || account.email}</Text>
      {!!account.name && <Text style={s.muted}>{account.email}</Text>}
      <Text style={s.muted}>{roleTitle(account.role)} · {account.role && !account.licensed ? 'Доступ по роли' : licenseStatus(account)}</Text>
      {!account.confirmed && <Text style={s.muted}>Почта не подтверждена</Text>}
    </Pressable>)}
    <ListControls page={page} />
  </AccessLayout>;
}

function RoleJournal({ onClose }) {
  const page = useAdminPage('list_role_events', roleOptions, 'events');
  return <AccessLayout title="Журнал ролей" onClose={onClose}>
    {page.loading && <ActivityIndicator color={colors.purple} />}
    {!page.loading && !page.error && !page.items.length && <Text style={s.muted}>Изменений ролей пока нет.</Text>}
    {page.items.map(event => <View key={event.id} style={s.card}>
      <Text style={s.label}>{roleTitle(event.before_role)} → {roleTitle(event.after_role)}</Text>
      <Text style={s.muted}>{event.target_email || 'Аккаунт недоступен'}</Text>
      <Text style={s.muted}>{displayTime(event.occurred_at)}</Text>
      <Text style={s.muted}>{event.actor_email ? 'Выполнил: ' + event.actor_email : 'Автор неизвестен'}</Text>
    </View>)}
    <ListControls page={page} />
  </AccessLayout>;
}

function AccountActions({ account, staffRole, onUpdate }) {
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const running = useRef(false);
  const confirmation = useRef(null);
  const permanent = account.licensed && !account.expires_at;
  const grantTitle = account.licensed ? 'Продлить лицензию' : 'Выдать лицензию';
  const run = async (action, options = {}, success = '') => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage('');
    try {
      const updated = await manageAccess(action, { email: account.email, ...options });
      if (action === 'grant_license') {
        confirmation.current = null;
        setReason('');
      }
      onUpdate(updated);
      setMessage(success);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const grant = () => {
    const key = [account.email, Number(days), reason.trim()].join('\n');
    if (confirmation.current?.key !== key) {
      confirmation.current = { key, id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) };
    }
    const options = { license_days: Number(days), reason: reason.trim(), request_key: confirmation.current.id };
    confirmAction(grantTitle + '?', account.email + ' · ' + days + ' дн.', () => run('grant_license', options, 'Лицензия сохранена.'));
  };
  return <>
    {!permanent && <View style={s.issued}>
      <Field label="Срок лицензии в днях" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={4} editable={!busy} />
      <Field label="Причина выдачи или продления" value={reason} onChangeText={setReason} maxLength={200} editable={!busy}
        placeholder="Например, тестовый доступ" />
      <Button title={grantTitle} secondary onPress={grant}
        disabled={busy || !integer(days, 3650) || reason.trim().length < 3} />
    </View>}
    {account.licensed && <Button title="Отозвать лицензию" secondary disabled={busy}
      onPress={() => confirmAction('Отозвать лицензию?', account.email, () => run('revoke_license', {}, 'Лицензия отозвана.'))} />}
    {staffRole === 'owner' && account.role !== 'owner' && <Button
      title={account.role === 'admin' ? 'Снять права администратора' : 'Назначить администратором'} secondary disabled={busy}
      onPress={() => confirmAction(account.role === 'admin' ? 'Снять права?' : 'Назначить администратором?', account.email,
        () => run(account.role === 'admin' ? 'revoke_admin' : 'grant_admin', {}, 'Роль обновлена.'))} />}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
  </>;
}

function AccessJournal({ onClose, account, staffRole }) {
  const email = account?.email;
  const confirmed = account?.confirmed !== false;
  const [profile, setProfile] = useState(account);
  const [showProfile, setShowProfile] = useState(false);
  const [entries, setEntries] = useState([]);
  const [license, setLicense] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const load = useCallback(async (cursor) => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const { events, has_more, license: currentLicense } = await loadAccessEvents(cursor, email);
      if (id !== request.current) return;
      setEntries(previous => cursor ? [...previous, ...events] : events);
      setHasMore(has_more);
      setLicense(currentLicense || null);
    } catch (reason) {
      if (id === request.current) setError(errorMessage(reason));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [email]);
  useEffect(() => {
    if (confirmed) load();
    else setLoading(false);
    return () => { request.current++; };
  }, [confirmed, load]);

  if (showProfile && profile?.id) return <AccessLayout title="Профиль пользователя" onClose={() => setShowProfile(false)}>
    <AdminLearnerProfile userId={profile.id} />
  </AccessLayout>;

  return <AccessLayout title={account ? 'Карточка пользователя' : 'Журнал лицензий'} onClose={onClose}>
    {!!profile && <View style={s.card}>
      {!!profile.name && <Text style={s.label}>{profile.name}</Text>}
      <Text style={s.muted}>{profile.email}</Text>
      <Text style={s.label}>{roleTitle(profile.role)} · {licenseStatus(license || profile)}</Text>
      {!!profile.id && <Button title="Открыть полный профиль" secondary onPress={() => setShowProfile(true)} />}
      {confirmed ? <AccountActions account={{ ...profile, ...license }} staffRole={staffRole} onUpdate={updated => {
        setProfile(current => ({ ...current, ...updated }));
        setLicense(updated);
        load();
      }} /> : <Text style={s.muted}>Почта ещё не подтверждена.</Text>}
    </View>}
    {account && confirmed && <Text style={s.heading}>История доступа</Text>}
    {confirmed && <Button title="Обновить журнал" secondary disabled={loading} onPress={() => load()} />}
    {!!error && <Text accessibilityLiveRegion="polite" style={s.notice}>{error}</Text>}
    {loading && <ActivityIndicator color={colors.purple} />}
    {!loading && !error && entries.length === 0 && <Text style={s.muted}>Событий пока нет.</Text>}
    {entries.map(entry => {
      const accountEvent = ['promo_redeemed', 'license_revoked', 'license_granted', 'license_extended'].includes(entry.kind);
      return <View key={entry.id} style={s.card}>
        <Text style={s.label}>{eventTitles[entry.kind]}</Text>
        <Text style={s.muted}>{displayTime(entry.occurred_at)}</Text>
        {!!entry.promo_label && <Text style={s.muted}>{entry.promo_label} · ••••{entry.promo_suffix}</Text>}
        {accountEvent && <Text style={s.muted}>{entry.target_email || 'Аккаунт недоступен'}</Text>}
        {entry.actor_email !== entry.target_email || !accountEvent
          ? <Text style={s.muted}>{entry.actor_email ? 'Выполнил: ' + entry.actor_email : 'Автор неизвестен'}</Text>
          : null}
        {accountEvent && !entry.historical && <Text style={s.muted}>{entry.expires_at
          ? (entry.kind === 'license_revoked' ? 'Лицензия действовала до ' : 'Доступ до ') + displayTime(entry.expires_at)
          : 'Бессрочная лицензия'}</Text>}
        {!!entry.reason && <Text style={s.muted}>{entry.reason} · {entry.granted_days} дн.</Text>}
        {accountEvent && entry.historical && <Text style={s.muted}>Срок на момент события неизвестен.</Text>}
      </View>;
    })}
    {hasMore && <Button title="Показать более ранние события" secondary disabled={loading} onPress={() => load(entries.at(-1))} />}
  </AccessLayout>;
}

export function AdminScreen({ onClose }) {
  const access = useAccess();
  const [route, setRoute] = useState(null);
  const [criteria, setCriteria] = useState({ query: '', filter: 'all' });
  const [promoFilter, setPromoFilter] = useState('all');
  const [promos, setPromos] = useState([]);
  const [page, setPage] = useState(0);
  const [label, setLabel] = useState('');
  const [days, setDays] = useState('30');
  const [redeemDays, setRedeemDays] = useState('');
  const [limit, setLimit] = useState('1');
  const [issued, setIssued] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const promoRevision = useRef(0);
  const perform = async (task) => {
    setBusy(true);
    setMessage('');
    try { await task(); } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const loadPage = useCallback(async (nextPage, filter) => {
    const request = ++promoRevision.current;
    const data = await manageAccess('list_promos', { offset: nextPage * PAGE_SIZE, filter });
    if (request !== promoRevision.current) return;
    setPromoFilter(filter);
    setPromos(data);
    setPage(nextPage);
  }, []);
  useEffect(() => {
    if (!access.isAdmin) return;
    let active = true;
    loadPage(0, 'all').catch(err => { if (active) setMessage(errorMessage(err)); });
    return () => { active = false; promoRevision.current++; };
  }, [access.isAdmin, loadPage]);
  const create = () => perform(async () => {
    const result = await manageAccess('create_promo', {
      label: label.trim(), license_days: days ? Number(days) : null,
      redeem_days: redeemDays ? Number(redeemDays) : null, use_limit: Number(limit),
    });
    setIssued(result.code.match(/.{1,5}/g).join('-'));
    setLabel('');
    await loadPage(0, promoFilter);
  });
  if (!access.isAdmin) return <AccessLayout title="Админ-панель" onClose={onClose}><Text style={s.muted}>Требуются права администратора.</Text></AccessLayout>;
  if (route?.type === 'studyEvents') return <AccessLayout title="Общие события" onClose={() => setRoute(null)}>
    <StudyEventsAdmin />
  </AccessLayout>;
  if (route?.type === 'studyGroups') return <AccessLayout title="Учебные группы" onClose={() => setRoute(null)}>
    <StudyGroupsAdmin />
  </AccessLayout>;
  if (route?.type === 'journal') return <AccessJournal onClose={() => setRoute(null)} />;
  if (route?.type === 'roles' && access.role === 'owner') return <RoleJournal onClose={() => setRoute(null)} />;
  if (route?.type === 'account') return <AccessJournal account={route.account} staffRole={access.role} onClose={() => setRoute({ type: 'users' })} />;
  if (route?.type === 'users') return <AdminUsers criteria={criteria} setCriteria={setCriteria}
    onAccount={account => setRoute({ type: 'account', account })} onClose={() => setRoute(null)} />;

  return <AccessLayout title="Админ-панель" onClose={onClose}>
    <Button title="Общие события" secondary onPress={() => setRoute({ type: 'studyEvents' })} />
    <Button title="Учебные группы" secondary onPress={() => setRoute({ type: 'studyGroups' })} />
    <Button title="Пользователи" secondary onPress={() => setRoute({ type: 'users' })} />
    <Button title="Журнал лицензий" secondary onPress={() => setRoute({ type: 'journal' })} />
    {access.role === 'owner' && <Button title="Журнал ролей" secondary onPress={() => setRoute({ type: 'roles' })} />}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
    <View style={s.card}>
      <Text style={s.heading}>Новый промокод</Text>
      <Field label="Название промокода" value={label} maxLength={80} onChangeText={setLabel} />
      <Field label="Дней доступа" placeholder="Пусто — бессрочно" value={days} onChangeText={setDays} keyboardType="number-pad" maxLength={4} />
      <Field label="Дней на активацию" placeholder="Пусто — без срока" value={redeemDays} onChangeText={setRedeemDays} keyboardType="number-pad" maxLength={4} />
      <Field label="Число активаций" value={limit} onChangeText={setLimit} keyboardType="number-pad" maxLength={6} />
      <Button title="Создать промокод" onPress={create} disabled={busy || !label.trim() || (days !== '' && !integer(days, 3650)) || (redeemDays !== '' && !integer(redeemDays, 3650)) || !integer(limit, 100000)} />
      {!!issued && <View style={s.issued}>
        <Text selectable style={s.label}>{issued}</Text>
        <Text style={s.muted}>Скопируй код сейчас. В списке видны только последние четыре символа.</Text>
        <Button title="Скопировать код" secondary onPress={async () => {
          try { await Clipboard.setStringAsync(issued); setMessage('Код скопирован.'); }
          catch { setMessage('Код можно скопировать из выделенного текста.'); }
        }} />
      </View>}
    </View>
    <Text style={s.heading}>Промокоды</Text>
    <FilterButtons options={promoFilters} selected={promoFilter} disabled={busy} onSelect={filter => perform(() => loadPage(0, filter))} />
    {promos.length === 0 && <Text style={s.muted}>На этой странице нет промокодов.</Text>}
    {promos.map(promo => <View key={promo.id} style={s.card}>
      <Text style={s.label}>{promo.label} · ••••{promo.suffix}</Text>
      <Text style={s.label}>{promoStatus[promo.status] || (promo.disabled_at ? 'Отключён' : 'Действует')}</Text>
      <Text style={s.muted}>Осталось {promo.remaining ?? (promo.use_limit - promo.used)} из {promo.use_limit} активаций</Text>
      <Text style={s.muted}>{promo.license_days ? promo.license_days + ' дн. доступа' : 'Бессрочный доступ'}</Text>
      {!!promo.redeem_until && <Text style={s.muted}>Активация до {displayDate(promo.redeem_until)}</Text>}
      {!promo.disabled_at && <Button title="Отключить промокод" secondary disabled={busy}
        onPress={() => confirmAction('Отключить промокод?', 'Новые активации прекратятся. Выданные лицензии сохранятся.', () => perform(async () => {
          await manageAccess('disable_promo', { id: promo.id });
          await loadPage(page, promoFilter);
        }))} />}
    </View>)}
    {page > 0 && <Button title="Предыдущая страница" secondary disabled={busy} onPress={() => perform(() => loadPage(page - 1, promoFilter))} />}
    {promos.length === PAGE_SIZE && <Button title="Следующая страница" secondary disabled={busy} onPress={() => perform(() => loadPage(page + 1, promoFilter))} />}
    <Button title="Обновить список" secondary disabled={busy} onPress={() => perform(() => loadPage(page, promoFilter))} />
  </AccessLayout>;
}

const s = createThemedStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, paddingBottom: 45, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  title: { flex: 1, color: colors.text, fontSize: 26, fontWeight: '900' },
  back: { padding: 10, backgroundColor: colors.card, borderRadius: 16 },
  card: { gap: 12, padding: 16, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800' },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  notice: { color: colors.text, backgroundColor: colors.accentSoft, padding: 12, borderRadius: 13 },
  issued: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.accentSoft },
  field: { gap: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 44, justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.buttonBorder, paddingHorizontal: 12, backgroundColor: colors.card },
  filterSelected: { backgroundColor: colors.accentSoft, borderColor: colors.purple },
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 12, fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentFill, borderRadius: 13, paddingHorizontal: 8 },
  secondary: { backgroundColor: colors.accentSoft },
  buttonText: { color: colors.onAccent, textAlign: 'center', fontWeight: '800' },
  secondaryText: { color: colors.text, textAlign: 'center', fontWeight: '800' },
  disabled: { opacity: 0.55 },
}));
