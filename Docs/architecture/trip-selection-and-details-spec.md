# Auditoría Técnica y Especificación Arquitectónica: Selección y Detalles del Viaje (Módulos A y B)

> **Proyecto:** Komodo — Plataforma de Venta de Pasajes Terrestres en Venezuela  
> **Alcance:** Auditoría integral del repositorio actual + Diseño arquitectónico para los Módulos de **Selección de Viaje (Módulo A)** y **Vista de Detalles del Viaje (Módulo B)**.  
> **Principios Rectores:** Cero degradación de **Idempotencia** ni **Offline-First**.

---

## FASE 1: Auditoría Exhaustiva del Repositorio Actual

### 1.1 Stack Real Detectado en el Repositorio

| Capa / Servicio | Tecnología y Versión Real Detectada | Archivo de Evidencia | Puerto |
|---|---|---|---:|
| **Go Gateway** | Go (`go 1.25` / `golang:alpine`), Gin (`gin-gonic/gin`), `pgxpool` (`jackc/pgx/v5`), `go-redis/v9` | `gateway/go.mod`, `gateway/main.go`, `gateway/Dockerfile` | `8080` |
| **FastAPI Core** | Python 3.12 (`python:3.12-slim`), FastAPI, SQLAlchemy 2.0 async, `asyncpg`, Pydantic v2 | `core/Dockerfile`, `core/requirements.txt`, `core/app/main.py` | `8000` |
| **Base de Datos** | PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4-alpine`) | `docker-compose.yml`, `db/00_extensions.sql` | `5432` |
| **Caché / Shield** | Redis 7 (`redis:7-alpine`, efímero sin volumen) | `docker-compose.yml`, `redis/redis.conf` | `6379` |
| **Mobile App** | React Native `0.86.0`, Expo SDK `~57.0.8`, `expo-router ~57.0.8`, `zustand ^5.0.14`, `expo-sqlite ~57.0.1`, `react-native-reanimated 4.5.0`, `@react-native-community/netinfo 12.0.1` | `mobile/package.json`, `mobile/app.json` | `8081` |
| **Web Platform** | **Vite `5.3.4` + React `18.3.1` + TypeScript `5.5.0` + Tailwind CSS `3.4.4`** + `lucide-react` (`komodo-admin-web`, servido con Nginx en Docker) | `frontend/package.json`, `frontend/vite.config.ts`, `frontend/Dockerfile` | `3000` |

### 1.2 Inventario de Módulos Existentes

1. **Base de Datos (`db/`):**
   - `db/01_schema.sql`: Tablas `users`, `terminals` (`GEOGRAPHY(POINT, 4326)` + índice `GIST` + `gin_trgm_ops`), `routes` (`route_code`, `distance_km`, `estimated_duration`, `base_price_usd`), `trips` (`departure_at`, `arrival_at`, `bus_plate`, `driver_name`, `total_seats`, `available_seats`), `seats` (`seat_number`, `seat_type`, `status`), `reservations` (`idempotency_key UUID UNIQUE`, `sync_status`, `qr_code_data`, `offline_metadata JSONB`).
   - `db/02_seed.sql`: Semilla básica de 3 usuarios, 4 terminales, 3 rutas y 2 viajes iniciales.
   - `db/03_extended_schema.sql`: Tablas `buses` (`plate`, `model`, `brand`, `decks`, `amenities JSONB`, `status`), `payments` (`STRIPE`, `PAGO_MOVIL`, `TRANSFER`, `CASH`), `passengers` (soporte multi-pasajero) y extensión `seats.deck_number`, `trips.bus_id`.
2. **FastAPI Core (`core/app/`):**
   - Modelos SQLAlchemy: `User`, `Terminal`, `Route`, `Trip`, `Seat`, `Reservation`, `Bus`, `Payment`, `Passenger`.
   - Routers registrados en `core/app/main.py`: `/api/v1/auth` (`register`, `login`, `me`, `refresh`), `/api/v1/admin` (`stats`, `fleet`, `routes`, `trips`), `/api/v1/notifications`, `/api/v1/payments`, `/api/v1/tickets` (`validate-qr`, `manifest`, `manual-board`), `/api/v1/reservations`, `/api/v1/trips` (`GET /{trip_id}`).
   - Sin migraciones Alembic implementadas aún (esquema gestionado vía scripts ordenados en `db/00..0N_*.sql`).
3. **Go Gateway (`gateway/`):**
   - Endpoints locales de alto rendimiento: `GET /api/v1/search` (`handlers/search.go`, cache-aside con Redis + consulta directa `pgxpool`), `POST /api/v1/hold-seat` (`handlers/hold_seat.go`, bloqueo `SetNX` + Pub/Sub SSE), `POST /api/v1/release-seat`, `GET /api/v1/trips/:trip_id/seat-stream` (`handlers/sse.go`), `GET /api/v1/ping`, `GET /health`.
   - Reverse Proxy con Circuit Breaker (`resilience/circuit_breaker.go`) y Rate Limiter (`resilience/rate_limiter.go`) hacia Core (`/auth`, `/admin`, `/notifications`, `/tickets`, `/reservations`, `/trips/:trip_id`, `/payments`).
4. **Mobile App (`mobile/`):**
   - Pantallas Expo Router: `app/(tabs)/index.tsx` (búsqueda), `app/search-results.tsx`, `app/select-seat.tsx`, `app/checkout.tsx`, `app/ticket/[id].tsx`, `app/login.tsx`, `app/register.tsx`, `app/driver/scanner.tsx`, `app/driver/manifest.tsx`.
   - Capa offline/local: `lib/storage.ts` (`expo-sqlite` con tabla `tickets` y `sync_status`), `lib/sync.ts` (listener `@react-native-community/netinfo` que sincroniza reservas `PENDING` enviando `idempotency_key`), `lib/auth.ts` (`zustand` + `AsyncStorage`).
5. **Web Platform (`frontend/`):**
   - Portal administrativo SPA en React 18 + Vite (`src/App.tsx`) con navegación por estado (`NavTab`: `dashboard`, `fleet`, `routes`, `trips`, `sales`, `manifest`), sin router URL (`react-router-dom`) aún ni vista pública de pasajero/registro web.

### 1.3 Verificación de Idempotencia y Offline-First

- **Idempotencia (Backend + Mobile):**
  - En `core/app/services/reservation_service.py`: Antes de adquirir bloqueo `FOR UPDATE NOWAIT` sobre `seats`, se verifica `Reservation.idempotency_key == request.idempotency_key`; si existe, lanza `IdempotencyConflictError` que el handler global convierte en `200 OK` devolviendo la reserva previa sin duplicar cobro ni asiento. La columna `reservations.idempotency_key` tiene restricción `UNIQUE` en PostgreSQL.
  - En `mobile/app/checkout.tsx`: Genera un UUID v4 cliente (`generateUUID()`) antes de llamar a `confirmReservation(...)` y lo persiste localmente junto al boleto en SQLite.
  - **Restricción crítica:** Cualquier nuevo flujo de detalle, pre-reserva o registro debe mantener la generación anticipada de `idempotency_key` en cliente y nunca depender de llaves secuenciales del servidor.
- **Offline-First:**
  - En `mobile/lib/storage.ts` + `mobile/lib/sync.ts`: Los boletos comprados sin señal se guardan en SQLite (`komodo.db`) con `sync_status = 'PENDING'` y `startSyncService()` los reenvía al recuperar red (omitido en `Platform.OS === 'web'` para evitar bloqueos OPFS).
  - En `mobile/app/search-results.tsx`: Actualmente cae a `MOCK_TRIPS` en caso de error de red, **sin caché local persistente de búsquedas reales previas** ni metadatos de antigüedad (`lastSyncedAt`).
  - **Restricción crítica:** Para los Módulos A y B, la búsqueda y los detalles del viaje deben implementar caché local persistente (SQLite/AsyncStorage en Mobile; `localStorage`/IndexedDB o Cache API en Web) con política **stale-while-revalidate** e indicador explícito de datos cacheados en modo offline.

### 1.4 Análisis de Brechas (*Gap Analysis*)

| Módulo / Requerimiento | Estado | Archivo(s) Afectados | Acción Requerida |
|---|---|---|---|
| **Operadoras / Líneas de Bus en BD y Search** | Faltante | `db/01_schema.sql`, `db/03_extended_schema.sql`, `gateway/handlers/search.go`, `gateway/models/responses.go` | Crear tabla `bus_operators`, vincular `buses.operator_id` y `trips.operator_id`, exponer empresa/logo/modelo en `GET /api/v1/search`. |
| **Precios en centavos enteros (`price_usd_cents`)** | Requiere Corrección | `gateway/models/responses.go`, `core/app/models/route.py`, `mobile/app/search-results.tsx` | Estandarizar `price_usd_cents` (int64/INTEGER) en APIs y utilidades financieras para evitar aritmética `float` en UI. |
| **Detalle completo de Viaje (`GET /api/v1/trips/{id}/details`)** | Faltante | `core/app/routers/trips.py`, `gateway/main.go` | Añadir endpoint consolidado con modelo de bus, `amenities` JSONB, GeoJSON de ruta, parada de descanso (`rest_stop`) y galería de 4 categorías. |
| **Mapa Interactivo PostGIS + Parada de Descanso** | Faltante | `db/`, `core/app/models/`, `mobile/`, `frontend/` | Agregar `route_geometry GEOGRAPHY(LINESTRING, 4326)` y tabla `route_waypoints` (`REST_STOP`) e integrar componente de mapa con fallback offline. |
| **Galería Multimedia 4 Colecciones** | Faltante | `db/`, `core/app/models/`, `mobile/`, `frontend/` | Crear tabla `media_assets` tipada (`TERMINAL`, `BUS`, `SCENERY`, `DESTINATION`) y componente carrusel con caché local. |
| **Indicadores minimalistas WiFi y A/A** | Parcial | `core/app/models/bus.py`, `mobile/components/TripCard.tsx` | `Bus.amenities` existe en BD pero no se proyecta en Search ni en Mobile UI; exponer chips minimalistas con estado explícito (`Disponible` / `No disponible`). |
| **Caché Offline de Búsquedas y Detalles** | Parcial | `mobile/lib/storage.ts`, `mobile/app/search-results.tsx` | Reemplazar fallback estático a `MOCK_TRIPS` por caché real en SQLite/AsyncStorage con timestamp y badge `"Modo offline — Mostrando horarios guardados"`. |
| **Vista de Detalles del Viaje (`app/trip/[id].tsx`)** | Faltante | `mobile/app/search-results.tsx`, `mobile/app/trip/[id].tsx` | Actualmente `TripCard` salta directo a `/select-seat`. Intercalar pantalla de Detalles del Viaje con CTA flotante `8.1#`. |

---

## FASE 2: Especificación Arquitectónica — Módulos A y B

### 2.1 Matriz de Librerías y Versiones Recomendadas

| Servicio | Librería / Paquete Recomendado | Versión Compatible | Justificación (MVP + Producción) |
|---|---|---|---|
| **Go Gateway (`8080`)** | `github.com/gin-gonic/gin`, `github.com/jackc/pgx/v5/pgxpool`, `github.com/redis/go-redis/v9` | Ya instaladas en `gateway/go.mod` (Go `>=1.23`) | Cero dependencias nuevas necesarias. `pgxpool` consulta `ST_AsGeoJSON` directamente si se requiere lectura rápida, y `go-redis` gestiona caché `komodo:search:*` y `komodo:trip_details:*`. |
| **FastAPI Core (`8000`)** | `fastapi`, `sqlalchemy[asyncio]`, `asyncpg`, `pydantic>=2`, `geoalchemy2` (opcional) o SQL `func.ST_AsGeoJSON` | Python `3.12` (ya instalado) | Se recomienda usar `sqlalchemy.func.ST_AsGeoJSON` / `func.ST_MakeLine` nativo sobre SQLAlchemy 2.0 para evitar sobrecarga de C-extensions pesadas en contenedores slim. |
| **PostgreSQL / PostGIS (`5432`)** | PostGIS `3.4` sobre PostgreSQL `16` | `postgis/postgis:16-3.4-alpine` (ya activo) | Índices `GIST` para terminales y rutas `LINESTRING` + conversión directa a GeoJSON RFC 7946 sin serialización extra en Python. |
| **Redis (`6379`)** | Redis `7` (`redis:7-alpine`) | Ya activo | Cache-Aside con claves normalizadas `komodo:search:{orig}:{dest}:{date}` (TTL 120s) e invalidación explícita ante eventos de reserva/asiento. |
| **Mobile App (`8081`)** | `expo-image` (o `Image` con caché disco), `react-native-maps` (`~1.20+` vía `npx expo install`) o **MapLibre (`@maplibre/maplibre-react-native`) / SVG Polyline fallback** | Expo SDK `~57.0.8` | **Recomendación MVP costo cero:** En Expo Go / Web donde MapLibre nativo requiere Dev Client, usar `react-native-maps` con tiles OpenStreetMap/MapTiler o un **componente SVG GeoJSON interactivo offline-first** como fallback automático cuando no hay red o se ejecuta en Expo Web. |
| **Web Platform (`3000`)** | `leaflet` (`^1.9`) + `react-leaflet` (`^4.2` para React 18) o `maplibre-gl` (`^4.x`), `motion` (`motion/react`), `@tabler/icons-react` | React `18.3.1` + Vite `5.3.4` + Tailwind `3.4.4` | **`leaflet` + OpenStreetMap tiles** tiene costo **$0**, sin API key obligatoria de facturación, peso reducido (~42 KB gz) y compatibilidad total con React 18; en offline muestra la polilínea SVG desde el GeoJSON cacheado en `localStorage`/IndexedDB. |

---

### 2.2 Modelo de Datos y Migración Propuesta (`db/04_modules_ab_schema.sql`)

```sql
-- 1. Operadoras / Líneas de Autobús
CREATE TABLE IF NOT EXISTS bus_operators (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_code   VARCHAR(64) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    legal_name      VARCHAR(200),
    logo_url        TEXT,
    service_tier    VARCHAR(30) NOT NULL DEFAULT 'STANDARD'
                    CHECK (service_tier IN ('STANDARD', 'EXECUTIVE', 'BUSCAMA_VIP', 'STATE')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Catálogo de Modelos de Parque Automotor y vinculación a Buses/Trips
ALTER TABLE buses
    ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES bus_operators(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS model_code VARCHAR(64),
    ADD COLUMN IF NOT EXISTS capacity SMALLINT NOT NULL DEFAULT 40,
    ADD COLUMN IF NOT EXISTS seat_layout JSONB;

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES bus_operators(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS price_usd_cents INTEGER CHECK (price_usd_cents >= 0);

-- 3. Extensión PostGIS en Rutas + Paradas de Descanso
ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS route_geometry GEOGRAPHY(LINESTRING, 4326),
    ADD COLUMN IF NOT EXISTS service_category VARCHAR(20) NOT NULL DEFAULT 'REGIONAL'
        CHECK (service_category IN ('SHORT', 'REGIONAL', 'INTERSTATE', 'INTERNATIONAL'));

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

-- 4. Galería Multimedia Segmentada (4 Colecciones Obligatorias)
CREATE TABLE IF NOT EXISTS media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(20) NOT NULL CHECK (entity_type IN ('TERMINAL', 'BUS_MODEL', 'ROUTE')),
    entity_ref      VARCHAR(100) NOT NULL, -- terminal_code, model_code o route_code
    collection_kind VARCHAR(20) NOT NULL CHECK (collection_kind IN ('TERMINAL', 'BUS', 'SCENERY', 'DESTINATION')),
    url             TEXT NOT NULL,
    thumbnail_url   TEXT,
    caption         VARCHAR(255),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_lookup ON media_assets (entity_type, entity_ref, collection_kind);
```

---

### 2.3 Flujo Cache-Aside, Invalidación y Estrategia Offline-First

#### Módulo A: Búsqueda de Líneas por Ruta (`GET /api/v1/search`)
1. **Clave Redis:** `komodo:search:{origin_id_or_code}:{destination_id_or_code}:{YYYY-MM-DD}` (`TTL = 120s`, configurable en `SEARCH_CACHE_TTL_SECONDS`).
2. **Cache-Aside en Go Gateway (`8080`):**
   - Si existe en Redis, responde inmediatamente con `ch: true` (`CacheHit`).
   - En miss, consulta PostgreSQL con `JOIN` a `routes`, `bus_operators`, `buses` y `terminals`, serializa precios como `price_usd_cents` (entero) y `prc` (string formateado para retrocompatibilidad), guarda asíncronamente en Redis y responde `ch: false`.
3. **Invalidación Proactiva:**
   - Cuando Core confirma una reserva (`POST /api/v1/reservations/`) o Admin crea/cancela un viaje, invalida la clave `komodo:search:{orig}:{dest}:{date}` y publica evento en el canal Pub/Sub `komodo:trip:{trip_id}:seat_updates`.
4. **Offline-First en Mobile y Web:**
   - **Stale-While-Revalidate:** Al ejecutar búsqueda, la app lee inmediatamente la última respuesta guardada en SQLite (`cached_searches`) o `localStorage` para `(origin, destination, date)` y muestra resultados con sello temporal mientras solicita datos frescos al Gateway.
   - Si la red falla o está offline, conserva los resultados cacheados y renderiza un banner no intrusivo: *"Sin conexión — Mostrando horarios guardados (actualizado hace X min)"*.

#### Módulo B: Detalles del Viaje (`GET /api/v1/trips/{trip_id}/details`)
1. **Respuesta Cacheable:** Los metadatos estáticos de ruta (`route_geojson`, `waypoints` con `rest_stop`, `media` de 4 colecciones y `bus_model`) se cachean en Redis por `600s` (`komodo:trip_details:{trip_id}`), mientras `available_seats` se refresca desde Postgres o Redis `HOLD` keys.
2. **Offline-First de Medios y Mapa:**
   - Al visualizar detalles en línea, la app persiste el JSON del detalle (incluyendo el GeoJSON simplificado `route_geojson` y las coordenadas de `rest_stop`) en SQLite (`cached_trip_details`) y precarga las miniaturas WebP/AVIF con `expo-image` / Cache Storage del Service Worker en Web.
   - Si el usuario abre un viaje previamente consultado estando **offline**, el mapa renderiza la polilínea SVG del GeoJSON cacheado con marcador de parada de descanso sin depender de tiles remotos.

---

### 2.4 Contratos REST / JSON

#### 1. `GET /api/v1/search?origin={uuid}&destination={uuid}&date={YYYY-MM-DD}`
- **Status HTTP:** `200 OK`, `400 Bad Request`, `503 Service Unavailable` (Circuit Breaker abierto).
- **Response (`200 OK`):**
```json
{
  "r": [
    {
      "tid": "v0000001-0000-0000-0000-000000000001",
      "rc": "CCS-MCB",
      "operator": {
        "code": "aeroexpresos_ejecutivos",
        "name": "Aeroexpresos Ejecutivos C.A.",
        "service_tier": "BUSCAMA_VIP",
        "logo_url": "https://cdn.komodo.app/operators/aeroexpresos.webp"
      },
      "bus_model": "Marcopolo Paradiso G6 1800DD",
      "org": "Terminal La Bandera",
      "dst": "Gran Terminal de Pasajeros de Maracaibo",
      "dep": "2026-12-01T06:00:00-04:00",
      "arr": "2026-12-01T16:30:00-04:00",
      "avl": 42,
      "price_usd_cents": 3500,
      "prc": "35.00",
      "amenities": { "wifi": false, "ac": true, "bath": true, "usb": true }
    }
  ],
  "c": 1,
  "ch": false
}
```

#### 2. `GET /api/v1/trips/{trip_id}/details`
- **Status HTTP:** `200 OK`, `404 Not Found`.
- **Response (`200 OK`):**
```json
{
  "trip_id": "v0000001-0000-0000-0000-000000000001",
  "route_code": "CCS-MCB",
  "departure_at": "2026-12-01T06:00:00-04:00",
  "arrival_at": "2026-12-01T16:30:00-04:00",
  "price_usd_cents": 3500,
  "available_seats": 42,
  "max_seats_per_booking": 6,
  "operator": {
    "code": "aeroexpresos_ejecutivos",
    "name": "Aeroexpresos Ejecutivos C.A."
  },
  "bus": {
    "model_code": "marcopolo_paradiso_g6_1800dd",
    "brand": "Marcopolo",
    "model": "Paradiso G6 1800 DD",
    "decks": 2,
    "amenities": { "wifi": false, "ac": true, "bath": true, "usb": true }
  },
  "origin_terminal": { "code": "ccs_la_bandera", "name": "Terminal La Bandera", "city": "Caracas", "lat": 10.4767, "lon": -66.8993 },
  "destination_terminal": { "code": "zul_maracaibo_central", "name": "Gran Terminal de Pasajeros de Maracaibo", "city": "Maracaibo", "lat": 10.6355, "lon": -71.6198 },
  "route_geojson": {
    "type": "LineString",
    "coordinates": [[-66.8993, 10.4767], [-69.3341, 10.0691], [-71.6198, 10.6355]]
  },
  "rest_stops": [
    {
      "name": "Parador Turístico La Encrucijada / Carora",
      "stop_duration_minutes": 25,
      "lat": 10.175,
      "lon": -70.082,
      "services": { "food": true, "restrooms": true }
    }
  ],
  "media_gallery": {
    "terminal": [{ "url": "...", "thumbnail_url": "...", "caption": "Andén de salida La Bandera" }],
    "bus": [{ "url": "...", "thumbnail_url": "...", "caption": "Marcopolo Paradiso G6 1800 DD" }],
    "scenery": [{ "url": "...", "thumbnail_url": "...", "caption": "Puente sobre el Lago de Maracaibo" }],
    "destination": [{ "url": "...", "thumbnail_url": "...", "caption": "Maracaibo, Zulia" }]
  }
}
```

---

### 2.5 Arquitectura de Componentes UI y Plan de Implementación

#### Jerarquía de Componentes UI
- **Módulo A (Listado de Viajes):**
  - `OfflineStaleBanner` (indicador de sincronización / caché)
  - `RouteFilterChips` (Ordenar por: Hora, Precio USD, Operadora, Solo con A/A)
  - `OperatorTripCard` (Logo/Nombre empresa, modelo de bus, Salida → ETA, `price_usd_cents` formateado en USD, asientos disponibles, mini badges `WiFi` y `A/A`)
- **Módulo B (Detalles del Viaje):**
  - `TripDetailHeader` (Ruta, fecha, empresa y tarifa unitaria USD)
  - `AmenitiesGrid` (Indicadores minimalistas explícitos para **WiFi** y **A/A** + extensibilidad para Baño/USB desde JSONB)
  - `InteractiveRouteMap` (Leaflet en Web / `react-native-maps` + fallback SVG GeoJSON offline en Mobile, resaltando **parada de descanso** con tooltip de duración)
  - `SegmentedMediaGallery` (4 pestañas/colecciones obligatorias: *Terminal*, *Autobús*, *Paisaje*, *Destino*)
  - `FloatingPurchaseCTA` + `SeatQuantitySheet` (Requerimiento `8.1#` — puente hacia mapa 2D/3D de asientos)

#### Orden de Implementación Recomendado (por Dependencias)
1. **Datos y Semilla (`db/`):** Ejecutar migraciones de `bus_operators`, `route_waypoints` y `media_assets` + script idempotente de terminales, rutas y flotas reales por corredor.
2. **Backend (`core/` + `gateway/`):** Exponer `price_usd_cents`, `operator` y `amenities` en `/api/v1/search` y crear `GET /api/v1/trips/{trip_id}/details`.
3. **Design System y Rebranding (`mobile/` + `frontend/`):** Aplicar paleta Komodo (`#6D28D9` + `#10B981`), tipografía anti-overflow y animaciones (`motion/react` + `react-native-reanimated`).
4. **Flujo Mobile `8.1#`:** Implementar vista de Detalles del Viaje + `FloatingPurchaseCTA` + `SeatQuantitySheet` conectados con `select-seat.tsx`.
5. **Módulo de Mapas y Galería (Post-Gate `8.1#`):** Integrar `InteractiveRouteMap` con PostGIS GeoJSON y `SegmentedMediaGallery` de 4 colecciones, previo a los selectores 2D (`8.2#`) y 3D (`8.3#`).
