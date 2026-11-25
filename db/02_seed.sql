-- =============================================================================
-- 02_seed.sql
-- Sample data for development and testing (Valid UUIDs, Idempotent)
-- =============================================================================

-- ---- Test Users ----
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

-- ---- Terminals (4 core sample terminals with valid hex UUIDs) ----
INSERT INTO terminals (id, name, city, state, country, address, location, timezone) VALUES
    ('10000001-0000-0000-0000-000000000001',
     'Terminal de Pasajeros de La Bandera', 'Caracas', 'Distrito Capital', 'VEN',
     'Av. Nueva Granada, Caracas',
     ST_SetSRID(ST_MakePoint(-66.8993, 10.4767), 4326),
     'America/Caracas'),

    ('10000001-0000-0000-0000-000000000002',
     'Gran Terminal de Pasajeros de Maracaibo', 'Maracaibo', 'Zulia', 'VEN',
     'Av. 15 Delicias, Maracaibo',
     ST_SetSRID(ST_MakePoint(-71.6198, 10.6355), 4326),
     'America/Caracas'),

    ('10000001-0000-0000-0000-000000000003',
     'Terminal de Pasajeros de Barquisimeto', 'Barquisimeto', 'Lara', 'VEN',
     'Carrera 25 con Calle 43, Barquisimeto',
     ST_SetSRID(ST_MakePoint(-69.3341, 10.0691), 4326),
     'America/Caracas'),

    ('10000001-0000-0000-0000-000000000004',
     'Terminal de Pasajeros Big Low Center', 'Valencia', 'Carabobo', 'VEN',
     'Autopista Regional del Centro, San Diego',
     ST_SetSRID(ST_MakePoint(-67.9667, 10.1928), 4326),
     'America/Caracas')
ON CONFLICT DO NOTHING;

-- ---- Routes ----
INSERT INTO routes (id, origin_terminal_id, destination_terminal_id, route_code, distance_km, estimated_duration, base_price_usd) VALUES
    ('20000001-0000-0000-0000-000000000001',
     '10000001-0000-0000-0000-000000000001',
     '10000001-0000-0000-0000-000000000002',
     'CCS-MCB', 694, INTERVAL '9 hours 30 minutes', 25.00),

    ('20000001-0000-0000-0000-000000000002',
     '10000001-0000-0000-0000-000000000001',
     '10000001-0000-0000-0000-000000000003',
     'CCS-BRM', 360, INTERVAL '5 hours', 15.00),

    ('20000001-0000-0000-0000-000000000003',
     '10000001-0000-0000-0000-000000000004',
     '10000001-0000-0000-0000-000000000002',
     'VAL-MCB', 550, INTERVAL '7 hours 30 minutes', 20.00)
ON CONFLICT (route_code) DO NOTHING;

-- ---- Trips ----
INSERT INTO trips (id, route_id, departure_at, arrival_at, bus_plate, driver_name, status, total_seats, available_seats) VALUES
    ('30000001-0000-0000-0000-000000000001',
     '20000001-0000-0000-0000-000000000001',
     NOW() + INTERVAL '1 day' + TIME '06:00',
     NOW() + INTERVAL '1 day' + TIME '15:30',
     'ABC-123', 'Carlos Rodríguez',
     'SCHEDULED', 40, 40),

    ('30000001-0000-0000-0000-000000000002',
     '20000001-0000-0000-0000-000000000002',
     NOW() + INTERVAL '1 day' + TIME '14:00',
     NOW() + INTERVAL '1 day' + TIME '19:00',
     'DEF-456', 'Pedro Martínez',
     'SCHEDULED', 32, 32)
ON CONFLICT DO NOTHING;

-- ---- Seats ----
INSERT INTO seats (trip_id, seat_number, seat_type, status)
SELECT
    '30000001-0000-0000-0000-000000000001'::UUID,
    n,
    CASE
        WHEN n <= 2  THEN 'VIP'
        WHEN n <= 10 THEN 'PREMIUM'
        ELSE 'STANDARD'
    END,
    'AVAILABLE'
FROM generate_series(1, 40) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;

INSERT INTO seats (trip_id, seat_number, seat_type, status)
SELECT
    '30000001-0000-0000-0000-000000000002'::UUID,
    n,
    CASE
        WHEN n <= 2  THEN 'VIP'
        WHEN n <= 8  THEN 'PREMIUM'
        ELSE 'STANDARD'
    END,
    'AVAILABLE'
FROM generate_series(1, 32) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;
