const pack = (id, title, emoji, level, rows) => ({
  id, title, emoji, level,
  words: rows.trim().split('\n').map(row => {
    const [english, russian, example, exampleRu] = row.split('|');
    return {
      id: `phrase-pack-${english.replace(/[’']/g, '').replace(/ /g, '-')}`,
      english, russian, fullTranslation: russian, translations: [],
      example, exampleRu, level, emoji, partOfSpeech: 'выражение', themeId: id,
      transcription: '', frequency: null,
    };
  }),
});

export const wordPhrasePacks = [
  pack('phrases-airport', 'В аэропорту', '✈️', 'A2', `
boarding gate|выход на посадку|Which boarding gate should I go to?|К какому выходу на посадку мне идти?
arrival hall|зал прилёта|I'll meet you in the arrival hall.|Я встречу тебя в зале прилёта.
ground transportation|наземный транспорт|The signs for ground transportation are near the exit.|Указатели на наземный транспорт находятся у выхода.
connecting flight|стыковочный рейс|I have a connecting flight to Oslo.|У меня стыковочный рейс в Осло.
checked baggage|зарегистрированный багаж|Checked baggage is included in the fare.|Зарегистрированный багаж включён в стоимость билета.
hand luggage|ручная кладь|Is this bag small enough for hand luggage?|Эта сумка подходит по размеру для ручной клади?
security screening|досмотр|Allow extra time for security screening.|Заложи дополнительное время на досмотр.
aisle seat|место у прохода|Could I have an aisle seat, please?|Можно мне место у прохода?
window seat|место у окна|I booked a window seat.|Я забронировал место у окна.
overhead bin|багажная полка|Put your jacket in the overhead bin.|Положи куртку на багажную полку.
miss a connection|опоздать на пересадку|I might miss a connection if this train is late.|Я могу опоздать на пересадку, если этот поезд задержится.
change the booking|изменить бронирование|Can I change the booking online?|Можно изменить бронирование через интернет?
`),
  pack('phrases-hotel', 'В гостинице', '🛎️', 'A2', `
front desk|стойка регистрации|You can leave the key at the front desk.|Можешь оставить ключ на стойке регистрации.
early check-in|раннее заселение|Is early check-in available today?|Сегодня возможно раннее заселение?
late checkout|поздний выезд|We'd like to ask for late checkout.|Мы хотели бы попросить о позднем выезде.
room service|обслуживание номеров|Does room service take orders after ten?|Обслуживание номеров принимает заказы после десяти?
wake-up call|звонок для пробуждения|Could I get a wake-up call at seven?|Можете разбудить меня звонком в семь?
double room|двухместный номер|We booked a double room for two nights.|Мы забронировали двухместный номер на две ночи.
spare towel|запасное полотенце|Could you bring me a spare towel?|Не могли бы вы принести запасное полотенце?
extra blanket|дополнительное одеяло|I'd like an extra blanket, please.|Принесите, пожалуйста, дополнительное одеяло.
quiet room|тихий номер|Could we get a quiet room away from the lift?|Можно нам тихий номер подальше от лифта?
leave a deposit|внести залог|Do I need to leave a deposit at check-in?|Мне нужно внести залог при заселении?
store my luggage|оставить багаж на хранение|Can I store my luggage here until six?|Можно оставить здесь мой багаж на хранение до шести?
breakfast included|завтрак включён|Is breakfast included in the room rate?|Завтрак включён в стоимость номера?
`),
  pack('phrases-cafe', 'В кафе', '☕', 'A2', `
table for two|столик на двоих|Could we have a table for two, please?|Можно нам столик на двоих?
still water|негазированная вода|I'll have still water, please.|Мне негазированную воду, пожалуйста.
sparkling water|газированная вода|Would you like still or sparkling water?|Вам негазированную или газированную воду?
on the side|отдельно от блюда|Could you serve the sauce on the side?|Можете подать соус отдельно?
for here or to go|здесь или с собой|Is that coffee for here or to go?|Вам кофе здесь или с собой?
take your order|принять ваш заказ|May I take your order?|Могу я принять ваш заказ?
dish of the day|блюдо дня|What's the dish of the day?|Какое сегодня блюдо дня?
food allergy|пищевая аллергия|Please tell us if you have a food allergy.|Сообщите нам, пожалуйста, если у вас пищевая аллергия.
split the bill|разделить счёт|Can we split the bill between us?|Можно разделить счёт на всех?
pay by card|оплатить картой|Can I pay by card?|Можно оплатить картой?
keep the change|оставьте сдачу себе|Here's twenty pounds. Keep the change.|Вот двадцать фунтов. Сдачу оставьте себе.
order at the counter|заказать у стойки|Please order at the counter before taking a seat.|Пожалуйста, оформите заказ у стойки, прежде чем сесть.
`),
  pack('phrases-health', 'На приёме у врача', '🩺', 'B1', `
make an appointment|записаться на приём|I'd like to make an appointment with a doctor.|Я хотел бы записаться на приём к врачу.
have a sore throat|болит горло|I have a sore throat and a cough.|У меня болит горло и есть кашель.
feel dizzy|чувствовать головокружение|I sometimes feel dizzy when I stand up.|Иногда у меня кружится голова, когда я встаю.
take your temperature|измерить вам температуру|The nurse will take your temperature first.|Сначала медсестра измерит вам температуру.
run a fever|быть с повышенной температурой|Have you started to run a fever?|У вас начала подниматься температура?
blood pressure reading|показатель артериального давления|The nurse wrote down my blood pressure reading.|Медсестра записала показатель моего артериального давления.
over-the-counter medicine|безрецептурное лекарство|Is there an over-the-counter medicine for this?|Есть ли от этого безрецептурное лекарство?
side effects|побочные эффекты|Are there any common side effects?|Есть ли распространённые побочные эффекты?
medical history|история болезни|The doctor asked about my medical history.|Врач спросил о моей истории болезни.
follow-up visit|повторный приём|We'll schedule a follow-up visit next week.|Мы запланируем повторный приём на следующую неделю.
get a blood test|сдать анализ крови|Do I need to get a blood test before the visit?|Нужно ли сдать анализ крови перед приёмом?
out of breath|запыхавшийся|I was out of breath after walking upstairs.|Я запыхался, поднявшись по лестнице.
`),
  pack('phrases-interview', 'Собеседование', '💼', 'B1', `
apply for a position|подать заявку на должность|I'd like to apply for a position in your team.|Я хотел бы подать заявку на должность в вашей команде.
cover letter|сопроводительное письмо|Please attach a cover letter to your application.|Приложите сопроводительное письмо к заявке.
work experience|опыт работы|Tell me about your work experience.|Расскажите о своём опыте работы.
salary expectations|зарплатные ожидания|We can discuss your salary expectations at the interview.|Мы можем обсудить ваши зарплатные ожидания на собеседовании.
notice period|срок предупреждения об увольнении|What is your notice period at your current job?|За какой срок вы должны предупредить об увольнении на текущей работе?
flexible hours|гибкий график|The company offers flexible hours.|Компания предлагает гибкий график.
work remotely|работать удалённо|How often can I work remotely?|Как часто я смогу работать удалённо?
meet a deadline|уложиться в срок|Tell me how you managed to meet a deadline under pressure.|Расскажите, как вам удалось уложиться в срок в условиях стресса.
handle feedback|реагировать на обратную связь|How do you handle feedback from your manager?|Как вы реагируете на обратную связь от руководителя?
take responsibility|брать на себя ответственность|I'm ready to take responsibility for the project.|Я готов взять на себя ответственность за проект.
available to start|готов приступить к работе|When are you available to start?|Когда вы готовы приступить к работе?
job offer|предложение о работе|I received a job offer on Friday.|Я получил предложение о работе в пятницу.
`),
  pack('phrases-support', 'Техника и поддержка', '💻', 'B1', `
reset your password|сбросить пароль|Click the link to reset your password.|Перейдите по ссылке, чтобы сбросить пароль.
verification code|код подтверждения|Enter the verification code from the message.|Введите код подтверждения из сообщения.
turn on notifications|включить уведомления|You can turn on notifications in Settings.|Можно включить уведомления в настройках.
share your screen|показать свой экран|Can you share your screen during the call?|Можете показать свой экран во время звонка?
poor connection|плохая связь|Sorry, I have a poor connection right now.|Извините, у меня сейчас плохая связь.
back up your files|создать резервную копию файлов|Remember to back up your files before updating.|Не забудь создать резервную копию файлов перед обновлением.
clear the cache|очистить кэш|Try to clear the cache and reopen the app.|Попробуй очистить кэш и снова открыть приложение.
free up space|освободить место|I deleted old videos to free up space.|Я удалил старые видео, чтобы освободить место.
update available|доступно обновление|Is there an update available for this app?|Для этого приложения доступно обновление?
restore a backup|восстановить данные из резервной копии|How do I restore a backup on my new phone?|Как восстановить данные из резервной копии на новом телефоне?
get locked out|потерять доступ к аккаунту|If you get locked out, contact support.|Если потеряешь доступ к аккаунту, обратись в поддержку.
submit a ticket|отправить заявку в поддержку|Please submit a ticket with a screenshot.|Отправь заявку в поддержку и приложи скриншот.
`),
];
