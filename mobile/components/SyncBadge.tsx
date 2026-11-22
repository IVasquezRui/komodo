import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface SyncBadgeProps {
  status: 'SYNCED' | 'PENDING';
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({ status }) => {
  if (status === 'SYNCED') {
    return null; // Usually we don't show a badge if synced, or maybe a small green check
  }

  return (
    <View style={styles.badge}>
      <Ionicons name="cloud-offline-outline" size={14} color={theme.colors.accent} />
      <Text style={styles.text}>Pending Sync</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
});
