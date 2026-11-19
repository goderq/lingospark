import { notifyModelReady } from './learningNotifications';
import { withNativeResource, registerResource, releaseNativeResource } from './nativeResources';
import { budgetMessages, recentTranscript } from '../utils/contextBudget';
import { now, recordTiming } from '../utils/performance';
import { continuityGuidance, dialogueGuidance, earlierLearnerFacts } from '../utils/conversationCoach';
import { assertTutorReplyNotAborted, generateTutorReply, openingQuestionForGreeting, tutorLanguageRule, tutorReplyLanguage } from '../utils/tutorReply';
import { AI_MODELS, isLightModel } from '../data/aiModels';
import { modelCompletionOptions, modelSizeProblem } from '../utils/aiModelRuntime';
export { AI_MODELS } from '../data/aiModels';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { initLlama, releaseAllLlama } from "@pocketpalai/llama.rn";
import { findGrammarKnowledge, formatGrammarKnowledge } from "../data/aiGrammarKnowledge";

const MODEL_DIR = `${FileSystem.documentDirectory}lingospark-ai/`;
const ACTIVE_MODEL_KEY = "@lingospark/local-ai-model-v1";
const TUTOR_SESSIONS_KEY = "@lingospark/ai-tutor-sessions-v1";
const AI_SETTINGS_KEY = "@lingospark/ai-settings-v1";
const DOWNLOAD_RESUME_KEY = "@lingospark/ai-download-resume-v1";
const TUTOR_MEMORY_KEY = "@lingospark/ai-tutor-memory-v1";
const TUTOR_FEEDBACK_KEY = "@lingospark/ai-tutor-feedback-v1";

const EMPTY_TUTOR_MEMORY = {
  interests: [],
  goals: [],
  recurringMistakes: [],
  usefulWords: [],
  recentScores: [],
  recentTopics: [],
  completedMissions: [],
  updatedAt: 0,
};

let context = null;
let contextModelId = null;
let engineDiagnostics = {
  loadedModelId: null,
  gpu: null,
  reasonNoGPU: "",
  tokensPerSecond: null,
  generatedTokens: null,
  lastDurationMs: null,
};
let activeDownload = null;
let downloadState = {
  status: "idle",
  modelId: null,
  progress: 0,
  written: 0,
  total: 0,
  error: "",
};
const downloadListeners = new Set();

function publishDownload(changes) {
  downloadState = { ...downloadState, ...changes };
  downloadListeners.forEach((listener) => listener(downloadState));
}

export function getDownloadState() {
  return downloadState;
}

export function subscribeToDownload(listener) {
  downloadListeners.add(listener);
  listener(downloadState);
  return () => downloadListeners.delete(listener);
}

export const modelPath = (model) => `${MODEL_DIR}${model.filename}`;
let aiSettingsCache = null;

export async function getAiSettings() {
  if (aiSettingsCache) return aiSettingsCache;
  try {
    const value = JSON.parse((await AsyncStorage.getItem(AI_SETTINGS_KEY)) || "{}");
    aiSettingsCache = { economyMode: value.economyMode !== false, qualityMode: Boolean(value.qualityMode) };
    return aiSettingsCache;
  } catch {
    return { economyMode: true, qualityMode: false };
  }
}

export async function setAiSettings(changes) {
  const next = { ...(await getAiSettings()), ...changes };
  await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(next));
  aiSettingsCache = next;
  return next;
}

export function getEngineDiagnostics() {
  return { ...engineDiagnostics };
}

export async function loadTutorMemory() {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(TUTOR_MEMORY_KEY)) || "{}");
    return {
      ...EMPTY_TUTOR_MEMORY,
      ...parsed,
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      recurringMistakes: Array.isArray(parsed.recurringMistakes) ? parsed.recurringMistakes : [],
      usefulWords: Array.isArray(parsed.usefulWords) ? parsed.usefulWords : [],
      recentScores: Array.isArray(parsed.recentScores) ? parsed.recentScores : [],
      recentTopics: Array.isArray(parsed.recentTopics) ? parsed.recentTopics : [],
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
    };
  } catch {
    return { ...EMPTY_TUTOR_MEMORY };
  }
}

async function saveTutorMemory(memory) {
  const next = { ...EMPTY_TUTOR_MEMORY, ...memory, updatedAt: Date.now() };
  await AsyncStorage.setItem(TUTOR_MEMORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearTutorMemory() {
  await AsyncStorage.removeItem(TUTOR_MEMORY_KEY);
}

export async function loadTutorFeedback() {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(TUTOR_FEEDBACK_KEY)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTutorFeedback(entry) {
  const current = await loadTutorFeedback();
  const next = [
    { ...entry, createdAt: Date.now() },
    ...current.filter((item) => item.messageId !== entry.messageId),
  ].slice(0, 120);
  await AsyncStorage.setItem(TUTOR_FEEDBACK_KEY, JSON.stringify(next));
  return next;
}

export async function clearTutorFeedback() {
  await AsyncStorage.removeItem(TUTOR_FEEDBACK_KEY);
}

function feedbackPrompt(feedback) {
  const recentNegative = feedback.filter((item) => item.rating === "down").slice(0, 20);
  const counts = recentNegative.reduce((all, item) => ({ ...all, [item.reason || "other"]: (all[item.reason || "other"] || 0) + 1 }), {});
  const instructions = [];
  if (counts.wrong) instructions.push("ученик отмечал неверные исправления — исправляй только при уверенности и опоре на справочник");
  if (counts.repetitive) instructions.push("ученик отмечал однотипность — меняй структуру, начало и тип следующего хода");
  if (counts.hard) instructions.push("ученику было слишком сложно — используй короче предложения и одну идею за раз");
  if (counts.easy) instructions.push("ученику было слишком легко — добавляй более естественную лексику и требуй развёрнутый ответ");
  return instructions.length ? `Локальная обратная связь ученика: ${instructions.join("; ")}.` : "";
}

export async function addTutorMemoryGoal(value) {
  const goal = String(value || "").trim().slice(0, 90);
  if (!goal) return loadTutorMemory();
  const memory = await loadTutorMemory();
  return saveTutorMemory({ ...memory, goals: uniqueRecent([goal, ...memory.goals], 10) });
}

export async function removeTutorMemoryEntry(section, key) {
  if (!["goals", "interests", "recurringMistakes", "usefulWords"].includes(section)) return loadTutorMemory();
  const memory = await loadTutorMemory();
  const current = memory[section] || [];
  const next = current.filter((item) => {
    if (typeof item === "string") return item !== key;
    return (item.key || item.english || item.corrected) !== key;
  });
  return saveTutorMemory({ ...memory, [section]: next });
}

const uniqueRecent = (values, limit) => [...new Set(values.filter(Boolean).map((item) => String(item).trim()))].slice(0, limit);

function extractPersonalFacts(messages) {
  const interests = [];
  const goals = [];
  const clean = (value) => String(value || "").replace(/[.!?].*$/s, "").trim().slice(0, 70);
  for (const message of messages.filter((item) => item.role === "user" && item.kind !== "command").slice(-16)) {
    const text = String(message.content || "");
    const interest = text.match(/\b(?:i like|i love|i enjoy|i am interested in|i'm interested in|my favou?rite (?:thing|topic|hobby) is)\s+(.{2,70})/i);
    const goal = text.match(/\b(?:i want to|i need to|i plan to|my goal is to|i would like to)\s+(.{2,70})/i);
    if (interest?.[1]) interests.push(clean(interest[1]));
    if (goal?.[1]) goals.push(clean(goal[1]));
  }
  return { interests, goals };
}

async function rememberTutorAnalysis({ analysis, level, topic, messages }) {
  const memory = await loadTutorMemory();
  const facts = extractPersonalFacts(messages);
  const mistakes = [...memory.recurringMistakes];
  for (const item of analysis.mistakes || []) {
    const key = String(item.corrected || item.explanation || "").toLowerCase().trim();
    if (!key) continue;
    const existing = mistakes.find((entry) => entry.key === key);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastSeen = Date.now();
      existing.explanation = item.explanation;
    } else {
      mistakes.push({ key, original: item.original, corrected: item.corrected, explanation: item.explanation, count: 1, lastSeen: Date.now() });
    }
  }
  const words = [...memory.usefulWords];
  for (const item of analysis.words || []) {
    const key = String(item.english || "").toLowerCase().trim();
    if (!key) continue;
    const existing = words.find((entry) => entry.key === key);
    if (existing) Object.assign(existing, item, { key, seen: (existing.seen || 1) + 1, lastSeen: Date.now() });
    else words.push({ ...item, key, seen: 1, lastSeen: Date.now() });
  }
  const scores = analysis.scores || {};
  return saveTutorMemory({
    ...memory,
    interests: uniqueRecent([...facts.interests, ...memory.interests], 10),
    goals: uniqueRecent([...facts.goals, ...memory.goals], 10),
    recurringMistakes: mistakes.sort((a, b) => (b.count || 0) - (a.count || 0) || (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, 16),
    usefulWords: words.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, 40),
    recentScores: [{ level, grammar: scores.grammar || 0, vocabulary: scores.vocabulary || 0, fluency: scores.fluency || 0, at: Date.now() }, ...memory.recentScores].slice(0, 12),
    recentTopics: uniqueRecent([topic, ...memory.recentTopics], 8),
  });
}

function dateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function getDailyTutorMission({ level = "A2", topic = "Свободный разговор", memory = EMPTY_TUTOR_MEMORY }) {
  const targetWords = (memory.usefulWords || []).slice(0, 3).map((item) => item.english).filter(Boolean);
  const seed = [...`${dateKey()}-${level}-${topic}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const templates = [
    { type: "turns", title: "Разговор без пауз", description: "Напиши или скажи 5 содержательных реплик по-английски.", target: 5 },
    { type: "questions", title: "Возьми инициативу", description: "Задай собеседнику 2 вопроса по теме разговора.", target: 2 },
    { type: "detail", title: "Добавь подробности", description: "Составь 3 реплики длиной не меньше шести слов.", target: 3 },
    { type: "past", title: "История из прошлого", description: "Используй прошедшее время в трёх разных репликах.", target: 3 },
  ];
  if (targetWords.length >= 2) templates.push({ type: "vocabulary", title: "Верни слова в речь", description: `Естественно используй слова: ${targetWords.join(", ")}.`, target: Math.min(3, targetWords.length), targetWords });
  const chosen = templates[seed % templates.length];
  return { ...chosen, id: `${dateKey()}-${chosen.type}-${level}-${topic}`, level, topic };
}

export function getTutorMissionProgress(mission, messages) {
  if (!mission) return { current: 0, target: 1, completed: false };
  const userMessages = messages.filter((item) => item.role === "user" && item.kind !== "command").map((item) => String(item.content || "").trim());
  let current = 0;
  if (mission.type === "turns") current = userMessages.filter((text) => text.split(/\s+/).length >= 2).length;
  if (mission.type === "questions") current = userMessages.filter((text) => /\?|\b(?:who|what|where|when|why|how|do|does|did|can|could|would|is|are)\b/i.test(text)).length;
  if (mission.type === "detail") current = userMessages.filter((text) => text.split(/\s+/).filter(Boolean).length >= 6).length;
  if (mission.type === "past") current = userMessages.filter((text) => /\b(?:was|were|did|had|went|got|made|saw|came|took|worked|played|visited|wanted|needed|liked)\b/i.test(text)).length;
  if (mission.type === "vocabulary") current = (mission.targetWords || []).filter((word) => userMessages.some((text) => new RegExp(`\\b${String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))).length;
  current = Math.min(mission.target, current);
  return { current, target: mission.target, completed: current >= mission.target };
}

export async function markTutorMissionCompleted(missionId) {
  if (!missionId) return;
  const memory = await loadTutorMemory();
  if (memory.completedMissions.includes(missionId)) return;
  await saveTutorMemory({ ...memory, completedMissions: [missionId, ...memory.completedMissions].slice(0, 60) });
}

async function ensureModelDirectory() {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

export async function verifyModelFile(model) {
  const info = await FileSystem.getInfoAsync(modelPath(model), { size: true });
  if (!info.exists) return { installed: false, verified: false, bytes: 0, reason: "Файл не найден" };
  const bytes = info.size || 0;
  const sizeProblem = modelSizeProblem(model, bytes);
  if (sizeProblem) return { installed: false, verified: false, bytes, reason: sizeProblem };
  try {
    const header = await FileSystem.readAsStringAsync(modelPath(model), {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 4,
    });
    const verified = header.replace(/=+$/, "") === "R0dVRg";
    return { installed: verified, verified, bytes, reason: verified ? "" : "Неверный формат файла" };
  } catch {
    return { installed: false, verified: false, bytes, reason: "Не удалось проверить файл" };
  }
}

export async function inspectModels() {
  await ensureModelDirectory();
  const entries = await Promise.all(
    AI_MODELS.map(async (model) => [model.id, await verifyModelFile(model)]),
  );
  return Object.fromEntries(entries);
}

export async function getActiveModelId() {
  return AsyncStorage.getItem(ACTIVE_MODEL_KEY);
}

export async function setActiveModelId(modelId) {
  if (modelId) await AsyncStorage.setItem(ACTIVE_MODEL_KEY, modelId);
  else await AsyncStorage.removeItem(ACTIVE_MODEL_KEY);
}

export async function getFreeSpace() {
  try {
    return await FileSystem.getFreeDiskStorageAsync();
  } catch {
    return null;
  }
}

const saveDownloadCheckpoint = checkpoint => AsyncStorage.setItem(DOWNLOAD_RESUME_KEY, JSON.stringify(checkpoint));

async function readDownloadCheckpoint() {
  const saved = await AsyncStorage.getItem(DOWNLOAD_RESUME_KEY);
  if (!saved) return null;
  try {
    const checkpoint = JSON.parse(saved);
    const model = AI_MODELS.find(item => item.id === checkpoint?.modelId);
    return model ? { model, checkpoint } : null;
  } catch {
    return null;
  }
}

async function transferModel(model, job, checkpoint) {
  const { destination } = job;
  try {
    await ensureModelDirectory();
    if (!checkpoint.resumeData) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }
    await saveDownloadCheckpoint({ ...checkpoint, modelId: model.id });
    if (job.control === 'cancel') return null;
    let lastProgressAt = 0;
    job.task = FileSystem.createDownloadResumable(
      model.url,
      destination,
      { sessionType: FileSystem.FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (activeDownload !== job || job.control) return;
        const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.size;
        const progress = Math.min(0.99, totalBytesWritten / total);
        const time = Date.now();
        if (time - lastProgressAt < 150 && progress - downloadState.progress < 0.005) return;
        lastProgressAt = time;
        publishDownload({ written: totalBytesWritten, total, progress });
      },
      checkpoint.resumeData || undefined,
    );
    const result = await job.task.downloadAsync();
    if (!result && job.control) return null;
    if (result?.status && ![200, 206].includes(result.status)) throw new Error(`Источник вернул HTTP ${result.status}.`);
    if (!result?.uri) throw new Error('Файл модели не получен.');
    publishDownload({ status: 'verifying' });
    const verification = await verifyModelFile(model);
    if (!verification.verified) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
      await saveDownloadCheckpoint({ modelId: model.id });
      throw new Error(verification.reason || 'Файл модели не прошёл проверку.');
    }
    await setActiveModelId(model.id);
    await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
    publishDownload({ status: 'completed', progress: 1, written: verification.bytes || model.size, total: model.size, error: '', canResume: false });
    notifyModelReady(model).catch(() => {});
    return result.uri;
  } catch (error) {
    if (job.control) return null;
    const detail = error?.message || '';
    const network = /NSURLErrorDomain Code=-(?:1001|1003|1004|1005|1006|1009|1018|1020)|network|offline|internet connection|not connected/i.test(detail);
    const canResume = network && !!checkpoint.resumeData;
    if (checkpoint.resumeData && !canResume) await saveDownloadCheckpoint({ modelId: model.id }).catch(() => {});
    publishDownload({
      status: network ? 'disconnected' : 'error',
      error: network ? 'Связь потеряна. Проверь подключение и повтори загрузку.' : detail || 'Не удалось скачать модель.',
      canResume,
      ...(!canResume && { written: 0, progress: 0 }),
    });
    throw error;
  } finally {
    job.settled = true;
    if (activeDownload === job && !job.control) activeDownload = null;
  }
}

function startModelDownload(model, checkpoint = {}) {
  if (activeDownload) {
    if (activeDownload.modelId === model.id && !activeDownload.control) return activeDownload.promise;
    return Promise.reject(new Error('Другая операция с загрузкой ещё выполняется.'));
  }
  const job = { destination: modelPath(model), modelId: model.id, task: null, control: null };
  activeDownload = job;
  const written = checkpoint.resumeData ? checkpoint.written || 0 : 0;
  publishDownload({ status: 'downloading', modelId: model.id, progress: Math.min(0.99, written / model.size), written, total: model.size, error: '', canResume: false });
  job.promise = transferModel(model, job, checkpoint);
  return job.promise;
}

export function downloadModel(model) {
  return startModelDownload(model);
}

export async function pauseActiveModelDownload() {
  const job = activeDownload;
  if (!job?.task || job.control || downloadState.status !== 'downloading') return false;
  job.control = 'pause';
  publishDownload({ status: 'pausing' });
  try {
    const paused = await job.task.pauseAsync();
    await job.promise;
    if (downloadState.status === 'completed') return false;
    const resumeData = paused?.resumeData;
    const written = resumeData ? downloadState.written : 0;
    await saveDownloadCheckpoint({ modelId: job.modelId, resumeData, written, total: downloadState.total });
    publishDownload({ status: resumeData ? 'paused' : 'interrupted', canResume: !!resumeData, written, progress: written / downloadState.total, error: '' });
    return !!resumeData;
  } catch {
    if (!job.settled) {
      job.control = null;
      if (downloadState.status === 'pausing') publishDownload({ status: 'downloading', error: 'Не удалось поставить загрузку на паузу.' });
      return false;
    }
    if (downloadState.status !== 'completed') {
      publishDownload({ status: 'interrupted', canResume: false, written: 0, progress: 0, error: 'Точка продолжения не сохранилась.' });
    }
    return false;
  } finally {
    if (activeDownload === job && job.settled) activeDownload = null;
  }
}

export async function restorePendingModelDownload() {
  if (activeDownload || downloadState.status !== 'idle') return;
  const saved = await readDownloadCheckpoint();
  if (!saved || activeDownload) return;
  const { model, checkpoint } = saved;
  const verification = await verifyModelFile(model);
  if (activeDownload || downloadState.status !== 'idle') return;
  if (verification.verified) {
    await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
    if (!activeDownload && downloadState.status === 'idle') {
      publishDownload({ status: 'completed', modelId: model.id, progress: 1, total: model.size, written: verification.bytes, error: '', canResume: false });
      notifyModelReady(model).catch(() => {});
    }
    return;
  }
  const written = checkpoint.resumeData ? checkpoint.written || 0 : 0;
  publishDownload({
    status: checkpoint.resumeData ? 'paused' : 'interrupted',
    modelId: model.id, total: model.size, written, progress: Math.min(0.99, written / model.size),
    error: '', canResume: !!checkpoint.resumeData,
  });
}

export async function resumePendingModelDownload() {
  const saved = await readDownloadCheckpoint();
  if (!saved?.checkpoint.resumeData) return null;
  return startModelDownload(saved.model, saved.checkpoint);
}

export async function cancelModelDownload() {
  let job = activeDownload;
  if (job?.control || downloadState.status === 'verifying') return;
  if (!job) {
    const saved = await readDownloadCheckpoint();
    if (activeDownload || !saved) return;
    job = { modelId: saved.model.id, destination: modelPath(saved.model) };
    activeDownload = job;
  }
  job.control = 'cancel';
  publishDownload({ status: 'cancelling' });
  try {
    await job.task?.cancelAsync();
    await job.promise?.catch(() => {});
    if (downloadState.status === 'completed') return;
    await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
    await FileSystem.deleteAsync(job.destination, { idempotent: true });
    publishDownload({ status: 'cancelled', modelId: job.modelId, progress: 0, written: 0, error: '', canResume: false });
  } catch (error) {
    job.control = null;
    publishDownload({ status: job.promise && !job.settled ? 'downloading' : 'error', error: error?.message || 'Не удалось отменить загрузку.' });
    throw error;
  } finally {
    if (activeDownload === job && (!job.promise || job.settled)) activeDownload = null;
  }
}

async function readTutorSessions() {
  const raw = await AsyncStorage.getItem(TUTOR_SESSIONS_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) throw new Error('Не удалось прочитать историю ИИ');
  return parsed;
}

export async function loadTutorSessions() {
  try {
    return await readTutorSessions();
  } catch {
    return [];
  }
}

// Serialize whole read-modify-write operations, including removal.
let pendingHistoryWrite = Promise.resolve();
function updateTutorHistory(update) {
  const operation = pendingHistoryWrite.then(update);
  pendingHistoryWrite = operation.catch(() => {});
  return operation;
}

export function saveTutorSession(session) {
  return updateTutorHistory(async () => {
    const sessions = await readTutorSessions();
    const next = [
      { ...session, updatedAt: Date.now() },
      ...sessions.filter(item => item.id !== session.id),
    ].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 30);
    await AsyncStorage.setItem(TUTOR_SESSIONS_KEY, JSON.stringify(next));
    return next;
  });
}

export function deleteTutorSession(sessionId) {
  return updateTutorHistory(async () => {
    const sessions = await readTutorSessions();
    const next = sessions.filter(item => item.id !== sessionId);
    await AsyncStorage.setItem(TUTOR_SESSIONS_KEY, JSON.stringify(next));
    return next;
  });
}

export function clearTutorSessions() {
  return updateTutorHistory(() => AsyncStorage.removeItem(TUTOR_SESSIONS_KEY));
}

export async function clearIncompleteModels() {
  await ensureModelDirectory();
  let freed = 0;
  for (const model of AI_MODELS) {
    if (activeDownload?.modelId === model.id) continue;
    const check = await verifyModelFile(model);
    if (check.bytes > 0 && !check.installed) {
      freed += check.bytes;
      await FileSystem.deleteAsync(modelPath(model), { idempotent: true });
    }
  }
  await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
  return freed;
}

export async function deleteModel(model) {
  if (contextModelId === model.id) await unloadModel();
  await FileSystem.deleteAsync(modelPath(model), { idempotent: true });
  if ((await getActiveModelId()) === model.id) await setActiveModelId(null);
}

async function loadModelUnsafe(model, onProgress) {
  const settings = await getAiSettings();
  const requestedContext = settings.economyMode ? Math.min(2048, model.context) : model.context;
  if (context && contextModelId === model.id && engineDiagnostics.contextSize === requestedContext) return context;
  await unloadModelUnsafe();
  const verification = await verifyModelFile(model);
  if (!verification.verified) {
    throw new Error("Сначала скачайте выбранную модель");
  }
  context = await initLlama(
    {
      model: modelPath(model),
      n_ctx: requestedContext,
      n_batch: settings.economyMode ? 128 : 256,
      n_threads: 4,
      n_gpu_layers: 99,
      use_mmap: true,
      use_mlock: false,
      use_progress_callback: true,
    },
    (progress) => onProgress?.(Math.max(0, Math.min(1, progress / 100))),
  );
  contextModelId = model.id;
  engineDiagnostics = {
    ...engineDiagnostics,
    loadedModelId: model.id,
    contextSize: requestedContext,
    gpu: context?.gpu ?? null,
    reasonNoGPU: context?.reasonNoGPU || "",
  };
  return context;
}

async function unloadModelUnsafe() {
  if (!context) return;
  try {
    await releaseAllLlama();
  } finally {
    context = null;
    contextModelId = null;
    engineDiagnostics = { ...engineDiagnostics, loadedModelId: null, contextSize: null, gpu: null, reasonNoGPU: "" };
  }
}

export async function stopGeneration() {
  if (context) await context.stopCompletion();
}

async function completeWithGuard(llama, options, onToken, timeoutMs = 90000) {
  const startedAt = Date.now();
  let firstToken = false;
  const settings = await getAiSettings();
  const model = AI_MODELS.find(item => item.id === contextModelId);
  const contextSize = engineDiagnostics.contextSize || (settings.economyMode ? Math.min(2048, model?.context || 2048) : model?.context || 2048);
  const predicted = Math.min(options.n_predict || 280, Math.floor(contextSize * 0.5));
  options = modelCompletionOptions(model, { ...options, n_predict: predicted, messages: budgetMessages(options.messages, (contextSize - predicted - 160) * 2.4) });
  let timer;
  try {
    const result = await Promise.race([
      llama.completion(options, event => {
        if (!firstToken && event?.token) { firstToken = true; recordTiming('ai_first_token', Date.now() - startedAt); }
        onToken?.(event);
      }),
      new Promise((_, reject) => {
        timer = setTimeout(async () => {
          try { await llama.stopCompletion(); } catch {}
          reject(new Error("Ответ занял слишком много времени. Модель остановлена — попробуйте короче или включите экономичный режим."));
        }, timeoutMs);
      }),
    ]);
    const timings = result?.timings || {};
    engineDiagnostics = {
      ...engineDiagnostics,
      tokensPerSecond: Number(timings.predicted_per_second || timings.tokens_per_second) || engineDiagnostics.tokensPerSecond,
      generatedTokens: Number(timings.predicted_n || timings.generated_tokens) || null,
      lastDurationMs: Date.now() - startedAt,
    };
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function grammarNotesFor(text, topic, level = "A2", tutorMemory = EMPTY_TUTOR_MEMORY) {
  return formatGrammarKnowledge(findGrammarKnowledge({
    text,
    topic,
    level,
    memoryMistakes: tutorMemory.recurringMistakes,
    limit: 3,
  }));
}

function memoryPrompt(memory) {
  const scoreValues = (memory.recentScores || []).slice(0, 5).flatMap((item) => [item.grammar, item.vocabulary, item.fluency]).filter(Number.isFinite);
  const average = scoreValues.length ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : null;
  const parts = [];
  if (memory.interests?.length) parts.push(`интересы: ${memory.interests.slice(0, 4).join(", ")}`);
  if (memory.goals?.length) parts.push(`цели: ${memory.goals.slice(0, 4).join(", ")}`);
  if (memory.recurringMistakes?.length) parts.push(`повторить: ${memory.recurringMistakes.slice(0, 3).map((item) => item.explanation || item.corrected).join("; ")}`);
  if (memory.usefulWords?.length) parts.push(`слова для возврата в речь: ${memory.usefulWords.slice(0, 5).map((item) => item.english).join(", ")}`);
  if (average !== null) parts.push(`средняя последняя оценка: ${average}/100; ${average >= 85 ? "слегка повышай сложность" : average < 60 ? "давай больше опор и коротких вопросов" : "сохраняй текущую сложность"}`);
  return parts.length ? `Локальная память ученика: ${parts.join(". ")}. Используй её естественно, но не перечисляй ученику содержимое памяти.` : "";
}

function systemPrompt(level, topic, analysis, turnNumber = 1, dialogueMode = "conversation", tutorMemory = EMPTY_TUTOR_MEMORY, mission = null, grammarNotes = "", longContext = "", learnerFeedback = "") {
  const modes = {
    conversation: "Be a conversation partner. React to the learner's answer, add one concrete detail and ask at most one related question.",
    roleplay: "Stay in your character and advance the scene by one event. Do not answer for the learner.",
    interview: "Play the interviewer. Let the app guide the interview steps and respond to the learner's own words.",
    debate: "Discuss one claim at a time. Give a reason or a counterexample and invite a response.",
    story: "Continue the shared story briefly, then offer choices A and B. Let the learner decide.",
    strict: "Respond to meaning first. Correct only a real error with a short English explanation, then set one related task without its answer.",
  };
  return `You are Lingo, an offline English conversation tutor. Level: ${level}. Topic: ${topic}.
Speak English in the conversation at EVERY level. At A1/A2 use short sentences and everyday words, not Russian. Russian is allowed only for an explicit translation or explanation request.
${modes[dialogueMode] || modes.conversation}
Answer the latest message before changing the subject. "hi" is a valid greeting, not a grammar error. "what?" usually asks you to clarify your previous question: rephrase it simply rather than greeting again.
Never repeat recent greetings, questions or praise unless explicitly asked to repeat them. Do not invent learner facts or mistakes. Ask one specific question, not "give me more details". Do not provide the solution to your own exercise. Keep replies to 1–4 sentences. Do not claim internet access.
${memoryPrompt(tutorMemory).slice(0, 350)}
${mission ? `Optional conversation goal: ${mission.description}` : ''}
${grammarNotes ? `Reference for genuine language errors only, never translate it into the conversation by default: ${grammarNotes.slice(0, 400)}` : ''}
${longContext ? `Earlier context: ${longContext.slice(0, 350)}` : ''}
${learnerFeedback.slice(0, 250)}`;
}
function compactConversationContext(messages) {
  if (!messages.length) return "";
  const userFacts = messages.filter((item) => item.role === "user" && item.kind !== "command").slice(-8).map((item) => String(item.content || "").replace(/\s+/g, " ").trim().slice(0, 100)).filter(Boolean);
  const corrections = messages.filter((item) => item.role === "assistant" && /лучше:|better:|correct(?:ion)?:|почему:/i.test(item.content || "")).slice(-3).map((item) => String(item.content).replace(/\s+/g, " ").trim().slice(0, 120));
  const parts = [];
  if (userFacts.length) parts.push(`ученик ранее говорил: ${userFacts.join(" | ")}`);
  if (corrections.length) parts.push(`недавние исправления: ${corrections.join(" | ")}`);
  return parts.join(". ").slice(0, 900);
}

function compactTutorPrompt({ level, topic, nextMove, facts, grammarNotes, messages }) {
  return [
    `You are Lingo, an offline English conversation partner. Level: ${level}. Topic: ${topic}.`,
    'Use 1–3 short sentences and at most one related follow-up. Use relevant learner facts. Do not repeat your last question. Correct briefly if asked or if the meaning is unclear.',
    nextMove,
    facts,
    grammarNotes && `Grammar reference: ${grammarNotes}`,
    tutorReplyLanguage(messages) === 'english' ? 'REQUIRED: Reply in English only.' : tutorLanguageRule(messages),
  ].filter(Boolean).join('\n');
}

function wantsGrammarHelp(lastUser) {
  if (lastUser?.kind === 'command') return lastUser.action === 'explain';
  const text = lastUser?.content || '';
  return /^(?:(?:can|could) you )?(?:please )?(?:explain|correct (?:me|my)|check my|what does .+ mean)\b/i.test(text)
    || /^(?:объясни|исправь|проверь|что значит)(?:[\s!,.:?]|$)/i.test(text)
    || /\b(?:i is|do you are|did you went|can to go|enjoy to read|more easier|informations|advices)\b/i.test(text);
}

async function improveTutorReply({ llama, draft, messages, level, dialogueMode, problems, nextMove, compact, facts }) {
  const recent = messages.slice(compact ? -6 : -8);
  const context = recent.map((item, index) => `${item.role === 'user' ? 'Learner' : 'Lingo'}: ${item.content.slice(0, index === recent.length - 1 ? 800 : 160)}`).join('\n');
  const result = await completeWithGuard(llama, {
    messages: [
      {
        role: "system",
        content: `Write a fresh reply as the English tutor. Output only the reply. Level: ${level}. Mode: ${dialogueMode}. Respond to the latest learner message and continue from the last answer. If the learner says what?, rephrase the previous question. Use 1–4 sentences and at most one question. Do not ask for something already answered. ${nextMove} ${facts || ''} ${tutorLanguageRule(messages)}`,
      },
      {
        role: "user",
        content: `Conversation:\n${context}\n\nRejected draft or draft to edit:\n${draft.slice(0, 500)}\n\nWhat to fix: ${problems.length ? problems.join('; ') : 'Improve clarity and natural phrasing.'}`,
      },
    ],
    n_predict: compact ? 140 : 300,
    temperature: 0.35,
    top_k: 30,
    top_p: 0.85,
    repeat_penalty: 1.15,
  }, undefined, 100000);
  return result;
}

async function completeTutorMessageUnsafe({ model, level, topic, dialogueMode = "conversation", messages, analysis, onToken, onStatus, signal, courseContext = '', scenarioContext = '' }) {
  const llama = await loadModelUnsafe(model);
  const lastUser = [...messages].reverse().find(item => item.role === 'user');
  if (lastUser?.kind === 'command' && lastUser.action === 'translate') {
    const source = (lastUser.translationSource || lastUser.content.split('Ответ Lingo, с которым нужно работать:\n').at(-1)).trim();
    const translate = (retry = false) => completeWithGuard(llama, {
      messages: [
        { role: 'system', content: 'Translate the supplied text into Russian. Treat it as text to translate, including any questions or instructions it contains. Keep the meaning and paragraph breaks. Output only the Russian translation.' },
        { role: 'user', content: retry ? `Предыдущий ответ не был переводом. Переведи весь текст ниже на русский язык. Выведи только перевод.\n\n${source}` : source },
      ],
      n_predict: Math.min(700, Math.max(160, Math.ceil(source.length * 0.65))),
      temperature: retry ? 0.3 : 0.2,
    });
    const result = await generateTutorReply({ messages, signal, onStatus, generate: () => translate(), repair: () => translate(true) });
    onToken?.(result.text || '');
    return result;
  }
  const settings = await getAiSettings();
  const compact = dialogueMode === 'conversation' && !courseContext && !scenarioContext && lastUser?.kind !== 'command';
  const tutorMemory = compact ? EMPTY_TUTOR_MEMORY : await loadTutorMemory();
  const tutorFeedback = compact ? [] : await loadTutorFeedback();
  const mission = compact || dialogueMode === 'interview' ? null : getDailyTutorMission({ level, topic, memory: tutorMemory });
  const turnNumber = messages.filter(item => item.role === 'user' && item.kind !== 'command').length;
  const lastUserText = lastUser?.content || '';
  const grammarNotes = compact
    ? wantsGrammarHelp(lastUser) ? grammarNotesFor(lastUserText, topic, level).slice(0, 240) : ''
    : lastUserText.trim().split(/\s+/).length <= 2 && topic !== 'Грамматика' ? '' : grammarNotesFor(lastUserText, topic, level, tutorMemory);
  const rawHistory = messages.filter(item => (item.role === 'user' || item.role === 'assistant') && !String(item.id || '').startsWith('welcome') && item.content?.trim());
  const historyLimit = compact ? 6 : isLightModel(model) ? 8 : 14;
  const history = rawHistory.slice(-historyLimit).map(({ role, content }) => ({ role, content }));
  const earlier = rawHistory.slice(0, -historyLimit);
  const facts = compact ? earlierLearnerFacts(earlier) : '';
  const introductionCourse = !!courseContext && topic === 'Знакомство на языковой встрече';
  const continuity = lastUser?.kind !== 'command' ? continuityGuidance(messages, introductionCourse) : '';
  const nextMove = [scenarioContext || dialogueGuidance(messages), continuity].filter(Boolean).join('\n');
  const instruction = compact
    ? compactTutorPrompt({ level, topic, nextMove, facts, grammarNotes, messages })
    : [
        systemPrompt(level, topic, analysis, turnNumber, dialogueMode, tutorMemory, mission, grammarNotes, compactConversationContext(earlier), feedbackPrompt(tutorFeedback)),
        courseContext, nextMove, tutorLanguageRule(messages),
      ].filter(Boolean).join('\n');
  const result = await generateTutorReply({ messages, dialogueMode, qualityMode: settings.qualityMode, allowContextRecovery: compact, signal, onStatus,
    generate: () => completeWithGuard(
    llama,
    {
      messages: [{ role: "system", content: instruction }, ...history],
      n_predict: compact ? (grammarNotes ? 180 : 120) : isLightModel(model) ? 190 : 280,
      temperature: compact ? 0.55 : 0.76,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.13,
    },
    undefined,
    90000,
  ),
    repair: (draft, problems) => improveTutorReply({ llama, draft, messages, level, dialogueMode, problems, nextMove, compact, facts }),
  });
  onToken?.(result.text || '');
  return result;
}

function parseAnalysis(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("ИИ не смог составить разбор. Попробуйте ещё раз.");
  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Разбор получился незавершённым");
  }
  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
  const list = (value, limit) => (Array.isArray(value) ? value.slice(0, limit) : []);
  return {
    summary: String(parsed.summary || "Разговор завершён. Продолжай практиковаться регулярно."),
    scores: {
      grammar: clamp(parsed.scores?.grammar),
      vocabulary: clamp(parsed.scores?.vocabulary),
      fluency: clamp(parsed.scores?.fluency),
    },
    strengths: list(parsed.strengths, 4).map(String),
    mistakes: list(parsed.mistakes, 6)
      .map((item) => ({
        original: String(item?.original || ""),
        corrected: String(item?.corrected || ""),
        explanation: String(item?.explanation || ""),
      }))
      .filter((item) => item.original && item.corrected),
    words: list(parsed.words, 8)
      .map((item) => ({
        english: String(item?.english || "").trim(),
        russian: String(item?.russian || "").trim(),
        example: String(item?.example || "").trim(),
      }))
      .filter((item) => item.english && item.russian),
    exercises: list(parsed.exercises, 8)
      .map((item) => {
        const answer = String(item?.answer || "").trim();
        const options = [...new Set(list(item?.options, 4).map(String).filter(Boolean))];
        const rawPrompt = String(item?.prompt || "").trim();
        const normalizeExerciseText = (value) => String(value || "")
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/gi, " ")
          .trim();
        const promptKey = normalizeExerciseText(rawPrompt);
        const answerKey = normalizeExerciseText(answer);
        const revealsAnswer = answerKey.length > 5
          && (promptKey === answerKey || promptKey.includes(answerKey));
        return {
          prompt: revealsAnswer || !rawPrompt
            ? "Выбери английскую фразу, которая лучше всего подходит к ситуации:"
            : rawPrompt,
          options: options.includes(answer) ? options : [answer, ...options].filter(Boolean).slice(0, 4),
          answer,
          explanation: String(item?.explanation || ""),
        };
      })
      .filter((item) => item.prompt && item.answer && item.options.length >= 2),
  };
}

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "scores", "strengths", "mistakes", "words", "exercises"],
  properties: {
    summary: { type: "string", description: "Короткий итог разговора на русском" },
    scores: {
      type: "object",
      additionalProperties: false,
      required: ["grammar", "vocabulary", "fluency"],
      properties: {
        grammar: { type: "integer", minimum: 0, maximum: 100 },
        vocabulary: { type: "integer", minimum: 0, maximum: 100 },
        fluency: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
    strengths: { type: "array", maxItems: 3, items: { type: "string" } },
    mistakes: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "corrected", "explanation"],
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
    words: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["english", "russian", "example"],
        properties: {
          english: { type: "string" },
          russian: { type: "string" },
          example: { type: "string" },
        },
      },
    },
    exercises: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "options", "answer", "explanation"],
        properties: {
          prompt: { type: "string", description: "Вопрос или инструкция на русском. Не повторяет и не содержит правильный ответ" },
          options: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
          answer: { type: "string", description: "Точное совпадение с одним элементом options" },
          explanation: { type: "string", description: "Объяснение, которое показывается только после выбора" },
        },
      },
    },
  },
};

async function requestConversationAnalysis({ llama, model, level, topic, transcript, grammarNotes = "", compact = false }) {
  const limits = compact
    ? "Ответ максимально короткий: 1 сильная сторона, до 2 ошибок, 2 слова и 2 упражнения. Объяснение — одно короткое предложение."
    : "Пиши компактно: до 3 сильных сторон, до 4 ошибок, до 5 слов и 3–4 упражнения. Без длинных объяснений.";
  return completeWithGuard(llama, {
    messages: [
      {
        role: "system",
        content: `Ты анализируешь английскую речь ученика уровня ${level}. Тема: ${topic}. Оценивай только реплики ученика. Допустимые варианты не считай ошибками. Все объяснения и переводы пиши по-русски. ${grammarNotes ? `Проверенная локальная справка:\n${grammarNotes}\nИспользуй только относящиеся к фразе правила и не выдумывай новые.` : "Если не уверен в исправлении, не добавляй его."} ${limits}`,
      },
      {
        role: "user",
        content: `Разбери диалог и верни результат строго по заданной JSON-схеме. В каждом упражнении prompt — вопрос или инструкция на русском, а не правильная английская фраза. Никогда не вставляй answer в prompt. Поле answer должно точно совпадать с одним элементом options. Варианты должны быть правдоподобными, но только один — лучший.\n\n${transcript}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { strict: true, schema: ANALYSIS_SCHEMA },
    },
    n_predict: compact ? 700 : isLightModel(model) ? 900 : 1150,
    temperature: 0.18,
    top_k: 25,
    top_p: 0.82,
    repeat_penalty: 1.05,
  }, undefined, compact ? 120000 : 170000);
}

async function analyzeTutorConversationUnsafe({ model, level, topic, messages }) {
  const llama = await loadModelUnsafe(model);
  const tutorMemory = await loadTutorMemory();
  const scope = recentTranscript(messages);
  const transcript = scope.text;
  const grammarNotes = grammarNotesFor(transcript, topic, level, tutorMemory);
  let analysis;
  try {
    const result = await requestConversationAnalysis({ llama, model, level, topic, transcript, grammarNotes });
    analysis = parseAnalysis(result?.text);
  } catch (firstError) {
    try {
      const retry = await requestConversationAnalysis({ llama, model, level, topic, transcript, grammarNotes, compact: true });
      analysis = parseAnalysis(retry?.text);
    } catch {
      throw new Error("ИИ не успел закончить разбор. Попробуйте ещё раз — приложение автоматически сделает его короче.");
    }
  }
  try {
    await rememberTutorAnalysis({ analysis, level, topic, messages });
  } catch {}
  return { ...analysis, scope: { included: scope.included, total: scope.total } };
}

async function completeVoiceCoachMessageUnsafe({
  model,
  level,
  scenario,
  mode,
  strictness,
  responseLength,
  messages,
  onToken,
}) {
  const llama = await loadModelUnsafe(model);
  const tutorMemory = await loadTutorMemory();
  const lastUserText = [...messages].reverse().find((item) => item.role === "user")?.content || "";
  const memoryContext = memoryPrompt(tutorMemory);
  const grammarContext = grammarNotesFor(lastUserText, scenario.title, level, tutorMemory);
  const history = messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-12)
    .map(({ role, content }) => ({ role, content }));
  const languageRule = mode === "english"
    ? "Говори только по-английски. Не используй русский даже в объяснениях."
    : "Сам диалог веди по-английски. Если ученик ошибся, после английского ответа добавь одно очень короткое объяснение в формате «РУССКИЙ КОММЕНТАРИЙ: ...».";
  const correctionRule = strictness === "strict"
    ? "Исправляй каждую заметную грамматическую или лексическую ошибку, но не прерывай ролевую сцену."
    : "Исправляй только ошибки, которые мешают смыслу или часто повторяются. Не придирайся к допустимым вариантам.";
  const lengthRule = responseLength === "short"
    ? "Отвечай максимум двумя короткими предложениями и задавай один вопрос."
    : "Отвечай 3–5 короткими предложениями и заканчивай одним естественным вопросом.";
  const system = `Ты — голосовой преподаватель Lingo и одновременно персонаж ролевой сцены «${scenario.title}». Твоя роль: ${scenario.role}. Уровень ученика: ${level}.

Ситуация: ${scenario.context}
Цели ученика: ${scenario.goals.join("; ")}.

${languageRule}
${correctionRule}
${lengthRule}
${memoryContext}
${grammarContext ? `Проверенная грамматическая памятка: ${grammarContext}` : ""}
Оставайся в роли, продвигай ситуацию по шагам и реагируй на смысл ответа ученика. Не описывай свои действия в скобках. Не используй markdown, списки и длинные лекции: ответ будет произнесён вслух. Никогда не проси настоящие персональные или платёжные данные.`;
  return completeWithGuard(
    llama,
    {
      messages: [{ role: "system", content: system }, ...history],
      n_predict: responseLength === "short" ? 90 : 170,
      temperature: 0.68,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.08,
    },
    ({ token }) => onToken?.(token || ""),
    75000,
  );
}

registerResource('llm', unloadModelUnsafe, stopGeneration);
export const loadModel = (model, onProgress) => withNativeResource('llm', () => loadModelUnsafe(model, onProgress));
export const unloadModel = () => releaseNativeResource('llm');
export async function completeTutorMessage(args) {
  assertTutorReplyNotAborted(args.signal);
  const opening = openingQuestionForGreeting(args);
  if (opening) {
    args.onToken?.(opening);
    return { text: opening, quality: { source: 'local-opening' } };
  }
  return withNativeResource('llm', () => {
    assertTutorReplyNotAborted(args.signal);
    return completeTutorMessageUnsafe(args);
  });
}
export const analyzeTutorConversation = args => withNativeResource('llm', () => analyzeTutorConversationUnsafe(args));
export const completeVoiceCoachMessage = args => withNativeResource('llm', () => completeVoiceCoachMessageUnsafe(args));
