# ROL Y OBJETIVO
Actúa como Arquitecto de Datos y Especialista en Transporte Terrestre en Latinoamérica. Tu tarea es crear el archivo `docs/data/venezuela-parque-automotor-autobuses.md` con el catálogo preciso, realista y técnicamente estructurado de las marcas, modelos y configuraciones de autobuses que operan en Venezuela, segmentado por tipo de ruta.

Este catálogo servirá de base en **Komdo** para:
- Modelar las entidades de flota en **PostgreSQL (SQLAlchemy 2.0 / FastAPI Core)**.
- Definir la geometría base de los mapas de asientos **2D (Mobile - Expo)** y **3D (Web)** que se implementarán en fases posteriores.

# REGLAS ESTRICTAS DE PRECISIÓN
1. **Apego a la realidad del parque automotor venezolano:** Documenta únicamente marcas y modelos con presencia real comprobada en el transporte venezolano (ej. Encava, Yutong, Marcopolo, Busscar, Mercedes-Benz, Volvo, Irizar, Blue Bird / ensamblajes locales cuando aplique). No incluyas flotas europeas o estadounidenses inexistentes en rutas venezolanas.
2. **Sin especificaciones inventadas:** Cuando un modelo admita múltiples configuraciones de carrocería/chasis (muy común en Venezuela por remodelaciones de asientos), expresa los rangos reales de capacidad y marca las variantes como `Estándar de fábrica` vs `Configuración frecuente en Venezuela`.
3. **Coherencia con renderizado de asientos:** Cada modelo debe incluir metadatos estructurales de cabina necesarios para construir matrices de asientos (distribución por fila, número de pisos, ubicación de puerta(s), pasillo y baño si aplica).

# CATEGORÍAS OBLIGATORIAS A DOCUMENTAR
Organiza el documento en las siguientes 4 secciones operativas:
1. **Viajes Cortos (Urbanos / Suburbanos / Intermunicipales cortos, menor a 80 km)**
2. **Viajes Regionales (Conexiones entre ciudades cercanas o estados vecinos, 80 km a 250 km)**
3. **Viajes Estatales / Larga Distancia (Rutas troncales nacionales, mayor a 250 km)**
4. **Viajes Internacionales (Rutas transfronterizas desde Venezuela hacia Colombia, Brasil, Perú, Ecuador, etc.)**

# FICHA TÉCNICA POR CADA MODELO DE AUTOBÚS
Para cada modelo dentro de cada categoría, documenta en formato estructurado (tablas + bloques uniformes):
- `model_code` (slug único, ej. `encava_ent_610`, `yutong_zk6122h9`, `marcopolo_paradiso_g7_1800dd`).
- **Marca / Carrocera y Chasis habitual** (ej. Marcopolo sobre Mercedes-Benz O-500RSD o Volvo).
- **Categoría(s) de ruta donde opera.**
- **Capacidad de pasajeros:** Rango real de asientos (ej. `32`, `45-49`, `54-60` en doble piso).
- **Disposición de cabina (Layout de asientos):**
  - Tipo de matriz: `2+2` (Ejecutivo/Estándar), `2+1` (Bus-Cama / VIP), o mixta en doble piso (`Piso 1: 2+1`, `Piso 2: 2+2`).
  - Número de pisos (`1` o `2`).
  - Cantidad estimada de filas y notas de excepciones (asiento del copiloto, última fila corrida de 5 puestos, escalera en doble piso, ubicación del baño trasero o central).
- **Equipamiento típico en Venezuela (Amenities):**
  - Aire Acondicionado (`Frecuente` / `Opcional según línea` / `Poco común`).
  - WiFi a bordo (`Raro - solo líneas ejecutivas/específicas` / `Opcional` / `No estándar`).
  - Baño a bordo, maletero inferior (bodega), puertos USB/tomas.
- **Notas operativas reales:** Uso típico en líneas venezolanas (sin inventar contratos comerciales falsos), estado habitual del parque (unidades nuevas vs. flota renovada de los 90s/2000s).

# ANEXO TÉCNICO REQUERIDO AL FINAL DEL DOCUMENTO
Incluye una propuesta de **esquema JSON canónico (`seat_layout_schema`)** que describa cómo representar cualquier autobús de este catálogo en una columna `JSONB` de PostgreSQL, de modo que tanto el mapa **2D en React Native** como el **3D en Web** puedan consumir la misma definición sin duplicar lógica.

# CRITERIOS DE ACEPTACIÓN
- Las 4 categorías de viaje están completas y claramente diferenciadas.
- Cada modelo contiene metadatos suficientes para generar layouts de asientos reales.
- Ninguna especificación contradictoria ni marcas ajenas a la operación en Venezuela.