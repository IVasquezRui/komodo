import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  Vibration,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../lib/theme';

export type AnimatedButtonVariant = 'cta' | 'primary' | 'secondary' | 'outline';

export interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  variant?: AnimatedButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Botón reutilizable Komodo con animación spring (60 FPS), feedback háptico
 * opcional y reglas estrictas anti-overflow para pantallas compactas (360px+).
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  label,
  onPress,
  variant = 'cta',
  disabled = false,
  loading = false,
  haptic = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    if (isDisabled) return;
    setPressed(true);
    if (!reduceMotion) {
      scale.value = withSpring(0.96, { damping: 16, stiffness: 280 });
    }
  };

  const handlePressOut = () => {
    setPressed(false);
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 16, stiffness: 280 });
    }
  };

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic && Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {
        // Ignore on devices without vibrator permission
      }
    }
    onPress();
  };

  const variantContainerStyle =
    variant === 'cta'
      ? pressed
        ? styles.ctaPressed
        : styles.cta
      : variant === 'primary'
      ? pressed
        ? styles.primaryPressed
        : styles.primary
      : variant === 'secondary'
      ? styles.secondary
      : styles.outline;

  const variantTextStyle =
    variant === 'secondary'
      ? styles.textPrimaryBrand
      : variant === 'outline'
      ? styles.textDark
      : styles.textLight;

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.base,
        variantContainerStyle,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'outline' ? theme.colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[styles.label, variantTextStyle, textStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.25}
          >
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cta: {
    backgroundColor: theme.colors.action,
    shadowColor: theme.colors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaPressed: {
    backgroundColor: theme.colors.actionHover,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryPressed: {
    backgroundColor: theme.colors.primaryDeep,
  },
  secondary: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outline: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textPrimaryBrand: {
    color: theme.colors.primary,
  },
  textDark: {
    color: theme.colors.textPrimary,
  },
});
