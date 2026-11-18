import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenFrame({ children, style, transitionKey, ...props }) {
  return <SafeAreaView {...props} style={style}><ScreenEntrance transitionKey={transitionKey} style={{ flex: 1 }}>{children}</ScreenEntrance></SafeAreaView>;
}

export function ScreenEntrance({ children, transitionKey, style }) {
  const { reduceMotion } = useTheme();
  const value = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const previous = useRef({ mounted: false, key: null });
  useLayoutEffect(() => {
    const changed = !previous.current.mounted || previous.current.key !== transitionKey;
    previous.current = { mounted: true, key: transitionKey };
    if (reduceMotion) { value.stopAnimation(); value.setValue(1); return; }
    if (!changed) return;
    value.stopAnimation();
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [transitionKey, reduceMotion]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }] }]}>{children}</Animated.View>;
}

export function MotionPressable({ children, style, containerStyle, disabled, onPress, onPressIn, onPressOut, ...props }) {
  const { reduceMotion } = useTheme();
  const pressure = useRef(new Animated.Value(0)).current;
  const animate = toValue => {
    pressure.stopAnimation();
    if (reduceMotion || disabled) { pressure.setValue(0); return; }
    const options = { toValue, useNativeDriver: true };
    const animation = toValue ? Animated.timing(pressure, { ...options, duration: 90, easing: Easing.out(Easing.cubic) }) : Animated.spring(pressure, { ...options, stiffness: 340, damping: 27, mass: 0.7, overshootClamping: true });
    animation.start();
  };
  useEffect(() => { if (reduceMotion || disabled) { pressure.stopAnimation(); pressure.setValue(0); } return () => pressure.stopAnimation(); }, [pressure, reduceMotion, disabled]);
  return <Animated.View style={[containerStyle, { opacity: pressure.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }), transform: [{ scale: pressure.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }, { translateY: pressure.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }] }]}><Pressable {...props} disabled={disabled} onPress={onPress} onPressIn={event => { animate(1); onPressIn?.(event); }} onPressOut={event => { animate(0); onPressOut?.(event); }} style={style}>{children}</Pressable></Animated.View>;
}
