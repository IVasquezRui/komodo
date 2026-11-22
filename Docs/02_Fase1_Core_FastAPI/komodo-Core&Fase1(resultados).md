# Fase 1: Walkthrough — Núcleo Robusto (FastAPI + PostgreSQL)

## Resumen

Se ha completado la construcción de la Fase 1, estableciendo la lógica transaccional y los modelos de datos en FastAPI con SQLAlchemy y Pydantic v2. Esto conforma el "Core", responsable de la consistencia de datos de todo el sistema.

Además, **se refactorizó la configuración del Gateway en Go (Fase 0/2) para usar el framework Gin**, tal como fue acordado, dotándolo de capacidades avanzadas de enrutamiento y middleware con `gin.Recovery()` y `gin.Logger()`.

## Archivos Creados (Fase 1)

### Modelos de Datos (SQLAlchemy)

Los modelos mapean las tablas de PostgreSQL a objetos de Python, utilizando la sintaxis de tipos de SQLAlchemy 2.0 (`Mapped`):

*   [user.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/user.py): Usuarios del sistema.
*   [terminal.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/terminal.py): Terminales (origen/destino).
*   [route.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/route.py): Rutas entre terminales.
*   [trip.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/trip.py): Viajes programados.
*   [seat.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/seat.py): Asientos individuales.
*   [reservation.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/reservation.py): La tabla transaccional más crítica.
*   [__init__.py](file:///Users/ivan/Desktop/busbud-copia/core/app/models/__init__.py): Archivo de exportación de modelos.

### Esquemas de Validación (Pydantic v2)

Utilizados para la validación estricta de las peticiones (request) y el formateo de las respuestas (response):

*   [trip.py](file:///Users/ivan/Desktop/busbud-copia/core/app/schemas/trip.py): `TripResponse`, `SeatResponse` y `TripWithSeatsResponse`.
*   [reservation.py](file:///Users/ivan/Desktop/busbud-copia/core/app/schemas/reservation.py): `ReservationCreateRequest` (con `idempotency_key`) y `ReservationResponse`.

### Servicio y Lógica de Negocio

*   [reservation_service.py](file:///Users/ivan/Desktop/busbud-copia/core/app/services/reservation_service.py): Contiene la lógica del negocio para efectuar una reserva con garantías ACID. 

### Endpoints (FastAPI Routers)

*   [reservations.py](file:///Users/ivan/Desktop/busbud-copia/core/app/routers/reservations.py): Endpoint `POST /api/v1/reservations/` para la compra.
*   [trips.py](file:///Users/ivan/Desktop/busbud-copia/core/app/routers/trips.py): Endpoint `GET /api/v1/trips/{trip_id}` para obtener el mapa de asientos.
*   [main.py (Actualizado)](file:///Users/ivan/Desktop/busbud-copia/core/app/main.py): Inclusión de los nuevos routers.

---

## Decisiones de Diseño Clave (Fase 1)

### 1. Garantía ACID con `FOR UPDATE NOWAIT`
En `ReservationService`, cuando un usuario intenta reservar un asiento, la base de datos bloquea **exclusivamente esa fila de asiento** mediante `FOR UPDATE NOWAIT`. 
*   **¿Qué significa esto?** Si otro usuario intenta comprar el mismo asiento en el mismo milisegundo, la base de datos no lo pondrá en una cola de espera (deadlock), sino que lanzará un error inmediato (`OperationalError`), que nuestro sistema captura y transforma en un limpio "Asiento no disponible" (`SeatNotAvailableError`).

### 2. Idempotencia y Resiliencia de Red
Si la aplicación móvil envía una solicitud de compra, la base de datos la procesa, pero la red 3G del usuario se cae antes de recibir la respuesta, el móvil reintentará la petición.
*   Al usar el mismo `idempotency_key` (UUID v4 generado en el frontend), el `ReservationService` detectará que la reserva ya existe en PostgreSQL y devolverá un `IdempotencyConflictError`, el cual será atrapado por el manejador global (`exceptions.py`) devolviendo la reserva confirmada con un status `200 OK`. ¡Cero doble cobros!

### 3. QR Offline-First en Backend
La data que necesita el código QR para validar el pasaje sin internet se genera directamente en el servidor y se envía como `qr_code_data`. La app móvil solo debe renderizar el string, ahorrando la lógica de generación compleja en el dispositivo de baja gama.

---

## Verificación
Todo el código Go ha sido migrado a Gin (`go mod tidy` resuelto) y todo el código Python compila de manera exitosa.

> [!WARNING]
> Intenté correr `docker compose up --build` para levantar y probar todos los servicios simultáneamente, pero **tu Docker Daemon parece estar apagado o no disponible en este momento.** 

### Próximo Paso: Fase 2
Una vez que inicies Docker, podremos verificar los servicios y proceder a construir los handlers en Go (Fase 2) que interactuarán con Redis para crear el escudo de caché.
