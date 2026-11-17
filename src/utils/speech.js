import * as Speech from "expo-speech";
import {now,recordTiming} from './performance';

let requestId = 0;
let warmupStarted = false;
let active = false;

// Only query the voice list during warm-up. Calling Speech.speak with a silent
// utterance during app launch can raise an Objective-C exception on newer iOS
// beta releases. Native exceptions bypass JavaScript try/catch and terminate
// the entire process, so actual playback must only follow a user action.
export async function warmSpeech() {
  if (warmupStarted) return;
  warmupStarted = true;
  try {
    await Speech.getAvailableVoicesAsync();
  } catch {
    warmupStarted = false;
  }
}

// expo-speech queues every utterance by default. For learning controls that
// feels like lag, so a new tap cancels speech and starts only the latest text.
export async function speak(text, options = {}) {
  if (!text?.trim()) return false;
  const currentRequest = ++requestId;
  const tapped=now();
  if(active){const stopping=now();try { await Speech.stop(); } catch {}recordTiming('speech_stop',now()-stopping);}
  if (currentRequest !== requestId) return false;
  active=true;
  const finish=(callback)=>(...args)=>{if(currentRequest===requestId)active=false;callback?.(...args);};
  try{
    const dispatched=now();recordTiming('speech_prepare',dispatched-tapped);
    Speech.speak(text, {...options,onStart:()=>{if(currentRequest===requestId){recordTiming('speech_start',now()-tapped);recordTiming('speech_native_start',now()-dispatched);}options.onStart?.();},onDone:finish(options.onDone),onStopped:finish(options.onStopped),onError:finish(options.onError)});
  }catch(error){if(currentRequest===requestId)active=false;options.onError?.(error);return false;}
  return true;
}

export async function stopSpeech() {
  requestId += 1;
  active=false;
  try {
    await Speech.stop();
  } catch {}
}
