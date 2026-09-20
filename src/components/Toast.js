import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, space } from '../theme';
import { Icon } from './ui';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((text, tone = 'ok') => {
    clearTimeout(timer.current);
    setToast({ text, tone });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View style={{ pointerEvents: 'none', position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', paddingHorizontal: space.lg }}>
          <View aria-live="polite" role="status" style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.raised, borderWidth: 1,
            borderColor: toast.tone === 'error' ? colors.danger : colors.lineStrong, borderRadius: radius.pill,
            paddingVertical: 10, paddingHorizontal: 16, maxWidth: 520,
          }}>
            <Icon name={toast.tone === 'error' ? 'error-outline' : 'check-circle'} size={18} color={toast.tone === 'error' ? colors.danger : colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 14, flexShrink: 1 }}>{toast.text}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const CLEAR_AFTER_MS = 30000;
let clearTimer = null;

/** Copy text; passwords are wiped from the clipboard after 30 seconds. */
export async function copyToClipboard(text, { secret = false } = {}) {
  await Clipboard.setStringAsync(text);
  clearTimeout(clearTimer);
  if (secret) {
    clearTimer = setTimeout(() => { Clipboard.setStringAsync('').catch(() => {}); }, CLEAR_AFTER_MS);
  }
}
