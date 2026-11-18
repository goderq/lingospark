// File sizes and LFS SHA-256 recorded from the public Hugging Face API.
// Downloads are pinned to repository commits, never a moving main branch.
export const PRIMARY_AI_MODELS = [
  {
    id: 'llama-3.2-1b', tier: 'light', family: 'llama', title: 'Лёгкий', shortTitle: 'Llama 3.2 · 1B',
    subtitle: 'Компактная модель для беседы на английском',
    model: 'Llama 3.2 · 1B Instruct · Q4_K_M',
    size: 807694464, sizeLabel: '808 МБ', strictSize: true,
    filename: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    revision: '067b946cf014b7c697f3654f621d577a3e3afd1c',
    sha256: '6f85a640a97cf2bf5b8e764087b1e83da0fdb51d7c9fab7d0fece9385611df83',
    sourceUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/067b946cf014b7c697f3654f621d577a3e3afd1c/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    license: 'Llama 3.2 Community License', licenseUrl: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
    context: 2048, color: '#2ED3B7', icon: 'flash', recommended: true,
    device: 'Начни с этой модели; расход памяти выше размера файла',
  },
  {
    id: 'gemma-3-1b', tier: 'standard', family: 'gemma', title: 'Обычный', shortTitle: 'Gemma 3 · 1B',
    subtitle: 'Другая компактная модель для сравнения в диалоге',
    model: 'Gemma 3 · 1B IT · Q4_K_M',
    size: 806058496, sizeLabel: '806 МБ', strictSize: true,
    filename: 'google_gemma-3-1b-it-Q4_K_M.gguf',
    revision: '116f76234503685a98f572982177b11d44ec8ff1',
    sha256: '12bf0fff8815d5f73a3c9b586bd8fee8e7b248c935de70dec367679873d0f29d',
    sourceUrl: 'https://huggingface.co/bartowski/google_gemma-3-1b-it-GGUF',
    url: 'https://huggingface.co/bartowski/google_gemma-3-1b-it-GGUF/resolve/116f76234503685a98f572982177b11d44ec8ff1/google_gemma-3-1b-it-Q4_K_M.gguf',
    license: 'Gemma Terms of Use', licenseUrl: 'https://ai.google.dev/gemma/terms',
    context: 3072, color: '#7C5CFC', icon: 'sparkles',
    device: 'Основной сценарий — английский; сравни ответы с Llama',
  },
  {
    id: 'llama-3.2-3b', tier: 'advanced', family: 'llama', title: 'Продвинутый', shortTitle: 'Llama 3.2 · 3B',
    subtitle: 'Больше параметров для содержательной беседы',
    model: 'Llama 3.2 · 3B Instruct · Q4_K_M',
    size: 2019377696, sizeLabel: '2,02 ГБ', strictSize: true,
    filename: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    revision: '5ab33fa94d1d04e903623ae72c95d1696f09f9e8',
    sha256: '6c1a2b41161032677be168d354123594c0e6e67d2b9227c84f296ad037c728ff',
    sourceUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/5ab33fa94d1d04e903623ae72c95d1696f09f9e8/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    license: 'Llama 3.2 Community License', licenseUrl: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
    context: 4096, color: '#FF9F43', icon: 'diamond',
    device: 'Для iPhone с большим запасом памяти; работает тяжелее 1B',
  },
];

// Keep historical IDs and filenames: active selection, resumed downloads and
// saved sessions must continue to refer to the exact old model.
export const LEGACY_AI_MODELS = [
  { id: 'light', tier: 'light', family: 'qwen', legacy: true, title: 'Qwen · Лёгкий', shortTitle: 'Qwen 2.5 · 0.5B', subtitle: 'Прежняя модель, доступная для сравнения', size: 397808192, sizeLabel: '398 МБ', model: 'Qwen 2.5 · 0.5B · Q4', filename: 'Qwen2.5-0.5B-Instruct-Q4_K_M.gguf', url: 'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf', context: 2048, color: '#2ED3B7', icon: 'flash', device: 'Прежний лёгкий вариант' },
  { id: 'standard', tier: 'standard', family: 'qwen', legacy: true, title: 'Qwen · Обычный', shortTitle: 'Qwen 2.5 · 1.5B', subtitle: 'Прежняя модель, доступная для сравнения', size: 986048768, sizeLabel: '986 МБ', model: 'Qwen 2.5 · 1.5B · Q4', filename: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf', url: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf', context: 3072, color: '#7C5CFC', icon: 'sparkles', device: 'Прежний средний вариант' },
  { id: 'advanced', tier: 'advanced', family: 'qwen', legacy: true, title: 'Qwen · Продвинутый', shortTitle: 'Qwen 2.5 · 3B', subtitle: 'Прежняя модель, доступная для сравнения', size: 1929903264, sizeLabel: '1,93 ГБ', model: 'Qwen 2.5 · 3B · Q4', filename: 'Qwen2.5-3B-Instruct-Q4_K_M.gguf', url: 'https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf', context: 4096, color: '#FF9F43', icon: 'diamond', device: 'Прежний большой вариант' },
].map(model => ({ ...model, license: model.id === 'advanced' ? 'Qwen Research License' : 'Apache 2.0', licenseUrl: model.id === 'advanced' ? 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct/blob/main/LICENSE' : 'https://www.apache.org/licenses/LICENSE-2.0', sourceUrl: model.url.split('/resolve/')[0] }));
export const AI_MODELS = [...PRIMARY_AI_MODELS, ...LEGACY_AI_MODELS];
export const isLightModel = model => model?.tier === 'light' || model?.id === 'light';
