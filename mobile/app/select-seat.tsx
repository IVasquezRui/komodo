import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTripSeats, holdSeat } from '../lib/api';
import { useAuth } from '../lib/auth';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { SeatGrid, Seat } from '../components/SeatGrid';
import { generateMockSeats } from '../lib/mockData';
import {
  calculateTotalUsdCents,
  clampSeatQuantity,
  formatUsdFromCents,
} from '../lib/pricing';
import { AnimatedButton } from '../components/AnimatedButton';

export default function SelectSeatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useAuth();

  const requestedQty = clampSeatQuantity(
    parseInt((params.seatQuantity as string) || '4', 10) || 4,
    40,
    6
  ).quantity;
  const unitPriceUsdCents = Math.max(
    100,
    parseInt((params.unitPriceUsdCents as string) || '', 10) ||
      Math.round(parseFloat((params.price as string) || '35.00') * 100)
  );
  const incomingIdempotencyKey = (params.idempotencyKey as string) || '';
  const draftBookingId = (params.draftBookingId as string) || '';

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holding, setHolding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animación del footer cuando se selecciona al menos un asiento
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSeats();
  }, []);

  useEffect(() => {
    Animated.spring(footerAnim, {
      toValue: selectedSeats.length > 0 ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [selectedSeats]);

  const loadSeats = async () => {
    try {
      const trip = await getTripSeats(params.tripId as string);
      const mapped: Seat[] = (trip.seats || []).map((s: any) => ({
        id: s.id,
        number: s.seat_number.toString(),
        status: s.status,
      }));
      setSeats(mapped.length > 0 ? mapped : generateMockSeats(params.tripId as string));
    } catch {
      setSeats(generateMockSeats(params.tripId as string));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeat = (id: string) => {
    const seat = seats.find((s) => s.id === id);
    if (!seat || seat.status === 'SOLD') return;

    setSelectedSeats((prev) => {
      const alreadySelected = prev.some((s) => s.id === id);
      if (alreadySelected) {
        return prev.filter((s) => s.id !== id);
      }
      if (prev.length >= requestedQty) {
        Alert.alert(
          'Límite de asientos',
          `Elegiste ${requestedQty} ${requestedQty === 1 ? 'asiento' : 'asientos'}. Deselecciona uno para cambiar tu elección.`
        );
        return prev;
      }
      return [...prev, seat];
    });
  };

  const handleHoldSeat = async () => {
    if (selectedSeats.length === 0) return;
    setHolding(true);
    try {
      // Hold each seat concurrently
      await Promise.all(
        selectedSeats.map(async (seat) => {
          try {
            await holdSeat(params.tripId as string, parseInt(seat.number), userId || 'user_guest');
          } catch {
            // Tolerate network failure in demo/offline mode
          }
        })
      );

      const seatIds = selectedSeats.map((s) => s.id).join(',');
      const seatNums = selectedSeats.map((s) => s.number).join(',');
      const totalCents = calculateTotalUsdCents(unitPriceUsdCents, selectedSeats.length);
      const unitDollars = (unitPriceUsdCents / 100).toFixed(2);
      const totalDollars = (totalCents / 100).toFixed(2);

      router.push(
        `/checkout?tripId=${params.tripId}&seatIds=${seatIds}&seatNums=${seatNums}&price=${totalDollars}&unitPrice=${unitDollars}&unitPriceUsdCents=${unitPriceUsdCents}&totalUsdCents=${totalCents}&count=${selectedSeats.length}&idempotencyKey=${encodeURIComponent(
          incomingIdempotencyKey
        )}&draftBookingId=${encodeURIComponent(draftBookingId)}&operator=${encodeURIComponent(
          (params.operator as string) || 'Komodo Express'
        )}` as any
      );
    } catch {
      Alert.alert('Error', 'No se pudieron reservar los asientos seleccionados. Inténtalo de nuevo.');
    } finally {
      setHolding(false);
    }
  };

  const footerTranslate = footerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const totalUsdCents = calculateTotalUsdCents(unitPriceUsdCents, Math.max(1, selectedSeats.length));
  const totalPriceFormatted = formatUsdFromCents(totalUsdCents, false);
  const operator = (params.operator as string) || 'Komodo Express';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Elige tu asiento</Text>
          <Text style={styles.headerSub}>{operator}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Seat map */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Cargando mapa de asientos...</Text>
          </View>
        ) : (
          <SeatGrid
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onToggleSeat={handleToggleSeat}
          />
        )}

        {/* Selected summary */}
        {selectedSeats.length > 0 && (
          <View style={styles.selectionInfo}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.action} />
            <Text style={styles.selectionText}>
              {selectedSeats.length === 1 ? 'Asiento' : 'Asientos'}{' '}
              <Text style={styles.selectionBold}>{selectedSeats.map((s) => s.number).join(', ')}</Text>{' '}
              seleccionado{selectedSeats.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Animated sticky footer */}
      <Animated.View
        style={[
          styles.footer,
          { transform: [{ translateY: footerTranslate }], opacity: footerAnim },
        ]}
      >
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>
            TOTAL ({selectedSeats.length}/{requestedQty} PASAJE{selectedSeats.length > 1 ? 'S' : ''})
          </Text>
          <Text style={styles.footerPrice}>
            {totalPriceFormatted} <Text style={styles.footerCurrency}>USD</Text>
          </Text>
        </View>
        <AnimatedButton
          label="Continuar"
          variant="cta"
          loading={holding}
          disabled={selectedSeats.length === 0 || holding}
          onPress={handleHoldSeat}
          style={styles.continueBtn}
          rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loader: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.action,
    alignSelf: 'stretch',
  },
  selectionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  selectionBold: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  footerLeft: { gap: 2 },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  footerCurrency: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.action,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  continueBtnText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
});
