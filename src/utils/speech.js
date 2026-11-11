import * as Speech from "expo-speech";

let requestId = 0;
let warmupStarted = false;

// Load iOS voices and initialize AVSpeechSynthesizer before the first visible
// tap. The silent utterance avoids the several-second cold start on iPhone.
export async function warmSpeech() {
  if (warmupStarted) return;
  warmupStarted = true;
  const warmupRequest = requestId;
  try {
    await Speech.getAvailableVoicesAsync();
    if (warmupRequest !== requestId) return;
    Speech.speak(".", {
      language: "en-US",
      rate: 1,
      volume: 0,
    });
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
