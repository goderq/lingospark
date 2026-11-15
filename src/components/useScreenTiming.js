import {useEffect,useRef} from 'react';
import {now,recordTiming} from '../utils/performance';
export default function useScreenTiming(name){
  const start=useRef(now());
  useEffect(()=>{const frame=requestAnimationFrame(()=>recordTiming(name,now()-start.current));return()=>cancelAnimationFrame(frame);},[name]);
}
