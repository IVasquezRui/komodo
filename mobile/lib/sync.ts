import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { getPendingTickets, markTicketSynced } from './storage';
import { confirmReservation } from './api';

let isSyncing = false;

export const startSyncService = () => {
  if (Platform.OS === 'web') return; // Avoid OPFS locks on web
  // Suscribirse a cambios en la red
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncPendingTickets();
    }
  });
};

export const syncPendingTickets = async () => {
  if (isSyncing || Platform.OS === 'web') return;
  isSyncing = true;
  
  try {
    const pendingTickets = await getPendingTickets();
    
    for (const ticket of pendingTickets) {
      try {
        const payload = JSON.parse((ticket as any).raw_json);
        // Intentar confirmar la reserva con el backend (usando la idempotency_key)
        await confirmReservation({
          idempotency_key: payload.idempotency_key || ticket.id,
          user_id: payload.user_id,
          seat_id: payload.seat_id,
          trip_id: payload.trip_id,
          amount_paid: payload.amount_paid,
          currency: payload.currency
        });
        
        // Si fue exitoso, marcar como sincronizado
        await markTicketSynced(ticket.id.toString());
      } catch (error) {
        console.error(`Error syncing ticket ${ticket.id}:`, error);
        // Continuamos con los demás tickets
      }
    }
  } catch (error) {
    console.error('Error fetching pending tickets:', error);
  } finally {
    isSyncing = false;
  }
};
