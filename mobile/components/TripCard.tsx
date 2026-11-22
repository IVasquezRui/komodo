import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface TripCardProps {
  id: string;
  originName: string;
  destName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  seatsLeft: number;
  operator: string;
  serviceClass: string;
  isFastSelling?: boolean;
  onSelect: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  id, originName, destName, departureTime, arrivalTime,
  duration, price, seatsLeft, operator, serviceClass,
  isFastSelling = false, onSelect
}) => {
  return (
    <View style={styles.card}>
      {/* Operator row */}
      <View style={styles.header}>
        <View style={styles.operatorRow}>
          <View style={styles.busIcon}>
            <Ionicons name="bus" size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.operatorText}>{operator}</Text>
            <Text style={styles.serviceClassText}>{serviceClass}</Text>
          </View>
        </View>
        <View style={styles.rightHeader}>
          {isFastSelling && (
            <View style={styles.fastSellingBadge}>
              <Ionicons name="flame" size={11} color="#fff" />
              <Text style={styles.fastSellingText}>Fast Selling</Text>
            </View>
          )}
          <Text style={styles.priceText}>${price}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timePoint}>
          <Text style={styles.timeText}>{departureTime}</Text>
          <Text style={styles.terminalText} numberOfLines={1}>{originName}</Text>
        </View>

        <View style={styles.durationContainer}>
          <View style={styles.durationDot} />
          <View style={styles.durationLine} />
          <Text style={styles.durationText}>{duration}</Text>
          <View style={styles.durationLine} />
          <View style={[styles.durationDot, { backgroundColor: theme.colors.action }]} />
        </View>

        <View style={[styles.timePoint, { alignItems: 'flex-end' }]}>
          <Text style={styles.timeText}>{arrivalTime}</Text>
          <Text style={styles.terminalText} numberOfLines={1}>{destName}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.seatsRow}>
          <Ionicons
            name="checkmark-circle"
            size={15}
            color={seatsLeft <= 5 ? '#F59E0B' : theme.colors.action}
          />
          <Text style={[styles.seatsText, seatsLeft <= 5 && styles.seatsTextWarning]}>
            {seatsLeft} asientos disponibles
          </Text>
        </View>
        <TouchableOpacity style={styles.selectButton} onPress={onSelect} activeOpacity={0.85}>
          <Text style={styles.selectButtonText}>Seleccionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  busIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  serviceClassText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  rightHeader: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fastSellingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  fastSellingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timePoint: {
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  terminalText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  durationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  durationText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    top: -14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceContainer,
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.action,
  },
  seatsTextWarning: {
    color: '#F59E0B',
  },
  selectButton: {
    backgroundColor: theme.colors.action,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  selectButtonText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
});
