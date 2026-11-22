import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface SearchFormProps {
  origin: string;
  destination: string;
  date: string;
  travelers: number;
  onSearch: () => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ origin, destination, date, travelers, onSearch }) => {
  return (
    <View style={styles.searchCard}>
      <View style={styles.inputGroup}>
        <View style={styles.iconContainer}>
          <Ionicons name="radio-button-off" size={20} color={theme.colors.textMuted} />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>FROM</Text>
          <Text style={styles.value}>{origin}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.inputGroup}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={20} color={theme.colors.action} />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>TO</Text>
          <Text style={styles.value}>{destination}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
        </View>
        <View style={styles.halfInput}>
          <Ionicons name="people-outline" size={18} color={theme.colors.textMuted} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.label}>TRAVELERS</Text>
            <Text style={styles.value}>{travelers} {travelers === 1 ? 'Passenger' : 'Passengers'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Text style={styles.searchButtonText}>Search Routes</Text>
        <Ionicons name="arrow-forward" size={20} color={theme.colors.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  inputContainer: {
    marginLeft: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 40,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  halfInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  searchButton: {
    backgroundColor: theme.colors.action,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
