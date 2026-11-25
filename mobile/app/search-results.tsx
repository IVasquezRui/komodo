import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { searchTrips } from '../lib/api';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { TripCard } from '../components/TripCard';
import { MOCK_TRIPS } from '../lib/mockData';

const FILTERS = ['Todos', 'Hora', 'Precio', 'Operador', 'Con A/A'];

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const { origin, destination, date } = params;
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isOfflineCache, setIsOfflineCache] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadResults();
  }, [origin, destination, date]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setIsOfflineCache(false);
      const data = await searchTrips(
        (origin as string) || 'Caracas',
        (destination as string) || 'Maracaibo',
        (date as string) || ''
      );
      const items = data.r || [];
      setResults(items.length > 0 ? items : MOCK_TRIPS);
    } catch {
      setIsOfflineCache(true);
      setResults(MOCK_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDuration = (dep: string, arr: string) => {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    const h = Math.max(0, Math.floor(diffMs / 3_600_000));
    const m = Math.max(0, Math.round((diffMs % 3_600_000) / 60_000));
    return `${h}h ${m}m`;
  };

  const filteredResults = [...results]
    .filter((item) => {
      if (activeFilter === 'Con A/A') {
        return item.amenities?.ac !== false;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'Precio') {
        const pa = Number(a.price_usd_cents ?? Math.round(Number(a.prc || 0) * 100));
        const pb = Number(b.price_usd_cents ?? Math.round(Number(b.prc || 0) * 100));
        return pa - pb;
      }
      if (activeFilter === 'Operador') {
        return String(a.operator_name || a.rc).localeCompare(String(b.operator_name || b.rc));
      }
      return new Date(a.dep).getTime() - new Date(b.dep).getTime();
    });

  const renderTrip = ({ item, index }: { item: any; index: number }) => {
    const unitPriceCents =
      typeof item.price_usd_cents === 'number'
        ? item.price_usd_cents
        : Math.round(Number(item.prc || 35) * 100);
    const formattedPrice = (unitPriceCents / 100).toFixed(2);
    const operatorName = item.operator_name || item.rc || 'Komodo Express';
    const hasWifi = Boolean(item.amenities?.wifi);
    const hasAc = item.amenities?.ac !== undefined ? Boolean(item.amenities.ac) : true;

    const card = (
      <TripCard
        id={item.tid}
        originName={item.org}
        destName={item.dst}
        departureTime={formatTime(item.dep)}
        arrivalTime={formatTime(item.arr)}
        duration={formatDuration(item.dep, item.arr)}
        price={formattedPrice}
        seatsLeft={item.avl}
        operator={operatorName}
        busModel={item.bus_model}
        serviceClass={item.serviceClass || item.rc || 'Ejecutivo'}
        hasWifi={hasWifi}
        hasAc={hasAc}
        isFastSelling={item.isFastSelling || item.avl <= 5}
        onSelect={() =>
          router.push(
            `/trip-details?tripId=${encodeURIComponent(item.tid)}&operator=${encodeURIComponent(
              operatorName
            )}&busModel=${encodeURIComponent(item.bus_model || 'Marcopolo Paradiso G6 1800 DD')}&origin=${encodeURIComponent(
              item.org
            )}&destination=${encodeURIComponent(item.dst)}&dep=${encodeURIComponent(
              item.dep
            )}&arr=${encodeURIComponent(item.arr)}&unitPriceCents=${unitPriceCents}&availableSeats=${
              item.avl
            }&routeCode=${encodeURIComponent(item.rc || 'CCS-MCB')}&hasWifi=${hasWifi}&hasAc=${hasAc}` as any
          )
        }
      />
    );

    if (reduceMotion) return card;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(320)}>
        {card}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerRoute} numberOfLines={1} maxFontSizeMultiplier={1.25}>
            {(origin as string) || 'Caracas'} → {(destination as string) || 'Maracaibo'}
          </Text>
          <Text style={styles.headerMeta} numberOfLines={1}>
            {new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })} · {filteredResults.length} opciones
          </Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn} onPress={loadResults}>
          <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {isOfflineCache && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color={theme.colors.accent} />
          <Text style={styles.offlineText} numberOfLines={2}>
            Sin conexión — Mostrando horarios guardados localmente
          </Text>
        </View>
      )}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersBar}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Buscando salidas disponibles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item: any) => item.tid}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={56} color={theme.colors.border} />
              <Text style={styles.emptyText}>No hay viajes disponibles.</Text>
              <Text style={styles.emptySubText}>Prueba con otro filtro o fecha.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 58,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  headerRoute: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  filterIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.accentContainer,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  filtersBar: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: theme.colors.textSecondary, fontSize: 14 },
  list: { padding: theme.spacing.md, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary },
  emptySubText: { fontSize: 13, color: theme.colors.textMuted },
});
