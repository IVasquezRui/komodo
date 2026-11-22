import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../lib/auth';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_USER_STATS } from '../../lib/mockData';
import { useRouter } from 'expo-router';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

const MenuItem = ({ icon, label, onPress, destructive }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? theme.colors.error : theme.colors.primary}
      />
    </View>
    <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
    {!destructive && (
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { userName, logout } = useAuth();
  const router = useRouter();

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KM';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerBg}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{userName || 'Usuario'}</Text>
        <Text style={styles.userEmail}>demo@komodo.com</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER_STATS.tripsTaken}</Text>
          <Text style={styles.statLabel}>Viajes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER_STATS.kmTraveled.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Kilómetros</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER_STATS.countriesVisited}</Text>
          <Text style={styles.statLabel}>Países</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="notifications-outline" label="Notificaciones" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="card-outline" label="Métodos de pago" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="language-outline" label="Idioma" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="help-circle-outline" label="Ayuda y soporte" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="shield-outline" label="Privacidad" />
          <View style={styles.menuSeparator} />
          <MenuItem icon="information-circle-outline" label="Acerca de Komodo" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Cerrar sesión"
            destructive
            onPress={() => {
              logout();
              router.replace('/login');
            }}
          />
        </View>
      </View>

      <Text style={styles.versionText}>Komodo v1.0.0 (MVP)</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  headerBg: {
    backgroundColor: theme.colors.primary,
    paddingTop: 70,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 26,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.background,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  menuCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDestructive: {
    backgroundColor: '#FEE2E2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  menuLabelDestructive: {
    color: theme.colors.error,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 68,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});
