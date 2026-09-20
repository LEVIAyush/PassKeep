import React, { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, EmptyState, Icon, Button } from '../components/ui';
import EntryRow from '../components/EntryRow';
import EntryDetails from '../components/EntryDetails';
import Fab from '../components/Fab';
import { copyToClipboard, useToast } from '../components/Toast';
import { useVault } from '../state/VaultContext';
import { auditVault } from '../core/audit.js';
import { colors, space, type, MAX_WIDTH } from '../theme';

const COPY = {
  browser: { title: 'Browser vault', icon: 'language', empty: 'No browser passwords yet', hint: 'Logins for websites go here.' },
  app: { title: 'App vault', icon: 'apps', empty: 'No app passwords yet', hint: 'Logins for apps and other services go here.' },
};

export default function VaultScreen({ navigation, route }) {
  const category = route.params?.category || 'browser';
  const copy = COPY[category];
  const insets = useSafeAreaInsets();
  const { entries, toggleFavorite } = useVault();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const audit = useMemo(() => auditVault(entries), [entries]);
  const inCategory = useMemo(() => entries.filter((e) => e.category === category), [entries, category]);
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inCategory
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.username.toLowerCase().includes(q))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [inCategory, query]);
  const opened = entries.find((e) => e.id === openId) || null;

  const quickCopy = async (e) => {
    try { await copyToClipboard(e.password, { secret: true }); toast(`Password for ${e.name} copied. Clears in 30s.`); }
    catch { toast("Couldn't access the clipboard", 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={data}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingTop: insets.top + space.lg, paddingHorizontal: space.lg, paddingBottom: 110 }}
        ListHeaderComponent={(
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
              <Icon name={copy.icon} size={24} color={colors.accent} style={{ marginRight: 10 }} />
              <Text style={type.title}>{copy.title}</Text>
            </View>
            {inCategory.length > 0 ? (
              <Field
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or username"
                accessibilityLabel="Search"
                right={<Icon name="search" size={20} color={colors.faint} style={{ marginRight: 8 }} />}
                style={{ marginBottom: space.md }}
              />
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            issues={audit.issues[item.id]}
            onPress={() => setOpenId(item.id)}
            onCopy={() => quickCopy(item)}
            onFavorite={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={inCategory.length === 0 ? (
          <EmptyState icon={copy.icon} title={copy.empty} body={copy.hint} action={<Button title="Add a password" icon="add" onPress={() => navigation.navigate('EntryForm', { category })} />} />
        ) : (
          <EmptyState icon="search-off" title="No matches" body={`Nothing in this vault matches "${query}".`} />
        )}
      />
      <Fab onPress={() => navigation.navigate('EntryForm', { category })} />
      <EntryDetails
        entry={opened}
        issues={opened ? audit.issues[opened.id] : []}
        onClose={() => setOpenId(null)}
        onEdit={(e) => { setOpenId(null); navigation.navigate('EntryForm', { entryId: e.id }); }}
      />
    </View>
  );
}
