import { withNativeResource, registerResource, releaseNativeResource } from './nativeResources';
import { budgetMessages, recentTranscript } from '../utils/contextBudget';
import { now, recordTiming } from '../utils/performance';
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

export const AI_MODELS = [
  {
    id: "light",
    title: "Лёгкий",
    subtitle: "Быстрые диалоги и простые объяснения",
    size: 397808192,
    sizeLabel: "398 МБ",
    model: "Qwen 2.5 · 0.5B · Q4",
    filename: "Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
    context: 2048,
    color: "#2ED3B7",
    icon: "flash",
    device: "Подойдёт для большинства iPhone",
  },
  {
    id: "standard",
    title: "Обычный",
    subtitle: "Лучший баланс качества и скорости",
    size: 986048768,
    sizeLabel: "986 МБ",
    model: "Qwen 2.5 · 1.5B · Q4",
    filename: "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    context: 3072,
    color: "#7C5CFC",
    icon: "sparkles",
    recommended: true,
    device: "Рекомендуется iPhone 12 и новее",
  },
  {
    id: "advanced",
    title: "Продвинутый",
    subtitle: "Глубокие объяснения и сложные диалоги",
    size: 1929903264,
    sizeLabel: "1,93 ГБ",
    model: "Qwen 2.5 · 3B · Q4",
    filename: "Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    context: 4096,
    color: "#FF9F43",
    icon: "diamond",
    device: "Рекомендуется iPhone 14 Pro и новее",
  },
];

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
  if (bytes < model.size * 0.98) return { installed: false, verified: false, bytes, reason: "Файл загружен не полностью" };
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

async function runDownload(model, resumeData = null) {
  await ensureModelDirectory();
  if (activeDownload) {
    if (activeDownload.modelId === model.id) return activeDownload.promise;
    throw new Error("Другая модель уже загружается");
  }
  const destination = modelPath(model);
  const existing = await FileSystem.getInfoAsync(destination);
  if (!resumeData && existing.exists) await FileSystem.deleteAsync(destination, { idempotent: true });

  publishDownload({
    status: "downloading",
    modelId: model.id,
    progress: resumeData && existing.exists ? Math.min(0.99, (existing.size || 0) / model.size) : 0,
    written: resumeData && existing.exists ? existing.size || 0 : 0,
    total: model.size,
    error: "",
  });
  let lastProgressPublish = 0;
  let lastProgressAt = 0;
  const task = FileSystem.createDownloadResumable(
    model.url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.size;
      const progress = Math.min(1, totalBytesWritten / total);
      const now = Date.now();
      if (progress < 1 && progress - lastProgressPublish < 0.005 && now - lastProgressAt < 150) return;
      lastProgressPublish = progress;
      lastProgressAt = now;
      publishDownload({
        written: totalBytesWritten,
        total,
        progress,
      });
    },
    resumeData || undefined,
  );
  const promise = (async () => {
    try {
      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error("Файл модели не был сохранён");
      const verification = await verifyModelFile(model);
      if (!verification.verified) {
        await FileSystem.deleteAsync(destination, { idempotent: true });
        throw new Error(verification.reason || "Модель загрузилась не полностью. Попробуйте ещё раз.");
      }
      await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
      await setActiveModelId(model.id);
      publishDownload({
        status: "completed",
        modelId: model.id,
        progress: 1,
        written: verification.bytes || model.size,
        total: model.size,
        error: "",
      });
      return result.uri;
    } catch (error) {
      if (downloadState.status !== "cancelled" && downloadState.status !== "paused") {
        publishDownload({
          status: "error",
          error: error?.message || "Не удалось скачать модель",
        });
      }
      throw error;
    } finally {
      if (activeDownload?.promise === promise) activeDownload = null;
    }
  })();
  activeDownload = { task, destination, modelId: model.id, promise };
  return promise;
}

export async function downloadModel(model) {
  await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
  return runDownload(model);
}

export async function pauseActiveModelDownload() {
  if (!activeDownload || downloadState.status !== "downloading") return false;
  const current = activeDownload;
  try {
    const paused = await current.task.pauseAsync();
    if (!paused?.resumeData) return false;
    await AsyncStorage.setItem(DOWNLOAD_RESUME_KEY, JSON.stringify({
      modelId: current.modelId,
      resumeData: paused.resumeData,
      written: downloadState.written,
      total: downloadState.total,
    }));
    publishDownload({ status: "paused", error: "" });
    return true;
  } catch {
    return false;
  }
}

export async function resumePendingModelDownload() {
  if (activeDownload && downloadState.status === "downloading") return activeDownload.promise;
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(DOWNLOAD_RESUME_KEY)) || "null");
    const model = AI_MODELS.find((item) => item.id === saved?.modelId);
    if (!model || !saved.resumeData) return null;
    activeDownload = null;
    publishDownload({
      status: "paused",
      modelId: model.id,
      written: saved.written || 0,
      total: saved.total || model.size,
      progress: Math.min(0.99, (saved.written || 0) / (saved.total || model.size)),
      error: "",
    });
    return runDownload(model, saved.resumeData);
  } catch {
    await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
    return null;
  }
}

export async function cancelModelDownload() {
  if (!activeDownload) return;
  const current = activeDownload;
  activeDownload = null;
  publishDownload({
    status: "cancelled",
    modelId: current.modelId,
    progress: 0,
    written: 0,
    error: "",
  });
  try {
    await current.task.pauseAsync();
  } catch {}
  await AsyncStorage.removeItem(DOWNLOAD_RESUME_KEY);
  await FileSystem.deleteAsync(current.destination, { idempotent: true });
}

export async function loadTutorSessions() {
  try {
    const raw = await AsyncStorage.getItem(TUTOR_SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTutorSession(session) {
  const sessions = await loadTutorSessions();
  const next = [
    { ...session, updatedAt: Date.now() },
    ...sessions.filter((item) => item.id !== session.id),
  ]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 30);
  await AsyncStorage.setItem(TUTOR_SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export async function deleteTutorSession(sessionId) {
  const sessions = await loadTutorSessions();
  const next = sessions.filter((item) => item.id !== sessionId);
  await AsyncStorage.setItem(TUTOR_SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export async function clearTutorSessions() {
  await AsyncStorage.removeItem(TUTOR_SESSIONS_KEY);
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
  options = { ...options, n_predict: predicted, messages: budgetMessages(options.messages, (contextSize - predicted - 160) * 2.4) };
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
  const analysisMemory = analysis
    ? `\nПамять о последнем разборе: оценки — грамматика ${analysis.scores?.grammar || 0}/100, словарь ${analysis.scores?.vocabulary || 0}/100, связность ${analysis.scores?.fluency || 0}/100. Повторяющиеся места для практики: ${(analysis.mistakes || []).slice(0, 3).map((item) => item.explanation).join("; ") || "закрепление естественной речи"}. Учитывай это мягко и не повторяй один и тот же комментарий в каждом ответе.\n`
    : "";
  const dialogueMoves = [
    "Продолжи ситуацию конкретным уточняющим вопросом, связанным с последней репликой ученика.",
    "Добавь небольшой неожиданный поворот или новую деталь и предложи ученику отреагировать.",
    "Попроси ученика выбрать между двумя естественными вариантами и объяснить выбор.",
    "Задай ролевую мини-ситуацию на одну реплику. Не давай готовый ответ заранее.",
    "Спроси мнение или личный пример по теме, не повторяя предыдущий вопрос.",
  ];
  const currentMove = dialogueMoves[Math.max(0, turnNumber - 1) % dialogueMoves.length];
  const modeRules = {
    conversation: `Режим «Живой разговор». Текущий ход: ${currentMove}`,
    roleplay: `Режим «Ролевая игра». Выбери правдоподобного персонажа по теме «${topic}», сразу обозначь его роль и оставайся в ней. Продвигай сцену по одному событию за ход. Добавляй небольшие препятствия и реакции персонажа. Исправления отделяй одной короткой строкой после реплики персонажа. Не описывай действия в скобках и не выходи из роли без просьбы ученика.`,
    debate: `Режим «Дебаты». Займи разумную позицию, отличную от позиции ученика. В каждом ходе оспаривай только один тезис, проси причину, пример или доказательство и иногда признавай сильный аргумент. Не соглашайся автоматически и не превращай ответ в лекцию. Исправление языка давай после аргумента одной короткой строкой.`,
    story: `Режим «История с выбором». Пиши совместную историю по теме «${topic}». За ход добавляй 2–3 коротких предложения, затем предлагай два разных решения A и B или проси придумать своё. Никогда не выбирай за ученика и не пересказывай всю историю заново. Мягко исправляй реплику ученика отдельной короткой строкой.`,
    strict: `Режим «Строгий преподаватель». Проверяй каждую реплику точно, без пустой похвалы. Сначала ответь на смысл одним предложением. Если есть ошибки, используй компактный формат «Твоя фраза: ...», «Лучше: ...», «Почему: ...». Затем дай одно новое задание без готового ответа. Если ошибок нет, прямо скажи «Фраза верная» и усложни следующее задание.`,
  };
  const modeInstruction = modeRules[dialogueMode] || modeRules.conversation;
  const longTermMemory = memoryPrompt(tutorMemory);
  const missionPrompt = mission ? `Сегодняшняя миссия ученика: ${mission.description} Мягко создавай возможности выполнить её, но не выполняй за ученика.` : "";
  const referencePrompt = grammarNotes ? `Проверенная грамматическая памятка: ${grammarNotes} Опирайся на неё и не выдумывай исключения.` : "";
  return `Ты — Lingo, живой и внимательный преподаватель английского в приложении LingoSpark. Ученик говорит по-русски и учит английский на уровне ${level}. Тема занятия: ${topic}.${analysisMemory}

${longTermMemory}
${missionPrompt}
${referencePrompt}
${longContext ? `Краткий контекст более ранней части этого диалога: ${longContext}` : ""}
${learnerFeedback}

${modeInstruction}

Правила:
1. Реагируй именно на смысл последней реплики и учитывай факты из предыдущих сообщений. Не начинай каждый ответ с Sure, Great, Of course или похвалы.
2. Если реплика ученика состоит из одного-двух слов или непонятна, не додумывай за него: предложи естественную полную фразу и задай один уточняющий вопрос.
3. Исправляй только реальные ошибки. Сначала поддержи смысл разговора, затем коротко покажи «Лучше: ...» и объясни по-русски. Если ошибки нет, не создавай раздел с исправлением.
4. Не повторяй уже заданный вопрос, одинаковую конструкцию ответа или одну и ту же похвалу в соседних сообщениях.
5. Следуй выбранному режиму и не смешивай его с другими режимами без просьбы ученика.
6. Не отвечай за ученика и не показывай готовую реплику, если просишь его выполнить задание. Можно дать только короткую подсказку или начало фразы.
7. Подстраивай лексику под ${level}. На A1–A2 используй больше русского в объяснениях; на B1–C1 веди основную беседу по-английски.
8. Обычно пиши 2–6 предложений. Чередуй вопрос, ролевую ситуацию, выбор, мнение и небольшую языковую задачу.
9. Никогда не проси настоящие персональные или платёжные данные и не утверждай, что имеешь доступ к интернету. Ты работаешь на устройстве.`;
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

function normalizedWords(text) {
  return String(text || "").toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, " ").split(/\s+/).filter((word) => word.length > 2);
}

function replySimilarity(left, right) {
  const a = new Set(normalizedWords(left));
  const b = new Set(normalizedWords(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / Math.max(a.size, b.size);
}

function findReplyProblems({ reply, messages, dialogueMode }) {
  const text = String(reply || "").trim();
  const problems = [];
  if (text.length < 12) problems.push("ответ слишком короткий или пустой");
  if (text.length > 2400) problems.push("ответ слишком длинный для учебного диалога");
  if (/```|<\|im_|<\|end|\{\s*"(?:role|content)"/i.test(text)) problems.push("в ответ попал технический текст");
  const previous = messages.filter((item) => item.role === "assistant").slice(-3);
  if (previous.some((item) => normalizedWords(item.content).length > 8 && replySimilarity(text, item.content) > 0.72)) problems.push("ответ слишком похож на недавнюю реплику");
  const lastUser = [...messages].reverse().find((item) => item.role === "user")?.content || "";
  if (normalizedWords(lastUser).length <= 2 && !/[?？]/.test(text)) problems.push("непонятная короткая реплика ученика была додумана без уточнения");
  if (dialogueMode === "story" && !/\bA[).:]|\bB[).:]|выбор|choice|what (?:do|would) you/i.test(text)) problems.push("история не оставляет ученику выбора");
  return problems;
}

async function improveTutorReply({ llama, draft, messages, level, dialogueMode, problems, grammarNotes, onToken }) {
  const context = messages.slice(-8).map((item) => `${item.role === "user" ? "Ученик" : "Lingo"}: ${item.content}`).join("\n");
  const result = await completeWithGuard(llama, {
    messages: [
      {
        role: "system",
        content: `Ты — скрытый редактор ответа преподавателя английского. Верни только итоговую реплику Lingo без комментариев о проверке. Сохрани смысл диалога, но убери повторы, выдуманные исправления, технический текст и готовые ответы на задания. Уровень ученика: ${level}. Режим: ${dialogueMode}. ${grammarNotes ? `Используй только подходящие правила из памятки: ${grammarNotes}` : "Не объявляй грамматическую ошибку, если не уверен."}`,
      },
      {
        role: "user",
        content: `Контекст:\n${context}\n\nЧерновик:\n${draft}\n\nПроблемы для проверки: ${problems.length ? problems.join("; ") : "проверь точность, естественность и отсутствие повторов"}. Перепиши только если это улучшит ответ.`,
      },
    ],
    n_predict: 300,
    temperature: 0.35,
    top_k: 30,
    top_p: 0.85,
    repeat_penalty: 1.15,
    stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
  }, ({ token }) => onToken?.(token || ""), 100000);
  return String(result?.text || "").trim() ? result : { ...result, text: draft };
}

async function completeTutorMessageUnsafe({ model, level, topic, dialogueMode = "conversation", messages, analysis, onToken, courseContext = '' }) {
  const llama = await loadModelUnsafe(model);
  const settings = await getAiSettings();
  const tutorMemory = await loadTutorMemory();
  const tutorFeedback = await loadTutorFeedback();
  const mission = getDailyTutorMission({ level, topic, memory: tutorMemory });
  const turnNumber = messages.filter((item) => item.role === "user" && item.kind !== "command").length;
  const lastUserText = [...messages].reverse().find((item) => item.role === "user")?.content || "";
  const grammarNotes = grammarNotesFor(lastUserText, topic, level, tutorMemory);
  const rawHistory = messages.filter((item) => item.role === "user" || item.role === "assistant");
  const fullHistory = rawHistory.map(({ role, content }) => ({ role, content }));
  const historyLimit = model.id === "light" ? 8 : 14;
  const history = fullHistory.slice(-historyLimit);
  const longContext = compactConversationContext(rawHistory.slice(0, -historyLimit));
  const learnerFeedback = feedbackPrompt(tutorFeedback);
  const draft = await completeWithGuard(
    llama,
    {
      messages: [{ role: "system", content: systemPrompt(level, topic, analysis, turnNumber, dialogueMode, tutorMemory, mission, grammarNotes, longContext, learnerFeedback) + courseContext }, ...history],
      n_predict: model.id === "light" ? 190 : 280,
      temperature: 0.76,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.13,
      stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
    },
    settings.qualityMode ? undefined : ({ token }) => onToken?.(token || ""),
    90000,
  );
  const draftText = String(draft?.text || "").trim();
  const problems = findReplyProblems({ reply: draftText, messages, dialogueMode });
  const baseQuality = {
    checked: settings.qualityMode ? "double" : "automatic",
    confidence: grammarNotes ? "high" : problems.length ? "medium" : "normal",
    source: grammarNotes ? "grammar" : "context",
  };
  if (!settings.qualityMode && !problems.length) return { ...draft, quality: baseQuality };
  const improved = await improveTutorReply({
    llama,
    draft: draftText,
    messages,
    level,
    dialogueMode,
    problems,
    grammarNotes,
    onToken: settings.qualityMode ? onToken : undefined,
  });
  return { ...improved, quality: { ...baseQuality, checked: settings.qualityMode ? "double" : "regenerated", confidence: grammarNotes ? "high" : "medium" } };
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
    n_predict: compact ? 700 : model.id === "light" ? 900 : 1150,
    temperature: 0.18,
    top_k: 25,
    top_p: 0.82,
    repeat_penalty: 1.05,
    stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
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
      stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
    },
    ({ token }) => onToken?.(token || ""),
    75000,
  );
}

registerResource('llm', unloadModelUnsafe, stopGeneration);
export const loadModel = (model, onProgress) => withNativeResource('llm', () => loadModelUnsafe(model, onProgress));
export const unloadModel = () => releaseNativeResource('llm');
export const completeTutorMessage = args => withNativeResource('llm', () => completeTutorMessageUnsafe(args));
export const analyzeTutorConversation = args => withNativeResource('llm', () => analyzeTutorConversationUnsafe(args));
export const completeVoiceCoachMessage = args => withNativeResource('llm', () => completeVoiceCoachMessageUnsafe(args));
