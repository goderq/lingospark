import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function PrimaryButton({ title, onPress, color = colors.purple, disabled = false, icon }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: color, opacity: disabled ? 0.4 : pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}> 
      {icon ? <Ionicons name={icon} size={19} color="white" /> : null}
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function XPBadge({ xp }) {
  return (
    <View style={styles.xpBadge}>
      <Ionicons name="flash" size={13} color={colors.orange} />
      <Text style={styles.xpText}>{xp} XP</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.purple, height = 10 }) {
  return <View style={[styles.track, { height }]}><View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} /></View>;
}

export function LoadingScreen() {
  return <View style={styles.loading}><Text style={styles.logo}>⚡️</Text><Text style={styles.loadingTitle}>LingoSpark</Text></View>;
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '800' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,159,67,0.14)' },
  xpText: { color: colors.orange, fontWeight: '800', fontSize: 12 },
  track: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 64 }, loadingTitle: { color: 'white', fontSize: 30, fontWeight: '900', marginTop: 14 },
});

