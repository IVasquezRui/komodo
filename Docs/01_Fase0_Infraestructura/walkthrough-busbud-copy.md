# Fase 0: Walkthrough — Configuración Multi-Capa Completada

## Resumen

Se creó la base completa de infraestructura para la plataforma de reservas de autobús ultra-resiliente. **32 archivos** generados, **~1,576 líneas de código** verificadas.

## Archivos Creados

### Infraestructura Docker

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| [docker-compose.yml](file:///Users/ivan/Desktop/busbud-copia/docker-compose.yml) | 167 | Orquestación de 4 servicios con healthchecks |
| [.env.example](file:///Users/ivan/Desktop/busbud-copia/.env.example) | 34 | Template de variables de entorno |
| [gateway/Dockerfile](file:///Users/ivan/Desktop/busbud-copia/gateway/Dockerfile) | 26 | Go multi-stage build (~15MB imagen final) |
| [core/Dockerfile](file:///Users/ivan/Desktop/busbud-copia/core/Dockerfile) | 24 | Python 3.12-slim con uvicorn 2 workers |

### PostgreSQL (Fuente de Verdad)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| [00_extensions.sql](file:///Users/ivan/Desktop/busbud-copia/db/00_extensions.sql) | 14 | uuid-ossp, PostGIS, pg_trgm |
| [01_schema.sql](file:///Users/ivan/Desktop/busbud-copia/db/01_schema.sql) | 246 | 6 tablas, 20+ índices, triggers, CHECK constraints |
| [02_seed.sql](file:///Users/ivan/Desktop/busbud-copia/db/02_seed.sql) | 131 | 4 terminales Venezuela, 3 rutas, 2 viajes, 72 asientos |

### Redis (Escudo Efímero)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| [redis.conf](file:///Users/ivan/Desktop/busbud-copia/redis/redis.conf) | 64 | Sin persistencia, LRU, 256MB, lazy freeing |

### Go Gateway

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| [main.go](file:///Users/ivan/Desktop/busbud-copia/gateway/main.go) | 134 | Chi router, gzip L6, graceful shutdown, degraded mode |
| [config.go](file:///Users/ivan/Desktop/busbud-copia/gateway/config/config.go) | 62 | Env vars con defaults |
| [client.go](file:///Users/ivan/Desktop/busbud-copia/gateway/redis/client.go) | 86 | Redis client con 5 reintentos + backoff |
| [responses.go](file:///Users/ivan/Desktop/busbud-copia/gateway/models/responses.go) | 57 | JSON keys cortos (`tid`, `rc`, `prc`) para ahorro de datos |

### FastAPI Core

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| [main.py](file:///Users/ivan/Desktop/busbud-copia/core/app/main.py) | 110 | Lifespan, CORS, health, docs toggle |
| [config.py](file:///Users/ivan/Desktop/busbud-copia/core/app/config.py) | 68 | Pydantic Settings con pool tuning |
| [database.py](file:///Users/ivan/Desktop/busbud-copia/core/app/database.py) | 65 | AsyncSession, pool_pre_ping, auto-rollback |
| [exceptions.py](file:///Users/ivan/Desktop/busbud-copia/core/app/exceptions.py) | 220 | 9 exception handlers, jamás devuelve 500 crudo |

---

## Decisiones de Diseño Clave

### 1. Redis sin persistencia (intencional)
Redis está configurado con `save ""` y `appendonly no`. Si Redis muere, arranca vacío. El patrón cache-aside en Go repuebla las keys bajo demanda desde PostgreSQL. Esto evita corrupción de datos en discos baratos ante cortes de luz.

### 2. PostgreSQL con durabilidad máxima
`fsync=on` + `synchronous_commit=on` + `wal_level=replica`. Cada transacción confirmada sobrevive un corte de energía abrupto. Trade-off: escrituras ~20% más lentas, pero jamás se pierde una venta.

### 3. JSON keys cortos en la API
Las respuestas usan `tid` en vez de `trip_id`, `prc` en vez de `price`. Esto reduce el tamaño de payload ~20%, que multiplicado por miles de requests desde celulares con plan de datos limitado, ahorra dinero real al usuario.

### 4. Gateway en modo degradado
Si Redis no está disponible, el Go gateway sigue funcionando — simplemente bypasea el caché y va directo a PostgreSQL. Más lento, pero nunca caído.

### 5. Idempotency key como campo UNIQUE
La tabla `reservations` tiene `idempotency_key UUID NOT NULL UNIQUE` con un índice parcial adicional `idx_reservations_seat_confirmed` que previene la doble venta de un asiento a nivel de base de datos (belt AND suspenders).

---

## Verificación Realizada

| Check | Resultado |
|-------|-----------|
| Go compila (`go build ./...`) | ✅ Sin errores |
| Python sintaxis (`py_compile`) | ✅ 5/5 archivos válidos |
| Docker Compose config | ✅ Configuración válida |
| Go dependencies (`go mod tidy`) | ✅ Resueltas y lockeadas |

## Para levantar el stack completo:

```bash
cd /Users/ivan/Desktop/busbud-copia
docker compose up --build
```

Luego verificar:
```bash
curl http://localhost:8080/health   # Gateway
curl http://localhost:8000/health   # Core
docker compose exec redis redis-cli -a redis_shield_2024 PING   # → PONG
docker compose exec postgres psql -U busapp -d busplatform -c '\dt'   # → 6 tablas
```

---

## Próximo Paso: Fase 1

Implementar el núcleo transaccional en FastAPI:
- Modelos SQLAlchemy ORM (mirroring del schema SQL)
- Schemas Pydantic v2 con validación estricta
- Servicio de reservas con `SELECT ... FOR UPDATE NOWAIT` + idempotencia
- Routers para `/api/v1/reservations` y `/api/v1/trips`
