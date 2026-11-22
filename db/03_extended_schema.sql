-- =============================================================================
-- 03_extended_schema.sql
-- Fase 6: Extensiones para Flota, Multi-Pasajeros y Pagos Comerciales
-- =============================================================================

-- ---- Tabla de Flota de Autobuses ----
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(100) DEFAULT 'Marcopolo',
    decks SMALLINT NOT NULL DEFAULT 1 CHECK (decks IN (1, 2)),
    amenities JSONB DEFAULT '{"wifi": true, "ac": true, "bath": true, "usb": true}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'RETIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_plate ON buses(plate);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- ---- Extensiones a Tablas Existentes ----
ALTER TABLE seats ADD COLUMN IF NOT EXISTS deck_number SMALLINT NOT NULL DEFAULT 1 CHECK (deck_number IN (1, 2));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS bus_id UUID REFERENCES buses(id) ON DELETE SET NULL;

-- ---- Tabla de Pagos y Transacciones Financieras ----
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('STRIPE', 'PAGO_MOVIL', 'TRANSFER', 'CASH')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    reference VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED')),
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ---- Tabla de Pasajeros por Reserva (Multi-Pasajero) ----
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    doc_type VARCHAR(20) NOT NULL DEFAULT 'V' CHECK (doc_type IN ('V', 'E', 'J', 'P', 'DNI')),
    doc_number VARCHAR(50) NOT NULL,
    passenger_type VARCHAR(20) NOT NULL DEFAULT 'ADULT' CHECK (passenger_type IN ('ADULT', 'CHILD', 'SENIOR')),
    seat_number SMALLINT NOT NULL,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passengers_reservation ON passengers(reservation_id);
CREATE INDEX IF NOT EXISTS idx_passengers_doc ON passengers(doc_type, doc_number);
