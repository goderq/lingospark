const documents = {
  airport: ['Билет в город', 'CITY TRAIN: Platform 6. A single ticket costs £12. Keep your ticket until you leave the station.', 'Сколько стоит билет в одну сторону?', '£12', ['£6', '£24'], 'Single ticket — билет в одну сторону. Platform 6 — номер платформы, а не цена.'],
  hotel: ['Сообщение от отеля', 'Check-in starts at 3 pm. Breakfast is served from 7 to 10 am. Please return your key at reception.', 'До какого времени можно позавтракать?', '10 am', ['3 pm', '7 pm'], 'From 7 to 10 am — с семи до десяти утра. Check-in — время заселения.'],
  'cafe-world': ['Чек заказа', 'Order 24: oat latte £4, sandwich £6. Total £10. Please collect your order at the counter.', 'Где забрать заказ?', 'At the counter.', ['At the station.', 'At your hotel.'], 'Collect your order at the counter означает забрать заказ у стойки.'],
  flat: ['Объявление об аренде', 'Room available: £650 per month. Bills included. One month deposit required. No smoking indoors.', 'Нужно ли отдельно оплачивать коммунальные услуги?', 'No, bills are included.', ['Yes, they cost £650 extra.', 'Only the deposit is included.'], 'Bills included — коммунальные платежи входят в стоимость. Deposit — отдельный залог.'],
  'doctor-world': ['Запись на приём', 'Your appointment is on Thursday at 9:30 am. Arrive ten minutes early and bring a list of your medication.', 'Когда нужно прийти в клинику?', 'Thursday at 9:20 am.', ['Thursday at 9:40 am.', 'Friday at 9:30 am.'], 'Приём в 9:30, просят прийти на десять минут раньше: 9:20.'],
  'interview-world': ['Приглашение работодателя', 'Please prepare one example of teamwork. The interview lasts 30 minutes. You may ask questions at the end.', 'Что нужно подготовить?', 'An example of working with a team.', ['A list of every job advert.', 'A thirty-page business plan.'], 'One example of teamwork — один пример командной работы.'],
  workday: ['Письмо команды', 'Please review the draft today. Leave comments in the shared document; do not send separate copies. We meet at 4 pm.', 'Где оставить замечания?', 'In the shared document.', ['In separate copies.', 'Only at tomorrow’s meeting.'], 'Shared document — общий документ. Отдельные копии создавать не просят.'],
  conference: ['Программа конференции', 'The keynote has moved to Hall B. Delegates who registered for the workshop should remain in Hall A until 11.', 'Куда направиться участнику мастер-класса?', 'Stay in Hall A until 11.', ['Move immediately to Hall B.', 'Leave the venue before 11.'], 'Изменение зала касается keynote; участники workshop остаются в Hall A.'],
  bank: ['Тариф банка', 'Monthly account fee: £0. International transfers: £5 each. Cash withdrawals from our machines are free.', 'За какую операцию возьмут комиссию?', 'An international transfer.', ['A monthly account payment.', 'A withdrawal from this bank’s machine.'], 'Each — за каждый перевод. Нулевая месячная плата не делает все услуги бесплатными.'],
  university: ['Письмо преподавателя', 'Submit your outline by Monday. The full essay is due two weeks later. Feedback on the outline will not affect your final grade.', 'Что нужно сдать первым?', 'The outline.', ['The full essay.', 'The final grade.'], 'Outline — план работы. Для полного эссе предусмотрен более поздний срок.'],
  police: ['Ответ бюро находок', 'A phone matching your description has been found. Bring photo ID and proof of ownership. Collection is by appointment only.', 'Можно ли забрать телефон без записи?', 'No, an appointment is required.', ['Yes, at any time.', 'Yes, without any identification.'], 'By appointment only — только по предварительной записи.'],
  'weekend-trip': ['Уведомление перевозчика', 'Due to engineering work, a replacement bus will run between York and Edinburgh. Your train ticket remains valid.', 'Нужно ли покупать новый билет для замены поезда?', 'No, the existing ticket is valid.', ['Yes, a new bus ticket is compulsory.', 'The journey has been cancelled completely.'], 'Remains valid — остаётся действительным; replacement bus — автобус вместо поезда.'],
  'career-project': ['Паспорт проекта', 'The client prioritises accessibility over visual polish. Deliver a functional prototype by Friday; the final design follows next month.', 'Что важнее для ближайшей сдачи?', 'An accessible working prototype.', ['A polished final design without functionality.', 'A complete redesign next year.'], 'Prioritises X over Y — ставит X выше Y. Срок прототипа отличается от срока финального дизайна.'],
  networking: ['Сообщение нового контакта', 'It was good meeting you. Could you send a brief introduction to your project? No confidential figures are needed at this stage.', 'Что стоит отправить?', 'A short overview without confidential figures.', ['The complete confidential budget.', 'Nothing until a contract is signed.'], 'Brief introduction — краткое описание; confidential figures не нужны на этом этапе.'],
  'negotiation-world': ['Проект условий', 'The discount applies only if payment is received within fourteen days. Delivery remains subject to stock availability.', 'При каком условии действует скидка?', 'Payment must arrive within fourteen days.', ['Delivery must take exactly fourteen days.', 'Stock must always be available.'], 'Only if задаёт условие скидки. Subject to stock availability отдельно ограничивает поставку.'],
  'office-crisis': ['Отчёт об инциденте', 'The fault is contained, but its cause remains unconfirmed. Inform customers of the workaround without attributing blame.', 'Как правильно сообщить клиентам о ситуации?', 'Explain the workaround and avoid unverified blame.', ['Announce a confirmed cause immediately.', 'Accuse the supplier without evidence.'], 'Contained не означает, что причина установлена. Необходимо сообщить обходное решение без неподтверждённых обвинений.'],
  'media-interview': ['Запрос журналиста', 'Please distinguish verified findings from estimates. Any statement made on the record may be quoted directly.', 'Что может быть опубликовано как прямая цитата?', 'An on-the-record statement.', ['Only private off-the-record remarks.', 'Nothing without a second interview.'], 'On the record — заявление, которое можно официально цитировать.'],
  promotion: ['Критерии повышения', 'Promotion requires evidence of sustained impact, not merely longer hours. Include examples of mentoring and measurable improvements.', 'Какие доказательства наиболее уместны?', 'Mentoring outcomes and measurable improvements.', ['Only the number of late evenings.', 'Unverifiable praise without examples.'], 'Sustained impact — устойчивый результат; часы переработки сами по себе его не подтверждают.'],
  community: ['Условия городского гранта', 'Proposals must demonstrate public benefit and include a maintenance plan. One-off publicity events are unlikely to receive funding.', 'Что должно быть в заявке помимо общественной пользы?', 'A plan for ongoing maintenance.', ['Only a publicity campaign.', 'A promise to avoid all future costs.'], 'Maintenance plan показывает, как проект будут поддерживать после запуска.'],
  finale: ['Приглашение выпускнику', 'You are invited to mentor new arrivals. Participation is voluntary, and you may choose the topics that reflect your experience.', 'Какое участие предлагают?', 'Voluntary mentoring based on your experience.', ['Compulsory full-time employment.', 'An exam with fixed topics for everyone.'], 'Voluntary означает добровольное участие; topics можно выбрать по своему опыту.'],
};

const repairs = {
  airport: ['I said three weeks, but I meant three months.', 'Уточни длительность пребывания', 'Sorry, I meant three months.', ['I staying three months.', 'No, you wrong.']],
  hotel: ['I understood that you wanted to check out today.', 'Объясни, что хочешь заселиться, а не выехать', 'Sorry, I meant check in, not check out.', ['Check in and out is same.', 'You must know it.']],
  'cafe-world': ['So that is a regular milk latte?', 'Исправь заказ: тебе нужно овсяное молоко', 'Oat milk, please, not regular milk.', ['Yes, any milk is oat.', 'I milk not regular is.']],
  flat: ['You mean the rent excludes bills?', 'Уточни, что коммунальные услуги включены', 'No, the advert says bills are included.', ['Bills is not meaning.', 'The deposit are bills.']],
  'doctor-world': ['Did you say the pain started today?', 'Уточни, что боль началась два дня назад', 'Actually, it started two days ago.', ['It has started tomorrow.', 'Two days since ago.']],
  'interview-world': ['So you managed the whole department?', 'Уточни, что ты руководил небольшой командой', 'To clarify, I led a small team, not the whole department.', ['Yes, small means whole.', 'I department all leader.']],
  workday: ['I thought you would send separate files.', 'Уточни, что комментарии будут в общем документе', 'I will leave my comments in the shared document instead.', ['Shared is separate files.', 'I comments yesterday tomorrow.']],
  conference: ['All delegates should move to Hall B, right?', 'Уточни исключение для участников мастер-класса', 'Workshop participants should remain in Hall A until eleven.', ['Everyone should leave Hall A immediately.', 'No delegates can attend the workshop.']],
  bank: ['You said every transfer is free?', 'Уточни комиссию за международный перевод', 'International transfers cost five pounds each.', ['All transfers always cost nothing.', 'Five pounds are monthly free.']],
  university: ['Is the complete essay due on Monday?', 'Уточни, что в понедельник нужен только план', 'Only the outline is due on Monday; the full essay is due later.', ['The full essay and outline are the same.', 'Monday means two weeks later.']],
  police: ['Can I collect it without any documents?', 'Уточни, какие документы потребуются', 'You need photo ID and proof that the phone belongs to you.', ['You need no identification at all.', 'Any phone is enough proof.']],
  'weekend-trip': ['Then I must buy another ticket for the replacement bus?', 'Объясни, что прежний билет продолжает действовать', 'Your existing train ticket is valid on the replacement bus.', ['The replacement requires buying every ticket twice.', 'Existing means cancelled.']],
  'career-project': ['Should we prioritise visual polish over accessibility?', 'Верни обсуждение к приоритету клиента', 'Accessibility comes first; visual polish can follow later.', ['Visual polish is the only requirement.', 'Accessibility has nothing to do with this project.']],
  networking: ['Would you like me to send the confidential figures too?', 'Уточни, что пока нужно только краткое описание', 'A brief overview is enough at this stage; please leave out confidential figures.', ['Please publish every confidential figure.', 'An overview must contain all private accounts.']],
  'negotiation-world': ['Is the discount guaranteed regardless of when we pay?', 'Уточни условие применения скидки', 'The discount is conditional on payment within fourteen days.', ['Payment timing never affects the discount.', 'Fourteen days refers only to stock.']],
  'office-crisis': ['So we can publicly blame the supplier now?', 'Останови неподтверждённое обвинение', 'We should not attribute blame until the cause has been verified.', ['Containment proves who is responsible.', 'We must accuse someone before investigating.']],
  'media-interview': ['I assumed on the record meant confidential.', 'Уточни правила цитирования', 'On-the-record remarks may be quoted; they are not confidential.', ['On the record always means secret.', 'All private remarks must be published.']],
  promotion: ['Are longer hours sufficient evidence for promotion?', 'Уточни, что требуется устойчивый результат', 'Longer hours alone are not sufficient; we need evidence of sustained impact.', ['Hours alone prove every improvement.', 'Mentoring cannot count as evidence.']],
  community: ['Can the proposal omit future maintenance costs?', 'Напомни о плане дальнейшей поддержки', 'We need a maintenance plan as well as evidence of public benefit.', ['Maintenance is forbidden in the application.', 'Publicity removes the need for maintenance.']],
  finale: ['Am I obliged to take part in every mentoring session?', 'Уточни добровольность участия', 'Participation is voluntary, and you can choose topics that match your experience.', ['Voluntary means compulsory attendance.', 'You must teach every topic regardless of experience.']],
};

export const worldArcs = [
  { title: 'Новая жизнь', ids: ['airport','hotel','cafe-world','flat','doctor-world'] },
  { title: 'Люди и возможности', ids: ['interview-world','workday','conference','bank','university'] },
  { title: 'Самостоятельность', ids: ['police','weekend-trip','career-project','networking','negotiation-world'] },
  { title: 'Свой голос', ids: ['office-crisis','media-interview','promotion','community','finale'] },
];

export function worldUnlocked(location, world, locations) {
  const index = locations.findIndex((entry) => entry.id === location.id);
  return index >= 0 && (world.completed?.includes(location.id) || locations.slice(0,index).every((entry) => world.completed?.includes(entry.id)));
}

export function buildWorldMission(location, world = {}) {
  const scenes = [...location.scenes];
  const doc = documents[location.id];
  if (doc) scenes.splice(1,0,{type:'choice',kind:'document',speaker:doc[0],line:doc[1],prompt:doc[2],answer:doc[3],options:[doc[3],...doc[4]],explanation:doc[5]});
  const repair = repairs[location.id];
  if (repair) scenes.push({type:'choice',kind:'repair',speaker:location.character,line:repair[0],prompt:repair[1],answer:repair[2],options:[repair[2],...repair[3]],explanation:'Когда тебя поняли неверно, спокойно уточни смысл: I meant… — «я имел в виду…». Исправляй конкретную деталь, а не обвиняй собеседника.'});
  if (location.id === 'hotel' && world.decisions?.airport) {
    const askedMia = world.decisions.airport.id === 'ask-mia';
    scenes.push({type:'choice',kind:'memory',speaker:'Ben',line:askedMia ? 'Mia mentioned that you might be arriving today.' : 'Did you come by the express train?',prompt:askedMia ? 'Объясни, что Mia помогла тебе найти дорогу' : 'Подтверди поездку на экспрессе',answer:askedMia ? 'Yes, Mia helped me find my way here.' : 'Yes, I took the express train to the city.',options:askedMia ? ['Yes, Mia helped me find my way here.','I have never spoken to Mia.','Mia is a train ticket.'] : ['Yes, I took the express train to the city.','I express tomorrow yesterday.','Trains are hotel rooms.'],explanation:'Реплика связана с твоим решением в аэропорту. Past Simple описывает уже произошедшее действие.'});
  }
  return {...location,scenes};
}

export function worldMemory(location, world = {}) {
  const previous = Object.values(world.decisions || {}).filter((decision) => decision.outcome);
  const messages = [];
  if (world.career) messages.push(`Твой карьерный путь: ${world.career}. Он сохраняется в следующих главах.`);
  const relation = world.relationships?.[location.character];
  if (relation) messages.push(`${location.character} помнит прошлое общение. Доверие: ${relation}.`);
  if (previous.length) messages.push(`Ранее в твоей истории: ${previous[previous.length-1].outcome}`);
  return messages;
}

export function worldDecisionAvailable(decision, world = {}) {
  return (world.money ?? 150) + (decision.money || 0) >= 0;
}

export function readWorldDraft(world, location) {
  const saved = world?.draft;
  if (saved?.locationId !== location.id || saved.version !== 1 || saved.sceneCount !== location.scenes.length) return null;
  if (!Number.isInteger(saved.index) || saved.index < 0 || saved.index >= location.scenes.length) return null;
  if (!Number.isInteger(saved.lives) || saved.lives < 0 || saved.lives > 3 || !Number.isInteger(saved.score) || saved.score < 0 || saved.score > location.scenes.length) return null;
  return saved;
}
