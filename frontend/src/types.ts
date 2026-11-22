export interface AdminStats {
  total_revenue: number;
  currency: string;
  occupancy_rate: number;
  total_passengers: number;
  active_trips: number;
  fleet_total: number;
  fleet_active: number;
  tickets_sold_today: number;
}

export interface Bus {
  id: string;
  plate: string;
  model: string;
  brand: string;
  decks: number;
  capacity: number;
  amenities: {
    wifi?: boolean;
    ac?: boolean;
    bath?: boolean;
    usb?: boolean;
    recline_180?: boolean;
    tv?: boolean;
  };
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  created_at?: string;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_hours: number;
  base_price: number;
  active_trips: number;
}

export interface Trip {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  bus_plate: string;
  bus_model: string;
  driver_name: string;
  departure_time: string;
  arrival_time: string;
  status: 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
  total_seats: number;
  booked_seats: number;
  occupancy_pct: number;
  base_price: number;
}

export interface SaleTransaction {
  id: string;
  reservation_id: string;
  passenger_name: string;
  doc_number: string;
  route: string;
  departure_date: string;
  seat_number: number;
  amount: number;
  currency: string;
  payment_method: 'PAGO_MOVIL' | 'ZELLE' | 'TARJETA' | 'EFECTIVO';
  status: 'COMPLETED' | 'REFUNDED' | 'PENDING';
  created_at: string;
}

export interface ManifestEntry {
  seat_number: number;
  full_name: string;
  doc_type: string;
  doc_number: string;
  phone: string;
  origin: string;
  destination: string;
  status: 'CONFIRMED' | 'BOARDED' | 'NO_SHOW';
  boarded_at?: string | null;
}
