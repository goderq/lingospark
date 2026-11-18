// Complete, anchored formulations for each prompt. The interchangeable parts
// can vary, while the requested destination, day, amount or action stays fixed.
export const contextReplyForms = {
  'scene-station-1': /^(?:how (?:do|can) i (?:get to|reach|find)|(?:could|can|would) you tell me how to (?:get to|reach|find)) the (?:train |railway )?station$/,
  'scene-station-2': /^(?:which|what) bus (?:do|should|can|could) i (?:take|catch|get on)$/,
  'scene-station-3': /^(?:how long (?:does|will) (?:it|the (?:bus ride|ride|journey|trip)) take(?: (?:by bus|to get there))?|how long is the (?:trip|journey|bus ride))$/,
  'scene-coffee-1': /^(?:(?:can|could|may) i (?:have|get|order) |i (?:would like|want) )?(?:a|one) coffee$/,
  'scene-coffee-2': /^(?:(?:i would like it |make it |it is )?(?:to go|to take away)|takeaway|for takeaway)$/,
  'scene-coffee-3': /^(?:(?:can|could|may) i pay (?:by card|with (?:a|my) card)|(?:do you|can you) (?:take|accept) (?:card(?: payments)?|cards|credit cards))$/,
  'scene-appointment-1': /^(?:i have (?:an appointment|a booking)|i am (?:booked in|scheduled)|my appointment is) (?:on|for) (?:this )?friday$/,
  'scene-appointment-2': /^(?:(?:can|could|may) i |(?:can|could|would) you |i would like to )(?:move|change|reschedule|switch) (?:my|the) (?:appointment|booking)(?: from friday)? (?:to|for) (?:this )?monday$/,
  'scene-appointment-3': /^(?:monday at (?:10|ten)(?: am| in the morning)?|(?:10|ten) on monday) (?:is (?:fine|good|great|perfect)|works(?: for me)?)(?: thank you| thanks)?$/,
  'scene-refund-1': /^(?:(?:can|could|may) i |i (?:would like|want|need) to )return (?:this|the|my) jacket$/,
  'scene-refund-2': /^(?:it is|this jacket is|the jacket is) too (?:big|large)(?: for me)?$/,
  'scene-refund-3': /^(?:(?:can|could|may) i (?:have|get|request) |i (?:would like|would prefer|want) )?(?:a|my) refund$|^(?:i would like|(?:can|could) i (?:get|have)) my money back$/,
  'scene-parcel-1': /^(?:i am here to |i (?:would like|want|need) to |(?:can|could|may) i )(?:pick up|collect|get) (?:my|the) (?:parcel|package|delivery)$/,
  'scene-parcel-2': /^(?:yes )?(?:it is|the (?:collection )?code is|i have (?:it|the (?:collection )?code)) on my phone$/,
  'scene-parcel-3': /^(?:no )?(?:that is all|nothing else|no) (?:thank you|thanks)$/,
  'scene-train-1': /^i (?:have )?missed (?:my|the) (?:(?:connecting |next )?train|connection)$/,
  'scene-train-2': /^(?:(?:can|could|may) i (?:use|keep using) (?:the same|my(?: current)?) ticket(?: (?:on|for) (?:this|that|the next) train)?|is my (?:current )?ticket (?:still )?valid(?: (?:on|for) (?:this|that|the next) train)?)$/,
  'scene-train-3': /^(?:which|what) platform (?:does (?:it|the train) (?:leave|depart) from|is (?:it|the train) (?:leaving|departing) from|is it)$/,
  'scene-colleague-1': /^(?:can|could|would) you help me (?:to )?(?:run|generate) (?:the|this|my) report(?: in the (?:app|application))?$/,
  'scene-colleague-2': /^i have been working on (?:it|(?:the|this|my) report) for (?:an|one|1) hour(?: now)?$/,
  'scene-colleague-3': /^(?:(?:can|could|should) we meet at (?:two|2)(?: oclock| pm)?|(?:is|would) (?:two|2)(?: oclock| pm)? (?:be )?(?:fine|good|convenient) (?:for|with) you)$/,
};

export function contextReplyFeedback(item) {
  if (!item?.dialogueHint) return '';
  if (item.id === 'scene-appointment-2') return 'Проверь, что просишь перенести запись именно на понедельник.';
  if (item.id === 'scene-appointment-3') return 'Подтверди предложенное время — понедельник в десять.';
  if (item.id === 'scene-colleague-3') return 'Уточни время встречи — два часа дня.';
  if (item.id === 'scene-coffee-2') return 'Скажи, что заберёшь кофе с собой.';
  return 'Проверь, передаёт ли реплика всю просьбу. Можно исправить ответ или открыть подсказку.';
}
