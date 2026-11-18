import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import { keyboardOverlap } from '../utils/keyboardLayout';

export default function useKeyboardDock() {
  const ref = useRef(null), frame = useRef(null);
  const [layout, setLayout] = useState({ visible: false, inset: 0 });
  const measure = useCallback(() => {
    ref.current?.measureInWindow?.((x, y, width, height) => {
      const inset = keyboardOverlap({ x, y, width, height }, frame.current);
      setLayout(old => old.inset === inset ? old : { ...old, inset });
    });
  }, []);
  useEffect(() => {
    const update = event => {
      if (Number.isFinite(event.duration)) Keyboard.scheduleLayoutAnimation?.(event);
      const visible = (event.endCoordinates?.height || 0) > 0 && (Platform.OS !== 'ios' || event.endCoordinates.screenY < Dimensions.get('window').height);
      if (!visible) { frame.current = null; setLayout({ visible: false, inset: 0 }); return; }
      frame.current = event.endCoordinates;
      setLayout(old => ({ ...old, visible }));
      measure();
    };
    const hide = event => { if (Number.isFinite(event?.duration)) Keyboard.scheduleLayoutAnimation?.(event); frame.current = null; setLayout({ visible: false, inset: 0 }); };
    const subscriptions = [Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow', update), Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', hide)];
    const metrics = Keyboard.metrics?.();
    if (metrics) update({ endCoordinates: metrics });
    return () => subscriptions.forEach(subscription => subscription.remove());
  }, [measure]);
  return { ref, onLayout: measure, visible: layout.visible, inset: layout.inset };
}
