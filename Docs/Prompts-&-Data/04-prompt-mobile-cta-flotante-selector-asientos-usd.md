# ROL Y OBJETIVO
Actúa como Senior React Native / Expo Engineer y Arquitecto Frontend Mobile. Tu tarea es diseñar e implementar el flujo de inicio de compra en la **Mobile App (`React Native + Expo SDK`, puerto `8081`)** correspondiente al **requerimiento 8.1#** de la vista de **Detalles del Viaje** en **Komdo**.

Antes de codificar, genera un breve plan técnico en `docs/mobile/8.1-seat-quantity-cta-spec.md` y luego implementa el módulo respetando estrictamente la arquitectura actual (idempotencia y offline-first).

# REQUERIMIENTO FUNCIONAL EXACTO (8.1#)
1. **Botón CTA flotante persistente:**
   - Al entrar en la vista de **Detalles de una Ruta / Viaje** en la app mobile, debe existir un **botón rectangular verde** siempre flotando (`sticky / fixed floating footer`) en la sección inferior de la pantalla, respetando las `SafeAreaInsets` (iOS y Android) y sin tapar el contenido desplazable del scroll (agregar `paddingBottom` adecuado al contenedor principal).
   - El botón debe mostrar un llamado a la acción claro (ej. `"Seleccionar asientos"` / `"Comprar pasajes"`) junto al precio base por asiento en **USD**.
2. **Selector interactivo de cantidad de asientos y cálculo dinámico en USD:**
   - Al hacer tap en el botón rectangular verde, se despliega un panel interactivo (Bottom Sheet o Modal nativo fluido) que pregunta al usuario **cuántos asientos desea comprar**.
   - Controles accesibles de incremento (`+`) y decremento (`-`) con límites estrictos:
     - Mínimo: `1` asiento.
     - Máximo: el menor entre el límite por compra configurado por negocio (ej. `6` o el definido en backend) y los **asientos realmente disponibles** del viaje seleccionado.
   - **Cálculo reactivo en tiempo real en USD:** A medida que el usuario sube o baja la cantidad de asientos, el componente muestra de forma inmediata el desglose:
     - `Precio unitario (USD) × Cantidad de asientos = Monto Total (USD)`.
     - **Regla financiera estricta:** Toda la aritmética se realiza en **centavos enteros (`integer cents`)** y se formatea únicamente en la capa de presentación (ej. `$25.00 USD`), prohibido operar precios directamente con `float` JS sin sanitización.
3. **Transición limpia a la siguiente fase (Selección 2D de asientos - 8.2#):**
   - Al confirmar la cantidad y presionar `"Continuar"` / `"Aceptar"`, el sistema:
     - Valida conectividad y frescura de disponibilidad contra `Go Gateway` (puerto `8080`) / caché local.
     - Si el usuario está **offline**, muestra un estado claro y no destructivo explicando que la reserva de asientos requiere conexión para garantizar el bloqueo distribuido en Redis, permitiendo reintentar sin perder la cantidad elegida.
     - Si la validación pasa, navega a la pantalla/módulo de **Selección de Asientos 2D** pasando el `trip_id`, `seat_quantity`, `unit_price_usd_cents`, `estimated_total_usd_cents` y preparando el `draft_booking_id` / `idempotency_key` para el flujo transaccional posterior.

# REGLAS DE INTEGRACIÓN CON EL REPOSITORIO EXISTENTE
1. **Inspección previa obligatoria:** Revisa la navegación actual (Expo Router o React Navigation), el sistema de diseño/tema (tokens de color, tipografía, espaciados), el gestor de estado y la capa offline-first ya presentes en el proyecto Mobile. Reutiliza los patrones existentes en lugar de introducir librerías redundantes.
2. **UX y Accesibilidad:**
   - Feedback háptico sutil (`expo-haptics`, solo si ya está instalado o tras verificar compatibilidad con el SDK actual) al presionar `+`/`-` y confirmar.
   - Deshabilitar visualmente y funcionalmente el botón `-` en el mínimo y `+` en el máximo disponible, mostrando el motivo si alcanzó el tope de disponibilidad.
   - Soporte correcto para orientación vertical, distintos tamaños de pantalla Android/iOS y modo oscuro/claro según el tema actual de la app.

# ENTREGABLES Y PRUEBAS
1. Archivo `docs/mobile/8.1-seat-quantity-cta-spec.md` documentando componentes, props, contratos de navegación y manejo de estados offline/online.
2. Implementación modular y tipada en **TypeScript estricto** (sin `any`):
   - Componente `FloatingPurchaseCTA` (botón rectangular verde flotante).
   - Componente `SeatQuantitySheet` (selector de cantidad y calculadora en tiempo real en USD).
   - Utilidad pura `formatUsdFromCents` y `calculateTotalUsdCents`.
3. **Tests unitarios** cubriendo:
   - Cálculo exacto en centavos para 1..N asientos sin errores de punto flotante.
   - Respeto de límites mínimo (`1`) y máximo (disponibilidad del bus vs límite por transacción).
   - Comportamiento en estado offline y transición correcta de parámetros hacia la vista de selección de asientos.