import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { AnimatedButton } from './AnimatedButton';

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
  busModel?: string;
  serviceClass: string;
  hasWifi?: boolean;
  hasAc?: boolean;
  isFastSelling?: boolean;
  onSelect: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  originName,
  destName,
  departureTime,
  arrivalTime,
  duration,
  price,
  seatsLeft,
  operator,
  busModel,
  serviceClass,
  hasWifi = false,
  hasAc = true,
  isFastSelling = false,
  onSelect,
}) => {
  return (
    <View style={styles.card}>
      {/* Operator row */}
      <View style={styles.header}>
        <View style={styles.operatorRow}>
          <View style={styles.busIcon}>
            <Ionicons name="bus" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorText} numberOfLines={1} maxFontSizeMultiplier={1.25}>
              {operator}
            </Text>
            <Text style={styles.serviceClassText} numberOfLines={1} maxFontSizeMultiplier={1.25}>
              {busModel ? `${busModel} · ${serviceClass}` : serviceClass}
            </Text>
          </View>
        </View>
        <View style={styles.rightHeader}>
          {isFastSelling && (
            <View style={styles.fastSellingBadge}>
              <Ionicons name="flame" size={11} color="#fff" />
              <Text style={styles.fastSellingText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                Últimos cupos
              </Text>
            </View>
          )}
          <Text style={styles.priceText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            ${price}
          </Text>
          <Text style={styles.currencyLabel}>USD</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timePoint}>
          <Text style={styles.timeText}>{departureTime}</Text>
          <Text style={styles.terminalText} numberOfLines={1}>
            {originName}
          </Text>
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
          <Text style={styles.terminalText} numberOfLines={1}>
            {destName}
          </Text>
        </View>
      </View>

      {/* Minimalist Amenities Row */}
      <View style={styles.amenitiesRow}>
        <View style={[styles.amenityChip, hasAc ? styles.amenityActive : styles.amenityInactive]}>
          <Ionicons
            name="snow-outline"
            size={12}
            color={hasAc ? theme.colors.info : theme.colors.textMuted}
          />
          <Text
            style={[styles.amenityText, { color: hasAc ? theme.colors.textPrimary : theme.colors.textMuted }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {hasAc ? 'A/A' : 'Sin A/A'}
          </Text>
        </View>
        <View style={[styles.amenityChip, hasWifi ? styles.amenityActive : styles.amenityInactive]}>
          <Ionicons
            name="wifi-outline"
            size={12}
            color={hasWifi ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text
            style={[styles.amenityText, { color: hasWifi ? theme.colors.textPrimary : theme.colors.textMuted }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {hasWifi ? 'WiFi' : 'Sin WiFi'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.seatsRow}>
          <Ionicons
            name="checkmark-circle"
            size={15}
            color={seatsLeft <= 5 ? theme.colors.accent : theme.colors.action}
          />
          <Text
            style={[styles.seatsText, seatsLeft <= 5 && styles.seatsTextWarning]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.25}
          >
            {seatsLeft} disponibles
          </Text>
        </View>
        <AnimatedButton
          label="Ver viaje"
          variant="cta"
          onPress={onSelect}
          style={styles.selectButton}
          textStyle={styles.selectButtonText}
          rightIcon={<Ionicons name="chevron-forward" size={16} color="#FFFFFF" />}
        />
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
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  operatorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  operatorInfo: {
    flex: 1,
  },
  busIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    gap: 2,
  },
  fastSellingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    marginBottom: 2,
  },
  fastSellingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  priceText: {
    fontSize: 21,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  currencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timePoint: {
    flex: 1,
  },
  timeText: {
    fontSize: 19,
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
    height: 1.5,
    backgroundColor: theme.colors.border,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    top: -15,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  amenityActive: {
    backgroundColor: theme.colors.surfaceSlate,
    borderColor: theme.colors.border,
  },
  amenityInactive: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSlate,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceContainer,
    gap: 10,
  },
  seatsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seatsText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.actionHover,
  },
  seatsTextWarning: {
    color: theme.colors.accent,
  },
  selectButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.xl,
  },
  selectButtonText: {
    fontSize: 13,
  },
});
