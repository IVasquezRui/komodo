import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_USER } from '../lib/mockData';
import { loginApi } from '../lib/api';
import { AnimatedButton } from '../components/AnimatedButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const setSession = useAuth((state) => state.setSession);
  const loginDemo = useAuth((state) => state.loginDemo);
  const router = useRouter();

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu email o teléfono y contraseña.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await loginApi(email.trim(), password);
      setSession(data.access_token, data.refresh_token, {
        id: data.user.id,
        fullName: data.user.full_name,
        phoneNumber: data.user.phone_number,
        email: data.user.email,
        role: data.user.role,
      });
      router.replace('/(tabs)');
    } catch (apiErr: any) {
      // Fallback: Si el servidor backend está offline o son credenciales de demo
      const isDemo =
        email.trim().toLowerCase() === DEMO_USER.email.toLowerCase() && password === DEMO_USER.password;
      if (
        isDemo ||
        apiErr.message?.includes('Network request failed') ||
        apiErr.message?.includes('Failed to fetch')
      ) {
        loginDemo(DEMO_USER.id, DEMO_USER.name);
        router.replace('/(tabs)');
      } else {
        setError(apiErr.message || 'Email o contraseña incorrectos.');
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fondo superior con color de marca */}
      <View style={styles.headerBackground} />

      <Animated.View
        style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="bus" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.logoText}>Komodo</Text>
          <Text style={styles.tagline}>Your journey, simplified.</Text>
        </View>

        {/* Card del formulario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.demoHintText}>
              Demo: <Text style={styles.demoCredentials}>demo@komodo.com / demo1234</Text>
            </Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? theme.colors.primary : theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={[styles.inputRow, passwordFocused && styles.inputRowFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? theme.colors.primary : theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Login */}
          <AnimatedButton
            label="Iniciar Sesión"
            variant="cta"
            loading={isLoading}
            onPress={handleLogin}
            rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google btn */}
          <AnimatedButton
            label="Continuar con Google"
            variant="outline"
            onPress={() => router.push('/register' as any)}
            leftIcon={<Ionicons name="logo-google" size={20} color={theme.colors.textPrimary} />}
            style={styles.googleButton}
          />
        </View>

        <Text style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Text style={styles.footerLink} onPress={() => router.push('/register' as any)}>
            Regístrate
          </Text>
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.background,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  demoHintText: {
    fontSize: 12,
    color: theme.colors.primary,
    flex: 1,
  },
  demoCredentials: {
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputWrapper: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputRowFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
    marginTop: -theme.spacing.xs,
  },
  forgotText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: theme.colors.action,
    borderRadius: theme.radius.xl,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonLoading: {
    opacity: 0.75,
  },
  loginButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    height: 52,
    gap: 8,
    backgroundColor: theme.colors.background,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  footer: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
