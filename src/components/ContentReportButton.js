import React,{useEffect,useState} from 'react';
import {Alert,Pressable,Text,View} from 'react-native';
import {useProgress} from '../store/ProgressContext';
import {reportReasons} from '../utils/contentQuality';
import {colors, useTheme } from '../theme';
export default function ContentReportButton({item,context={}}){
  useTheme();
  const {reportContentIssue}=useProgress();
  const [open,setOpen]=useState(false);
  useEffect(()=>setOpen(false),[item.id,item.prompt]);
  return <View style={{marginVertical:8}}>
    <Pressable onPress={(event)=>{event.stopPropagation();setOpen((value)=>!value);}} style={{padding:10}}><Text style={{color:colors.textMuted,fontSize:12}}>⚑ Ошибка в задании</Text></Pressable>
    {open&&<View style={{gap:8}}><Text style={{color:colors.textMuted,fontSize:11}}>Вопрос сохранится в диагностике. Автоматической отправки разработчику нет.</Text>{reportReasons.map((reason)=><Pressable key={reason} style={{backgroundColor:colors.cardLight,padding:12,borderRadius:12}} onPress={(event)=>{event.stopPropagation();reportContentIssue(item,context,reason);setOpen(false);Alert.alert('Сохранено','Запись доступна в «Профиль → Диагностика».');}}><Text style={{color:colors.text,fontSize:12}}>{reason}</Text></Pressable>)}</View>}
  </View>;
}
