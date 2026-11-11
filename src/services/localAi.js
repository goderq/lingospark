import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { initLlama, releaseAllLlama } from "@pocketpalai/llama.rn";

const MODEL_DIR = `${FileSystem.documentDirectory}lingospark-ai/`;
const ACTIVE_MODEL_KEY = "@lingospark/local-ai-model-v1";
const TUTOR_SESSIONS_KEY = "@lingospark/ai-tutor-sessions-v1";
const AI_SETTINGS_KEY = "@lingospark/ai-settings-v1";
const DOWNLOAD_RESUME_KEY = "@lingospark/ai-download-resume-v1";

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

export async function getAiSettings() {
  try {
    const value = JSON.parse((await AsyncStorage.getItem(AI_SETTINGS_KEY)) || "{}");
    return { economyMode: Boolean(value.economyMode) };
  } catch {
    return { economyMode: false };
  }
}

export async function setAiSettings(changes) {
  const next = { ...(await getAiSettings()), ...changes };
  await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function getEngineDiagnostics() {
  return { ...engineDiagnostics };
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
  const task = FileSystem.createDownloadResumable(
    model.url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.size;
      publishDownload({
        written: totalBytesWritten,
        total,
        progress: Math.min(1, totalBytesWritten / total),
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

export async function loadModel(model, onProgress) {
  if (context && contextModelId === model.id) return context;
  await unloadModel();
  const verification = await verifyModelFile(model);
  if (!verification.verified) {
    throw new Error("Сначала скачайте выбранную модель");
  }
  const settings = await getAiSettings();
  context = await initLlama(
    {
      model: modelPath(model),
      n_ctx: settings.economyMode ? Math.min(2048, model.context) : model.context,
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
    gpu: context?.gpu ?? null,
    reasonNoGPU: context?.reasonNoGPU || "",
  };
  return context;
}

export async function unloadModel() {
  if (!context) return;
  try {
    await releaseAllLlama();
  } finally {
    context = null;
    contextModelId = null;
    engineDiagnostics = { ...engineDiagnostics, loadedModelId: null, gpu: null, reasonNoGPU: "" };
  }
}

export async function stopGeneration() {
  if (context) await context.stopCompletion();
}

async function completeWithGuard(llama, options, onToken, timeoutMs = 90000) {
  const startedAt = Date.now();
  let timer;
  try {
    const result = await Promise.race([
      llama.completion(options, onToken),
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

function systemPrompt(level, topic, analysis, turnNumber = 1, dialogueMode = "conversation") {
  const memory = analysis
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
  return `Ты — Lingo, живой и внимательный преподаватель английского в приложении LingoSpark. Ученик говорит по-русски и учит английский на уровне ${level}. Тема занятия: ${topic}.${memory}

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

export async function completeTutorMessage({ model, level, topic, dialogueMode = "conversation", messages, analysis, onToken }) {
  const llama = await loadModel(model);
  const turnNumber = messages.filter((item) => item.role === "user").length;
  const history = messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(model.id === "light" ? -8 : -14)
    .map(({ role, content }) => ({ role, content }));
  return completeWithGuard(
    llama,
    {
      messages: [{ role: "system", content: systemPrompt(level, topic, analysis, turnNumber, dialogueMode) }, ...history],
      n_predict: model.id === "light" ? 190 : 280,
      temperature: 0.76,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.13,
      stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
    },
    ({ token }) => onToken?.(token || ""),
    90000,
  );
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

async function requestConversationAnalysis({ llama, model, level, topic, transcript, compact = false }) {
  const limits = compact
    ? "Ответ максимально короткий: 1 сильная сторона, до 2 ошибок, 2 слова и 2 упражнения. Объяснение — одно короткое предложение."
    : "Пиши компактно: до 3 сильных сторон, до 4 ошибок, до 5 слов и 3–4 упражнения. Без длинных объяснений.";
  return completeWithGuard(llama, {
    messages: [
      {
        role: "system",
        content: `Ты анализируешь английскую речь ученика уровня ${level}. Тема: ${topic}. Оценивай только реплики ученика. Допустимые варианты не считай ошибками. Все объяснения и переводы пиши по-русски. ${limits}`,
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

export async function analyzeTutorConversation({ model, level, topic, messages }) {
  const llama = await loadModel(model);
  const transcript = messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-12)
    .map((item) => `${item.role === "user" ? "Ученик" : "Преподаватель"}: ${item.content}`)
    .join("\n")
    .slice(-6000);
  try {
    const result = await requestConversationAnalysis({ llama, model, level, topic, transcript });
    return parseAnalysis(result?.text);
  } catch (firstError) {
    try {
      const retry = await requestConversationAnalysis({ llama, model, level, topic, transcript, compact: true });
      return parseAnalysis(retry?.text);
    } catch {
      throw new Error("ИИ не успел закончить разбор. Попробуйте ещё раз — приложение автоматически сделает его короче.");
    }
  }
}

export async function completeVoiceCoachMessage({
  model,
  level,
  scenario,
  mode,
  strictness,
  responseLength,
  messages,
  onToken,
}) {
  const llama = await loadModel(model);
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
