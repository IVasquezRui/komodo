import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getUpcomingTickets, getPastTickets } from '../../lib/storage';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { SyncBadge } from '../../components/SyncBadge';

type TabType = 'upcoming' | 'past';

export default function TripsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [])
  );

  const loadTickets = async () => {
    const [upcomingData, pastData] = await Promise.all([
      getUpcomingTickets(),
      getPastTickets(),
    ]);
    setUpcoming(upcomingData as any[]);
    setPast(pastData as any[]);
  };

  const tickets = activeTab === 'upcoming' ? upcoming : past;

  const renderTicket = ({ item }: { item: any }) => {
    const depDate = new Date(item.departure_at);
    const isPast = activeTab === 'past';

    return (
      <TouchableOpacity
        style={[styles.ticketCard, isPast && styles.ticketCardPast]}
        onPress={() => router.push(`/ticket/${item.id}`)}
        activeOpacity={0.85}
      >
        {/* Top strip: ruta + badge */}
        <View style={styles.ticketTop}>
          <View style={styles.operatorTag}>
            <Ionicons name="bus" size={13} color={theme.colors.primary} />
            <Text style={styles.operatorTagText}>{item.operator || 'Komodo Express'}</Text>
          </View>
          <SyncBadge status={item.sync_status} />
        </View>

        {/* Ruta */}
        <Text style={styles.routeText}>
          {item.origin} → {item.destination}
        </Text>

        {/* Divider */}
        <View style={styles.ticketDivider} />

        {/* Detalle */}
        <View style={styles.ticketMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>FECHA</Text>
            <Text style={styles.metaValue}>
              {depDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ASIENTO</Text>
            <Text style={styles.metaValue}>{item.seat_number}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TOTAL</Text>
            <Text style={styles.metaValue}>${item.amount_paid || '—'}</Text>
          </View>
          <View style={styles.qrIcon}>
            <Ionicons name="qr-code" size={28} color={isPast ? theme.colors.textMuted : theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Viajes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['upcoming', 'past'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'upcoming' ? 'Próximos' : 'Pasados'}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        contentContainerStyle={[styles.list, tickets.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color={theme.colors.border} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'Sin próximos viajes' : 'Sin viajes pasados'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming' ? 'Reserva tu primer viaje hoy.' : 'Aquí aparecerán tus viajes completados.'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.bookBtnText}>Buscar viaje</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* FAB */}
      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color={theme.colors.textPrimary} />
          <Text style={styles.fabText}>Nuevo viaje</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
  },
  tabBtn: {
    paddingVertical: 14,
    marginRight: theme.spacing.xl,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
  list: { padding: theme.spacing.md },
  listEmpty: { flex: 1 },
  ticketCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  ticketCardPast: {
    opacity: 0.7,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  operatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  operatorTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  routeText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.3,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.md,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  qrIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bookBtn: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.xl,
  },
  bookBtnText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radius.full,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  fabText: {
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
});
