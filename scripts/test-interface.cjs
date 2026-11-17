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
let system = 'light', override = null, reduced = false;
const emit = (name, value) => { for (const callback of events.get(name) || []) callback(value); };
const subscribe = (name, callback) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(callback); return { remove: () => events.get(name).delete(callback) }; };
const host = name => React.forwardRef((props, ref) => React.createElement(name, { ...props, ref }));
const asyncStorage = { getItem: async key => storage.get(key) || null, setItem: async (key, value) => { writes.push([key, value]); storage.set(key, value); }, removeItem: async key => storage.delete(key) };
class Value { constructor(value) { this.value = value; } setValue(value) { this.value = value; } stopAnimation() {} interpolate() { return this.value; } }
const animate = (value, options) => ({ start: callback => { animations.push(options); value.setValue(options.toValue); callback?.({ finished: true }); }, stop() {} });
const native = {
  View: host('View'), Text: host('Text'), TextInput: host('TextInput'), Pressable: host('Pressable'), ScrollView: host('ScrollView'), KeyboardAvoidingView: host('KeyboardAvoidingView'), Modal: host('Modal'), ActivityIndicator: host('ActivityIndicator'), InputAccessoryView: host('InputAccessoryView'), Switch: host('Switch'),
  FlatList: props => React.createElement('FlatList', props, props.ListHeaderComponent, props.data?.length ? props.data.slice(0, 5).map((item, index) => React.createElement(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item, index }))) : props.ListEmptyComponent),
  StyleSheet: { create: styles => styles, hairlineWidth: 1, absoluteFillObject: { position: 'absolute' } }, Platform: { OS: 'ios', select: options => options.ios ?? options.default },
  Appearance: { getColorScheme: () => override || system, setColorScheme: value => { const old = override || system; override = ['light', 'dark'].includes(value) ? value : null; if ((override || system) !== old) emit('appearance', { colorScheme: override || system }); }, addChangeListener: callback => subscribe('appearance', callback) },
  AccessibilityInfo: { isReduceMotionEnabled: async () => reduced, addEventListener: (_, callback) => subscribe('motion', callback) },
  AppState: { currentState: 'active', addEventListener: (_, callback) => subscribe('appstate', callback) },
  Keyboard: { dismiss() {}, addListener: (name, callback) => subscribe(name, callback) }, BackHandler: { addEventListener: (_, callback) => subscribe('back', callback) }, Alert: { alert() {} }, Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Animated: { Value, View: host('AnimatedView'), timing: animate, spring: animate }, Easing: { out: value => value, cubic: value => value },
};
const progress = { name: 'Лео', onboarded: true, dailyGoal: 30, totalXP: 40, dailyXP: 10, streak: 2, completed: [], journeys: {}, retention: {}, reviewStats: {}, reviewQueue: {}, mistakes: [], settings: {}, stats: {}, activity: {} };
const actions = new Proxy({}, { get: (_, key) => key === 'isUnlocked' ? () => true : () => {} });
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
  if (file.endsWith('/utils/speech.js')) return { speak() {}, stopSpeech() {} };
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
const { palettes, foregroundFor } = load('src/design/palettes.js');
const luminance = hex => {
  const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
for (const [mode, palette] of Object.entries(palettes)) {
  for (const background of ['background', 'card', 'cardLight']) for (const foreground of ['text', 'textMuted']) assert.ok(contrast(palette[foreground], palette[background]) >= 4.5, `${mode}: ${foreground}/${background}`);
  for (const [foreground, background] of [['purple', 'accentSoft'], ['mint', 'successSoft'], ['orange', 'warningSoft'], ['pink', 'dangerSoft'], ['onAccent', 'accentFill']]) assert.ok(contrast(palette[foreground], palette[background]) >= 4.5, `${mode}: ${foreground}/${background}`);
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
    for (const mode of ['light', 'dark']) {
      await act(async () => { controls.setMode(mode); await flush(); });
      assert.equal(controls.scheme, mode);
      const color = tree.root.findAllByType('TextInput').find(node => node.props.testID === 'theme-probe').props.style.color;
      assert.equal(color, palettes[mode].text);
    }
    await act(async () => tree.unmount());
  }
  // Saved answers stay available, but do not reopen an exercise automatically.
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
  console.log('Interface passed: persisted themes, no input remount, cached styles, reduced motion, core screens, background preserves tab/search/exercise/input, cold start opens Today. Native layout/keyboard still require iPhone checks.');
}
main().catch(cause => { console.error(cause); process.exitCode = 1; });
