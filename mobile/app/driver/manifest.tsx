import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { getTripManifestApi, manualBoardApi } from '../../lib/api';

interface ManifestPassenger {
  seatNumber: number;
  fullName: string;
  docType: string;
  docNumber: string;
  status: 'CONFIRMED' | 'BOARDED' | 'NO_SHOW';
  boardedAt?: string | null;
}

export default function DriverManifestScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOARDED'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock initial manifest if network is not connected
  const [passengers, setPassengers] = useState<ManifestPassenger[]>([
    { seatNumber: 1, fullName: 'Carlos Rodríguez', docType: 'V', docNumber: '18293847', status: 'BOARDED' },
    { seatNumber: 2, fullName: 'María García', docType: 'V', docNumber: '21948572', status: 'CONFIRMED' },
    { seatNumber: 3, fullName: 'Alejandro Mendoza', docType: 'V', docNumber: '15849302', status: 'BOARDED' },
    { seatNumber: 4, fullName: 'Valentina Silva', docType: 'P', docNumber: 'A1938495', status: 'CONFIRMED' },
    { seatNumber: 5, fullName: 'José Antonio Ramos', docType: 'V', docNumber: '12493820', status: 'CONFIRMED' },
    { seatNumber: 6, fullName: 'Daniela Colmenares', docType: 'V', docNumber: '25938471', status: 'BOARDED' },
    { seatNumber: 7, fullName: 'Pedro Morales', docType: 'V', docNumber: '19483920', status: 'CONFIRMED' },
    { seatNumber: 8, fullName: 'Lucía Fernández', docType: 'V', docNumber: '23948571', status: 'CONFIRMED' },
  ]);

  const tripInfo = {
    code: 'CCS-MCB-001',
    route: 'Caracas → Maracaibo',
    plate: 'ABC-123',
    departure: '08:00 AM · Hoy',
    busModel: 'Marcopolo G8 (40 Asientos)',
  };

  useEffect(() => {
    loadManifest();
  }, []);

  const loadManifest = async () => {
    try {
      const data = await getTripManifestApi('v0000001');
      if (data && data.passengers && data.passengers.length > 0) {
        setPassengers(
          data.passengers.map((p: any) => ({
            seatNumber: p.seat_number,
            fullName: p.full_name,
            docType: p.doc_type,
            docNumber: p.doc_number,
            status: p.status,
            boardedAt: p.boarded_at,
          }))
        );
      }
    } catch {
      // Keeps mock offline manifest
    } finally {
      setLoading(false);
    }
  };

  const handleManualBoard = async (seatNumber: number, name: string) => {
    try {
      await manualBoardApi({ trip_id: 'v0000001', seat_number: seatNumber });
      setPassengers((prev) =>
        prev.map((p) => (p.seatNumber === seatNumber ? { ...p, status: 'BOARDED' } : p))
      );
      Alert.alert('✅ Pasajero Abordado', `${name} (Asiento #${seatNumber}) registrado a bordo.`);
    } catch {
      // Fallback local update
      setPassengers((prev) =>
        prev.map((p) => (p.seatNumber === seatNumber ? { ...p, status: 'BOARDED' } : p))
      );
      Alert.alert('✅ Abordado Localmente', `${name} registrado a bordo sin conexión.`);
    }
  };

  const boardedCount = passengers.filter((p) => p.status === 'BOARDED').length;
  const totalCount = passengers.length;
  const progressPercent = Math.round((boardedCount / Math.max(1, totalCount)) * 100);

  const filteredPassengers = passengers.filter((p) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'BOARDED' && p.status === 'BOARDED') ||
      (filter === 'PENDING' && p.status !== 'BOARDED');

    const matchesSearch =
      search === '' ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.docNumber.includes(search) ||
      p.seatNumber.toString() === search.trim();

    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manifiesto de Pasajeros</Text>
          <Text style={styles.headerSub}>{tripInfo.code} · {tripInfo.route}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/driver/scanner' as any)}
          style={styles.scanBtn}
        >
          <Ionicons name="scan" size={20} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>CONTROL DE ABORDAJE</Text>
              <Text style={styles.progressValue}>
                {boardedCount} de {totalCount} a bordo
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.tripMetaRow}>
            <View style={styles.tripMetaItem}>
              <Ionicons name="bus-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.tripMetaText}>Unidad: {tripInfo.plate}</Text>
            </View>
            <View style={styles.tripMetaItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.tripMetaText}>Salida: {tripInfo.departure}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, cédula o asiento..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
              Todos ({totalCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'PENDING' && styles.filterPillActive]}
            onPress={() => setFilter('PENDING')}
          >
            <Text style={[styles.filterText, filter === 'PENDING' && styles.filterTextActive]}>
              Por abordar ({totalCount - boardedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'BOARDED' && styles.filterPillActive]}
            onPress={() => setFilter('BOARDED')}
          >
            <Text style={[styles.filterText, filter === 'BOARDED' && styles.filterTextActive]}>
              Abordados ({boardedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Passenger List */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.passengerList}>
            {filteredPassengers.map((p) => {
              const isBoarded = p.status === 'BOARDED';
              return (
                <View key={p.seatNumber} style={styles.passengerCard}>
                  <View style={[styles.seatCircle, isBoarded && styles.seatCircleBoarded]}>
                    <Text style={[styles.seatNumberText, isBoarded && styles.seatNumberTextBoarded]}>
                      #{p.seatNumber}
                    </Text>
                  </View>

                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{p.fullName}</Text>
                    <Text style={styles.passengerDoc}>
                      {p.docType}-{p.docNumber}
                    </Text>
                  </View>

                  {isBoarded ? (
                    <View style={styles.boardedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.action} />
                      <Text style={styles.boardedText}>A bordo</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.manualCheckInBtn}
                      onPress={() => handleManualBoard(p.seatNumber, p.fullName)}
                    >
                      <Ionicons name="hand-right-outline" size={14} color={theme.colors.background} />
                      <Text style={styles.manualCheckInText}>Abordar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  headerSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  progressCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },
  progressValue: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
  progressBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  progressBadgeText: { fontSize: 15, fontWeight: '800', color: theme.colors.action },
  progressBarTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.action,
    borderRadius: 4,
  },
  tripMetaRow: { flexDirection: 'row', gap: 16 },
  tripMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText: { fontSize: 12, color: theme.colors.textSecondary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: theme.colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  filterTextActive: { color: theme.colors.background },
  passengerList: { gap: 10 },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  seatCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatCircleBoarded: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  seatNumberText: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary },
  seatNumberTextBoarded: { color: theme.colors.action },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  passengerDoc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  boardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  boardedText: { fontSize: 12, fontWeight: '700', color: theme.colors.action },
  manualCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
  },
  manualCheckInText: { fontSize: 12, fontWeight: '700', color: theme.colors.background },
});
