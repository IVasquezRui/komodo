# ROL Y OBJETIVO
Actúa como Ingeniero de Datos Geoespaciales y Arquitecto de Software Senior. Tu tarea es investigar, estructurar y generar un archivo Markdown en `docs/data/venezuela-terminales-rutas.md` que documente los terminales de pasajeros terrestres por cada estado de Venezuela (los 23 estados más el Distrito Capital) y sus rutas interurbanas y extraurbanas reales.

Este documento será la fuente de verdad (Source of Truth) para diseñar posteriormente los scripts de seed en **PostgreSQL 16 + PostGIS** de la plataforma **Komdo** (MVP web y mobile de venta de pasajes de autobús en Venezuela).

# REGLAS ESTRICTAS ANTI-ALUCINACIÓN (OBLIGATORIO)
1. **Cero invención de datos:** Está estrictamente prohibido inventar nombres de terminales, cantidades totales exactas no verificadas, coordenadas falsas, rutas inexistentes o frecuencias ficticias.
2. **Inspección previa del repositorio:** Antes de generar contenido, revisa si ya existen archivos en `docs/`, `seeds/`, `migrations/` o `data/` del proyecto para evitar duplicidades o contradicciones.
3. **Protocolo de verificación y etiquetado:**
   - Si cuentas con herramientas de búsqueda o fuentes documentales verificables (INTT, alcaldías, registros oficiales de terminales municipales/privados), contrasta cada terminal antes de incluirlo.
   - Clasifica explícitamente cada registro con una etiqueta de estado:
     - `[VERIFICADO]`: Terminal o ruta confirmada de existencia operativa conocida y verificable.
     - `[REQUIERE_VALIDACION_CAMPO]`: Terminal menor, parada autorizada o ruta cuya operatividad actual o cantidad exacta en el estado no puede confirmarse al 100% sin auditoría en sitio.
   - Si no existe una cifra oficial consolidada y actualizada del total exacto de terminales en un estado específico, **NO inventes un número cerrado**. Indica: `Total documentado verificado: N (sujeto a censo municipal de terminales menores/privados)`.
4. **Coordenadas geográficas:** Incluye latitud y longitud compatibles con PostGIS (`SRID 4326`) únicamente si son verificables; de lo contrario, deja el valor como `TBD_GEOCODE` para un paso posterior de geocodificación controlada.

# ESTRUCTURA REQUERIDA DEL ARCHIVO (`docs/data/venezuela-terminales-rutas.md`)
1. **Resumen Ejecutivo y Metodología:** Explicación de fuentes, criterios de clasificación (Terminal Público Municipal, Terminal Privado/Expreso, Parada Intermodal) y política de validación.
2. **Tabla Resumen Nacional:**
   - Columnas: `Estado` | `Terminales Principales Verificados (N)` | `Terminales Secundarios/Privados Documentados` | `Estado de Cobertura` (`Completa` / `Parcial - Requiere Campo`).
3. **Desglose por Entidad Federal (23 Estados + Distrito Capital):**
   Para cada estado, incluir:
   - **Listado de Terminales** con:
     - `terminal_code` (slug estandarizado en snake_case, ej. `ccs_la_bandera`, `mir_terminal_oriente`).
     - Nombre oficial y tipo (`Público` / `Privado`).
     - Ciudad y Municipio.
     - Coordenadas (`lat, lon` o `TBD_GEOCODE`).
     - Etiqueta de verificación.
   - **Matriz de Rutas Exactas desde/hacia el Estado:**
     - `route_code` (ej. `CCS-VAL`, `CCS-MCY`, `CCS-MAR`).
     - Origen (terminal) y Destino (terminal/ciudad).
     - Categoría de viaje (`Corto`, `Regional`, `Estatal`, `Internacional`).
     - Paradas de descanso habituales / puntos intermedios conocidos (marcar `[REQUIERE_VALIDACION_CAMPO]` si no es verificable).
     - Distancia aproximada en km y duración estimada en rango (ej. `2h 30m - 3h 30m`) solo si es derivable de la distancia vial real.
4. **Anexo de Preparación para PostGIS:** Notas técnicas sobre cómo mapear estos campos a tablas `terminals` (`GEOGRAPHY(POINT, 4326)`) y `routes` (`GEOGRAPHY(LINESTRING, 4326)`) sin romper el esquema existente.

# CRITERIOS DE ACEPTACIÓN
- Se cubren las 24 entidades federales de Venezuela.
- Ningún dato dudoso se presenta como certeza absoluta.
- El archivo es limpio, parseable y listo para ser auditado por un equipo de operaciones en Venezuela antes de cargar datos en PostgreSQL.