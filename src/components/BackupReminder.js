// Shows a "Back up your vault?" popup after a new password is saved.
//
// Setup (2 small edits, see below):
//   1. App.js:            wrap <NavigationContainer> in <BackupReminderProvider>
//   2. EntryFormScreen.js: call remindBackup() after a NEW password is saved
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Sheet, Button, Icon } from './ui';
import { copyToClipboard, useToast } from './Toast';
import { useVault } from '../state/VaultContext';
import { canUseFiles, downloadTextFile } from '../platform/files';
import { colors, space, type } from '../theme';

// 1 = ask after every new password. Set to 3 to ask after every 3rd one, and so on.
const REMIND_EVERY_N_ADDS = 1;

const ReminderContext = createContext(() => {});
export const useBackupReminder = () => useContext(ReminderContext);

export function BackupReminderProvider({ children }) {
  const { exportBackup } = useVault();
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const adds = useRef(0);

  const remindBackup = useCallback(() => {
    adds.current += 1;
    if (adds.current % REMIND_EVERY_N_ADDS === 0) setVisible(true);
  }, []);

  const close = () => { setVisible(false); setBusy(false); };

  const backupNow = async () => {
    setBusy(true);
    try {
      const text = await exportBackup(); // already includes the password that was just saved
      if (canUseFiles) {
        downloadTextFile(`passkeep-backup-${new Date().toISOString().slice(0, 10)}.passkeep`, text);
        toast('Backup downloaded');
      } else {
        await copyToClipboard(text);
        toast('Backup copied. Paste it somewhere safe.');
      }
      close();
    } catch {
      toast("Couldn't create the backup", 'error');
      setBusy(false);
    }
  };

  const where = Platform.OS === 'web' ? 'this browser' : 'this device';

  return (
    <ReminderContext.Provider value={remindBackup}>
      {children}
      <Sheet visible={visible} onClose={close} title="Back up your vault?">
        <View style={{ flexDirection: 'row', marginBottom: space.lg }}>
          <Icon name="save-alt" size={22} color={colors.accent} style={{ marginRight: 12, marginTop: 2 }} />
          <Text style={[type.body, { flex: 1 }]}>
            Your passwords are stored only in {where}. If you clear site data or switch devices, they are gone unless you have a backup.
          </Text>
        </View>
        <Text style={[type.small, { marginBottom: space.xl }]}>
          The backup stays encrypted with your master password, so it is safe to keep anywhere.
        </Text>
        <Button
          title={canUseFiles ? 'Download backup' : 'Copy backup'}
          icon={canUseFiles ? 'file-download' : 'content-copy'}
          onPress={backupNow}
          loading={busy}
        />
        <Button title="Not now" variant="ghost" onPress={close} style={{ marginTop: space.sm }} />
      </Sheet>
    </ReminderContext.Provider>
  );
}