import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, Wordmark, IconButton, Card, Icon, EmptyState, Button } from '../components/ui';
import EntryRow from '../components/EntryRow';
import EntryDetails from '../components/EntryDetails';
import Fab from '../components/Fab';
import { useVault } from '../state/VaultContext';
import { auditVault } from '../core/audit.js';
import { colors, radius, space, type } from '../theme';

function Stat({ icon, label, count, tone }) {
  const c = count === 0 ? colors.faint : tone;
  return (
    <View style={{ flex: 1, alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={icon} size={16} color={c} />
        <Text style={{ color: count === 0 ? colors.muted : colors.text, fontSize: 22, fontWeight: '700', marginLeft: 6 }}>{count}</Text>
      </View>
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

function CategoryCard({ icon, name, count, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}, ${count} saved`} style={({ hovered, pressed }) => ({
      flex: 1, backgroundColor: hovered ? colors.raised : colors.panel, borderWidth: 1, borderColor: pressed ? colors.accent : colors.line,
      borderRadius: radius.lg, padding: space.lg,
    })}>
      <Icon name={icon} size={24} color={colors.accent} />
      <Text style={[type.heading, { marginTop: space.md }]}>{name}</Text>
      <Text style={type.small}>{count} saved</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { entries, lock, toggleFavorite } = useVault();
  const audit = useMemo(() => auditVault(entries), [entries]);
  const [openId, setOpenId] = useState(null);
  const opened = entries.find((e) => e.id === openId) || null;

  const browserCount = entries.filter((e) => e.category === 'browser').length;
  const appCount = entries.length - browserCount;
  const favorites = entries.filter((e) => e.favorite).sort((a, b) => a.name.localeCompare(b.name));
  const flagged = entries.filter((e) => audit.issues[e.id]).slice(0, 5);
  const healthyPct = audit.total ? (audit.healthy / audit.total) * 100 : 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl }}>
          <Wordmark size={22} />
          <IconButton name="lock" label="Lock vault" onPress={lock} color={colors.text} style={{ borderWidth: 1, borderColor: colors.lineStrong }} />
        </View>

        {entries.length === 0 ? (
          <EmptyState
            icon="vpn-key"
            title="Your vault is empty"
            body="Save your first login. It is encrypted before it is stored, and only your master password can open it."
            action={<Button title="Add a password" icon="add" onPress={() => navigation.navigate('EntryForm', {})} />}
          />
        ) : (
          <>
            <Card style={{ marginBottom: space.lg }}>
              <Text style={type.heading}>
                {audit.flagged === 0 ? 'Everything looks healthy' : `${audit.healthy} of ${audit.total} passwords look healthy`}
              </Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: audit.flagged ? colors.warnDim : colors.line, overflow: 'hidden', marginVertical: space.md }}>
                <View style={{ width: `${healthyPct}%`, height: 6, backgroundColor: colors.accent }} />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Stat icon="warning-amber" label="Weak" count={audit.counts.weak} tone={colors.danger} />
                <Stat icon="content-copy" label="Reused" count={audit.counts.reused} tone={colors.warn} />
                <Stat icon="history" label="Over 6 months old" count={audit.counts.old} tone={colors.warn} />
              </View>
            </Card>

            {flagged.length ? (
              <View style={{ marginBottom: space.lg }}>
                <Text style={[type.heading, { marginBottom: space.md }]}>Needs attention</Text>
                {flagged.map((e) => <EntryRow key={e.id} entry={e} issues={audit.issues[e.id]} onPress={() => setOpenId(e.id)} />)}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
              <CategoryCard icon="language" name="Browser" count={browserCount} onPress={() => navigation.navigate('BrowserTab')} />
              <CategoryCard icon="apps" name="Apps" count={appCount} onPress={() => navigation.navigate('AppTab')} />
            </View>

            {favorites.length ? (
              <View>
                <Text style={[type.heading, { marginBottom: space.md }]}>Favorites</Text>
                {favorites.map((e) => <EntryRow key={e.id} entry={e} issues={audit.issues[e.id]} onPress={() => setOpenId(e.id)} onFavorite={() => toggleFavorite(e.id)} />)}
              </View>
            ) : null}
          </>
        )}
      </Screen>
      {entries.length ? <Fab onPress={() => navigation.navigate('EntryForm', {})} /> : null}
      <EntryDetails
        entry={opened}
        issues={opened ? audit.issues[opened.id] : []}
        onClose={() => setOpenId(null)}
        onEdit={(e) => { setOpenId(null); navigation.navigate('EntryForm', { entryId: e.id }); }}
      />
    </View>
  );
}
