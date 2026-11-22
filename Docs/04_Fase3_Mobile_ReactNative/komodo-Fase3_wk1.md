# Komodo Fase 3 — Walkthrough (MVP Móvil)

¡La Fase 3 ha sido implementada con éxito! He transformado las maquetas iniciales generadas por Stitch en una aplicación React Native (Expo) robusta, modular y completamente funcional con soporte **Offline-First**.

## Resumen de Cambios

### 1. Componentes Reutilizables Extraídos
Se ha limpiado el código monolítico de las pantallas extrayendo componentes aislados que respetan el diseño de `DESIGN.md`:

- **[NEW]** [SearchForm.tsx](file:///Users/ivan/Desktop/komodo/mobile/components/SearchForm.tsx): Formulario de búsqueda principal para la pantalla Home.
- **[NEW]** [TripCard.tsx](file:///Users/ivan/Desktop/komodo/mobile/components/TripCard.tsx): Tarjeta de resultados de viaje con precios, tiempos y asientos disponibles.
- **[NEW]** [SeatGrid.tsx](file:///Users/ivan/Desktop/komodo/mobile/components/SeatGrid.tsx): Grilla visual e interactiva para la selección de asientos en el autobús.
- **[NEW]** [QRTicket.tsx](file:///Users/ivan/Desktop/komodo/mobile/components/QRTicket.tsx): Componente para renderizar códigos QR del ticket comprado.
- **[NEW]** [SyncBadge.tsx](file:///Users/ivan/Desktop/komodo/mobile/components/SyncBadge.tsx): Etiqueta visual ("Pending Sync") para indicar cuando un boleto fue comprado sin conexión a internet.

### 2. Capa de Datos Offline-First (SQLite + NetInfo)
La arquitectura resiliente está en su lugar para soportar entornos inestables:

- **[SQLite]** [storage.ts](file:///Users/ivan/Desktop/komodo/mobile/lib/storage.ts): Ahora gestiona la tabla local `tickets`. Guarda los boletos confirmados y encola los boletos generados sin conexión (marcados como `PENDING`).
- **[API]** [api.ts](file:///Users/ivan/Desktop/komodo/mobile/lib/api.ts): Centraliza las llamadas al Gateway en Go y al Core en FastAPI.
- **[Sync]** [sync.ts](file:///Users/ivan/Desktop/komodo/mobile/lib/sync.ts): Lógica preparada para activarse cuando la red vuelve a estar disponible, reintentando de forma idempotente las compras pendientes.

> [!TIP]
> **Probando el modo Offline:** Para probar la resiliencia de la app, intenta completar el flujo de compra (hasta Checkout) e inhabilita tu red local o internet justo antes de darle "Confirm & Pay". Verás el aviso de "Offline Mode" y el ticket se guardará con la etiqueta "Pending Sync" en la pestaña *My Trips*.

### 3. Pantallas Refactorizadas
Todas las pantallas ahora consumen los nuevos componentes y se integran con la capa de datos:

- **Home**: Usa el `SearchForm` y navega limpiamente pasando parámetros al buscador.
- **Resultados**: Muestra los resultados mapeados a `TripCard`.
- **Selección de Asientos**: Consume `SeatGrid` y ejecuta la llamada de `hold-seat`. Incluye un fallback por si el servidor no está disponible para permitir seguir el flujo.
- **Checkout**: Implementa la lógica de compra, generando UUIDs (`idempotency_key`) para evitar dobles cobros y guardando los resultados localmente en SQLite.
- **Mis Viajes**: Usa `useFocusEffect` para recargar la base de datos de SQLite en tiempo real cada vez que abres la pestaña, mostrando de inmediato los tickets nuevos.
- **Detalle del Ticket**: Ahora usa el generador nativo `QRTicket` para renderizar el QR real almacenado.

## ¿Qué sigue?
Puedes lanzar el simulador de iOS o Android ejecutando:

```bash
cd mobile
npm run ios
# o
npm run android
```

> [!WARNING]
> Si pruebas la app en un dispositivo físico y tus backends (Gateway/Core) están corriendo en Docker local, recuerda actualizar la IP de tu computadora (ej: `192.168.1.100`) en `mobile/lib/api.ts` para que el celular pueda comunicarse con ellos.
