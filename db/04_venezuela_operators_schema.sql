-- =============================================================================
-- 04_venezuela_operators_schema.sql
-- Operators, Fleet Catalog Metadata, Route Waypoints & Media Assets
-- =============================================================================

-- ---- Bus Operators / Líneas de Autobús ----
CREATE TABLE IF NOT EXISTS bus_operators (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_code   VARCHAR(64) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    legal_name      VARCHAR(200),
    logo_url        TEXT,
    service_tier    VARCHAR(30) NOT NULL DEFAULT 'STANDARD'
                    CHECK (service_tier IN ('STANDARD', 'EXECUTIVE', 'BUSCAMA_VIP', 'STATE')),
    home_terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_operators_code ON bus_operators(operator_code);

-- ---- Terminals Extensions ----
ALTER TABLE terminals
    ADD COLUMN IF NOT EXISTS terminal_code VARCHAR(64) UNIQUE,
    ADD COLUMN IF NOT EXISTS terminal_type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'
        CHECK (terminal_type IN ('PUBLIC', 'PRIVATE', 'INTERMODAL'));

-- ---- Routes Extensions ----
ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS route_geometry GEOGRAPHY(LINESTRING, 4326),
    ADD COLUMN IF NOT EXISTS service_category VARCHAR(20) NOT NULL DEFAULT 'REGIONAL'
        CHECK (service_category IN ('SHORT', 'REGIONAL', 'INTERSTATE', 'INTERNATIONAL'));

-- ---- Buses Extensions (Link to Operator & Canonical Seat Layout JSONB) ----
ALTER TABLE buses
    ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES bus_operators(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS model_code VARCHAR(64),
    ADD COLUMN IF NOT EXISTS capacity SMALLINT NOT NULL DEFAULT 40,
    ADD COLUMN IF NOT EXISTS seat_layout JSONB;

CREATE INDEX IF NOT EXISTS idx_buses_operator ON buses(operator_id);
CREATE INDEX IF NOT EXISTS idx_buses_model_code ON buses(model_code);

-- ---- Trips Extensions (Link to Operator, Integer Cents, Idempotent Trip Code) ----
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES bus_operators(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS trip_code VARCHAR(80) UNIQUE,
    ADD COLUMN IF NOT EXISTS price_usd_cents INTEGER CHECK (price_usd_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_trips_operator ON trips(operator_id);

-- ---- Route Waypoints & Rest Stops ----
CREATE TABLE IF NOT EXISTS route_waypoints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id        UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    sequence_order  SMALLINT NOT NULL,
    waypoint_type   VARCHAR(20) NOT NULL CHECK (waypoint_type IN ('ORIGIN', 'REST_STOP', 'CHECKPOINT', 'DESTINATION')),
    name            VARCHAR(150) NOT NULL,
    stop_duration_m SMALLINT DEFAULT 20,
    services        JSONB DEFAULT '{"food": true, "restrooms": true}'::jsonb,
    location        GEOGRAPHY(POINT, 4326),
    UNIQUE (route_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_route_waypoints_location ON route_waypoints USING GIST (location);

-- ---- Segmented Media Assets (4 Collections: TERMINAL, BUS, SCENERY, DESTINATION) ----
CREATE TABLE IF NOT EXISTS media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(20) NOT NULL CHECK (entity_type IN ('TERMINAL', 'BUS_MODEL', 'ROUTE')),
    entity_ref      VARCHAR(100) NOT NULL,
    collection_kind VARCHAR(20) NOT NULL CHECK (collection_kind IN ('TERMINAL', 'BUS', 'SCENERY', 'DESTINATION')),
    url             TEXT NOT NULL,
    thumbnail_url   TEXT,
    caption         VARCHAR(255),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_ref, collection_kind, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_lookup ON media_assets (entity_type, entity_ref, collection_kind);
