import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

export interface Seat {
  id: string;
  number: string;
  status: 'AVAILABLE' | 'HELD' | 'SOLD';
}

interface SeatGridProps {
  seats: Seat[];
  selectedSeatId?: string | null;
  selectedSeatIds?: string[];
  onSelectSeat?: (seatId: string) => void;
  onToggleSeat?: (seatId: string) => void;
}

// Row labels: A, B (left) and C, D (right)
const COL_LABELS = ['A', 'B', '', 'C', 'D'];

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedSeatId,
  selectedSeatIds,
  onSelectSeat,
  onToggleSeat,
}) => {
  const isSeatSelected = (id: string) => {
    if (selectedSeatIds) return selectedSeatIds.includes(id);
    return selectedSeatId === id;
  };

  const handleSeatPress = (id: string) => {
    if (onToggleSeat) {
      onToggleSeat(id);
    } else if (onSelectSeat) {
      onSelectSeat(id);
    }
  };

  // Group into rows of 4 seats: [A, B, C, D]
  const rows: Seat[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  const rowNumber = (i: number) => i + 1;

  return (
    <View style={styles.busShell}>
      {/* Bus roof curve */}
      <View style={styles.busRoof}>
        <View style={styles.driverSection}>
          <View style={styles.steeringWheel}>
            <Ionicons name="radio-button-on" size={22} color={theme.colors.textMuted} />
          </View>
          <View style={styles.dashboardLine} />
        </View>
        <View style={styles.doorLabel}>
          <Ionicons name="enter-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.doorText}>PUERTA</Text>
        </View>
      </View>

      {/* Column header labels */}
      <View style={styles.colHeaderRow}>
        <View style={styles.rowNumPlaceholder} />
        {COL_LABELS.map((label, i) => (
          <View key={i} style={label === '' ? styles.aisleHeaderSpace : styles.colHeader}>
            <Text style={styles.colHeaderText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Seat rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.seatRow}>
          {/* Row number */}
          <View style={styles.rowNumBox}>
            <Text style={styles.rowNumText}>{rowNumber(rowIdx)}</Text>
          </View>

          {/* Left pair: A B */}
          {row.slice(0, 2).map((seat) => (
            <SeatButton
              key={seat.id}
              seat={seat}
              isSelected={isSeatSelected(seat.id)}
              onPress={() => handleSeatPress(seat.id)}
            />
          ))}

          {/* Aisle */}
          <View style={styles.aisle} />

          {/* Right pair: C D */}
          {row.slice(2, 4).map((seat) => (
            <SeatButton
              key={seat.id}
              seat={seat}
              isSelected={isSeatSelected(seat.id)}
              onPress={() => handleSeatPress(seat.id)}
            />
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={theme.colors.surfaceContainer} border={theme.colors.border} label="Disponible" />
        <LegendItem color={theme.colors.primary} border={theme.colors.primary} label="Seleccionado" />
        <LegendItem color="#F1F5F9" border="#E2E8F0" label="Ocupado" dimText />
      </View>
    </View>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const SeatButton = ({
  seat, isSelected, onPress,
}: { seat: Seat; isSelected: boolean; onPress: () => void }) => {
  const isSold = seat.status === 'SOLD' || seat.status === 'HELD';
  return (
    <TouchableOpacity
      style={[
        styles.seat,
        !isSold && !isSelected && styles.seatAvailable,
        isSelected && styles.seatSelected,
        isSold && styles.seatSold,
      ]}
      onPress={onPress}
      disabled={isSold}
      activeOpacity={0.75}
    >
      {isSold ? (
        <Ionicons name="close" size={16} color={theme.colors.textMuted} />
      ) : (
        <Text style={[styles.seatLabel, isSelected && styles.seatLabelSelected]}>
          {seat.number}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const LegendItem = ({
  color, border, label, dimText,
}: { color: string; border: string; label: string; dimText?: boolean }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color, borderColor: border }]} />
    <Text style={[styles.legendLabel, dimText && { color: theme.colors.textMuted }]}>{label}</Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const SEAT_SIZE = 50;
const SEAT_RADIUS = 10;

const styles = StyleSheet.create({
  busShell: {
    backgroundColor: theme.colors.background,
    borderRadius: 28,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
    width: '100%',
  },
  busRoof: {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  steeringWheel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardLine: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  doorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doorText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rowNumPlaceholder: {
    width: 24,
    marginRight: theme.spacing.sm,
  },
  colHeader: {
    width: SEAT_SIZE,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  aisleHeaderSpace: {
    width: 28,
  },
  colHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowNumBox: {
    width: 24,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  rowNumText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: SEAT_RADIUS,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatAvailable: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  seatSelected: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  seatSold: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  seatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  seatLabelSelected: {
    color: theme.colors.background,
  },
  aisle: {
    width: 28,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});
