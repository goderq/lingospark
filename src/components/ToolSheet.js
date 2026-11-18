import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme, createThemedStyles } from '../theme';

export default function ToolSheet({ visible, onClose, title, actions = [], children }) {
  const { reduceMotion } = useTheme();
  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
    <View style={s.overlay}><Pressable accessibilityLabel="Закрыть панель" onPress={onClose} style={s.dismiss} /><View accessibilityViewIsModal style={s.sheet}>
      <View style={s.handle} /><View style={s.heading}><Text style={s.title}>{title}</Text><Pressable accessibilityLabel="Закрыть панель" onPress={onClose} style={s.close}><Ionicons name="close" size={23} color={colors.text} /></Pressable></View>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
        {children}
        {actions.map(action => <Pressable key={action.title} onPress={() => { onClose(); action.onPress(); }} style={s.action}><View style={s.icon}><Ionicons name={action.icon} size={23} color={colors.purple} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{action.title}</Text>{!!action.detail && <Text style={s.detail}>{action.detail}</Text>}</View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable>)}
      </ScrollView>
    </View></View>
  </Modal>;
}
const s = createThemedStyles(() => ({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }, dismiss: { flex: 1 }, sheet: { maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.card, padding: 22, paddingBottom: 44, gap: 10 }, handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: colors.border }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, title: { color: colors.text, fontSize: 24, fontWeight: '800' }, close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, action: { minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderColor: colors.border }, icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, label: { color: colors.text, fontSize: 16, fontWeight: '700' }, detail: { color: colors.textMuted, fontSize: 12, lineHeight: 19 } }));
