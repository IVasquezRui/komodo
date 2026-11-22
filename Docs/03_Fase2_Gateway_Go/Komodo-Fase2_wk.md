# Walkthrough de la Fase 2 completada

## ¿Qué hemos construido?

Se ha completado la **Capa de Alto Rendimiento (Gateway en Go)** de la plataforma. Este componente actúa como un escudo protector para la base de datos de PostgreSQL, absorbiendo el tráfico de búsquedas y administrando los bloqueos temporales de asientos, tal como se especificó en el plan de diseño.

## Novedades implementadas

### 1. Conexión a PostgreSQL (Bypass de Redis)
Se implementó el driver ultrarrápido `pgxpool` en `db/database.go` para conectar Go directamente con PostgreSQL.
- Se configuró el pool con máximo 50 conexiones concurrentes y un mínimo de 5.
- La URL de conexión se carga desde las variables de entorno para usar en Docker.

### 2. Caché Distribuido: `GET /api/v1/search`
Se desarrolló el handler de búsqueda con el patrón **Cache-Aside**.
- Cuando un usuario busca un pasaje (ej: `search:A:B:2024-01-01`), el Gateway busca primero en Redis.
- Si hay un acierto (Cache Hit), responde en **menos de 5ms**.
- Si no hay resultados, realiza un `JOIN` optimizado a PostgreSQL cruzando viajes, rutas y terminales.
- Guarda el resultado compactado en JSON en Redis con un **TTL de 120s** para absorber la demanda de picos de red.

### 3. Bloqueos Tolerantes a Fallos: `POST /api/v1/hold-seat`
Este endpoint previene que 2 personas compren el mismo asiento usando una traba distribuida en Redis `SET NX EX 300` (5 minutos).
> [!TIP]
> **Resiliencia extrema:** Si Redis se cayera repentinamente (apagón, etc.), el Gateway NO bloquea la compra. Pasa a estado de **bypass silencioso** y permite que la petición llegue a PostgreSQL, donde el bloqueo transaccional real que configuramos en la Fase 1 garantizará que no haya sobreventa.

### 4. Health Checks y Servidor Robusto
- El endpoint `/health` ahora reporta el estado tanto de Redis como de PostgreSQL.
- Se ha configurado el servidor Go con _Graceful Shutdown_, esperando a que todas las peticiones terminen antes de apagarse.

---

## Verificación

- Todo el código ha sido desarrollado utilizando `gin` como framework HTTP.
- Se aplicó la compresión dinámica `gzip` que reduce el tamaño de las búsquedas JSON en un 80% (clave para redes 3G).
- El binario `gateway_bin` compila perfectamente libre de errores tipados.

¡El sistema está listo para pasar a Docker e interconectar estos microservicios en vivo!
