import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, Wordmark, Field, Button, Icon } from '../components/ui';
import EraseSheet from '../components/EraseSheet';
import { useVault } from '../state/VaultContext';
import { colors, space, type } from '../theme';

export default function UnlockScreen() {
  const { unlock } = useVault();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [eraseOpen, setEraseOpen] = useState(false);

  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setError('');
    try {
      await unlock(pw);
    } catch (e) {
      setError(e.code === 'WRONG_PASSWORD' ? 'That master password is incorrect.' : e.message || 'Could not unlock the vault.');
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={{ paddingTop: 96 }}>
      <View style={{ alignItems: 'center', marginBottom: space.xxl }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: space.xl }}>
          <Icon name="lock" size={30} color={colors.accent} />
        </View>
        <Wordmark size={32} />
        <Text style={[type.body, { color: colors.muted, marginTop: 8 }]}>Your vault is locked.</Text>
      </View>

      <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
        <Field label="Master password" value={pw} onChangeText={(t) => { setPw(t); if (error) setError(''); }} secure autoFocus autoComplete="current-password" error={error} onSubmitEditing={submit} />
        <Button title={busy ? 'Unlocking' : 'Unlock'} icon="lock-open" onPress={submit} disabled={!pw} loading={busy} />
        <Pressable onPress={() => setEraseOpen(true)} style={{ alignSelf: 'center', marginTop: space.xl, padding: space.sm }} accessibilityRole="button">
          <Text style={[type.small, { textDecorationLine: 'underline' }]}>Forgot your master password?</Text>
        </Pressable>
      </View>
      <EraseSheet visible={eraseOpen} onClose={() => setEraseOpen(false)} />
    </Screen>
  );
}
