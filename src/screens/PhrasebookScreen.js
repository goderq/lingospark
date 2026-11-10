import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { phrases } from '../data/course';
import { colors } from '../theme';

export default function PhrasebookScreen({ onClose }) {
  return <View style={styles.container}><View style={styles.header}><Pressable onPress={onClose} style={styles.back}><Ionicons name="chevron-back" size={25} color="white" /></Pressable><Text style={styles.headerTitle}>Фразы</Text><View style={{ width: 42 }} /></View><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>Живые фразы</Text><Text style={styles.subtitle}>Слушай и повторяй вслух</Text>{phrases.map(([english, russian]) => <Pressable key={english} onPress={() => Speech.speak(english, { language: 'en-US', rate: 0.82 })} style={styles.phrase}><View style={styles.icon}><Ionicons name="volume-high" size={22} color={colors.purple} /></View><View style={{ flex: 1 }}><Text style={styles.english}>{english}</Text><Text style={styles.russian}>{russian}</Text></View></Pressable>)}</ScrollView></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: 'white', fontWeight: '800', fontSize: 17 }, content: { padding: 20, paddingBottom: 50 }, title: { color: 'white', fontSize: 35, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 7, marginBottom: 22 }, phrase: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border }, icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(124,92,252,0.15)', alignItems: 'center', justifyContent: 'center' }, english: { color: 'white', fontSize: 16, fontWeight: '700' }, russian: { color: colors.textMuted, fontSize: 12, marginTop: 5 } });

