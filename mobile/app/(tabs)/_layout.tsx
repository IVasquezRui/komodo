import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { Platform } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Devuelve el ícono "filled" cuando está activo y "outline" cuando no
const tabIcon = (active: IconName, inactive: IconName) =>
  ({ color, focused }: { color: any; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={24} color={color} />
  );

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Mis Viajes',
          tabBarIcon: tabIcon('ticket', 'ticket-outline'),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarIcon: tabIcon('bookmark', 'bookmark-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
