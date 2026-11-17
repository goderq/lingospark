import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenFrame({ children, style, transitionKey, ...props }) {
  return <SafeAreaView {...props} style={style}><ScreenEntrance transitionKey={transitionKey} style={{ flex: 1 }}>{children}</ScreenEntrance></SafeAreaView>;
}

export function ScreenEntrance({ children, transitionKey, style }) {
  const { reduceMotion } = useTheme();
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    value.stopAnimation();
    if (reduceMotion) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [transitionKey, reduceMotion]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>{children}</Animated.View>;
}

export function MotionPressable({ children, style, containerStyle, disabled, onPress, ...props }) {
  const { reduceMotion } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = toValue => { scale.stopAnimation(); if (reduceMotion) scale.setValue(1); else Animated.spring(scale, { toValue, speed: 35, bounciness: 2, useNativeDriver: true }).start(); };
  useEffect(() => () => scale.stopAnimation(), [scale]);
  return <Animated.View style={[containerStyle, { transform: [{ scale }] }]}><Pressable {...props} disabled={disabled} onPress={onPress} onPressIn={() => animate(0.975)} onPressOut={() => animate(1)} style={style}>{children}</Pressable></Animated.View>;
}
