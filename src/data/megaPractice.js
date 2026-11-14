const parse = (source, prefix, fields) => source.trim().split('\n').map((line, index) => {
  const values = line.split('|');
  return Object.fromEntries([['id', `${prefix}-${index}`], ...fields.map((field, i) => [field, values[i]])]);
});

export const vocabularyTopics = [
  ['Путешествия','✈️','A1–B1',`journey|путешествие|Our journey took three days.
destination|место назначения|Paris is our final destination.
luggage|багаж|My luggage is quite heavy.
departure|отправление|Departure is at nine.
arrival|прибытие|Check the arrival time.
platform|платформа|The train leaves from platform four.
reservation|бронирование|I have a reservation in my name.
accommodation|жильё|The price includes accommodation.
landmark|достопримечательность|This bridge is a famous landmark.
itinerary|маршрут поездки|Our itinerary includes three cities.`],
  ['Работа','💼','A2–B2',`deadline|крайний срок|We must meet the deadline.
colleague|коллега|My colleague helped with the report.
schedule|расписание|The meeting is on my schedule.
workload|рабочая нагрузка|Her workload increased this month.
promotion|повышение|He received a promotion.
salary|зарплата|They discussed the salary.
vacancy|вакансия|I applied for the vacancy.
responsibility|обязанность|Safety is our responsibility.
achievement|достижение|Completing it was a major achievement.
negotiation|переговоры|The negotiation lasted two hours.`],
  ['Общение','💬','A1–B2',`conversation|разговор|We had a long conversation.
opinion|мнение|What is your opinion?
advice|совет|Could you give me some advice?
argument|аргумент|That is a convincing argument.
complaint|жалоба|The manager handled my complaint.
request|просьба|They accepted our request.
apology|извинение|She offered a sincere apology.
agreement|соглашение|We finally reached an agreement.
misunderstanding|недопонимание|It was just a misunderstanding.
clarification|уточнение|I asked for clarification.`],
  ['Эмоции','❤️','A1–B2',`confident|уверенный|She feels confident today.
anxious|тревожный|He was anxious before the interview.
grateful|благодарный|I am grateful for your support.
disappointed|разочарованный|They were disappointed by the result.
relieved|испытавший облегчение|I felt relieved after the call.
curious|любознательный|Children are naturally curious.
frustrated|расстроенный|She became frustrated with the delay.
proud|гордый|We are proud of our team.
embarrassed|смущённый|I felt embarrassed by my mistake.
overwhelmed|перегруженный|He felt overwhelmed by the workload.`],
  ['Технологии','💻','A2–C1',`device|устройство|Connect the device to Wi-Fi.
password|пароль|Never share your password.
privacy|конфиденциальность|The app protects your privacy.
update|обновление|Install the latest update.
feature|функция|This feature saves time.
database|база данных|The records are in the database.
algorithm|алгоритм|The algorithm detects patterns.
encryption|шифрование|Encryption protects the message.
automation|автоматизация|Automation reduced routine work.
bias|предвзятость|The audit revealed algorithmic bias.`],
  ['Наука','🔬','B1–C1',`research|исследование|Further research is required.
evidence|доказательства|The evidence supports the theory.
hypothesis|гипотеза|The experiment tested our hypothesis.
sample|образец|The sample was too small.
findings|результаты исследования|The findings were published yesterday.
variable|переменная|We changed only one variable.
reliable|надёжный|The method is reliable.
accurate|точный|We need accurate measurements.
correlation|корреляция|Correlation does not prove causation.
breakthrough|прорыв|The discovery was a major breakthrough.`],
  ['Общество','🏙️','B1–C1',`community|сообщество|The community supported the project.
equality|равенство|The policy promotes equality.
inequality|неравенство|Education can reduce inequality.
awareness|осведомлённость|The campaign raised awareness.
access|доступ|Everyone needs access to healthcare.
diversity|разнообразие|Diversity strengthens the team.
regulation|регулирование|The new regulation takes effect soon.
welfare|благополучие|The reform protects public welfare.
accountability|ответственность|Leaders must accept accountability.
consensus|консенсус|The group failed to reach consensus.`],
  ['Экология','🌿','A2–C1',`environment|окружающая среда|We must protect the environment.
pollution|загрязнение|Air pollution affects health.
recycle|перерабатывать|We recycle paper and glass.
renewable|возобновляемый|Solar energy is renewable.
emission|выброс|The plan will reduce emissions.
sustainable|устойчивый|We need a sustainable solution.
conservation|охрана природы|The project supports wildlife conservation.
biodiversity|биоразнообразие|The forest has remarkable biodiversity.
scarcity|нехватка|Water scarcity is increasing.
ecosystem|экосистема|The oil spill damaged the ecosystem.`],
  ['Финансы','💳','A2–C1',`budget|бюджет|We stayed within the budget.
expense|расход|Travel is our largest expense.
income|доход|Her income increased this year.
savings|сбережения|They invested their savings.
debt|долг|He is trying to repay the debt.
afford|позволить себе|We cannot afford a larger office.
revenue|выручка|Revenue grew by ten percent.
investment|инвестиция|Education is a long-term investment.
interest rate|процентная ставка|The bank raised its interest rate.
inflation|инфляция|Inflation reduced purchasing power.`],
  ['Академический английский','🎓','B2–C1',`assess|оценивать|We must assess the risks.
derive|происходить|The word derives from Latin.
indicate|указывать|The results indicate a clear trend.
justify|обосновывать|The evidence does not justify the claim.
interpret|интерпретировать|Researchers interpret the data differently.
significant|значительный|There was a significant improvement.
framework|концептуальная основа|The theory provides a useful framework.
implication|последствие|The finding has important implications.
nevertheless|тем не менее|The task was difficult; nevertheless, we finished.
whereas|тогда как|Sales rose, whereas costs declined.`],
].map(([title, emoji, level, source], topicIndex) => ({ id: `vocab-topic-${topicIndex}`, title, emoji, level, words: parse(source, `v-${topicIndex}`, ['english','russian','example']) }));

export const phrasalVerbs = parse(`get up|вставать|I get up at seven every day.
find out|выяснить|We need to find out what happened.
give up|сдаваться|Do not give up after one mistake.
look after|заботиться|She looks after her younger brother.
look for|искать|I am looking for my keys.
look forward to|ждать с нетерпением|I look forward to meeting you.
pick up|забрать; подобрать|I will pick you up at six.
put off|откладывать|They put off the meeting.
run out of|исчерпать|We have run out of milk.
set up|настроить; основать|She set up her own company.
turn down|отклонить; убавить|He turned down the offer.
turn up|появиться; прибавить|She turned up an hour late.
work out|разобраться; тренироваться|We will work out a solution.
break down|сломаться|Our car broke down.
bring up|поднять тему|He brought up an important issue.
call off|отменить|They called off the match.
carry on|продолжать|Please carry on with your work.
come across|случайно встретить|I came across an old photograph.
come up with|придумать|The team came up with a clever idea.
cut down on|сократить|I am trying to cut down on sugar.
deal with|разбираться с|We need to deal with this complaint.
end up|в итоге оказаться|We ended up staying at home.
figure out|понять; решить|Can you figure out the answer?
fill in|заполнить|Please fill in this form.
get along with|ладить с|I get along with my colleagues.
get over|оправиться|It took her weeks to get over the illness.
go over|просмотреть|Let us go over the main points.
hold on|подождать|Hold on for a moment.
keep up with|успевать за|It is hard to keep up with the news.
leave out|исключить; пропустить|Do not leave out any details.
let down|подвести|I do not want to let the team down.
make up|выдумать; помириться|He made up an excuse.
point out|указать|She pointed out a serious flaw.
put up with|мириться с|I cannot put up with the noise.
rule out|исключить|Doctors ruled out an infection.
sort out|уладить|We will sort out the problem tomorrow.
take over|перенять управление|A new director took over.
think over|обдумать|I need time to think it over.
back up|поддержать; создать копию|Back up your files regularly.
phase out|постепенно отказаться|The company will phase out plastic packaging.`, 'pv', ['english','russian','example']);

export const idioms = parse(`break the ice|разрядить обстановку|A joke helped break the ice.
piece of cake|проще простого|The first exercise was a piece of cake.
under the weather|плохо себя чувствовать|I am feeling under the weather.
cost an arm and a leg|стоить очень дорого|That apartment costs an arm and a leg.
hit the nail on the head|попасть в точку|You hit the nail on the head.
once in a blue moon|очень редко|We eat out once in a blue moon.
the ball is in your court|теперь решать тебе|I have explained the options; the ball is in your court.
spill the beans|выдать секрет|Who spilled the beans about the surprise?
on the same page|одинаково понимать ситуацию|Let us make sure we are on the same page.
go the extra mile|сделать больше ожидаемого|She always goes the extra mile for customers.
get out of hand|выйти из-под контроля|The discussion got out of hand.
pull someone’s leg|подшучивать|Do not worry, I am just pulling your leg.
miss the boat|упустить возможность|Apply today or you may miss the boat.
cut corners|экономить в ущерб качеству|We cannot cut corners on safety.
back to square one|вернуться к началу|The failed test sent us back to square one.
in the long run|в долгосрочной перспективе|The change will save money in the long run.
take it with a grain of salt|отнестись скептически|Take online rumors with a grain of salt.
a blessing in disguise|скрытое благо|Losing that job was a blessing in disguise.
burn the midnight oil|работать допоздна|We burned the midnight oil before the launch.
learn the ropes|освоиться|It took me a month to learn the ropes.
read between the lines|читать между строк|Read between the lines of his response.
on thin ice|в рискованном положении|He is on thin ice after missing two deadlines.
think outside the box|мыслить нестандартно|We need to think outside the box.
keep an eye on|присматривать|Could you keep an eye on my bag?
call it a day|закончить работу|We have done enough; let us call it a day.
up in the air|ещё не решено|Our travel plans are still up in the air.
by the book|строго по правилам|The inspector does everything by the book.
get the hang of it|наловчиться|You will soon get the hang of it.
face the music|принять последствия|It is time to face the music.
raise the bar|повысить планку|The new design raises the bar for the industry.`, 'idiom', ['english','russian','example']);

export const listeningScenes = [
  ['A1','At the café','Could I have a small coffee and a cheese sandwich, please?','What does the customer order?','Coffee and a cheese sandwich','Tea and cake','Coffee and soup'],
  ['A1','Meeting a friend','I will meet you outside the cinema at half past six.','Where will they meet?','Outside the cinema','Inside the station','At a café'],
  ['A2','Train announcement','The train to Bristol will now leave from platform seven instead of platform four.','Which platform should passengers use?','Platform seven','Platform four','Platform eleven'],
  ['A2','Hotel reception','Breakfast is served from seven until ten on the ground floor.','When does breakfast finish?','At ten','At seven','At eleven'],
  ['A2','Weather forecast','It will be cloudy in the morning, but the sun should appear after lunch.','When will it become sunny?','After lunch','Early morning','At night'],
  ['B1','Work message','The client moved our Tuesday meeting to Thursday because their manager is away.','Why was the meeting moved?','Their manager is away','The report is unfinished','Thursday is cheaper'],
  ['B1','Doctor’s advice','Take one tablet after breakfast and another before you go to bed.','How many tablets per day?','Two','One','Three'],
  ['B1','Shopping return','I bought these headphones last week, but the left side stopped working yesterday.','What is wrong?','One side does not work','They are the wrong color','They were too expensive'],
  ['B1','Course information','You can submit the assignment on Friday, although the original deadline was Wednesday.','What is the new deadline?','Friday','Wednesday','Monday'],
  ['B2','Project update','Although testing revealed two minor issues, neither will delay the planned release.','Will the release be delayed?','No','Yes, by two days','The speaker is unsure'],
  ['B2','News report','The council approved the park renovation after the budget was reduced by fifteen percent.','What happened before approval?','The budget was reduced','Residents rejected it','The park closed'],
  ['B2','Customer feedback','The service was excellent; however, the limited vegetarian menu means I am unlikely to return.','Why may the customer not return?','Few vegetarian choices','Poor service','High prices'],
  ['B2','Interview','What attracted me to the role was not the salary but the opportunity to lead an international team.','What attracted the speaker?','Leadership opportunity','Salary','Shorter hours'],
  ['C1','Academic lecture','The correlation is statistically significant, yet it would be premature to infer a causal relationship.','What warning is given?','Correlation does not prove causation','The data is insignificant','The sample is perfect'],
  ['C1','Policy debate','While the measure may reduce costs initially, its long-term social consequences remain largely unexamined.','What remains unclear?','Long-term social effects','Initial costs','Who proposed it'],
  ['C1','Business analysis','Revenue exceeded forecasts, largely because recurring subscriptions offset a decline in one-time purchases.','What compensated for declining purchases?','Subscriptions','Higher prices','Lower salaries'],
  ['C1','Scientific report','The apparent improvement disappeared once researchers controlled for age and prior experience.','What changed the conclusion?','Controlling other variables','A larger payment','A new laboratory'],
  ['C1','Negotiation','Were we to extend the deadline, we would require a firm commitment to the revised budget.','What condition is attached?','Commitment to the budget','Hiring more staff','Canceling the project'],
  ['C1','Editorial','Compelling though the proposal sounds, it rests on assumptions that have yet to be tested.','Why is the writer cautious?','Its assumptions are untested','It is too inexpensive','It has already failed'],
  ['C1','Team retrospective','Had we consulted users earlier, we might have avoided building a feature that few of them needed.','What would earlier consultation have prevented?','An unnecessary feature','A budget increase','Hiring users'],
].map((row, index) => ({ id: `listen-${index}`, level: row[0], title: row[1], text: row[2], question: row[3], answer: row[4], options: row.slice(4) }));

export const writingTasks = [
  ['A1','Сообщение другу','Напиши 3–4 предложения: представься, скажи, где живёшь и что любишь делать.','Hi! My name is Anna. I live in Kazan. I enjoy music and cycling.','приветствие; имя; город; увлечение'],
  ['A1','Мой день','Опиши обычный день в 4–5 простых предложениях.','I get up at seven. I have breakfast and go to work. In the evening, I study English.','Present Simple; время; 4 предложения'],
  ['A2','Бронирование','Напиши короткое письмо в отель и спроси о свободном номере и завтраке.','Hello, I would like to book a room for two nights. Is breakfast included? Kind regards, Alex.','вежливая просьба; даты; вопрос'],
  ['A2','Приглашение','Пригласи друга на мероприятие: место, время и причина.','Would you like to come to the concert with me on Saturday? It starts at seven at City Hall.','приглашение; время; место'],
  ['A2','Прошлые выходные','Расскажи, что произошло на выходных, в 5 предложениях.','Last weekend I visited my cousins. We cooked dinner and watched a film. I had a wonderful time.','Past Simple; последовательность'],
  ['B1','Жалоба магазину','Опиши проблему с товаром и предложи желаемое решение.','I am writing about headphones purchased last week. The left speaker has stopped working. I would appreciate a replacement or a full refund.','проблема; детали; решение; вежливый тон'],
  ['B1','Совет другу','Друг хочет сменить работу. Дай взвешенный совет.','You should first consider why you want a change. It may help to compare your current role with available opportunities.','should; аргумент; практический шаг'],
  ['B1','Отзыв','Напиши отзыв о кафе: достоинства, недостаток и рекомендация.','The café has friendly staff and excellent coffee. However, service can be slow at lunchtime. I would still recommend it.','плюс; минус; рекомендация'],
  ['B1','История','Начни со слов “When I opened the door…” и напиши короткую историю.','When I opened the door, I found a small package. There was no name on it, so I called my neighbor.','Past Simple; связки; концовка'],
  ['B2','Рабочее письмо','Сообщи команде о переносе срока, объясни причину и новый план.','The deadline has been moved to Friday due to an unexpected technical issue. We will complete testing on Wednesday and deliver the final version by Friday morning.','пассив; причина; новый план'],
  ['B2','Мнение','Должна ли удалённая работа стать нормой? Напиши 120–150 слов.','Remote work offers flexibility and saves commuting time. Nevertheless, it can make collaboration harder. A hybrid model therefore seems the most balanced option.','позиция; два аргумента; контраргумент; вывод'],
  ['B2','Сопроводительное письмо','Объясни, почему подходишь на выбранную должность.','I am applying for the project coordinator position. My experience managing cross-functional teams has prepared me to organize complex projects and communicate clearly.','цель; опыт; польза компании'],
  ['B2','Отчёт','Кратко опиши результаты опроса и дай рекомендацию.','The survey indicates that most users value speed over customization. We therefore recommend improving performance before adding new features.','данные; сравнение; рекомендация'],
  ['C1','Аргументированное эссе','Оцени, приносит ли искусственный интеллект обществу больше пользы, чем риска.','Although artificial intelligence can improve access to knowledge, its benefits depend on transparent governance. Without accountability, efficiency may come at the expense of fairness.','нюанс; доказательство; уступка; вывод'],
  ['C1','Формальная рекомендация','Предложи руководству план повышения качества обучения сотрудников.','It is recommended that the organization introduce mentoring alongside short practical workshops. Progress should be assessed through observable performance rather than attendance alone.','безличный стиль; меры; критерий успеха'],
  ['C1','Критический обзор','Оцени сильные и слабые стороны исследования.','The study provides a useful framework and draws on a diverse sample. Its conclusions should nevertheless be treated cautiously, since the data is self-reported.','сильная сторона; ограничение; осторожный вывод'],
  ['C1','Дипломатичный отказ','Отклони предложение партнёра, сохранив хорошие отношения.','We appreciate the thought behind your proposal. At present, however, the suggested timeline would not allow adequate testing. We would welcome a revised schedule.','благодарность; причина; альтернатива'],
  ['C1','Резюме дискуссии','Подведи итоги встречи с несколькими точками зрения.','Participants agreed on the need for reform but differed over its pace. While one group favored immediate action, others emphasized the risks of insufficient preparation.','нейтральный тон; контраст; общий вывод'],
].map((row, index) => ({ id: `writing-${index}`, level: row[0], title: row[1], prompt: row[2], model: row[3], checklist: row[4].split(';') }));
