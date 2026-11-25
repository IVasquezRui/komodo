// ============================================================
//  KOMODO — Utilidades Financieras y de Selector de Asientos
//  Aritmética estricta en centavos enteros (integer cents)
// ============================================================

export const DEFAULT_MAX_SEATS_PER_BOOKING = 6;

export interface SeatQuantityBounds {
  quantity: number;
  minAllowed: number;
  maxAllowed: number;
  limitReason: string | null;
}

export interface SeatSelectionNavParams {
  tripId: string;
  seatQuantity: number;
  unitPriceUsdCents: number;
  estimatedTotalUsdCents: number;
  draftBookingId: string;
  idempotencyKey: string;
  operator: string;
}

/**
 * Calcula el total en centavos enteros sin operar flotantes JS.
 */
export function calculateTotalUsdCents(unitPriceUsdCents: number, quantity: number): number {
  const safeCents = Math.max(0, Math.round(unitPriceUsdCents));
  const safeQty = Math.max(0, Math.trunc(quantity));
  return safeCents * safeQty;
}

/**
 * Formatea centavos enteros USD a presentación estándar ("$25.00 USD").
 */
export function formatUsdFromCents(cents: number, includeCurrencyCode = true): string {
  const safeCents = Math.round(cents);
  const sign = safeCents < 0 ? '-' : '';
  const absCents = Math.abs(safeCents);
  const dollars = Math.floor(absCents / 100);
  const remainder = absCents % 100;
  const formatted = `${sign}$${dollars}.${String(remainder).padStart(2, '0')}`;
  return includeCurrencyCode ? `${formatted} USD` : formatted;
}

/**
 * Aplica los límites estrictos de cantidad de asientos:
 * - Mínimo: 1 (o 0 si no hay disponibilidad)
 * - Máximo: min(maxPerBooking, availableSeats)
 */
export function clampSeatQuantity(
  requested: number,
  availableSeats: number,
  maxPerBooking: number = DEFAULT_MAX_SEATS_PER_BOOKING
): SeatQuantityBounds {
  const safeAvailable = Math.max(0, Math.trunc(availableSeats));
  const safeBusinessMax = Math.max(1, Math.trunc(maxPerBooking));
  const maxAllowed = Math.min(safeAvailable, safeBusinessMax);

  if (maxAllowed <= 0) {
    return {
      quantity: 0,
      minAllowed: 0,
      maxAllowed: 0,
      limitReason: 'No hay asientos disponibles para este viaje.',
    };
  }

  const minAllowed = 1;
  const clamped = Math.min(maxAllowed, Math.max(minAllowed, Math.trunc(requested)));

  let limitReason: string | null = null;
  if (clamped >= maxAllowed) {
    if (safeAvailable < safeBusinessMax) {
      limitReason = `Solo quedan ${safeAvailable} ${safeAvailable === 1 ? 'asiento disponible' : 'asientos disponibles'} en este autobús.`;
    } else {
      limitReason = `Máximo permitido por compra: ${safeBusinessMax} asientos.`;
    }
  }

  return {
    quantity: clamped,
    minAllowed,
    maxAllowed,
    limitReason,
  };
}

/**
 * Genera un UUID v4 determinista/seguro para idempotencia del borrador de reserva.
 */
export function generateClientUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const val = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return val.toString(16);
  });
}

/**
 * Prepara el contrato tipado para transición hacia el selector de asientos 2D (8.2#).
 */
export function buildSeatSelectionParams(input: {
  tripId: string;
  seatQuantity: number;
  unitPriceUsdCents: number;
  availableSeats: number;
  operator: string;
  maxPerBooking?: number;
  idGenerator?: () => string;
}): SeatSelectionNavParams {
  const { quantity } = clampSeatQuantity(
    input.seatQuantity,
    input.availableSeats,
    input.maxPerBooking ?? DEFAULT_MAX_SEATS_PER_BOOKING
  );
  const gen = input.idGenerator ?? generateClientUuidV4;
  return {
    tripId: input.tripId,
    seatQuantity: quantity,
    unitPriceUsdCents: Math.max(0, Math.round(input.unitPriceUsdCents)),
    estimatedTotalUsdCents: calculateTotalUsdCents(input.unitPriceUsdCents, quantity),
    draftBookingId: gen(),
    idempotencyKey: gen(),
    operator: input.operator,
  };
}

/**
 * Evalúa si la transición a selección de asientos 2D puede continuar según estado de red.
 */
export function evaluatePurchaseTransition(input: {
  isOnline: boolean;
  tripId: string;
  seatQuantity: number;
  unitPriceUsdCents: number;
  availableSeats: number;
  operator: string;
  idGenerator?: () => string;
}):
  | { allowed: true; params: SeatSelectionNavParams }
  | { allowed: false; preservedQuantity: number; errorMessage: string } {
  const bounds = clampSeatQuantity(input.seatQuantity, input.availableSeats);
  if (!input.isOnline) {
    return {
      allowed: false,
      preservedQuantity: bounds.quantity,
      errorMessage:
        'Sin conexión a internet. Necesitas red para bloquear tus asientos en tiempo real en Redis. Tu cantidad elegida se mantiene guardada.',
    };
  }
  if (bounds.quantity <= 0) {
    return {
      allowed: false,
      preservedQuantity: 0,
      errorMessage: 'Este viaje no cuenta con asientos disponibles.',
    };
  }
  return {
    allowed: true,
    params: buildSeatSelectionParams({
      tripId: input.tripId,
      seatQuantity: bounds.quantity,
      unitPriceUsdCents: input.unitPriceUsdCents,
      availableSeats: input.availableSeats,
      operator: input.operator,
      idGenerator: input.idGenerator,
    }),
  };
}
