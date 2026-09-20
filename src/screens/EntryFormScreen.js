import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Field, Button, Segmented, StrengthMeter, Card, ToggleRow, IconButton, s } from '../components/ui';
import { useToast } from '../components/Toast';
import { useVault } from '../state/VaultContext';
import { generatePassword } from '../crypto';
import { DEFAULT_OPTIONS, MIN_LENGTH, MAX_LENGTH } from '../core/generator.js';
import { estimateStrength } from '../core/strength.js';
import { colors, space, type, MAX_WIDTH } from '../theme';
import { useBackupReminder } from '../components/BackupReminder';


const SETS = [
  ['lower', 'Lowercase letters (a-z)'],
  ['upper', 'Uppercase letters (A-Z)'],
  ['digits', 'Numbers (0-9)'],
  ['symbols', 'Symbols (!@#$…)'],
];

export default function EntryFormScreen({ navigation, route }) {
  const { entryId, category: startCategory } = route.params || {};
  const { entries, addEntry, updateEntry } = useVault();
  const toast = useToast();
  const remindBackup = useBackupReminder();
  const existing = entryId ? entries.find((e) => e.id === entryId) : null;

  const [category, setCategory] = useState(existing?.category || startCategory || 'browser');
  const [name, setName] = useState(existing?.name || '');
  const [username, setUsername] = useState(existing?.username || '');
  const [password, setPassword] = useState(existing?.password || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [favorite, setFavorite] = useState(!!existing?.favorite);
  const [genOpen, setGenOpen] = useState(false);
  const [opts, setOpts] = useState(DEFAULT_OPTIONS);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => estimateStrength(password), [password]);

  const applyOpts = (next) => {
    setOpts(next);
    setPassword(generatePassword(next));
    setErrors((e) => ({ ...e, password: undefined }));
  };
  const openGenerator = () => {
    const next = !genOpen;
    setGenOpen(next);
    if (next && !password) setPassword(generatePassword(opts));
  };
  const toggleSet = (key, on) => {
    const next = { ...opts, [key]: on };
    if (!SETS.some(([k]) => next[k])) return; // keep at least one character set on
    applyOpts(next);
  };
  const setLength = (n) => applyOpts({ ...opts, length: Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n)) });

  const save = async () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Enter a name so you can find this later.';
    if (!password) errs.password = 'Enter a password, or generate one.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const data = { category, name: name.trim(), username: username.trim(), password, notes, favorite };
      if (existing) await updateEntry(existing.id, data); else await addEntry(data);
      toast(existing ? 'Changes saved' : 'Password saved');
      navigation.goBack();
      if (!existing) remindBackup();
    } catch {
      toast("Couldn't save. Try again.", 'error');
      setBusy(false);
    }
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', padding: space.lg, paddingBottom: space.xxl * 2 }} keyboardShouldPersistTaps="handled">
        <Text style={[type.label, { marginBottom: 6 }]}>Type</Text>
        <Segmented
          style={{ marginBottom: space.lg }}
          value={category}
          onChange={setCategory}
          options={[{ value: 'browser', label: 'Browser', icon: 'language' }, { value: 'app', label: 'App', icon: 'apps' }]}
        />
        <Field label="Website or app name" value={name} onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }} placeholder="e.g. GitHub" autoCapitalize="words" error={errors.name} autoFocus={!existing} />
        <Field label="Username or email" value={username} onChangeText={setUsername} placeholder="you@example.com" keyboardType="email-address" autoComplete="off" />
        <Field
          label="Password"
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
          secure
          forceReveal={genOpen}
          autoComplete="off"
          error={errors.password}
          right={<IconButton name="auto-fix-high" label="Password generator" onPress={openGenerator} active={genOpen} color={colors.accent} />}
        />
        <StrengthMeter result={strength} />

        {genOpen ? (
          <Card style={{ marginBottom: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={type.heading}>Generator</Text>
              <Button small variant="secondary" icon="refresh" title="New password" onPress={() => applyOpts(opts)} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, marginBottom: space.sm }}>
              <Text style={type.body}>Length</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton name="remove" label="Shorter" onPress={() => setLength(opts.length - 1)} color={colors.text} />
                <Text style={[type.heading, { minWidth: 36, textAlign: 'center' }]} accessibilityLabel={`Length ${opts.length}`}>{opts.length}</Text>
                <IconButton name="add" label="Longer" onPress={() => setLength(opts.length + 1)} color={colors.text} />
              </View>
            </View>
            {SETS.map(([key, label]) => <ToggleRow key={key} label={label} value={opts[key]} onChange={(v) => toggleSet(key, v)} />)}
            <ToggleRow label="Avoid look-alike characters" hint="Skips O, 0, l, 1 and I" value={opts.avoidAmbiguous} onChange={(v) => applyOpts({ ...opts, avoidAmbiguous: v })} />
          </Card>
        ) : null}

        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline autoCapitalize="sentences" placeholder="Security answers, recovery hints…" />
        <Card style={{ marginBottom: space.xl, paddingVertical: space.sm }}>
          <ToggleRow label="Favorite" hint="Pinned to the top of your vault and Home" value={favorite} onChange={setFavorite} />
        </Card>
        <Button title={existing ? 'Save changes' : 'Save password'} icon="check" onPress={save} loading={busy} />
      </ScrollView>
    </View>
  );
}
