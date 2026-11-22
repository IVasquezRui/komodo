import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { registerApi } from '../lib/api';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setSession = useAuth((state) => state.setSession);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !phoneNumber || !password) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await registerApi({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        email: email.trim() || null,
        password,
        role: 'passenger',
      });

      setSession(data.access_token, data.refresh_token, {
        id: data.user.id,
        fullName: data.user.full_name,
        phoneNumber: data.user.phone_number,
        email: data.user.email,
        role: data.user.role,
      });

      router.replace('/(tabs)');
    } catch (apiErr: any) {
      setError(apiErr.message || 'Error al registrar la cuenta. Verifica tus datos.');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBackground} />

        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.background} />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Crea tu cuenta</Text>
            <Text style={styles.subtitleText}>Viaja seguro y sin preocupaciones con Komodo</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nombre Completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="María Rodríguez"
                  placeholderTextColor={theme.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de teléfono *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="+58412-1234567"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Email (Opcional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico (opcional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="maria@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar contraseña *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.colors.background} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLinkSection} onPress={() => router.back()}>
              <Text style={styles.loginLinkText}>
                ¿Ya tienes una cuenta? <Text style={styles.loginLinkHighlight}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  container: {
    padding: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleSection: {
    marginBottom: theme.spacing.lg,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.background,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  registerButton: {
    backgroundColor: theme.colors.action,
    borderRadius: theme.radius.xl,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: 8,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  loginLinkSection: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loginLinkHighlight: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
