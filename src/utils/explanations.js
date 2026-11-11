const clean = (value) => String(value || "").trim();

const isRussian = (value) => /[а-яё]/i.test(clean(value));

const filledExample = (item) => {
  const spoken = clean(item?.speak || item?.example);
  if (spoken) return spoken;
  const prompt = clean(item?.prompt);
  const answer = clean(item?.answer);
  if (!prompt) return answer;
  if (!prompt.includes("___")) return answer || prompt;
  const parts = answer.split(/\s*\/\s*/);
  let partIndex = 0;
  return prompt.replace(/___/g, () => parts[partIndex++] || answer);
};

const ruleFor = (item, context) => {
  if (context.formula || context.use) {
    return [
      context.formula ? `Схема: ${context.formula}.` : "",
      context.use ? `Используй её, когда нужно выразить: ${context.use.toLowerCase()}.` : "",
      context.markers ? `Сигналы контекста: ${context.markers}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  const type = clean(item?.type);
  const topic = clean(context.topic || item?.topic);
  if (type === "build")
    return "Сначала найди подлежащее, затем вспомогательный или основной глагол, после него поставь дополнение и обстоятельство. В вопросе вспомогательный глагол обычно выходит перед подлежащим.";
  if (type === "translate")
    return "Переводи смысл всей фразы, а не каждое слово отдельно. Сохраняй время, отрицание, вежливость и естественный порядок слов языка перевода.";
  if (topic)
    return `Это задание относится к теме «${topic}». Сначала определи смысл и временную точку, затем проверь форму, управление и порядок слов.`;
  if (clean(item?.prompt).includes("___"))
    return "Прочитай всё предложение, найди слова-сигналы и определи, какая часть речи или форма нужна в пропуске. После подстановки перечитай фразу целиком.";
  if (isRussian(item?.answer))
    return "Значение выбирается по контексту всей фразы. У английского слова может быть несколько переводов, поэтому здесь важен именно тот смысл, который подходит ситуации.";
  return "Проверяй не только значение отдельного слова, но и устойчивость выражения, грамматическую форму и естественный порядок слов в английском предложении.";
};

const mistakeFor = (item, context) => {
  const selected = clean(context.selected);
  const answer = clean(item?.answer);
  if (selected && answer && selected !== answer)
    return `Вариант «${selected}» выглядит похожим, но не передаёт нужную форму или смысл. Сравни его с «${answer}» и найди отличие во времени, предлоге или порядке слов.`;
  if (clean(item?.type) === "translate")
    return "Не копируй английский порядок слов механически и не теряй служебные слова: именно они часто передают время, отрицание и оттенок вежливости.";
  if (clean(item?.type) === "build")
    return "Не собирай фразу по русскому порядку слов. После сборки проверь, стоит ли подлежащее рядом с правильной формой глагола.";
  return "Не выбирай ответ только по одному знакомому слову. Подставь каждый вариант в предложение и проверь, совпадают ли смысл и грамматика целиком.";
};

export function expandExplanation(item = {}, context = {}) {
  const answer = clean(item.answer || context.answer);
  const base = clean(item.explanation || item.hint || context.explanation);
  const why = base ||
    (answer
      ? `Правильный ответ — «${answer}»: именно он соответствует смыслу вопроса и грамматической конструкции.`
      : "Ответ определяется смыслом ситуации и формой конструкции в полном предложении.");
  const example = filledExample({ ...item, answer });
  const sections = [
    `ПОЧЕМУ ТАК\n${why}`,
    `ПРАВИЛО\n${ruleFor(item, context)}`,
  ];
  if (example) sections.push(`РАЗБОР ПРИМЕРА\n${example}`);
  sections.push(`ЧАСТАЯ ОШИБКА\n${mistakeFor(item, context)}`);
  return sections.join("\n\n");
}
