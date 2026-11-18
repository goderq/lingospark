const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { transformSync } = require('@babel/core');
const load = require('./load-data.cjs');
const { AI_MODELS } = load(path.join(__dirname, '../src/data/aiModels'));

module.exports = function mockLocalAi({ installed = true } = {}) {
  const storage = new Map(), files = new Map(), nativeCalls = [], outputs = [], loads = [], downloads = [], cache = new Map();
  const scheduled = new Map();
  let permissions = { granted: true };
  let nextNotice = 0;
  const notifications = {
    IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
    DEFAULT_ACTION_IDENTIFIER: 'default',
    setNotificationHandler() {},
    getPermissionsAsync: async () => permissions,
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    cancelScheduledNotificationAsync: async identifier => scheduled.delete(identifier),
    scheduleNotificationAsync: async request => {
      const identifier = request.identifier || `notice-${++nextNotice}`;
      scheduled.set(identifier, { ...request, identifier });
      return identifier;
    },
  };
  const setNotificationPermissions = value => { permissions = value; };
  const filePath = model => `/documents/lingospark-ai/${model.filename}`;
  if (installed) for (const model of AI_MODELS) files.set(filePath(model), { size: model.size, header: 'R0dVRg==' });
  const llama = { completion: async (options, onToken) => { nativeCalls.push(options); const text = outputs.shift(); assert.equal(typeof text, 'string', 'unexpected extra model request'); onToken?.({ token: text }); return { text }; }, stopCompletion: async () => {} };
  const fileSystem = {
    documentDirectory: '/documents/', EncodingType: { Base64: 'base64' }, FileSystemSessionType: { BACKGROUND: 0 },
    getInfoAsync: async uri => uri.endsWith('/') ? { exists: true } : files.has(uri) ? { exists: true, ...files.get(uri) } : { exists: false },
    readAsStringAsync: async uri => { if (!files.has(uri)) throw Error('missing file'); return files.get(uri).header; },
    deleteAsync: async uri => files.delete(uri), makeDirectoryAsync: async () => {}, getFreeDiskStorageAsync: async () => 20000000000,
    createDownloadResumable: (url, destination, options, onProgress, resumeData) => {
      const job = { url, destination, options, resumeData, progress: (written, total) => { files.set(destination, { size: written, header: 'R0dVRg==' }); onProgress({ totalBytesWritten: written, totalBytesExpectedToWrite: total }); } };
      const promise = new Promise((resolve, reject) => { job.finish = (size, status = 200, header = 'R0dVRg==') => { files.set(destination, { size, header }); resolve({ uri: destination, status }); }; job.fail = reject; job.cancel = () => resolve(null); });
      downloads.push(job);
      return { downloadAsync: () => promise, pauseAsync: async () => { job.cancel(); return { resumeData: 'native-resume-data' }; }, cancelAsync: async () => job.cancel() };
    },
  };
  function serviceLoad(filename) {
    const absolute = path.resolve(filename);
    const file = [absolute, absolute + '.js', absolute + '.json'].find(candidate => fs.existsSync(candidate));
    if (file.endsWith('nativeResources.js')) return { withNativeResource: (_, fn) => fn(), registerResource() {}, releaseNativeResource: async () => {} };
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    if (file.endsWith('.json')) { module.exports = JSON.parse(fs.readFileSync(file)); return module.exports; }
    const code = transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
    const requireMock = name => {
      if (name.startsWith('.')) return serviceLoad(path.resolve(path.dirname(file), name));
      if (name === '@react-native-async-storage/async-storage') return { getItem: async key => storage.get(key) || null, setItem: async (key, value) => storage.set(key, value), removeItem: async key => storage.delete(key) };
      if (name === 'expo-notifications') return notifications;
      if (name === 'expo-file-system/legacy') return fileSystem;
      if (name === '@pocketpalai/llama.rn') return { initLlama: async options => { loads.push(options); return llama; }, releaseAllLlama: async () => {} };
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
    return module.exports;
  }
  return { serviceLoad, storage, files, nativeCalls, outputs, loads, downloads, filePath, scheduled, setNotificationPermissions };
};
