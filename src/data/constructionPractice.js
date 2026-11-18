const dialogue = (id, topic, context, prompt, answer, explanation, answers = []) => ({
  id: `construction-${id}`, type: 'translate', skill: 'conversation', topic, context, prompt, answer, answers, explanation,
});

export const constructionReviews = {
  name: dialogue('name', 'Знакомство', 'Sam: Hi, I’m Sam. What’s your name?', 'Назови своё имя. Используй My name. Тебя зовут Кейт.',
    'My name is Kate.', 'Подлежащее My name в единственном числе, поэтому нужна связка is.'),
  introduceFriend: dialogue('introduce-friend', 'Знакомство', 'Sam: Who’s here with you today?', 'Представь своего друга по имени Дэн. Начни с This.',
    'This is my friend Dan.', 'This is представляет другого человека. My friend Dan сообщает, кто это.'),
  pastQuestion: dialogue('past-question', 'Past Simple', 'Sam: I had a busy day yesterday.', 'Спроси Сэма, смотрел ли он вчера фильм. Начни с Did.',
    'Did you watch a film yesterday?', 'Did уже показывает прошедшее время. После подлежащего you используй watch.', [
      'Did you watch a movie yesterday?', 'Did you watch a film yesterday evening?', 'Did you watch any films yesterday?',
    ]),
  bill: dialogue('bill', 'Кафе', 'Server: Can I get you anything else?', 'Ты закончил обед. Вежливо попроси счёт.',
    'Could I have the bill, please?', 'The bill — счёт. Could I have… и Can I have… подходят для вежливой просьбы.', [
      'Can I have the bill, please?', 'May I have the bill, please?', 'The bill, please.', 'Could I get the bill, please?',
      'Can I get the bill, please?', 'Could you bring me the bill, please?', 'Can you bring me the bill, please?',
      'Could I have the check, please?', 'Can I have the check, please?', 'Can I get the check, please?', 'The check, please.',
    ]),
};
