import React from 'react';
import { View, Pressable } from 'react-native';
import { Icon } from './ui';
import { colors, MAX_WIDTH } from '../theme';

// Sits at the bottom-right of the content column (not the far corner of a wide window).
export default function Fab({ onPress, label = 'Add password' }) {
  return (
    <View style={{ pointerEvents: 'box-none', position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' }}>
      <View style={{ pointerEvents: 'box-none', width: '100%', maxWidth: MAX_WIDTH, alignItems: 'flex-end', paddingHorizontal: 20 }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed, hovered }) => ({
            width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accent,
            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
            transform: [{ scale: hovered ? 1.05 : 1 }],
          })}
        >
          <Icon name="add" size={30} color={colors.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}
