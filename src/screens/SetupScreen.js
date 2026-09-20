import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, Wordmark, Field, Button, StrengthMeter, Card, Icon, ToggleRow } from '../components/ui';
import BackupSheet from '../components/BackupSheet';
import { useVault } from '../state/VaultContext';
import { estimateStrength } from '../core/strength.js';
import { checkMasterPassword } from '../core/master.js';
import { isCryptoAvailable } from '../crypto';
import { readLegacy } from '../platform/legacy';
import { colors, space, type } from '../theme';

export default function SetupScreen() {
  const { createVault } = useVault();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const legacyCount = useMemo(() => readLegacy().entries.length, []);
  const cryptoOk = isCryptoAvailable();

  const strength = estimateStrength(pw);
  const pwError = pw ? checkMasterPassword(pw) : '';
  const mismatch = pw2 && pw2 !== pw ? "These don't match." : '';
  const ready = pw && !pwError && pw === pw2 && ack && cryptoOk;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      await createVault(pw);
    } catch (e) {
      setError(e.message || 'Could not create the vault.');
      setBusy(false);
    }
  };

  return (
    <Screen scroll contentStyle={{ paddingTop: space.xxl }}>
      <Wordmark size={26} />
      <Text style={[type.title, { marginTop: space.xl }]}>Create your vault</Text>
      <Text style={[type.body, { color: colors.muted, marginTop: 6, marginBottom: space.xl }]}>
        Choose one master password. It encrypts everything you save, and it is the only key.
      </Text>

      {!cryptoOk ? (
        <Card style={{ borderColor: colors.danger, marginBottom: space.lg }}>
          <Text style={[type.heading, { color: colors.danger }]}>Secure context required</Text>
          <Text style={[type.small, { marginTop: 4 }]}>
            Your browser only allows encryption on secure pages. Open PassKeep over https:// (or localhost) to continue.
          </Text>
        </Card>
      ) : null}

      {legacyCount > 0 ? (
        <Card style={{ borderColor: colors.accent, marginBottom: space.lg, flexDirection: 'row' }}>
          <Icon name="move-to-inbox" size={22} color={colors.accent} style={{ marginRight: 12, marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={type.heading}>{legacyCount} saved {legacyCount === 1 ? 'password' : 'passwords'} found</Text>
            <Text style={[type.small, { marginTop: 4 }]}>
              They came from an earlier version of PassKeep. They will move into your new encrypted vault, and the old copy will be deleted.
            </Text>
          </View>
        </Card>
      ) : null}

      <Field label="Master password" value={pw} onChangeText={setPw} secure autoComplete="new-password" autoFocus error={pwError} />
      <StrengthMeter result={strength} />
      <Field label="Confirm master password" value={pw2} onChangeText={setPw2} secure autoComplete="new-password" error={mismatch} onSubmitEditing={submit} />

      <Card style={{ marginBottom: space.lg, paddingVertical: space.sm }}>
        <ToggleRow
          value={ack}
          onChange={setAck}
          label="I understand PassKeep cannot recover a forgotten master password"
          hint="There is no reset link and no server copy. Keep it somewhere safe."
        />
      </Card>

      {error ? <Text style={[type.small, { color: colors.danger, marginBottom: space.md }]}>{error}</Text> : null}
      <Button title="Create vault" onPress={submit} disabled={!ready} loading={busy} />

      <Pressable onPress={() => setRestoreOpen(true)} style={{ alignSelf: 'center', marginTop: space.xl, padding: space.sm }} accessibilityRole="button">
        <Text style={{ color: colors.accent, fontWeight: '600' }}>Restore from a backup instead</Text>
      </Pressable>
      <BackupSheet visible={restoreOpen} onClose={() => setRestoreOpen(false)} mode="restore" />
    </Screen>
  );
}
