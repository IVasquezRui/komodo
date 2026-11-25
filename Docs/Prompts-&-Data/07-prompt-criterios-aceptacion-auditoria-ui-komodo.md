# ROL Y OBJETIVO
Actúa como Principal QA Automation Engineer & Full-Stack Tech Lead. Tu misión es ejecutar una **auditoría integral de Criterios de Aceptación (Verification Gate)** sobre todo el repositorio de **Komodo** (Web, Mobile Expo SDK `8081`, `Go Gateway 8080`, `FastAPI Core 8000`, `PostgreSQL/PostGIS 5432`, `Redis 6379` y Docker) antes de pasar a la fase de selección de asientos 2D/3D y pagos.

**Regla de ejecución:** Para cada criterio que resulte en `FAIL`, debes **corregir el problema directamente en el código**, volver a validar hasta obtener `PASS`, y documentar el resultado final en `docs/qa/acceptance-criteria-report.md`.

---

# MATRIZ OBLIGATORIA DE CRITERIOS DE ACEPTACIÓN

## 1. Compilación, Tipado Estricto e Hidratación
- **Web:** `typecheck` (`tsc --noEmit`), linter y build de producción finalizan con **0 errores**.
- **Hidratación React/Next.js:** Verificar ausencia total de warnings de hidratación en `KomodoSidebar`, `KomodoSignupForm` y vistas animadas (`"use client"` correctamente ubicado, sin valores no deterministas como `Math.random()` o `Date.now()` en render inicial).
- **Mobile (`Expo SDK`, puerto `8081`):** `tsc --noEmit` y resolución de bundle Metro sin errores ni dependencias incompatibles con la versión actual del SDK.
- **Backend:** Compilación limpia de `Go Gateway` (`go build ./...`, `go vet ./...`) y verificación de imports/modelos en `FastAPI Core`.

## 2. Auditoría Cero Residuos (Rebrand Komodo + Limpieza Aceternity)
Ejecuta una búsqueda global case-insensitive en todo el repositorio (incluyendo `docker-compose*`, `Dockerfile*`, `.env*`, Web, Mobile y `docs/`) y confirma **0 ocurrencias** de:
- Branding antiguo / typos: `busbud`, `bus platform`, `bus-platform`, `bus_platform`, `komdo`.
- Residuos de demos Aceternity: `Acet Labs`, `Manu Arora`, `Tyler Durden`, `Fight Club`, `projectmayhem`, `OnlyFans`, `twitterpassword`, `Welcome to Aceternity`.
- Enlaces rotos o placeholders de navegación: `href="#"` dentro de `KomodoSidebar`.

## 3. Calidad Visual, Paleta de Marca y Regla Anti-Overflow en Botones
- **Cero desbordamiento de texto:** Audita todos los botones, badges y chips en Web (`360px`, `390px`, `768px`, `1440px`) y en Mobile (Android/iOS). Ninguna etiqueta debe salirse del contenedor, montarse sobre íconos ni cortarse de forma ilegible.
- **Paleta Komodo aplicada y consistente:** Verificar uso centralizado de tokens (morado/índigo primario, verde esmeralda en CTAs de conversión, superficies tintadas con jerarquía visual en lugar de blanco plano), manteniendo contraste mínimo **WCAG AA**.
- **Dinamismo y Accesibilidad:** Confirmar transiciones fluidas con `motion/react` (Web) y `react-native-reanimated` (Mobile), respetando `prefers-reduced-motion` y `AccessibilityInfo.isReduceMotionEnabled`.

## 4. Verificación Funcional de `KomodoSidebar` y `KomodoSignupForm`
- **Sidebar:** Expande y colapsa suavemente, resalta el ítem activo, navega correctamente a rutas existentes y refleja el estado real de usuario (autenticado vs invitado).
- **Signup Form:**
  - Valida correctamente cédula venezolana (`V-`, `E-`, `P-`), teléfono `+58`, email y confirmación de contraseña.
  - Muestra mensajes de error claros en español y deshabilita el botón durante el envío para evitar duplicidad.
  - Preserva los datos escritos y muestra aviso claro si no hay conectividad (offline-first).

## 5. Verificación de Integridad de Datos Seed, Flota e Idempotencia
- **Idempotencia del seed:** Ejecutar el script de seeding **dos veces consecutivas** y confirmar que el conteo total de terminales, empresas, rutas y viajes permanece exactamente idéntico (sin duplicados ni errores de llave única).
- **Invariante de cobertura interestatal:** Consultar PostgreSQL y validar que **el 100% de las rutas estado a estado** cuentan con **al menos 8 autobuses/salidas disponibles**, asignados a empresas vinculadas al terminal de origen y respetando las categorías de distancia (`30–120 km`, `120–300 km`, `300–800 km` e `Internacionales con transbordo fronterizo`) con presencia verificada de modelos **ENCAVA** y el resto del parque documentado.
- **Caché e Infraestructura:** Verificar que `Go Gateway` (8080) responde con datos frescos tras invalidar/calentar `Redis 7` (6379) y que todos los servicios Docker levantan saludables en sus puertos asignados (`8080`, `8000`, `5432`, `6379`, `8081`).

---

# ENTREGABLE FINAL OBLIGATORIO
Genera el archivo `docs/qa/acceptance-criteria-report.md` con:
1. **Tabla de Verificación:** `ID` | `Criterio` | `Plataforma/Servicio` | `Resultado (PASS/FAIL)` | `Comando o Evidencia` | `Correcciones Aplicadas`.
2. **Resumen de métricas reales** obtenidas en BD (total terminales, rutas por categoría, mínimo de autobuses por ruta interestatal, total modelos de flota).
3. **Veredicto de Release Gate:** Confirmación explícita de si el repositorio está listo para iniciar la fase `8.2#` (Mapa 2D de asientos Mobile) y `8.3#` (Mapa 3D Web).