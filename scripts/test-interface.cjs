const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const Renderer = require('react-test-renderer');
const { transformSync } = require('@babel/core');
global.IS_REACT_ACT_ENVIRONMENT = true;
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = clearTimeout;
const error = console.error;
console.error = (...args) => { if (!String(args[0]).includes('react-test-renderer is deprecated')) error(...args); };
const { act } = React;
const storage = new Map();
const writes = [];
const events = new Map();
const animations = [];
const speechCalls = [];
const tutorRequests = [];
let lastAlert;
const modelDownloads = [], openedLinks = [];
const tutorApi = { loadModel: async () => {}, loadTutorSessions: async () => [], loadTutorMemory: async () => ({ completedMissions: [] }), loadTutorFeedback: async () => [], getDailyTutorMission: () => ({ id: 'test-mission', title: 'Обсуди свой день', description: 'Скрытые подробности миссии' }), getTutorMissionProgress: () => ({ current: 0, target: 2, completed: false }), saveTutorSession: async () => {}, stopGeneration: async () => {}, completeTutorMessage: args => new Promise((resolve, reject) => { args.onStatus?.('thinking'); tutorRequests.push({ args, resolve, reject }); }) };
let system = 'light', override = null, reduced = false;
const emit = (name, value) => { for (const callback of events.get(name) || []) callback(value); };
const subscribe = (name, callback) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(callback); return { remove: () => events.get(name).delete(callback) }; };
const host = name => React.forwardRef((props, ref) => React.createElement(name, { ...props, ref }));
const asyncStorage = { getItem: async key => storage.get(key) || null, setItem: async (key, value) => { writes.push([key, value]); storage.set(key, value); }, removeItem: async key => storage.delete(key) };
class Value { constructor(value) { this.value = value; } setValue(value) { this.value = value; } stopAnimation() {} interpolate() { return this.value; } }
const animate = (value, options) => ({ start: callback => { animations.push(options); value.setValue(options.toValue); callback?.({ finished: true }); }, stop() {} });
const native = {
  View: host('View'), Text: host('Text'), TextInput: host('TextInput'), Pressable: host('Pressable'), ScrollView: host('ScrollView'), TouchableWithoutFeedback: host('TouchableWithoutFeedback'), KeyboardAvoidingView: host('KeyboardAvoidingView'), Modal: host('Modal'), ActivityIndicator: host('ActivityIndicator'), InputAccessoryView: host('InputAccessoryView'), Switch: host('Switch'),
  FlatList: props => React.createElement('FlatList', props, props.ListHeaderComponent, props.data?.length ? props.data.slice(0, 5).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item, index }))) : props.ListEmptyComponent, props.ListFooterComponent),
  StyleSheet: { create: styles => styles, hairlineWidth: 1, absoluteFillObject: { position: 'absolute' } }, Platform: { OS: 'ios', select: options => options.ios ?? options.default },
  Appearance: { getColorScheme: () => override || system, setColorScheme: value => { const old = override || system; override = ['light', 'dark'].includes(value) ? value : null; if ((override || system) !== old) emit('appearance', { colorScheme: override || system }); }, addChangeListener: callback => subscribe('appearance', callback) },
  AccessibilityInfo: { isReduceMotionEnabled: async () => reduced, addEventListener: (_, callback) => subscribe('motion', callback) },
  AppState: { currentState: 'active', addEventListener: (_, callback) => subscribe('appstate', callback) },
  Keyboard: { dismiss() {}, addListener: (name, callback) => subscribe(name, callback) }, BackHandler: { addEventListener: (_, callback) => subscribe('back', callback) }, Alert: { alert(title, message, options) { lastAlert = { title, message, options }; } }, Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Linking: { openURL: async url => openedLinks.push(url) },
  Animated: { Value, View: host('AnimatedView'), timing: animate, spring: animate }, Easing: { out: value => value, cubic: value => value },
};
const progress = { name: 'Лео', onboarded: true, dailyGoal: 30, totalXP: 40, dailyXP: 10, streak: 2, completed: [], journeys: {}, retention: {}, reviewStats: {}, reviewQueue: {}, mistakes: [], settings: {}, stats: {}, activity: {} };
const progressStore = { getSnapshot: () => ({ progress, ready: true }), subscribe: () => () => {} };
let lastNotification = null;
let notificationAllowed = false;
const scheduledNotifications = new Map();
const notificationApi = {
  DEFAULT_ACTION_IDENTIFIER: 'default',
  SchedulableTriggerInputTypes: { DATE: 'date' },
  IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 },
  setNotificationHandler() {},
  getPermissionsAsync: async () => ({ granted: notificationAllowed }),
  getAllScheduledNotificationsAsync: async () => [...scheduledNotifications.values()],
  scheduleNotificationAsync: async notification => { scheduledNotifications.set(notification.identifier, notification); },
  cancelScheduledNotificationAsync: async id => { scheduledNotifications.delete(id); },
  getLastNotificationResponseAsync: async () => lastNotification,
  clearLastNotificationResponseAsync: async () => { lastNotification = null; },
  addNotificationResponseReceivedListener: callback => subscribe('notification', callback),
};
const actions = new Proxy({}, { get: (target, key) => target[key] || (target[key] = key === 'isUnlocked' ? () => true : () => {}) });
const providers = ({ children }) => children;
const progressApi = { useProgress: () => new Proxy({ progress }, { get: (target, key) => key in target ? target[key] : actions[key] }), useProgressSelector: selector => selector({ progress, ready: true }), useProgressStore: () => progressStore, useProgressActions: () => actions, ProgressProvider: providers };
const cloudApi = { useCloudBootstrap: () => false, useCloudSync: () => ({ status: 'offline', conflict: null }), CloudSyncProvider: providers };
let accountUser = null;
let canEnter = true;
let staffRole = null;
let licenseState = {};
const accountActions = [];
const journalRequests = [];
const journalAccounts = [];
const adminRequests = [];
const studyGroupRequests = [];
let groupFixture = null, learnerAssignments = [], studyNetwork = true;
const groupAssignment = { id: '00000000-0000-4000-8000-000000000011', topic_id: 'greetings',
  due_on: '2026-11-27', group_name: 'Рабочий английский', completed: 1, started: 0, errors: 2, answers: 5 };
const groupStudent = { id: 'student', name: 'Анна', email: 'student@example.com' };
const studyGroupsApi = {
  loadStudyAssignments: async () => studyNetwork ? { data: learnerAssignments } : { status: 0, error: {} },
  manageStudyGroups: async (action, options) => {
    studyGroupRequests.push({ action, options });
    if (action === 'list_groups') return { groups: groupFixture ? [groupFixture.group] : [], has_more: false };
    if (action === 'create_group') {
      groupFixture = { group: { id: 'work-group', name: options.name }, members: [], assignments: [] };
      return groupFixture.group;
    }
    if (action === 'group_detail') return { ...groupFixture };
    if (action === 'add_member') groupFixture.members = [groupStudent];
    else if (action === 'assign_topic') groupFixture.assignments = [groupAssignment];
    else if (action === 'assignment_report') return [{ ...groupStudent, status: 'completed', errors: 2, total: 5 }];
    else throw Error('Unexpected study group action: ' + action);
    return {};
  },
};
const eventRequests = [];
let publishedEvent = null, eventDraft = null, eventsNetwork = true, nextEventId = 101;
const studyEventsApi = {
  loadStudyEvents: async () => eventsNetwork ? { data: publishedEvent ? [publishedEvent] : [] } : { status: 0, error: {} },
  manageStudyEvents: async (action, options) => {
    eventRequests.push({ action, options });
    if (action === 'list') return [publishedEvent, eventDraft].filter(Boolean);
    if (action === 'save_draft') {
      const suffix = publishedEvent ? nextEventId++ : 99;
      eventDraft = { ...options, id: options.event_id || '00000000-0000-4000-8000-' + String(suffix).padStart(12, '0'), draft: true };
      return eventDraft;
    }
    if (action === 'publish') {
      publishedEvent = { ...options, id: options.event_id || '00000000-0000-4000-8000-000000000099',
        ends_on: new Date(Date.parse(options.starts_on) + (options.topics.length - 1) * 86400000).toISOString().slice(0, 10) };
      eventDraft = null;
      return publishedEvent;
    }
    if (action === 'report') return { joined: 3, started: 2, finished: 1, days: [{ index: 0, completed: 2, items: [] }] };
    throw Error('Unexpected event action: ' + action);
  },
};
const profileRequests = [];
let profileInCloud = true;
let manualGrantAttempts = 0;
let studentLicense = { licensed: false, revoked_at: '2026-11-20T10:00:00Z' };
let verifyRealAccess = false;
const testAuthKey = 'test-supabase-auth-token';
let authResult, rpcResult, authListener;
let statusRequests = 0;
const apiDouble = {
  auth: {
    getSession: async () => authResult,
    onAuthStateChange: listener => { authListener = listener; return { data: { subscription: { unsubscribe() { authListener = null; } } } }; },
    startAutoRefresh() {},
    stopAutoRefresh() {},
  },
  rpc(name) {
    assert.equal(name, 'lingo_access_status');
    statusRequests++;
    return { abortSignal: async () => rpcResult };
  },
};
const authApi = { useAuth: () => ({ ready: true, user: accountUser, guestMode: true,
  signUp: async (...args) => { accountActions.push(args); return { data: { session: null } }; },
  updateDisplayName: async name => { accountActions.push(name); return {}; },
}), AuthProvider: providers };
const accessApi = { AccessProvider: providers, useAccess: () => ({ ...licenseState, allowed: canEnter, isAdmin: !!staffRole, role: staffRole, redeem: async code => {
    assert.equal(code, 'PROMO-TEST');
    canEnter = true;
    const checkedAt = Date.now();
    licenseState = { licensed: true, expires_at: new Date(checkedAt + 864000000).toISOString(), verifiedAt: checkedAt, offlineUntil: checkedAt + 604800000 };
    return {};
  } }),
  loadAdminProfile: async (userId, signal) => {
    profileRequests.push({ userId, signal });
    return {
      account: { id: userId, name: 'Анна', email: 'student@example.com', licensed: false },
      cloud: profileInCloud ? {
        summary: { totalXP: 135, streak: 3, learnerLevel: 'A2' }, stats: {}, settings: {}, completed: ['greetings'],
        lesson_results: { greetings: { bestAccuracy: 80 } }, journey_stages: { greetings: 2 },
        level_exam_best: { A1: 28 }, counts: {}, words: [{ english: 'queue', russian: 'очередь' }],
        activity: { '2026-11-20': 3 },
      } : null,
    };
  },
  manageAccess: async (action, options) => {
    adminRequests.push({ action, options });
    if (action === 'list_promos') {
      return options.filter === 'active' ? [{ id: 'promo-1', label: 'Тестовый промокод', suffix: 'AA01',
        status: 'active', remaining: 2, use_limit: 3, used: 1 }] : [];
    }
    if (action === 'list_users') {
      return { users: [{ id: 'student', name: 'Анна', email: 'student@example.com', confirmed: true, ...studentLicense }], has_more: false };
    }
    if (action === 'list_role_events') {
      return { events: [{ id: 'event-role', occurred_at: '2026-11-20T10:00:00Z', before_role: null, after_role: 'admin',
        target_email: 'helper@example.com', actor_email: 'owner@example.com' }], has_more: false };
    }
    if (action === 'grant_license') {
      if (++manualGrantAttempts === 1) throw new Error('Network request failed');
      studentLicense = { licensed: true, expires_at: '2027-01-01T10:00:00Z', revoked_at: null };
      return { name: 'Анна', email: options.email, ...studentLicense };
    }
    throw Error('Unexpected admin action: ' + action);
  },
  loadAccessEvents: async (cursor, email) => {
    journalRequests.push(cursor);
    journalAccounts.push(email);
    return cursor ? {
      events: [{ id: 'event-1', occurred_at: '2026-11-20T09:00:00Z', kind: 'promo_redeemed', historical: true,
        promo_label: 'Первый код', promo_suffix: 'AB12', target_email: 'student@example.com', actor_email: 'student@example.com' }],
      has_more: false,
    } : {
      events: [{ id: 'event-2', occurred_at: '2026-11-20T10:00:00Z', kind: 'license_revoked',
        expires_at: '2026-11-25T10:00:00Z', actor_email: 'admin@example.com', target_email: 'student@example.com' }],
      has_more: true,
      ...(email && { license: studentLicense }),
    };
  },
};
const cache = new Map();
const dynamicImports = ({ types: t }) => ({ visitor: { CallExpression(p) { if (p.node.callee.type === 'Import') p.replaceWith(t.callExpression(t.memberExpression(t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('resolve')), []), t.identifier('then')), [t.arrowFunctionExpression([], t.callExpression(t.identifier('require'), p.node.arguments))])); } } });
function load(filename) {
  const absolute = path.resolve(filename);
  const file = [absolute, absolute + '.js', absolute + '.json'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) throw new Error('Missing module: ' + filename);
  if (file.endsWith('/store/ProgressContext.js')) return progressApi;
  if (file.endsWith('/store/CloudSyncContext.js')) return cloudApi;
  if (file.endsWith('/lib/supabase.js')) return { supabase: apiDouble, authStorageKey: testAuthKey };
  if (file.endsWith('/services/studyGroups.js')) return studyGroupsApi;
  if (file.endsWith('/services/studyEvents.js')) return studyEventsApi;
  if (!verifyRealAccess && file.endsWith('/store/AuthContext.js')) return authApi;
  if (!verifyRealAccess && file.endsWith('/store/AccessContext.js')) return accessApi;
  if (file.endsWith('/services/localAi.js')) return tutorApi;
  if (file.endsWith('/services/offlineSpeech.js')) return { getReadySpeechModel: async () => null, cancelSpeechRecording: async () => {}, resumeSpeechModelDownload: async () => {} };
  if (/\/(?:VoiceCoachScreen|AICenterScreen|PronunciationLabScreen|SpeechModelsScreen|AIDirectorScreen)\.js$/.test(file)) return { default: () => null };
  if (file.endsWith('/utils/speech.js')) return { speak(text, options) { speechCalls.push({ text, options }); }, stopSpeech() {} };
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  if (file.endsWith('.json')) { module.exports = JSON.parse(fs.readFileSync(file, 'utf8')); return module.exports; }
  const compiled = transformSync(fs.readFileSync(file, 'utf8'), { filename: file, babelrc: false, configFile: false, plugins: [[require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], dynamicImports, require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
  const resolve = name => {
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
    if (name === 'react-native') return native;
    if (name === '@react-native-async-storage/async-storage') return asyncStorage;
    if (name === 'react-native-safe-area-context') return { SafeAreaProvider: providers, SafeAreaView: native.View };
    if (name === '@expo/vector-icons') return { Ionicons: host('Icon') };
    if (name === 'expo-linear-gradient') return { LinearGradient: host('Gradient') };
    if (name === 'expo-status-bar') return { StatusBar: host('StatusBar') };
    if (name === 'expo-haptics') return { notificationAsync() {}, NotificationFeedbackType: {} };
    if (name === 'expo-speech-recognition') return { useSpeechRecognitionEvent() {}, ExpoSpeechRecognitionModule: {} };
    if (name === 'expo-clipboard') return { setStringAsync: async () => {} };
    if (name === 'expo-notifications') return notificationApi;
    if (name === 'expo-document-picker' || name === 'expo-sharing' || name === 'expo-audio') return {};
    if (name === 'expo-file-system/legacy') return { documentDirectory: '/documents/' };
    return require(name);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, module, module.exports);
  return module.exports;
}
const theme = load('src/theme.js');
Object.assign(tutorApi, { AI_MODELS: load('src/data/aiModels.js').AI_MODELS, getDownloadState: () => ({ status: 'idle', modelId: null, progress: 0 }), subscribeToDownload: () => () => {}, getFreeSpace: async () => 20000000000, restorePendingModelDownload: async () => {}, inspectModels: async () => ({ light: { installed: true } }), getActiveModelId: async () => "light", unloadModel: async () => {}, downloadModel: async model => modelDownloads.push(model.id) });
const { palettes, foregroundFor } = load('src/design/palettes.js');
const luminance = hex => {
  const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
for (const [mode, palette] of Object.entries(palettes)) {
  for (const background of ['background', 'card', 'cardLight']) for (const foreground of ['text', 'textMuted']) assert.ok(contrast(palette[foreground], palette[background]) >= 4.5, `${mode}: ${foreground}/${background}`);
  for (const [foreground, background] of [['purple', 'accentSoft'], ['mint', 'successSoft'], ['orange', 'warningSoft'], ['pink', 'dangerSoft'], ['onAccent', 'accentFill']]) assert.ok(contrast(palette[foreground], palette[background]) >= 4.5, `${mode}: ${foreground}/${background}`);
  assert.ok(contrast(palette.disabledText, palette.disabledBackground) >= 4.5, `${mode}: disabled button label`);
  assert.ok(contrast(palette.buttonBorder, palette.card) >= 3, `${mode}: secondary button boundary`);
}
for (const color of ['#6845DE', '#FF9F43', '#2ED3B7', '#FFFFFF', '#000000', '#7C5CFC', '#36B8D9', '#D15BE3']) assert.ok(contrast(foregroundFor(color), color) >= 4.5, `custom button ${color}`);
const { ScreenEntrance } = load('src/components/Motion.js');
let controls, setInput, setTransition, mounted = 0, factories = 0;
const styles = theme.createThemedStyles(() => { factories++; return { text: { color: theme.colors.text }, surface: { backgroundColor: theme.colors.card, borderRadius: 20 } }; });
function Probe() {
  controls = theme.useTheme();
  const [input, update] = React.useState(''); setInput = update;
  const [transition, updateTransition] = React.useState('first'); setTransition = updateTransition;
  React.useEffect(() => { mounted++; }, []);
  return React.createElement(ScreenEntrance, { transitionKey: transition }, React.createElement(native.TextInput, { testID: 'theme-probe', value: input, style: styles.text }));
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
async function main() {
  storage.set('@lingospark/appearance-v1', JSON.stringify({ mode: 'light' }));
  let tree;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe))); await flush(); });
  assert.equal(controls.scheme, 'light'); const light = styles.text;
  await act(async () => setInput('Keep this answer'));
  await act(async () => { controls.setMode('dark'); await flush(); });
  assert.equal(controls.scheme, 'dark'); assert.notEqual(styles.text.color, light.color);
  assert.equal(tree.root.findByType('TextInput').props.value, 'Keep this answer'); assert.equal(mounted, 1, 'theme changes must not remount the input');
  await act(async () => { controls.setMode('light'); await flush(); });
  assert.equal(styles.text, light, 'style objects must be cached per palette'); assert.equal(factories, 2);
  await act(async () => { controls.setMode('pink'); await flush(); });
  assert.equal(controls.scheme, 'pink'); assert.equal(override, 'light', 'pink mode must use light native controls');
  assert.equal(styles.text.color, palettes.pink.text); assert.equal(factories, 3);
  assert.equal(tree.root.findByType('TextInput').props.value, 'Keep this answer'); assert.equal(mounted, 1);
  await act(async () => { system = 'dark'; emit('appearance', { colorScheme: 'dark' }); });
  assert.equal(controls.scheme, 'pink', 'explicit pink mode must not follow system changes');
  await act(async () => { controls.setMode('system'); await flush(); system = 'dark'; emit('appearance', { colorScheme: system }); });
  assert.equal(controls.scheme, 'dark');
  await act(async () => { controls.setMode('light'); await flush(); system = 'dark'; emit('appearance', { colorScheme: 'dark' }); });
  assert.equal(controls.scheme, 'light', 'explicit mode must ignore system changes');
  await act(async () => { controls.setMode('dark'); controls.setReduceMotion(true); await flush(); });
  assert.deepEqual(JSON.parse(storage.get('@lingospark/appearance-v1')), { mode: 'dark', reduceMotion: true }, 'rapid preference changes must preserve both settings');
  await act(async () => { controls.setReduceMotion(false); reduced = true; emit('motion', true); await flush(); });
  assert.equal(controls.reduceMotion, true, 'system reduced motion must take precedence');
  animations.length = 0;
  await act(async () => setTransition('second'));
  assert.equal(animations.length, 0, 'reduced motion must suppress transitions');
  await act(async () => { reduced = false; emit('motion', false); });
  animations.length = 0;
  await act(async () => setTransition('third'));
  assert.ok(animations.some(options => options.duration === 220 && options.useNativeDriver), 'transitions must use the native driver');
  await act(async () => tree.unmount());

  const Home = load('src/screens/HomeScreen.js').default;
  const Learning = load('src/screens/LearningHomeScreen.js').default;
  const Profile = load('src/screens/ProfileScreen.js').default;
  const Settings = load('src/screens/ExpansionScreens.js').SettingsScreen;
  const callbacks = new Proxy({}, { get: () => () => {} });
  for (const Component of [Home, Learning, Profile, Settings]) {
    const props = Object.fromEntries(['onJourney', 'onLearningHub', 'onSearch', 'onBookmarks', 'onQuickSession', 'onStartStudy', 'onTenses', 'onNavigate', 'onSettings', 'onAccount', 'onRetention', 'onReview', 'onAdaptive'].map(key => [key, callbacks[key]]));
    await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(Component, props))); await flush(); });
    assert.ok(tree.toJSON(), Component.name);
    for (const mode of ['light', 'dark', 'pink']) {
      await act(async () => { controls.setMode(mode); await flush(); });
      assert.equal(controls.scheme, mode);
      const color = tree.root.findAllByType('TextInput').find(node => node.props.testID === 'theme-probe').props.style.color;
      assert.equal(color, palettes[mode].text);
    }
    await act(async () => tree.unmount());
  }
  let homeStarts = 0;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Home, { onStartStudy: target => { assert.equal(target.type, 'journey'); homeStarts++; } }))); await flush(); });
  const startButtons = tree.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel === 'Начать следующий этап');
  assert.equal(startButtons.length, 1, 'Home must have one primary start');
  await act(async () => startButtons[0].props.onPress());
  assert.equal(homeStarts, 1);
  await act(async () => tree.unmount());
  // Regression for the screenshot: pale secondary buttons must not use white
  // labels, and disabled buttons must remain legible without group opacity.
  const Journey = load('src/screens/LearningJourneyScreen.js').default;
  const UI = load('src/components/UI.js');
  const flatten = style => Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean).map(flatten)) : style || {};
  const namedButton = label => tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === label));
  const Explanation = load('src/components/ExplanationCard.js').default;
  const mistakenExercise = { id: 'feedback-order', type: 'translate', prompt: 'Переведи: Hello', answer: 'Привет', explanation: 'Hello — нейтральное приветствие.' };
  const concreteFeedback = load('src/utils/errorFeedback.js').errorFeedback(mistakenExercise, 'Пока');
  for (const showStatus of [true, false]) {
    await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Explanation, { item: mistakenExercise, selected: 'Пока', correct: false, showStatus }))); await flush(); });
    assert.equal(tree.root.findAllByType('Text').filter(node => node.props.children === concreteFeedback.text).length, 1, 'show the concrete mistake once, also when the parent owns the status header');
    assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'Допустимый ответ'));
    await act(async () => tree.unmount());
  }
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(Journey, { topicId: 'greetings' }))); await flush(); });
  for (const mode of ['light', 'dark', 'pink']) {
    await act(async () => { controls.setMode(mode); await flush(); });
    for (const label of ['Проверки памяти и расписание', 'Открыть «Английскую жизнь»', 'Самопроверка темы']) {
      const button = namedButton(label), surface = flatten(button.props.style);
      const ink = flatten(button.findAllByType('Text').find(text => text.props.children === label).props.style).color;
      assert.ok(contrast(ink, surface.backgroundColor) >= 4.5, `${mode}: ${label} label`);
      assert.equal(surface.opacity, undefined, 'disabled buttons must not fade the entire control');
      assert.ok(surface.borderWidth >= 1);
      if (label === 'Самопроверка темы') { assert.equal(button.props.disabled, true); assert.equal(button.props.accessibilityState.disabled, true); assert.ok(button.findAllByType('Icon').some(icon => icon.props.name === 'lock-closed-outline')); }
      else { assert.equal(button.props.disabled, false); assert.ok(contrast(surface.borderColor, surface.backgroundColor) >= 3); }
    }
  }
  await act(async () => tree.unmount());
  storage.set('@lingospark/appearance-v1', JSON.stringify({ mode: 'pink', reduceMotion: false }));
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(UI.PrimaryButton, { title: 'Motion check', onPress() {} }))); await flush(); });
  assert.equal(controls.scheme, 'pink', 'pink choice must survive a new provider instance');
  const motionButton = namedButton('Motion check');
  animations.length = 0;
  await act(async () => { motionButton.props.onPressIn({}); motionButton.props.onPressOut({}); });
  assert.ok(animations.some(options => options.duration === 90 && options.useNativeDriver));
  assert.ok(animations.some(options => options.stiffness === 340 && options.overshootClamping && options.useNativeDriver));
  await act(async () => controls.setReduceMotion(true));
  animations.length = 0;
  await act(async () => { motionButton.props.onPressIn({}); motionButton.props.onPressOut({}); });
  assert.equal(animations.length, 0, 'button feedback must honor reduced motion');
  await act(async () => tree.unmount());
  // Saved answers stay available, but do not reopen an exercise automatically.
  const Dictionary = load('src/screens/AdvancedScreens.js').VocabularyScreen;
  const Row = load('src/components/DictionaryWordRow.js').default;
  const OriginalRow = Row.type, rowRenders = new Map();
  Row.type = props => { rowRenders.set(props.word.id, (rowRenders.get(props.word.id) || 0) + 1); return React.createElement(OriginalRow, props); };
  const bank = load('src/data/wordBank.js');
  const createDictionary = () => React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(Dictionary, { onClose() {} }));
  await act(async () => { tree = Renderer.create(createDictionary()); await flush(); });
  assert.equal(tree.root.findByType('FlatList').props.data.length, bank.extendedWordBankSize, 'the dictionary must open in full-catalog mode without capping FlatList');
  const beforeExpand = new Map(rowRenders);
  const firstRow = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel?.startsWith('the, '));
  await act(async () => firstRow.props.onPress());
  for (const [id, count] of beforeExpand) if (id !== 'bank-0') assert.equal(rowRenders.get(id), count, 'expanding one word must not rerender unaffected cards');
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === 'The book is on the table.'));
  await act(async () => namedButton('Пример в разговоре').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'The book is on the table.'));
  await act(async () => namedButton('Послушать пример').props.onPress());
  assert.equal(speechCalls.at(-1).text, 'The book is on the table.');
  const searchInput = () => tree.root.findAllByType('TextInput').find(node => node.props.placeholder === 'English или русский перевод');
  await act(async () => { searchInput().props.onChangeText('щетка'); await flush(); });
  assert.equal(tree.root.findByType('FlatList').props.data[0].english, 'toothbrush');
  await act(async () => { searchInput().props.onChangeText(''); await flush(); });
  await act(async () => namedButton(`Основные · ${bank.wordBankSize.toLocaleString('ru-RU')}`).props.onPress());
  assert.equal(tree.root.findByType('FlatList').props.data.length, bank.wordBankSize);
  await act(async () => namedButton(`Вся база · ${bank.extendedWordBankSize.toLocaleString('ru-RU')}`).props.onPress());
  await act(async () => { searchInput().props.onChangeText('lullaby'); await flush(); });
  assert.equal(tree.root.findByType('FlatList').props.data[0].id, 'dictionary-lullaby');
  await act(async () => { searchInput().props.onChangeText('стойка регистрации'); await flush(); });
  assert.equal(tree.root.findByType('FlatList').props.data[0].id, 'phrase-pack-front-desk');
  await act(async () => { searchInput().props.onChangeText('pick up'); await flush(); });
  await act(async () => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel?.startsWith('pick up, ')).props.onPress());
  await act(async () => namedButton('Примеры по значениям · 3').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'поднять трубку'));
  await act(async () => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Послушать пример: поднять трубку').props.onPress());
  assert.equal(speechCalls.at(-1).text, "Please pick up. It's urgent.");
  await act(async () => { searchInput().props.onChangeText(''); await flush(); });
  await act(async () => namedButton('Выражения').props.onPress());
  assert.equal(tree.root.findByType('FlatList').props.data.length, 72, 'the expressions filter shows all six phrase packs');
  await act(async () => namedButton('Все слова').props.onPress());
  await act(async () => { searchInput().props.onChangeText(''); await flush(); });
  assert.equal(tree.root.findByType('FlatList').props.data.length, bank.extendedWordBankSize);
  for (const mode of ['light', 'dark', 'pink']) {
    await act(async () => { controls.setMode(mode); await flush(); });
    assert.equal(searchInput().props.value, '');
    assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'Новое'));
  }
  await act(async () => tree.unmount());
  const today = new Date().toISOString().slice(0, 10);
  progress.reviewStats = { 'extra-backpack': { dueDate: today, interval: 14, successfulDays: 3 } };
  await act(async () => { tree = Renderer.create(createDictionary()); await flush(); });
  await act(async () => namedButton('Пора повторить').props.onPress());
  assert.deepEqual(tree.root.findByType('FlatList').props.data.map(word => word.english), ['backpack']);
  await act(async () => namedButton('Освоено').props.onPress());
  assert.equal(tree.root.findByType('FlatList').props.data.length, 0, 'due words must not also appear in mastered filter');
  await act(async () => tree.unmount());
  progress.reviewStats = {};
  const Review = load('src/screens/ReviewScreen.js').default;
  progress.wordPreferences = { favorites: ['extra-backpack'] };
  const savedWords = [], reviewedWords = [];
  const oldSave = actions.saveWordSession, oldReview = actions.recordReview;
  actions.saveWordSession = draft => savedWords.push(draft);
  actions.recordReview = (...args) => reviewedWords.push(args);
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(Review))); await flush(); });
  await act(async () => namedButton('Избранные').props.onPress());
  await act(async () => namedButton('Начать · 1 слово').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'backpack'));
  assert.equal(savedWords.at(-1).deck[0].id, 'extra-backpack');
  assert.ok(load('src/utils/wordSession.js').readWordSession(savedWords.at(-1)).deck, 'new words must produce restorable sessions');
  for (const mode of ['light', 'dark', 'pink']) {
    await act(async () => { controls.setMode(mode); await flush(); });
    assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'рюкзак'));
  }
  await act(async () => namedButton('Запомнил — проверить').props.onPress());
  await act(async () => tree.root.findAllByType('TextInput').find(node => node.props.placeholder === 'Перевод на русском…').props.onChangeText('рюкзак'));
  await act(async () => namedButton('Проверить перевод').props.onPress());
  assert.equal(reviewedWords.length, 1);
  assert.equal(reviewedWords[0][0].id, 'extra-backpack');
  assert.equal(reviewedWords[0][1], true, 'new word translation must be accepted');
  await act(async () => tree.unmount());
  delete progress.wordPreferences;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Review))); await flush(); });
  await act(async () => namedButton('В гостинице').props.onPress());
  await act(async () => namedButton('Начать · 10 слов').props.onPress());
  assert.ok(savedWords.at(-1).deck.every(card => card.themeId === 'phrases-hotel' && card.exampleRu), 'the themed drill uses its own phrases and Russian examples');
  assert.ok(load('src/utils/wordSession.js').readWordSession(savedWords.at(-1)).deck, 'a phrase session can be reopened');
  await act(async () => tree.unmount());
  actions.saveWordSession = oldSave; actions.recordReview = oldReview;
  delete progress.wordPreferences;
  const Library = load('src/screens/AITutorScreen.js').ModelLibrary;
  const models = tutorApi.AI_MODELS, chosenModels = [];
  const libraryProps = { installed: {}, activeId: null, onRefresh: async () => {}, onStart: model => chosenModels.push(model.id) };
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Probe), React.createElement(Library, libraryProps))); await flush(); });
  const sourceLinks = () => tree.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel?.startsWith('Источник '));
  assert.equal(sourceLinks().length, 3, 'show three new models by default');
  assert.equal(modelDownloads.length, 0, 'opening the library must not download anything');
  assert.equal(chosenModels.length, 0, 'opening the library must not select a model');
  await act(async () => sourceLinks()[0].props.onPress());
  assert.equal(openedLinks.at(-1), models[0].sourceUrl);
  const licenseButton = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === `Условия ${models[0].shortTitle}`);
  await act(async () => licenseButton.props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => typeof node.props.children === 'string' && node.props.children.startsWith('LLAMA 3.2 COMMUNITY LICENSE AGREEMENT')));
  await act(async () => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Закрыть условия').props.onPress());
  const modelCard = tree.root.findAllByType('View').filter(node => node.findAllByType('Text').some(text => text.props.children === models[0].model) && node.findAllByType('Text').some(text => text.props.children === 'Скачать модель')).at(-1);
  await act(async () => modelCard.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Скачать модель')).props.onPress());
  assert.deepEqual(modelDownloads, [models[0].id]);
  assert.equal(chosenModels.length, 0, 'downloading must not open a chat automatically');
  await act(async () => namedButton('Показать прежние модели Qwen').props.onPress());
  assert.equal(sourceLinks().length, 6);
  await act(async () => { controls.setMode('pink'); await flush(); });
  assert.equal(sourceLinks().length, 6, 'theme change must preserve the model list selection');
  await act(async () => tree.unmount());
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Library, { ...libraryProps, activeId: 'light', installed: { light: { installed: true } } }))); await flush(); });
  assert.equal(sourceLinks().length, 4, 'already installed legacy model must remain accessible without expanding the list');
  await act(async () => namedButton('Продолжить диалог').props.onPress());
  assert.deepEqual(chosenModels, ['light']);
  await act(async () => tree.unmount());
  const ContextDialogues = load('src/screens/ContextDialoguesScreen.js').default;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(ContextDialogues))); await flush(); });
  await act(async () => namedButton('Найти дорогу к вокзалу').props.onPress());
  await act(async () => { namedButton('Начать практику').props.onPress(); await flush(); });
  await act(async () => namedButton('Послушать собеседника').props.onPress());
  assert.equal(speechCalls.at(-1).text, 'Hi there. Do you need help?');
  await act(async () => namedButton('Подсказка').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => [node.props.children].flat().includes('How do I get to…?')));
  const dialogueInput = () => tree.root.findByType('TextInput');
  await act(async () => dialogueInput().props.onChangeText('How can I get to the airport?'));
  await act(async () => namedButton('Ответить').props.onPress());
  assert.ok(namedButton('Исправить реплику'));
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === 'How do I get to the station?'));
  await act(async () => namedButton('Исправить реплику').props.onPress());
  assert.equal(dialogueInput().props.value, 'How can I get to the airport?');
  assert.equal(dialogueInput().props.editable, true);
  await act(async () => dialogueInput().props.onChangeText('Could you please tell me how to reach the railway station?'));
  await act(async () => namedButton('Ответить').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'Ответ верный'));
  await act(async () => tree.unmount());
  // Actual chat UI: measured keyboard position, draft retention and cancellation.
  const Chat = load('src/screens/AITutorScreen.js').TutorChat;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Chat, { model: { id: 'light', title: 'Лёгкий', color: '#6544DB' } })), { createNodeMock: element => element.type === 'View' ? { measureInWindow: callback => callback(0, 59, 390, 751) } : { scrollToEnd() {} } }); await flush(); });
  const chatInput = () => tree.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Сообщение Lingo');
  const chatButton = label => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === label);
  assert.equal(chatInput().props.inputAccessoryViewID, undefined);
  await act(async () => chatInput().props.onChangeText('hi'));
  await act(async () => emit('keyboardWillChangeFrame', { duration: 250, endCoordinates: { height: 320, screenY: 524 } }));
  const chatRoot = () => tree.root.findAllByType('View').find(node => node.props.collapsable === false);
  assert.equal(flatten(chatRoot().props.style).paddingBottom, 286);
  assert.equal(chatInput().props.value, 'hi');
  assert.ok(chatButton('Скрыть клавиатуру'));
  await act(async () => emit('keyboardWillChangeFrame', { endCoordinates: { height: 320, screenY: 844 } }));
  assert.equal(flatten(chatRoot().props.style).paddingBottom, 0, 'offscreen keyboard frame must restore the normal composer');
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  assert.ok(chatButton('Остановить ответ'));
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'Hello! Would you like to talk about food or travel?' }); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'Hello! Would you like to talk about food or travel?'));
  assert.ok(!tree.root.findAllByType('Text').some(node => ['Проверено по контексту', 'Опора на справочник'].includes(node.props.children)));
  const beforeTranslation = tree.root.findByType('FlatList').props.data;
  await act(async () => namedButton('Действия').props.onPress());
  await act(async () => { namedButton('Перевод').props.onPress(); await flush(); });
  const translationRequest = tutorRequests.at(-1);
  assert.equal(translationRequest.args.messages.at(-1).translationSource, 'Hello! Would you like to talk about food or travel?');
  await act(async () => { translationRequest.resolve({ text: 'Привет! Хочешь поговорить о еде или путешествиях?' }); await flush(); });
  const afterTranslation = tree.root.findByType('FlatList').props.data;
  assert.deepEqual(afterTranslation.map(item => item.id), beforeTranslation.map(item => item.id), 'translate in place without adding a dialogue turn');
  assert.equal(afterTranslation.at(-1).translation, 'Привет! Хочешь поговорить о еде или путешествиях?');
  await act(async () => chatInput().props.onChangeText('what'));
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'I mean: which topic do you prefer, food or travel?' }); await flush(); });
  await act(async () => chatInput().props.onChangeText('stop this reply'));
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  const stopped = tutorRequests.at(-1);
  await act(async () => chatButton('Остановить ответ').props.onPress());
  assert.equal(stopped.args.signal.aborted, true);
  await act(async () => { stopped.resolve({ text: 'Late reply that must not be shown.' }); await flush(); });
  assert.ok(!tree.root.findByType('FlatList').props.data.some(item => item.content === 'Late reply that must not be shown.'));
  await act(async () => chatInput().props.onChangeText('please try'));
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  await act(async () => { tutorRequests.at(-1).reject(new Error('Модель не смогла сформировать ответ')); await flush(); });
  const retryButton = namedButton('Повторить ответ');
  const editReplyButton = namedButton('Изменить реплику');
  const chatErrorView = tree.root.findAllByType('View').find(node => node.props.accessibilityLiveRegion === 'polite'
    && node.findAllByType('Text').some(text => text.props.children === 'Модель не смогла сформировать ответ'));
  assert.ok(chatErrorView);
  assert.notEqual(flatten(chatErrorView.props.style).flexDirection, 'row', 'message and actions must not compete in one row');
  const errorActions = chatErrorView.findAllByType('View').find(node => flatten(node.props.style).flexWrap === 'wrap');
  assert.ok(errorActions.findAllByType('Pressable').includes(retryButton));
  assert.ok(errorActions.findAllByType('Pressable').includes(editReplyButton));
  assert.equal(load('src/utils/performance.js').performanceSummary().find(item => item.name === 'ai_reply_failed').count, 1);

  const userCount = tree.root.findByType('FlatList').props.data.filter(item => item.role === 'user').length;
  await act(async () => { namedButton('Повторить ответ').props.onPress(); await flush(); });
  assert.equal(tutorRequests.at(-1).args.messages.filter(item => item.role === 'user').length, userCount, 'retry must not insert the learner message twice');
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'Let’s try again. What did you enjoy today?' }); await flush(); });
  await act(async () => chatInput().props.onChangeText('My name Ana'));
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  await act(async () => { tutorRequests.at(-1).reject(new Error('Ошибка ответа')); await flush(); });
  await act(async () => namedButton('Изменить реплику').props.onPress());
  assert.equal(chatInput().props.value, 'My name Ana');
  assert.ok(!tree.root.findByType('FlatList').props.data.some(item => item.content === 'My name Ana'));
  await act(async () => chatInput().props.onChangeText('My name Anna'));
  await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'Nice to meet you, Anna.' }); await flush(); });
  await act(async () => namedButton('Закрепить на новой фразе').props.onPress());
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'My name is Nina.'));
  await act(async () => namedButton('Повторить завтра').props.onPress());
  assert.ok(namedButton('Добавлено на завтра'));
  assert.equal(namedButton('A2'), undefined, 'level controls must not take space in the chat');
  await act(async () => chatButton('Инструменты разговора').props.onPress());
  await act(async () => namedButton('Настройки диалога').props.onPress());
  assert.ok(namedButton('A2').props.accessibilityState.selected);
  await act(async () => namedButton('B1').props.onPress());
  assert.ok(namedButton('B1').props.accessibilityState.selected);
  await act(async () => namedButton('Собеседование').props.onPress());
  assert.equal(namedButton('B1'), undefined, 'starting an interview closes the settings');
  const containsText = text => tree.root.findAllByType('Text').some(node => String(React.Children.toArray(node.props.children).join('')).includes(text));
  assert.ok(containsText('шаг 1 из 3'));
  await act(async () => namedButton('Подсказка').props.onPress());
  assert.ok(containsText('My background is in'));
  const interviewTurn = async (input, reply) => {
    await act(async () => chatInput().props.onChangeText(input));
    await act(async () => { chatButton('Отправить сообщение').props.onPress(); await flush(); });
    const request = tutorRequests.at(-1);
    await act(async () => { request.resolve({ text: reply }); await flush(); });
    return request.args;
  };
  const clarification = await interviewTurn('what?', 'I mean: what kind of work have you done?');
  assert.match(clarification.scenarioContext, /Help the candidate/);
  assert.ok(containsText('шаг 1 из 3'));
  const intro = await interviewTurn('I am have experience working with customers.', 'Customer service experience is relevant to this role.');
  assert.match(intro.scenarioContext, /React to a concrete detail/);
  assert.equal(intro.messages.at(-1).interviewStepId, 'intro');
  assert.ok(containsText('шаг 2 из 3'));
  assert.ok(!containsText('My background is in'));
  await interviewTurn('Last year, I helped a customer solve a problem.', 'Thanks for sharing that customer example.');
  assert.ok(containsText('шаг 3 из 3'));
  await interviewTurn('Could you tell me about the team?', 'You would join a small customer support team.');
  assert.ok(containsText('Итог собеседования'));
  assert.ok(containsText('Удачная фраза — «Last year, I helped'));
  assert.ok(containsText('Исправление — «I have experience working with customers.'));
  assert.ok(containsText('Как сказать «У меня есть опыт работы с клиентами»?'));
  assert.equal(chatInput(), undefined, 'finished interview replaces the composer with its review');
  const finishedInterview = tree.root.findByType('FlatList').props.data;
  const interviewerReply = finishedInterview.find(item => item.role === 'assistant' && !item.id.startsWith('welcome'));
  await act(async () => namedButton('Действия').props.onPress());
  await act(async () => { namedButton('Перевод').props.onPress(); await flush(); });
  assert.equal(tutorRequests.at(-1).args.messages.at(-1).translationSource, interviewerReply.content);
  assert.equal(chatInput(), undefined, 'translation must not reopen the finished interview composer');
  assert.ok(chatButton('Остановить ответ'));
  await act(async () => { tutorRequests.at(-1).reject(new Error('Перевод не получен')); await flush(); });
  await act(async () => { namedButton('Повторить перевод').props.onPress(); await flush(); });
  assert.equal(tutorRequests.at(-1).args.messages.at(-1).translationSource, interviewerReply.content);
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'Я спрашиваю, где ты работал.' }); await flush(); });
  const translatedInterview = tree.root.findByType('FlatList').props.data;
  assert.deepEqual(translatedInterview.map(item => item.id), finishedInterview.map(item => item.id));
  assert.equal(translatedInterview.find(item => item.id === interviewerReply.id).translation, 'Я спрашиваю, где ты работал.');
  assert.ok(containsText('Итог собеседования'));
  assert.equal(chatInput(), undefined);
  await act(async () => namedButton('Начать новое собеседование').props.onPress());
  assert.ok(containsText('шаг 1 из 3'));
  await act(async () => tree.unmount());
  const { greetingJourney } = load('src/data/learningJourney.js');
  const coursePractice = { ...greetingJourney.ai, topicId: greetingJourney.id, goal: greetingJourney.goal, requestId: 'test-goal' };
  await act(async () => {
    tree = Renderer.create(React.createElement(theme.ThemeProvider, null,
      React.createElement(Chat, { model: { id: 'light', title: 'Лёгкий', color: '#6544DB' }, practice: coursePractice })));
    await flush();
  });
  const goalToggle = chatButton('Раскрыть цель урока');
  assert.equal(goalToggle.props.accessibilityState.expanded, false);
  assert.equal(namedButton('Нужен намёк'), undefined);
  await act(async () => goalToggle.props.onPress());
  await act(async () => namedButton('Нужен намёк').props.onPress());
  await act(async () => chatInput().props.onChangeText('My name is Anna'));
  await act(async () => chatButton('Свернуть цель урока').props.onPress());
  assert.equal(namedButton('Покажи начало фразы'), undefined);
  assert.equal(chatInput().props.value, 'My name is Anna');
  await act(async () => chatButton('Раскрыть цель урока').props.onPress());
  assert.ok(namedButton('Покажи начало фразы'), 'collapsing the goal must preserve hint progress');
  await act(async () => tree.unmount());
  await act(async () => {
    tree = Renderer.create(React.createElement(theme.ThemeProvider, null,
      React.createElement(Chat, { model: { id: 'light', title: 'Лёгкий', color: '#6544DB' } })));
    await flush();
  });
  assert.equal(chatInput().props.value, 'My name is Anna', 'draft survives leaving the chat tab');
  assert.equal(tree.root.findByType('FlatList').props.data[0].content, coursePractice.opening, 'restored draft stays in its original conversation');
  await act(async () => tree.unmount());
  const Practice = load('src/screens/PracticeScreen.js').default;
  const savedExercise = { id: 'draft-question', type: 'translate', prompt: 'A saved exercise', answer: 'Hello' };
  progress.practiceDrafts = { 'common-practice': { version: 1, id: 'saved-attempt', mode: 'learn', deck: [savedExercise], index: 0, input: 'Hel', built: [], checked: false, responses: [], seed: 1 } };
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Practice, { onClose() {} }))); await flush(); });
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt));
  const resume = tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Продолжить сохранённое занятие'));
  await act(async () => { resume.props.onPress(); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt));
  assert.equal(tree.root.findByType('TextInput').props.value, 'Hel');
  await act(async () => tree.unmount());
  // Actual App navigation with native APIs mocked: a saved route is ignored,
  // backgrounding preserves the live screen, and a new mount starts at Today.
  storage.set('@lingospark/navigation-v1', JSON.stringify({ tab: 'ai', overlay: { type: 'review' }, recentScreens: [] }));
  const App = load('App.js').default;
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  const homeSelected = () => tree.root.findAllByType('Pressable').some(node => node.props.accessibilityLabel === 'Сегодня' && node.props.accessibilityState?.selected);
  assert.equal(homeSelected(), true);
  const learningTab = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Обучение');
  await act(async () => { learningTab.props.onPress(); await flush(); });
  assert.equal(homeSelected(), false);
  const search = tree.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Найти тему');
  await act(async () => search.props.onChangeText('Знакомство'));
  await act(async () => { emit('appstate', 'inactive'); emit('appstate', 'active'); });
  assert.equal(homeSelected(), false, 'temporary inactive state must not interrupt an exercise');
  await act(async () => { emit('appstate', 'background'); emit('appstate', 'inactive'); emit('appstate', 'active'); await flush(); });
  assert.equal(homeSelected(), false, 'backgrounding must preserve the active tab');
  assert.equal(tree.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Найти тему').props.value, 'Знакомство');
  const todayTab = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Сегодня');
  await act(async () => { todayTab.props.onPress(); await flush(); });
  const allLessons = tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Все занятия'));
  await act(async () => { allLessons.props.onPress(); await flush(); });
  const practiceLink = tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Практика'));
  await act(async () => { practiceLink.props.onPress(); await flush(); });
  const resumeOverlay = tree.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.props.children === 'Продолжить сохранённое занятие'));
  await act(async () => { resumeOverlay.props.onPress(); await flush(); });
  await act(async () => tree.root.findByType('TextInput').props.onChangeText('Hello there'));
  await act(async () => { emit('appstate', 'background'); emit('appstate', 'active'); await flush(); });
  assert.equal(tree.root.findByType('TextInput').props.value, 'Hello there', 'backgrounding must preserve an open exercise and typed answer');
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt));
  assert.equal(progress.totalXP, 40);
  assert.equal(storage.has('@lingospark/navigation-v1'), false, 'old navigation state must be removed');
  await act(async () => tree.unmount());
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.equal(homeSelected(), true, 'a new application instance must start at Today');
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Английская жизнь').props.onPress(); await flush(); });
  await act(async () => { namedButton('Выбрать диалог').props.onPress(); await flush(); });
  assert.ok(namedButton('Вернуть покупку'), 'the world opens the same catalogue of short dialogues');
  await act(async () => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Назад').props.onPress());
  assert.ok(namedButton('Выбрать диалог'), 'closing the catalogue returns to the world');
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt), 'a cold start must not automatically reopen the last exercise');
  await act(async () => tree.unmount());
  progress.settings = { reviewReminderEnabled: true, modelNotificationEnabled: true };
  progress.reviewQueue = { practice: { dueAt: 0, exercise: savedExercise } };
  lastNotification = {
    actionIdentifier: 'default',
    notification: { request: { identifier: 'lingospark-study-reminder', content: { data: { source: 'lingospark', kind: 'review', fireAt: Date.now() } } } },
  };
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt), 'a cold start by tapping a review notification opens the exercise directly');
  assert.equal(lastNotification, null);
  await act(async () => tree.unmount());

  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  const reviewHero = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Начать повторение');
  assert.ok(reviewHero, 'Today recommends due exercises without opening the dictionary');
  await act(async () => { reviewHero.props.onPress(); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt), 'the Today recommendation opens the same review as its notification');
  await act(async () => tree.unmount());

  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  const tapModel = {
    actionIdentifier: 'default',
    notification: { request: { identifier: 'model-1', content: { data: { source: 'lingospark', kind: 'model', modelId: 'light' } } } },
  };
  await act(async () => { emit('notification', tapModel); await flush(); });
  const focusedCard = tree.root.findAllByType('View').find(node => node.props.onLayout && node.findAllByType('Text').some(text => text.props.children === models.find(model => model.id === 'light').title));
  assert.ok(focusedCard, 'a warm notification tap opens the chosen model card');
  assert.ok(namedButton('Продолжить диалог'), 'opening a model notification leaves chat launch manual');
  await act(async () => tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Сегодня').props.onPress());
  await act(async () => { emit('notification', tapModel); await flush(); });
  assert.equal(homeSelected(), true, 'a duplicate notification response must be ignored');
  await act(async () => tree.unmount());

  const AuthScreen = load('src/screens/AuthScreen.js').default;
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(AuthScreen))); await flush(); });
  await act(async () => namedButton('Регистрация').props.onPress());
  const field = name => tree.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === name || node.props.placeholder === name);
  await act(async () => {
    field('Электронная почта').props.onChangeText('new@example.com');
    field('Пароль').props.onChangeText('password');
    field('Повтори пароль').props.onChangeText('password');
  });
  await act(async () => namedButton('Создать аккаунт').props.onPress());
  assert.equal(accountActions.length, 0, 'registration requires a name');
  await act(async () => field('Имя').props.onChangeText('Анна'));
  await act(async () => { namedButton('Создать аккаунт').props.onPress(); await flush(); });
  assert.deepEqual(accountActions.at(-1), ['Анна', 'new@example.com', 'password']);
  await act(async () => tree.unmount());

  canEnter = false;
  accountUser = { id: 'unlicensed-learner', email: 'new@example.com', user_metadata: { display_name: 'Анна' } };
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(field('Промокод'), 'unlicensed learners can activate a promo');
  assert.ok(!tree.root.findAllByType('Pressable').some(node => node.props.accessibilityLabel === 'Сегодня'), 'blocked learners cannot enter any study tab');
  await act(async () => field('Имя профиля').props.onChangeText('Анна-Мария'));
  await act(async () => { namedButton('Сохранить имя').props.onPress(); await flush(); });
  assert.equal(accountActions.at(-1), 'Анна-Мария');
  await act(async () => field('Промокод').props.onChangeText('PROMO-TEST'));
  await act(async () => { namedButton('Активировать').props.onPress(); await flush(); });
  await act(async () => { tree.update(React.createElement(App, { testPhase: 'activated' })); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Обучение').props.onPress(); await flush(); });
  await act(async () => field('Найти тему').props.onChangeText('Знакомство'));
  await act(async () => { namedButton('Знакомство').props.onPress(); await flush(); });
  assert.ok(!field('Промокод'), 'activation unlocks the course route');
  assert.ok(namedButton('Дополнительная практика с разбором'), 'the first topic opens after activation');
  await act(async () => { emit('back'); await flush(); });
  await act(async () => tree.unmount());

  licenseState = { ...licenseState, offline: true };
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  assert.ok(namedButton('Лицензия и промокоды'));
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === 'Админ-панель'));
  await act(async () => { namedButton('Лицензия и промокоды').props.onPress(); await flush(); });
  assert.ok(!field('Промокод'));
  assert.ok(tree.root.findAllByType('Text').some(node => Array.isArray(node.props.children) && node.props.children[0] === 'Офлайн до '));
  await act(async () => namedButton('Продлить по промокоду').props.onPress());
  assert.ok(field('Промокод'));
  canEnter = false;
  licenseState = { licensed: false, revoked_at: '2026-11-20T08:00:00Z' };
  await act(async () => { tree.update(React.createElement(App, { testPhase: 'revoked' })); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => node.props.children === 'Лицензия отозвана'));
  assert.ok(!tree.root.findAllByType('Pressable').some(node => node.props.accessibilityLabel === 'Обучение'));
  await act(async () => tree.unmount());

  canEnter = true;
  staffRole = 'owner';
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  await act(async () => { namedButton('Админ-панель').props.onPress(); await flush(); });
  assert.ok(field('Название промокода'));
  await act(async () => { namedButton('Действующие').props.onPress(); await flush(); });
  assert.equal(adminRequests.at(-1).options.filter, 'active');
  assert.ok(tree.root.findAllByType('Text').some(node => Array.isArray(node.props.children) && node.props.children.join('') === 'Осталось 2 из 3 активаций'));
  await act(async () => { namedButton('Журнал ролей').props.onPress(); await flush(); });
  assert.equal(adminRequests.at(-1).action, 'list_role_events');
  assert.ok(tree.root.findAllByType('Text').some(node => Array.isArray(node.props.children) && node.props.children.join('') === 'Пользователь → Администратор'));
  const goBack = async () => act(async () => {
    tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Назад').props.onPress();
    await flush();
  });
  await goBack();
  await act(async () => { namedButton('Журнал лицензий').props.onPress(); await flush(); });
  const journalText = text => tree.root.findAllByType('Text').some(node => node.props.children === text);
  assert.ok(journalText('Лицензия отозвана'));
  assert.ok(journalText('Выполнил: admin@example.com'));
  assert.ok(journalText('student@example.com'));
  await act(async () => { namedButton('Показать более ранние события').props.onPress(); await flush(); });
  assert.equal(journalRequests.at(-1).id, 'event-2');
  assert.ok(journalText('Промокод активирован'));
  assert.ok(journalText('Срок на момент события неизвестен.'));
  assert.ok(journalText('Лицензия отозвана'));
  await act(async () => { namedButton('Обновить журнал').props.onPress(); await flush(); });
  assert.equal(journalRequests.at(-1), undefined);
  assert.ok(!journalText('Промокод активирован'));
  await goBack();
  await act(async () => { namedButton('Пользователи').props.onPress(); await flush(); });
  await act(async () => field('Имя или почта').props.onChangeText('stud'));
  await act(async () => { namedButton('Без доступа').props.onPress(); await flush(); });
  assert.equal(adminRequests.at(-1).action, 'list_users');
  assert.deepEqual(adminRequests.at(-1).options, { query: 'stud', filter: 'none', offset: 0 });
  await act(async () => { namedButton('Анна').props.onPress(); await flush(); });
  assert.equal(journalAccounts.at(-1), 'student@example.com');
  assert.ok(journalText('Лицензия отозвана'));
  assert.ok(!journalText('Бессрочный доступ'), 'account history refreshes the current license along with the events');
  assert.equal(profileRequests.length, 0, 'the progress snapshot is fetched only when the full profile is opened');
  await act(async () => { namedButton('Открыть полный профиль').props.onPress(); await flush(); });
  assert.equal(profileRequests.at(-1).userId, 'student');
  assert.ok(journalText('Профиль пользователя'));
  assert.ok(journalText('Прогресс по темам · пройдено 1'));
  assert.ok(journalText('135'));
  assert.ok(journalText('очередь'));
  assert.ok(journalText('20.11.2026'));
  profileInCloud = false;
  await act(async () => { namedButton('Обновить профиль').props.onPress(); await flush(); });
  assert.ok(profileRequests[0].signal.aborted);
  assert.ok(journalText('Учебный прогресс ещё не синхронизирован.'));
  await goBack();
  assert.ok(journalText('Карточка пользователя'));
  await act(async () => field('Причина выдачи или продления').props.onChangeText('Тестовый доступ'));
  const grant = async () => {
    await act(async () => namedButton('Выдать лицензию').props.onPress());
    assert.equal(lastAlert.title, 'Выдать лицензию?');
    await act(async () => { lastAlert.options.at(-1).onPress(); await flush(); });
  };
  await grant();
  const firstRequest = adminRequests.at(-1).options;
  await grant();
  assert.equal(adminRequests.at(-1).options.request_key, firstRequest.request_key);
  assert.equal(firstRequest.license_days, 7);
  assert.equal(firstRequest.reason, 'Тестовый доступ');
  assert.ok(namedButton('Продлить лицензию'));
  assert.ok(namedButton('Назначить администратором'));
  staffRole = 'admin';
  await act(async () => { tree.update(React.createElement(App, { testPhase: 'ordinary-admin' })); await flush(); });
  assert.ok(!namedButton('Назначить администратором'));
  await goBack();
  await goBack();
  assert.ok(!namedButton('Журнал ролей'));
  await act(async () => tree.unmount());

  staffRole = 'owner';
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  await act(async () => { namedButton('Админ-панель').props.onPress(); await flush(); });
  await act(async () => { namedButton('Учебные группы').props.onPress(); await flush(); });
  await act(async () => field('Название группы').props.onChangeText('Рабочий английский'));
  await act(async () => { namedButton('Создать группу').props.onPress(); await flush(); });
  await act(async () => field('Почта участника').props.onChangeText('student@example.com'));
  await act(async () => { namedButton('Добавить участника').props.onPress(); await flush(); });
  assert.ok(journalText('student@example.com'));
  await act(async () => namedButton('Выбрать тему').props.onPress());
  await act(async () => namedButton('A1 · Знакомство').props.onPress());
  await act(async () => { namedButton('Назначить группе').props.onPress(); await flush(); });
  assert.deepEqual(studyGroupRequests.find(item => item.action === 'assign_topic').options, {
    group_id: 'work-group', topic_id: 'greetings', days: 7,
  });
  await act(async () => { namedButton('Результаты участников').props.onPress(); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => Array.isArray(node.props.children)
    && node.props.children.join('') === 'Выполнено · Ошибок 2 из 5'));
  await act(async () => tree.unmount());

  staffRole = null;
  const advancedTopic = load('src/data/learningJourney.js').learningJourneys.at(-1);
  assert.equal(load('src/utils/learningJourney.js').isJourneyUnlocked(progress, advancedTopic.id), false);
  learnerAssignments = [{ ...groupAssignment, topic_id: advancedTopic.id }];
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(journalText('Задания группы'));
  await act(async () => tree.unmount());
  studyNetwork = false;
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(journalText('Задания группы'), 'an offline learner can open a previously synced assignment');
  const assignedTopic = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === advancedTopic.title + ' · задание группы');
  await act(async () => { assignedTopic.props.onPress(); await flush(); });
  assert.ok(journalText(advancedTopic.title));
  await act(async () => { namedButton('Начать практику').props.onPress(); await flush(); });
  assert.ok(namedButton('Ответить'));
  await act(async () => tree.unmount());

  staffRole = 'owner';
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  await act(async () => { namedButton('Админ-панель').props.onPress(); await flush(); });
  await act(async () => { namedButton('Общие события').props.onPress(); await flush(); });
  await act(async () => field('Название события').props.onChangeText('Неделя общения'));
  for (let day = 0; day < 2; day++) {
    await act(async () => namedButton('Добавить тему на день').props.onPress());
    await act(async () => namedButton(day ? 'Диалог' : 'Аудирование').props.onPress());
    await act(async () => namedButton('A1 · Знакомство').props.onPress());
  }
  await act(async () => { namedButton('Сохранить черновик').props.onPress(); await flush(); });
  assert.ok(journalText('Черновик сохранён.'));
  assert.equal(publishedEvent, null);
  await act(async () => namedButton('Предпросмотр дня 1').props.onPress());
  assert.ok(journalText('Предпросмотр · Знакомство'));
  const originalSaveDraft = actions.savePracticeDraft;
  let previewWrites = 0;
  actions.savePracticeDraft = () => { previewWrites++; };
  await act(async () => { namedButton('Начать практику').props.onPress(); await flush(); });
  await act(async () => namedButton('← Назад').props.onPress());
  assert.equal(previewWrites, 0);
  actions.savePracticeDraft = originalSaveDraft;
  await act(async () => { namedButton('Опубликовать для всех').props.onPress(); await flush(); });
  assert.deepEqual(eventRequests.find(item => item.action === 'publish').options.formats, ['listening', 'dialogue']);
  assert.equal(eventRequests.find(item => item.action === 'publish').options.event_id, '00000000-0000-4000-8000-000000000099');
  assert.deepEqual(eventRequests.find(item => item.action === 'publish').options.topics, ['greetings', 'greetings']);
  assert.ok(journalText('Событие опубликовано.'));
  await act(async () => { namedButton('Отчёт о событии').props.onPress(); await flush(); });
  assert.ok(tree.root.findAllByType('Text').some(node => Array.isArray(node.props.children)
    && node.props.children.join('') === 'Участвуют 3 · начали 2 · завершили 1'));
  await act(async () => tree.unmount());

  staffRole = null;
  learnerAssignments = [];
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(journalText('Общие события'));
  await act(async () => tree.unmount());
  eventsNetwork = false;
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  const eventTile = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Неделя общения · общее событие');
  await act(async () => { eventTile.props.onPress(); await flush(); });
  assert.ok(journalText('Ещё не открыто'));
  assert.ok(namedButton('Участвовать'));
  progress.studyEventResults = { [publishedEvent.id]: { name: publishedEvent.name, joined: true, days: {} } };
  notificationAllowed = true;
  await act(async () => { tree.update(React.createElement(App, { testingParticipation: true })); await flush(); });
  await act(async () => { await namedButton('Включить напоминания').props.onPress(); await flush(); });
  assert.ok(namedButton('Выключить напоминания'));
  assert.ok([...scheduledNotifications.values()].some(notification => notification.content.data?.eventId === publishedEvent.id));
  await act(async () => { namedButton('Начать задание').props.onPress(); await flush(); });
  assert.ok(journalText('Знакомство'));
  assert.ok(namedButton('Начать практику'));
  await act(async () => tree.unmount());

  const eventReminder = [...scheduledNotifications.values()].find(notification => notification.content.data?.eventId === publishedEvent.id);
  lastNotification = { actionIdentifier: 'default', notification: { request: eventReminder } };
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(namedButton('К экрану «Сегодня»'), 'a cold navigation from a notification opens the event');
  await act(async () => tree.unmount());

  progress.studyEventResults = { [publishedEvent.id]: { name: publishedEvent.name, days: { 0: true, 1: true }, badgeAt: Date.now() } };
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  assert.ok(![...scheduledNotifications.values()].some(notification => notification.content.data?.eventId === publishedEvent.id));
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  assert.ok(journalText('Значки событий'));
  assert.ok(journalText(publishedEvent.name));
  const archivedEvent = { ...publishedEvent, id: '00000000-0000-4000-8000-000000000088', starts_on: '2026-09-01',
    ends_on: '2026-09-02', formats: ['phrases', 'dialogue'] };
  progress.studyEventResults = { [archivedEvent.id]: {
    name: archivedEvent.name, event: archivedEvent, days: { 0: true, 1: true }, badgeAt: Date.now(),
    answers: { 0: { 'j-phrases-1': false } },
  } };
  publishedEvent = null;
  await act(async () => { tree.update(React.createElement(App, { testingRecap: true })); await flush(); });
  assert.ok(journalText('Мои события'));
  const archivedTile = tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === `Мой итог · ${archivedEvent.name}`);
  await act(async () => { archivedTile.props.onPress(); await flush(); });
  assert.ok(journalText('Мой итог'));
  assert.ok(journalText('Верно 0 из 1'));
  assert.ok(journalText('Выполнено · оценка недоступна'));
  await act(async () => { namedButton('Повторить мои ошибки').props.onPress(); await flush(); });
  assert.ok(namedButton('Начать практику'));
  await act(async () => { namedButton('Начать практику').props.onPress(); await flush(); });
  assert.ok(journalText('Ты на первом занятии. Представься группе как Эмма.'));
  await act(async () => tree.unmount());

  const generatedExercise = { prompt: 'Выбери фразу, чтобы попросить билет до Йорка.', options: ['One ticket to York, please.', 'Where is the ticket office?', 'Is York far from here?'], answer: 0, explanation: 'One ticket to York — один билет до Йорка.' };
  const generatedRepeat = { prompt: 'Попроси два билета до Лондона.', options: ['One ticket to York, please.', 'Two tickets to London, please.', 'Which train goes to London?'], answer: 1, explanation: 'Two tickets to London — два билета до Лондона.' };
  const replies = [
    { name: 'Поездка на выходные', description: 'Английский на вокзале и в дороге', days: [{ topic: 0, format: 1 }, { topic: 1, format: 2 }] },
    { days: [{ topic: 0, format: 0 }] },
    { question: generatedExercise, review: generatedRepeat },
  ];
  tutorApi.generateStudyEvent = async request => request.parse(replies.shift());
  licenseState = { staffOffline: true };
  const beforeOffline = eventRequests.length;
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  await act(async () => { namedButton('Черновики событий офлайн').props.onPress(); await flush(); });
  assert.equal(namedButton('Опубликовать для всех'), undefined);
  await act(async () => namedButton('Создать событие с ИИ').props.onPress());
  await act(async () => field('Идея события').props.onChangeText('Английский в поездке'));
  await act(async () => field('Количество дней (1–14)').props.onChangeText('2'));
  await act(async () => { namedButton('Сгенерировать план').props.onPress(); await flush(); });
  assert.equal(field('Название события').props.value, '');
  await act(async () => namedButton('Открыть план в редакторе').props.onPress());
  assert.equal(field('Название события').props.value, 'Поездка на выходные');
  await act(async () => { namedButton('Предложить другой вариант дня 1').props.onPress(); await flush(); });
  await act(async () => namedButton('Применить вариант дня').props.onPress());
  await act(async () => { namedButton('Создать упражнение для дня 1').props.onPress(); await flush(); });
  await act(async () => namedButton('Открыть проверку упражнения').props.onPress());
  assert.equal(field('Основное задание · вопрос').props.value, generatedExercise.prompt);
  await act(async () => { namedButton('Предпросмотр повтора').props.onPress(); await flush(); });
  await act(async () => { namedButton('Начать практику').props.onPress(); await flush(); });
  assert.ok(journalText(generatedRepeat.prompt));
  await act(async () => namedButton('← Назад').props.onPress());
  await act(async () => namedButton('Подтвердить правильные ответы').props.onPress());
  await act(async () => field('Основное задание · объяснение').props.onChangeText('One ticket — один билет. York — Йорк.'));
  assert.ok(namedButton('Подтвердить правильные ответы'));
  await act(async () => { namedButton('Сохранить на устройстве').props.onPress(); await flush(); });
  assert.equal(eventRequests.length, beforeOffline);
  await act(async () => tree.unmount());

  staffRole = 'owner';
  licenseState = {};
  await act(async () => { tree = Renderer.create(React.createElement(App)); await flush(); });
  await act(async () => { tree.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Профиль').props.onPress(); await flush(); });
  await act(async () => { namedButton('Админ-панель').props.onPress(); await flush(); });
  await act(async () => { namedButton('Общие события').props.onPress(); await flush(); });
  await act(async () => { namedButton('Открыть с устройства').props.onPress(); await flush(); });
  assert.equal(field('Название события').props.value, 'Поездка на выходные');
  assert.ok(namedButton('Опубликовать для всех').props.disabled);
  await act(async () => namedButton('Проверить упражнение').props.onPress());
  await act(async () => namedButton('Подтвердить правильные ответы').props.onPress());
  await act(async () => { namedButton('Опубликовать для всех').props.onPress(); await flush(); });
  assert.deepEqual(publishedEvent.formats, ['mixed', 'dialogue']);
  assert.equal(publishedEvent.custom_days[0].approved, true);
  assert.equal(publishedEvent.custom_days[0].review.prompt, generatedRepeat.prompt);
  const original = publishedEvent;
  const beforeDuplicate = eventRequests.length;
  await act(async () => field('Название события').props.onChangeText('Несохранённый черновик'));
  await act(async () => namedButton('Дублировать событие').props.onPress());
  assert.equal(lastAlert.title, 'Открыть копию в редакторе?');
  assert.equal(field('Название события').props.value, 'Несохранённый черновик');
  await act(async () => lastAlert.options.find(option => option.text === 'Открыть копию').onPress());
  assert.equal(eventRequests.length, beforeDuplicate, 'opening a copy makes no server writes');
  assert.equal(field('Название события').props.value, 'Поездка на выходные (копия)');
  assert.equal(field('Описание').props.value, original.description);
  assert.equal(field('Дата начала (ГГГГ-ММ-ДД)').props.value, new Date(Date.parse(original.ends_on) + 86400000).toISOString().slice(0, 10));
  assert.ok(journalText('Собственное упражнение проверено'));
  await act(async () => field('Описание').props.onChangeText('Новая поездка с теми же упражнениями'));
  await act(async () => { namedButton('Сохранить черновик').props.onPress(); await flush(); });
  assert.equal(eventRequests.findLast(request => request.action === 'save_draft').options.event_id, undefined);
  assert.notEqual(eventDraft.id, original.id);
  assert.deepEqual(eventDraft.topics, original.topics);
  assert.deepEqual(eventDraft.formats, original.formats);
  assert.deepEqual(eventDraft.custom_days, original.custom_days);
  assert.equal(publishedEvent, original);
  await act(async () => { namedButton('Опубликовать для всех').props.onPress(); await flush(); });
  assert.notEqual(publishedEvent.id, original.id);
  assert.equal(publishedEvent.description, 'Новая поездка с теми же упражнениями');
  const previousId = publishedEvent.id;
  await act(async () => namedButton('Дублировать событие').props.onPress());
  const beforeDirectPublish = eventRequests.length;
  await act(async () => { namedButton('Опубликовать для всех').props.onPress(); await flush(); });
  assert.notEqual(publishedEvent.id, previousId);
  assert.deepEqual(eventRequests.slice(beforeDirectPublish).map(request => request.action), ['save_draft', 'publish', 'list']);
  assert.equal(eventRequests[beforeDirectPublish].options.event_id, undefined);
  assert.equal(eventRequests[beforeDirectPublish + 1].options.event_id, publishedEvent.id);
  staffRole = null;
  await act(async () => tree.unmount());

  const { tutorPracticeFromMessages } = load('src/utils/tutorPractice.js');
  const { licenseTiming, offlineLicense } = load('src/utils/licenseTiming.js');
  const now = Date.parse('2026-11-20T10:00:00Z');
  const earlyExpiry = { verifiedAt: now, expires_at: new Date(now + 3600000).toISOString(), licensed: true };
  assert.equal(licenseTiming(earlyExpiry, now).offlineUntil, now + 3600000);
  assert.equal(offlineLicense(earlyExpiry, now + 3600000).licensed, false);
  assert.equal(offlineLicense({ verifiedAt: now }, now + 7 * 86400000).licensed, false);
  assert.equal(offlineLicense({ verifiedAt: now }, now - 1).licensed, false);
  const focus = tutorPracticeFromMessages([
    { role: 'assistant', content: 'What is his name?' },
    { role: 'user', content: 'i dont now' },
    { role: 'assistant', content: 'Did you went there?' },
  ]);
  assert.equal(focus?.construction, 'knowNotNow');
  assert.equal(tutorPracticeFromMessages([{ role: 'assistant', content: 'Did you went there?' }]), null);
  assert.equal(tutorPracticeFromMessages([{ role: 'assistant', content: 'Do you still play?' }, { role: 'user', content: 'I don’t now.' }]), null);
  const TutorErrorPractice = load('src/components/TutorErrorPractice.js').default;
  let queued;
  await act(async () => {
    tree = Renderer.create(React.createElement(theme.ThemeProvider, null,
      React.createElement(TutorErrorPractice, { practice: focus, progress, onSave: value => { queued = value; } })));
    await flush();
  });
  assert.ok(journalText('i dont now'));
  await act(async () => namedButton(focus.exercise.answer).props.onPress());
  assert.ok(journalText('Верно!'));
  await act(async () => namedButton('Сохранить для повторения').props.onPress());
  assert.equal(queued, 'knowNotNow');
  await act(async () => tree.unmount());

  // Use the real providers here. A role alone must preserve lessons across a network break.
  verifyRealAccess = true;
  const { AuthProvider, useAuth } = load('src/store/AuthContext.js');
  const { AccessProvider, useAccess } = load('src/store/AccessContext.js');
  const { AuthRetryableFetchError } = require('@supabase/supabase-js');
  const session = { access_token: 'test-access', refresh_token: 'test-refresh', user: { id: 'staff-account' } };
  const sessionKey = '@lingospark/access-v1/staff-account';
  const online = value => ({ data: value, error: null, status: 200 });
  const noNetwork = { data: null, error: { message: 'Network request failed' }, status: 0 };
  authResult = { data: { session }, error: null };
  storage.set(testAuthKey, JSON.stringify(session));
  rpcResult = online({ role: 'owner', licensed: false, expires_at: null });
  let accessSnapshot, authSnapshot;
  function ProbeAccess() {
    accessSnapshot = useAccess();
    authSnapshot = useAuth();
    return null;
  }
  const mountAccess = () => Renderer.create(React.createElement(AuthProvider, null,
    React.createElement(AccessProvider, null, React.createElement(ProbeAccess))));
  await act(async () => { tree = mountAccess(); await flush(); });
  assert.ok(accessSnapshot.allowed && accessSnapshot.isAdmin);
  assert.equal(JSON.parse(storage.get(sessionKey)).staffAccess, true);
  rpcResult = noNetwork;
  await act(async () => { emit('appstate', 'active'); await flush(); });
  assert.ok(accessSnapshot.allowed && accessSnapshot.offline);
  assert.equal(accessSnapshot.isAdmin, false, 'the offline cache never grants admin rights');
  assert.equal(accessSnapshot.licensed, false, 'staff access is not a promo license');
  await act(async () => tree.unmount());

  authResult = { data: { session: null }, error: new AuthRetryableFetchError('Network request failed', 0) };
  const beforeRestart = statusRequests;
  await act(async () => { tree = mountAccess(); await flush(); });
  assert.equal(authSnapshot.offlineSession, true);
  assert.equal(authSnapshot.session, null);
  assert.equal(statusRequests, beforeRestart, 'a failed token refresh must not send an anonymous access RPC');
  assert.ok(accessSnapshot.allowed && !accessSnapshot.isAdmin);
  rpcResult = online({ role: null, licensed: false, expires_at: null });
  authResult = { data: { session }, error: null };
  await act(async () => { await accessSnapshot.refresh(); await flush(); });
  assert.equal(accessSnapshot.allowed, false, 'a server response removing staff access wins');
  assert.equal(storage.has(sessionKey), false);
  rpcResult = noNetwork;
  await act(async () => { emit('appstate', 'active'); await flush(); });
  assert.equal(accessSnapshot.allowed, false, 'disconnecting again does not restore revoked access');

  const secondSession = { ...session, user: { id: 'promo-account' } };
  const promoKey = '@lingospark/access-v1/promo-account';
  storage.set(promoKey, JSON.stringify({ verifiedAt: Date.now(), expires_at: null }));
  await act(async () => { authListener('SIGNED_IN', secondSession); await flush(); });
  assert.ok(accessSnapshot.allowed && accessSnapshot.licensed && !accessSnapshot.isAdmin, 'old promo caches continue to work');
  rpcResult = { data: null, error: { message: 'account_required' }, status: 401 };
  await act(async () => { emit('appstate', 'active'); await flush(); });
  assert.equal(storage.has(promoKey), false);
  assert.equal(accessSnapshot.allowed, false);
  await act(async () => tree.unmount());
  assert.equal(licenseTiming(offlineLicense({ licensed: false, staffAccess: true, verifiedAt: now }, now), now).staffOffline, true);
  assert.equal(licenseTiming(offlineLicense({ licensed: false, staffAccess: true, verifiedAt: now }, now + 7 * 86400000), now + 7 * 86400000).staffOffline, false);
  console.log('Interface passed: model library/manual downloads/legacy/terms, themes, word sessions, chat keyboard inset/input, stop/retry, Home routes, background preserves work, cold start opens Today, and notification taps open the review or model card. Native model quality and keyboard movement still require iPhone checks.');
}
const watchdog = setTimeout(() => { console.error('Interface test did not finish'); process.exitCode = 1; }, 20000);
main().then(() => clearTimeout(watchdog), cause => { clearTimeout(watchdog); console.error(cause); process.exitCode = 1; });
