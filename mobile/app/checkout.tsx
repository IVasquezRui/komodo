import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { saveTicket } from '../lib/storage';
import { confirmReservation, createPaymentApi } from '../lib/api';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateTicketNumber = () =>
  `KMD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

type PaymentMethodType = 'PAGO_MOVIL' | 'STRIPE' | 'CASH';

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { userId, userName } = useAuth();
  const [loading, setLoading] = useState(false);

  // Parse multi-seat parameters
  const rawSeatNums = (params.seatNums as string) || (params.seatNum as string) || '1';
  const seatNumsList = rawSeatNums.split(',').map((s) => s.trim());
  const rawSeatIds = (params.seatIds as string) || (params.seatId as string) || 'loc_seat';
  const seatIdsList = rawSeatIds.split(',').map((s) => s.trim());
  const seatCount = seatNumsList.length;

  const unitPrice = parseFloat((params.unitPrice as string) || (params.price as string) || '35.00');
  const totalPrice = parseFloat((params.price as string) || (unitPrice * seatCount).toFixed(2));
  const operator = (params.operator as string) || 'Komodo Express';

  // State for passenger details
  const [passengers, setPassengers] = useState(
    seatNumsList.map((sn, idx) => ({
      seatNumber: sn,
      seatId: seatIdsList[idx] || seatIdsList[0],
      fullName: idx === 0 ? userName || '' : '',
      docType: 'V',
      docNumber: '',
    }))
  );

  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('PAGO_MOVIL');
  const [paymentRef, setPaymentRef] = useState('');
  const [pagoMovilPhone, setPagoMovilPhone] = useState('0412-5551234');
  const [bankCode, setBankCode] = useState('0102');

  const updatePassenger = (index: number, field: string, value: string) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handlePurchase = async () => {
    // Validation
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].fullName.trim()) {
        Alert.alert('Datos requeridos', `Por favor ingresa el nombre para el asiento ${passengers[i].seatNumber}`);
        return;
      }
      if (!passengers[i].docNumber.trim()) {
        Alert.alert('Datos requeridos', `Por favor ingresa el documento para el asiento ${passengers[i].seatNumber}`);
        return;
      }
    }

    if (paymentMethod === 'PAGO_MOVIL' && !paymentRef.trim()) {
      Alert.alert('Referencia requerida', 'Por favor ingresa los dígitos de la referencia de Pago Móvil.');
      return;
    }

    setLoading(true);
    const idempotencyKey = generateUUID();
    const reference = paymentRef.trim() || `REF-${Date.now().toString().slice(-8)}`;

    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable !== false;

    let primaryTicketId = `loc_${idempotencyKey}`;

    try {
      // 1. Confirm reservation with Core if online
      if (isOnline) {
        try {
          const res = await confirmReservation({
            idempotency_key: idempotencyKey,
            user_id: userId || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            seat_id: seatIdsList[0],
            trip_id: params.tripId,
            amount_paid: totalPrice,
            currency: 'USD',
            payment_method: paymentMethod,
            payment_reference: reference,
            passengers: passengers.map((p) => ({
              full_name: p.fullName.trim(),
              doc_type: p.docType,
              doc_number: p.docNumber.trim(),
              passenger_type: 'ADULT',
              seat_number: parseInt(p.seatNumber) || 1,
            })),
          });
          primaryTicketId = res.id || primaryTicketId;

          // Register payment transaction in Core
          await createPaymentApi({
            reservation_id: res.id,
            provider: paymentMethod,
            amount: totalPrice,
            currency: 'USD',
            reference,
            phone_number: pagoMovilPhone,
            bank_code: bankCode,
          });
        } catch (apiErr) {
          console.log('Online reservation/payment failed, falling back to offline SQLite:', apiErr);
        }
      }

      // 2. Save individual tickets in SQLite for offline access
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        const ticketNum = generateTicketNumber();
        const tId = i === 0 ? primaryTicketId : `${primaryTicketId}_${i}`;
        const qrData = `KMD|${tId}|${p.seatNumber}|${p.docNumber}|CONFIRMED`;

        await saveTicket(
          {
            id: tId,
            trip_id: params.tripId,
            seat_number: p.seatNumber,
            origin: 'Caracas (Terminal La Bandera)',
            destination: 'Maracaibo (Terminal Principal)',
            departure_at: new Date(Date.now() + 86400000).toISOString(),
            qr_code_data: qrData,
            status: 'CONFIRMED',
            ticket_number: ticketNum,
            operator,
            service_class: 'Standard',
            amount_paid: unitPrice,
            idempotency_key: `${idempotencyKey}_${i}`,
            user_id: userId,
            seat_id: p.seatId,
            currency: 'USD',
          },
          isOnline ? 'SYNCED' : 'PENDING'
        );
      }

      if (!isOnline) {
        Alert.alert(
          '✈️ Guardado sin conexión',
          'Tus boletos están guardados de forma segura en tu teléfono y se sincronizarán al recuperar señal.',
          [{ text: 'Ver boletos', onPress: () => router.replace(`/ticket/${primaryTicketId}` as any) }]
        );
      } else {
        Alert.alert(
          '🎉 ¡Compra Exitosa!',
          `Se han emitido ${seatCount} boleto(s) confirmados para ${operator}.`,
          [{ text: 'Ver boletos', onPress: () => router.replace(`/ticket/${primaryTicketId}` as any) }]
        );
      }
    } catch {
      Alert.alert('Error', 'Ocurrió un problema guardando tu boleto. Inténtalo de nuevo.');
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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Ticket Summary Card */}
        <View style={styles.ticketCard}>
          <View style={styles.perfRow}>
            <View style={styles.perfCircleLeft} />
            <View style={styles.perfLine} />
            <View style={styles.perfCircleRight} />
          </View>

          <View style={styles.ticketBody}>
            {/* Route */}
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

            <View style={styles.ticketDivider} />

            {/* Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>OPERADORA</Text>
                <Text style={styles.detailValue}>{operator}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ASIENTO(S)</Text>
                <Text style={styles.detailValue}>{seatNumsList.join(', ')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PASAJEROS</Text>
                <Text style={styles.detailValue}>{seatCount}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>TARIFA UNITARIA</Text>
                <Text style={styles.detailValue}>${unitPrice.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalPrice}>${totalPrice.toFixed(2)} USD</Text>
            </View>
          </View>
        </View>

        {/* Passenger Information Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Datos de Pasajeros</Text>
          </View>

          {passengers.map((p, idx) => (
            <View key={idx} style={styles.passengerBox}>
              <View style={styles.passengerBadge}>
                <Text style={styles.passengerBadgeText}>Asiento {p.seatNumber}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre y Apellido *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Carlos Rodríguez"
                  placeholderTextColor={theme.colors.textMuted}
                  value={p.fullName}
                  onChangeText={(val) => updatePassenger(idx, 'fullName', val)}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { width: 90 }]}>
                  <Text style={styles.fieldLabel}>Tipo</Text>
                  <View style={styles.typeSelector}>
                    <Text style={styles.typeSelectorText}>{p.docType}</Text>
                  </View>
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Nro. de Documento / Cédula *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="18293847"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={p.docNumber}
                    onChangeText={(val) => updatePassenger(idx, 'docNumber', val)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Commercial Payment Methods */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Método de Pago</Text>
          </View>

          <View style={styles.methodsRow}>
            <TouchableOpacity
              style={[styles.methodChip, paymentMethod === 'PAGO_MOVIL' && styles.methodChipActive]}
              onPress={() => setPaymentMethod('PAGO_MOVIL')}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={paymentMethod === 'PAGO_MOVIL' ? theme.colors.background : theme.colors.primary}
              />
              <Text
                style={[
                  styles.methodChipText,
                  paymentMethod === 'PAGO_MOVIL' && styles.methodChipTextActive,
                ]}
              >
                Pago Móvil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodChip, paymentMethod === 'STRIPE' && styles.methodChipActive]}
              onPress={() => setPaymentMethod('STRIPE')}
            >
              <Ionicons
                name="card-outline"
                size={18}
                color={paymentMethod === 'STRIPE' ? theme.colors.background : theme.colors.primary}
              />
              <Text
                style={[styles.methodChipText, paymentMethod === 'STRIPE' && styles.methodChipTextActive]}
              >
                Tarjeta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodChip, paymentMethod === 'CASH' && styles.methodChipActive]}
              onPress={() => setPaymentMethod('CASH')}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={paymentMethod === 'CASH' ? theme.colors.background : theme.colors.primary}
              />
              <Text
                style={[styles.methodChipText, paymentMethod === 'CASH' && styles.methodChipTextActive]}
              >
                Taquilla
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pago Móvil Details */}
          {paymentMethod === 'PAGO_MOVIL' && (
            <View style={styles.paymentDetailsBox}>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Banco Destino:</Text>
                <Text style={styles.bankInfoValue}>0102 - Banco de Venezuela</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Teléfono Receptor:</Text>
                <Text style={styles.bankInfoValue}>0412-1234567</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>RIF / Cédula:</Text>
                <Text style={styles.bankInfoValue}>J-50123456-0</Text>
              </View>

              <View style={[styles.fieldGroup, { marginTop: 12 }]}>
                <Text style={styles.fieldLabel}>Número de Referencia Bancaria *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. 987654 (últimos dígitos)"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={paymentRef}
                  onChangeText={setPaymentRef}
                />
              </View>
            </View>
          )}

          {/* Stripe Details */}
          {paymentMethod === 'STRIPE' && (
            <View style={styles.paymentDetailsBox}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tarjeta de Crédito / Débito Internacional</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="•••• •••• •••• 4242"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Cash Details */}
          {paymentMethod === 'CASH' && (
            <View style={styles.paymentDetailsBox}>
              <Text style={styles.cashNoticeText}>
                Podrás abonar tus pasajes en efectivo al momento de abordar en la taquilla de la terminal.
              </Text>
            </View>
          )}
        </View>

        {/* Aviso de seguridad */}
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.action} />
          <Text style={styles.secureText}>Pago seguro · Cifrado bancario · Respaldo Offline</Text>
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
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={theme.colors.background} />
              <Text style={styles.payButtonText}>Pagar ${totalPrice.toFixed(2)} USD</Text>
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
  content: { padding: theme.spacing.lg, paddingBottom: 130 },
  ticketCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: theme.spacing.lg,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: theme.colors.surface,
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
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 8,
  },
  perfCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    marginRight: -12,
  },
  ticketBody: { padding: theme.spacing.xl },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: { flex: 1 },
  dotEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: theme.colors.primary,
    marginBottom: 6,
  },
  dotFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.action,
    marginBottom: 6,
  },
  routeLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },
  routeCity: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  routeTerminal: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  routeLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  routeLine: { width: 24, height: 1.5, backgroundColor: theme.colors.border },
  ticketDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  detailItem: { width: '45%' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '600' },
  totalPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  sectionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  passengerBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passengerBadge: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    marginBottom: 8,
  },
  passengerBadgeText: {
    color: theme.colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  typeSelector: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelectorText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  methodChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  methodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  methodChipTextActive: {
    color: theme.colors.background,
  },
  paymentDetailsBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bankInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bankInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cashNoticeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  secureText: { fontSize: 12, color: theme.colors.textMuted },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    paddingBottom: 36,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  payButton: {
    backgroundColor: theme.colors.action,
    borderRadius: theme.radius.xl,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
