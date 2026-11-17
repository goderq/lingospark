// A conservative character budget, not a claim to count model-specific tokens.
// The native engine still enforces its token limit.
export function recentTranscript(messages, maxChars = 600) {
  const eligible = messages.filter(item => ['user', 'assistant'].includes(item.role) && item.kind !== 'command' && typeof item.content === 'string' && item.content.trim());
  const selected = [];
  let remaining = maxChars;
  for (const item of eligible.slice(-12).reverse()) {
    const line = `${item.role === 'user' ? 'Ученик' : 'Преподаватель'}: ${item.content}`;
    if (line.length + 1 > remaining) {
      if (!selected.length) throw new Error('Последняя реплика слишком длинная для разбора этой моделью. Отправь более короткую фразу.');
      break;
    }
    selected.unshift(line); remaining -= line.length + 1;
  }
  return { text: selected.join('\n'), included: selected.length, total: eligible.length };
}

export function budgetMessages(messages, maxChars) {
  const system = messages.find(item => item.role === 'system');
  const history = messages.filter(item => item.role !== 'system' && item.content?.trim());
  const limit = Math.max(1200, Math.floor(maxChars));
  const systemLimit = Math.floor(limit * 0.55);
  let instruction = system?.content || '';
  if (instruction.length > systemLimit) instruction = instruction.slice(0, Math.floor(systemLimit * 0.35)) + '\n[…]\n' + instruction.slice(-Math.floor(systemLimit * 0.65) + 5);
  let remaining = limit - instruction.length;
  const selected = [];
  for (const message of [...history].reverse()) {
    if (message.content.length > remaining) {
      if (!selected.length) throw new Error('Сообщение слишком длинное для контекста этой модели. Раздели его на несколько коротких реплик.');
      break;
    }
    selected.unshift(message); remaining -= message.content.length;
  }
  while (selected[0]?.role === 'assistant' && selected.length > 1) selected.shift();
  return [...(system ? [{ ...system, content: instruction }] : []), ...selected];
}
