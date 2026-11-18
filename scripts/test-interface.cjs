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
  View: host('View'), Text: host('Text'), TextInput: host('TextInput'), Pressable: host('Pressable'), ScrollView: host('ScrollView'), KeyboardAvoidingView: host('KeyboardAvoidingView'), Modal: host('Modal'), ActivityIndicator: host('ActivityIndicator'), InputAccessoryView: host('InputAccessoryView'), Switch: host('Switch'),
  FlatList: props => React.createElement('FlatList', props, props.ListHeaderComponent, props.data?.length ? props.data.slice(0, 5).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item, index }))) : props.ListEmptyComponent, props.ListFooterComponent),
  StyleSheet: { create: styles => styles, hairlineWidth: 1, absoluteFillObject: { position: 'absolute' } }, Platform: { OS: 'ios', select: options => options.ios ?? options.default },
  Appearance: { getColorScheme: () => override || system, setColorScheme: value => { const old = override || system; override = ['light', 'dark'].includes(value) ? value : null; if ((override || system) !== old) emit('appearance', { colorScheme: override || system }); }, addChangeListener: callback => subscribe('appearance', callback) },
  AccessibilityInfo: { isReduceMotionEnabled: async () => reduced, addEventListener: (_, callback) => subscribe('motion', callback) },
  AppState: { currentState: 'active', addEventListener: (_, callback) => subscribe('appstate', callback) },
  Keyboard: { dismiss() {}, addListener: (name, callback) => subscribe(name, callback) }, BackHandler: { addEventListener: (_, callback) => subscribe('back', callback) }, Alert: { alert() {} }, Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Linking: { openURL: async url => openedLinks.push(url) },
  Animated: { Value, View: host('AnimatedView'), timing: animate, spring: animate }, Easing: { out: value => value, cubic: value => value },
};
const progress = { name: 'Лео', onboarded: true, dailyGoal: 30, totalXP: 40, dailyXP: 10, streak: 2, completed: [], journeys: {}, retention: {}, reviewStats: {}, reviewQueue: {}, mistakes: [], settings: {}, stats: {}, activity: {} };
const actions = new Proxy({}, { get: (target, key) => target[key] || (target[key] = key === 'isUnlocked' ? () => true : () => {}) });
const providers = ({ children }) => children;
const progressApi = { useProgress: () => new Proxy({ progress }, { get: (target, key) => key in target ? target[key] : actions[key] }), useProgressSelector: selector => selector({ progress, ready: true }), useProgressActions: () => actions, ProgressProvider: providers };
const cloudApi = { useCloudBootstrap: () => false, useCloudSync: () => ({ status: 'offline', conflict: null }), CloudSyncProvider: providers };
const authApi = { useAuth: () => ({ ready: true, user: null, guestMode: true }), AuthProvider: providers };
const cache = new Map();
const dynamicImports = ({ types: t }) => ({ visitor: { CallExpression(p) { if (p.node.callee.type === 'Import') p.replaceWith(t.callExpression(t.memberExpression(t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('resolve')), []), t.identifier('then')), [t.arrowFunctionExpression([], t.callExpression(t.identifier('require'), p.node.arguments))])); } } });
function load(filename) {
  const absolute = path.resolve(filename);
  const file = [absolute, absolute + '.js', absolute + '.json'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) throw new Error('Missing module: ' + filename);
  if (file.endsWith('/store/ProgressContext.js')) return progressApi;
  if (file.endsWith('/store/CloudSyncContext.js')) return cloudApi;
  if (file.endsWith('/store/AuthContext.js')) return authApi;
  if (file.endsWith('/services/localAi.js')) return tutorApi;
  if (file.endsWith('/services/offlineSpeech.js')) return { getReadySpeechModel: async () => null, cancelSpeechRecording: async () => {} };
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
    if (name === 'expo-notifications') return { setNotificationHandler() {} };
    if (name === 'expo-document-picker' || name === 'expo-sharing' || name === 'expo-audio') return {};
    if (name === 'expo-file-system/legacy') return { documentDirectory: '/documents/' };
    return require(name);
  };
  new Function('require', 'module', 'exports', compiled)(resolve, module, module.exports);
  return module.exports;
}
const theme = load('src/theme.js');
Object.assign(tutorApi, { AI_MODELS: load('src/data/aiModels.js').AI_MODELS, getDownloadState: () => ({ status: 'idle', modelId: null, progress: 0 }), subscribeToDownload: () => () => {}, getFreeSpace: async () => 20000000000, downloadModel: async model => modelDownloads.push(model.id) });
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
    const props = Object.fromEntries(['onJourney', 'onLearningHub', 'onSearch', 'onBookmarks', 'onQuickSession', 'onTenses', 'onNavigate', 'onSettings', 'onAccount', 'onRetention', 'onReview', 'onAdaptive'].map(key => [key, callbacks[key]]));
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
  await act(async () => { tree = Renderer.create(React.createElement(theme.ThemeProvider, null, React.createElement(Home, { onQuickSession: () => homeStarts++ }))); await flush(); });
  const startButtons = tree.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel === 'Начать занятие');
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
  assert.equal(tree.root.findByType('FlatList').props.data.length, bank.wordBankSize, 'FlatList must receive the entire core catalog, without the 100-word cap');
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
  await act(async () => namedButton(`Вся база · ${bank.extendedWordBankSize.toLocaleString('ru-RU')}`).props.onPress());
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
  // Actual chat UI: keyboard positions use the measured window origin. The
  // composer has no accessory toolbar, input survives layout changes, and late
  // stopped completions cannot replace the current conversation.
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
  await act(async () => namedButton('Действия').props.onPress());
  await act(async () => { namedButton('Перевод').props.onPress(); await flush(); });
  const translationRequest = tutorRequests.at(-1);
  assert.equal(translationRequest.args.messages.at(-1).translationSource, 'Hello! Would you like to talk about food or travel?');
  await act(async () => { translationRequest.resolve({ text: 'Привет! Хочешь поговорить о еде или путешествиях?' }); await flush(); });
  assert.ok(tree.root.findByType('FlatList').props.data.some(item => item.content === 'Привет! Хочешь поговорить о еде или путешествиях?'));
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
  const userCount = tree.root.findByType('FlatList').props.data.filter(item => item.role === 'user').length;
  await act(async () => { namedButton('Повторить ответ').props.onPress(); await flush(); });
  assert.equal(tutorRequests.at(-1).args.messages.filter(item => item.role === 'user').length, userCount, 'retry must not insert the learner message twice');
  await act(async () => { tutorRequests.at(-1).resolve({ text: 'Let’s try again. What did you enjoy today?' }); await flush(); });
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
  await act(async () => namedButton('Начать новое собеседование').props.onPress());
  assert.ok(containsText('шаг 1 из 3'));
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
  assert.ok(!tree.root.findAllByType('Text').some(node => node.props.children === savedExercise.prompt), 'a cold start must not automatically reopen the last exercise');
  await act(async () => tree.unmount());
  console.log('Interface passed: model library/manual downloads/legacy/terms, themes, word sessions, chat keyboard inset/input, stop/retry, Home routes, background preserves work and cold start opens Today. Native model quality and keyboard movement still require iPhone checks.');
}
const watchdog = setTimeout(() => { console.error('Interface test did not finish'); process.exitCode = 1; }, 20000);
main().then(() => clearTimeout(watchdog), cause => { clearTimeout(watchdog); console.error(cause); process.exitCode = 1; });
