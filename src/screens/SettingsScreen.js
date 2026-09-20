import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Screen, Card, Button, Field, Segmented, StrengthMeter, Sheet, Icon } from '../components/ui';
import BackupSheet from '../components/BackupSheet';
import EraseSheet from '../components/EraseSheet';
import { copyToClipboard, useToast } from '../components/Toast';
import { useVault } from '../state/VaultContext';
import { canUseFiles, downloadTextFile } from '../platform/files';
import { estimateStrength } from '../core/strength.js';
import { checkMasterPassword } from '../core/master.js';
import { colors, space, type } from '../theme';

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <Text style={[type.heading, { marginBottom: space.md }]}>{title}</Text>
      {children}
    </View>
  );
}

function ChangePasswordSheet({ visible, onClose }) {
  const { changeMasterPassword } = useVault();
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setCur(''); setNext(''); setNext2(''); setError(''); setBusy(false); onClose(); };
  const problem = next ? checkMasterPassword(next) : '';
  const ready = cur && next && !problem && next === next2;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      await changeMasterPassword(cur, next);
      toast('Master password changed');
      close();
    } catch (e) {
      setError(e.code === 'WRONG_PASSWORD' ? 'Your current master password is incorrect.' : e.message || 'Could not change the password.');
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title="Change master password">
      <Field label="Current master password" value={cur} onChangeText={setCur} secure autoFocus error={error} />
      <Field label="New master password" value={next} onChangeText={setNext} secure error={problem} autoComplete="new-password" />
      <StrengthMeter result={estimateStrength(next)} />
      <Field label="Confirm new master password" value={next2} onChangeText={setNext2} secure error={next2 && next2 !== next ? "These don't match." : ''} onSubmitEditing={submit} autoComplete="new-password" />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Button title="Cancel" variant="secondary" onPress={close} style={{ flex: 1 }} />
        <Button title="Change password" onPress={submit} disabled={!ready} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

export default function SettingsScreen() {
  const { settings, setAutoLock, lock, exportBackup, entries } = useVault();
  const toast = useToast();
  const [changeOpen, setChangeOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);

  const doExport = async () => {
    try {
      const text = await exportBackup();
      if (canUseFiles) {
        downloadTextFile(`passkeep-backup-${new Date().toISOString().slice(0, 10)}.passkeep`, text);
        toast('Backup downloaded');
      } else {
        await copyToClipboard(text);
        toast('Backup copied. Paste it somewhere safe.');
      }
    } catch {
      toast("Couldn't create the backup", 'error');
    }
  };

  return (
    <Screen scroll>
      <Text style={[type.title, { marginBottom: space.xl }]}>Settings</Text>

      <Section title="Security">
        <Card>
          <Text style={type.body}>Lock automatically after</Text>
          <Text style={[type.small, { marginBottom: space.md }]}>Counts from your last activity, and when the app is left in the background.</Text>
          <Segmented
            value={settings.autoLockMinutes}
            onChange={setAutoLock}
            options={[1, 5, 15, 30].map((m) => ({ value: m, label: `${m} min` }))}
          />
        </Card>
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.md }}>
          <Button title="Lock now" icon="lock" variant="secondary" onPress={lock} style={{ flex: 1 }} />
          <Button title="Change master password" icon="key" variant="secondary" onPress={() => setChangeOpen(true)} style={{ flex: 1 }} />
        </View>
      </Section>

      <Section title="Backup">
        <Text style={[type.small, { marginBottom: space.md }]}>
          Backups stay encrypted with your master password, so the file is safe to store anywhere.
          {Platform.OS === 'web' ? ' Your vault lives in this browser only, so a backup is how you move it to another device.' : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button title={canUseFiles ? 'Download backup' : 'Copy backup'} icon={canUseFiles ? 'file-download' : 'content-copy'} variant="secondary" onPress={doExport} disabled={entries.length === 0} style={{ flex: 1 }} />
          <Button title="Import backup" icon="file-upload" variant="secondary" onPress={() => setImportOpen(true)} style={{ flex: 1 }} />
        </View>
      </Section>

      <Section title="Danger zone">
        <Button title="Erase vault" icon="delete-forever" variant="danger" onPress={() => setEraseOpen(true)} />
      </Section>

      <Card style={{ flexDirection: 'row' }}>
        <Icon name="shield" size={20} color={colors.accent} style={{ marginRight: 12, marginTop: 2 }} />
        <Text style={[type.small, { flex: 1 }]}>
          PassKeep encrypts your whole vault with AES-256-GCM. The key is derived from your master password with PBKDF2 (600,000 rounds) and only ever held in memory while unlocked. Nothing is sent to a server.
        </Text>
      </Card>

      <ChangePasswordSheet visible={changeOpen} onClose={() => setChangeOpen(false)} />
      <BackupSheet visible={importOpen} onClose={() => setImportOpen(false)} mode="merge" />
      <EraseSheet visible={eraseOpen} onClose={() => setEraseOpen(false)} />
    </Screen>
  );
}
