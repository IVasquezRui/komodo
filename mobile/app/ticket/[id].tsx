import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTicket } from '../../lib/storage';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { QRTicket } from '../../components/QRTicket';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    const data = await getTicket(id as string);
    setTicket(data);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎫 Mi boleto Komodo\n${ticket?.ticket_number}\n${ticket?.origin} → ${ticket?.destination}\nAsiento: ${ticket?.seat_number}`,
      });
    } catch {}
  };

  if (!ticket) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.background} />
      </View>
    );
  }

  const isPending = ticket.sync_status === 'PENDING';
  const depDate = new Date(ticket.departure_at);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/trips')} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu Boleto</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Ticket card */}
        <View style={styles.ticketCard}>

          {/* Top: ruta */}
          <View style={styles.topSection}>
            <View style={styles.operatorBadge}>
              <Ionicons name="bus" size={14} color={theme.colors.primary} />
              <Text style={styles.operatorText}>{ticket.operator || 'Komodo Express'}</Text>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text style={styles.cityText}>{ticket.origin?.split('(')[0].trim()}</Text>
                <Text style={styles.terminalText}>{ticket.origin}</Text>
              </View>
              <View style={styles.arrowBlock}>
                <View style={styles.thinLine} />
                <Ionicons name="airplane" size={18} color={theme.colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
                <View style={styles.thinLine} />
              </View>
              <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
                <Text style={styles.cityText}>{ticket.destination?.split('(')[0].trim()}</Text>
                <Text style={styles.terminalText}>{ticket.destination}</Text>
              </View>
            </View>
          </View>

          {/* Puntos de rasgado */}
          <View style={styles.tearRow}>
            <View style={styles.tearCircleLeft} />
            <View style={styles.tearLine} />
            <View style={styles.tearCircleRight} />
          </View>

          {/* Meta details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailsRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>FECHA</Text>
                <Text style={styles.detailValue}>
                  {depDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>ASIENTO</Text>
                <Text style={styles.detailValue}>{ticket.seat_number}</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>TOTAL</Text>
                <Text style={styles.detailValue}>${ticket.amount_paid || '—'}</Text>
              </View>
            </View>

            <View style={styles.ticketNumber}>
              <Text style={styles.ticketNumberLabel}>Nº BOLETO</Text>
              <Text style={styles.ticketNumberValue}>{ticket.ticket_number || id}</Text>
            </View>
          </View>

          {/* QR section */}
          <View style={styles.qrSection}>
            <QRTicket value={ticket.qr_code_data || id as string} size={180} />
            <Text style={styles.qrInstruction}>Muestra esto al conductor</Text>
            {isPending && (
              <View style={styles.pendingBanner}>
                <Ionicons name="cloud-offline-outline" size={16} color="#D97706" />
                <Text style={styles.pendingText}>
                  Guardado offline · Se sincronizará con conexión
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  ticketCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  topSection: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  operatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
  },
  operatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityBlock: { flex: 1 },
  cityText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  terminalText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  arrowBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    flex: 1,
  },
  thinLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tearCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    marginLeft: -12,
  },
  tearLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  tearCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    marginRight: -12,
  },
  detailsSection: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  detailBlock: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  ticketNumber: {
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  ticketNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ticketNumberValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  qrSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  qrInstruction: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    gap: 8,
  },
  pendingText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
});
