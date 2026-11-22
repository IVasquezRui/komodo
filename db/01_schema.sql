-- =============================================================================
-- 01_schema.sql
-- Relational Data Model for Ultra-Resilient Bus Ticket Platform
-- =============================================================================
-- DESIGN PRINCIPLES:
--   1. Every table uses UUID v4 primary keys (no sequential IDs to leak volume)
--   2. Timestamps use TIMESTAMPTZ (timezone-aware) for multi-country support
--   3. Reservations carry idempotency_key + sync_status for network resilience
--   4. Strategic indexes on high-frequency query patterns
--   5. CHECK constraints enforce domain invariants at the DB level
-- =============================================================================

-- ---- USERS ----
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(200) NOT NULL,
    phone_number    VARCHAR(20)  NOT NULL UNIQUE,
    email           VARCHAR(255),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'passenger'
                    CHECK (role IN ('passenger', 'driver', 'admin')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Phone number is the primary identifier (email is optional in many regions)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

COMMENT ON COLUMN users.phone_number IS 'Primary identifier — email is optional in regions with low email adoption';
COMMENT ON COLUMN users.role IS 'passenger: buys tickets | driver: validates QR codes | admin: manages routes';

-- ---- TERMINALS (Bus Stations) ----
CREATE TABLE IF NOT EXISTS terminals (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100),
    country     VARCHAR(3)   NOT NULL DEFAULT 'VEN',  -- ISO 3166-1 alpha-3
    address     TEXT,
    location    GEOGRAPHY(POINT, 4326),                -- PostGIS: lat/lng
    timezone    VARCHAR(50)  NOT NULL DEFAULT 'America/Caracas',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fuzzy search index for terminal names (handles typos on small phone keyboards)
CREATE INDEX IF NOT EXISTS idx_terminals_name_trgm ON terminals USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_terminals_city      ON terminals (city);
CREATE INDEX IF NOT EXISTS idx_terminals_country   ON terminals (country);
-- Spatial index for "nearest terminal" queries
CREATE INDEX IF NOT EXISTS idx_terminals_location  ON terminals USING gist (location);

COMMENT ON COLUMN terminals.location IS 'PostGIS POINT(lng, lat) in WGS84 — enables nearest-terminal searches';

-- ---- ROUTES ----
CREATE TABLE IF NOT EXISTS routes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_terminal_id      UUID         NOT NULL REFERENCES terminals(id) ON DELETE RESTRICT,
    destination_terminal_id UUID         NOT NULL REFERENCES terminals(id) ON DELETE RESTRICT,
    route_code              VARCHAR(20)  NOT NULL UNIQUE,
    distance_km             INTEGER      NOT NULL CHECK (distance_km > 0),
    estimated_duration      INTERVAL     NOT NULL,
    base_price_usd          NUMERIC(10,2) NOT NULL CHECK (base_price_usd >= 0),
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- A route cannot have the same origin and destination
    CONSTRAINT chk_route_different_terminals
        CHECK (origin_terminal_id != destination_terminal_id)
);

CREATE INDEX IF NOT EXISTS idx_routes_origin      ON routes (origin_terminal_id);
CREATE INDEX IF NOT EXISTS idx_routes_destination  ON routes (destination_terminal_id);
CREATE INDEX IF NOT EXISTS idx_routes_active       ON routes (is_active) WHERE is_active = TRUE;

-- Composite index for the most common search pattern: "from A to B"
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest
    ON routes (origin_terminal_id, destination_terminal_id)
    WHERE is_active = TRUE;

-- ---- TRIPS ----
CREATE TABLE IF NOT EXISTS trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id        UUID         NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    departure_at    TIMESTAMPTZ  NOT NULL,
    arrival_at      TIMESTAMPTZ  NOT NULL,
    bus_plate       VARCHAR(20),
    driver_name     VARCHAR(200),
    status          VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED'
                    CHECK (status IN (
                        'SCHEDULED',    -- Future trip, tickets available
                        'BOARDING',     -- Passengers boarding the bus
                        'IN_TRANSIT',   -- Bus is moving
                        'COMPLETED',    -- Trip finished
                        'CANCELLED'     -- Trip cancelled (refunds triggered)
                    )),
    total_seats     SMALLINT     NOT NULL CHECK (total_seats > 0 AND total_seats <= 80),
    available_seats SMALLINT     NOT NULL CHECK (available_seats >= 0),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Arrival must be after departure
    CONSTRAINT chk_trip_times CHECK (arrival_at > departure_at),
    -- Available seats cannot exceed total seats
    CONSTRAINT chk_trip_seats CHECK (available_seats <= total_seats)
);

CREATE INDEX IF NOT EXISTS idx_trips_route       ON trips (route_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure   ON trips (departure_at);
CREATE INDEX IF NOT EXISTS idx_trips_status       ON trips (status);

-- The hot query: "show me upcoming trips on route X"
CREATE INDEX IF NOT EXISTS idx_trips_route_departure
    ON trips (route_id, departure_at)
    WHERE status = 'SCHEDULED';

-- ---- SEATS ----
CREATE TABLE IF NOT EXISTS seats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number     SMALLINT     NOT NULL CHECK (seat_number > 0),
    seat_type       VARCHAR(20)  NOT NULL DEFAULT 'STANDARD'
                    CHECK (seat_type IN ('STANDARD', 'PREMIUM', 'VIP')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                    CHECK (status IN (
                        'AVAILABLE',    -- Can be purchased
                        'SOLD'          -- Confirmed purchase in PostgreSQL
                    )),
    price_override  NUMERIC(10,2),  -- NULL means use route base_price
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Each seat number is unique within a trip
    CONSTRAINT uq_seat_per_trip UNIQUE (trip_id, seat_number),
    -- Unique constraint for composite foreign key in reservations
    CONSTRAINT uq_seat_id_trip UNIQUE (id, trip_id)
);

CREATE INDEX IF NOT EXISTS idx_seats_trip    ON seats (trip_id);
CREATE INDEX IF NOT EXISTS idx_seats_status  ON seats (status);

-- Fast lookup: "available seats for trip X"
CREATE INDEX IF NOT EXISTS idx_seats_trip_available
    ON seats (trip_id)
    WHERE status = 'AVAILABLE';

-- ---- RESERVATIONS (The Critical Transaction Table) ----
CREATE TABLE IF NOT EXISTS reservations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seat_id             UUID         NOT NULL,
    trip_id             UUID         NOT NULL,

    -- ⚠️ RESILIENCE: Anti double-charge on network retries
    -- The client generates a UUID v4 BEFORE sending the purchase request.
    -- If the network drops and the client retries, PostgreSQL rejects the
    -- duplicate INSERT and we return the existing reservation instead.
    idempotency_key     UUID         NOT NULL UNIQUE,

    -- Reservation lifecycle
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                            'PENDING',          -- Created offline, awaiting server confirmation
                            'CONFIRMED',        -- Payment processed, ticket valid
                            'CANCELLED',        -- User cancelled before departure
                            'REFUNDED'          -- Money returned to user
                        )),

    -- ⚠️ RESILIENCE: Offline sync tracking
    sync_status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                        CHECK (sync_status IN (
                            'PENDING',          -- Not yet processed by server
                            'SYNCED',           -- Successfully synced
                            'FAILED'            -- Sync attempted but failed
                        )),

    -- Payment info
    amount_paid         NUMERIC(10,2) NOT NULL CHECK (amount_paid >= 0),
    currency            VARCHAR(3)    NOT NULL DEFAULT 'USD',
    payment_method      VARCHAR(50),
    payment_reference   VARCHAR(255),

    -- ⚠️ RESILIENCE: QR data stored server-side so the client downloads it
    -- once and can display it offline in rural areas with zero signal
    qr_code_data        TEXT,

    -- Metadata captured when the reservation was made offline
    -- (device info, local timestamp, GPS coordinates, etc.)
    offline_metadata    JSONB,

    -- Timestamps
    purchased_at        TIMESTAMPTZ,
    synced_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Composite foreign key for seat and trip consistency
    FOREIGN KEY (seat_id, trip_id) REFERENCES seats(id, trip_id) ON DELETE RESTRICT
);

-- Idempotency lookup (the most critical index for resilience)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_idempotency
    ON reservations (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_reservations_user       ON reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_seat       ON reservations (seat_id);
CREATE INDEX IF NOT EXISTS idx_reservations_trip       ON reservations (trip_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status     ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_sync       ON reservations (sync_status)
    WHERE sync_status != 'PROCESSED';

-- Prevent selling the same seat twice (belt AND suspenders with FOR UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_seat_confirmed
    ON reservations (seat_id)
    WHERE status IN ('CONFIRMED', 'PENDING_SYNC');

COMMENT ON TABLE reservations IS 'Core transactional table with idempotency_key for network retry safety and sync_status for offline-first mobile support';

-- =============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['users', 'terminals', 'routes', 'trips', 'seats', 'reservations'])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;
