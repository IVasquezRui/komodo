# Komodo — Plan de Desarrollo Frontend: UI Polish + Swift

## Contexto y Diagnóstico

Tras analizar las **10 pantallas** del proyecto (Login, Home, Resultados, Selección de Asiento, Checkout, My Trips, Ticket QR, Saved, Profile, Not Found) y los **5 componentes** (SearchForm, TripCard, SeatGrid, QRTicket, SyncBadge), el estado actual es funcional pero con grandes oportunidades de mejora estética y UX en todas las vistas.

---

## PARTE 1 — Datos de Prueba (Mock Data)

> [!IMPORTANT]
> Esta es la primera tarea. Sin datos de prueba consistentes y realistas, no podemos evaluar el diseño visual correctamente.

#### [NEW] `mobile/lib/mockData.ts`
Archivo centralizado con datos de prueba que simulan respuestas del backend:
- **Rutas y terminales:** Caracas, Maracaibo, Bogotá, Ciudad de México, Miami.
- **Viajes:** 5 viajes con distintos horarios, precios, operadoras y estados.
- **Asientos:** Grid de 40 asientos con mix de AVAILABLE / SOLD / HELD realista.
- **Boletos:** 3 tickets pre-guardados en SQLite (1 CONFIRMED+SYNCED, 1 CONFIRMED+PENDING, 1 pasado) para poblar "My Trips" desde el primer arranque.
- **Usuario:** `demo@komodo.com` / `demo1234` (hardcoded en el login mock).

---

## PARTE 2 — UI Polish React Native (Expo)

> [!CAUTION]
> El diseño actual es funcional pero crudo. Esta fase lo convierte en un producto que se pueda mostrar en una demo a inversores.

### 2.1 — Login Screen ❌ → Nivel 2026

**Problema actual:** Fondo blanco plano, inputs con borde gris, logo solo un ícono de bus. Parece una app de 2012.

**Rediseño propuesto:**
- Fondo con gradiente suave Indigo `#4F46E5` → `#3B21E5` en el 35% superior y blanco en el resto (efecto "card flotante").
- Logo Komodo con el ícono de bus en un círculo blanco con sombra suave.
- Inputs de 56px de alto con borde bottom-only (estilo Material Design 3 moderno) con transición a `Indigo` al hacer focus.
- Botón "Log In" en Teal `#0D9488` con sombra suave y animación de press (scale 0.98).
- Añadir texto "Or continue with" + botón Google (placerholder para el MVP) en estilo ghost.

**Archivos:**
#### [MODIFY] `mobile/app/login.tsx` — Rediseño visual completo

---

### 2.2 — Home Screen — Pulir detalles

**Problema actual:** El header no tiene saludo personalizado, el Komodo logo falta, el área de Recent Searches tiene solo 1 ítem hardcodeado y nunca cambia.

**Mejoras:**
- Header con "Good morning, Ivan 👋" + avatar con iniciales en círculo Indigo.
- Logo SVG/texto "Komodo" con ícono de autobús junto al saludo.
- Recent Searches dinámico (leído desde AsyncStorage), con botón "Clear" funcional.
- Los 2 campos FROM/TO abren un `BottomSheet` de selección de ciudad con chips de ciudades populares.

#### [MODIFY] `mobile/app/(tabs)/index.tsx`
#### [NEW] `mobile/components/CityPickerSheet.tsx`

---

### 2.3 — Search Results — Añadir Filtros y "Fast Selling" badge

**Problema actual:** Lista funciona, pero le faltan: el chip de filtros (Hora, Precio, Operador), el badge "Fast Selling" en rutas con pocos asientos, y la animación de entrada de tarjetas.

**Mejoras:**
- Barra de filtros horizontal scrolleable con pills.
- Badge `Fast Selling` (rojo Amber) cuando `avl < 5`.
- Animación `FadeInDown` via `react-native-reanimated` en cada TripCard.
- Header con la ruta completa: "Caracas → Maracaibo · Oct 24 · 2 Passengers".

#### [MODIFY] `mobile/app/search-results.tsx`
#### [MODIFY] `mobile/components/TripCard.tsx` — añadir badge Fast Selling

---

### 2.4 — Select Seat — Hacer el autobús reconocible

**Problema actual:** El grid de asientos es funcional pero parece una tabla HTML genérica. No se parece visualmente a un autobús.

**Mejoras:**
- La tarjeta del autobús tendrá un "techo redondeado" en la parte superior (borderTopRadius grande) y el ícono de volante arriba del todo.
- Cada asiento será visualmente más grande (52×56px) con tipografía más clara.
- El pasillo central tendrá un indicador visual sutil.
- Footer sticky con animación slide-up cuando se selecciona un asiento.

#### [MODIFY] `mobile/components/SeatGrid.tsx`
#### [MODIFY] `mobile/app/select-seat.tsx`

---

### 2.5 — Checkout — El boleto "ticket rasgar"

**Problema actual:** El layout es muy básico. No tiene el resumen del viaje completo (solo muestra "Seat: X").

**Mejoras:**
- Diseño de tarjeta con estética de boleto físico: dashed divider visual, medio círculo cortado en los bordes de la tarjeta.
- Mostrar: Ruta, Terminal origen/destino, Fecha y Hora, Asiento, Operadora, Total.
- El botón de pago en Amber Gold con ícono de candado.
- Badge "Secure Payment" debajo del botón.

#### [MODIFY] `mobile/app/checkout.tsx`

---

### 2.6 — My Trips — Tabs Upcoming / Past

**Problema actual:** No hay pestañas Upcoming/Past. Todos los tickets aparecen en la misma lista sin distinción.

**Mejoras:**
- Implementar selector de tabs `Upcoming` / `Past` con borde inferior Indigo animado.
- Filtrar los boletos locales por fecha.
- Botón flotante `+ Book New Trip` en Amber Gold.
- Mostrar tarjetas en estilo "boarding pass" con micro-animaciones.

#### [MODIFY] `mobile/app/(tabs)/trips.tsx`

---

### 2.7 — Ticket Detail / QR — Pantalla Premium

**Problema actual:** El fondo Indigo es bueno, pero el QR en el ticket no tiene el contexto visual suficiente.

**Mejoras:**
- Añadir el nombre de la compañía/servicio en la parte superior del ticket.
- Número de boleto formateado (ej: `KMD-2026-00142`).
- Debajo del QR, botón "Share Ticket" (solo UI, sin funcionalidad en MVP).
- El ticket tendrá un efecto holográfico sutil vía gradiente diagonal.

#### [MODIFY] `mobile/app/ticket/[id].tsx`

---

### 2.8 — Profile Screen — No vacía

**Problema actual:** Solo muestra el nombre y un botón de Logout. Parece un placeholder.

**Mejoras:**
- Header con avatar grande + nombre + email de la sesión.
- Sección "My Stats": Trips taken, Km traveled, Countries visited.
- Lista de opciones: Notifications, Payment Methods, Help & Support, About.
- Version de la app al pie.

#### [MODIFY] `mobile/app/(tabs)/profile.tsx`

---

### 2.9 — Saved / Favoritos — No vacía

**Problema actual:** Solo texto estático "Your favorite trips will appear here."

**Mejoras:**
- Empty state con ilustración y call-to-action.
- 2 rutas pre-guardadas de mock data para que no luzca vacía.
- Chip de tipo de servicio (Express, Standard).

#### [MODIFY] `mobile/app/(tabs)/saved.tsx`

---

### 2.10 — Tab Bar & Layout global — Pulir navegación

**Mejoras:**
- Tab Bar con `height: 70` y `paddingBottom: 10` para mejor ergonomía.
- Usar íconos "filled" cuando están activos vs "outline" en inactivo.
- Añadir `HapticFeedback` en los tabs (solo nativo).
- Pantalla de Splash/Loading premium mientras se verifica la sesión.

#### [MODIFY] `mobile/app/(tabs)/_layout.tsx`
#### [MODIFY] `mobile/app/_layout.tsx` — Loading screen con logo Komodo

---

## PARTE 3 — Roadmap: App Nativa iOS en Swift

> [!NOTE]
> Esta sección define el plan estratégico completo para portar Komodo a una app nativa Swift/SwiftUI para iPhone/iPad. El backend (FastAPI + Go Gateway) ya es agnóstico al cliente, así que esta es una migración del cliente, no del backend.

### 3.1 — Stack Tecnológico Swift

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| UI | SwiftUI | Declarativo como React. Animaciones nativas premium. |
| Navegación | NavigationStack + TabView | Nativo iOS, soporta deep links. |
| Networking | `URLSession` + `async/await` | Cero dependencias externas. |
| Persistencia | SwiftData (iOS 17+) | Reemplaza SQLite. ORM nativo, mismo modelo de datos. |
| Estado Global | `@Observable` + `@AppStorage` | Reemplaza Zustand. |
| Offline Sync | `BackgroundTasks` framework | Reemplaza NetInfo + queue manual. |
| QR Code | `CoreImage.CIFilter.qrCodeGenerator` | Nativo, sin librerías externas. |

### 3.2 — Fases del Proyecto Swift

#### Fase A — Arquitectura base (2 semanas)
- Crear proyecto Xcode con SwiftUI + Swift Package Manager.
- Definir modelos de datos: `Trip`, `Ticket`, `Seat`, `Terminal`, `User`.
- Implementar `APIClient.swift` con `URLSession` apuntando al mismo Gateway.
- Implementar `TicketStore.swift` con SwiftData (equivalente a `storage.ts`).
- Crear `AuthManager.swift` con Keychain para guardar credenciales.

#### Fase B — Pantallas Core (3 semanas)
- `HomeView` con formulario de búsqueda.
- `SearchResultsView` con `LazyVStack` para performance.
- `SeatMapView` con `LazyVGrid` y gestos nativos.
- `CheckoutView` con confirmación.
- `TicketDetailView` con QR generado con CoreImage.

#### Fase C — Experiencia Premium iOS (2 semanas)
- Notificaciones locales para recordar el viaje (24h antes via `UserNotifications`).
- Widget de Pantalla de Inicio (WidgetKit) que muestra el próximo viaje.
- Integración con Wallet de Apple (Apple Wallet / Passbook) para el QR del boleto.
- Live Activity en la Dynamic Island para mostrar el estado del viaje en tiempo real.
- Siri Shortcut: "Oye Siri, buscar autobús a Maracaibo".

#### Fase D — Publicación App Store (1 semana)
- Preparar assets (iconos 1024×1024, screenshots en 6 tamaños de dispositivo).
- App Store Connect: categoría, descripción, keywords.
- Privacy Manifest (`PrivacyInfo.xcprivacy`) requerido por Apple desde 2024.
- Pruebas con TestFlight (beta pública).

### 3.3 — Equivalencias React Native → SwiftUI

| React Native | SwiftUI |
|-------------|---------|
| `StyleSheet.create` | `ViewModifier` custom |
| `FlatList` | `List` / `LazyVStack` |
| `useFocusEffect` | `.onAppear` |
| `expo-sqlite` | SwiftData |
| `AsyncStorage` | `@AppStorage` / Keychain |
| `react-native-qrcode-svg` | `CoreImage` |
| `NetInfo` | `NWPathMonitor` |
| `expo-router` | `NavigationStack` |

---

## Open Questions

> [!IMPORTANT]
> Antes de ejecutar, confirma:
> 1. ¿Empezamos el polish de React Native AHORA como primera prioridad, o primero quieres los mock data?
> 2. Para el roadmap Swift, ¿es un plan de referencia o vas a contratar a un desarrollador iOS para ejecutarlo? (Esto cambia el nivel de detalle que necesito añadir).
> 3. ¿Quieres integrar fuentes Inter de Google Fonts en la app nativa, o usamos SF Pro (la fuente nativa de Apple)?
