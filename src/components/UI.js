import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';
import { MotionPressable } from './Motion';
import { foregroundFor } from '../design/palettes';

export function PrimaryButton({ title, onPress, color = colors.purple, disabled = false, icon }) {
  useTheme();
  const surface = [colors.card, colors.cardLight, colors.background].includes(color);
  const fill = color === colors.purple ? colors.accentFill : color;
  const foreground = surface ? colors.text : foregroundFor(fill);
  return <MotionPressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: fill, opacity: disabled ? 0.45 : 1, borderWidth: surface ? 1 : 0, borderColor: colors.border }]}>
    {icon && <Ionicons name={icon} size={20} color={foreground} />}
    <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
  </MotionPressable>;
}
export function XPBadge({ xp }) {
  useTheme();
  return <View style={styles.xpBadge}><Ionicons name="flash" size={12} color={colors.orange} /><Text style={styles.xpText}>{xp} XP</Text></View>;
}
export function ProgressBar({ value, color = colors.purple, height = 8 }) {
  const { reduceMotion } = useTheme();
  const bounded = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const progress = useRef(new Animated.Value(bounded)).current;
  useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) { progress.setValue(bounded); return; }
    const animation = Animated.timing(progress, { toValue: bounded, duration: 300, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [bounded, reduceMotion]);
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(bounded * 100) }} style={[styles.track, { height }]}><Animated.View style={[styles.fill, { backgroundColor: color, transformOrigin: 'left center', transform: [{ scaleX: progress }] }]} /></View>;
}
export function LoadingScreen() {
  useTheme();
  return <View style={styles.loading}><View style={styles.mark}><Ionicons name="sparkles" size={30} color={colors.onAccent} /></View><Text style={styles.loadingTitle}>LingoSpark</Text><Text style={styles.caption}>Маленький шаг. Новый навык.</Text></View>;
}
const styles = createThemedStyles(() => ({
  button: { minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  buttonText: { fontSize: 16, lineHeight: 23, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.warningSoft },
  xpText: { color: colors.orange, fontWeight: '700', fontSize: 11 },
  track: { width: '100%', backgroundColor: colors.track, borderRadius: 100, overflow: 'hidden' },
  fill: { width: '100%', height: '100%', borderRadius: 100 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mark: { width: 76, height: 76, borderRadius: 26, backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  caption: { color: colors.textMuted, fontSize: 14 },
}));

