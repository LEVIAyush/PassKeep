import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Sheet, Field, Button } from './ui';
import { useVault } from '../state/VaultContext';
import { useToast } from './Toast';
import { space, type } from '../theme';

export default function EraseSheet({ visible, onClose }) {
  const { eraseVault } = useVault();
  const toast = useToast();
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = word.trim().toLowerCase() === 'erase';

  const close = () => { setWord(''); setBusy(false); onClose(); };
  const go = async () => {
    if (!ok) return;
    setBusy(true);
    await eraseVault();
    toast('Vault erased');
    close();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Erase this vault?">
      <Text style={[type.body, { marginBottom: space.md }]}>
        This permanently deletes every saved password on this device. It cannot be undone, and without a backup there is no way to get them back.
      </Text>
      <Field label='Type "erase" to confirm' value={word} onChangeText={setWord} onSubmitEditing={go} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Button title="Keep vault" variant="secondary" onPress={close} style={{ flex: 1 }} />
        <Button title="Erase vault" variant="danger" onPress={go} disabled={!ok} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}
