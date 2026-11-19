// Recognize only dialogue states whose constraints are clear from the transcript.
export const isClarification = text => /^(?:what|huh|sorry|pardon|what do you mean|что|не понял(?:а)?)[?!.\s]*$/i.test(String(text || '').trim());
const clean = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const day = '(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?';

export function tutorTurn(messages) {
  const turns = messages.filter(item => item.kind !== 'command' && item.action !== 'translate' && item.content?.trim());
  const latest = turns.at(-1);
  if (messages.at(-1)?.kind === 'command' || latest?.role !== 'user') return null;
  const preceding = turns.at(-2);
  const previous = preceding?.role === 'assistant' ? preceding.content : null;
  const question = previous?.match(/[^.!?\n]*\?/g)?.at(-1)?.trim();
  const earlier = turns.slice(0, -1).filter(item => item.role === 'user').map(item => item.content.trim()).reverse();
  const answer = clean(latest.content);

  if (question && isClarification(answer) && /\b(?:play|compete)\b[^?]*\bleague\b/i.test(question)) {
    return { kind: 'league', instruction: 'Explain league in plain English as organized matches against other teams. Rephrase the question. Keep the learner’s facts attributed to them.',
      replies: ['I mean: do you play organized matches against other teams?', 'Do you play in organized matches, or just for fun?'] };
  }

  const football = earlier.find(text => /\bfootball\b/i.test(text));
  const asksAboutCompany = /^(?:who do you|do you)(?: usually)? play(?: football)? with\b/i.test(question || '');
  const gaveCompany = /^with (?:(?:my )?friends|(?:my |a )?team)[.!\s]*$/.test(answer);
  if (asksAboutCompany && gaveCompany && /\bi (?:usually |often )?play football\b/i.test(football || '') && !/\b(?:not anymore|no longer|stopped)\b/i.test(football)) {
    const playsWith = answer.includes('friends') ? 'friends' : 'team';
    const schedule = football.match(new RegExp(`\\b(?:on|every) (${day})\\b`, 'i'))?.[0];
    const group = `your ${playsWith}`;
    return {
      kind: 'football', schedule,
      instruction: `Known: the learner plays football with ${playsWith}${schedule ? ` ${schedule}` : ''}. Ask one new question about where they play or their position. Keep those facts unchanged.`,
      replies: [`Where do you and ${group} usually play football?`, `What position do you play when you’re with ${group}?`],
    };
  }

  const ticket = earlier.find(text => /^(?:i need|i(?:['’]d| would) like|i want) (?:a )?(?:(?:single|return|round[- ]trip|one[- ]way) )?(?:train )?ticket to\b/i.test(text));
  if (ticket && /^(?:yes|yeah|yep|sure|of course)[.!\s]*$/.test(answer) && /^(?:would you (?:like|prefer)|do you want) (?:to (?:take|catch|book) )?(?:a|the) morning train\?/i.test(question || '')) {
    const destination = ticket.match(/\bto ([A-Z][a-z'-]*(?: [A-Z][a-z'-]*){0,2})[.!]?$/)?.[1];
    const ticketType = /\b(?:single|return|round[- ]trip|one[- ]way) (?:train )?ticket\b/i.test(ticket);
    return { kind: 'train', ticketType, instruction: `The learner chose the morning train${destination ? ` to ${destination}` : ''}. Acknowledge that choice and advance one step. ${ticketType ? 'Ask about a seat preference.' : 'Ask whether they need a single or return ticket.'} Never claim a booking was made.`,
      replies: ticketType
        ? ['The morning train, then. Would you prefer a window seat or an aisle seat?', 'All right, the morning train. Do you have a seat preference?']
        : [`The morning train${destination ? ` to ${destination}` : ''}, then. Do you need a single or a return ticket?`, 'Let’s go with the morning train. Will you be coming back, or is this a one-way trip?'] };
  }
  return null;
}

export function tutorTurnProblem(turn, reply) {
  if (!turn) return '';
  const text = clean(reply);
  const question = text.match(/[^.!?]*\?/g)?.at(-1) || '';
  if (turn.kind === 'league') {
    if (!/\b(?:matches|competition|compete)\b|\b(?:organized|organised|other teams)\b/.test(text)) return 'explain the league question in plain English';
  }
  if (turn.kind === 'football') {
    if (!/\b(?:football|friends|team|play|position|pitch|field|park|match|game|score|goal|practice|meet)\b/.test(question)) return 'ask a new question about how or where the learner plays';
    if (/\b(?:who do you|with whom do you)(?: usually)? play\b|\bwith (?:friends|a team) or\b/.test(question)) return 'the learner already said who they play with';
    const knownDay = turn.schedule?.match(new RegExp(day, 'i'))?.[0].toLowerCase().replace(/s$/, '');
    const askedDay = question.match(new RegExp(`\\b(?:every|on) (${day})\\b`))?.[1].replace(/s$/, '');
    if (knownDay && (/^\s*(?:what day|which day|when)\b/.test(question) || askedDay && askedDay !== knownDay)) {
      return 'the learner already gave their playing day';
    }
  }
  if (turn.kind === 'train') {
    if (/\b(?:booked|reserved|confirmed) (?:your|you|a|the|it)\b|\b(?:your )?(?:ticket|booking|reservation) (?:is|has been) (?:booked|reserved|confirmed)\b/.test(text)) return 'do not claim the ticket was booked';
    const asksAboutSeat = /\b(?:seat|window|aisle)\b/.test(question);
    const asksAboutType = /\b(?:single|return|round[- ]trip|one[- ]way)\b|\bcoming back\b/.test(question);
    if ((!asksAboutSeat && (!asksAboutType || turn.ticketType)) || /\b(?:evening|afternoon) train\b/.test(text)) {
      return 'keep the morning train and ask for a new booking detail, such as the ticket type or seat preference';
    }
  }
  return '';
}

export function echoesLearnerFact(messages, reply) {
  const learnerStatements = messages.filter(item => item.role === 'user' && item.kind !== 'command').slice(-6)
    .flatMap(item => clean(item.content).split(/[.!?]+/))
    .map(text => text.trim()).filter(text => /^i\b/.test(text) && text.split(/\s+/).length >= 4);
  return clean(reply).split(/[.!?]+/).some(text => learnerStatements.includes(text.trim()));
}
