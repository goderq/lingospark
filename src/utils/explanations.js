const clean = (value) => String(value || "").trim();
const lower = (value) => clean(value).toLocaleLowerCase("ru");
const isRussian = (value) => /[а-яё]/i.test(clean(value));
const hasLatin = (value) => /[a-z]/i.test(clean(value));
const shortAnswer = (value) => clean(value).split(/\s+/).length <= 3;

const filledExample = (item) => {
  const prompt = clean(item?.prompt);
  const answer = clean(item?.answer);
  const spoken = clean(item?.speak || item?.example);
  if (spoken && spoken !== answer) return spoken;
  if (!prompt) return answer;
  if (!prompt.includes("___")) return spoken || answer || prompt;
  const parts = answer.split(/\s*\/\s*/);
  let partIndex = 0;
  return prompt.replace(/___/g, () => parts[partIndex++] || answer);
};

const signalExplanation = (item) => {
  const prompt = lower(item?.prompt);
  const answer = lower(item?.answer);
  const joined = `${prompt} ${answer}`;
  if (/yesterday|ago|last (week|year|night|month)|in 20\d\d/.test(prompt))
    return "Слова yesterday, ago и last называют завершённый момент в прошлом, поэтому обычно требуют Past Simple.";
  if (/since|for .*year|for .*month|already|yet|just|ever|never/.test(joined))
    return "Since, for, already, yet, just, ever и never часто связывают прошлое с настоящим; проверь форму have/has + V3.";
  if (/while|at that moment|when .* was/.test(prompt))
    return "Контекст описывает процесс в конкретный момент прошлого; для фона обычно используется was/were + V-ing.";
  if (/by the time|before .* arrived|had /.test(joined))
    return "Одно прошлое действие произошло раньше другого, поэтому более раннее действие оформляется через had + V3.";
  if (/tomorrow|next (week|year|month)|by next|this time next/.test(prompt))
    return "В предложении есть будущая временная точка. Выбор формы зависит от того, речь идёт о решении, плане, процессе или результате к сроку.";
  if (/if |unless|provided|were it|had .* would/.test(joined))
    return "В условном предложении формы в части с условием и в результате работают парой; нельзя выбирать их независимо друг от друга.";
  if (/a\/an|article|артикл|\ba\b|\ban\b|\bthe\b/.test(joined) && shortAnswer(answer))
    return "Артикль зависит от того, упоминается предмет впервые, известен ли он собеседникам и начинается ли следующее слово с гласного звука.";
  if (/modal|should|must|could|would|might|can /.test(joined))
    return "После модального глагола используется базовая форма смыслового глагола без to; сам модальный глагол передаёт возможность, обязанность или вежливость.";
  if (/passive|was .*ed|were .*ed|been .*ed/.test(joined))
    return "В пассивной конструкции важен результат действия: be ставится в нужное время, а смысловой глагол — в третью форму.";
  if (prompt.includes("___") && shortAnswer(answer))
    return "Пропуск нужно проверять внутри всего предложения: слова слева и справа определяют нужную форму, предлог или устойчивое сочетание.";
  return "Сначала определи смысл, временную точку и намерение говорящего, затем проверь форму глагола, управление и естественный порядок слов.";
};

const ruleFor = (item, context) => {
  if (context.formula || context.use || context.markers) {
    return [
      context.formula ? `Схема: ${context.formula}.` : "",
      context.use ? `Когда использовать: ${clean(context.use).replace(/\.$/, "").toLowerCase()}.` : "",
      context.markers ? `Слова-сигналы: ${context.markers}.` : "",
      signalExplanation(item),
    ].filter(Boolean).join(" ");
  }
  if (item?.type === "build")
    return "Английская фраза строится блоками: подлежащее → вспомогательный или основной глагол → дополнение → обстоятельство. В вопросе вспомогательный глагол ставится перед подлежащим. " + signalExplanation(item);
  if (item?.type === "translate")
    return "Переводи не отдельные слова, а намерение всей фразы. Обязательно сохрани время, отрицание, степень вежливости и связь между частями предложения.";
  if (isRussian(item?.answer) && hasLatin(item?.prompt))
    return "У английского выражения может быть несколько словарных значений. Здесь выбирается русский перевод, который передаёт смысл именно данного контекста, а не первое значение из словаря.";
  return signalExplanation(item);
};

export const explainSelectedOption = (item, context = {}) => {
  const selected = clean(context.selected);
  const answer = clean(item?.answer || context.answer);
  if (!selected || lower(selected) === lower(answer))
    return "Ответ совпадает и по смыслу, и по форме. Всё предложение после подстановки остаётся грамматически цельным.";
  if (item?.optionExplanations?.[selected]) return clean(item.optionExplanations[selected]);
  if ((isRussian(selected) && hasLatin(answer)) || (hasLatin(selected) && isRussian(answer)))
    return `«${selected}» написано не на том языке, который требуется в этом задании. Здесь нужен ответ «${answer}» без добавления перевода на другом языке.`;
  if (item?.type === "translate")
    return `Сравни «${selected}» с «${answer}». Проверь, не потеряны ли отрицание, время, предлог, участник действия или оттенок вежливости. Даже знакомые слова не компенсируют изменение смысла.`;
  if (item?.type === "build")
    return `В варианте «${selected}» слова выбраны, но их связи нарушены. Опорный порядок для этого задания: «${answer}». Найди подлежащее и поставь рядом правильную глагольную группу.`;
  if (clean(item?.prompt).includes("___"))
    return `После подстановки «${selected}» конструкция не согласуется с окружением пропуска. «${answer}» подходит к словам по обе стороны и образует правильную форму.`;
  return `«${selected}» может выглядеть правдоподобно, но меняет значение или звучит неестественно в этой ситуации. Точный вариант здесь — «${answer}».`;
};

const breakdownFor = (item) => {
  const prompt = clean(item?.prompt);
  const answer = clean(item?.answer);
  const example = filledExample(item);
  if (item?.type === "translate")
    return `Исходная фраза: ${prompt.replace(/^(переведи|напиши перевод)\s*:?\s*/i, "")}\nЕстественный перевод: ${answer}\nПроверка: смысл и время сохранены, лишнего перевода на втором языке нет.`;
  if (item?.type === "build")
    return `Готовая фраза: ${answer}\nБлоки: ${answer.split(/\s+/).join(" · ")}\nПрочитай результат целиком: служебные слова должны стоять рядом с теми словами, которыми они управляют.`;
  if (prompt.includes("___"))
    return `Предложение после подстановки: ${example}\nВставка: ${answer}. Она заполняет ровно ту грамматическую роль, которую требует окружение пропуска.`;
  return `Вопрос: ${prompt}\nПравильный ответ: ${answer}${example && example !== answer ? `\nПример в контексте: ${example}` : ""}`;
};

const memoryTip = (item, context) => {
  const prompt = lower(item?.prompt);
  if (/since|\bfor\b/.test(`${prompt} ${lower(item?.answer)}`)) return "Since — начальная точка, for — длительность периода.";
  if (/yesterday|ago|last /.test(prompt)) return "Увидел завершённое время — сначала проверь Past Simple.";
  if (/already|yet|just/.test(prompt)) return "Already обычно сообщает о результате, yet часто появляется в вопросах и отрицаниях.";
  if (item?.type === "translate") return "После перевода задай себе два вопроса: «Кто делает действие?» и «Когда оно происходит?».";
  if (item?.type === "build") return "Сначала собери основу «кто + что делает», затем добавляй остальные части.";
  if (context.formula) return `Произнеси схему «${context.formula}» вместе с готовым примером — так форма запоминается как единый шаблон.`;
  return "Не запоминай ответ отдельно: прочитай вслух весь правильный пример и представь ситуацию, в которой ты его скажешь.";
};

export function getExplanationSections(item = {}, context = {}) {
  const answer = clean(item.answer || context.answer);
  const base = clean(item.explanation || item.hint || context.explanation);
  const why = base
    ? `${base.replace(/\.$/, "")}. В этом вопросе подсказка напрямую приводит к варианту «${answer}».`
    : `Правильный ответ — «${answer}»: он сохраняет требуемый смысл и подходит к грамматической конструкции целиком.`;
  return [
    { id: "result", title: "Результат", text: answer || "Ответ определяется полным контекстом задания." },
    { id: "why", title: "Почему это правильно", text: why },
    { id: "selected", title: "Разбор твоего ответа", text: explainSelectedOption(item, context) },
    { id: "rule", title: "Правило", text: ruleFor(item, context) },
    { id: "steps", title: "Разбор по шагам", text: breakdownFor({ ...item, answer }) },
    { id: "memory", title: "Как запомнить", text: memoryTip(item, context) },
    { id: "check", title: "Мини-проверка", text: "Закрой правильный ответ, снова прочитай вопрос и объясни вслух, какой сигнал или смысл привёл тебя к нужной форме." },
  ];
}

export function getExplanationExamples(item = {}, context = {}) {
  const answer = clean(item.answer || context.answer);
  const prompt = clean(item.prompt);
  const selected = clean(context.selected);
  const correctExample = filledExample({ ...item, answer });
  const examples = [];
  if (correctExample) examples.push({ label: "Правильный пример", text: correctExample });
  if (prompt.includes("___") && selected && lower(selected) !== lower(answer)) {
    examples.push({
      label: "Сравни",
      text: `${prompt.replace(/___/g, selected)} ✕\n${prompt.replace(/___/g, answer)} ✓`,
    });
  } else if (item?.type === "translate" && prompt && answer) {
    examples.push({ label: "Пара для запоминания", text: `${prompt.replace(/^(переведи|напиши перевод)\s*:?\s*/i, "")} ↔ ${answer}` });
  } else if (item?.speak && clean(item.speak) !== correctExample) {
    examples.push({ label: "В живой речи", text: clean(item.speak) });
  }
  return examples;
}

export function expandExplanation(item = {}, context = {}) {
  return getExplanationSections(item, context)
    .map((section) => `${section.title.toLocaleUpperCase("ru")}\n${section.text}`)
    .join("\n\n");
}
