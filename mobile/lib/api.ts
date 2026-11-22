import { Platform } from 'react-native';

const getBaseUrl = () => {
  // All traffic goes through the unified Go Gateway (:8080)
  // In production, this is injected via EXPO_PUBLIC_API_URL or environment
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
};

export const API_BASE_URL = getBaseUrl();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ---------------------------------------------------------------------------
// Auth Endpoints (Reverse-proxied via Gateway to Core)
// ---------------------------------------------------------------------------
export const loginApi = async (phoneOrEmail: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phone_or_email: phoneOrEmail, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al iniciar sesión');
  }
  return res.json();
};

export const registerApi = async (data: {
  full_name: string;
  phone_number: string;
  email?: string | null;
  password: string;
  role?: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      full_name: data.full_name,
      phone_number: data.phone_number,
      email: data.email || null,
      password: data.password,
      role: data.role || 'passenger',
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al registrar usuario');
  }
  return res.json();
};

export const getMeApi = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
};

// ---------------------------------------------------------------------------
// Trips & Search (Local Go Gateway + Redis Shield)
// ---------------------------------------------------------------------------
export const searchTrips = async (origin: string, dest: string, date: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
      dest
    )}&date=${encodeURIComponent(date)}`
  );
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
};

export const holdSeat = async (tripId: string, seatNumber: number, userId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/hold-seat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to hold seat');
  }
  return res.json();
};

export const releaseSeat = async (tripId: string, seatNumber: number, userId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/release-seat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber, user_id: userId }),
  });
  if (!res.ok) return null;
  return res.json();
};

export const getTripSeats = async (tripId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/trips/${tripId}`);
  if (!res.ok) throw new Error('Failed to fetch trip seats');
  return res.json();
};

// ---------------------------------------------------------------------------
// Payments (Proxied via Gateway to Core)
// ---------------------------------------------------------------------------
export const createPaymentApi = async (data: {
  reservation_id?: string | null;
  provider: 'STRIPE' | 'PAGO_MOVIL' | 'TRANSFER' | 'CASH';
  amount: number;
  currency?: string;
  reference: string;
  phone_number?: string | null;
  bank_code?: string | null;
  payment_metadata?: any;
}) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al procesar el pago');
  }
  return res.json();
};

export const getPaymentApi = async (paymentId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch payment details');
  return res.json();
};
// ---------------------------------------------------------------------------
export const confirmReservation = async (payload: any, token?: string | null) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/reservations/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to confirm reservation');
  }
  return res.json();
};
