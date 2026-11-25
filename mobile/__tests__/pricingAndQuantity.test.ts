import {
  buildSeatSelectionParams,
  calculateTotalUsdCents,
  clampSeatQuantity,
  evaluatePurchaseTransition,
  formatUsdFromCents,
} from '../lib/pricing';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPricingAndQuantityTests(): void {
  // 1. Exact integer cents arithmetic without floating-point drift
  assertEqual(calculateTotalUsdCents(1999, 3), 5997, '1999 * 3');
  assertEqual(calculateTotalUsdCents(3333, 3), 9999, '3333 * 3');
  assertEqual(calculateTotalUsdCents(2500, 1), 2500, '2500 * 1');
  assertEqual(calculateTotalUsdCents(2500, 6), 15000, '2500 * 6');
  assertEqual(formatUsdFromCents(5997), '$59.97 USD', 'format 5997');
  assertEqual(formatUsdFromCents(2500), '$25.00 USD', 'format 2500');
  assertEqual(formatUsdFromCents(5, false), '$0.05', 'format 5 without currency');

  // 2. Min (1) and Max (min(6, availableSeats)) bounds enforcement
  const lowClamp = clampSeatQuantity(0, 20, 6);
  assertEqual(lowClamp.quantity, 1, 'min clamp to 1');
  assertEqual(lowClamp.minAllowed, 1, 'minAllowed 1');
  assertEqual(lowClamp.maxAllowed, 6, 'maxAllowed 6');

  const busLimitClamp = clampSeatQuantity(5, 3, 6);
  assertEqual(busLimitClamp.quantity, 3, 'cap by availableSeats 3');
  assertEqual(busLimitClamp.maxAllowed, 3, 'maxAllowed 3');
  assertTrue(
    Boolean(busLimitClamp.limitReason?.includes('3 asientos disponibles')),
    'limitReason reflects remaining seats'
  );

  const businessLimitClamp = clampSeatQuantity(9, 40, 6);
  assertEqual(businessLimitClamp.quantity, 6, 'cap by maxPerBooking 6');
  assertEqual(businessLimitClamp.maxAllowed, 6, 'maxAllowed 6');
  assertTrue(
    Boolean(businessLimitClamp.limitReason?.includes('6 asientos')),
    'limitReason reflects business max'
  );

  const soldOutClamp = clampSeatQuantity(2, 0, 6);
  assertEqual(soldOutClamp.quantity, 0, 'sold out clamps to 0');
  assertEqual(soldOutClamp.maxAllowed, 0, 'sold out maxAllowed 0');

  // 3. Offline behavior preserves selected seat quantity without crashing
  const offlineResult = evaluatePurchaseTransition({
    isOnline: false,
    tripId: 'trip_123',
    seatQuantity: 4,
    unitPriceUsdCents: 3500,
    availableSeats: 12,
    operator: 'Aeroexpresos Ejecutivos',
  });
  assertEqual(offlineResult.allowed, false, 'offline blocks transition cleanly');
  if (!offlineResult.allowed) {
    assertEqual(offlineResult.preservedQuantity, 4, 'preserves chosen quantity offline');
    assertTrue(
      offlineResult.errorMessage.includes('Redis'),
      'offline message explains Redis lock requirement'
    );
  }

  // 4. Online transition prepares exact navigation payload + idempotencyKey
  let seq = 0;
  const onlineResult = evaluatePurchaseTransition({
    isOnline: true,
    tripId: 'trip_123',
    seatQuantity: 3,
    unitPriceUsdCents: 3500,
    availableSeats: 12,
    operator: 'Aeroexpresos Ejecutivos',
    idGenerator: () => `uuid-test-${++seq}`,
  });
  assertEqual(onlineResult.allowed, true, 'online allows transition');
  if (onlineResult.allowed) {
    assertEqual(onlineResult.params.tripId, 'trip_123', 'tripId matches');
    assertEqual(onlineResult.params.seatQuantity, 3, 'seatQuantity matches');
    assertEqual(onlineResult.params.unitPriceUsdCents, 3500, 'unitPriceUsdCents matches');
    assertEqual(onlineResult.params.estimatedTotalUsdCents, 10500, 'estimatedTotalUsdCents matches');
    assertEqual(onlineResult.params.draftBookingId, 'uuid-test-1', 'draftBookingId generated');
    assertEqual(onlineResult.params.idempotencyKey, 'uuid-test-2', 'idempotencyKey generated');
  }

  const built = buildSeatSelectionParams({
    tripId: 'trip_999',
    seatQuantity: 2,
    unitPriceUsdCents: 2850,
    availableSeats: 5,
    operator: 'SITSSA',
    idGenerator: () => 'fixed-uuid',
  });
  assertEqual(built.estimatedTotalUsdCents, 5700, 'built total cents');
  assertEqual(built.idempotencyKey, 'fixed-uuid', 'built idempotencyKey');

  console.log('ALL MOBILE 8.1# PRICING & SEAT QUANTITY UNIT TESTS PASSED!');
}

runPricingAndQuantityTests();
