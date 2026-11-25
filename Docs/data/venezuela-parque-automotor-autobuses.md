# Catálogo del Parque Automotor de Autobuses en Venezuela

> **Proyecto:** Komodo — Plataforma de Venta de Pasajes Interurbanos y Extraurbanos  
> **Fuente Base:** Investigación de mercado y parque automotor (`Docs/Prompts-&-Data/Flota de Autobuses en Venezuela.md`, datos Favenpa / MPPT / SITSSA / operadoras privadas 2023–2026).  
> **Propósito:** Servir como especificación canónica para modelar las entidades de flota en **PostgreSQL (SQLAlchemy 2.0 / FastAPI Core)**, asignar unidades realistas por ruta y renderizar los mapas de asientos **2D (Mobile Expo)** y **3D (Web)**.

---

## Principios de Precisión Histórica y Operativa

1. **Realidad del parque automotor venezolano:** El parque nacional promedia **22 años de antigüedad** según cifras de Favenpa. Las importaciones de autocares brasileños/europeos se concentraron entre 1995 y 2010 (con cese de adiciones nuevas tras 2017), mientras que la planta estatal **Yutong Venezuela** (San Felipe, Yaracuy) surtió flotas gubernamentales sin acceso regular para el transportista privado, quien mantiene activa su flota mediante reconstrucción continua y catálogo nacional **Encava**.
2. **Desmentido técnico obligatorio (cero modelos ficticios):** No existe evidencia comercial verificada de autobuses **Encava** de doble piso ni **Yutong** de doble piso operando en rutas reales en Venezuela. Denominaciones virales como *Encava E-NT7300DD MegaPullman*, *Encava E-NT6300 AutoPullman* o *Yutong ZK6146HSQ9 Doble Piso* corresponden a diseños conceptuales ficticios y **quedan excluidos** de este catálogo.
3. **Variantes de asientos:** En Venezuela es frecuente la remodelación de asientos entre `Estándar de fábrica` y `Configuración frecuente en Venezuela` (ej. reducción de puestos para ganar espacio en líneas ejecutivas o adición de filas en cooperativas). Ambas configuraciones se documentan explícitamente.

---

## 1. Viajes Cortos (Urbanos / Suburbanos / Intermunicipales < 80–120 km)

Corredores típicos: `Los Teques–Maracay (72,5 km)`, `Caracas–Los Teques`, `Caracas–La Guaira`, `Valencia–Maracay (52 km)`, `Maracaibo–Ciudad Ojeda (68 km)`.

### Resumen Comparativo

| `model_code` | Marca / Carrocera y Chasis | Capacidad | Layout | Pisos | A/A | WiFi | Operadores Típicos |
|---|---|---:|:---:|:---:|---|---|---|
| `encava_ent_610` | Encava / Chasis Encava + Isuzu 6HH1-S / 6BD1 | 32 (fábrica) / 28–32 (Venezuela) | `2+2` | 1 | Poco común (raro operativo en pública) | No estándar | Cooperativas municipales, rutas suburbanas y cortas |
| `encava_ent_900` | Encava / Isuzu 4HE1-TC | 27 | `2+2` | 1 | Poco común | No estándar | Rutas secundarias y topografías empinadas |
| `encava_e_3100` | Encava / Chasis clásico 90s | 28–32 | `2+2` | 1 | Poco común | No estándar | Líneas tradicionales suburbanas |
| `encava_e_van_toano` | Encava / Tren motriz Foton Toano | 15–18 | `2+1` | 1 | Frecuente | Opcional | Transporte corporativo privado y turismo |
| `iveco_daily_70c16` | Iveco Daily 70c16 (*Borota* / *Darlin*) | 24–28 | `2+2` | 1 | Opcional según línea | No estándar | Rutas suburbanas e interurbanas de baja capacidad |
| `yutong_zk6896hga` | Yutong (8 metros) | 25–30 | `2+2` | 1 | Frecuente (en unidades activas) | No estándar | Operadoras estatales (SITSSA / TransMiranda / BusTrujillo) |

### Fichas Técnicas Detalladas

#### `encava_ent_610`
- **Marca / Carrocera y Chasis:** Encava (ensamblaje Valencia) con motor diésel Isuzu 6HH1-S 6.0L o 6BD1, chasis de ballestas para trabajo pesado.
- **Categorías:** Viajes Cortos (principal) y Regionales económicos.
- **Capacidad de pasajeros:** `32 puestos` (Estándar de fábrica) / `28-32 puestos` (Configuración frecuente en Venezuela).
- **Disposición de cabina:**
  - Matriz: `2+2` con pasillo central estrecho.
  - Pisos: `1`.
  - Filas y excepciones: ~7 filas de 4 puestos (`2+2`) + última fila trasera corrida de `4` o `5` puestos según presencia de puerta trasera de emergencia; asiento de copiloto/colector al frente junto a la puerta delantera. Sin baño.
- **Equipamiento típico:** Aire acondicionado `Poco común` en servicio público regular (pese a catálogo `ENT-610-32 AR`, suele operar con claraboyas/ventilación pasiva por costos de gasoil y compresor); WiFi `No estándar`; sin baño ni bodega inferior (solo maletero trasero reducido o parrilla).
- **Notas operativas:** Vehículo arquetípico del transporte corto venezolano. Alta rotación cada 15–30 min en terminales municipales.

#### `encava_ent_900`
- **Marca / Carrocera y Chasis:** Encava / motor Isuzu 4HE1-TC.
- **Categorías:** Viajes Cortos (tramos montañosos o secundarios).
- **Capacidad:** `27 puestos` (Estándar de fábrica).
- **Disposición de cabina:** Matriz `2+2`, `1` piso, 6 filas dobles + fila final de 3 a 5 puestos. Sin baño.
- **Equipamiento típico:** A/A `Poco común` (variante `AR` escasa en líneas públicas); WiFi `No estándar`; sin baño.
- **Notas operativas:** Preferida en tramos con pendientes pronunciadas como Los Teques o rutas andinas cortas.

#### `iveco_daily_70c16`
- **Marca / Carrocera y Chasis:** Iveco Daily 70c16 carrozado nacionalmente (*Borota* / *Darlin*); acompañan segmento minibuses `Chevrolet NPR` y `International` de 24 puestos.
- **Categorías:** Viajes Cortos.
- **Capacidad:** `24-28 puestos`.
- **Disposición de cabina:** Matriz `2+2` o `2+1` compacta (en pasillo angosto), `1` piso, 6 a 7 filas. Sin baño.
- **Equipamiento típico:** A/A `Opcional según línea` (más común en servicio privado); WiFi `No estándar`; maletero trasero pequeño.
- **Notas operativas:** Cubre rutas de baja densidad o enlaces alimentadores.

#### `yutong_zk6896hga`
- **Marca / Carrocera y Chasis:** Yutong `ZK6896 / ZK6896HGA` (8 m).
- **Categorías:** Viajes Cortos (urbanos / suburbanos estatales).
- **Capacidad:** `25-30 asientos` + pasajeros de pie en modalidad urbana.
- **Disposición de cabina:** Matriz `2+2` (o `2+1` en zona central para silla de ruedas/puerta central), `1` piso, 2 puertas laterales. Sin baño.
- **Equipamiento típico:** A/A `Frecuente` en unidades rehabilitadas; WiFi `No estándar`; sin bodega inferior.
- **Notas operativas:** Exclusiva de flotas públicas (Misión Transporte, TransBolívar, BusTrujillo, SITSSA).

#### `encava_e_van_toano`
- **Marca / Carrocera y Chasis:** Encava E-Van Toano (plataforma Foton) / segmento ejecutivos ligeros compartidos con `Joylong`, `JMC Co Star` y `Dongfeng`.
- **Categorías:** Viajes Cortos ejecutivos y traslados privados.
- **Capacidad:** `15-18 puestos`.
- **Disposición de cabina:** Matriz `2+1`, `1` piso, 5 filas + fila trasera corrida de 3-4 puestos. Sin baño.
- **Equipamiento típico:** A/A `Frecuente`; WiFi `Opcional`; puertos USB `Frecuente`; sin baño.
- **Notas operativas:** Canalizada casi exclusivamente a turismo, ejecutivos y transporte corporativo.

---

## 2. Viajes Regionales / Media Distancia (80–120 km a 250–300 km)

Corredores típicos: `Caracas–Valencia (160 km)`, `Los Teques–Valencia (124 km)`, `Valencia–Barquisimeto (186 km)`, `Puerto La Cruz–Maturín (210 km)`, `Mérida–San Cristóbal (255 km)`.

### Resumen Comparativo

| `model_code` | Marca / Carrocera y Chasis | Capacidad | Layout | Pisos | A/A | WiFi | Operadores Típicos |
|---|---|---:|:---:|:---:|---|---|---|
| `encava_ent_3300` | Encava / Cummins 6CT 8.3L (211–275 HP) | 43 / 52 / 63 | `2+2` | 1 | Opcional según línea | No estándar | Cooperativas regionales, Servicios Especiales del Centro |
| `encava_ent_3200` | Encava / Cummins 6CT 8.3L | 43–52 | `2+2` | 1 | Opcional según línea | No estándar | Líneas regionales interurbanas |
| `marcopolo_viaggio_gv1000` | Marcopolo Viaggio GV1000 / Volvo B10M | 44–46 | `2+2` | 1 | Frecuente (en privadas) | Raro | Aeroexpresos Ejecutivos / reventa regional |
| `yutong_zk6118hga` | Yutong / Chasis Yutong | 37–45 | `2+2` | 1 | Frecuente | No estándar | SITSSA / flotas estatales |
| `blue_bird_classic` | Blue Bird All American / chasis clásico | 44–48 | `2+2` | 1 | Poco común | No estándar | Legado histórico en eje central (muy puntual) |

### Fichas Técnicas Detalladas

#### `encava_ent_3300`
- **Marca / Carrocera y Chasis:** Encava ENT-3300 con motor Cummins 6CT 8.3L (211–275 HP), transmisión sincrónica o automática. Considerada por el fabricante su unidad más versátil de carretera.
- **Categorías:** Viajes Regionales (principal) y Estatales económicos.
- **Capacidad:** `43 puestos` (configuración ejecutiva con bodega/reclinación), `52 puestos` (estándar regional) o `63 puestos` (alta densidad urbana/suburbana).
- **Disposición de cabina:**
  - Matriz: `2+2`.
  - Pisos: `1`.
  - Filas y excepciones: 10 a 13 filas según configuración (`43` con espacio amplio y baño opcional trasero en adaptaciones ejecutivas, hasta `63` sin baño y fila trasera de 5 puestos). Puerta delantera derecha.
- **Equipamiento típico:** A/A `Opcional según línea` (ausente o inoperativo en líneas económicas de terminal público; operativo en variantes ejecutivas privadas); WiFi `No estándar`; bodega inferior mediana.
- **Notas operativas:** Sostiene el tráfico masivo en La Bandera y Big Low Center; acompaña también la variante histórica `E-2000-49A` en rutas de occidente.

#### `encava_ent_3200`
- **Marca / Carrocera y Chasis:** Encava ENT-3200 / Cummins 6CT 8.3L.
- **Categorías:** Viajes Regionales.
- **Capacidad:** `43-52 puestos`.
- **Disposición de cabina:** Matriz `2+2`, `1` piso, 11-12 filas + fila final de 4 o 5 puestos.
- **Equipamiento típico:** A/A `Opcional según línea`; WiFi `No estándar`; maletero inferior lateral.
- **Notas operativas:** Hermana de generación previa al ENT-3300, muy extendida en el centro-occidente.

#### `marcopolo_viaggio_gv1000`
- **Marca / Carrocera y Chasis:** Marcopolo Viaggio GV1000 (importación 1995–2005) sobre chasis Volvo B10M.
- **Categorías:** Viajes Regionales y Estatales.
- **Capacidad:** `44-46 puestos` (Estándar de fábrica) / `40-44` (Configuración ejecutiva en Venezuela).
- **Disposición de cabina:** Matriz `2+2`, `1` piso alto, 11 filas con baño trasero en el lateral derecho (`asientos 43-44` reducidos o suprimidos). Puerta delantera única.
- **Equipamiento típico:** A/A `Frecuente` en operadores privados como **Aeroexpresos Ejecutivos**; WiFi `Raro`; baño a bordo y bodegas pasantes amplias.
- **Notas operativas:** Flota envejecida mantenida mediante repotenciación mecánica y repintado entre empresas.

#### `yutong_zk6118hga`
- **Marca / Carrocera y Chasis:** Yutong ZK6118HGA (11 m).
- **Categorías:** Viajes Regionales estatales.
- **Capacidad:** `37-45 puestos`.
- **Disposición de cabina:** Matriz `2+2`, `1` piso, puertas delantera y central.
- **Equipamiento típico:** A/A `Frecuente`; WiFi `No estándar`; sin baño en versión estándar suburbana.
- **Notas operativas:** Operado por SITSSA y operadoras estatales regionales.

---

## 3. Viajes Estatales / Larga Distancia (> 250–300 km)

Corredores típicos: `Caracas–Maracaibo (694 km)`, `Caracas–San Cristóbal (815 km)`, `Caracas–Mérida (680 km)`, `Caracas–Puerto Ordaz (670 km)`, `Caracas–Santa Elena de Uairén`.

### Resumen Comparativo

| `model_code` | Marca / Carrocera y Chasis | Capacidad | Layout | Pisos | A/A | WiFi | Operadores Típicos |
|---|---|---:|:---:|:---:|---|---|---|
| `marcopolo_paradiso_g6_1800dd` | Marcopolo Paradiso G6 1800DD / Volvo B12R, Scania K124/K360, MB O-500RSD | 54–60 | Mixto (`2+1` P1 / `2+2` P2) | 2 | Frecuente | Raro | Aeroexpresos Ejecutivos, Expresos Occidente, Flamingo, Los Llanos |
| `marcopolo_paradiso_gv1800dd` | Marcopolo Paradiso GV1800DD / Volvo B10/B12B | 52–58 | Mixto (`2+1` P1 / `2+2` P2) | 2 | Frecuente | Raro | Expresos Occidente, Expresos Los Llanos, reventa privada |
| `busscar_panoramico_dd` | Busscar Panorâmico DD / Volvo B12R I-Shift, Scania K360, MB O-400/O-500RSD | 54–60 | Mixto (`2+1` P1 / `2+2` P2) | 2 | Frecuente | Raro | Aeroexpresos Ejecutivos, Rodovías, Expresos Mérida, San Cristóbal |
| `marcopolo_paradiso_gv1450` | Marcopolo Paradiso GV1450 / MB O-400RSD, Scania K124EB | 42–46 | `2+2` | 1 | Frecuente | No estándar | Expresos Occidente, Flamingo, Bus-Ven, Uni-Zulia |
| `busscar_jumbuss_380` | Busscar JumBuss 380 / MB O-400RSD, Scania K124EB | 42–46 | `2+2` | 1 | Frecuente | No estándar | Expresos Primavera, Camargüí, Línea de los Andes |
| `encava_ent_6100_ar` | Encava ENT-6100 AR / Cummins 335 HP | 49 | `2+2` | 1 | Frecuente (variante AR) | No estándar | Líneas privadas de terminal público y rutas largas |
| `yutong_zk6122h9` | Yutong ZK6122H9 / ZK6129H Executive | 42–49 | `2+2` | 1 | Frecuente | No estándar | SITSSA (rutas troncales desde Caracas a +20 ciudades) |
| `yutong_zk6146h` | Yutong ZK6146H (piso alto 13.7 m) | 49–53 | `2+2` | 1 | Frecuente | No estándar | SITSSA (expresos de larga distancia) |
| `irizar_i8_exec` | Irizar / Chasis europeo turismo/lujo | 40–44 | `2+2` | 1 | Frecuente | Opcional | Flotas turísticas y servicios ejecutivos privados |

### Fichas Técnicas Detalladas

#### `marcopolo_paradiso_g6_1800dd`
- **Marca / Carrocera y Chasis:** Marcopolo Paradiso G6 1800DD (series 2005–2007) sobre chasis Volvo B12R, Scania K124IB / K360 y Mercedes-Benz O-500RSD.
- **Categorías:** Viajes Estatales / Larga Distancia (modalidad *buscama* / *poltronabus*).
- **Capacidad:** `54-60 puestos` (Estándar de fábrica) / `52-58 puestos` (Configuración frecuente en Venezuela: ~12 VIP *poltrona* abajo + 40-44 semi-cama arriba).
- **Disposición de cabina:**
  - Pisos: `2`.
  - Piso 1 (`deck 1`): Matriz `2+1` VIP (12 asientos tipo cama en 4 filas), puerta de embarque central, escalera al Piso 2 y baño principal detrás de cabina inferior.
  - Piso 2 (`deck 2`): Matriz `2+2` (10 a 11 filas), mampara protectora frontal sobre escalera y parabrisas panorámico.
- **Equipamiento típico:** A/A `Frecuente` (climatización estándar de servicio buscama, sujeta a fallas ocasionales por antigüedad > 18 años); WiFi `Raro`; baño a bordo; bodegas amplias; TV/audio.
- **Notas operativas:** Columna vertebral del servicio premium en **Aeroexpresos Ejecutivos C.A.**, **Expresos Occidente**, **Expresos Los Llanos** y **Expresos Flamingo**.

#### `marcopolo_paradiso_gv1800dd`
- **Marca / Carrocera y Chasis:** Marcopolo Paradiso GV1800DD (pioneros desde 1997) sobre Volvo B10 / B12B.
- **Categorías:** Viajes Estatales / Larga Distancia.
- **Capacidad:** `52-58 puestos` (`12` en Piso 1 + `40-46` en Piso 2).
- **Disposición de cabina:** Piso 1 `2+1` VIP; Piso 2 `2+2`; escalera central y baño en Piso 1.
- **Equipamiento típico:** A/A `Frecuente`; WiFi `No estándar`; baño y bodega pasante.
- **Notas operativas:** Unidades pioneras de doble piso en Venezuela, muchas repotenciadas y reasignadas entre empresas expresas.

#### `busscar_panoramico_dd`
- **Marca / Carrocera y Chasis:** Busscar Panorâmico DD (2006–2008) sobre Volvo B12R I-Shift, Scania K360 o Mercedes-Benz O-400RSD / O-500RSD 2436.
- **Categorías:** Viajes Estatales / Larga Distancia.
- **Capacidad:** `54-60 puestos` (`12` Piso 1 + `42-48` Piso 2).
- **Disposición de cabina:** Piso 1 `2+1` *buscama*; Piso 2 `2+2`; baño inferior junto a escalera.
- **Equipamiento típico:** A/A `Frecuente`; WiFi `Raro`; baño y gran bodega inferior.
- **Notas operativas:** Altamente valorada por **Aeroexpresos Ejecutivos**, **Rodovías de Venezuela** y **Expresos San Cristóbal** por ergonomía de cabina.

#### `marcopolo_paradiso_gv1450` y `busscar_jumbuss_380`
- **Marca / Carrocera y Chasis:** Autocares brasileños de un piso alto (`high decker`) sobre chasis Mercedes-Benz O-400RSD y Scania K124EB.
- **Categorías:** Viajes Estatales / Larga Distancia.
- **Capacidad:** `42-46 puestos`.
- **Disposición de cabina:** Matriz `2+2`, `1` piso alto, 11 filas con baño en parte trasera derecha (`asientos 43-44` ausentes).
- **Equipamiento típico:** A/A `Frecuente`; WiFi `No estándar`; baño trasero; bodega inferior amplia.
- **Notas operativas:** Alternativa robusta de un solo piso usada por **Expresos Occidente**, **Expresos Flamingo**, **Expresos Primavera** y **Bus-Ven**.

#### `encava_ent_6100_ar`
- **Marca / Carrocera y Chasis:** Encava ENT-6100 AR (tope carretero de la ensambladora nacional), motor Cummins 335 HP.
- **Categorías:** Viajes Estatales y Regionales largos.
- **Capacidad:** `49 puestos` (Estándar de fábrica) / `45-49` (Configuración frecuente).
- **Disposición de cabina:** Matriz `2+2`, `1` piso, 12 filas + baño trasero / asiento final según configuración.
- **Equipamiento típico:** A/A `Frecuente` en versión `AR` (aire acondicionado); WiFi `No estándar`; bodega inferior; baño opcional.
- **Notas operativas:** Principal respuesta nacional para rutas largas sin acceso a importación de autocares brasileños.

#### `yutong_zk6122h9` / `yutong_zk6129h` / `yutong_zk6146h`
- **Marca / Carrocera y Chasis:** Yutong de carretera (`1` piso), modelos `ZK6122H9`, `ZK6129H / HE` y `ZK6146H`.
- **Categorías:** Viajes Estatales / Larga Distancia (sector público).
- **Capacidad:** `42-49 puestos` (`ZK6122/6129`), `49-53 puestos` (`ZK6146H`).
- **Disposición de cabina:** Matriz `2+2`, `1` piso, 11 a 13 filas con baño central o trasero.
- **Equipamiento típico:** A/A `Frecuente`; WiFi `No estándar`; puertos USB en series ejecutivas; baño; bodega inferior.
- **Notas operativas:** Base de la flota troncal de **SITSSA** conectando Caracas con Maracaibo, Mérida, San Cristóbal, Puerto Ordaz y oriente a tarifas BCV.

---

## 4. Viajes Internacionales (Rutas Transfronterizas con Transbordo)

En la operativa cotidiana de 2026 rige el **esquema de transbordo**: el tramo interno venezolano llega al nodo fronterizo (San Antonio / San Cristóbal, Paraguachón o Santa Elena de Uairén) con flotas locales (`Marcopolo`, `Busscar`, `Encava`) y tras el control migratorio el pasajero aborda unidades colombianas o brasileñas de estándar moderno.

### Resumen Comparativo

| `model_code` | Operadora / País | Modelo y Chasis | Capacidad | Layout | Pisos | A/A | WiFi | Corredor |
|---|---|---|---:|:---:|:---:|---|---|---|
| `bolivariano_duobus_dd` | Expreso Bolivariano (Colombia) | Marcopolo Paradiso DuoBus / Mercedes-Benz | 56 | Mixto (`2+1` P1 / `2+2` P2) | 2 | Estándar integral | Estándar integral + GPS + Tomas | Cúcuta → Bogotá / Medellín / Cali |
| `bolivariano_2g_gold` | Expreso Bolivariano (Colombia) | Marcopolo 2G / 2G+ / 2G Gold / MB | 36 | `2+2` amplio | 1 | Estándar integral | Estándar integral + GPS + Tomas | Cúcuta → interior Colombia |
| `copetran_preferencial_2b` | Copetran (Colombia) | Autocar Preferencial 2 Baños | 36–40 | `2+2` | 1 | Estándar integral | Estándar integral + 2 baños + Tomas | Cúcuta / Maicao → Bucaramanga / Bogotá |
| `copetran_minivan_18` | Copetran / Bolivariano (Colombia) | Tecnovans / MiniVan 18 pax | 18–22 | `2+1` van | 1 | Estándar integral | Estándar integral + pantallas/tomas | Maicao ↔ Riohacha / Cúcuta |
| `eucatur_amatur_rodoviario` | Eucatur / Amatur (Brasil) | Autocar carretero brasileño (Marcopolo/Busscar) | 42–46 | `2+2` | 1 | Frecuente | Opcional | Pacaraima → Boa Vista → Manaos |

---

## 5. Anexo Técnico: Esquema JSON Canónico (`seat_layout_schema`)

Este esquema define la estructura que debe almacenarse en la columna `seat_layout JSONB` de la tabla `buses` (o `bus_models`) en PostgreSQL, permitiendo que tanto el renderizador **2D (React Native Expo)** como el renderizador **3D (Three.js / R3F Web)** consuman exactamente la misma geometría sin duplicar reglas de negocio.

### Contrato JSON Schema (Ejemplo: `marcopolo_paradiso_g6_1800dd`)

```json
{
  "schema_version": "1.0.0",
  "model_code": "marcopolo_paradiso_g6_1800dd",
  "brand": "Marcopolo",
  "model_name": "Paradiso G6 1800 DD",
  "chassis": "Volvo B12R / Mercedes-Benz O-500RSD",
  "total_capacity": 56,
  "decks_count": 2,
  "service_tier": "BUSCAMA_VIP",
  "amenities": {
    "wifi": false,
    "ac": true,
    "bath": true,
    "usb": true,
    "recline_degrees": 160
  },
  "decks": [
    {
      "deck_number": 1,
      "label": "Piso 1 — Salón VIP Cama",
      "layout_type": "2+1",
      "columns": ["A", "B", "AISLE", "C"],
      "rows": [
        { "row": 1, "cells": ["DOOR_FRONT", "DRIVER", "AISLE", "STAIRS_UP"] },
        { "row": 2, "cells": [{"seat": 1, "type": "VIP"}, {"seat": 2, "type": "VIP"}, "AISLE", {"seat": 3, "type": "VIP"}] },
        { "row": 3, "cells": [{"seat": 4, "type": "VIP"}, {"seat": 5, "type": "VIP"}, "AISLE", {"seat": 6, "type": "VIP"}] },
        { "row": 4, "cells": [{"seat": 7, "type": "VIP"}, {"seat": 8, "type": "VIP"}, "AISLE", {"seat": 9, "type": "VIP"}] },
        { "row": 5, "cells": [{"seat": 10, "type": "VIP"}, {"seat": 11, "type": "VIP"}, "AISLE", {"seat": 12, "type": "VIP"}] },
        { "row": 6, "cells": ["BATHROOM", "EMPTY", "AISLE", "SERVICE_PANTRY"] }
      ]
    },
    {
      "deck_number": 2,
      "label": "Piso 2 — Panorámico Semi-Cama",
      "layout_type": "2+2",
      "columns": ["A", "B", "AISLE", "C", "D"],
      "rows": [
        { "row": 1, "cells": [{"seat": 13, "type": "PREMIUM"}, {"seat": 14, "type": "PREMIUM"}, "AISLE", {"seat": 15, "type": "PREMIUM"}, {"seat": 16, "type": "PREMIUM"}] },
        { "row": 2, "cells": [{"seat": 17, "type": "STANDARD"}, {"seat": 18, "type": "STANDARD"}, "AISLE", {"seat": 19, "type": "STANDARD"}, {"seat": 20, "type": "STANDARD"}] },
        { "row": 11, "cells": [{"seat": 53, "type": "STANDARD"}, {"seat": 54, "type": "STANDARD"}, "AISLE", {"seat": 55, "type": "STANDARD"}, {"seat": 56, "type": "STANDARD"}] }
      ]
    }
  ],
  "render_hints_3d": {
    "bus_length_m": 14.0,
    "bus_width_m": 2.6,
    "bus_height_m": 4.1,
    "deck_elevation_m": [0.45, 2.25]
  }
}
```

### Ejemplo Un Piso (`encava_ent_610` — 32 Puestos)

```json
{
  "schema_version": "1.0.0",
  "model_code": "encava_ent_610",
  "brand": "Encava",
  "model_name": "ENT-610 Suburbano / Regional",
  "chassis": "Isuzu 6HH1-S",
  "total_capacity": 32,
  "decks_count": 1,
  "service_tier": "STANDARD",
  "amenities": {
    "wifi": false,
    "ac": false,
    "bath": false,
    "usb": false,
    "recline_degrees": 115
  },
  "decks": [
    {
      "deck_number": 1,
      "label": "Salón Principal",
      "layout_type": "2+2",
      "columns": ["A", "B", "AISLE", "C", "D"],
      "rows": [
        { "row": 0, "cells": ["DRIVER", "EMPTY", "AISLE", "CO_PILOT", "DOOR_FRONT"] },
        { "row": 1, "cells": [{"seat": 1, "type": "STANDARD"}, {"seat": 2, "type": "STANDARD"}, "AISLE", {"seat": 3, "type": "STANDARD"}, {"seat": 4, "type": "STANDARD"}] },
        { "row": 7, "cells": [{"seat": 25, "type": "STANDARD"}, {"seat": 26, "type": "STANDARD"}, "AISLE", {"seat": 27, "type": "STANDARD"}, {"seat": 28, "type": "STANDARD"}] },
        { "row": 8, "cells": [{"seat": 29, "type": "STANDARD"}, {"seat": 30, "type": "STANDARD"}, {"seat": 31, "type": "STANDARD"}, {"seat": 32, "type": "STANDARD"}, "EMPTY"] }
      ]
    }
  ],
  "render_hints_3d": {
    "bus_length_m": 9.2,
    "bus_width_m": 2.45,
    "bus_height_m": 3.15,
    "deck_elevation_m": [0.7]
  }
}
```

### Tipos de Celda Permitidos (`CellToken`)
- Objeto de asiento: `{"seat": <int>, "type": "STANDARD" | "PREMIUM" | "VIP"}`
- Elementos estructurales: `"AISLE"`, `"DRIVER"`, `"CO_PILOT"`, `"DOOR_FRONT"`, `"DOOR_MID"`, `"BATHROOM"`, `"STAIRS_UP"`, `"STAIRS_DOWN"`, `"SERVICE_PANTRY"`, `"EMPTY"`.
