# ROL Y OBJETIVO
Actúa como Principal Full-Stack Engineer, DevOps Engineer y Design Systems Architect. Tu misión es ejecutar el **rebranding completo hacia "Komodo"** en toda la infraestructura y código fuente, y modernizar la experiencia visual (tipografía de botones, paleta de colores y sistema de animaciones) tanto en **Web** como en **Mobile (React Native / Expo SDK, puerto 8081)**, manteniendo intactas las garantías de **idempotencia** y **offline-first**.

# FASE 1: REBRANDING TOTAL (ELIMINACIÓN DE "BUSBUD" Y "BUS PLATFORM") — REQ 8#
Realiza una búsqueda global insensible a mayúsculas (`grep` / `ripgrep`) en **todo el repositorio** para localizar y sustituir cualquier ocurrencia de `"busbud"`, `"bus_bud"`, `"bus-platform"`, `"bus platform"`, `"bus_platform"` por **`Komodo`** / **`komodo`** (respetando la convención de casing de cada contexto: `Komodo`, `komodo`, `KOMODO`).

**Áreas obligatorias a auditar y actualizar sin romper el entorno:**
1. **Docker e Infraestructura:**
   - `docker-compose.yml` / `docker-compose.*.yml`: nombres de contenedores (`komodo-gateway`, `komodo-core`, `komodo-postgres`, `komodo-redis`, etc.), redes (`komodo-net`), volúmenes y etiquetas.
   - `Dockerfile`s, archivos `.env`, `.env.example`, scripts de inicio y `Makefile`.
   - Nombres de base de datos, usuarios de PostgreSQL y prefijos de claves Redis (ej. `komodo:search:*`, `komodo:lock:seat:*`), asegurando consistencia total entre `Go Gateway` (8080) y `FastAPI Core` (8000).
2. **Backend (`Go Gateway` y `FastAPI Core`):**
   - Nombres de módulos, headers HTTP (`X-Komodo-Idempotency-Key` si aplica, manteniendo compatibilidad si ya existe `Idempotency-Key`), títulos OpenAPI/Swagger, logs estructurados y mensajes de respuesta.
3. **Frontend Web y Mobile (Expo):**
   - `package.json`, `app.json` / `app.config.ts` (`name`, `slug`, `scheme: "komodo"`, `bundleIdentifier`, `package`), títulos `<title>`, metadatos SEO, textos visibles en UI y claves de almacenamiento local (SQLite/AsyncStorage/MMKV/IndexedDB).
4. **Verificación final de Fase 1:** Ejecuta una búsqueda residual confirmando `0` referencias activas a `"busbud"` o `"bus platform"` y verifica que `docker compose config` valide sin errores de sintaxis.

---

# FASE 2: CORRECCIÓN DE BOTONES, PALETA DE COLORES Y ANIMACIONES (WEB + MOBILE) — REQS 1#, 2# Y 3#

## 1. Corrección Estricta de Tipografía y Overflow en Botones (Req 1#)
Audita todos los componentes `Button`, chips, badges y tarjetas interactivas en **Web** y **Mobile**:
- **Problema a erradicar:** Textos que se desbordan, se cortan mal o se salen de los bordes de botones y contenedores en pantallas pequeñas (360px–390px) o con escalado de fuente del sistema.
- **Reglas obligatorias en Web (Tailwind/CSS):**
  - Nunca usar alturas fijas rígidas (`h-8`) combinadas con texto largo sin control; usar `min-h-10` / `min-h-11`, `px-4 py-2.5`, `inline-flex items-center justify-center gap-2`, `leading-tight`, `text-center`.
  - Controlar desbordes con `truncate` o `whitespace-normal break-words` según la jerarquía del botón, y asegurar `shrink-0` en íconos.
- **Reglas obligatorias en Mobile (React Native / Expo):**
  - Eliminar anchos/altos fijos que corten etiquetas; usar `minHeight: 44`, `paddingHorizontal: 16`, `paddingVertical: 10`, `flexShrink: 1` en `<Text>`.
  - Aplicar `numberOfLines={1}`, `ellipsizeMode="tail"` o `adjustsFontSizeToFit` + `minimumFontScale={0.85}` en botones de acción primaria/secundaria, y respetar `maxFontSizeMultiplier={1.25}` para accesibilidad sin deformar layouts.

## 2. Nuevo Sistema de Paleta de Colores "Komodo" (Req 3#)
Elimina la apariencia plana dominada por blanco puro (`#FFFFFF`) sin sacrificar legibilidad ni contraste WCAG AA:
- Define tokens semánticos centralizados en Web (`globals.css` / variables CSS Tailwind) y Mobile (`theme/tokens.ts`):
  - **Brand Primary (Púrpura Komodo — coherente con identidad y futuro banner del boleto):** `#6D28D9` (base), `#7C3AED` (hover/vibrante), `#4C1D95` (profundo), con gradientes sutiles `from-[#4C1D95] via-[#6D28D9] to-[#7C3AED]` para headers, hero banners y badges clave.
  - **Action / CTA Principal (Verde Komodo — coherente con el CTA flotante de compra):** `#10B981` (base) / `#059669` (active/hover) con texto de alto contraste.
  - **Accent Secundario (Ámbar/Cian de ruta y estados):** `#06B6D4` (información/WiFi/rutas) y `#F59E0B` (paradas de descanso/alertas).
  - **Superficies con profundidad (adiós al blanco aburrido):**
    - Modo claro con fondos tintados suaves (`#F5F3FF` lavanda ultra-suave y `#F8FAFC` slate frío) contrastando con tarjetas elevadas con bordes tintados (`#E2E8F0` / `#DDD6FE`) y sombras suaves de color.
    - Soporte consistente de superficies oscuras/tintadas en headers, cards destacadas y barras de navegación para dar jerarquía visual inmediata.

## 3. Sistema de Animaciones y Micro-interacciones (Req 2#)
Transforma las vistas estáticas en una interfaz fluida y moderna (60 FPS):
- **En Web:** Usa `motion/react` (Framer Motion) respetando `prefers-reduced-motion`:
  - Transiciones de entrada escalonadas (`staggerChildren`) en listados de viajes y terminales.
  - Botones animados con `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.97 }}`, brillo sutil en hover y estados de carga integrados.
  - Transiciones suaves entre vistas, modales y skeletons modernos con shimmer en lugar de bloques vacíos bruscos.
- **En Mobile (Expo):** Usa `react-native-reanimated` (verifica si ya está instalado; si no, instálalo con `npx expo install react-native-reanimated`):
  - Componente reutilizable `AnimatedButton` con animación spring en `onPressIn` / `onPressOut` (`scale: 0.96`) + feedback háptico opcional.
  - Animaciones `FadeInDown` / `Layout` en tarjetas de resultados de viajes y transiciones suaves de pantalla.

# CRITERIOS DE ACEPTACIÓN
- Ningún botón en Web ni Mobile desborda texto en viewports de 360px, 390px, 768px y 1440px.
- La identidad visual muestra jerarquía cromática clara de **Komodo** (púrpura + verde CTA + superficies con profundidad), eliminando pantallas predominantemente blancas y planas.
- Cero referencias remanentes a `busbud` o `bus platform` en Docker, backend, web o mobile.