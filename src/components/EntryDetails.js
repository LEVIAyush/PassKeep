import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Sheet, Button, IconButton, Tag } from './ui';
import { ISSUE_LABEL } from './EntryRow';
import { copyToClipboard, useToast } from './Toast';
import { useVault } from '../state/VaultContext';
import { estimateStrength } from '../core/strength.js';
import { colors, mono, space, type } from '../theme';

function DetailRow({ label, value, secret, revealed, onToggle, onCopy, copied }) {
  const shown = secret && !revealed ? '••••••••••••' : value;
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.label, { marginBottom: 4 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text selectable={!secret || revealed} style={[type.body, { flex: 1, fontFamily: secret ? mono : undefined }]}>{shown}</Text>
        {secret ? <IconButton name={revealed ? 'visibility-off' : 'visibility'} label={revealed ? 'Hide password' : 'Show password'} onPress={onToggle} /> : null}
        <IconButton name={copied ? 'check' : 'content-copy'} label={`Copy ${label.toLowerCase()}`} onPress={onCopy} color={copied ? colors.accent : colors.muted} />
      </View>
    </View>
  );
}

const fmt = (t) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function EntryDetails({ entry, issues = [], onClose, onEdit }) {
  const { deleteEntry } = useVault();
  const toast = useToast();
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // Always start hidden and un-confirmed for whichever entry is opened.
  useEffect(() => { setReveal(false); setCopied(null); setConfirming(false); setBusy(false); }, [entry && entry.id]);

  const copy = async (field, text, secret) => {
    try {
      await copyToClipboard(text, { secret });
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? null : c)), 1800);
    } catch {
      toast("Couldn't access the clipboard", 'error');
    }
  };

  const remove = async () => {
    setBusy(true);
    try { await deleteEntry(entry.id); toast('Password deleted'); onClose(); } catch { toast("Couldn't delete. Try again.", 'error'); setBusy(false); }
  };

  return (
    <Sheet visible={!!entry} onClose={onClose} title={confirming ? 'Delete this password?' : entry ? entry.name : ''}>
      {entry && confirming ? (
        <>
          <Text style={[type.body, { marginBottom: space.xl }]}>
            "{entry.name}" will be removed from your vault. This can't be undone.
          </Text>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Button title="Keep it" variant="secondary" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
            <Button title="Delete" variant="danger" onPress={remove} loading={busy} style={{ flex: 1 }} />
          </View>
        </>
      ) : entry ? (
        <>
          {issues.length ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: -8, marginBottom: space.lg, flexWrap: 'wrap' }}>
              {issues.map((k) => <Tag key={k} text={k === 'old' ? 'Not changed in over 6 months' : k === 'reused' ? 'Used for more than one login' : ISSUE_LABEL[k] + ' password'} tone={k === 'weak' ? 'danger' : 'warn'} />)}
            </View>
          ) : null}
          {entry.username ? <DetailRow label="Username" value={entry.username} onCopy={() => copy('u', entry.username, false)} copied={copied === 'u'} /> : null}
          <DetailRow label="Password" value={entry.password} secret revealed={reveal} onToggle={() => setReveal((r) => !r)} onCopy={() => copy('p', entry.password, true)} copied={copied === 'p'} />
          {copied === 'p' ? <Text style={[type.small, { marginTop: -8, marginBottom: space.lg }]}>Copied. The clipboard clears in 30 seconds.</Text> : null}
          {entry.notes ? (
            <View style={{ marginBottom: space.lg }}>
              <Text style={[type.label, { marginBottom: 4 }]}>Notes</Text>
              <Text selectable style={type.body}>{entry.notes}</Text>
            </View>
          ) : null}
          <Text style={[type.small, { marginBottom: space.xl }]}>
            Strength: {estimateStrength(entry.password).label}. Password changed {fmt(entry.passwordChangedAt)}.
          </Text>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Button title="Edit" icon="edit" variant="secondary" onPress={() => onEdit(entry)} style={{ flex: 1 }} />
            <Button title="Delete" icon="delete" variant="danger" onPress={() => setConfirming(true)} style={{ flex: 1 }} />
          </View>
          <Button title="Close" variant="ghost" onPress={onClose} style={{ marginTop: space.sm }} />
        </>
      ) : null}
    </Sheet>
  );
}
