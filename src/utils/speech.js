import * as Speech from "expo-speech";

let requestId = 0;
let warmupStarted = false;

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
  try {
    await Speech.stop();
  } catch {}
  if (currentRequest !== requestId) return false;
  Speech.speak(text, options);
  return true;
}

export async function stopSpeech() {
  requestId += 1;
  try {
    await Speech.stop();
  } catch {}
}
