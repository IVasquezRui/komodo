import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { saveTicket } from '../lib/storage';
import { confirmReservation } from '../lib/api';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

// Generar un UUID simple para idempotency (sin expo-crypto)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const generateTicketNumber = () =>
  `KMD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);

  const price = parseFloat((params.price as string) || '35.00');
  const operator = (params.operator as string) || 'Komodo Express';
  const seatNum = params.seatNum as string;

  const handlePurchase = async () => {
    setLoading(true);
    const idempotencyKey = generateUUID();
    const ticketNumber = generateTicketNumber();

    const payload = {
      idempotency_key: idempotencyKey,
      user_id: userId,
      seat_id: params.seatId,
      trip_id: params.tripId,
      amount_paid: price,
      currency: 'USD',
    };

    try {
      let syncStatus: 'SYNCED' | 'PENDING' = 'PENDING';
      let ticketId = `loc_${idempotencyKey}`;
      let qrData = `OFFLINE_QR_${ticketId}`;

      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable !== false;

      if (isOnline) {
        try {
          const res = await confirmReservation(payload);
          ticketId = res.id || ticketId;
          qrData = res.qr_code_data || `KMD|${ticketId}|${seatNum}|CONFIRMED`;
          syncStatus = 'SYNCED';
        } catch {
          // Backend caído → modo offline
        }
      }

      await saveTicket({
        id: ticketId,
        trip_id: params.tripId,
        seat_number: seatNum,
        origin: 'Caracas (La Bandera)',
        destination: 'Maracaibo',
        departure_at: new Date().toISOString(),
        qr_code_data: qrData,
        status: 'CONFIRMED',
        ticket_number: ticketNumber,
        operator,
        service_class: 'Standard',
        amount_paid: price,
        idempotency_key: idempotencyKey,
        user_id: userId,
        seat_id: params.seatId,
        currency: 'USD',
      }, syncStatus);

      if (!isOnline) {
        Alert.alert(
          '✈️ Guardado sin conexión',
          'Tu boleto está seguro en tu dispositivo y se sincronizará cuando vuelvas a tener internet.',
          [{ text: 'Ver boleto', onPress: () => router.replace(`/ticket/${ticketId}`) }]
        );
      } else {
        router.replace(`/ticket/${ticketId}`);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la compra. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar compra</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Ticket card */}
        <View style={styles.ticketCard}>
          {/* Puntos de rasgado */}
          <View style={styles.perfRow}>
            <View style={styles.perfCircleLeft} />
            <View style={styles.perfLine} />
            <View style={styles.perfCircleRight} />
          </View>

          <View style={styles.ticketBody}>
            {/* Ruta */}
            <View style={styles.routeSection}>
              <View style={styles.routePoint}>
                <View style={styles.dotEmpty} />
                <View>
                  <Text style={styles.routeLabel}>ORIGEN</Text>
                  <Text style={styles.routeCity}>Caracas</Text>
                  <Text style={styles.routeTerminal}>Terminal La Bandera</Text>
                </View>
              </View>

              <View style={styles.routeLineContainer}>
                <View style={styles.routeLine} />
                <Ionicons name="bus" size={22} color={theme.colors.primary} />
                <View style={styles.routeLine} />
              </View>

              <View style={styles.routePoint}>
                <View style={styles.dotFilled} />
                <View>
                  <Text style={styles.routeLabel}>DESTINO</Text>
                  <Text style={styles.routeCity}>Maracaibo</Text>
                  <Text style={styles.routeTerminal}>Terminal Principal</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.ticketDivider} />

            {/* Detalles */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>OPERADORA</Text>
                <Text style={styles.detailValue}>{operator}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ASIENTO</Text>
                <Text style={styles.detailValue}>{seatNum}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>CLASE</Text>
                <Text style={styles.detailValue}>Standard</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PASAJEROS</Text>
                <Text style={styles.detailValue}>1</Text>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalPrice}>${price.toFixed(2)} USD</Text>
            </View>
          </View>
        </View>

        {/* Aviso de seguridad */}
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.action} />
          <Text style={styles.secureText}>Pago seguro · Offline-first · Sin doble cobro</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.payButtonText}>Confirmar y Pagar ${price.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
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
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
  content: { padding: theme.spacing.lg, paddingBottom: 120 },
  ticketCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: -12,
  },
  perfCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginLeft: -12,
  },
  perfLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  perfCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginRight: -12,
  },
  ticketBody: { padding: theme.spacing.xl },
  routeSection: { gap: theme.spacing.md },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dotEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginTop: 3,
  },
  dotFilled: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.action,
    marginTop: 3,
  },
  routeLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },
  routeCity: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  routeTerminal: { fontSize: 12, color: theme.colors.textSecondary },
  routeLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    gap: 8,
  },
  routeLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  ticketDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginVertical: theme.spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailItem: { flex: 1, minWidth: '40%' },
  detailLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.5 },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.lg,
  },
  secureText: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  payButton: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontWeight: '700', fontSize: 16, color: theme.colors.textPrimary },
});
