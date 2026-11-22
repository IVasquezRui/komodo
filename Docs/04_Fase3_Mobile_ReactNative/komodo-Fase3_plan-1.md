# Komodo Fase 3 - Desarrollo de App Móvil (MVP)

A continuación te presento el plan técnico detallado para transformar las maquetas actuales (generadas en Stitch) en el MVP funcional definitivo descrito en `Komodo-Fase3_plan.md` y `DESIGN.md`.

## User Review Required
> [!IMPORTANT]
> **API Gateway & Core URLs:** Actualmente las URLs apuntan a `<gateway-ip>` y `<core-ip>` en `lib/api.ts`. Si vas a probar esto localmente en el simulador de iOS o en Android, necesitaremos definir variables de entorno (ej. usando la IP local de tu máquina `192.168.x.x` en vez de localhost para Android, o `localhost` para iOS).
>
> **Expo SQLite API:** La versión de Expo 50+ introdujo cambios en `expo-sqlite`. Usaré la API síncrona moderna (`openDatabaseSync`) que es más eficiente y estable.

## Proposed Changes

### Componentes Reutilizables
Actualmente las vistas tienen mucho código repetido en un solo archivo. Vamos a extraer los elementos clave para mantener el código limpio y apegado a `DESIGN.md`.

#### [NEW] `mobile/components/SearchForm.tsx`
- Extraer el formulario de búsqueda de `app/(tabs)/index.tsx`.

#### [NEW] `mobile/components/TripCard.tsx`
- Extraer la tarjeta de resultados de viaje de `app/search-results.tsx`.
- Usará los colores y radios definidos en `lib/theme.ts`.

#### [NEW] `mobile/components/SeatGrid.tsx`
- Extraer la grilla de selección de `app/select-seat.tsx`.
- Implementar lógica de estados visuales (Disponible, Seleccionado, Ocupado).

#### [NEW] `mobile/components/QRTicket.tsx`
- Componente para renderizar `react-native-qrcode-svg` a partir del payload almacenado.

#### [NEW] `mobile/components/SyncBadge.tsx`
- Indicador visual para boletos guardados offline con estado `PENDING_SYNC`.

---

### Capa de Datos (Offline-First)
Implementaremos la persistencia local de boletos usando SQLite.

#### [MODIFY] `mobile/lib/storage.ts`
- Implementar inicialización de la tabla `tickets` (`CREATE TABLE IF NOT EXISTS`).
- Funciones CRUD: `saveTicket`, `getTickets`, `updateSyncStatus`.

#### [MODIFY] `mobile/lib/api.ts`
- Conectar con los endpoints del Gateway (`/api/v1/search`, `/api/v1/hold-seat`) y del Core (`/api/v1/reservations/`).
- Usar `fetch` nativo como fue indicado.

#### [MODIFY] `mobile/lib/sync.ts`
- Configurar `@react-native-community/netinfo`.
- Crear el worker en background (simulado) para detectar conexión y hacer POST a `/api/v1/reservations/` para boletos encolados.

---

### Pantallas y Navegación
Conectaremos la lógica y los componentes extraídos a las pantallas principales.

#### [MODIFY] `mobile/app/(tabs)/index.tsx`
- Limpiar e importar `SearchForm`. Conectar estados de `origin` y `destination`.

#### [MODIFY] `mobile/app/search-results.tsx`
- Consumir `lib/api.ts` (`searchTrips`).
- Renderizar lista de `TripCard`.

#### [MODIFY] `mobile/app/select-seat.tsx`
- Consumir mapa de asientos (mockeado temporalmente si el Gateway no está arriba) y ejecutar `holdSeat`.

#### [MODIFY] `mobile/app/checkout.tsx`
- Ejecutar simulación de pago.
- Llamar a `saveTicket()` (Offline-first) y guardar en SQLite antes de hacer sync.

#### [MODIFY] `mobile/app/(tabs)/trips.tsx`
- Leer boletos directamente desde `lib/storage.ts` (SQLite) con un `useEffect` o `useFocusEffect`.
- Mostrar el `SyncBadge` si el ticket no ha sincronizado.

## Verification Plan

### Manual Verification
1. Compilar app con `npm run ios` o `npm run android`.
2. Completar flujo Home -> Buscar -> Resultados -> Selección de Asiento -> Checkout.
3. Verificar en la pestaña **My Trips** que el boleto recién comprado aparece.
4. Tocar el boleto y verificar que el QR se genera correctamente a pantalla completa en `ticket/[id].tsx`.
