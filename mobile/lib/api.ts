import { Platform } from 'react-native';

const getGatewayUrl = () => {
  // En producción, esto vendría de variables de entorno (.env)
  // Para desarrollo local con emuladores:
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
};

const getCoreUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

const GATEWAY_URL = getGatewayUrl();
const CORE_URL = getCoreUrl();

export const searchTrips = async (origin: string, dest: string, date: string) => {
  const res = await fetch(`${GATEWAY_URL}/api/v1/search?origin=${origin}&destination=${dest}&date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
};

export const holdSeat = async (tripId: string, seatNumber: number, userId: string) => {
  const res = await fetch(`${GATEWAY_URL}/api/v1/hold-seat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber, user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to hold seat');
  return res.json();
};

export const confirmReservation = async (payload: any) => {
  const res = await fetch(`${CORE_URL}/api/v1/reservations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to confirm reservation');
  return res.json();
};

export const getTripSeats = async (tripId: string) => {
  const res = await fetch(`${CORE_URL}/api/v1/trips/${tripId}`);
  if (!res.ok) throw new Error('Failed to fetch trip seats');
  return res.json();
};
