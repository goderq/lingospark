import { AppState } from 'react-native';
import { createResourceGate } from '../utils/resourceGate';
import { now, recordTiming } from '../utils/performance';

const gate = createResourceGate();
AppState.addEventListener('change', state => { if (state !== 'active') gate.releaseAll().catch(() => {}); });
export const registerResource = (kind, release, cancel) => gate.register(kind, release, cancel);
export const releaseNativeResources = () => gate.releaseAll();
export const releaseNativeResource = kind => gate.release(kind);
export const nativeResourceState = () => gate.state();
export const withNativeResource = (kind, task) => {
  const requested = now();
  return gate.run(kind, async () => {
    recordTiming('native_queue_wait', now() - requested);
    if (AppState.currentState === 'background' || AppState.currentState === 'inactive') throw new Error('Вернись в приложение, чтобы продолжить работу локальной модели.');
    return task();
  });
};
