const formPatterns = {
  'present-simple': ['✅ I work / She works', '❌ I do not work / She does not work', '❓ Do you work? / Does she work?'],
  'present-continuous': ['✅ I am working', '❌ I am not working', '❓ Are you working?'],
  'present-perfect': ['✅ I have finished', '❌ I have not finished', '❓ Have you finished?'],
  'present-perfect-continuous': ['✅ I have been working', '❌ I have not been working', '❓ Have you been working?'],
  'past-simple': ['✅ I worked / I went', '❌ I did not work / go', '❓ Did you work / go?'],
  'past-continuous': ['✅ I was working', '❌ I was not working', '❓ Were you working?'],
  'past-perfect': ['✅ I had finished', '❌ I had not finished', '❓ Had you finished?'],
  'past-perfect-continuous': ['✅ I had been working', '❌ I had not been working', '❓ Had you been working?'],
  'future-simple': ['✅ I will work', '❌ I will not work', '❓ Will you work?'],
  'future-continuous': ['✅ I will be working', '❌ I will not be working', '❓ Will you be working?'],
  'future-perfect': ['✅ I will have finished', '❌ I will not have finished', '❓ Will you have finished?'],
  'future-perfect-continuous': ['✅ I will have been working', '❌ I will not have been working', '❓ Will you have been working?'],
  'used-to': ['✅ I used to work here', '❌ I did not use to work here', '❓ Did you use to work here?'],
  'going-to': ['✅ I am going to leave', '❌ I am not going to leave', '❓ Are you going to leave?'],
  'future-in-past': ['✅ She said she would call', '❌ She said she would not call', '❓ Did she say she would call?'],
};

const specialHooks = {
  'present-simple': 'Представь расписание на стене: всё повторяется и работает по правилам. Это территория Present Simple.',
  'present-continuous': 'Включи прямую трансляцию: действие происходит прямо перед камерой или временно вокруг этого момента.',
  'present-perfect': 'Ты стоишь в настоящем и смотришь назад на результат. Когда именно это произошло — не главное.',
  'present-perfect-continuous': 'Это таймер, который запустили раньше: важен сам процесс и сколько он длится до настоящего.',
  'past-simple': 'Фото уже лежит в альбоме: событие завершено и осталось в конкретном прошлом.',
  'past-continuous': 'Камера показывает фон прошлого, а короткое событие неожиданно врывается в кадр.',
  'past-perfect': 'Режим детектива: одно событие уже случилось до другого события в прошлом.',
  'past-perfect-continuous': 'Следы показывают, что процесс долго шёл до прошлого момента и оставил заметный результат.',
  'future-simple': 'Ты принимаешь решение прямо сейчас, обещаешь или делаешь прогноз без готового плана.',
  'future-continuous': 'Перемести камеру в будущий момент: там действие уже будет находиться в процессе.',
  'future-perfect': 'Представь дедлайн и готовую галочку: к этому моменту результат уже будет достигнут.',
  'future-perfect-continuous': 'В будущем ты останавливаешь таймер и видишь, как долго действие продолжалось к этой точке.',
  'used-to': 'Открой старый фотоальбом: так было раньше регулярно, но сейчас жизнь уже изменилась.',
  'going-to': 'План уже лежит в кармане или доказательство видно глазами — поэтому используется going to.',
  'future-in-past': 'Герой находится в прошлом и смотрит в своё будущее: для него это ещё не произошло.',
  'narrative-tenses': 'Ты режиссёр: Continuous создаёт фон, Simple двигает сюжет, а Perfect показывает предысторию.',
  'sequence-of-tenses': 'Представь цепочку шестерёнок: прошлый глагол сообщения сдвигает последующие времена назад.',
  'reported-speech-advanced': 'Ты не цитируешь человека дословно, а пересказываешь смысл — время и структура меняют форму.',
  'unreal-past': 'Грамматическая машина времени: форма прошлого говорит не о времени, а о нереальности и сожалении.',
  'mixed-conditionals-time': 'Причина и результат живут в разных временах: прошлое изменяет настоящее или наоборот.',
  'advanced-passive-time': 'Камера направлена на результат действия, а исполнитель остаётся за кадром.',
};

const timelineFor = (module) => {
  if (module.id.includes('future') || module.name.startsWith('Future')) return 'СЕЙЧАС ─────────▶ БУДУЩЕЕ';
  if (module.id.includes('past') || module.name.startsWith('Past') || module.id === 'used-to') return 'ПРОШЛОЕ ───────▶ СЕЙЧАС';
  if (module.id.includes('perfect')) return 'РАНЬШЕ ━━━━━● РЕЗУЛЬТАТ';
  if (module.group === 'Advanced') return 'ПРОШЛОЕ ◀──●──▶ БУДУЩЕЕ';
  return 'ПРОШЛОЕ ───● СЕЙЧАС ───▶';
};

const mistakeFor = (module) => {
  if (module.id === 'present-simple') return 'После does не добавляй -s: Does she work? — не works.';
  if (module.id === 'past-simple') return 'После did используй начальную форму: Did you go? — не went.';
  if (module.id === 'present-perfect') return 'Не используй Present Perfect с yesterday, ago и законченным годом.';
  if (module.id === 'time-clauses') return 'После when, until и as soon as не ставь will в придаточной части.';
  if (module.id === 'used-to') return 'После did пиши use to, а не used to.';
  if (module.id === 'going-to') return 'Не забывай форму be: I am going to, she is going to.';
  if (module.id.includes('continuous')) return 'Continuous описывает процесс; глаголы состояния вроде know обычно в нём не используются.';
  if (module.id.includes('perfect')) return 'Сначала найди точку отсчёта: Perfect всегда связывает более раннее действие с результатом.';
  if (module.id.includes('reported') || module.id.includes('sequence')) return 'Не сдвигай время механически, если речь идёт об общеизвестном факте.';
  if (module.id.includes('conditional') || module.id === 'unreal-past') return 'Форма прошлого здесь может обозначать нереальность, а не реальное прошлое.';
  return 'Сначала определи время события и смысл, а уже потом выбирай форму глагола.';
};

const decisionFor = (module) => {
  if (module.name.includes('Contrast')) return `Сравни варианты по смыслу: ${module.use}. Не выбирай форму только из-за одного маркера — проверь, что говорящий хочет подчеркнуть.`;
  if (module.name.includes('Perfect Continuous')) return 'Задай два вопроса: начался ли процесс раньше и важна ли его длительность? Если да, нужна форма Perfect Continuous. Затем выбери have/has, had или will have по точке отсчёта.';
  if (module.name.includes('Perfect')) return 'Сначала найди более позднюю точку времени, затем спроси, какой результат уже будет готов к ней. Perfect показывает более раннее действие через его результат.';
  if (module.name.includes('Continuous')) return 'Представь кадр в конкретный момент. Если действие в этот момент находится в процессе, выбирай Continuous; если важен факт или завершённый результат, нужна другая форма.';
  if (module.id.includes('conditional') || module.id === 'unreal-past') return 'Определи, реальна ли ситуация и к какому времени относятся условие и результат. После этого отдельно построй обе части предложения по их формулам.';
  return `Определи время события, его характер и точку отсчёта. После этого примени формулу «${module.formula}» и ещё раз проверь смысл всего предложения.`;
};

const contrastFor = (module) => {
  if (module.name.startsWith('Present')) return 'Present Simple показывает факт или привычку; Continuous — процесс или временность; Perfect — связь прошлого результата с настоящим.';
  if (module.name.startsWith('Past')) return 'Past Simple двигает сюжет; Continuous создаёт фон; Past Perfect показывает, что произошло ещё раньше.';
  if (module.name.startsWith('Future')) return 'Will часто выражает решение или прогноз; going to — намерение или видимый признак; Continuous — будущий процесс; Perfect — результат к сроку.';
  if (module.id.includes('reported') || module.id.includes('sequence')) return 'В прямой речи сохраняются слова говорящего, а в косвенной меняются местоимения, указатели времени и часто происходит сдвиг времён.';
  return `Сравни эту конструкцию с соседними временами: здесь главный смысл — «${module.use.toLowerCase()}». Если смысл другой, одной похожей формы недостаточно.`;
};

export const getTenseGuide = (module) => {
  const isPerfect = module.name.includes('Perfect');
  const isContinuous = module.name.includes('Continuous');
  const hook = specialHooks[module.id]
    || (module.name.includes('Contrast') ? 'Два похожих времени соревнуются за место в предложении. Победителя определяет смысл, а не одно слово-маркер.'
      : isPerfect && isContinuous ? 'Соедини таймер и точку результата: процесс начался раньше и длился до важного момента.'
        : isPerfect ? 'Ищи связь двух точек времени: более раннее действие создаёт результат в более поздней точке.'
          : isContinuous ? 'Представь видеозапись вместо фотографии: важно увидеть действие в процессе.'
            : 'Нарисуй событие на временной линии — правильная форма станет гораздо очевиднее.');
  return {
    hook,
    timeline: timelineFor(module),
    forms: formPatterns[module.id] || [`1️⃣ Найди точку времени`, `2️⃣ Примени схему: ${module.formula}`, '3️⃣ Проверь смысл и вспомогательный глагол'],
    mistake: mistakeFor(module),
    decision: decisionFor(module),
    contrast: contrastFor(module),
  };
};
