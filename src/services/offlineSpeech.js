import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import LiveAudioStream from "@fugood/react-native-audio-pcm-stream";
import { Base64 } from "js-base64";
import { initWhisper, releaseAllWhisper } from "whisper.rn";

const MODEL_DIR = `${FileSystem.documentDirectory}lingospark-speech/`;
const ACTIVE_KEY = "@lingospark/offline-speech-model-v1";
const RESUME_KEY = "@lingospark/offline-speech-download-v1";

export const SPEECH_MODELS = [
  { id: "speech-light", title: "Лёгкая", subtitle: "Короткие фразы и диктант", model: "Whisper Tiny English · Q5", filename: "ggml-tiny.en-q5_1.bin", size: 32166155, sizeLabel: "32 МБ", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin", color: "#2ED3B7", device: "Быстрее всего · подходит большинству iPhone" },
  { id: "speech-standard", title: "Обычная", subtitle: "Лучший баланс точности и скорости", model: "Whisper Base English · Q5", filename: "ggml-base.en-q5_1.bin", size: 59721011, sizeLabel: "60 МБ", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en-q5_1.bin", color: "#7C5CFC", device: "Рекомендуется для ежедневных занятий", recommended: true },
  { id: "speech-advanced", title: "Продвинутая", subtitle: "Точнее на длинных и сложных фразах", model: "Whisper Small English · Q5", filename: "ggml-small.en-q5_1.bin", size: 190098681, sizeLabel: "190 МБ", url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en-q5_1.bin", color: "#FF9F43", device: "Рекомендуется iPhone 12 и новее" },
];

let context = null;
let contextModelId = null;
let activeDownload = null;
let activeRecording = null;
let state = { status: "idle", modelId: null, progress: 0, written: 0, total: 0, error: "" };
const listeners = new Set();

const publish = (changes) => { state = { ...state, ...changes }; listeners.forEach((listener) => listener(state)); };
export const getSpeechDownloadState = () => state;
export function subscribeSpeechDownload(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); }
export const speechModelPath = (model) => `${MODEL_DIR}${model.filename}`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
}

export async function verifySpeechModel(model) {
  await ensureDir();
  const path = speechModelPath(model);
  const info = await FileSystem.getInfoAsync(path, { size: true });
  if (!info.exists) return { installed: false, verified: false, bytes: 0, reason: "Файл не найден" };
  const bytes = info.size || 0;
  if (bytes < model.size * 0.98) return { installed: false, verified: false, bytes, reason: "Загрузка не завершена" };
  try {
    const header = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64, position: 0, length: 4 });
    const verified = header.replace(/=+$/, "") === "bG1nZw";
    return { installed: verified, verified, bytes, reason: verified ? "" : "Неверный формат модели" };
  } catch {
    return { installed: false, verified: false, bytes, reason: "Не удалось проверить модель" };
  }
}

export async function inspectSpeechModels() {
  const entries = await Promise.all(SPEECH_MODELS.map(async (model) => [model.id, await verifySpeechModel(model)]));
  return Object.fromEntries(entries);
}
export const getActiveSpeechModelId = () => AsyncStorage.getItem(ACTIVE_KEY);
export async function setActiveSpeechModelId(id) { if (id) await AsyncStorage.setItem(ACTIVE_KEY, id); else await AsyncStorage.removeItem(ACTIVE_KEY); }

async function runDownload(model, resumeData = null) {
  await ensureDir();
  if (activeDownload) {
    if (activeDownload.modelId === model.id) return activeDownload.promise;
    throw new Error("Другая речевая модель уже загружается");
  }
  const destination = speechModelPath(model);
  const existing = await FileSystem.getInfoAsync(destination, { size: true });
  if (!resumeData && existing.exists) await FileSystem.deleteAsync(destination, { idempotent: true });
  publish({ status: "downloading", modelId: model.id, progress: resumeData && existing.exists ? Math.min(0.99, (existing.size || 0) / model.size) : 0, written: resumeData && existing.exists ? existing.size || 0 : 0, total: model.size, error: "" });
  const task = FileSystem.createDownloadResumable(model.url, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : model.size;
    publish({ written: totalBytesWritten, total, progress: Math.min(1, totalBytesWritten / total) });
  }, resumeData || undefined);
  const promise = (async () => {
    try {
      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error("Файл модели не был сохранён");
      const check = await verifySpeechModel(model);
      if (!check.verified) {
        await FileSystem.deleteAsync(destination, { idempotent: true });
        throw new Error(check.reason || "Модель загрузилась не полностью");
      }
      await AsyncStorage.removeItem(RESUME_KEY);
      await setActiveSpeechModelId(model.id);
      publish({ status: "completed", modelId: model.id, progress: 1, written: check.bytes, total: model.size, error: "" });
      return result.uri;
    } catch (error) {
      if (!["paused", "cancelled"].includes(state.status)) publish({ status: "error", error: error?.message || "Не удалось скачать речевую модель" });
      throw error;
    } finally {
      if (activeDownload?.promise === promise) activeDownload = null;
    }
  })();
  activeDownload = { task, promise, modelId: model.id, destination };
  return promise;
}

export async function downloadSpeechModel(model) { await AsyncStorage.removeItem(RESUME_KEY); return runDownload(model); }
export async function cancelSpeechModelDownload() {
  if (!activeDownload) return;
  const current = activeDownload; activeDownload = null;
  publish({ status: "cancelled", modelId: current.modelId, progress: 0, written: 0, error: "" });
  try { await current.task.pauseAsync(); } catch {}
  await AsyncStorage.removeItem(RESUME_KEY);
  await FileSystem.deleteAsync(current.destination, { idempotent: true });
}
export async function pauseSpeechModelDownload() {
  if (!activeDownload || state.status !== "downloading") return false;
  const current = activeDownload;
  try {
    const paused = await current.task.pauseAsync();
    if (!paused?.resumeData) return false;
    await AsyncStorage.setItem(RESUME_KEY, JSON.stringify({ modelId: current.modelId, resumeData: paused.resumeData, written: state.written, total: state.total }));
    if (activeDownload === current) activeDownload = null;
    publish({ status: "paused", error: "" });
    return true;
  } catch { return false; }
}
export async function resumeSpeechModelDownload() {
  if (activeDownload && state.status === "downloading") return activeDownload.promise;
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(RESUME_KEY)) || "null");
    const model = SPEECH_MODELS.find((item) => item.id === saved?.modelId);
    if (!model || !saved.resumeData) return null;
    activeDownload = null;
    publish({ status: "paused", modelId: model.id, written: saved.written || 0, total: saved.total || model.size, progress: Math.min(0.99, (saved.written || 0) / (saved.total || model.size)), error: "" });
    return runDownload(model, saved.resumeData);
  } catch { await AsyncStorage.removeItem(RESUME_KEY); return null; }
}

export async function deleteSpeechModel(model) {
  if (contextModelId === model.id) await unloadSpeechModel();
  await FileSystem.deleteAsync(speechModelPath(model), { idempotent: true });
  if ((await getActiveSpeechModelId()) === model.id) await setActiveSpeechModelId(null);
}

export async function loadSpeechModel(model, onProgress) {
  if (context && contextModelId === model.id) return context;
  await unloadSpeechModel();
  const check = await verifySpeechModel(model);
  if (!check.verified) throw new Error("Сначала скачайте речевую модель");
  onProgress?.(0.1);
  context = await initWhisper({ filePath: speechModelPath(model), useGpu: true, useFlashAttn: true, useCoreMLIos: false });
  contextModelId = model.id;
  onProgress?.(1);
  return context;
}
export async function unloadSpeechModel() { if (!context) return; try { await releaseAllWhisper(); } finally { context = null; contextModelId = null; } }

export async function transcribeSpeechData(model, float32Data, onProgress) {
  const whisper = await loadSpeechModel(model, (value) => onProgress?.(Math.round(value * 15)));
  const { promise } = whisper.transcribeData(float32Data, { language: "en", translate: false, maxThreads: 4, nProcessors: 1, tokenTimestamps: true, maxLen: 1, wordThold: 0.01, beamSize: model.id === "speech-light" ? 3 : 5, onProgress: (value) => onProgress?.(15 + Math.round(value * 0.85)) });
  return promise;
}

function makeWav(pcm) {
  const output = new Uint8Array(44 + pcm.length);
  const view = new DataView(output.buffer);
  const write = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + pcm.length, true); write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, pcm.length, true); output.set(pcm, 44);
  return output;
}

export function startSpeechRecording(onLevel) {
  if (activeRecording) throw new Error("Запись уже идёт");
  const chunks = [];
  let total = 0;
  LiveAudioStream.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, bufferSize: 4096, wavFile: "lingospark-speech.wav" });
  const subscription = LiveAudioStream.on("data", (base64) => {
    const chunk = Base64.toUint8Array(base64);
    if (total < 16000 * 2 * 45) { chunks.push(chunk); total += chunk.length; }
    if (onLevel && chunk.length >= 2) {
      const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      let energy = 0; const count = Math.floor(chunk.length / 2);
      for (let i = 0; i < count; i += 8) { const value = view.getInt16(i * 2, true) / 32768; energy += value * value; }
      onLevel(Math.min(1, Math.sqrt(energy / Math.max(1, Math.ceil(count / 8))) * 4));
    }
  });
  LiveAudioStream.start();
  activeRecording = { chunks, subscription, startedAt: Date.now() };
}

export async function stopSpeechRecording() {
  if (!activeRecording) throw new Error("Запись не запущена");
  const recording = activeRecording; activeRecording = null;
  LiveAudioStream.stop();
  await new Promise((resolve) => setTimeout(resolve, 80));
  recording.subscription?.remove?.();
  const total = recording.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const pcm = new Uint8Array(total); let offset = 0;
  recording.chunks.forEach((chunk) => { pcm.set(chunk, offset); offset += chunk.length; });
  if (pcm.length < 3200) throw new Error("Запись слишком короткая. Произнесите фразу ещё раз.");
  const samples = Math.floor(pcm.length / 2);
  const float = new Float32Array(samples); const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  for (let i = 0; i < samples; i++) float[i] = view.getInt16(i * 2, true) / 32768;
  const uri = `${FileSystem.cacheDirectory}lingospark-speech-${Date.now()}.wav`;
  await FileSystem.writeAsStringAsync(uri, Base64.fromUint8Array(makeWav(pcm)), { encoding: FileSystem.EncodingType.Base64 });
  return { float32: float.buffer, uri, durationMs: Math.round((samples / 16000) * 1000) };
}

export async function cancelSpeechRecording() {
  if (!activeRecording) return;
  const recording = activeRecording; activeRecording = null;
  try { LiveAudioStream.stop(); await new Promise((resolve) => setTimeout(resolve, 50)); } catch {}
  recording.subscription?.remove?.();
}

export async function getReadySpeechModel() {
  const id = await getActiveSpeechModelId();
  const model = SPEECH_MODELS.find((item) => item.id === id);
  if (!model) return null;
  const check = await verifySpeechModel(model);
  return check.verified ? model : null;
}

const words = (text) => String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
export function alignSpeechWords(expectedText, heardText) {
  const expected = words(expectedText); const heard = words(heardText);
  const rows = expected.length + 1; const cols = heard.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) for (let j = 1; j < cols; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (expected[i - 1] === heard[j - 1] ? 0 : 1));
  const aligned = []; const extras = []; let i = expected.length; let j = heard.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (expected[i - 1] === heard[j - 1] ? 0 : 1)) { aligned.unshift({ expected: expected[i - 1], heard: heard[j - 1], status: expected[i - 1] === heard[j - 1] ? "correct" : "changed" }); i--; j--; }
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { aligned.unshift({ expected: expected[i - 1], heard: "", status: "missing" }); i--; }
    else { extras.unshift(heard[j - 1]); j--; }
  }
  const correct = aligned.filter((item) => item.status === "correct").length;
  const score = Math.max(0, Math.round((correct / Math.max(1, expected.length)) * 100 - extras.length * 4));
  return { aligned, extras, score, expectedCount: expected.length, correctCount: correct };
}
