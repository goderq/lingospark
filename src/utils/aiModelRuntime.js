const stops = {
  llama: ['<|eot_id|>', '<|end_of_text|>', '<|eom_id|>'],
  gemma: ['<end_of_turn>', '<eos>'],
  qwen: ['<|im_end|>', '<|endoftext|>', '</s>'],
};

export function modelCompletionOptions(model, options) {
  const family = model?.family || 'qwen';
  const system = (options.messages || []).filter(item => item.role === 'system').map(item => item.content).join('\n\n');
  const messages = [];
  for (const item of options.messages || []) {
    if (family === 'gemma' && item.role === 'system') continue;
    const previous = messages.at(-1);
    if (previous?.role === item.role) previous.content += `\n\n${item.content}`;
    else messages.push({ ...item });
  }
  // Gemma chat templates have user/model roles, with no separate system role.
  // Fold instructions only after budgeting, so they cannot be budgeted away.
  if (family === 'gemma' && system) {
    const firstUser = messages.find(item => item.role === 'user');
    if (firstUser) firstUser.content = `${system}\n\n${firstUser.content}`;
    else messages.unshift({ role: 'user', content: system });
  }
  return { ...options, messages, jinja: true, stop: [...new Set([...(stops[family] || stops.qwen), ...(options.stop || [])])] };
}

export function modelSizeProblem(model, bytes) {
  if (model.strictSize && bytes !== model.size) return 'Размер файла не совпадает с выбранной версией модели. Скачай её заново.';
  if (bytes < model.size * 0.98) return 'Файл загружен не полностью';
  return '';
}
