import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import {
  calculateTotalUsdCents,
  clampSeatQuantity,
  DEFAULT_MAX_SEATS_PER_BOOKING,
  evaluatePurchaseTransition,
  formatUsdFromCents,
  SeatSelectionNavParams,
} from '../lib/pricing';
import { AnimatedButton } from './AnimatedButton';

export interface SeatQuantitySheetProps {
  visible: boolean;
  tripId: string;
  operatorName: string;
  unitPriceUsdCents: number;
  availableSeats: number;
  maxSeatsPerBooking?: number;
  onClose: () => void;
  onConfirm: (params: SeatSelectionNavParams) => void;
}

/**
 * Panel inferior interactivo (8.1#) para elegir cantidad de asientos (1..min(6, disponibles)),
 * calcular el monto total USD en tiempo real usando centavos enteros y validar conectividad.
 */
export const SeatQuantitySheet: React.FC<SeatQuantitySheetProps> = ({
  visible,
  tripId,
  operatorName,
  unitPriceUsdCents,
  availableSeats,
  maxSeatsPerBooking = DEFAULT_MAX_SEATS_PER_BOOKING,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(1);
  const [checkingNet, setCheckingNet] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const bounds = clampSeatQuantity(quantity, availableSeats, maxSeatsPerBooking);
  const totalCents = calculateTotalUsdCents(unitPriceUsdCents, bounds.quantity);

  useEffect(() => {
    if (visible) {
      setOfflineNotice(null);
      setQuantity((prev) => clampSeatQuantity(prev, availableSeats, maxSeatsPerBooking).quantity || 1);
    }
  }, [visible, availableSeats, maxSeatsPerBooking]);

  const triggerStepHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(8);
      } catch {
        // Ignore if vibrator unavailable
      }
    }
  };

  const handleDecrement = () => {
    if (bounds.quantity <= bounds.minAllowed) return;
    triggerStepHaptic();
    setOfflineNotice(null);
    setQuantity((prev) =>
      clampSeatQuantity(prev - 1, availableSeats, maxSeatsPerBooking).quantity
    );
  };

  const handleIncrement = () => {
    if (bounds.quantity >= bounds.maxAllowed) return;
    triggerStepHaptic();
    setOfflineNotice(null);
    setQuantity((prev) =>
      clampSeatQuantity(prev + 1, availableSeats, maxSeatsPerBooking).quantity
    );
  };

  const handleConfirm = async () => {
    setCheckingNet(true);
    setOfflineNotice(null);
    try {
      const net = await NetInfo.fetch();
      const isOnline =
        Platform.OS === 'web'
          ? typeof navigator !== 'undefined'
            ? navigator.onLine
            : true
          : Boolean(net.isConnected && net.isInternetReachable !== false);

      const outcome = evaluatePurchaseTransition({
        isOnline,
        tripId,
        seatQuantity: bounds.quantity,
        unitPriceUsdCents,
        availableSeats,
        operator: operatorName,
      });

      if (!outcome.allowed) {
        setOfflineNotice(outcome.errorMessage);
        return;
      }

      onConfirm(outcome.params);
    } finally {
      setCheckingNet(false);
    }
  };

  const atMin = bounds.quantity <= bounds.minAllowed;
  const atMax = bounds.quantity >= bounds.maxAllowed;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.title} maxFontSizeMultiplier={1.25}>
                ¿Cuántos asientos deseas comprar?
              </Text>
              <Text style={styles.subtitle} numberOfLines={1} maxFontSizeMultiplier={1.25}>
                {operatorName} · {availableSeats} disponibles
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stepper Control */}
          <View style={styles.stepperCard}>
            <TouchableOpacity
              testID="seat-qty-decrement"
              accessibilityRole="button"
              accessibilityLabel="Disminuir cantidad de asientos"
              accessibilityState={{ disabled: atMin }}
              disabled={atMin}
              onPress={handleDecrement}
              style={[styles.stepBtn, atMin && styles.stepBtnDisabled]}
            >
              <Ionicons
                name="remove"
                size={22}
                color={atMin ? theme.colors.textMuted : theme.colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.qtyCenter}>
              <Text style={styles.qtyNumber} maxFontSizeMultiplier={1.2}>
                {bounds.quantity}
              </Text>
              <Text style={styles.qtyCaption} maxFontSizeMultiplier={1.25}>
                {bounds.quantity === 1 ? 'Asiento' : 'Asientos'}
              </Text>
            </View>

            <TouchableOpacity
              testID="seat-qty-increment"
              accessibilityRole="button"
              accessibilityLabel="Aumentar cantidad de asientos"
              accessibilityState={{ disabled: atMax }}
              disabled={atMax}
              onPress={handleIncrement}
              style={[styles.stepBtn, atMax && styles.stepBtnDisabled]}
            >
              <Ionicons
                name="add"
                size={22}
                color={atMax ? theme.colors.textMuted : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Max Limit Reason */}
          {bounds.limitReason && (
            <View style={styles.limitBanner}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.limitText} maxFontSizeMultiplier={1.25}>
                {bounds.limitReason}
              </Text>
            </View>
          )}

          {/* Real-time USD Breakdown (Integer Cents) */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel} maxFontSizeMultiplier={1.25}>
                Cálculo ({formatUsdFromCents(unitPriceUsdCents, false)} × {bounds.quantity})
              </Text>
              <Text style={styles.breakdownSubTotal} maxFontSizeMultiplier={1.25}>
                {formatUsdFromCents(totalCents)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel} maxFontSizeMultiplier={1.25}>
                Monto Total Estimado
              </Text>
              <Text style={styles.totalValue} maxFontSizeMultiplier={1.2}>
                {formatUsdFromCents(totalCents)}
              </Text>
            </View>
          </View>

          {/* Non-destructive Offline Guard */}
          {offlineNotice && (
            <View style={styles.offlineCard}>
              <View style={styles.offlineHeader}>
                <Ionicons name="cloud-offline-outline" size={18} color={theme.colors.accent} />
                <Text style={styles.offlineTitle}>Modo sin conexión</Text>
              </View>
              <Text style={styles.offlineDesc}>{offlineNotice}</Text>
            </View>
          )}

          {/* Confirm CTA */}
          <AnimatedButton
            testID="seat-qty-confirm"
            label={offlineNotice ? 'Reintentar' : 'Continuar al mapa 2D'}
            variant="cta"
            loading={checkingNet}
            disabled={bounds.quantity <= 0}
            onPress={handleConfirm}
            style={styles.confirmBtn}
            rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 15, 38, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxxl,
    borderTopRightRadius: theme.radius.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {
    borderColor: theme.colors.borderSlate,
    backgroundColor: theme.colors.surfaceMuted,
    opacity: 0.5,
  },
  qtyCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  qtyNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  qtyCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    marginBottom: 12,
  },
  limitText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDeep,
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceSlate,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSlate,
    padding: 16,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  breakdownSubTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  offlineCard: {
    backgroundColor: theme.colors.accentContainer,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    padding: 12,
    marginBottom: 14,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  offlineDesc: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  confirmBtn: {
    minHeight: 50,
    borderRadius: theme.radius.xl,
  },
});
