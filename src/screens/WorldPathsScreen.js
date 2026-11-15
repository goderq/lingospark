import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Keyboard,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useProgress} from '../store/ProgressContext';
import {colors} from '../theme';
import {PrimaryButton,ProgressBar} from '../components/UI';
import {balancedOptions} from '../utils/shuffle';
import {gradeAnswer} from '../utils/answer';
import {lifePaths,pathProgress,pathQuestions,rentalListings,rentalBudget,rentalInitialCost,rentalQuestions} from '../data/worldPaths';

export default function WorldPathsScreen({onClose}){
  const {progress,saveWorldPathDraft,completeWorldPathChapter,completeWorldRental,restartWorldLifePath}=useProgress();
  const world=progress.world || {};
  const [activity,setActivity]=useState(null);
  const [seed]=useState(()=>Date.now());
  const path=lifePaths.find((entry)=>entry.id===activity?.pathId);
  const chapter=path?.chapters.find((entry)=>entry.id===activity?.chapterId);
  const listing=rentalListings.find((entry)=>entry.id===activity?.listingId);
  const questions=useMemo(()=>activity?.mode==='path' && path && chapter ? pathQuestions(world,path,chapter) : listing ? rentalQuestions(listing) : [],[activity?.mode,path,chapter,listing,world.lifePaths]);
  const question=questions[activity?.index || 0];
  const options=useMemo(()=>question?.type==='choice'?balancedOptions(question.options,question.answer,activity?.index || 0,seed):[],[question,activity?.index,seed]);
  useEffect(()=>{
    if(activity && activity.step!=='result')saveWorldPathDraft(activity);
  },[activity,saveWorldPathDraft]);
  const update=(changes)=>setActivity((current)=>({...current,...changes}));
  const start=(mode,extra={})=>setActivity({mode,step:mode==='rental'?'listing':'questions',index:0,lives:3,answer:'',checked:false,correct:false,...extra});
  const next=()=>{
    if(activity.lives===0){update({step:'failed'});return;}
    if(!activity.correct){update({answer:'',checked:false});return;}
    if(activity.index+1===questions.length)update({step:'decision',answer:'',checked:false});
    else update({index:activity.index+1,answer:'',checked:false});
  };
  const submit=(answer)=>{
    if(activity.checked)return;
    Keyboard.dismiss();
    const correct=question.type==='choice'?answer===question.answer:gradeAnswer(answer,[question.answer,...(question.answers || [])]).status==='correct';
    update({answer,checked:true,correct,lives:activity.lives-(correct?0:1)});
  };
  const resume=()=>{
    const saved=world.pathDraft;
    if(!saved || !['path','rental'].includes(saved.mode) || !Number.isInteger(saved.lives) || saved.lives<0 || saved.lives>3)return;
    if(saved.mode==='path'){
      const p=lifePaths.find((entry)=>entry.id===saved.pathId),c=p?.chapters.find((entry)=>entry.id===saved.chapterId);
      if(!c || pathProgress(world,p).completed.includes(c.id))return;
      const qs=pathQuestions(world,p,c);
      if(!Number.isInteger(saved.index)||saved.index<0||saved.index>=qs.length)return;
    }else if(saved.step!=='listing' && !rentalListings.some((entry)=>entry.id===saved.listingId))return;
    setActivity(saved);
  };
  const result=activity?.mode==='rental'?world.rental?.outcome:pathProgress(world,path || lifePaths[0]).decisions?.[chapter?.id]?.outcome;
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==='ios'?'padding':undefined}>
    <View style={s.header}>
      <Pressable style={s.back} onPress={()=>activity?setActivity(null):onClose()}><Ionicons name="chevron-back" size={24} color="white" /></Pressable>
      <Text style={s.headerText}>{activity ? (path?.title || 'Поиск жилья') : 'Твой жизненный путь'}</Text>
      <Text style={s.muted}>{activity && activity.step==='questions'?`♥ ${activity.lives}`:''}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={s.content}>
      {!activity && <>
        <Text style={s.title}>Чего ты хочешь добиться?</Text>
        <Text style={s.text}>Пути доступны параллельно основной истории. Можно пройти каждый; решения и финалы сохраняются отдельно.</Text>
        {!!world.pathDraft && <PrimaryButton title="Продолжить побочную историю" onPress={resume} />}
        {lifePaths.map((item)=>{
          const state=pathProgress(world,item);
          return <View key={item.id} style={s.card}>
            <Text style={s.heading}>{item.emoji} {item.title}</Text><Text style={s.text}>{item.description} · B1–C1</Text>
            <ProgressBar value={state.completed.length/item.chapters.length} color={colors.mint}/>
            {item.chapters.map((entry,index)=>{
              const done=state.completed.includes(entry.id),open=item.chapters.slice(0,index).every((earlier)=>state.completed.includes(earlier.id));
              return <Pressable key={entry.id} disabled={!open||done} onPress={()=>start('path',{pathId:item.id,chapterId:entry.id})} style={[s.option,(!open||done)&&s.dim]}><Text style={s.optionText}>{done?'✓':open?'▶':'🔒'} {entry.title}</Text>{!!state.decisions[entry.id]&&<Text style={s.muted}>{state.decisions[entry.id].title}</Text>}</Pressable>;
            })}
            {!!state.ending&&<Text style={s.success}>{state.ending}</Text>}
            {!!state.endings?.length&&<Text style={s.muted}>Открыто финалов: {state.endings.length} / 2</Text>}
            {!!state.ending&&<PrimaryButton title="Пройти путь иначе" color={colors.cardLight} onPress={()=>Alert.alert('Начать этот путь заново?','Открытые финалы останутся в коллекции. Решения текущего прохождения этого пути будут сброшены. Основная история и другие пути сохранятся.',[{text:'Отмена',style:'cancel'},{text:'Начать заново',onPress:()=>restartWorldLifePath(item.id)}])}/>}
          </View>;
        })}
        <View style={s.card}><Text style={s.heading}>🏠 Снять жильё</Text><Text style={s.text}>Объявления → расчёт → сообщение хозяину → условия. Учебный бюджет заселения: £{rentalBudget}; деньги из игрового кошелька не списываются.</Text>{world.rental?.completed?<><Text style={s.success}>{rentalListings.find((entry)=>entry.id===world.rental.listingId)?.title} · £{world.rental.monthly}/мес.</Text><Text style={s.text}>{world.rental.outcome}</Text></>:<PrimaryButton title="Найти свой вариант" onPress={()=>start('rental')} />}</View>
      </>}
      {activity?.step==='listing' && <>
        <Text style={s.title}>Выбери подходящее жильё</Text><Text style={s.text}>У тебя £{rentalBudget} на первый месяц, залог и первые коммунальные платежи. Дорога, приватность и стоимость — твои предпочтения. За выбор объявления жизни не снимаются.</Text>
        {rentalListings.map((entry)=><View key={entry.id} style={s.card}><Text style={s.heading}>{entry.title}</Text><Text style={s.document}>{entry.text}</Text><PrimaryButton title="Обсудить этот вариант" disabled={rentalInitialCost(entry)>rentalBudget} onPress={()=>update({listingId:entry.id,step:'questions'})} /></View>)}
      </>}
      {activity?.step==='questions' && question && <>
        <Text style={s.eyebrow}>ЗАДАНИЕ {activity.index+1} / {questions.length}</Text>
        <Text style={s.title}>{chapter?.title || listing?.title}</Text>
        {!!chapter&&<View style={s.card}><Text style={s.heading}>{chapter.speaker}</Text><Text style={s.document}>{chapter.line}</Text>{Object.values(pathProgress(world,path).decisions).map((choice)=><Text key={choice.id} style={s.muted}>Ранее: {choice.outcome}</Text>)}</View>}
        {!!listing&&<Text style={s.document}>{listing.text}</Text>}
        <Text style={s.heading}>{question.prompt}</Text>
        {question.type==='input'?<><TextInput style={s.input} multiline editable={!activity.checked} autoCapitalize="sentences" value={activity.answer} onChangeText={(answer)=>update({answer})} placeholder="Напиши хозяину по-английски" placeholderTextColor={colors.textMuted}/>{!activity.checked&&<PrimaryButton title="Отправить сообщение" disabled={!activity.answer.trim()} onPress={()=>submit(activity.answer)}/>}</>:options.map((option)=><Pressable key={option} disabled={activity.checked} onPress={()=>submit(option)} style={[s.option,activity.checked&&option===question.answer&&s.correct]}><Text style={s.optionText}>{option}</Text></Pressable>)}
        {activity.checked&&<View style={s.card}><Text style={activity.correct?s.success:s.error}>{activity.correct?'Верно':`Не засчитано. Ответ: ${question.answer}`}</Text><Text style={s.text}>{question.explanation}</Text><PrimaryButton title={activity.lives===0?'Завершить попытку':activity.correct?'Дальше':'Попробовать ещё раз'} onPress={next}/></View>}
      </>}
      {activity?.step==='decision'&&<>
        <Text style={s.title}>Как поступишь ты?</Text><Text style={s.text}>Все реплики здесь корректны. Это сюжетное решение: оно не оценивается как ответ по английскому.</Text>
        {(chapter?.decisions || [{id:'inventory',title:'Зафиксировать состояние',text:'Could we make an inventory and record the condition before I move in?'},{id:'repair',title:'Сначала устранить неполадки',text:'Could you fix the reported issues before I move in?'}]).map((choice)=><Pressable key={choice.id} style={s.option} onPress={()=>{
          if(chapter)completeWorldPathChapter(path.id,chapter.id,choice.id);
          else completeWorldRental(listing.id,choice.id);
          update({step:'result'});
        }}><Text style={s.heading}>{choice.title}</Text><Text style={s.document}>{choice.text}</Text></Pressable>)}
      </>}
      {activity?.step==='result'&&<View style={s.card}><Text style={s.title}>Решение сохранено</Text><Text style={s.success}>{result}</Text>{!!listing&&<Text style={s.text}>На заселение: £{rentalInitialCost(listing)}. Дальше ежемесячно: £{listing.rent+listing.bills}. Залог учтён только один раз.</Text>}<PrimaryButton title="К жизненным путям" onPress={()=>setActivity(null)}/></View>}
      {activity?.step==='failed'&&<View style={s.card}><Text style={s.title}>Нужна ещё практика</Text><Text style={s.text}>Закончились три жизни. Твои прежние решения и завершённые главы остаются сохранёнными.</Text><PrimaryButton title="Повторить эту главу" onPress={()=>start(activity.mode,{pathId:activity.pathId,chapterId:activity.chapterId,...(listing?{listingId:listing.id,step:'questions'}:{})})}/><PrimaryButton title="Вернуться к путям" onPress={()=>setActivity(null)} color={colors.cardLight}/></View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const s=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},header:{height:62,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:12},back:{width:42,height:42,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.card},headerText:{flex:1,color:'white',fontSize:18,fontWeight:'900'},content:{padding:20,paddingBottom:50,gap:16},title:{color:'white',fontSize:27,fontWeight:'900'},heading:{color:'white',fontSize:17,fontWeight:'800',lineHeight:24},text:{color:colors.textMuted,fontSize:14,lineHeight:22},muted:{color:colors.textMuted,fontSize:11,lineHeight:18},card:{backgroundColor:colors.card,padding:18,borderRadius:22,gap:12,borderWidth:1,borderColor:colors.border},document:{color:'white',fontSize:15,lineHeight:24},option:{padding:16,borderRadius:17,borderWidth:1,borderColor:colors.border,backgroundColor:colors.cardLight,gap:8},optionText:{color:'white',fontSize:15,lineHeight:22},dim:{opacity:.55},correct:{borderColor:colors.mint},success:{color:colors.mint,fontSize:15,lineHeight:23},error:{color:colors.orange,fontSize:15,lineHeight:23},eyebrow:{color:colors.purple,fontSize:11,fontWeight:'900',letterSpacing:1},input:{minHeight:105,color:'white',backgroundColor:colors.card,borderRadius:18,padding:16,fontSize:17,textAlignVertical:'top'}});
