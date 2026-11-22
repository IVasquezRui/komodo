# Fase 2 (Reforma): Auditoría y Correcciones del Gateway Go

## 1. Detalles de Errores e Inconsistencias (Inspección)

Durante la inspección de seguridad y configuración del Gateway, se detectaron los siguientes problemas críticos que amenazaban la estabilidad del MVP:

### 1. Falsa Tolerancia a Fallos en Tiempo de Ejecución (Bypass Incompleto)
- **Dónde estaba el error:** En `gateway/handlers/hold_seat.go`.
- **Cuál era el problema:** La lógica incluía una condición para ignorar Redis y pasar directo a la base de datos si la conexión a Redis era nula *al arrancar el servidor*. Sin embargo, si Redis se caía de forma abrupta *después* de que el servidor ya estaba funcionando, el comando de escritura en caché arrojaba un error y el Gateway devolvía un **HTTP 500 (Internal Server Error)**.
- **Qué podía causar:** Caída total de ventas. Ante un reinicio temporal o saturación del contenedor de Redis, los clientes no hubieran podido comprar pasajes, violando directamente el principio de "Escudo Anti-Colapso" del sistema.

### 2. Bloqueo de Seguridad CORS Mal Configurado
- **Dónde estaba el error:** En `gateway/main.go` y la inyección de variables de entorno de `config.go`.
- **Cuál era el problema:** La variable `ALLOWED_ORIGINS` contiene múltiples URLs separadas por comas (`"http://localhost:3000,http://localhost:5173"`). El middleware de seguridad CORS estaba tomando el string completo y validándolo como si fuera un único dominio gigante.
- **Qué podía causar:** Incomunicación Frontend-Backend. Cuando el Panel de Administración o la Web intentaran consultar el Gateway, el navegador web habría bloqueado la respuesta debido a la estricta política CORS (Cross-Origin Resource Sharing).

---

## 2. CORREGIDO (Detalle de Soluciones)

Los errores anteriores fueron resueltos modificando el código fuente y recompilando el binario del Gateway:

### ✔️ 1. Bypass Definitivo y Silencioso
- **Cómo se solucionó:** En el archivo `hold_seat.go`, se capturó el error de red que devuelve el comando de Redis (`rdb.SetNX`) y se modificó la interrupción por una respuesta HTTP 200 OK con el estado `HELD_BYPASS`.
- **Resultado:** Si Redis sufre un fallo en pleno día de operaciones, el Gateway simula que el bloqueo fue exitoso y deja que la aplicación avance. Será el motor transaccional de PostgreSQL quien se encargue del bloqueo fuerte (`FOR UPDATE`) durante la compra final, manteniendo el sistema 100% operativo bajo contingencias.

### ✔️ 2. Validación CORS Dinámica
- **Cómo se solucionó:** Se importó el paquete estándar `"strings"` en `main.go`. En lugar de inyectar la URL cruda a la matriz mediante `[]string{cfg.AllowedOrigins}`, se aplicó la función `strings.Split(cfg.AllowedOrigins, ",")`.
- **Resultado:** El Gateway ahora extrae dinámicamente cada origen de la cadena, armando una lista válida de dominios permitidos para el framework Gin. Esto asegura una comunicación perfecta con cualquier cliente web o móvil.
