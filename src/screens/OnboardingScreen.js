import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/UI';
import { useProgress } from '../store/ProgressContext';
import { colors , useTheme, createThemedStyles } from '../theme';

export default function OnboardingScreen() {
  useTheme();
  const { finishOnboarding } = useProgress();
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(30);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <LinearGradient colors={['rgba(124,92,252,0.35)', 'transparent']} style={styles.glow} />
      <View style={styles.steps}>{[0, 1, 2].map((i) => <View key={i} style={[styles.step, i <= page && styles.stepActive]} />)}</View>
      <View style={styles.content}>
        {page === 0 && <View style={styles.center}><View style={styles.heroIcon}><Ionicons name="chatbubbles" size={72} color={colors.text} /></View><Text style={styles.hero}>Английский,{`\n`}который затягивает</Text><Text style={styles.subtitle}>Живые фразы, мини-игры и всего 10 минут в день — без скучной зубрёжки.</Text></View>}
        {page === 1 && <View><Text style={styles.title}>Как тебя зовут?</Text><Text style={styles.subtitle}>Будем поддерживать тебя по имени</Text><TextInput value={name} onChangeText={setName} placeholder="Твоё имя" placeholderTextColor={colors.textMuted} autoCapitalize="words" style={styles.input} /></View>}
        {page === 2 && <View><Text style={styles.title}>Выбери свой ритм</Text><Text style={styles.subtitle}>Цель можно изменить позже</Text>{[[10, 'Легко', '3–5 минут'], [30, 'Оптимально', '10 минут'], [50, 'Интенсивно', '15–20 минут']].map(([value, label, detail]) => <Pressable key={value} onPress={() => setGoal(value)} style={[styles.goal, goal === value && styles.goalActive]}><View style={[styles.goalCircle, goal === value && { backgroundColor: colors.accentSoft }]}><Text style={styles.goalNumber}>{value}</Text></View><View style={{ flex: 1 }}><Text style={styles.goalLabel}>{label}</Text><Text style={styles.goalDetail}>{detail}</Text></View>{goal === value && <Ionicons name="checkmark-circle" size={26} color={colors.mint} />}</Pressable>)}</View>}
      </View>
      <PrimaryButton title={page === 2 ? 'Начать учиться' : 'Продолжить'} onPress={() => page < 2 ? setPage(page + 1) : finishOnboarding(name, goal)} />
    </KeyboardAvoidingView>
  );
}

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 58, paddingBottom: 30 },
  glow: { position: 'absolute', top: -100, right: -120, width: 380, height: 380, borderRadius: 200 },
  steps: { flexDirection: 'row', gap: 8 }, step: { flex: 1, height: 5, borderRadius: 10, backgroundColor: colors.border }, stepActive: { backgroundColor: colors.accentSoft },
  content: { flex: 1, justifyContent: 'center' }, center: { alignItems: 'center' },
  heroIcon: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,92,252,0.25)', marginBottom: 25 },
  hero: { color: colors.text, fontSize: 38, lineHeight: 43, fontWeight: '900', textAlign: 'center' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginBottom: 10 }, subtitle: { color: colors.textMuted, fontSize: 17, lineHeight: 25, textAlign: 'center', marginBottom: 26 },
  input: { backgroundColor: colors.card, borderRadius: 18, padding: 18, color: colors.text, fontSize: 19, fontWeight: '600', borderWidth: 1, borderColor: colors.border },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, backgroundColor: colors.card, borderRadius: 20, marginTop: 12, borderWidth: 1.5, borderColor: 'transparent' }, goalActive: { borderColor: colors.purple },
  goalCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' }, goalNumber: { color: colors.text, fontWeight: '800', fontSize: 16 },
  goalLabel: { color: colors.text, fontSize: 17, fontWeight: '700' }, goalDetail: { color: colors.textMuted, marginTop: 3 },
}));

