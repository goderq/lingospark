import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../store/AuthContext';
import { manageAccess, useAccess } from '../store/AccessContext';
import { colors, useTheme, createThemedStyles } from '../theme';

const errorMessage = error => ({
  promo_unavailable: 'Проверь промокод. Возможно, он отключён, истёк или его уже использовали.',
  admin_required: 'Права администратора больше не действуют.',
  owner_required: 'Назначать администраторов может владелец.',
  account_required: 'Войди в аккаунт ещё раз.',
  account_not_found: 'Аккаунт с подтверждённой почтой не найден.',
}[error?.message] || 'Не удалось выполнить действие. Проверь подключение и попробуй ещё раз.');

const displayDate = value => new Date(value).toLocaleDateString('ru-RU');
const licenseStatus = license => license.licensed ? (license.expires_at ? 'Доступ до ' + displayDate(license.expires_at) : 'Бессрочный доступ') : 'Нет активной лицензии';

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
  const { licensed, expires_at, offline, isAdmin, error, loading, refresh, redeem } = useAccess();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
        <Text style={s.label}>{isAdmin ? 'Доступ администратора' : licenseStatus({ licensed, expires_at })}</Text>
        <Text style={s.muted}>{offline ? 'Лицензия проверена ранее. Для продления офлайн-доступа подключись к интернету.' : 'Лицензия открывает обучение, словарь, «Английскую жизнь» и ИИ.'}</Text>
        {loading && <ActivityIndicator color={colors.purple} />}
        {!!error && <Text accessibilityLiveRegion="polite" style={s.muted}>{error}</Text>}
        <Button title="Обновить статус" secondary disabled={loading || busy} onPress={refresh} />
      </View>
      <View style={s.card}>
        <Field label="Промокод" placeholder="Введи или вставь код" value={code} onChangeText={setCode} autoCorrect={false} autoCapitalize="characters" maxLength={48} editable={!busy} />
        <Button title={busy ? 'Активируем…' : 'Активировать'} onPress={activate} disabled={busy || !code.trim()} />
        {!!message && <Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
      </View>
      {!onClose && <>
        <EditName initialName={user.user_metadata?.display_name} />
        <Button title="Выйти из аккаунта" onPress={signOut} secondary />
      </>}
    </>}
  </AccessLayout>;
}

const PAGE_SIZE = 50;
export function AdminScreen({ onClose }) {
  const access = useAccess();
  const [promos, setPromos] = useState([]);
  const [page, setPage] = useState(0);
  const [label, setLabel] = useState('');
  const [days, setDays] = useState('30');
  const [redeemDays, setRedeemDays] = useState('');
  const [limit, setLimit] = useState('1');
  const [issued, setIssued] = useState('');
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const perform = async (task) => {
    setBusy(true);
    setMessage('');
    try { await task(); } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const loadPage = async (nextPage) => {
    const data = await manageAccess('list_promos', { offset: nextPage * PAGE_SIZE });
    setPromos(data);
    setPage(nextPage);
  };
  useEffect(() => {
    if (!access.isAdmin) return;
    let active = true;
    manageAccess('list_promos', { offset: 0 }).then(data => {
      if (active) setPromos(data);
    }).catch(err => { if (active) setMessage(errorMessage(err)); });
    return () => { active = false; };
  }, [access.isAdmin]);
  const integer = (value, max) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= max;
  const create = () => perform(async () => {
    const result = await manageAccess('create_promo', {
      label: label.trim(), license_days: days ? Number(days) : null,
      redeem_days: redeemDays ? Number(redeemDays) : null, use_limit: Number(limit),
    });
    setIssued(result.code.match(/.{1,5}/g).join('-'));
    setLabel('');
    await loadPage(0);
  });
  const accountAction = action => perform(async () => setTarget(await manageAccess(action, { email: email.trim() })));
  const confirm = (title, description, action) => Alert.alert(title, description, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Подтвердить', style: 'destructive', onPress: action },
  ]);
  if (!access.isAdmin) return <AccessLayout title="Админ-панель" onClose={onClose}><Text style={s.muted}>Требуются права администратора.</Text></AccessLayout>;

  return <AccessLayout title="Админ-панель" onClose={onClose}>
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
    <View style={s.card}>
      <Text style={s.heading}>Аккаунты и права</Text>
      <Field label="Почта аккаунта" value={email} onChangeText={value => { setEmail(value); setTarget(null); }}
        autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={254} editable={!busy} />
      <Button title="Найти аккаунт" onPress={() => accountAction('find_user')} disabled={busy || !email.trim()} secondary />
      {!!target && <>
        <Text style={s.label}>{target.name || target.email}</Text>
        <Text style={s.muted}>{({ owner: 'Владелец', admin: 'Администратор' }[target.role] || 'Пользователь') + ' · ' + licenseStatus(target)}</Text>
        {access.role === 'owner' && target.role !== 'owner' && (target.role === 'admin'
          ? <Button title="Снять права администратора" secondary disabled={busy} onPress={() => confirm('Снять права?', target.email, () => accountAction('revoke_admin'))} />
          : <Button title="Назначить администратором" secondary disabled={busy} onPress={() => confirm('Назначить администратором?', target.email, () => accountAction('grant_admin'))} />)}
        {target.licensed && <Button title="Отозвать лицензию" secondary disabled={busy} onPress={() => confirm('Отозвать лицензию?', target.email, () => accountAction('revoke_license'))} />}
      </>}
    </View>
    <Text style={s.heading}>Промокоды</Text>
    {promos.length === 0 && <Text style={s.muted}>На этой странице нет промокодов.</Text>}
    {promos.map(promo => <View key={promo.id} style={s.card}>
      <Text style={s.label}>{promo.label} · ••••{promo.suffix}</Text>
      <Text style={s.muted}>{promo.used}/{promo.use_limit} активаций · {promo.license_days ? promo.license_days + ' дн. доступа' : 'бессрочный доступ'}</Text>
      {!!promo.redeem_until && <Text style={s.muted}>Активация до {displayDate(promo.redeem_until)}</Text>}
      {promo.disabled_at ? <Text style={s.muted}>Отключён</Text> : <Button title="Отключить промокод" secondary disabled={busy}
        onPress={() => confirm('Отключить промокод?', 'Новые активации прекратятся. Выданные лицензии сохранятся.', () => perform(async () => {
          await manageAccess('disable_promo', { id: promo.id });
          await loadPage(page);
        }))} />}
    </View>)}
    {page > 0 && <Button title="Предыдущая страница" secondary disabled={busy} onPress={() => perform(() => loadPage(page - 1))} />}
    {promos.length === PAGE_SIZE && <Button title="Следующая страница" secondary disabled={busy} onPress={() => perform(() => loadPage(page + 1))} />}
    <Button title="Обновить список" secondary disabled={busy} onPress={() => perform(() => loadPage(page))} />
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
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 12, fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentFill, borderRadius: 13, paddingHorizontal: 8 },
  secondary: { backgroundColor: colors.accentSoft },
  buttonText: { color: colors.onAccent, textAlign: 'center', fontWeight: '800' },
  secondaryText: { color: colors.text, textAlign: 'center', fontWeight: '800' },
  disabled: { opacity: 0.55 },
}));
