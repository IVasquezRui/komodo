# Terminales Terrestres y Red de Rutas de Pasajeros en Venezuela

> **Proyecto:** Komodo — Plataforma de Venta de Pasajes Interurbanos y Extraurbanos  
> **Propósito:** Fuente de verdad (*Source of Truth*) para auditoría operativa y diseño de scripts de *seed* en **PostgreSQL 16 + PostGIS (`SRID 4326`)**.

---

## 1. Resumen Ejecutivo y Metodología

Este documento consolida la infraestructura verificada de terminales de pasajeros terrestres en las **24 entidades federales de Venezuela** (23 estados + Distrito Capital) y sus principales rutas operativas (cortas, regionales, estatales e internacionales con transbordo fronterizo).

### Criterios de Clasificación de Infraestructura
1. **Terminal Público Municipal:** Recinto administrado por alcaldías, institutos autónomos o gobernaciones, fiscalizado por el **INTT** (Instituto Nacional de Transporte Terrestre), con múltiples operadoras privadas, cooperativas y rutas estatales.
2. **Terminal Privado / Expreso:** Sede operativa perteneciente a una línea expresa específica (ej. Bello Campo — *Aeroexpresos Ejecutivos*, Prados de María — *Expresos Occidente*, o puntos exclusivos de *Expresos Flamingo*).
3. **Parada Intermodal / Enlace:** Nodo de transferencia fluvial-terrestre, marítimo-terrestre (ferry) o fronterizo donde ocurre un transbordo reglamentario (ej. Tucupita, Punta de Piedras, San Antonio del Táchira, Paraguachón, Santa Elena de Uairén).

### Política Anti-Alucinación y Etiquetado
- **`[VERIFICADO]`**: Terminal o corredor troncal cuya existencia operativa, ciudad, municipio o rol en la red nacional está documentado en registros públicos del INTT, MPPT, alcaldías u operadoras verificables.
- **`[REQUIERE_VALIDACION_CAMPO]`**: Terminal secundario, terminal privado específico cuya continuidad operativa fluctúa, parada de descanso intermedia o ruta menor que requiere inspección física o llamada directa antes de publicarse en producción.
- **Coordenadas Geográficas (`SRID 4326`):** Solo se incluyen coordenadas latitud/longitud contrastadas con cartografía pública de referencia; las ubicaciones pendientes de levantamiento GPS exacto se marcan explícitamente como `TBD_GEOCODE`.
- **Conteo Total:** Debido a la ausencia de un censo nacional abierto y unificado de terminales secundarios municipales, cada entidad reporta únicamente los nodos documentados bajo la fórmula estándar `Total documentado verificado: N (sujeto a censo municipal de terminales menores/privados)`.

### Coherencia con el Repositorio Actual (`db/`)
En `db/01_schema.sql` existen las tablas `terminals` (`id`, `name`, `city`, `state`, `country`, `address`, `location GEOGRAPHY(POINT, 4326)`, `timezone`, `is_active`) y `routes` (`id`, `origin_terminal_id`, `destination_terminal_id`, `route_code`, `distance_km`, `estimated_duration`, `base_price_usd`). En `db/02_seed.sql` existen inicialmente 4 terminales semilla (`Caracas La Bandera`, `Maracaibo`, `Barquisimeto`, `Valencia`) con sus códigos UUID iniciales. La extensión en `db/04_*` o scripts Python idempotentes deberá incorporar códigos `terminal_code` y cubrir las 24 entidades respetando los UUID existentes para no romper reservas previas.

---

## 2. Tabla Resumen Nacional (24 Entidades Federales)

| # | Entidad Federal | Terminales Principales Verificados (N) | Terminales Secundarios / Privados Documentados | Estado de Cobertura |
|---:|---|:---:|:---:|---|
| 1 | Distrito Capital | 2 | 4 (`Nuevo Circo`, `Bello Campo*`, `Prados de María`, `Los Dos Caminos`) | Parcial - Requiere Campo |
| 2 | Amazonas | 1 | 0 (sujeto a censo municipal) | Parcial - Requiere Campo |
| 3 | Anzoátegui | 1 | 3 (`Barcelona`, `El Tigre`, `Anaco`) | Parcial - Requiere Campo |
| 4 | Apure | 1 | 2 (`Guasdualito`, `Achaguas`) | Parcial - Requiere Campo |
| 5 | Aragua | 1 | 2 (`La Victoria`, `Cagua / Turmero`) | Parcial - Requiere Campo |
| 6 | Barinas | 1 | 1 (`Socopó`) | Parcial - Requiere Campo |
| 7 | Bolívar | 2 | 3 (`Upata`, `Santa Elena de Uairén`, `Caicara del Orinoco`) | Parcial - Requiere Campo |
| 8 | Carabobo | 1 | 2 (`Puerto Cabello`, `Guacara / Mariara`) | Parcial - Requiere Campo |
| 9 | Cojedes | 1 | 1 (`Tinaquillo`) | Parcial - Requiere Campo |
| 10 | Delta Amacuro | 1 | 0 (enlaces principalmente fluviales) | Parcial - Requiere Campo |
| 11 | Falcón | 2 | 1 (`Tucacas`) | Parcial - Requiere Campo |
| 12 | Guárico | 3 | 1 (`Zaraza`) | Parcial - Requiere Campo |
| 13 | La Guaira | 1 | 2 (`Catia La Mar`, `Macuto`) | Parcial - Requiere Campo |
| 14 | Lara | 1 | 2 (`Carora`, `El Tocuyo / Quíbor`) | Parcial - Requiere Campo |
| 15 | Mérida | 1 | 2 (`El Vigía`, `Tovar`) | Parcial - Requiere Campo |
| 16 | Miranda | 1 | 4 (`Los Teques`, `Guarenas/Guatire`, `Charallave/Valles del Tuy`, `Higuerote/Río Chico`) | Parcial - Requiere Campo |
| 17 | Monagas | 1 | 1 (`Punta de Mata`) | Parcial - Requiere Campo |
| 18 | Nueva Esparta | 1 | 1 (`Punta de Piedras - Intermodal Ferry`) | Parcial - Requiere Campo |
| 19 | Portuguesa | 2 | 0 (sujeto a censo municipal) | Parcial - Requiere Campo |
| 20 | Sucre | 2 | 1 (`Güiria`) | Parcial - Requiere Campo |
| 21 | Táchira | 3 | 2 (`Rubio`, `Colón`) | Parcial - Requiere Campo |
| 22 | Trujillo | 3 | 0 (sujeto a censo municipal) | Parcial - Requiere Campo |
| 23 | Yaracuy | 1 | 1 (`Chivacoa`) | Parcial - Requiere Campo |
| 24 | Zulia | 4 | 2 (`Cabimas`, `Paraguachón - Enlace Fronterizo`) | Parcial - Requiere Campo |

*(Nota: `*Bello Campo` y `Los Dos Caminos` operan funcionalmente en el Área Metropolitana de Caracas, ubicados políticamente en los municipios Chacao y Sucre del estado Miranda).*

---

## 3. Desglose por Entidad Federal (23 Estados + Distrito Capital)

### 3.1 Distrito Capital
Total documentado verificado: 3 públicos + sedes privadas en Área Metropolitana (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `ccs_la_bandera` | Terminal de Pasajeros de La Bandera | Público | Caracas / Libertador | `10.4767, -66.8993` | `[VERIFICADO]` |
| `ccs_nuevo_circo` | Terminal Urbano de Nuevo Circo | Público | Caracas / Libertador | `TBD_GEOCODE` | `[VERIFICADO]` |
| `ccs_prados_maria` | Terminal Privado Expresos Occidente (Prados de María / El Cementerio) | Privado | Caracas / Libertador | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

**Matriz de Rutas desde/hacia Distrito Capital:**

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Puntos Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `CCS-MCY` | `ccs_la_bandera` | `ara_maracay_central` | Corto | Peaje Tazón, La Cabrera `[REQUIERE_VALIDACION_CAMPO]` | ~109 km | `2h 00m - 2h 30m` | `[VERIFICADO]` |
| `CCS-VAL` | `ccs_la_bandera` | `car_big_low` | Regional | Tejerías, Maracay `[REQUIERE_VALIDACION_CAMPO]` | ~160 km | `2h 30m - 3h 30m` | `[VERIFICADO]` |
| `CCS-BRM` | `ccs_la_bandera` | `lar_barquisimeto` | Regional | Valencia, Chivacoa `[REQUIERE_VALIDACION_CAMPO]` | ~360 km | `5h 00m - 6h 30m` | `[VERIFICADO]` |
| `CCS-MCB` | `ccs_la_bandera` | `zul_maracaibo_central` | Estatal | Valencia, Barquisimeto, Carora `[REQUIERE_VALIDACION_CAMPO]` | ~694 km | `9h 30m - 12h 00m` | `[VERIFICADO]` |
| `CCS-SCR` | `ccs_la_bandera` | `tac_la_concordia` | Estatal | Valencia, Barinas, Socopó `[REQUIERE_VALIDACION_CAMPO]` | ~815 km | `12h 00m - 15h 00m` | `[VERIFICADO]` |
| `CCS-MER` | `ccs_la_bandera` | `mer_jose_antonio_paredes` | Estatal | Valencia, Guanare, Barinas `[REQUIERE_VALIDACION_CAMPO]` | ~680 km | `10h 00m - 13h 00m` | `[VERIFICADO]` |
| `CCS-PLC` | `mir_terminal_oriente` | `anz_puerto_la_cruz` | Estatal | Caucagua, Clarines, Boca de Uchire `[REQUIERE_VALIDACION_CAMPO]` | ~320 km | `4h 00m - 5h 30m` | `[VERIFICADO]` |
| `CCS-PZO` | `mir_terminal_oriente` | `bol_manuel_piar` | Estatal | Anaco, El Tigre, Ciudad Bolívar `[REQUIERE_VALIDACION_CAMPO]` | ~670 km | `8h 00m - 10h 30m` | `[VERIFICADO]` |

---

### 3.2 Estado Amazonas
Total documentado verificado: 1 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `ama_puerto_ayacucho` | Terminal de Pasajeros de Puerto Ayacucho | Público | Puerto Ayacucho / Atures | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `PYA-SFA` | `ama_puerto_ayacucho` | `apu_san_fernando` | Estatal | Chalanas Río Orinoco / El Burro `[REQUIERE_VALIDACION_CAMPO]` | ~390 km | `7h 00m - 9h 00m` | `[REQUIERE_VALIDACION_CAMPO]` |
| `PYA-CCS` | `ama_puerto_ayacucho` | `ccs_la_bandera` | Estatal | Caicara / San Fernando, Calabozo `[REQUIERE_VALIDACION_CAMPO]` | ~750 km | `12h 00m - 15h 00m` | `[REQUIERE_VALIDACION_CAMPO]` |

---

### 3.3 Estado Anzoátegui
Total documentado verificado: 4 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `anz_puerto_la_cruz` | Terminal de Pasajeros de Puerto La Cruz | Público | Puerto La Cruz / Sotillo | `10.2174, -64.6348` | `[VERIFICADO]` |
| `anz_barcelona` | Terminal de Pasajeros de Barcelona | Público | Barcelona / Simón Bolívar | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `anz_el_tigre` | Terminal de Pasajeros Cleto Quijada (El Tigre) | Público | El Tigre / Simón Rodríguez | `TBD_GEOCODE` | `[VERIFICADO]` |
| `anz_anaco` | Terminal de Pasajeros de Anaco | Público | Anaco / Anaco | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `PLC-CUM` | `anz_puerto_la_cruz` | `suc_cumana` | Corto | Mochima / Santa Fe `[REQUIERE_VALIDACION_CAMPO]` | ~82 km | `1h 30m - 2h 15m` | `[VERIFICADO]` |
| `PLC-MAT` | `anz_puerto_la_cruz` | `mon_maturin` | Regional | Km 52, Urica, Punta de Mata `[REQUIERE_VALIDACION_CAMPO]` | ~210 km | `3h 00m - 4h 00m` | `[VERIFICADO]` |
| `PLC-PZO` | `anz_puerto_la_cruz` | `bol_manuel_piar` | Estatal | Anaco, El Tigre, Ciudad Bolívar `[REQUIERE_VALIDACION_CAMPO]` | ~385 km | `5h 00m - 6h 30m` | `[VERIFICADO]` |

---

### 3.4 Estado Apure
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `apu_san_fernando` | Terminal de Pasajeros Humberto Hernández (San Fernando) | Público | San Fernando de Apure / San Fernando | `TBD_GEOCODE` | `[VERIFICADO]` |
| `apu_guasdualito` | Terminal de Pasajeros de Guasdualito | Público | Guasdualito / Páez | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `apu_achaguas` | Terminal Municipal de Achaguas | Público | Achaguas / Achaguas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `SFA-CAL` | `apu_san_fernando` | `gua_calabozo` | Regional | Camaguán `[REQUIERE_VALIDACION_CAMPO]` | ~130 km | `2h 00m - 2h 45m` | `[VERIFICADO]` |
| `SFA-CCS` | `apu_san_fernando` | `ccs_la_bandera` | Estatal | Calabozo, San Juan de los Morros `[REQUIERE_VALIDACION_CAMPO]` | ~410 km | `6h 30m - 8h 00m` | `[VERIFICADO]` |
| `GUA-SCR` | `apu_guasdualito` | `tac_la_concordia` | Estatal | El Piñal `[REQUIERE_VALIDACION_CAMPO]` | ~285 km | `5h 00m - 6h 30m` | `[REQUIERE_VALIDACION_CAMPO]` |

---

### 3.5 Estado Aragua
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `ara_maracay_central` | Terminal Central de Pasajeros de Maracay | Público | Maracay / Girardot | `TBD_GEOCODE` | `[VERIFICADO]` |
| `ara_la_victoria` | Terminal de Pasajeros de La Victoria | Público | La Victoria / José Félix Ribas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `ara_cagua` | Terminal de Pasajeros de Cagua | Público | Cagua / Sucre | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `MCY-VAL` | `ara_maracay_central` | `car_big_low` | Corto | San Joaquín, Guacara `[REQUIERE_VALIDACION_CAMPO]` | ~52 km | `1h 00m - 1h 30m` | `[VERIFICADO]` |
| `MCY-CCS` | `ara_maracay_central` | `ccs_la_bandera` | Corto | La Victoria, Peaje Tazón `[REQUIERE_VALIDACION_CAMPO]` | ~109 km | `2h 00m - 2h 30m` | `[VERIFICADO]` |
| `MCY-SJM` | `ara_maracay_central` | `gua_san_juan_morros` | Corto | Villa de Cura `[REQUIERE_VALIDACION_CAMPO]` | ~55 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |

---

### 3.6 Estado Barinas
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `bar_barinas` | Terminal de Pasajeros Nuestra Señora del Pilar (Barinas) | Público | Barinas / Barinas | `TBD_GEOCODE` | `[VERIFICADO]` |
| `bar_socopo` | Terminal Municipal de Socopó | Público | Socopó / Antonio José de Sucre | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `BAR-GUA` | `bar_barinas` | `por_guanare` | Regional | Boconoíto `[REQUIERE_VALIDACION_CAMPO]` | ~95 km | `1h 30m - 2h 00m` | `[VERIFICADO]` |
| `BAR-MER` | `bar_barinas` | `mer_jose_antonio_paredes` | Regional | Santo Domingo, Mucuchíes `[REQUIERE_VALIDACION_CAMPO]` | ~165 km | `3h 30m - 4h 30m` | `[VERIFICADO]` |
| `BAR-VAL` | `bar_barinas` | `car_big_low` | Estatal | Guanare, Acarigua, San Carlos `[REQUIERE_VALIDACION_CAMPO]` | ~345 km | `5h 00m - 6h 30m` | `[VERIFICADO]` |

---

### 3.7 Estado Bolívar
Total documentado verificado: 5 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `bol_manuel_piar` | Terminal de Pasajeros Manuel Carlos Piar (Puerto Ordaz) | Público | Ciudad Guayana / Caroní | `8.2881, -62.7469` | `[VERIFICADO]` |
| `bol_tomas_heres` | Terminal de Pasajeros Tomás de Heres | Público | Ciudad Bolívar / Angostura del Orinoco | `TBD_GEOCODE` | `[VERIFICADO]` |
| `bol_upata` | Terminal Municipal de Upata | Público | Upata / Piar | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `bol_santa_elena` | Terminal Internacional de Santa Elena de Uairén | Público / Enlace | Santa Elena de Uairén / Gran Sabana | `TBD_GEOCODE` | `[VERIFICADO]` |
| `bol_caicara` | Terminal de Caicara del Orinoco | Público | Caicara del Orinoco / Cedeño | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `PZO-CBL` | `bol_manuel_piar` | `bol_tomas_heres` | Regional | Peaje Autopista Ciudad Bolívar `[REQUIERE_VALIDACION_CAMPO]` | ~105 km | `1h 30m - 2h 00m` | `[VERIFICADO]` |
| `PZO-SEU` | `bol_manuel_piar` | `bol_santa_elena` | Estatal | Upata, Guasipati, Tumeremo, Km 88 `[REQUIERE_VALIDACION_CAMPO]` | ~615 km | `9h 00m - 11h 30m` | `[VERIFICADO]` |
| `SEU-PAC` | `bol_santa_elena` | `bra_pacaraima_enlace` | Internacional | Línea Fronteriza La Línea (transbordo a pie) | ~15 km | `0h 30m - 1h 00m` | `[VERIFICADO]` |

---

### 3.8 Estado Carabobo
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `car_big_low` | Terminal de Pasajeros Big Low Center | Público | Valencia / San Diego | `10.1928, -67.9667` | `[VERIFICADO]` |
| `car_puerto_cabello` | Terminal de Pasajeros Juan José Flores (Puerto Cabello) | Público | Puerto Cabello / Puerto Cabello | `TBD_GEOCODE` | `[VERIFICADO]` |
| `car_guacara` | Terminal Suburbano de Guacara | Público | Guacara / Guacara | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `VAL-PBL` | `car_big_low` | `car_puerto_cabello` | Corto | Naguanagua, Trincheras `[REQUIERE_VALIDACION_CAMPO]` | ~55 km | `1h 00m - 1h 30m` | `[VERIFICADO]` |
| `VAL-BRM` | `car_big_low` | `lar_barquisimeto` | Regional | San Felipe / Chivacoa `[REQUIERE_VALIDACION_CAMPO]` | ~186 km | `3h 00m - 4h 00m` | `[VERIFICADO]` |
| `VAL-SCR` | `car_big_low` | `tac_la_concordia` | Estatal | San Carlos, Acarigua, Barinas `[REQUIERE_VALIDACION_CAMPO]` | ~655 km | `10h 00m - 12h 00m` | `[VERIFICADO]` |

---

### 3.9 Estado Cojedes
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `coj_san_carlos` | Terminal de Pasajeros de San Carlos | Público | San Carlos / Ezequiel Zamora | `TBD_GEOCODE` | `[VERIFICADO]` |
| `coj_tinaquillo` | Terminal Municipal de Tinaquillo | Público | Tinaquillo / Falcón | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `SNC-VAL` | `coj_san_carlos` | `car_big_low` | Regional | Tinaquillo, Campo Carabobo `[REQUIERE_VALIDACION_CAMPO]` | ~102 km | `1h 30m - 2h 15m` | `[VERIFICADO]` |
| `SNC-ACA` | `coj_san_carlos` | `por_acarigua` | Regional | San Rafael de Onoto `[REQUIERE_VALIDACION_CAMPO]` | ~85 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |

---

### 3.10 Estado Delta Amacuro
Total documentado verificado: 1 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `del_tucupita` | Terminal Fluvial y Terrestre de Tucupita | Público / Intermodal | Tucupita / Tucupita | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `TUC-MAT` | `del_tucupita` | `mon_maturin` | Regional | Temblador, Uracoa `[REQUIERE_VALIDACION_CAMPO]` | ~175 km | `2h 45m - 3h 45m` | `[VERIFICADO]` |
| `TUC-PZO` | `del_tucupita` | `bol_manuel_piar` | Regional | Paso Los Castillos / Chalana `[REQUIERE_VALIDACION_CAMPO]` | ~195 km | `3h 00m - 4h 30m` | `[REQUIERE_VALIDACION_CAMPO]` |

---

### 3.11 Estado Falcón
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `fal_coro` | Terminal de Pasajeros Polica Salas (Coro) | Público | Santa Ana de Coro / Miranda | `TBD_GEOCODE` | `[VERIFICADO]` |
| `fal_punto_fijo` | Terminal de Pasajeros Alí Primera (Punto Fijo) | Público | Punto Fijo / Carirubana | `TBD_GEOCODE` | `[VERIFICADO]` |
| `fal_tucacas` | Parada / Terminal de Tucacas | Público | Tucacas / José Laurencio Silva | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `COR-PFJ` | `fal_coro` | `fal_punto_fijo` | Corto | Istmo Médanos de Coro `[REQUIERE_VALIDACION_CAMPO]` | ~92 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |
| `COR-VAL` | `fal_coro` | `car_big_low` | Estatal | Morón, Tucacas, Yaracal `[REQUIERE_VALIDACION_CAMPO]` | ~290 km | `4h 30m - 5h 30m` | `[VERIFICADO]` |
| `COR-MCB` | `fal_coro` | `zul_maracaibo_central` | Estatal | Dabajuro, Mene Mauroa `[REQUIERE_VALIDACION_CAMPO]` | ~255 km | `4h 00m - 5h 00m` | `[VERIFICADO]` |

---

### 3.12 Estado Guárico
Total documentado verificado: 4 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `gua_san_juan_morros` | Terminal de Pasajeros de San Juan de los Morros | Público | San Juan de los Morros / Juan Germán Roscio | `TBD_GEOCODE` | `[VERIFICADO]` |
| `gua_calabozo` | Terminal de Pasajeros de Calabozo | Público | Calabozo / Francisco de Miranda | `TBD_GEOCODE` | `[VERIFICADO]` |
| `gua_valle_pascua` | Terminal de Pasajeros de Valle de la Pascua | Público | Valle de la Pascua / Leonardo Infante | `TBD_GEOCODE` | `[VERIFICADO]` |
| `gua_zaraza` | Terminal Municipal de Zaraza | Público | Zaraza / Pedro Zaraza | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `SJM-CCS` | `gua_san_juan_morros` | `ccs_la_bandera` | Regional | Villa de Cura, Encrucijada `[REQUIERE_VALIDACION_CAMPO]` | ~140 km | `2h 15m - 3h 00m` | `[VERIFICADO]` |
| `CAL-SJM` | `gua_calabozo` | `gua_san_juan_morros` | Regional | Ortiz, Dos Caminos `[REQUIERE_VALIDACION_CAMPO]` | ~145 km | `2h 00m - 2h 45m` | `[VERIFICADO]` |
| `VLP-PLC` | `gua_valle_pascua` | `anz_puerto_la_cruz` | Estatal | Zaraza, El Chaparro, Aragua de Barcelona `[REQUIERE_VALIDACION_CAMPO]` | ~265 km | `4h 00m - 5h 00m` | `[REQUIERE_VALIDACION_CAMPO]` |

---

### 3.13 Estado La Guaira
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `lag_la_guaira` | Terminal de Pasajeros de La Guaira | Público | La Guaira / Vargas | `TBD_GEOCODE` | `[VERIFICADO]` |
| `lag_catia_la_mar` | Terminal Urbano de Catia La Mar | Público | Catia La Mar / Vargas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `lag_macuto` | Parada Suburbana / Terminal Macuto | Público | Macuto / Vargas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `LGU-CCS` | `lag_la_guaira` | `ccs_nuevo_circo` | Corto | Autopista Caracas-La Guaira | ~32 km | `0h 45m - 1h 15m` | `[VERIFICADO]` |
| `LGU-VAL` | `lag_la_guaira` | `car_big_low` | Regional | Autopista Caracas-La Guaira, ARC `[REQUIERE_VALIDACION_CAMPO]` | ~195 km | `3h 00m - 4h 00m` | `[REQUIERE_VALIDACION_CAMPO]` |

---

### 3.14 Estado Lara
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `lar_barquisimeto` | Terminal de Pasajeros de Barquisimeto | Público | Barquisimeto / Iribarren | `10.0691, -69.3341` | `[VERIFICADO]` |
| `lar_carora` | Terminal de Pasajeros de Carora | Público | Carora / Torres | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `lar_quibor` | Terminal Municipal de Quíbor | Público | Quíbor / Jiménez | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `BRM-SNF` | `lar_barquisimeto` | `yar_san_felipe` | Corto | Yaritagua, Chivacoa `[REQUIERE_VALIDACION_CAMPO]` | ~85 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |
| `BRM-MCB` | `lar_barquisimeto` | `zul_maracaibo_central` | Estatal | Carora, Puente sobre el Lago `[REQUIERE_VALIDACION_CAMPO]` | ~335 km | `5h 00m - 6h 30m` | `[VERIFICADO]` |
| `BRM-VAL` | `lar_barquisimeto` | `car_big_low` | Regional | San Felipe, Morón `[REQUIERE_VALIDACION_CAMPO]` | ~186 km | `3h 00m - 4h 00m` | `[VERIFICADO]` |

---

### 3.15 Estado Mérida
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `mer_jose_antonio_paredes` | Terminal de Pasajeros José Antonio Paredes | Público | Mérida / Libertador | `8.5863, -71.1686` | `[VERIFICADO]` |
| `mer_el_vigia` | Terminal Terrestre Abelardo Parra León (El Vigía) | Público | El Vigía / Alberto Adriani | `TBD_GEOCODE` | `[VERIFICADO]` |
| `mer_tovar` | Terminal Municipal de Tovar | Público | Tovar / Tovar | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `MER-VIG` | `mer_jose_antonio_paredes` | `mer_el_vigia` | Corto | Estanques, Túneles de Mérida `[REQUIERE_VALIDACION_CAMPO]` | ~75 km | `1h 30m - 2h 00m` | `[VERIFICADO]` |
| `MER-SCR` | `mer_jose_antonio_paredes` | `tac_la_concordia` | Regional | El Vigía, La Fría, Colón `[REQUIERE_VALIDACION_CAMPO]` | ~255 km | `5h 00m - 6h 30m` | `[VERIFICADO]` |
| `MER-MCB` | `mer_jose_antonio_paredes` | `zul_maracaibo_central` | Estatal | El Vigía, Caja Seca, Ciudad Ojeda `[REQUIERE_VALIDACION_CAMPO]` | ~385 km | `6h 30m - 8h 00m` | `[VERIFICADO]` |

---

### 3.16 Estado Miranda
Total documentado verificado: 5 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `mir_terminal_oriente` | Terminal de Oriente Antonio José de Sucre | Público | Caracas / Sucre | `10.4820, -66.8040` | `[VERIFICADO]` |
| `mir_bello_campo` | Terminal Privado Aeroexpresos Ejecutivos (Bello Campo) | Privado | Caracas / Chacao | `TBD_GEOCODE` | `[VERIFICADO]` |
| `mir_los_dos_caminos` | Punto / Terminal Privado Expresos Flamingo (Los Dos Caminos) | Privado | Caracas / Sucre | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `mir_los_teques` | Terminal de Pasajeros Los Lagos (Los Teques) | Público | Los Teques / Guaicaipuro | `TBD_GEOCODE` | `[VERIFICADO]` |
| `mir_charallave` | Terminal de Pasajeros / Estación Charallave Sur | Público / Intermodal | Charallave / Cristóbal Rojas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `LTQ-MCY` | `mir_los_teques` | `ara_maracay_central` | Corto | Las Tejerías, La Victoria `[REQUIERE_VALIDACION_CAMPO]` | ~73 km | `1h 30m - 2h 00m` | `[VERIFICADO]` |
| `LTQ-VAL` | `mir_los_teques` | `car_big_low` | Regional | La Victoria, Maracay `[REQUIERE_VALIDACION_CAMPO]` | ~124 km | `2h 00m - 2h 45m` | `[VERIFICADO]` |
| `TOR-MAT` | `mir_terminal_oriente` | `mon_maturin` | Estatal | Guatire, Clarines, Km 52 `[REQUIERE_VALIDACION_CAMPO]` | ~515 km | `7h 00m - 9h 00m` | `[VERIFICADO]` |
| `TOR-CUM` | `mir_terminal_oriente` | `suc_cumana` | Estatal | Clarines, Puerto La Cruz `[REQUIERE_VALIDACION_CAMPO]` | ~400 km | `5h 30m - 7h 00m` | `[VERIFICADO]` |

---

### 3.17 Estado Monagas
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `mon_maturin` | Terminal Interurbano y Suburbano de Maturín | Público | Maturín / Maturín | `TBD_GEOCODE` | `[VERIFICADO]` |
| `mon_punta_mata` | Terminal de Pasajeros de Punta de Mata | Público | Punta de Mata / Ezequiel Zamora | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `MAT-PZO` | `mon_maturin` | `bol_manuel_piar` | Regional | Temblador, Puente Angosturita `[REQUIERE_VALIDACION_CAMPO]` | ~210 km | `3h 00m - 4h 00m` | `[VERIFICADO]` |
| `MAT-CAR` | `mon_maturin` | `suc_carupano` | Regional | Caripito, Casanay `[REQUIERE_VALIDACION_CAMPO]` | ~165 km | `2h 30m - 3h 30m` | `[VERIFICADO]` |

---

### 3.18 Estado Nueva Esparta
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `nes_porlamar` | Terminal de Pasajeros de Porlamar (Sector Achipano) | Público | Porlamar / Mariño | `TBD_GEOCODE` | `[VERIFICADO]` |
| `nes_punta_piedras` | Terminal Marítimo-Terrestre de Punta de Piedras | Intermodal (Ferry + Bus) | Punta de Piedras / Tubores | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `POR-PTP` | `nes_porlamar` | `nes_punta_piedras` | Corto | Juan Griego / San Juan (vía aeropuerto) | ~32 km | `0h 40m - 1h 00m` | `[VERIFICADO]` |
| `PTP-PLC` | `nes_punta_piedras` | `anz_puerto_la_cruz` | Regional (Multimodal) | Travesía marítima Guanta/Puerto La Cruz | ~80 km (mar) | `2h 30m - 4h 30m` | `[VERIFICADO]` |

---

### 3.19 Estado Portuguesa
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `por_acarigua` | Terminal de Pasajeros de Acarigua-Araure (COMTER) | Público | Acarigua / Páez | `TBD_GEOCODE` | `[VERIFICADO]` |
| `por_guanare` | Terminal de Pasajeros de Guanare | Público | Guanare / Guanare | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `ACA-BRM` | `por_acarigua` | `lar_barquisimeto` | Corto | Sarare `[REQUIERE_VALIDACION_CAMPO]` | ~75 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |
| `ACA-GUA` | `por_acarigua` | `por_guanare` | Corto | Ospino `[REQUIERE_VALIDACION_CAMPO]` | ~82 km | `1h 15m - 1h 30m` | `[VERIFICADO]` |
| `GUA-CCS` | `por_guanare` | `ccs_la_bandera` | Estatal | Acarigua, San Carlos, Valencia `[REQUIERE_VALIDACION_CAMPO]` | ~430 km | `6h 30m - 8h 00m` | `[VERIFICADO]` |

---

### 3.20 Estado Sucre
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `suc_cumana` | Terminal de Pasajeros de Cumaná | Público | Cumaná / Sucre | `TBD_GEOCODE` | `[VERIFICADO]` |
| `suc_carupano` | Terminal Terrestre General José Francisco Bermúdez | Público | Carúpano / Bermúdez | `TBD_GEOCODE` | `[VERIFICADO]` |
| `suc_guiria` | Terminal Municipal de Güiria | Público | Güiria / Valdez | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `CUM-CAR` | `suc_cumana` | `suc_carupano` | Regional | Cariaco, Casanay `[REQUIERE_VALIDACION_CAMPO]` | ~135 km | `2h 30m - 3h 15m` | `[VERIFICADO]` |
| `CUM-CCS` | `suc_cumana` | `mir_terminal_oriente` | Estatal | Puerto La Cruz, Clarines, Guatire `[REQUIERE_VALIDACION_CAMPO]` | ~400 km | `5h 30m - 7h 00m` | `[VERIFICADO]` |

---

### 3.21 Estado Táchira
Total documentado verificado: 5 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `tac_la_concordia` | Terminal de Pasajeros Genaro Méndez / La Concordia | Público | San Cristóbal / San Cristóbal | `7.7430, -72.2255` | `[VERIFICADO]` |
| `tac_san_antonio` | Terminal de Pasajeros de San Antonio del Táchira | Público / Enlace | San Antonio del Táchira / Bolívar | `TBD_GEOCODE` | `[VERIFICADO]` |
| `tac_la_fria` | Terminal de Pasajeros de La Fría | Público | La Fría / García de Hevia | `TBD_GEOCODE` | `[VERIFICADO]` |
| `tac_rubio` | Terminal Municipal de Rubio | Público | Rubio / Junín | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `tac_colon` | Terminal de San Juan de Colón | Público | San Juan de Colón / Ayacucho | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `SCR-SAT` | `tac_la_concordia` | `tac_san_antonio` | Corto | Capacho, Peracal `[REQUIERE_VALIDACION_CAMPO]` | ~45 km | `1h 00m - 1h 30m` | `[VERIFICADO]` |
| `SCR-CUC` | `tac_la_concordia` | `col_cucuta_terminal` | Internacional | San Antonio del Táchira / Puente Internacional (Res. 073/2023 o transbordo) | ~60 km | `1h 30m - 3h 00m` | `[VERIFICADO]` |
| `SCR-MCB` | `tac_la_concordia` | `zul_maracaibo_central` | Estatal | La Fría, El Vigía, Machiques / Caja Seca `[REQUIERE_VALIDACION_CAMPO]` | ~470 km | `9h 00m - 11h 00m` | `[VERIFICADO]` |

---

### 3.22 Estado Trujillo
Total documentado verificado: 3 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `tru_valera` | Terminal de Pasajeros de Valera (Plata III) | Público | Valera / Valera | `TBD_GEOCODE` | `[VERIFICADO]` |
| `tru_trujillo` | Terminal de Pasajeros Valle de los Mukas | Público | Trujillo / Trujillo | `TBD_GEOCODE` | `[VERIFICADO]` |
| `tru_bocono` | Terminal de Pasajeros de Boconó | Público | Boconó / Boconó | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `VLR-TRU` | `tru_valera` | `tru_trujillo` | Corto | Pampanito `[REQUIERE_VALIDACION_CAMPO]` | ~34 km | `0h 45m - 1h 15m` | `[VERIFICADO]` |
| `VLR-BRM` | `tru_valera` | `lar_barquisimeto` | Regional | Carora `[REQUIERE_VALIDACION_CAMPO]` | ~215 km | `3h 30m - 4h 30m` | `[VERIFICADO]` |
| `VLR-CCS` | `tru_valera` | `ccs_la_bandera` | Estatal | Carora, Barquisimeto, Valencia `[REQUIERE_VALIDACION_CAMPO]` | ~565 km | `8h 30m - 10h 30m` | `[VERIFICADO]` |

---

### 3.23 Estado Yaracuy
Total documentado verificado: 2 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `yar_san_felipe` | Terminal de Pasajeros de San Felipe | Público | San Felipe / Independencia | `TBD_GEOCODE` | `[VERIFICADO]` |
| `yar_chivacoa` | Terminal Municipal de Chivacoa | Público | Chivacoa / Bruzual | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `SNF-BRM` | `yar_san_felipe` | `lar_barquisimeto` | Corto | Chivacoa, Yaritagua `[REQUIERE_VALIDACION_CAMPO]` | ~85 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |
| `SNF-VAL` | `yar_san_felipe` | `car_big_low` | Regional | Morón, El Palito `[REQUIERE_VALIDACION_CAMPO]` | ~108 km | `1h 45m - 2h 30m` | `[VERIFICADO]` |

---

### 3.24 Estado Zulia
Total documentado verificado: 6 (sujeto a censo municipal de terminales menores/privados).

| `terminal_code` | Nombre Oficial | Tipo | Ciudad / Municipio | Coordenadas (`lat, lon`) | Estado |
|---|---|---|---|---|---|
| `zul_maracaibo_central` | Gran Terminal de Pasajeros de Maracaibo | Público | Maracaibo / Maracaibo | `10.6355, -71.6198` | `[VERIFICADO]` |
| `zul_simon_bolivar` | Terminal Terrestre Simón Bolívar (San Francisco) | Público | San Francisco / San Francisco | `TBD_GEOCODE` | `[VERIFICADO]` |
| `zul_ciudad_ojeda` | Terminal de Pasajeros de Ciudad Ojeda | Público | Ciudad Ojeda / Lagunillas | `TBD_GEOCODE` | `[VERIFICADO]` |
| `zul_santa_barbara` | Terminal de Pasajeros de Santa Bárbara del Zulia | Público | Santa Bárbara / Colón | `TBD_GEOCODE` | `[VERIFICADO]` |
| `zul_cabimas` | Terminal de Pasajeros de Cabimas | Público | Cabimas / Cabimas | `TBD_GEOCODE` | `[REQUIERE_VALIDACION_CAMPO]` |
| `zul_paraguachon` | Punto de Control y Enlace Fronterizo Paraguachón | Intermodal / Frontera | Paraguachón / Guajira | `TBD_GEOCODE` | `[VERIFICADO]` |

| `route_code` | Origen | Destino | Categoría | Paradas de Descanso / Intermedios | Distancia aprox. | Duración estimada | Estado |
|---|---|---|---|---|---|---|---|
| `MCB-OJE` | `zul_maracaibo_central` | `zul_ciudad_ojeda` | Corto | Puente Rafael Urdaneta, Cabimas `[REQUIERE_VALIDACION_CAMPO]` | ~68 km | `1h 15m - 1h 45m` | `[VERIFICADO]` |
| `MCB-COR` | `zul_maracaibo_central` | `fal_coro` | Estatal | Mene Mauroa, Dabajuro `[REQUIERE_VALIDACION_CAMPO]` | ~255 km | `4h 00m - 5h 00m` | `[VERIFICADO]` |
| `MCB-MAI` | `zul_maracaibo_central` | `col_maicao_terminal` | Internacional | Paraguachón (transbordo guajiro) | ~125 km | `2h 30m - 4h 00m` | `[VERIFICADO]` |

---

### 3.25 Nodos de Transbordo Internacional (Referencia Externa)
| `terminal_code` | Nombre Oficial | País | Ciudad | Estado |
|---|---|---|---|---|
| `col_cucuta_terminal` | Terminal de Transportes de Cúcuta | Colombia | Cúcuta | `[VERIFICADO]` |
| `col_maicao_terminal` | Terminal de Transportes de Maicao | Colombia | Maicao | `[VERIFICADO]` |
| `bra_pacaraima_enlace` | Terminal / Parada de Pacaraima | Brasil | Pacaraima | `[VERIFICADO]` |

---

## 4. Anexo de Preparación para PostGIS (`SRID 4326`)

Para extender el esquema existente en `db/01_schema.sql` y `db/03_extended_schema.sql` sin romper relaciones ni consultas vigentes de `Go Gateway`:

1. **Columna `terminal_code` en `terminals`:**
   ```sql
   ALTER TABLE terminals
       ADD COLUMN IF NOT EXISTS terminal_code VARCHAR(64) UNIQUE,
       ADD COLUMN IF NOT EXISTS terminal_type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'
           CHECK (terminal_type IN ('PUBLIC', 'PRIVATE', 'INTERMODAL'));
   ```
   * Las coordenadas verificadas se insertan con `ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography`.
   * Los terminales marcados como `TBD_GEOCODE` insertan `location = NULL` hasta completar la geocodificación en campo.

2. **Trazado geoespacial en `routes` y `route_waypoints`:**
   ```sql
   ALTER TABLE routes
       ADD COLUMN IF NOT EXISTS route_geometry GEOGRAPHY(LINESTRING, 4326),
       ADD COLUMN IF NOT EXISTS service_category VARCHAR(20) NOT NULL DEFAULT 'REGIONAL'
           CHECK (service_category IN ('SHORT', 'REGIONAL', 'INTERSTATE', 'INTERNATIONAL'));
   ```
   * Para rutas que ya tienen origen y destino geocodificados se genera inicialmente una polilínea base `ST_MakeLine(orig.location::geometry, dest.location::geometry)::geography` y posteriormente se reemplaza con trazados viales reales o waypoints de paradas de descanso (`rest_stop`).
   * En el API de detalle (`GET /api/v1/trips/{trip_id}/details`), PostGIS expone el trazado directamente con `ST_AsGeoJSON(route_geometry)` para consumo inmediato de Leaflet (Web) y `react-native-maps` / MapLibre (Mobile).
