import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { initLlama, releaseAllLlama } from "@pocketpalai/llama.rn";

const MODEL_DIR = `${FileSystem.documentDirectory}lingospark-ai/`;
const ACTIVE_MODEL_KEY = "@lingospark/local-ai-model-v1";

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
let activeDownload = null;

export const modelPath = (model) => `${MODEL_DIR}${model.filename}`;

async function ensureModelDirectory() {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

export async function inspectModels() {
  await ensureModelDirectory();
  const entries = await Promise.all(
    AI_MODELS.map(async (model) => {
      const info = await FileSystem.getInfoAsync(modelPath(model), { size: true });
      const complete = info.exists && (info.size || 0) >= model.size * 0.98;
      return [model.id, { installed: complete, bytes: info.size || 0 }];
    }),
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

export async function downloadModel(model, onProgress) {
  await ensureModelDirectory();
  if (activeDownload) throw new Error("Другая модель уже загружается");
  const destination = modelPath(model);
  const existing = await FileSystem.getInfoAsync(destination);
  if (existing.exists) await FileSystem.deleteAsync(destination, { idempotent: true });

  const task = FileSystem.createDownloadResumable(
    model.url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.size;
      onProgress?.({
        written: totalBytesWritten,
        total,
        progress: Math.min(1, totalBytesWritten / total),
      });
    },
  );
  activeDownload = { task, destination, modelId: model.id };
  try {
    const result = await task.downloadAsync();
    if (!result?.uri) throw new Error("Файл модели не был сохранён");
    const info = await FileSystem.getInfoAsync(result.uri, { size: true });
    if (!info.exists || (info.size || 0) < model.size * 0.98) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
      throw new Error("Модель загрузилась не полностью. Попробуйте ещё раз.");
    }
    await setActiveModelId(model.id);
    return result.uri;
  } finally {
    activeDownload = null;
  }
}

export async function cancelModelDownload() {
  if (!activeDownload) return;
  const current = activeDownload;
  activeDownload = null;
  try {
    await current.task.pauseAsync();
  } catch {}
  await FileSystem.deleteAsync(current.destination, { idempotent: true });
}

export async function deleteModel(model) {
  if (contextModelId === model.id) await unloadModel();
  await FileSystem.deleteAsync(modelPath(model), { idempotent: true });
  if ((await getActiveModelId()) === model.id) await setActiveModelId(null);
}

export async function loadModel(model, onProgress) {
  if (context && contextModelId === model.id) return context;
  await unloadModel();
  const info = await FileSystem.getInfoAsync(modelPath(model), { size: true });
  if (!info.exists || (info.size || 0) < model.size * 0.98) {
    throw new Error("Сначала скачайте выбранную модель");
  }
  context = await initLlama(
    {
      model: modelPath(model),
      n_ctx: model.context,
      n_batch: 256,
      n_threads: 4,
      n_gpu_layers: 99,
      use_mmap: true,
      use_mlock: false,
      use_progress_callback: true,
    },
    (progress) => onProgress?.(Math.max(0, Math.min(1, progress / 100))),
  );
  contextModelId = model.id;
  return context;
}

export async function unloadModel() {
  if (!context) return;
  try {
    await releaseAllLlama();
  } finally {
    context = null;
    contextModelId = null;
  }
}

export async function stopGeneration() {
  if (context) await context.stopCompletion();
}

function systemPrompt(level, topic) {
  return `Ты — Lingo, доброжелательный преподаватель английского в приложении LingoSpark. Ученик говорит по-русски и учит английский на уровне ${level}. Тема занятия: ${topic}.

Правила:
1. Веди живой учебный диалог, а не просто отвечай на вопросы.
2. Если ученик пишет по-английски, сначала коротко отреагируй на смысл. Затем исправь только реальные ошибки и объясни их простым русским языком.
3. Показывай исправленную английскую фразу. Не придирайся к допустимому порядку слов и вариантам английского.
4. Подстраивай лексику и длину предложений под ${level}. На A1–A2 объясняй преимущественно по-русски; на B1–C1 постепенно увеличивай долю английского.
5. Завершай ответ одним вопросом или небольшим заданием, чтобы разговор продолжался.
6. Не выдумывай правила. Если не уверен, честно скажи об этом.
7. Ответ должен быть компактным: обычно 3–7 предложений. Используй понятные абзацы без таблиц.
8. Никогда не проси персональные данные и не утверждай, что имеешь доступ к интернету. Ты работаешь полностью на устройстве.`;
}

export async function completeTutorMessage({ model, level, topic, messages, onToken }) {
  const llama = await loadModel(model);
  const history = messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
  return llama.completion(
    {
      messages: [{ role: "system", content: systemPrompt(level, topic) }, ...history],
      n_predict: model.id === "light" ? 180 : 260,
      temperature: 0.65,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.08,
      stop: ["<|im_end|>", "<|endoftext|>", "</s>"],
    },
    ({ token }) => onToken?.(token || ""),
  );
}
