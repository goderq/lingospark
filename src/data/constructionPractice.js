const dialogue = (id, topic, context, prompt, answer, explanation, answers = []) => ({
  id: `construction-${id}`, type: 'translate', skill: 'conversation', topic, context, prompt, answer, answers, explanation,
});

export const constructionReviews = {
  knowNotNow: dialogue('know-not-now', 'Know / now', 'Colleague: Where can I find the meeting room?', 'Скажи, что не знаешь, где находится переговорная.',
    "I don’t know where the meeting room is.", 'Know — «знать», now — «сейчас». После don’t поставь know.', [
      'I do not know where the meeting room is.',
    ]),
  name: dialogue('name', 'Знакомство', 'Sam: Hi, I’m Sam. What’s your name?', 'Назови своё имя. Используй My name. Тебя зовут Кейт.',
    'My name is Kate.', 'Подлежащее My name в единственном числе, поэтому нужна связка is.'),
  introduceFriend: dialogue('introduce-friend', 'Знакомство', 'Sam: Who’s here with you today?', 'Представь своего друга по имени Дэн. Начни с This.',
    'This is my friend Dan.', 'This is представляет другого человека. My friend Dan сообщает, кто это.'),
  pastQuestion: dialogue('past-question', 'Past Simple', 'Sam: I had a busy day yesterday.', 'Спроси Сэма, смотрел ли он вчера фильм. Начни с Did.',
    'Did you watch a film yesterday?', 'Did уже показывает прошедшее время. После подлежащего you используй watch.', [
      'Did you watch a movie yesterday?', 'Did you watch a film yesterday evening?', 'Did you watch any films yesterday?',
    ]),
  duration: dialogue('duration', 'For / since', 'Neighbour: How long have you lived here?', 'Скажи: «Я живу здесь три месяца».',
    'I have lived here for three months.', 'For обозначает длительность. Since требует начальную точку.', [
      "I’ve lived here for three months.", 'I have been living here for three months.',
    ]),
  takeOff: dialogue('take-off', 'Фразовые глаголы', 'Host: Do you need anything before we go inside?', 'Спроси, нужно ли снять ботинки. Используй take off.',
    'Should I take off my boots?', 'Take off означает «снять одежду или обувь». Частицу off можно поставить после существительного.', [
      'Do I need to take off my boots?', 'Should I take my boots off?', 'Do I have to take off my boots?', 'Do I need to take my boots off?',
    ]),
  pastGo: dialogue('past-go', 'Past Simple', 'Colleague: Where were you after work yesterday?', 'Ответь: «Я пошёл в библиотеку». Используй go в прошедшем времени.',
    'I went to the library.', 'Прошедшая форма go — went. Она используется в утвердительной реплике без did.', [
      'I went to the library yesterday.', 'I went to the library after work.',
    ]),
  pastNegative: dialogue('past-negative', 'Past Simple', 'Colleague: Did you get my message yesterday?', 'Скажи, что не получил сообщение.',
    "I didn't get your message.", 'В отрицании did уже указывает на прошлое. После didn’t используется get.', [
      'I did not get your message.', "I didn't receive your message.", "I didn't get it.", "I didn't receive it.", "No, I didn't get your message.",
    ]),
  bill: dialogue('bill', 'Кафе', 'Server: Can I get you anything else?', 'Ты закончил обед. Вежливо попроси счёт.',
    'Could I have the bill, please?', 'The bill — счёт. Could I have… и Can I have… подходят для вежливой просьбы.', [
      'Can I have the bill, please?', 'May I have the bill, please?', 'The bill, please.', 'Could I get the bill, please?',
      'Can I get the bill, please?', 'Could you bring me the bill, please?', 'Can you bring me the bill, please?',
      'Could I have the check, please?', 'Can I have the check, please?', 'Can I get the check, please?', 'The check, please.',
    ]),
};
