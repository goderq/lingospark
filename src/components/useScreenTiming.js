import { useTheme } from '../theme';
import {useEffect,useRef} from 'react';
import {now,recordTiming,finishScreenTransition} from '../utils/performance';
export default function useScreenTiming(name){
  const start=useRef(now());
  useEffect(()=>{const frame=requestAnimationFrame(()=>{recordTiming(name,now()-start.current);finishScreenTransition(name);});return()=>cancelAnimationFrame(frame);},[name]);
}
