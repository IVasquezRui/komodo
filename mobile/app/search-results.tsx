import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { searchTrips } from '../lib/api';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { TripCard } from '../components/TripCard';
import { MOCK_TRIPS } from '../lib/mockData';

const FILTERS = ['Todos', 'Hora', 'Precio', 'Operador'];

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const { origin, destination, date } = params;
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');

  useEffect(() => {
    loadResults();
  }, [origin, destination, date]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await searchTrips(origin as string, destination as string, date as string);
      setResults(data.r || []);
    } catch {
      // Backend no disponible → usar mock data
      setResults(MOCK_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDuration = (dep: string, arr: string) => {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.round((diffMs % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  };

  const renderTrip = ({ item }: { item: any }) => (
    <TripCard
      id={item.tid}
      originName={item.org}
      destName={item.dst}
      departureTime={formatTime(item.dep)}
      arrivalTime={formatTime(item.arr)}
      duration={formatDuration(item.dep, item.arr)}
      price={item.prc}
      seatsLeft={item.avl}
      operator={item.rc}
      serviceClass={item.serviceClass || 'Standard'}
      isFastSelling={item.isFastSelling || item.avl < 5}
      onSelect={() =>
        router.push(`/select-seat?tripId=${item.tid}&price=${item.prc}&operator=${item.rc}`)
      }
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerRoute}>Caracas → Maracaibo</Text>
          <Text style={styles.headerMeta}>
            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · 1 Pasajero
          </Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

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
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Buscando viajes...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: any) => item.tid}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={56} color={theme.colors.border} />
              <Text style={styles.emptyText}>No hay viajes disponibles.</Text>
              <Text style={styles.emptySubText}>Prueba con otra fecha.</Text>
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
    paddingTop: 60,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainer,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersBar: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    maxHeight: 56,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.background,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: theme.colors.textSecondary, fontSize: 14 },
  list: { padding: theme.spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary },
  emptySubText: { fontSize: 13, color: theme.colors.textMuted },
});
