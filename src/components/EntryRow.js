import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Avatar, IconButton, Tag } from './ui';
import { colors, radius, space, type } from '../theme';

export const ISSUE_LABEL = { weak: 'Weak', reused: 'Reused', old: 'Old' };

// The row is a container, not a button: the main area and each action are
// siblings, so we never nest interactive elements (invalid HTML, bad for a11y).
export default function EntryRow({ entry, issues = [], onPress, onCopy, onFavorite }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderWidth: 1,
      borderColor: colors.line, borderRadius: radius.lg, marginBottom: space.sm, paddingRight: 4,
    }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${entry.name}${entry.username ? `, ${entry.username}` : ''}`}
        style={({ pressed, hovered }) => ({
          flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: space.md,
          borderRadius: radius.lg, backgroundColor: hovered || pressed ? colors.raised : 'transparent',
        })}
      >
        <Avatar name={entry.name} />
        <View style={{ flex: 1, marginLeft: space.md, paddingRight: space.sm }}>
          <Text style={type.heading} numberOfLines={1}>{entry.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={[type.small, { flexShrink: 1 }]} numberOfLines={1}>{entry.username || 'No username'}</Text>
            {issues.map((k) => <Tag key={k} text={ISSUE_LABEL[k]} tone={k === 'weak' ? 'danger' : 'warn'} />)}
          </View>
        </View>
      </Pressable>
      {onCopy ? <IconButton name="content-copy" label={`Copy password for ${entry.name}`} onPress={onCopy} /> : null}
      {onFavorite ? (
        <IconButton name={entry.favorite ? 'star' : 'star-border'} label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={onFavorite} color={entry.favorite ? colors.warn : colors.muted} />
      ) : null}
    </View>
  );
}
