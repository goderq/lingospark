const phraseBank = [
  ['How have you been?','Как ты поживаешь?'],['Could we have the menu, please?','Можно нам меню, пожалуйста?'],['Which platform does the train leave from?','С какой платформы отправляется поезд?'],
  ['I am looking for a room for two nights','Я ищу номер на две ночи'],['Do you have this in a different size?','У вас есть это другого размера?'],['Could you tell me how to get there?','Подскажите, как туда добраться?'],
  ['I would like to make an appointment','Я хотел бы записаться на приём'],['Let us keep in touch','Давай оставаться на связи'],['What time shall we meet?','Во сколько нам встретиться?'],
  ['I have been working here since May','Я работаю здесь с мая'],['The meeting has been moved to Thursday','Встречу перенесли на четверг'],['Could you clarify what you mean?','Не могли бы вы уточнить, что имеете в виду?'],
  ['I will send you the updated version','Я отправлю вам обновлённую версию'],['We need to agree on the priorities','Нам нужно договориться о приоритетах'],['The deadline is approaching quickly','Срок быстро приближается'],
  ['I would appreciate your feedback','Я был бы признателен за обратную связь'],['The issue has now been resolved','Проблема уже решена'],['Let me summarize the main points','Позвольте обобщить основные моменты'],
  ['There is strong evidence to support this','Есть веские доказательства в поддержку этого'],['We should consider the long-term impact','Нам стоит учесть долгосрочные последствия'],['The results exceeded our expectations','Результаты превзошли наши ожидания'],
  ['I see your point, although I disagree','Я понимаю вашу точку зрения, хотя не согласен'],['What alternatives are available to us?','Какие альтернативы нам доступны?'],['The proposal deserves further consideration','Предложение заслуживает дальнейшего рассмотрения'],
  ['Had we known, we would have acted sooner','Если бы мы знали, то действовали бы раньше'],['Rarely have I seen such rapid progress','Я редко видел такой быстрый прогресс'],['The findings appear to be inconclusive','Результаты, похоже, не позволяют сделать вывод'],
  ['It is essential that everyone be informed','Важно, чтобы все были проинформированы'],['Notwithstanding the risks, we proceeded','Несмотря на риски, мы продолжили'],['The policy may have unintended consequences','У политики могут быть непредвиденные последствия'],
  ['She is believed to have left the country','Считается, что она покинула страну'],['No sooner had we arrived than it started','Как только мы прибыли, всё началось'],['The more we practise, the more fluent we become','Чем больше мы практикуемся, тем свободнее говорим'],
  ['I wish I had taken that opportunity','Жаль, что я не воспользовался той возможностью'],['He denied having disclosed the information','Он отрицал, что раскрыл информацию'],['The project is due to be completed in June','Проект планируется завершить в июне'],
  ['Were it not for your help, we would have failed','Если бы не ваша помощь, мы бы потерпели неудачу'],['What matters is how we respond to change','Важно то, как мы реагируем на изменения'],['The evidence warrants a cautious conclusion','Доказательства позволяют сделать осторожный вывод'],
  ['She spoke as though she had witnessed it','Она говорила так, словно видела это'],['Under no circumstances should this be shared','Ни при каких обстоятельствах нельзя этим делиться'],['The plan is both ambitious and achievable','План одновременно амбициозный и выполнимый'],
  ['Taking everything into account, we should proceed','Учитывая всё, нам следует продолжить'],
];

const genericWrongRu = ['Это нужно сделать вчера','Я не знаю правильного ответа','Мы встретимся в другом месте'];
const genericWrongEn = ['The answer was never here','We are going yesterday','She do not knows about it'];
const translationVariants = {
  'I would like to make an appointment': [
    'Я бы хотел записаться на приём',
    'Я хочу записаться на приём',
    'Я хотел бы назначить встречу',
  ],
  'Could we have the menu, please?': ['Можно меню, пожалуйста?', 'Принесите нам меню, пожалуйста'],
  'Could you tell me how to get there?': ['Не подскажете, как туда попасть?', 'Как мне туда добраться?'],
  'Let us keep in touch': ['Будем на связи', 'Давайте оставаться на связи'],
  'I would appreciate your feedback': ['Буду признателен за ваш отзыв', 'Буду благодарен за обратную связь'],
  'The issue has now been resolved': ['Вопрос уже решён', 'Проблему уже удалось решить'],
};

export const enrichLessons = (lessons) => lessons.map((lesson, index) => {
  const [english, russian] = phraseBank[index % phraseBank.length];
  const nextEnglish = phraseBank[(index + 7) % phraseBank.length][0];
  const words = english.replace(/[?.!,]/g, '').split(' ');
  const prefix = `mega-${lesson.id}`;
  const bonus = [
    { id: `${prefix}-1`, type: 'choice', prompt: `Переведи: “${english}”`, hint: `Испытание ${lesson.difficulty}`, options: [russian, ...genericWrongRu], answer: russian, speak: english },
    { id: `${prefix}-2`, type: 'choice', prompt: `Как сказать: «${russian}»?`, hint: 'Выбери естественный английский вариант', options: [english, ...genericWrongEn], answer: english, speak: english },
    { id: `${prefix}-3`, type: 'build', prompt: `Собери фразу: «${russian}»`, hint: 'Поставь слова в правильном порядке', options: [...words].reverse(), answer: words.join(' '), speak: english },
    { id: `${prefix}-4`, type: 'translate', prompt: `Напиши перевод: ${english}`, hint: 'Можно написать естественный вариант своими словами', answers: [russian.toLowerCase(), ...(translationVariants[english] || [])], answer: russian, speak: english },
    { id: `${prefix}-5`, type: 'choice', prompt: `Какая фраза подходит к теме «${lesson.title}» и текущему испытанию?`, hint: 'Прочитай варианты полностью', options: [english, nextEnglish, genericWrongEn[0], genericWrongEn[1]], answer: english, speak: english },
  ];
  return { ...lesson, exercises: [...lesson.exercises, ...bonus] };
});
