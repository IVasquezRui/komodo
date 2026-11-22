import * as SQLite from 'expo-sqlite';
import { MOCK_TICKETS } from './mockData';

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('komodo.db');

  // Schema extendido con campos para UI rica
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      seat_number INTEGER,
      origin TEXT,
      destination TEXT,
      departure_at TEXT,
      qr_code_data TEXT,
      status TEXT,
      sync_status TEXT,
      ticket_number TEXT,
      operator TEXT,
      service_class TEXT,
      amount_paid REAL,
      raw_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedMockTickets(db);
  return db;
};

// Siembra los boletos de demo solo si la tabla está vacía
const seedMockTickets = async (database: SQLite.SQLiteDatabase) => {
  const existing = await database.getFirstAsync('SELECT id FROM tickets LIMIT 1');
  if (existing) return; // Ya hay datos, no volver a sembrar

  for (const ticket of MOCK_TICKETS) {
    await database.runAsync(
      `INSERT OR IGNORE INTO tickets 
       (id, trip_id, seat_number, origin, destination, departure_at, qr_code_data, status, sync_status, ticket_number, operator, service_class, amount_paid, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.trip_id,
        ticket.seat_number,
        ticket.origin,
        ticket.destination,
        ticket.departure_at,
        ticket.qr_code_data,
        ticket.status,
        ticket.sync_status,
        ticket.ticket_number,
        ticket.operator,
        ticket.service_class,
        ticket.amount_paid,
        JSON.stringify(ticket),
      ]
    );
  }
};

export const saveTicket = async (ticket: any, syncStatus: 'SYNCED' | 'PENDING' = 'SYNCED') => {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO tickets 
     (id, trip_id, seat_number, origin, destination, departure_at, qr_code_data, status, sync_status, ticket_number, operator, service_class, amount_paid, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticket.id,
      ticket.trip_id,
      ticket.seat_number,
      ticket.origin,
      ticket.destination,
      ticket.departure_at,
      ticket.qr_code_data || '',
      ticket.status,
      syncStatus,
      ticket.ticket_number || `KMD-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      ticket.operator || 'Komodo Express',
      ticket.service_class || 'Standard',
      ticket.amount_paid || 0,
      JSON.stringify(ticket),
    ]
  );
};

export const getTickets = async () => {
  const database = await getDb();
  return database.getAllAsync('SELECT * FROM tickets ORDER BY departure_at ASC');
};

export const getUpcomingTickets = async () => {
  const database = await getDb();
  const now = new Date().toISOString();
  return database.getAllAsync(
    'SELECT * FROM tickets WHERE departure_at >= ? ORDER BY departure_at ASC',
    [now]
  );
};

export const getPastTickets = async () => {
  const database = await getDb();
  const now = new Date().toISOString();
  return database.getAllAsync(
    'SELECT * FROM tickets WHERE departure_at < ? ORDER BY departure_at DESC',
    [now]
  );
};

export const getTicket = async (id: string) => {
  const database = await getDb();
  return database.getFirstAsync('SELECT * FROM tickets WHERE id = ?', [id]);
};

export const getPendingTickets = async () => {
  const database = await getDb();
  return database.getAllAsync("SELECT * FROM tickets WHERE sync_status = 'PENDING'");
};

export const markTicketSynced = async (id: string) => {
  const database = await getDb();
  await database.runAsync("UPDATE tickets SET sync_status = 'SYNCED' WHERE id = ?", [id]);
};
