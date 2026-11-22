# Fase 2: Capa de Alto Rendimiento — Go + Redis Shield

Este documento detalla el plan técnico para construir el Gateway en Go, el cual actuará como escudo protector del Core en PostgreSQL, manejando la caché de búsquedas y los bloqueos distribuidos temporales.

## User Review Required

> [!IMPORTANT]
> Revisa y aprueba este plan para comenzar la construcción de la Fase 2.
> La principal decisión arquitectónica es **el comportamiento del "Bypass" si Redis se cae**: 
> Si Redis se cae, el endpoint de `hold-seat` devolverá un `200 OK` simulado (en lugar de bloquearse o dar error). Esto permite que la app móvil continúe al flujo de pago sin interrupciones. La transacción final seguirá estando protegida por el bloqueo fuerte (`FOR UPDATE`) en PostgreSQL. 

## Open Questions

> [!WARNING]
> No necesitas responder a esto ahora, pero tenlo en mente para la Fase 3:
> - ¿Cómo manejaremos la inyección de la URL de PostgreSQL en el entorno de Go a través de Docker? Asumiré la cadena de conexión estándar basada en el plan original (`postgres://busapp...`).

## Proposed Changes

---

### Dependencias y Configuración

Instalaremos el driver de alto rendimiento para PostgreSQL en Go y actualizaremos la configuración.

#### [MODIFY] [config.go](file:///Users/ivan/Desktop/komodo/gateway/config/config.go)
- Agregar la variable de entorno `DATABASE_URL` para conectarse a PostgreSQL.

#### [NEW] [database.go](file:///Users/ivan/Desktop/komodo/gateway/db/database.go)
- Crear gestor del pool de conexiones usando `jackc/pgx/v5/pgxpool`.

---

### Modelos de Datos (Go)

Estructuras optimizadas con `omitempty` para reducir el tamaño del payload.

#### [NEW] [search.go](file:///Users/ivan/Desktop/komodo/gateway/models/search.go)
- `SearchRequest`: Parámetros del querystring (origen, destino, fecha).
- `TripSearchResult`: Estructura anidada para devolver el viaje, ruta y terminales.

#### [NEW] [hold.go](file:///Users/ivan/Desktop/komodo/gateway/models/hold.go)
- `HoldSeatRequest`: Parámetros en JSON (`trip_id`, `seat_id`, `user_id`).

---

### Handlers y Lógica

La lógica crítica de alto rendimiento y concurrencia.

#### [MODIFY] [search.go](file:///Users/ivan/Desktop/komodo/gateway/handlers/search.go)
- Implementar patrón **Cache-Aside**.
- Generar llave: `search:{origin}:{dest}:{date}`.
- En Cache Miss: Ejecutar un `SELECT JOIN` en PostgreSQL, serializar, guardar en Redis con TTL de 120s y responder.

#### [MODIFY] [hold_seat.go](file:///Users/ivan/Desktop/komodo/gateway/handlers/hold_seat.go)
- Implementar bloqueo distribuido con Redis.
- Comando atómico: `SET NX EX 300` en la llave `hold:{trip_id}:seat:{seat_id}`.
- Manejo de tolerancia a fallos: Si Redis está caído, permitir el bypass silencioso.

#### [MODIFY] [main.go](file:///Users/ivan/Desktop/komodo/gateway/main.go)
- Inicializar `pgxpool`.
- Registrar las rutas en el router de Gin.
- Conectar el estado de PostgreSQL al endpoint `/health`.

## Verification Plan

### Automated Tests
- No aplican (se usarán pruebas de integración manuales al levantar los contenedores).

### Manual Verification
1. Ejecutar `go build` para asegurar que todo compila.
2. Levantar los contenedores de DB y Redis si es posible.
3. Llamar a `GET /api/v1/search` y verificar el tiempo de respuesta en Cache Miss vs Cache Hit.
4. Llamar a `POST /api/v1/hold-seat` repetidamente con el mismo asiento para comprobar que devuelve error `409 Conflict`.
