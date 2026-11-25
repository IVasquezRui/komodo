import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { formatUsdFromCents, SeatSelectionNavParams } from '../lib/pricing';
import { FloatingPurchaseCTA } from '../components/FloatingPurchaseCTA';
import { SeatQuantitySheet } from '../components/SeatQuantitySheet';

const GALLERY_TABS = [
  { key: 'terminal', label: 'Terminal', icon: 'business-outline' as const, desc: 'Andén de embarque e infraestructura autorizada INTT.' },
  { key: 'bus', label: 'Autobús', icon: 'bus-outline' as const, desc: 'Unidad verificada con distribución real de asientos.' },
  { key: 'scenery', label: 'Paisaje', icon: 'map-outline' as const, desc: 'Vistas panorámicas del corredor interurbano.' },
  { key: 'destination', label: 'Destino', icon: 'location-outline' as const, desc: 'Ciudad receptora y puntos de conexión urbana.' },
];

export default function TripDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeGallery, setActiveGallery] = useState('bus');

  const tripId = (params.tripId as string) || 'trip_001';
  const operator = (params.operator as string) || 'Aeroexpresos Ejecutivos C.A.';
  const busModel = (params.busModel as string) || 'Marcopolo Paradiso G6 1800 DD';
  const origin = (params.origin as string) || 'Terminal La Bandera, Caracas';
  const destination = (params.destination as string) || 'Gran Terminal de Maracaibo';
  const depIso = (params.dep as string) || '2026-12-01T06:00:00-04:00';
  const arrIso = (params.arr as string) || '2026-12-01T16:30:00-04:00';
  const routeCode = (params.routeCode as string) || 'CCS-MCB';
  const availableSeats = Math.max(0, parseInt((params.availableSeats as string) || '24', 10) || 24);
  const unitPriceUsdCents = Math.max(
    100,
    parseInt((params.unitPriceUsdCents as string) || '3500', 10) || 3500
  );
  const hasWifi = params.hasWifi === 'true';
  const hasAc = params.hasAc !== 'false';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleConfirmQuantity = (navParams: SeatSelectionNavParams) => {
    setSheetVisible(false);
    const unitDollars = (navParams.unitPriceUsdCents / 100).toFixed(2);
    router.push(
      `/select-seat?tripId=${encodeURIComponent(navParams.tripId)}&seatQuantity=${
        navParams.seatQuantity
      }&unitPriceUsdCents=${navParams.unitPriceUsdCents}&estimatedTotalUsdCents=${
        navParams.estimatedTotalUsdCents
      }&draftBookingId=${encodeURIComponent(navParams.draftBookingId)}&idempotencyKey=${encodeURIComponent(
        navParams.idempotencyKey
      )}&price=${unitDollars}&operator=${encodeURIComponent(navParams.operator)}` as any
    );
  };

  const selectedGalleryInfo = GALLERY_TABS.find((t) => t.key === activeGallery) || GALLERY_TABS[0];

  return (
    <View style={styles.root}>
      {/* Brand Purple Header */}
      <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top + 12, 52) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver a resultados"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.heroTextBox}>
          <Text style={styles.heroSubtitle} numberOfLines={1}>
            RUTA {routeCode}
          </Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {operator}
          </Text>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{formatUsdFromCents(unitPriceUsdCents, false)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Schedule & Bus Model Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconPill}>
              <Ionicons name="bus" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.busModelTitle}>{busModel}</Text>
              <Text style={styles.busSub}>{availableSeats} asientos disponibles</Text>
            </View>
          </View>

          <View style={styles.routeTimeline}>
            <View style={styles.stopBlock}>
              <Text style={styles.timeBig}>{formatTime(depIso)}</Text>
              <Text style={styles.stopName}>{origin}</Text>
            </View>
            <View style={styles.arrowBlock}>
              <View style={styles.line} />
              <Ionicons name="arrow-forward-circle" size={20} color={theme.colors.primary} />
              <View style={styles.line} />
            </View>
            <View style={[styles.stopBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.timeBig}>{formatTime(arrIso)}</Text>
              <Text style={[styles.stopName, { textAlign: 'right' }]}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Minimalist Onboard Amenities (WiFi & A/A) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Servicios a bordo</Text>
          <View style={styles.amenitiesGrid}>
            <View style={styles.amenityCard}>
              <Ionicons
                name="wifi-outline"
                size={20}
                color={hasWifi ? theme.colors.info : theme.colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.amenityTitle}>Servicio WiFi</Text>
                <Text style={styles.amenityStatus}>
                  {hasWifi ? 'Disponible a bordo' : 'No disponible'}
                </Text>
              </View>
            </View>

            <View style={styles.amenityCard}>
              <Ionicons
                name="snow-outline"
                size={20}
                color={hasAc ? theme.colors.action : theme.colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.amenityTitle}>Aire Acondicionado</Text>
                <Text style={styles.amenityStatus}>
                  {hasAc ? 'Climatizado operativo' : 'Ventilación natural'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* PostGIS Route & Rest Stop Preview */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mapa de ruta y parada de descanso</Text>
            <View style={styles.restBadge}>
              <Ionicons name="cafe-outline" size={12} color={theme.colors.accent} />
              <Text style={styles.restBadgeText}>Parada 20 min</Text>
            </View>
          </View>
          <View style={styles.mapPreview}>
            <View style={styles.mapTrack}>
              <View style={styles.mapNodeOrigin} />
              <View style={styles.mapDash} />
              <View style={styles.mapNodeRest}>
                <Ionicons name="restaurant" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.mapDash} />
              <View style={styles.mapNodeDest} />
            </View>
            <Text style={styles.mapCaption}>
              Trazo estimado punto a punto · Parador de descanso intermedio verificado
            </Text>
          </View>
        </View>

        {/* Segmented Multimedia Gallery (4 Collections) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Galería del viaje</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryTabs}
          >
            {GALLERY_TABS.map((tab) => {
              const active = tab.key === activeGallery;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.galleryTab, active && styles.galleryTabActive]}
                  onPress={() => setActiveGallery(tab.key)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={active ? '#FFFFFF' : theme.colors.primary}
                  />
                  <Text
                    style={[styles.galleryTabText, active && styles.galleryTabTextActive]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.25}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.galleryShowcase}>
            <Ionicons name={selectedGalleryInfo.icon} size={32} color={theme.colors.primary} />
            <Text style={styles.galleryShowcaseTitle}>{selectedGalleryInfo.label}</Text>
            <Text style={styles.galleryShowcaseDesc}>{selectedGalleryInfo.desc}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Green Purchase CTA (8.1#) */}
      <FloatingPurchaseCTA
        unitPriceUsdCents={unitPriceUsdCents}
        availableSeats={availableSeats}
        onPress={() => setSheetVisible(true)}
      />

      {/* Interactive Seat Quantity + USD Real-Time Calculator Sheet */}
      <SeatQuantitySheet
        visible={sheetVisible}
        tripId={tripId}
        operatorName={operator}
        unitPriceUsdCents={unitPriceUsdCents}
        availableSeats={availableSeats}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleConfirmQuantity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  heroHeader: {
    backgroundColor: theme.colors.primaryDeep,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextBox: {
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DDD6FE',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceBadge: {
    backgroundColor: theme.colors.action,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  priceBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: 14,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busModelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  busSub: {
    fontSize: 12,
    color: theme.colors.actionHover,
    fontWeight: '600',
    marginTop: 2,
  },
  routeTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stopBlock: {
    flex: 1,
  },
  timeBig: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  stopName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  arrowBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 64,
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  amenityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surfaceSlate,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSlate,
  },
  amenityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  amenityStatus: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accentContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  restBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  mapPreview: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapNodeOrigin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
  },
  mapDash: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.primaryVibrant,
    opacity: 0.45,
  },
  mapNodeRest: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapNodeDest: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.action,
  },
  mapCaption: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  galleryTabs: {
    gap: 8,
    marginBottom: 12,
  },
  galleryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  galleryTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  galleryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  galleryTabTextActive: {
    color: '#FFFFFF',
  },
  galleryShowcase: {
    backgroundColor: theme.colors.surfaceSlate,
    borderRadius: theme.radius.xl,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSlate,
  },
  galleryShowcaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  galleryShowcaseDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
