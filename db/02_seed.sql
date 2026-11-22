-- =============================================================================
-- 02_seed.sql
-- Sample data for development and testing
-- =============================================================================
-- This seed creates a realistic scenario:
--   - 4 terminals across Venezuela
--   - 3 routes connecting them
--   - 2 upcoming trips with seats
--   - 2 test users (1 passenger, 1 driver)
-- =============================================================================

-- ---- Test Users ----
-- Password for both: "test1234" (bcrypt hash)
INSERT INTO users (id, full_name, phone_number, email, password_hash, role) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'María García', '+58412-1234567', 'maria@example.com',
     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'passenger'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'Carlos Rodríguez', '+58414-7654321', 'carlos@example.com',
     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'driver'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'Admin Sistema', '+58416-0000000', 'admin@komodo.com',
     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'admin')
ON CONFLICT (phone_number) DO NOTHING;

-- ---- Terminals ----
INSERT INTO terminals (id, name, city, state, country, address, location, timezone) VALUES
    ('t0000001-0000-0000-0000-000000000001',
     'Terminal La Bandera', 'Caracas', 'Distrito Capital', 'VEN',
     'Av. Nueva Granada, Caracas',
     ST_SetSRID(ST_MakePoint(-66.9196, 10.4806), 4326),
     'America/Caracas'),

    ('t0000002-0000-0000-0000-000000000002',
     'Terminal de Pasajeros de Maracaibo', 'Maracaibo', 'Zulia', 'VEN',
     'Av. 15 Delicias, Maracaibo',
     ST_SetSRID(ST_MakePoint(-71.6125, 10.6427), 4326),
     'America/Caracas'),

    ('t0000003-0000-0000-0000-000000000003',
     'Terminal de Barquisimeto', 'Barquisimeto', 'Lara', 'VEN',
     'Carrera 25 con Calle 43, Barquisimeto',
     ST_SetSRID(ST_MakePoint(-69.3220, 10.0678), 4326),
     'America/Caracas'),

    ('t0000004-0000-0000-0000-000000000004',
     'Terminal de Valencia', 'Valencia', 'Carabobo', 'VEN',
     'Av. Bolívar, Valencia',
     ST_SetSRID(ST_MakePoint(-68.0039, 10.1620), 4326),
     'America/Caracas')
ON CONFLICT DO NOTHING;

-- ---- Routes ----
INSERT INTO routes (id, origin_terminal_id, destination_terminal_id, route_code, distance_km, estimated_duration, base_price_usd) VALUES
    ('r0000001-0000-0000-0000-000000000001',
     't0000001-0000-0000-0000-000000000001',  -- Caracas
     't0000002-0000-0000-0000-000000000002',  -- Maracaibo
     'CCS-MCB-001', 694, INTERVAL '9 hours 30 minutes', 25.00),

    ('r0000002-0000-0000-0000-000000000002',
     't0000001-0000-0000-0000-000000000001',  -- Caracas
     't0000003-0000-0000-0000-000000000003',  -- Barquisimeto
     'CCS-BRM-001', 365, INTERVAL '5 hours', 15.00),

    ('r0000003-0000-0000-0000-000000000003',
     't0000004-0000-0000-0000-000000000004',  -- Valencia
     't0000002-0000-0000-0000-000000000002',  -- Maracaibo
     'VLC-MCB-001', 550, INTERVAL '7 hours 30 minutes', 20.00)
ON CONFLICT (route_code) DO NOTHING;

-- ---- Trips (upcoming) ----
INSERT INTO trips (id, route_id, departure_at, arrival_at, bus_plate, driver_name, status, total_seats, available_seats) VALUES
    -- Trip 1: Caracas → Maracaibo, tomorrow morning
    ('v0000001-0000-0000-0000-000000000001',
     'r0000001-0000-0000-0000-000000000001',
     NOW() + INTERVAL '1 day' + TIME '06:00',
     NOW() + INTERVAL '1 day' + TIME '15:30',
     'ABC-123', 'Carlos Rodríguez',
     'SCHEDULED', 40, 40),

    -- Trip 2: Caracas → Barquisimeto, tomorrow afternoon
    ('v0000002-0000-0000-0000-000000000002',
     'r0000002-0000-0000-0000-000000000002',
     NOW() + INTERVAL '1 day' + TIME '14:00',
     NOW() + INTERVAL '1 day' + TIME '19:00',
     'DEF-456', 'Pedro Martínez',
     'SCHEDULED', 32, 32)
ON CONFLICT DO NOTHING;

-- ---- Seats for Trip 1 (40 seats: 30 standard, 8 premium, 2 VIP) ----
INSERT INTO seats (trip_id, seat_number, seat_type, status)
SELECT
    'v0000001-0000-0000-0000-000000000001'::UUID,
    n,
    CASE
        WHEN n <= 2  THEN 'VIP'
        WHEN n <= 10 THEN 'PREMIUM'
        ELSE 'STANDARD'
    END,
    'AVAILABLE'
FROM generate_series(1, 40) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- ---- Seats for Trip 2 (32 seats: 24 standard, 6 premium, 2 VIP) ----
INSERT INTO seats (trip_id, seat_number, seat_type, status)
SELECT
    'v0000002-0000-0000-0000-000000000002'::UUID,
    n,
    CASE
        WHEN n <= 2  THEN 'VIP'
        WHEN n <= 8  THEN 'PREMIUM'
        ELSE 'STANDARD'
    END,
    'AVAILABLE'
FROM generate_series(1, 32) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- =============================================================================
-- Verification query — run after seeding to confirm data integrity
-- =============================================================================
-- SELECT
--     t.name AS terminal,
--     r.route_code,
--     tr.departure_at,
--     tr.total_seats,
--     COUNT(s.id) AS seats_created
-- FROM terminals t
-- JOIN routes r ON r.origin_terminal_id = t.id
-- JOIN trips tr ON tr.route_id = r.id
-- JOIN seats s ON s.trip_id = tr.id
-- GROUP BY t.name, r.route_code, tr.departure_at, tr.total_seats;
