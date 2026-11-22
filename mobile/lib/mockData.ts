// ============================================================
//  KOMODO — Mock Data para demo del MVP
//  Simula respuestas del backend (Gateway + Core)
// ============================================================

// ----------------------------------------------------------------
// CREDENCIALES DE DEMO
// ----------------------------------------------------------------
export const DEMO_USER = {
  email: 'demo@komodo.com',
  password: 'demo1234',
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ivan García',
  initials: 'IG',
};

// ----------------------------------------------------------------
// TERMINALES
// ----------------------------------------------------------------
export const TERMINALS = [
  { id: 'term_ccs', name: 'Caracas (Terminal La Bandera)', city: 'Caracas', country: 'Venezuela', code: 'CCS' },
  { id: 'term_mao', name: 'Maracaibo (Terminal Principal)', city: 'Maracaibo', country: 'Venezuela', code: 'MAO' },
  { id: 'term_bog', name: 'Bogotá (Terminal del Norte)', city: 'Bogotá', country: 'Colombia', code: 'BOG' },
  { id: 'term_mia', name: 'Miami (Greyhound Station)', city: 'Miami', country: 'USA', code: 'MIA' },
  { id: 'term_mx',  name: 'Ciudad de México (TAPO)', city: 'CDMX', country: 'México', code: 'MEX' },
  { id: 'term_val', name: 'Valencia (Terminal La Viñas)', city: 'Valencia', country: 'Venezuela', code: 'VLC' },
];

export const POPULAR_ROUTES = [
  { from: TERMINALS[0], to: TERMINALS[1] }, // Caracas → Maracaibo
  { from: TERMINALS[0], to: TERMINALS[5] }, // Caracas → Valencia
  { from: TERMINALS[1], to: TERMINALS[2] }, // Maracaibo → Bogotá
];

// ----------------------------------------------------------------
// VIAJES DE BÚSQUEDA (simula respuesta GET /api/v1/search)
// ----------------------------------------------------------------
export const MOCK_TRIPS = [
  {
    tid: 'trip_001',
    org: 'Terminal La Bandera',
    dst: 'Terminal Maracaibo',
    dep: '2026-10-24T08:00:00Z',
    arr: '2026-10-24T18:30:00Z',
    prc: '25.00',
    avl: 15,
    rc: 'Los Llanos',
    serviceClass: 'Executive Class',
    busPlate: 'AB-123-ZY',
    isFastSelling: false,
  },
  {
    tid: 'trip_002',
    org: 'Terminal La Bandera',
    dst: 'Terminal Maracaibo',
    dep: '2026-10-24T12:30:00Z',
    arr: '2026-10-24T23:00:00Z',
    prc: '35.00',
    avl: 4,  // <5 → Fast Selling
    rc: 'Aeroexpresos',
    serviceClass: 'VIP Sleeper',
    busPlate: 'KM-777-EX',
    isFastSelling: true,
  },
  {
    tid: 'trip_003',
    org: 'Terminal La Bandera',
    dst: 'Terminal Maracaibo',
    dep: '2026-10-24T19:30:00Z',
    arr: '2026-10-25T05:15:00Z',
    prc: '20.00',
    avl: 22,
    rc: 'Rodovias',
    serviceClass: 'Standard',
    busPlate: 'RD-441-VE',
    isFastSelling: false,
  },
  {
    tid: 'trip_004',
    org: 'Terminal La Bandera',
    dst: 'Terminal Maracaibo',
    dep: '2026-10-25T06:00:00Z',
    arr: '2026-10-25T16:45:00Z',
    prc: '28.00',
    avl: 30,
    rc: 'Expresos del Lago',
    serviceClass: 'Semi-cama',
    busPlate: 'EL-220-LL',
    isFastSelling: false,
  },
  {
    tid: 'trip_005',
    org: 'Terminal La Bandera',
    dst: 'Terminal Maracaibo',
    dep: '2026-10-25T22:00:00Z',
    arr: '2026-10-26T08:30:00Z',
    prc: '42.00',
    avl: 2,  // <5 → Fast Selling
    rc: 'Aeroexpresos',
    serviceClass: 'VIP Sleeper',
    busPlate: 'KM-888-EX',
    isFastSelling: true,
  },
];

// ----------------------------------------------------------------
// ASIENTOS DEL BUS (simula respuesta GET /api/v1/trips/:id)
// ----------------------------------------------------------------
export const generateMockSeats = (tripId: string = 'trip_001') => {
  // Disposición estática: algunos asientos vendidos para hacer el mapa realista
  const soldSeats = [2, 3, 7, 8, 11, 12, 15, 19, 20, 24, 27, 33, 36];
  const heldSeats = [5, 16];

  return Array.from({ length: 40 }, (_, i) => {
    const seatNum = i + 1;
    let status: 'AVAILABLE' | 'HELD' | 'SOLD' = 'AVAILABLE';
    if (soldSeats.includes(seatNum)) status = 'SOLD';
    if (heldSeats.includes(seatNum)) status = 'HELD';

    return {
      id: `${tripId}_seat_${seatNum}`,
      number: `${seatNum}`,
      status,
    };
  });
};

// ----------------------------------------------------------------
// BOLETOS PRE-CARGADOS (para SQLite — My Trips)
// ----------------------------------------------------------------
export const MOCK_TICKETS = [
  {
    id: 'ticket_upcomig_001',
    trip_id: 'trip_001',
    seat_number: 14,
    origin: 'Caracas (La Bandera)',
    destination: 'Maracaibo',
    departure_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // en 2 días
    qr_code_data: 'KMD-2026-00142|trip_001|seat_14|IVAN-GARCIA|CONFIRMED',
    status: 'CONFIRMED',
    sync_status: 'SYNCED',
    ticket_number: 'KMD-2026-00142',
    operator: 'Los Llanos',
    service_class: 'Executive Class',
    amount_paid: 25.00,
  },
  {
    id: 'ticket_upcoming_002',
    trip_id: 'trip_002',
    seat_number: 6,
    origin: 'Caracas (La Bandera)',
    destination: 'Maracaibo',
    departure_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // en 7 días
    qr_code_data: 'KMD-2026-00189|trip_002|seat_6|IVAN-GARCIA|CONFIRMED',
    status: 'CONFIRMED',
    sync_status: 'PENDING', // Este tiene "Pending Sync" para demo
    ticket_number: 'KMD-2026-00189',
    operator: 'Aeroexpresos',
    service_class: 'VIP Sleeper',
    amount_paid: 35.00,
  },
  {
    id: 'ticket_past_001',
    trip_id: 'trip_past_1',
    seat_number: 22,
    origin: 'Maracaibo',
    destination: 'Bogotá (Terminal del Norte)',
    departure_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // hace 14 días
    qr_code_data: 'KMD-2026-00091|trip_past_1|seat_22|IVAN-GARCIA|CONFIRMED',
    status: 'CONFIRMED',
    sync_status: 'SYNCED',
    ticket_number: 'KMD-2026-00091',
    operator: 'Rodovias',
    service_class: 'Standard',
    amount_paid: 20.00,
  },
];

// ----------------------------------------------------------------
// RUTAS GUARDADAS (para la pestaña "Saved")
// ----------------------------------------------------------------
export const MOCK_SAVED_ROUTES = [
  {
    id: 'saved_001',
    origin: 'Caracas',
    destination: 'Maracaibo',
    frequency: 'Weekly',
    avgPrice: '$25 – $42',
    serviceClass: 'Executive',
  },
  {
    id: 'saved_002',
    origin: 'Maracaibo',
    destination: 'Bogotá',
    frequency: 'Monthly',
    avgPrice: '$55 – $80',
    serviceClass: 'Standard',
  },
];

// ----------------------------------------------------------------
// BÚSQUEDAS RECIENTES (para la pantalla Home)
// ----------------------------------------------------------------
export const MOCK_RECENT_SEARCHES = [
  {
    id: 'recent_001',
    origin: 'Caracas',
    destination: 'Maracaibo',
    date: 'Oct 24',
    passengers: 1,
    originId: 'term_ccs',
    destinationId: 'term_mao',
  },
  {
    id: 'recent_002',
    origin: 'Maracaibo',
    destination: 'Bogotá',
    date: 'Nov 2',
    passengers: 2,
    originId: 'term_mao',
    destinationId: 'term_bog',
  },
];

// ----------------------------------------------------------------
// ESTADÍSTICAS DEL USUARIO (para Profile)
// ----------------------------------------------------------------
export const MOCK_USER_STATS = {
  tripsTaken: 12,
  kmTraveled: 4820,
  countriesVisited: 3,
};
