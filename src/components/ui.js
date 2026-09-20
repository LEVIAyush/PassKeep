import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Modal, ActivityIndicator, Switch, StyleSheet, Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, radius, type, mono, noOutline, MAX_WIDTH, TINTS } from '../theme';
import { STRENGTH_LABELS } from '../core/strength.js';

// Icons are decorative: the surrounding button/row carries the accessible name.
export const Icon = (props) => <MaterialIcons aria-hidden importantForAccessibility="no" accessibilityElementsHidden {...props} />;

/** Page container: dark background, content centred and capped on wide screens. */
export function Screen({ children, scroll = false, style, contentStyle, keyboard = true }) {
  const insets = useSafeAreaInsets();
  const inner = { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' };
  const pad = { paddingTop: insets.top + space.lg, paddingHorizontal: space.lg };
  if (scroll) {
    return (
      <View style={[s.screen, style]}>
        <ScrollView
          contentContainerStyle={[inner, pad, { paddingBottom: space.xxl * 2 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View style={[s.screen, style]}><View style={[inner, pad, { flex: 1 }, contentStyle]}>{children}</View></View>;
}

export function Wordmark({ size = 22 }) {
  return (
    <Text style={{ fontFamily: mono, fontSize: size, color: colors.text, letterSpacing: -0.5 }}>
      PassKeep<Text style={{ color: colors.accent }}>▮</Text>
    </Text>
  );
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, small }) {
  const off = disabled || loading;
  const v = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
    secondary: { bg: colors.raised, fg: colors.text, border: colors.lineStrong },
    ghost: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
    danger: { bg: colors.dangerDim, fg: colors.danger, border: colors.danger },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      aria-disabled={off}
      style={({ pressed, hovered }) => [
        s.button, small && s.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.45 : pressed ? 0.8 : 1 },
        hovered && !off && { borderColor: colors.accent },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <View style={s.row}>
          {icon ? <Icon name={icon} size={18} color={v.fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.buttonText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, color = colors.muted, size = 20, label, style, active }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed, hovered }) => [s.iconButton, hovered && { backgroundColor: colors.raised }, pressed && { opacity: 0.6 }, active && { backgroundColor: colors.accentDim }, style]}
    >
      <Icon name={name} size={size} color={active ? colors.accent : color} />
    </Pressable>
  );
}

export const Field = React.forwardRef(function Field(
  { label, value, onChangeText, secure, forceReveal, isMono, right, error, hint, multiline, style, ...rest }, ref,
) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  return (
    <View style={[{ marginBottom: space.lg }, style]}>
      {label ? <Text style={[type.label, { marginBottom: 6 }]}>{label}</Text> : null}
      <View style={[s.fieldBox, focused && { borderColor: colors.accent }, !!error && { borderColor: colors.danger }, multiline && { alignItems: 'flex-start' }]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !reveal && !forceReveal}
          multiline={multiline}
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[s.input, noOutline, (isMono || (secure && (reveal || forceReveal))) && { fontFamily: mono, fontSize: 15 }, multiline && { minHeight: 92, textAlignVertical: 'top', paddingTop: 13 }]}
          {...rest}
        />
        {secure ? <IconButton name={reveal ? 'visibility-off' : 'visibility'} label={reveal ? 'Hide password' : 'Show password'} onPress={() => setReveal((r) => !r)} /> : null}
        {right}
      </View>
      {error ? <Text style={[type.small, { color: colors.danger, marginTop: 6 }]}>{error}</Text>
        : hint ? <Text style={[type.small, { marginTop: 6 }]}>{hint}</Text> : null}
    </View>
  );
});

export function StrengthMeter({ result }) {
  const c = colors[['danger', 'danger', 'warn', 'accent', 'accent'][result.score]];
  const filled = result.bits === 0 ? 0 : Math.max(1, result.score);
  return (
    <View style={{ marginTop: -4, marginBottom: space.lg }} accessible accessibilityLabel={`Password strength: ${result.bits ? STRENGTH_LABELS[result.score] : 'none yet'}`}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < filled ? c : colors.line }} />
        ))}
      </View>
      <Text style={[type.small, { marginTop: 6 }]}>
        <Text style={{ color: result.bits ? c : colors.muted, fontWeight: '600' }}>{result.bits ? STRENGTH_LABELS[result.score] : 'Strength'}</Text>
        {result.bits ? `  ·  about ${result.bits} bits` : ''}
      </Text>
    </View>
  );
}

export function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[s.segment, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} accessibilityRole="radio" aria-checked={on}
            style={[s.segmentItem, on && { backgroundColor: colors.accentDim, borderColor: colors.accent }]}>
            {o.icon ? <Icon name={o.icon} size={16} color={on ? colors.accent : colors.muted} style={{ marginRight: 6 }} /> : null}
            <Text style={{ color: on ? colors.accent : colors.muted, fontWeight: '600', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({ label, value, onChange, hint }) {
  return (
    <View style={[s.row, { justifyContent: 'space-between', paddingVertical: 8 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={type.body}>{label}</Text>
        {hint ? <Text style={type.small}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.line, true: colors.accentDim }} thumbColor={value ? colors.accent : colors.muted} {...Platform.select({ web: { activeThumbColor: colors.accent } })} accessibilityLabel={label} />
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Avatar({ name = '?', size = 42 }) {
  const ch = (name.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = TINTS[h % TINTS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: fg, fontSize: size * 0.42, fontWeight: '700' }}>{ch}</Text>
    </View>
  );
}

export function Tag({ text, tone = 'warn' }) {
  const c = tone === 'danger' ? colors.danger : colors.warn;
  const bg = tone === 'danger' ? colors.dangerDim : colors.warnDim;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: c, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

/** Centered dialog. Tap the dimmed backdrop, press Escape/back, or use the buttons to close. */
export function Sheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.overlay}>
        {/* The backdrop is a SIBLING of the dialog (never its parent) so buttons aren't nested in buttons. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} focusable={false} accessible={false} />
        <View style={s.sheet} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {title ? <Text style={[type.title, { marginBottom: space.lg, fontSize: 20 }]}>{title}</Text> : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({ icon = 'lock', title, body, action }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl * 1.5, paddingHorizontal: space.xl }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg }}>
        <Icon name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={[type.heading, { textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.small, { textAlign: 'center', marginTop: 6, maxWidth: 320 }]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  button: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonSmall: { minHeight: 38, paddingHorizontal: space.md },
  buttonText: { fontSize: 15, fontWeight: '700' },
  iconButton: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingLeft: space.md, paddingRight: 6 },
  input: { flex: 1, minHeight: 50, color: colors.text, fontSize: 16, paddingVertical: 10 },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: space.lg },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: { flex: 1, flexDirection: 'row', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 460, maxHeight: '88%', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.lg, padding: space.xl },
});
