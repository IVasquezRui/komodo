import { AdminStats, Bus, Route, Trip, SaleTransaction, ManifestEntry } from '../types';

const API_BASE = '/api/v1';

export async function fetchStats(): Promise<AdminStats> {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback stats');
  }
  return {
    total_revenue: 16420.0,
    currency: 'USD',
    occupancy_rate: 86.4,
    total_passengers: 488,
    active_trips: 8,
    fleet_total: 6,
    fleet_active: 5,
    tickets_sold_today: 74,
  };
}

export async function fetchFleet(): Promise<Bus[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/fleet`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback fleet');
  }
  return [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      plate: 'ABC-123',
      model: 'Marcopolo Paradiso G8 1800 DD',
      brand: 'Marcopolo',
      decks: 2,
      capacity: 52,
      amenities: { wifi: true, ac: true, bath: true, usb: true, recline_180: true },
      status: 'ACTIVE',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000002',
      plate: 'XYZ-789',
      model: 'Irizar i8 High-End',
      brand: 'Irizar',
      decks: 1,
      capacity: 44,
      amenities: { wifi: true, ac: true, bath: true, usb: true },
      status: 'ACTIVE',
      created_at: '2026-01-15T09:30:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000003',
      plate: 'VNZ-554',
      model: 'Yutong ZK6129H Executive',
      brand: 'Yutong',
      decks: 1,
      capacity: 42,
      amenities: { wifi: false, ac: true, bath: true, usb: true },
      status: 'MAINTENANCE',
      created_at: '2026-02-01T11:00:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000004',
      plate: 'KMD-901',
      model: 'Marcopolo Viaggio 1050',
      brand: 'Marcopolo',
      decks: 1,
      capacity: 48,
      amenities: { wifi: true, ac: true, bath: true, usb: true },
      status: 'ACTIVE',
      created_at: '2026-02-14T14:00:00Z',
    },
  ];
}

export async function createBus(bus: Partial<Bus>): Promise<Bus> {
  try {
    const res = await fetch(`${API_BASE}/admin/fleet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bus),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, simulating local creation');
  }
  return {
    id: `b0000001-${Date.now()}`,
    plate: bus.plate || 'NEW-000',
    model: bus.model || 'Marcopolo G8',
    brand: bus.brand || 'Marcopolo',
    decks: bus.decks || 1,
    capacity: bus.capacity || 44,
    amenities: bus.amenities || { wifi: true, ac: true, bath: true, usb: true },
    status: (bus.status as any) || 'ACTIVE',
    created_at: new Date().toISOString(),
  };
}

export async function fetchRoutes(): Promise<Route[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/routes`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback routes');
  }
  return [
    {
      id: 'r0000001-0000-0000-0000-000000000001',
      origin: 'Caracas (Terminal La Bandera)',
      destination: 'Maracaibo (Terminal Central)',
      distance_km: 685.0,
      estimated_hours: 9.5,
      base_price: 35.0,
      active_trips: 4,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000002',
      origin: 'Caracas (Terminal Oriente)',
      destination: 'Puerto La Cruz (Terminal Rodoviario)',
      distance_km: 320.0,
      estimated_hours: 4.5,
      base_price: 20.0,
      active_trips: 6,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000003',
      origin: 'Valencia (Terminal Big Low)',
      destination: 'San Cristóbal (Terminal La Concordia)',
      distance_km: 640.0,
      estimated_hours: 10.0,
      base_price: 40.0,
      active_trips: 2,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000004',
      origin: 'Barquisimeto (Terminal Central)',
      destination: 'Caracas (Terminal La Bandera)',
      distance_km: 360.0,
      estimated_hours: 5.0,
      base_price: 22.0,
      active_trips: 3,
    },
  ];
}

export async function fetchTrips(): Promise<Trip[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/trips`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback trips');
  }
  return [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      route_name: 'Caracas → Maracaibo (Directo Nocturno)',
      origin: 'Caracas',
      destination: 'Maracaibo',
      bus_plate: 'ABC-123',
      bus_model: 'Marcopolo G8 1800 DD',
      driver_name: 'Ramón Gómez',
      departure_time: '2026-11-22T20:00:00Z',
      arrival_time: '2026-11-23T05:30:00Z',
      status: 'BOARDING',
      total_seats: 52,
      booked_seats: 46,
      occupancy_pct: 88,
      base_price: 35.0,
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      route_name: 'Caracas → Puerto La Cruz',
      origin: 'Caracas',
      destination: 'Puerto La Cruz',
      bus_plate: 'XYZ-789',
      bus_model: 'Irizar i8 High-End',
      driver_name: 'Franklin Mendoza',
      departure_time: '2026-11-22T18:30:00Z',
      arrival_time: '2026-11-22T23:00:00Z',
      status: 'SCHEDULED',
      total_seats: 44,
      booked_seats: 41,
      occupancy_pct: 93,
      base_price: 20.0,
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      route_name: 'Valencia → San Cristóbal',
      origin: 'Valencia',
      destination: 'San Cristóbal',
      bus_plate: 'KMD-901',
      bus_model: 'Marcopolo Viaggio 1050',
      driver_name: 'Carlos Quintero',
      departure_time: '2026-11-22T21:00:00Z',
      arrival_time: '2026-11-23T07:00:00Z',
      status: 'SCHEDULED',
      total_seats: 48,
      booked_seats: 38,
      occupancy_pct: 79,
      base_price: 40.0,
    },
  ];
}

export async function fetchSales(): Promise<SaleTransaction[]> {
  return [
    {
      id: 'tx_01',
      reservation_id: 'res_001',
      passenger_name: 'Carlos Rodríguez',
      doc_number: 'V-18293847',
      route: 'Caracas → Maracaibo',
      departure_date: '2026-11-22 20:00',
      seat_number: 14,
      amount: 35.0,
      currency: 'USD',
      payment_method: 'PAGO_MOVIL',
      status: 'COMPLETED',
      created_at: '2026-11-22 14:20',
    },
    {
      id: 'tx_02',
      reservation_id: 'res_002',
      passenger_name: 'María García',
      doc_number: 'V-21948572',
      route: 'Caracas → Maracaibo',
      departure_date: '2026-11-22 20:00',
      seat_number: 15,
      amount: 35.0,
      currency: 'USD',
      payment_method: 'ZELLE',
      status: 'COMPLETED',
      created_at: '2026-11-22 14:22',
    },
    {
      id: 'tx_03',
      reservation_id: 'res_003',
      passenger_name: 'Alejandro Mendoza',
      doc_number: 'V-15849302',
      route: 'Caracas → Puerto La Cruz',
      departure_date: '2026-11-22 18:30',
      seat_number: 3,
      amount: 20.0,
      currency: 'USD',
      payment_method: 'TARJETA',
      status: 'COMPLETED',
      created_at: '2026-11-22 15:10',
    },
    {
      id: 'tx_04',
      reservation_id: 'res_004',
      passenger_name: 'Valentina Silva',
      doc_number: 'P-A1938495',
      route: 'Caracas → Puerto La Cruz',
      departure_date: '2026-11-22 18:30',
      seat_number: 4,
      amount: 20.0,
      currency: 'USD',
      payment_method: 'PAGO_MOVIL',
      status: 'COMPLETED',
      created_at: '2026-11-22 15:45',
    },
    {
      id: 'tx_05',
      reservation_id: 'res_005',
      passenger_name: 'José Ramos',
      doc_number: 'V-12493820',
      route: 'Valencia → San Cristóbal',
      departure_date: '2026-11-22 21:00',
      seat_number: 22,
      amount: 40.0,
      currency: 'USD',
      payment_method: 'EFECTIVO',
      status: 'COMPLETED',
      created_at: '2026-11-22 16:05',
    },
  ];
}

export async function fetchManifest(): Promise<ManifestEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/tickets/manifest/v0000001`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.passengers) {
        return data.passengers.map((p: any) => ({
          seat_number: p.seat_number,
          full_name: p.full_name,
          doc_type: p.doc_type,
          doc_number: p.doc_number,
          phone: p.phone || '+58 412 1234567',
          origin: data.origin || 'Caracas',
          destination: data.destination || 'Maracaibo',
          status: p.status,
          boarded_at: p.boarded_at,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, using fallback manifest');
  }
  return [
    { seat_number: 1, full_name: 'Carlos Rodríguez', doc_type: 'V', doc_number: '18293847', phone: '0412-5551234', origin: 'Caracas', destination: 'Maracaibo', status: 'BOARDED', boarded_at: '2026-11-22T19:42:00Z' },
    { seat_number: 2, full_name: 'María García', doc_type: 'V', doc_number: '21948572', phone: '0414-8889922', origin: 'Caracas', destination: 'Maracaibo', status: 'CONFIRMED' },
    { seat_number: 3, full_name: 'Alejandro Mendoza', doc_type: 'V', doc_number: '15849302', phone: '0424-3331199', origin: 'Caracas', destination: 'Maracaibo', status: 'BOARDED', boarded_at: '2026-11-22T19:45:00Z' },
    { seat_number: 4, full_name: 'Valentina Silva', doc_type: 'P', doc_number: 'A1938495', phone: '0416-2223344', origin: 'Caracas', destination: 'Maracaibo', status: 'CONFIRMED' },
    { seat_number: 5, full_name: 'José Antonio Ramos', doc_type: 'V', doc_number: '12493820', phone: '0412-7776655', origin: 'Caracas', destination: 'Maracaibo', status: 'CONFIRMED' },
    { seat_number: 6, full_name: 'Daniela Colmenares', doc_type: 'V', doc_number: '25938471', phone: '0414-9994433', origin: 'Caracas', destination: 'Maracaibo', status: 'BOARDED', boarded_at: '2026-11-22T19:50:00Z' },
    { seat_number: 7, full_name: 'Pedro Morales', doc_type: 'V', doc_number: '19483920', phone: '0424-6668877', origin: 'Caracas', destination: 'Maracaibo', status: 'CONFIRMED' },
    { seat_number: 8, full_name: 'Lucía Fernández', doc_type: 'V', doc_number: '23948571', phone: '0412-1110099', origin: 'Caracas', destination: 'Maracaibo', status: 'CONFIRMED' },
  ];
}

export async function triggerTravelReminders(
  tripId: string,
  reminderType: '24H_BEFORE' | '2H_BEFORE' | 'BOARDING_NOW' | 'DELAY_ALERT'
) {
  try {
    const res = await fetch(`${API_BASE}/notifications/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip_id: tripId, reminder_type: reminderType }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, simulating reminder broadcast');
  }
  return {
    trip_id: tripId,
    reminder_type: reminderType,
    title: '📢 Aviso a Pasajeros',
    message_template: 'Alerta y recordatorio enviado a pasajeros a bordo.',
    notifications_dispatched: 42,
    timestamp: new Date().toISOString(),
  };
}

export function getSeatStreamUrl(tripId: string): string {
  return `${API_BASE}/trips/${tripId}/seat-stream`;
}

export interface RegisterAccountPayload {
  full_name: string;
  phone_number: string;
  email?: string;
  password: string;
  doc_type?: 'V' | 'E' | 'P';
  doc_number?: string;
  idempotency_key?: string;
}

export interface AuthTokenResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string | null;
    role: string;
  };
}

export async function registerAccount(payload: RegisterAccountPayload): Promise<AuthTokenResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (payload.idempotency_key) {
    headers['X-Komodo-Idempotency-Key'] = payload.idempotency_key;
    headers['Idempotency-Key'] = payload.idempotency_key;
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      full_name: payload.full_name,
      phone_number: payload.phone_number,
      email: payload.email || null,
      password: payload.password,
      role: 'passenger',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'No se pudo completar el registro en Komodo.');
  }
  return await res.json();
}

export async function loginAccount(phoneOrEmail: string, password: string): Promise<AuthTokenResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_or_email: phoneOrEmail, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || 'Credenciales inválidas.');
  }
  return await res.json();
}

export interface SearchTripItem {
  tid: string;
  rc: string;
  operator_name?: string;
  bus_model?: string;
  org: string;
  dst: string;
  dep: string;
  arr: string;
  avl: number;
  prc: number;
  price_usd_cents?: number;
  amenities?: { wifi?: boolean; ac?: boolean; bath?: boolean; usb?: boolean };
}

export async function searchTripsWeb(origin: string, destination: string): Promise<SearchTripItem[]> {
  try {
    const res = await fetch(
      `${API_BASE}/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.r)) return data.r;
    }
  } catch (err) {
    console.warn('Search API unavailable, returning fallback trips', err);
  }
  return [];
}
