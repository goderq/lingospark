const q = (prompt, answer, wrong, explanation) => ({ prompt, options: [answer, ...wrong], answer, explanation });
const make = (id, title, level, emoji, color, hook, formula, rows) => ({ id, title, level, emoji, color, hook, formula, exercises: rows.map((row) => q(...row)) });

export const extraGrammarTracks = [
  make('word-order','Порядок слов','A1–B2','🧱','#36B8D9','Английская фраза похожа на поезд: у каждого вагона своё место.','subject + verb + object + place + time',[
    ['Choose the correct sentence.','I often read on the train.',['I read often on the train.','Often I on the train read.'],'Наречие частоты обычно стоит перед смысловым глаголом.'],
    ['She ___ late for work.','is never',['never is','does never be'],'С глаголом be наречие ставится после него.'],
    ['Put the words in order: yesterday / him / I / saw','I saw him yesterday.',['I him saw yesterday.','Yesterday I him saw.'],'Дополнение идёт после глагола, время — обычно в конце.'],
    ['Choose the natural order.','We met at the café after work.',['We after work met at the café.','At the café after work we met usually.'],'Место обычно предшествует времени.'],
    ['Only then ___ the truth.','did I understand',['I understood','understood I'],'После only then нужна инверсия.'],
    ['Not only ___, but she also apologized.','did she explain',['she explained','she did explained'],'Not only в начале вызывает инверсию.'],
  ]),
  make('questions','Вопросы без ошибок','A1–C1','❓','#7C5CFC','Вопрос — это переключатель: вспомогательный глагол выходит вперёд.','question word + auxiliary + subject + verb',[
    ['___ you work here?','Do',['Are','Does'],'С обычным глаголом и you нужен do.'],['Where ___ she born?','was',['did','has'],'В пассивной конструкции born используется be.'],
    ['How long ___ you known him?','have',['do','are'],'How long + состояние до настоящего — Present Perfect.'],['Who ___ the window?','broke',['did break','was break'],'Если who — подлежащее, do не нужен.'],
    ['Could you tell me where ___.','the station is',['is the station','does the station be'],'В косвенном вопросе прямой порядок слов.'],['What do you suppose ___ next?','will happen',['will it happen','does happen'],'После вводной части сохраняется порядок утверждения.'],
  ]),
  make('comparisons','Сравнения','A1–C1','📏','#FF9F43','Сравнение помогает не просто назвать качество, а точно измерить разницу.','-er / more · as...as · by far',[
    ['This route is ___ than the other one.','shorter',['more short','the shortest'],'Короткое прилагательное получает -er.'],['The task was ___ than expected.','more complicated',['complicater','most complicated'],'Длинные прилагательные используют more.'],
    ['My office is not ___ yours.','as quiet as',['so quieter than','as quiet than'],'Равенство: as + adjective + as.'],['The sooner we leave, ___.','the earlier we will arrive',['we arrive earlier','the most early'],'Парная конструкция the...the показывает зависимость.'],
    ['It is ___ the best option.','by far',['very far','more far'],'By far усиливает превосходную степень.'],['The results were all the more impressive ___ the limited budget.','given',['although','despite of'],'Given вводит обстоятельство, усиливающее оценку.'],
  ]),
  make('relative-clauses','Относительные предложения','A2–C1','🔗','#2ED3B7','Who, which и that прикрепляют уточнение к нужному слову.','person who · thing which · whose · whereby',[
    ['The woman ___ called is my manager.','who',['which','whose'],'Who относится к человеку.'],['This is the book ___ I told you about.','that',['who','whose'],'That может относиться к предмету в defining clause.'],
    ['My colleague, ___ lives in Leeds, works remotely.','who',['that','what'],'В уточняющем обороте с запятыми that не используется.'],['The company ___ products we tested is local.','whose',['which','who'],'Whose выражает принадлежность.'],
    ['The reason ___ he left remains unclear.','why',['which','what'],'The reason why — причина.'],['They created a system ___ complaints are resolved within a day.','whereby',['whoever','whereas'],'Whereby означает «посредством которого».'],
  ]),
  make('reported-speech','Косвенная речь','B1–C1','💬','#FF5C8A','Пересказывая слова, мы сдвигаем точку наблюдения назад.','said (that) · asked if · told me to',[
    ['“I am tired.” She said she ___ tired.','was',['is always','has been yesterday'],'При пересказе am обычно сдвигается в was.'],['“I will call.” He said he ___ call.','would',['will','should have'],'Will меняется на would.'],
    ['“Do you agree?” She asked ___ I agreed.','whether',['that','what'],'Общий вопрос вводится if/whether.'],['“Please wait.” He asked me ___.','to wait',['wait','waiting'],'Просьба: ask + object + to-infinitive.'],
    ['“Don’t touch it.” She warned us ___.','not to touch it',['to not touching it','do not touch it'],'Отрицательная команда: not to + verb.'],['The minister is reported ___ the proposal.','to have rejected',['rejecting yesterday','that rejected'],'Perfect infinitive показывает более раннее действие.'],
  ]),
  make('quantifiers','Количество точно','A2–C1','🧮','#36B8D9','Much, many и few показывают не только число, но и отношение говорящего.','much/many · few/a few · little/a little',[
    ['How ___ time do we have?','much',['many','few'],'Time неисчисляемое.'],['There are only ___ seats left.','a few',['a little','much'],'Seats исчисляемое; a few — несколько.'],
    ['We have ___ information, so we cannot decide.','little',['few','a little enough'],'Little подчёркивает недостаток.'],['___ of the answers was correct.','None',['No one answers','Neither of three'],'None of используется с группой более двух.'],
    ['A large ___ of research supports the claim.','body',['number','many'],'Устойчивое сочетание a body of research.'],['There is ___ evidence to justify the change.','insufficient',['fewer','several'],'Evidence неисчисляемое; insufficient — недостаточно.'],
  ]),
  make('determiners','Указатели и принадлежность','A1–B2','👉','#7C5CFC','Determiners работают как ярлыки: показывают, чей объект и какой именно.','this/that · each/every · either/neither',[
    ['___ book here is mine.','This',['These','Those'],'Для близкого предмета в единственном числе — this.'],['___ student received a certificate.','Every',['All student','Much'],'Every + существительное в единственном числе.'],
    ['You may choose ___ option.','either',['neither of one','every of'],'Either — любой из двух.'],['___ answer is acceptable.','Neither',['None two','Either not'],'Neither — ни один из двух.'],
    ['The two proposals differ from ___ other.','each',['one another one','every'],'Для двух участников обычно each other.'],['We need to assess the plan on ___ merits.','its own',['it is','their own singular'],'Its own подчёркивает индивидуальные достоинства.'],
  ]),
  make('causative','Have/Get something done','B1–C1','🛠️','#FF9F43','Вы организуете действие, но выполняет его другой человек.','have/get + object + V3',[
    ['I ___ my hair cut yesterday.','had',['did','made'],'Had + object + V3 — услугу выполнил кто-то другой.'],['We need to get the printer ___.','repaired',['repair','repairing us'],'Get + object + V3.'],
    ['She had the assistant ___ the files.','organize',['organized','to organized'],'Have + person + bare infinitive.'],['They got him ___ the form again.','to complete',['complete without to','completed'],'Get + person + to-infinitive.'],
    ['I must have this issue ___ immediately.','resolved',['resolve','resolving'],'После object нужна третья форма.'],['The policy got everyone ___.','talking',['to talked','talked by'],'Get + person + -ing может означать запуск действия.'],
  ]),
  make('participle-clauses','Причастные обороты','B2–C1','✂️','#2ED3B7','Причастие сжимает две мысли в одну точную и плавную фразу.','doing · having done · given',[
    ['___ down the street, I saw an old friend.','Walking',['Walked','Having walk'],'Одновременное активное действие — V-ing.'],['___ the report, she sent it to the client.','Having finished',['Finishing before','Finished she'],'Having + V3 подчёркивает предшествование.'],
    ['___ by the news, he remained silent.','Shocked',['Shocking','Having shock'],'V3 описывает пассивное состояние.'],['___ enough time, we could improve it.','Given',['Giving us','Gave'],'Given означает «при условии наличия».'],
    ['Not ___ what to say, she paused.','knowing',['known','to knowing'],'Отрицание ставится перед participle.'],['___ otherwise, all figures refer to 2025.','Unless stated',['Unless stating','If not state'],'Формальный сокращённый пассивный оборот.'],
  ]),
  make('noun-clauses','Придаточные-существительные','B1–C1','📦','#FF5C8A','Целая мысль может занять место существительного: быть фактом, причиной или вопросом.','that · whether · what · whoever',[
    ['___ he said surprised everyone.','What',['That what','Which'],'What = the thing that.'],['I do not know ___ she will attend.','whether',['that','what'],'Whether вводит косвенный общий вопрос.'],
    ['The fact ___ he apologized matters.','that',['what','whether of'],'После the fact используется that.'],['Choose ___ option suits you best.','whichever',['whatever of','that which one'],'Whichever — любой из ограниченного набора.'],
    ['___ caused the failure remains uncertain.','What',['That','Which it'],'What-clause выступает подлежащим.'],['It is essential that every applicant ___ informed.','be',['is always','will be'],'Формальный subjunctive: начальная форма be.'],
  ]),
  make('agreement','Согласование','A2–C1','🤝','#36B8D9','Глагол ориентируется на настоящее подлежащее, а не на ближайшее слово.','subject ↔ singular/plural verb',[
    ['The list of items ___ on the desk.','is',['are','be'],'Подлежащее list, а не items.'],['Neither answer ___ correct.','is',['are','were plural'],'Neither в формальном стиле единственное.'],
    ['A number of students ___ absent.','are',['is','has'],'A number of + plural требует are.'],['The number of students ___ increasing.','is',['are','have'],'The number — единственное.'],
    ['News ___ quickly online.','travels',['travel','are travelling always'],'News грамматически единственное.'],['What we need ___ clearer priorities.','is',['are','have been plural'],'What-clause рассматривается как единое целое.'],
  ]),
  make('inversion','Инверсия и акцент','B2–C1','🔄','#7C5CFC','Переставьте вспомогательный глагол — и фраза зазвучит сильнее и формальнее.','Never have I · Only then did · So do I',[
    ['Never ___ such a view.','have I seen',['I have seen','did I saw'],'После never нужна инверсия.'],['Only after the call ___ the problem.','did we understand',['we understood','we did understood'],'Only + обстоятельство в начале вызывает инверсию.'],
    ['No sooner had we left ___ it started raining.','than',['when','then'],'No sooner...than.'],['So difficult ___ that many gave up.','was the task',['the task was','did the task'],'So + adjective в начале допускает инверсию.'],
    ['Should you ___ help, call this number.','need',['needed','will need'],'Should-инверсия заменяет if.'],['Under no circumstances ___ shared.','should this password be',['this password should','should be this password'],'После отрицательного оборота — auxiliary + subject.'],
  ]),
  make('linking','Связки и логика','B1–C1','🧭','#FF9F43','Связки показывают читателю маршрут между аргументами.','however · therefore · whereas · nevertheless',[
    ['The price is high; ___, the quality is excellent.','however',['therefore','because'],'However вводит контраст.'],['The road was closed; ___, we took another route.','therefore',['whereas','nevertheless because'],'Therefore показывает следствие.'],
    ['Tom works remotely, ___ Mia goes to the office.','whereas',['despite','therefore'],'Whereas сопоставляет две части.'],['___ being tired, she continued.','Despite',['Although of','However'],'Despite + gerund/noun.'],
    ['The evidence is limited. ___, the trend is clear.','Nevertheless',['Consequently because','Whereas'],'Nevertheless — контраст с предыдущим ограничением.'],['___ the proposal is ambitious, it remains achievable.','While',['Despite','Nevertheless of'],'While может вводить уступку.'],
  ]),
  make('formal-style','Формальный стиль C1','C1','🎓','#2ED3B7','Продвинутый стиль — это точность и дистанция, а не просто длинные слова.','nominalisation · hedging · impersonal structures',[
    ['Choose the formal version.','The implementation of the policy led to improvement.',['They put the policy in and things got better.','Policy did good stuff.'],'Номинализация делает формальный текст компактнее.'],['The results ___ indicate a correlation.','appear to',['totally prove','obviously show for sure'],'Appear to смягчает утверждение.'],
    ['It ___ that further research is required.','could be argued',['argues itself','is arguing obvious'],'Безличная конструкция поддерживает академический тон.'],['The change had ___ impact on demand.','a significant',['a really big','tons of'],'Significant — точная формальная лексика.'],
    ['___ the limitations, the study remains valuable.','Notwithstanding',['Even with of','But despite of'],'Notwithstanding — формальный эквивалент despite.'],['This explanation is ___ consistent with the evidence.','broadly',['bigly','all totally'],'Broadly позволяет аккуратно ограничить вывод.'],
  ]),
];
