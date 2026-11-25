# ROL Y OBJETIVO
Actúa como Arquitecto de Software Principal (Principal Full-Stack & Distributed Systems Architect). Tu misión tiene **dos fases secuenciales** y culmina en la creación del documento técnico `docs/architecture/trip-selection-and-details-spec.md`.

**NO escribas código de implementación de features todavía.** Primero audita el repositorio actual con rigor y luego entrega la especificación arquitectónica exacta de implementación.

# CONTEXTO Y STACK CONFIRMADO DE KOMDO
- **Arquitectura base ya iniciada:** Sistema diseñado bajo principios de **idempotencia** y **offline-first**.
- **Servicios y puertos:**
  - `Go Gateway` (Puerto `8080`): Go 1.23 + Gin + `pgxpool` — Gateway de alto rendimiento, búsqueda cache-aside, bloqueos distribuidos de asientos.
  - `FastAPI Core` (Puerto `8000`): Python 3.12 + SQLAlchemy 2.0 — Lógica de negocio transaccional, compra ACID de boletos.
  - `PostgreSQL` (Puerto `5432`): PostGIS 16 (Alpine) — Geolocalización, persistencia relacional, durabilidad WAL.
  - `Redis` (Puerto `6379`): Redis 7 (Alpine) — Caché efímero de búsqueda, mutex locks para apartado de asientos.
  - `Mobile App` (Puerto `8081`): React Native (Expo SDK) — App de pasajeros (Android & iOS).
  - `Web Platform`: **DEBES inspeccionar el repositorio** para detectar el framework exacto, versión, gestores de estado y bundler actualmente instalados (no asumas el stack web sin leer `package.json`).

---

# FASE 1: AUDITORÍA EXHAUSTIVA DEL REPOSITORIO ACTUAL
Antes de diseñar nada nuevo, inspecciona todo el árbol de directorios y documenta en la primera sección de `docs/architecture/trip-selection-and-details-spec.md`:
1. **Inventario de módulos existentes:** Qué endpoints, modelos SQLAlchemy, migraciones Alembic/SQL, handlers en Go, claves Redis, pantallas Expo y vistas Web ya existen.
2. **Verificación de Idempotencia y Offline-First:** Cómo están implementados actualmente (cabeceras `Idempotency-Key`, tablas de idempotencia, almacenamiento local en mobile/web como SQLite/MMKV/AsyncStorage/IndexedDB, cola de sincronización) para garantizar que la nueva fase **no rompa ni degrade** estas garantías.
3. **Análisis de Brechas (Gap Analysis):** Tabla explícita con `Módulo / Requerimiento` | `Estado` (`Implementado` / `Parcial` / `Faltante` / `Requiere Corrección`) | `Archivo(s) afectados` | `Acción requerida`.

---

# FASE 2: ESPECIFICACIÓN ARQUITECTÓNICA DE LOS MÓDULOS DE VIAJE
En el mismo archivo `docs/architecture/trip-selection-and-details-spec.md`, define con precisión de ingeniería la arquitectura, el flujo de datos, los contratos API y las librerías exactas (por lenguaje y plataforma) para implementar los siguientes dos módulos:

## Módulo A: Selección de Viaje (Listado de Líneas/Empresas por Ruta)
Al usuario seleccionar una ruta (origen, destino, fecha):
- Mostrar todas las **líneas/empresas de autobuses** disponibles que operan esa ruta.
- Mostrar en el mismo módulo/componente:
  - **Hora de salida** y **hora estimada de llegada (ETA)** del autobús.
  - **Precio del boleto/ticket por asiento en USD** (almacenado en centavos enteros `price_usd_cents` en backend para evitar errores de punto flotante).
  - Disponibilidad de asientos y resumen de amenities.
- **Requisitos técnicos a especificar:**
  - Flujo **Cache-Aside** en `Go Gateway` (8080) + `Redis 7` (6379) con TTL y estrategia de invalidación cuando cambie la disponibilidad.
  - Estrategia **Offline-First** en Mobile y Web (stale-while-revalidate, caché local de últimas búsquedas, indicador visual claro cuando el usuario consulta horarios cacheados sin conexión).

## Módulo B: Vista de Detalles del Viaje
Al seleccionar una opción del Módulo A, el usuario navega a la vista de detalles del viaje, que debe incluir:
1. **Información de la línea/empresa y del viaje:** Empresa, modelo de autobús asignado (vinculado al catálogo del parque automotor), horarios, terminal de salida/llegada, precio unitario USD.
2. **Mapa interactivo con ruta estimada punto a punto + Parada de descanso:**
   - Trazo de ruta estimada origen-destino usando geometrías **PostGIS 16** (`ST_AsGeoJSON` sobre `LINESTRING`) y marcador diferenciado para la **parada de descanso** (`POINT` con nombre, duración estimada y servicios).
   - Evaluar y seleccionar las mejores librerías de mapas compatibles con **Expo SDK** y la **plataforma Web detectada** (ej. MapLibre / `react-native-maps` / Leaflet) contemplando costos cero o bajos para MVP y fallback visual en modo offline (ej. snapshot/polyline cacheada).
3. **Galería multimedia segmentada (4 colecciones obligatorias):**
   - Imágenes del **terminal de pasajeros** donde aborda el autobús.
   - Imágenes del **autobús** donde viajará.
   - Imágenes del **paisaje / vistas durante el viaje**.
   - Imágenes de la **ciudad / pueblo / estado de destino**.
   - Definir estrategia de almacenamiento/entrega de medios (URLs CDN / object storage, thumbnails WebP/AVIF, caché en disco en Expo y caché HTTP/Service Worker en Web para no degradar offline-first).
4. **Indicadores minimalistas de servicios a bordo (Amenities):**
   - Iconografía minimalista con estado explícito (disponible / no disponible) para **Servicio WiFi** y **Aire Acondicionado** (con extensibilidad para futuros amenities sin cambiar el esquema).

# ENTREGABLE OBLIGATORIO DENTRO DEL MARKDOWN
El documento `docs/architecture/trip-selection-and-details-spec.md` debe contener:
1. Resultado de la **Auditoría y Gap Analysis** del repositorio actual.
2. **Matriz de Librerías y Versiones Recomendadas** por servicio (`Go Gateway`, `FastAPI Core`, `PostgreSQL/PostGIS`, `Redis`, `Expo Mobile`, `Web`), justificando cada elección y verificando compatibilidad con las versiones ya instaladas en el repo.
3. **Modelo de Datos / Migraciones propuestas** (tablas/columnas nuevas para `bus_operators`, `trip_schedules`, `route_waypoints` con `rest_stop`, `media_assets` tipados por categoría, `amenities` JSONB/flags).
4. **Contratos REST/JSON** exactos (request, response, códigos HTTP, claves de caché Redis, comportamiento offline).
5. **Arquitectura de Componentes UI** (jerarquía de componentes reutilizables en Mobile y Web) y **Plan de Implementación paso a paso** ordenado por dependencias.

# CRITERIOS DE ACEPTACIÓN
- Cada decisión técnica referencia archivos reales encontrados en el repositorio.
- Cero contradicciones con la arquitectura offline-first e idempotente existente.
- Todas las librerías propuestas son estables, compatibles con Expo SDK y Go 1.23 / Python 3.12, y justificadas para un MVP en producción.