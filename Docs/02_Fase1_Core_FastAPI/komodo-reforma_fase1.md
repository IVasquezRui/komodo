# Fase 1 (Reforma): Corrección de Errores Arquitectónicos

## 1. Detalles de Errores e Inconsistencias

A continuación se detalla la lista de problemas arquitectónicos y lógicos encontrados en la primera versión, junto con las consecuencias de no arreglarlos:

### 1. La Paradoja del Asiento "HELD" (Bloqueos Fantasma)
- **Dónde está el error:** En el esquema SQL de la tabla `seats` y en la validación del servicio `reservation_service.py`.
- **Cuál es el error:** Se incluyó el estado `HELD` en la base de datos de PostgreSQL. Sin embargo, el diseño dictamina que Redis es el único responsable de manejar los bloqueos temporales (con un TTL de 5 minutos) y que al expirar, el asiento se libera sin tocar PostgreSQL. 
- **Qué puede causar:** **Asientos Fantasma.** Si por alguna razón de contingencia el sistema llega a guardar un asiento como `HELD` en PostgreSQL, este se quedará bloqueado para siempre porque no existe ninguna columna `expires_at` ni proceso que lo libere en la base de datos. La empresa perdería la posibilidad de vender ese asiento.

### 2. Cuello de Botella de Concurrencia en `TRIPS` (Bloqueo Estricto)
- **Dónde está el error:** En `reservation_service.py` (Línea 77).
- **Cuál es el error:** Para decrementar el contador `available_seats` de un viaje, se utiliza `with_for_update(nowait=True)` sobre la tabla `trips`. Esto bloquea *toda la fila del viaje*. Si 2 usuarios intentan comprar **asientos distintos** del mismo autobús en el mismo milisegundo, el segundo usuario recibirá un error porque el viaje está bloqueado, a pesar de que no hay conflicto de asientos.
- **Qué puede causar:** **Fallas masivas de compra bajo tráfico alto.** En un pico de ventas, docenas de clientes fallarían al intentar comprar asientos distintos en el mismo viaje, degradando severamente la experiencia de usuario.

### 3. Redundancia Peligrosa de Llaves Foráneas en `RESERVATIONS`
- **Dónde está el error:** En el esquema SQL (`reservations`).
- **Cuál es el error:** La reserva apunta a `seat_id` y a `trip_id` de forma independiente. Un asiento ya pertenece a un viaje, por lo que guardar ambos abre la puerta a que no coincidan.
- **Qué puede causar:** **Anomalía de integridad de datos.** Podría insertarse un registro donde la reserva diga que es para el Asiento 14 del Viaje A, pero el campo `trip_id` de la reserva apunte al Viaje B. Esto corrompe reportes y estadísticas.

### 4. Ambigüedad de Estados de Sincronización
- **Dónde está el error:** En la tabla `reservations` (campos `status` y `sync_status`).
- **Cuál es el error:** Ambos campos comparten valores semánticamente idénticos (ej. `PENDING_SYNC`). Mezclan el estado de negocio del boleto (si es válido o no) con el estado de red de la aplicación móvil (si se ha subido al servidor o no).
- **Qué puede causar:** **Estados inconsistentes (Limbo).** Si se actualiza el estado a `CONFIRMED` pero el `sync_status` se queda trabado, el sistema entra en una contradicción imposible de resolver automáticamente, afectando la validación del QR del pasajero.

---

## 2. CORREGIDOS (Detalle de Soluciones)

Se han realizado las siguientes correcciones directamente en el código del proyecto:

### ✔️ 1. Eliminación del Estado HELD en PostgreSQL
- **SQL (`01_schema.sql`):** Se eliminó el estado `HELD` del `CHECK constraint` en la tabla `seats`. Ahora solo acepta `AVAILABLE` y `SOLD`.
- **FastAPI (`reservation_service.py`):** Se removió la tolerancia al estado `HELD` en la validación (`if seat.status != "AVAILABLE"`). Ahora PostgreSQL es estricto: o está disponible o está vendido. Redis se encargará de forma 100% independiente del bloqueo temporal.

### ✔️ 2. Resolución del Cuello de Botella de Concurrencia
- **FastAPI (`reservation_service.py`):** Se modificó la consulta del viaje. En lugar de usar `with_for_update(nowait=True)`, se utiliza `with_for_update()` a secas. 
- **Por qué funciona:** Esto hace que las compras simultáneas del *mismo viaje* (pero *distintos asientos*) se encolen y resuelvan en milisegundos en lugar de fallar y expulsar al usuario. El `nowait=True` se mantuvo exclusivamente para el asiento, lo cual es correcto (si dos quieren el *mismo asiento*, uno debe fallar inmediatamente).

### ✔️ 3. Restricción de Integridad Compuesta
- **SQL (`01_schema.sql`):** Se agregó un constraint `UNIQUE (id, trip_id)` a la tabla `seats`. Luego, en la tabla `reservations`, se reemplazaron las foráneas independientes por una **llave foránea compuesta**: `FOREIGN KEY (seat_id, trip_id) REFERENCES seats(id, trip_id)`.
- **FastAPI (`reservation.py`):** Se agregó `__table_args__ = (ForeignKeyConstraint(...),)` para que el ORM entienda la llave compuesta. 
- **Por qué funciona:** Ahora la base de datos garantiza a nivel de motor (imposible de evadir) que la reserva no puede pertenecer a un viaje distinto al del asiento asignado.

### ✔️ 4. Normalización de Estados
- **SQL (`01_schema.sql`):** Se limpiaron los `CHECK constraints`. `status` ahora es puramente de negocio (`PENDING`, `CONFIRMED`, `CANCELLED`, `REFUNDED`). `sync_status` es puramente de red (`PENDING`, `SYNCED`, `FAILED`).
- **FastAPI (`reservation.py` y `reservation_service.py`):** Se actualizaron los valores por defecto. Al crearse una reserva desde la API online, ahora nace como `status="CONFIRMED"` y `sync_status="SYNCED"`.
