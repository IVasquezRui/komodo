import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { formatUsdFromCents } from '../lib/pricing';
import { AnimatedButton } from './AnimatedButton';

export interface FloatingPurchaseCTAProps {
  unitPriceUsdCents: number;
  availableSeats: number;
  onPress: () => void;
  ctaLabel?: string;
}

/**
 * Botón CTA rectangular verde persistente en la sección inferior de Detalles del Viaje (8.1#).
 * Respeta SafeAreaInsets en iOS y Android sin cubrir el contenido desplazable.
 */
export const FloatingPurchaseCTA: React.FC<FloatingPurchaseCTAProps> = ({
  unitPriceUsdCents,
  availableSeats,
  onPress,
  ctaLabel = 'Seleccionar asientos',
}) => {
  const insets = useSafeAreaInsets();
  const soldOut = availableSeats <= 0;

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceCaption} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            PRECIO POR ASIENTO
          </Text>
          <Text style={styles.priceValue} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {formatUsdFromCents(unitPriceUsdCents)}
          </Text>
        </View>

        <AnimatedButton
          testID="floating-purchase-cta"
          label={soldOut ? 'Sin cupos' : ctaLabel}
          variant="cta"
          disabled={soldOut}
          onPress={onPress}
          style={styles.ctaButton}
          rightIcon={
            !soldOut ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" /> : undefined
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceBlock: {
    flexShrink: 1,
    gap: 2,
  },
  priceCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  priceValue: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  ctaButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
  },
});
