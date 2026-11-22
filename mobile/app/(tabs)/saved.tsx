import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SAVED_ROUTES } from '../../lib/mockData';

export default function SavedScreen() {
  const router = useRouter();

  const renderSaved = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(tabs)')}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name="bookmark" size={18} color={theme.colors.accent} />
        </View>
        <View>
          <Text style={styles.routeText}>
            {item.origin} → {item.destination}
          </Text>
          <Text style={styles.routeMeta}>
            {item.frequency} · {item.avgPrice}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.classBadge}>
          <Text style={styles.classBadgeText}>{item.serviceClass}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guardados</Text>
        <Text style={styles.subtitle}>Tus rutas favoritas</Text>
      </View>

      <FlatList
        data={MOCK_SAVED_ROUTES}
        keyExtractor={(item) => item.id}
        renderItem={renderSaved}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={64} color={theme.colors.border} />
            <Text style={styles.emptyTitle}>Nada guardado aún</Text>
            <Text style={styles.emptySubtitle}>
              Toca el ♥ en cualquier viaje para añadirlo aquí.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  list: { padding: theme.spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  routeMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 8 },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
