import { courseSupplement } from './courseSupplement.js';

const cues = {
  greetings: ["Hi! I'm Sam. What's your name?", 'Who is that with you?'],
  cafe: ['Welcome! What would you like before you order?', 'What would you like to know about this dish?'],
  travel: ['You need to find your train. What would you ask me?', 'Which ticket do you need for Oxford?'],
  smalltalk: ["It's been a while! What would you like to ask me?", 'What would you like to know about my weekends?'],
  shopping: ['This jacket is too small. What would you ask?', 'Would you like to ask about trying this jacket on?'],
  hotel: ['Welcome! Do you have a booking?', 'Is there anything you would like to know about breakfast?'],
  past: ['Why were you late yesterday morning?', 'Where did you live before you moved here?'],
  plans: ['What are you going to do next?', 'When are you meeting them?'],
  presentperfect: ['What would you like to ask about my travel experience?', 'How is the report going?'],
  health: ['What symptoms have you had, and for how long?', 'What would you like to ask about taking this medicine?'],
  relationships: ['What are you and your friend like?', 'Your comment upset me. Did you intend that?'],
  phone: ['Good morning, reception. How can I help?', "I'm having trouble hearing you. Is the connection all right?"],
  emergency: ['Someone is seriously hurt. What help do we need?', 'What document have you lost?'],
  cooking: ['What should I do with the onions?', 'What should I do with the sauce next?'],
  sports: ['How often do you exercise?', "I'm about to go running. What should I remember?"],
  'deep-technology': ["My device isn't working. What should I try?", 'What did the latest update fix?'],
  phrasal: ['What should we do about this problem?', 'What should I do with this form?'],
  work: ["Tuesday would be better for me. What could we do about the meeting?", 'When will you send the revised document?'],
  education: ['What are you studying at the moment?', 'When is the assignment due?'],
  'deep-relationships': ['We disagree. How should we treat our different opinions?', "I've told you the truth. How do you feel about that?"],
  conditionals: ['What would you do if you had more time?', 'Can we wait a little longer before we leave?'],
  interview: ['What is one of your strengths?', 'What did your previous role teach you?'],
  idioms: ["We've worked enough today. What do you suggest?", 'How did everyone find out about the secret?'],
  finance: ['How do you manage your budget?', 'Does the bank charge for transferring money?'],
  media: ['What should I check before sharing this article?', 'Does this headline tell the whole story?'],
  environment: ['How can taking the bus help the environment?', 'What kind of packaging should we avoid?'],
  customer_service: ["My order has arrived damaged, and I'm upset.", 'What will you do to help with this issue?'],
  leadership: ['What does a good leader do before deciding?', 'How could we improve the way we share work?'],
  'deep-environment': ['How has the drought affected the area?', 'What needs to happen to carbon emissions this decade?'],
  'deep-finance': ['How has inflation affected households?', 'How did the company perform compared with expectations?'],
  'deep-psychology': ['Why can lack of sleep be a problem for decisions?', 'What kind of evidence do people often look for?'],
  debate: ['Why do you support this conclusion?', 'Do you agree with the proposal in every respect?'],
  legal: ["I'm ready to sign. What should I do first?", 'How much notice does the tenant have to give?'],
  mastery: ['What is your assessment of the proposal?', 'Has this issue often been discussed so openly?'],
  negotiation: ['Is there any flexibility on the delivery date?', 'Can you accept this condition?'],
  technology: ['What effect is artificial intelligence having?', 'When does the system process the data?'],
  academic: ['What data does the study draw on?', 'Is this interpretation sufficiently supported?'],
  science: ['How did the experiment turn out?', 'Has the hypothesis been confirmed?'],
  culture: ['Do cultural values stay the same across generations?', 'How does the novel deal with traditional social roles?'],
  public_speaking: ['How should I begin my presentation?', 'When would you recommend pausing?'],
  'deep-media': ['What was missing from the presentation of the statistics?', 'Has anyone independently checked the report?'],
  'deep-academic': ['What does the paper provide?', 'Were these variables included in the final analysis?'],
  'deep-negotiation': ['Can we proceed under the current safeguards?', 'Does our proposal fully address your concerns?'],
};

export function getCourseDialogue(id) {
  if (id === 'greetings') return [
    { speaker: 'Sam', line: cues[id][0], answer: 'My name is Anna.', answers: ["I'm Anna", 'I am Anna'], prompt: 'Представься: тебя зовут Анна.', options: ['My name is Anna.', 'My name am Anna.', 'My name are Anna.'] },
    { speaker: 'Sam', line: 'Nice to meet you, Anna!', answer: 'Nice to meet you too.', prompt: 'Ответь, что тебе тоже приятно познакомиться.', options: ['Nice to meet you too.', 'Nice to meet me too.', 'Nice meeting to you.'] },
  ];
  const pairs = courseSupplement[id];
  if (!pairs || !cues[id]) throw new Error(`Missing conversation for ${id}`);
  const indices = ['cafe', 'travel'].includes(id) ? [0, 2] : [0, 1];
  return indices.map((pairIndex, index) => ({
    speaker: 'Partner', line: cues[id][index], answer: pairs[pairIndex][0],
    prompt: `Ответь по ситуации: «${pairs[pairIndex][1]}».`,
    options: [pairs[pairIndex][0], ...pairs.filter((_, i) => i !== pairIndex).slice(0, 2).map(pair => pair[0])],
  }));
}

export function getCoursePracticePhrases(id) {
  if (id === 'greetings') return [{ english: 'My name is Anna.', russian: 'Меня зовут Анна.' }, { english: 'Nice to meet you too.', russian: 'Мне тоже приятно познакомиться.' }];
  if (!courseSupplement[id]) return [];
  return getCourseDialogue(id).map(step => {
    const pair = courseSupplement[id].find(([english]) => english === step.answer);
    return pair ? { english: pair[0], russian: pair[1] } : null;
  }).filter(Boolean);
}
