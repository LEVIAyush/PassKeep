import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Sheet, Field, Button } from './ui';
import { useVault } from '../state/VaultContext';
import { useToast } from './Toast';
import { canUseFiles, pickTextFile } from '../platform/files';
import { space, type } from '../theme';

/**
 * mode="restore": fresh install, adopt a backup as the vault.
 * mode="merge":   already unlocked, add entries from another backup.
 */
export default function BackupSheet({ visible, onClose, mode }) {
  const { restoreBackup, mergeBackup } = useVault();
  const toast = useToast();
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setText(''); setPassword(''); setError(''); setBusy(false); onClose(); };

  const choose = async () => {
    const t = await pickTextFile();
    if (t) { setText(t); setError(''); }
  };

  const submit = async () => {
    setError('');
    if (!text.trim()) return setError('Choose a backup file or paste its contents.');
    if (mode === 'merge' && !password) return setError("Enter the backup's master password.");
    setBusy(true);
    try {
      if (mode === 'merge') {
        const { added, total } = await mergeBackup(text, password);
        toast(added ? `Imported ${added} new ${added === 1 ? 'password' : 'passwords'}` : `Nothing new to import (${total} already here)`);
      } else {
        await restoreBackup(text);
        toast("Backup loaded. Unlock it with that backup's master password.");
      }
      close();
    } catch (e) {
      setError(e.code === 'WRONG_PASSWORD' ? "That isn't the master password for this backup." : e.message || 'Could not read that backup.');
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title={mode === 'merge' ? 'Import a backup' : 'Restore a backup'}>
      <Text style={[type.small, { marginBottom: space.lg }]}>
        {mode === 'merge'
          ? 'New passwords from the backup are added to this vault. Ones you already have are skipped.'
          : 'Load a backup made on another device or browser. You will unlock it with the master password it was created with.'}
      </Text>
      {canUseFiles ? <Button title="Choose backup file" icon="folder-open" variant="secondary" onPress={choose} style={{ marginBottom: space.lg }} /> : null}
      <Field label={canUseFiles ? 'Or paste the backup text' : 'Paste the backup text'} value={text} onChangeText={setText} multiline isMono placeholder='{"app":"passkeep", ...}' />
      {mode === 'merge' ? <Field label="Backup master password" value={password} onChangeText={setPassword} secure onSubmitEditing={submit} /> : null}
      {error ? <Text style={[type.small, { color: '#FF6B6B', marginBottom: space.md }]}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Button title="Cancel" variant="secondary" onPress={close} style={{ flex: 1 }} />
        <Button title={mode === 'merge' ? 'Import' : 'Restore'} onPress={submit} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}
