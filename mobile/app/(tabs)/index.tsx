import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { SearchForm } from '../../components/SearchForm';
import { useAuth } from '../../lib/auth';
import { MOCK_RECENT_SEARCHES, POPULAR_ROUTES } from '../../lib/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const { userName } = useAuth();
  const [recentSearches] = useState(MOCK_RECENT_SEARCHES);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KM';

  const handleSearch = () => {
    router.push(
      `/search-results?origin=term_ccs&destination=term_mao&date=${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoRow}>
            <Ionicons name="bus" size={22} color={theme.colors.primary} />
            <Text style={styles.logoText}>Komodo</Text>
          </View>
          <Text style={styles.greeting}>
            {greeting()}, {userName?.split(' ')[0] || 'viajero'} 👋
          </Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>¿A dónde vas{'\n'}hoy?</Text>

      {/* Search Card */}
      <SearchForm
        origin="Caracas (La Bandera)"
        destination="Maracaibo"
        date="Hoy"
        travelers={1}
        onSearch={handleSearch}
      />

      {/* Rutas Populares */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rutas Populares</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {POPULAR_ROUTES.map((route, i) => (
            <TouchableOpacity key={i} style={styles.routeChip} onPress={handleSearch}>
              <Ionicons name="trending-up-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.routeChipText}>
                {route.from.city} → {route.to.city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Búsquedas Recientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Búsquedas Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.clearText}>Borrar</Text>
          </TouchableOpacity>
        </View>

        {recentSearches.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.recentCard}
            onPress={handleSearch}
          >
            <View style={styles.recentIconBox}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textMuted} />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentRoute}>
                {item.origin} → {item.destination}
              </Text>
              <Text style={styles.recentMeta}>
                {item.date} · {item.passengers} {item.passengers === 1 ? 'pasajero' : 'pasajeros'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  clearText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
  },
  routeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  recentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentRoute: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  recentMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
