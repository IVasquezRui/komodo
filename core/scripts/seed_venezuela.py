#!/usr/bin/env python3
"""
Komodo — Idempotent Seed Script for Venezuela Terminals, Routes, Operators & Fleets.

Implements:
- 24 Federal Entities of Venezuela (23 states + Distrito Capital) + 3 international border nodes
- Realistic bus operators mapped from Docs/Prompts-&-Data/Flota de Autobuses en Venezuela.md
- Distance-appropriate fleet models (Encava, Marcopolo, Busscar, Yutong, Iveco, Irizar, Bolivariano, Copetran, Eucatur)
- Guaranteed >= 8 buses/departures per state-to-state route
- Strict idempotency using deterministic UUIDv5 + ON CONFLICT DO NOTHING
"""

import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import asyncpg

NAMESPACE_KOMODO = uuid.UUID("7f3c8b2e-9a41-4c7e-8b5a-1d2e3f4a5b6c")


def det_uuid(kind: str, code: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE_KOMODO, f"{kind}:{code}")


# ---------------------------------------------------------------------------
# 1. Terminals across all 24 Federal Entities + Private Hubs + Border Nodes
# ---------------------------------------------------------------------------
TERMINALS = [
    # Distrito Capital
    ("ccs_la_bandera", "Terminal de Pasajeros de La Bandera", "Caracas", "Distrito Capital", "VEN", "PUBLIC", "Av. Nueva Granada, Caracas", 10.4767, -66.8993),
    ("ccs_nuevo_circo", "Terminal Urbano de Nuevo Circo", "Caracas", "Distrito Capital", "VEN", "PUBLIC", "Av. Bolívar, Nuevo Circo, Caracas", None, None),
    ("ccs_prados_maria", "Terminal Privado Expresos Occidente (Prados de María)", "Caracas", "Distrito Capital", "VEN", "PRIVATE", "Prados de María / El Cementerio, Caracas", None, None),
    # Miranda (Metropolitana + Interior)
    ("mir_terminal_oriente", "Terminal de Oriente Antonio José de Sucre", "Caracas", "Miranda", "VEN", "PUBLIC", "Km 1 Autopista Caracas-Guarenas, Municipio Sucre", 10.4820, -66.8040),
    ("mir_bello_campo", "Terminal Privado Aeroexpresos Ejecutivos (Bello Campo)", "Caracas", "Miranda", "VEN", "PRIVATE", "Av. Principal de Bello Campo, Chacao", None, None),
    ("mir_los_dos_caminos", "Terminal Privado Expresos Flamingo (Los Dos Caminos)", "Caracas", "Miranda", "VEN", "PRIVATE", "Av. Francisco de Miranda, Los Dos Caminos", None, None),
    ("mir_los_teques", "Terminal de Pasajeros Los Lagos (Los Teques)", "Los Teques", "Miranda", "VEN", "PUBLIC", "Los Lagos, Los Teques", None, None),
    # Aragua
    ("ara_maracay_central", "Terminal Central de Pasajeros de Maracay", "Maracay", "Aragua", "VEN", "PUBLIC", "Av. Fuerzas Aéreas, Maracay", None, None),
    # Carabobo
    ("car_big_low", "Terminal de Pasajeros Big Low Center", "Valencia", "Carabobo", "VEN", "PUBLIC", "Autopista Regional del Centro, San Diego", 10.1928, -67.9667),
    ("car_puerto_cabello", "Terminal Juan José Flores (Puerto Cabello)", "Puerto Cabello", "Carabobo", "VEN", "PUBLIC", "Av. La Paz, Puerto Cabello", None, None),
    # La Guaira
    ("lag_la_guaira", "Terminal de Pasajeros de La Guaira", "La Guaira", "La Guaira", "VEN", "PUBLIC", "Av. Soublette, La Guaira", None, None),
    # Lara
    ("lar_barquisimeto", "Terminal de Pasajeros de Barquisimeto", "Barquisimeto", "Lara", "VEN", "PUBLIC", "Carrera 25 con Calle 43, Barquisimeto", 10.0691, -69.3341),
    # Yaracuy
    ("yar_san_felipe", "Terminal de Pasajeros de San Felipe", "San Felipe", "Yaracuy", "VEN", "PUBLIC", "Av. Libertador, San Felipe", None, None),
    # Falcón
    ("fal_coro", "Terminal de Pasajeros Polica Salas (Coro)", "Coro", "Falcón", "VEN", "PUBLIC", "Variante Norte, Santa Ana de Coro", None, None),
    ("fal_punto_fijo", "Terminal de Pasajeros Alí Primera (Punto Fijo)", "Punto Fijo", "Falcón", "VEN", "PUBLIC", "Av. Ollarvides, Punto Fijo", None, None),
    # Zulia
    ("zul_maracaibo_central", "Gran Terminal de Pasajeros de Maracaibo", "Maracaibo", "Zulia", "VEN", "PUBLIC", "Av. 15 Delicias, Maracaibo", 10.6355, -71.6198),
    ("zul_ciudad_ojeda", "Terminal de Pasajeros de Ciudad Ojeda", "Ciudad Ojeda", "Zulia", "VEN", "PUBLIC", "Av. Intercomunal, Ciudad Ojeda", None, None),
    # Táchira
    ("tac_la_concordia", "Terminal de Pasajeros Genaro Méndez (La Concordia)", "San Cristóbal", "Táchira", "VEN", "PUBLIC", "Carrera 4 con Calle 3, La Concordia", 7.7430, -72.2255),
    ("tac_san_antonio", "Terminal de Pasajeros de San Antonio del Táchira", "San Antonio del Táchira", "Táchira", "VEN", "INTERMODAL", "Av. Venezuela, San Antonio", None, None),
    # Mérida
    ("mer_jose_antonio_paredes", "Terminal de Pasajeros José Antonio Paredes", "Mérida", "Mérida", "VEN", "PUBLIC", "Av. Las Américas, Mérida", 8.5863, -71.1686),
    ("mer_el_vigia", "Terminal Terrestre Abelardo Parra León (El Vigía)", "El Vigía", "Mérida", "VEN", "PUBLIC", "Av. Bolívar, El Vigía", None, None),
    # Trujillo
    ("tru_valera", "Terminal de Pasajeros de Valera (Plata III)", "Valera", "Trujillo", "VEN", "PUBLIC", "Sector Plata III, Valera", None, None),
    ("tru_trujillo", "Terminal Valle de los Mukas", "Trujillo", "Trujillo", "VEN", "PUBLIC", "Av. Laudelino Mejías, Trujillo", None, None),
    # Barinas
    ("bar_barinas", "Terminal Nuestra Señora del Pilar (Barinas)", "Barinas", "Barinas", "VEN", "PUBLIC", "Av. Agustín Codazzi, Barinas", None, None),
    # Portuguesa
    ("por_acarigua", "Terminal de Pasajeros de Acarigua (COMTER)", "Acarigua", "Portuguesa", "VEN", "PUBLIC", "Av. Páez, Acarigua", None, None),
    ("por_guanare", "Terminal de Pasajeros de Guanare", "Guanare", "Portuguesa", "VEN", "PUBLIC", "Av. Unda, Guanare", None, None),
    # Cojedes
    ("coj_san_carlos", "Terminal de Pasajeros de San Carlos", "San Carlos", "Cojedes", "VEN", "PUBLIC", "Av. José Laurencio Silva, San Carlos", None, None),
    # Guárico
    ("gua_san_juan_morros", "Terminal de San Juan de los Morros", "San Juan de los Morros", "Guárico", "VEN", "PUBLIC", "Av. Bolívar, San Juan de los Morros", None, None),
    ("gua_calabozo", "Terminal de Pasajeros de Calabozo", "Calabozo", "Guárico", "VEN", "PUBLIC", "Carrera 12, Calabozo", None, None),
    ("gua_valle_pascua", "Terminal de Valle de la Pascua", "Valle de la Pascua", "Guárico", "VEN", "PUBLIC", "Av. Rómulo Gallegos, Valle de la Pascua", None, None),
    # Apure
    ("apu_san_fernando", "Terminal Humberto Hernández (San Fernando)", "San Fernando de Apure", "Apure", "VEN", "PUBLIC", "Av. Carabobo, San Fernando de Apure", None, None),
    # Amazonas
    ("ama_puerto_ayacucho", "Terminal de Pasajeros de Puerto Ayacucho", "Puerto Ayacucho", "Amazonas", "VEN", "PUBLIC", "Av. Orinoco, Puerto Ayacucho", None, None),
    # Anzoátegui
    ("anz_puerto_la_cruz", "Terminal de Pasajeros de Puerto La Cruz", "Puerto La Cruz", "Anzoátegui", "VEN", "PUBLIC", "Av. Municipal, Puerto La Cruz", 10.2174, -64.6348),
    # Sucre
    ("suc_cumana", "Terminal de Pasajeros de Cumaná", "Cumaná", "Sucre", "VEN", "PUBLIC", "Av. Las Palomas con Perimetral, Cumaná", None, None),
    ("suc_carupano", "Terminal José Francisco Bermúdez (Carúpano)", "Carúpano", "Sucre", "VEN", "PUBLIC", "Av. Perimetral, Carúpano", None, None),
    # Monagas
    ("mon_maturin", "Terminal Interurbano de Maturín", "Maturín", "Monagas", "VEN", "PUBLIC", "Av. Libertador, Sector La Muralla, Maturín", None, None),
    # Delta Amacuro
    ("del_tucupita", "Terminal Fluvial y Terrestre de Tucupita", "Tucupita", "Delta Amacuro", "VEN", "INTERMODAL", "Paseo Manamo, Tucupita", None, None),
    # Bolívar
    ("bol_manuel_piar", "Terminal Manuel Carlos Piar (Puerto Ordaz)", "Ciudad Guayana", "Bolívar", "VEN", "PUBLIC", "Prolongación Av. Guayana, Alta Vista", 8.2881, -62.7469),
    ("bol_tomas_heres", "Terminal Tomás de Heres (Ciudad Bolívar)", "Ciudad Bolívar", "Bolívar", "VEN", "PUBLIC", "Av. República, Ciudad Bolívar", None, None),
    ("bol_santa_elena", "Terminal Internacional de Santa Elena de Uairén", "Santa Elena de Uairén", "Bolívar", "VEN", "INTERMODAL", "Av. Perimetral, Santa Elena de Uairén", None, None),
    # Nueva Esparta
    ("nes_porlamar", "Terminal de Pasajeros de Porlamar (Achipano)", "Porlamar", "Nueva Esparta", "VEN", "PUBLIC", "Sector Achipano, Porlamar", None, None),
    ("nes_punta_piedras", "Terminal Multimodal de Punta de Piedras", "Punta de Piedras", "Nueva Esparta", "VEN", "INTERMODAL", "Muelle Conferry / Punta de Piedras", None, None),
    # International Border Transfer Hubs
    ("col_cucuta_terminal", "Terminal de Transportes de Cúcuta (Transbordo)", "Cúcuta", "Norte de Santander", "COL", "INTERMODAL", "Av. 7 #0N, Cúcuta, Colombia", 7.8986, -72.5094),
    ("col_maicao_terminal", "Terminal de Transportes de Maicao (Transbordo)", "Maicao", "La Guajira", "COL", "INTERMODAL", "Troncal del Caribe, Maicao, Colombia", None, None),
    ("bra_pacaraima_enlace", "Terminal Rodoviário de Pacaraima (Transbordo)", "Pacaraima", "Roraima", "BRA", "INTERMODAL", "BR-174, Pacaraima, Roraima, Brasil", None, None),
]


# ---------------------------------------------------------------------------
# 2. Venezuelan & Cross-Border Bus Operators (from research doc)
# ---------------------------------------------------------------------------
OPERATORS = [
    ("aeroexpresos_ejecutivos", "Aeroexpresos Ejecutivos C.A.", "Aeroexpresos Ejecutivos C.A.", "BUSCAMA_VIP", "mir_bello_campo"),
    ("expresos_occidente", "Expresos Occidente", "Expresos Occidente C.A.", "BUSCAMA_VIP", "ccs_prados_maria"),
    ("expresos_los_llanos", "Expresos Los Llanos", "Expresos Los Llanos C.A.", "BUSCAMA_VIP", "ccs_la_bandera"),
    ("expresos_flamingo", "Expresos Flamingo", "Expresos Flamingo C.A.", "BUSCAMA_VIP", "mir_los_dos_caminos"),
    ("rodovias_venezuela", "Rodovías de Venezuela", "Rodovías de Venezuela C.A.", "EXECUTIVE", "mir_terminal_oriente"),
    ("expresos_merida", "Expresos Mérida", "Expresos Mérida C.A.", "EXECUTIVE", "mer_jose_antonio_paredes"),
    ("expresos_san_cristobal", "Expresos San Cristóbal", "Expresos San Cristóbal C.A.", "BUSCAMA_VIP", "tac_la_concordia"),
    ("expresos_camargui", "Expresos Camargüí", "Expresos Camargüí C.A.", "STANDARD", "ccs_la_bandera"),
    ("linea_los_andes", "Línea de los Andes", "Línea de los Andes C.A.", "STANDARD", "tac_la_concordia"),
    ("bus_ven", "Bus-Ven", "Bus-Ven Transporte Extraurbano C.A.", "EXECUTIVE", "ccs_la_bandera"),
    ("servicios_especiales_centro", "Servicios Especiales del Centro", "Servicios Especiales del Centro C.A.", "STANDARD", "car_big_low"),
    ("coop_transporte_regional", "Cooperativa Regional Unido", "Cooperativa Transporte Regional Unido", "STANDARD", "ara_maracay_central"),
    ("sitssa", "SITSSA (Estatal)", "Sistema Integral de Transporte Superficial S.A.", "STATE", "ccs_la_bandera"),
    ("expreso_bolivariano", "Expreso Bolivariano (CO)", "Expreso Bolivariano S.A.", "BUSCAMA_VIP", "col_cucuta_terminal"),
    ("copetran", "Copetran (CO)", "Cooperativa Santandereana de Transportadores", "EXECUTIVE", "col_cucuta_terminal"),
    ("eucatur_amatur", "Eucatur / Amatur (BR)", "Empresa União Cascavel / Amatur Turismo", "STANDARD", "bra_pacaraima_enlace"),
]


# ---------------------------------------------------------------------------
# 3. Canonical Fleet Models (grounded in Flota de Autobuses en Venezuela.md)
# ---------------------------------------------------------------------------
def build_layout(model_code: str, brand: str, model_name: str, decks: int, capacity: int, amenities: dict) -> dict:
    if decks == 2:
        p1_rows = [
            {"row": 1, "cells": ["DOOR_FRONT", "DRIVER", "AISLE", "STAIRS_UP"]},
            {"row": 2, "cells": [{"seat": 1, "type": "VIP"}, {"seat": 2, "type": "VIP"}, "AISLE", {"seat": 3, "type": "VIP"}]},
            {"row": 3, "cells": [{"seat": 4, "type": "VIP"}, {"seat": 5, "type": "VIP"}, "AISLE", {"seat": 6, "type": "VIP"}]},
            {"row": 4, "cells": [{"seat": 7, "type": "VIP"}, {"seat": 8, "type": "VIP"}, "AISLE", {"seat": 9, "type": "VIP"}]},
            {"row": 5, "cells": [{"seat": 10, "type": "VIP"}, {"seat": 11, "type": "VIP"}, "AISLE", {"seat": 12, "type": "VIP"}]},
            {"row": 6, "cells": ["BATHROOM", "EMPTY", "AISLE", "SERVICE_PANTRY"]},
        ]
        p2_count = capacity - 12
        p2_rows = []
        seat_num = 13
        row_idx = 1
        while seat_num <= capacity:
            row_cells = []
            for _ in range(2):
                if seat_num <= capacity:
                    row_cells.append({"seat": seat_num, "type": "PREMIUM" if seat_num <= 20 else "STANDARD"})
                    seat_num += 1
                else:
                    row_cells.append("EMPTY")
            row_cells.append("AISLE")
            for _ in range(2):
                if seat_num <= capacity:
                    row_cells.append({"seat": seat_num, "type": "PREMIUM" if seat_num <= 20 else "STANDARD"})
                    seat_num += 1
                else:
                    row_cells.append("EMPTY")
            p2_rows.append({"row": row_idx, "cells": row_cells})
            row_idx += 1
        return {
            "schema_version": "1.0.0",
            "model_code": model_code,
            "brand": brand,
            "model_name": model_name,
            "total_capacity": capacity,
            "decks_count": 2,
            "amenities": amenities,
            "decks": [
                {"deck_number": 1, "label": "Piso 1 - VIP Buscama", "layout_type": "2+1", "columns": ["A", "B", "AISLE", "C"], "rows": p1_rows},
                {"deck_number": 2, "label": "Piso 2 - Panorámico", "layout_type": "2+2", "columns": ["A", "B", "AISLE", "C", "D"], "rows": p2_rows},
            ],
        }

    # Single deck layout
    rows = [{"row": 0, "cells": ["DRIVER", "EMPTY", "AISLE", "CO_PILOT", "DOOR_FRONT"]}]
    seat_num = 1
    row_idx = 1
    while seat_num <= capacity:
        row_cells = []
        for _ in range(2):
            if seat_num <= capacity:
                row_cells.append({"seat": seat_num, "type": "PREMIUM" if seat_num <= 4 else "STANDARD"})
                seat_num += 1
            else:
                row_cells.append("EMPTY")
        row_cells.append("AISLE")
        for _ in range(2):
            if seat_num <= capacity:
                row_cells.append({"seat": seat_num, "type": "PREMIUM" if seat_num <= 4 else "STANDARD"})
                seat_num += 1
            else:
                row_cells.append("EMPTY")
        rows.append({"row": row_idx, "cells": row_cells})
        row_idx += 1

    if amenities.get("bath"):
        rows.append({"row": row_idx, "cells": ["EMPTY", "EMPTY", "AISLE", "BATHROOM", "EMPTY"]})

    return {
        "schema_version": "1.0.0",
        "model_code": model_code,
        "brand": brand,
        "model_name": model_name,
        "total_capacity": capacity,
        "decks_count": 1,
        "amenities": amenities,
        "decks": [
            {"deck_number": 1, "label": "Salón Principal", "layout_type": "2+2", "columns": ["A", "B", "AISLE", "C", "D"], "rows": rows},
        ],
    }


FLEET_CATALOG = {
    # Short routes
    "encava_ent_610": ("Encava", "Encava ENT-610 (32p)", 1, 32, {"wifi": False, "ac": False, "bath": False, "usb": False}),
    "encava_ent_900": ("Encava", "Encava ENT-900 (27p)", 1, 27, {"wifi": False, "ac": False, "bath": False, "usb": False}),
    "encava_e_van_toano": ("Encava", "Encava E-Van Toano Ejecutivo", 1, 18, {"wifi": True, "ac": True, "bath": False, "usb": True}),
    "iveco_daily_70c16": ("Iveco", "Iveco Daily 70c16 Borota", 1, 24, {"wifi": False, "ac": False, "bath": False, "usb": False}),
    "yutong_zk6896hga": ("Yutong", "Yutong ZK6896HGA Estatal", 1, 30, {"wifi": False, "ac": True, "bath": False, "usb": False}),
    # Regional routes
    "encava_ent_3300": ("Encava", "Encava ENT-3300 Cummins", 1, 43, {"wifi": False, "ac": False, "bath": False, "usb": False}),
    "encava_ent_3200": ("Encava", "Encava ENT-3200 Regional", 1, 43, {"wifi": False, "ac": False, "bath": False, "usb": False}),
    "yutong_zk6118hga": ("Yutong", "Yutong ZK6118HGA Interurbano", 1, 41, {"wifi": False, "ac": True, "bath": False, "usb": False}),
    "marcopolo_viaggio_gv1000": ("Marcopolo", "Marcopolo Viaggio GV1000 (Volvo B10M)", 1, 44, {"wifi": False, "ac": True, "bath": True, "usb": False}),
    # Long distance / Interstate
    "marcopolo_paradiso_g6_1800dd": ("Marcopolo", "Marcopolo Paradiso G6 1800 DD", 2, 56, {"wifi": False, "ac": True, "bath": True, "usb": True, "buscama": True}),
    "marcopolo_paradiso_gv1800dd": ("Marcopolo", "Marcopolo Paradiso GV1800 DD", 2, 54, {"wifi": False, "ac": True, "bath": True, "usb": False, "buscama": True}),
    "busscar_panoramico_dd": ("Busscar", "Busscar Panorâmico DD (Scania/Volvo)", 2, 56, {"wifi": False, "ac": True, "bath": True, "usb": True, "buscama": True}),
    "marcopolo_paradiso_gv1450": ("Marcopolo", "Marcopolo Paradiso GV1450 (MB O-400RSD)", 1, 44, {"wifi": False, "ac": True, "bath": True, "usb": False}),
    "busscar_jumbuss_380": ("Busscar", "Busscar JumBuss 380", 1, 44, {"wifi": False, "ac": True, "bath": True, "usb": False}),
    "irizar_i8_exec": ("Irizar", "Irizar i8 Ejecutivo", 1, 44, {"wifi": True, "ac": True, "bath": True, "usb": True}),
    "encava_ent_6100_ar": ("Encava", "Encava ENT-6100 AR (Cummins 335HP)", 1, 49, {"wifi": False, "ac": True, "bath": True, "usb": False}),
    "yutong_zk6122h9": ("Yutong", "Yutong ZK6122H9 Carretero", 1, 45, {"wifi": False, "ac": True, "bath": True, "usb": True}),
    "yutong_zk6129h": ("Yutong", "Yutong ZK6129H Executive", 1, 45, {"wifi": False, "ac": True, "bath": True, "usb": True}),
    "yutong_zk6146h": ("Yutong", "Yutong ZK6146H Expreso", 1, 49, {"wifi": False, "ac": True, "bath": True, "usb": True}),
    # International Border Transfer
    "bolivariano_duobus_dd": ("Marcopolo", "Marcopolo DuoBus DD (Expreso Bolivariano)", 2, 56, {"wifi": True, "ac": True, "bath": True, "usb": True}),
    "copetran_preferencial": ("Marcopolo", "Autocar Preferencial 2 Baños (Copetran)", 1, 38, {"wifi": True, "ac": True, "bath": True, "usb": True}),
    "eucatur_rodoviario": ("Marcopolo", "Autocar Rodoviário (Eucatur/Amatur)", 1, 44, {"wifi": False, "ac": True, "bath": True, "usb": True}),
}


# 8 distinct operator+model slots per route category (guarantees >= 8 buses/departures per interstate route & realistic assignment)
CATEGORY_SLOTS = {
    "SHORT": [
        ("coop_transporte_regional", "encava_ent_610", 0),
        ("servicios_especiales_centro", "encava_ent_610", 0),
        ("coop_transporte_regional", "encava_ent_900", 0),
        ("sitssa", "yutong_zk6896hga", 0),
        ("servicios_especiales_centro", "iveco_daily_70c16", 0),
        ("coop_transporte_regional", "encava_ent_610", 100),
        ("sitssa", "yutong_zk6896hga", 0),
        ("servicios_especiales_centro", "encava_e_van_toano", 300),
    ],
    "REGIONAL": [
        ("servicios_especiales_centro", "encava_ent_3300", 0),
        ("coop_transporte_regional", "encava_ent_610", -100),
        ("sitssa", "yutong_zk6118hga", -200),
        ("aeroexpresos_ejecutivos", "marcopolo_viaggio_gv1000", 600),
        ("servicios_especiales_centro", "encava_ent_3200", 0),
        ("sitssa", "yutong_zk6122h9", -100),
        ("aeroexpresos_ejecutivos", "marcopolo_paradiso_g6_1800dd", 900),
        ("coop_transporte_regional", "encava_ent_6100_ar", 200),
    ],
    "INTERSTATE": [
        ("aeroexpresos_ejecutivos", "marcopolo_paradiso_g6_1800dd", 1500),
        ("expresos_occidente", "marcopolo_paradiso_gv1800dd", 1000),
        ("expresos_los_llanos", "marcopolo_paradiso_g6_1800dd", 1200),
        ("expresos_flamingo", "marcopolo_paradiso_gv1450", 800),
        ("rodovias_venezuela", "busscar_panoramico_dd", 1400),
        ("sitssa", "yutong_zk6122h9", -500),
        ("sitssa", "yutong_zk6146h", -400),
        ("expresos_camargui", "encava_ent_6100_ar", 0),
        ("bus_ven", "encava_ent_3300", -200),
        ("expresos_san_cristobal", "busscar_jumbuss_380", 600),
    ],
    "INTERNATIONAL": [
        ("expresos_occidente", "marcopolo_paradiso_g6_1800dd", 500),
        ("expresos_los_llanos", "marcopolo_paradiso_gv1450", 300),
        ("bus_ven", "encava_ent_6100_ar", 0),
        ("linea_los_andes", "encava_ent_3300", -200),
        ("expreso_bolivariano", "bolivariano_duobus_dd", 1200),
        ("copetran", "copetran_preferencial", 900),
        ("eucatur_amatur", "eucatur_rodoviario", 600),
        ("sitssa", "yutong_zk6129h", -300),
    ],
}


# ---------------------------------------------------------------------------
# 4. Routes covering all 24 Federal Entities + Distance Categories + Rest Stops
# ---------------------------------------------------------------------------
ROUTES = [
    # SHORT (< 120 km)
    ("CCS-MCY", "ccs_la_bandera", "ara_maracay_central", 109, 2.25, 5.00, "SHORT", "Peaje Tazón"),
    ("MCY-VAL", "ara_maracay_central", "car_big_low", 52, 1.25, 4.00, "SHORT", "Parada San Joaquín"),
    ("LGU-CCS", "lag_la_guaira", "ccs_nuevo_circo", 32, 1.00, 3.00, "SHORT", "Autopista Ccs-La Guaira"),
    ("LTQ-MCY", "mir_los_teques", "ara_maracay_central", 73, 1.75, 5.00, "SHORT", "Las Tejerías"),
    ("VAL-PBL", "car_big_low", "car_puerto_cabello", 55, 1.25, 4.00, "SHORT", "Trincheras"),
    ("ACA-BRM", "por_acarigua", "lar_barquisimeto", 75, 1.50, 5.00, "SHORT", "Sarare"),
    ("BRM-SNF", "lar_barquisimeto", "yar_san_felipe", 85, 1.50, 5.00, "SHORT", "Chivacoa"),
    ("COR-PFJ", "fal_coro", "fal_punto_fijo", 92, 1.50, 6.00, "SHORT", "Istmo Médanos"),
    ("VLR-TRU", "tru_valera", "tru_trujillo", 34, 1.00, 3.50, "SHORT", "Pampanito"),
    ("MER-VIG", "mer_jose_antonio_paredes", "mer_el_vigia", 75, 1.75, 5.00, "SHORT", "Estanques"),
    ("PLC-CUM", "anz_puerto_la_cruz", "suc_cumana", 82, 1.75, 6.00, "SHORT", "Mirador Mochima"),
    ("MCB-OJE", "zul_maracaibo_central", "zul_ciudad_ojeda", 68, 1.50, 5.00, "SHORT", "Cabimas"),
    ("SCR-SAT", "tac_la_concordia", "tac_san_antonio", 45, 1.25, 4.00, "SHORT", "Peracal"),
    ("POR-PTP", "nes_porlamar", "nes_punta_piedras", 32, 0.75, 3.00, "SHORT", "San Juan"),
    # REGIONAL (120 - 300 km)
    ("CCS-VAL", "ccs_la_bandera", "car_big_low", 160, 3.00, 8.00, "REGIONAL", "Parador La Cabrera"),
    ("LTQ-VAL", "mir_los_teques", "car_big_low", 124, 2.50, 7.00, "REGIONAL", "Maracay"),
    ("VAL-BRM", "car_big_low", "lar_barquisimeto", 186, 3.50, 10.00, "REGIONAL", "Parador Chivacoa"),
    ("SNF-VAL", "yar_san_felipe", "car_big_low", 108, 2.00, 7.00, "REGIONAL", "Morón"),
    ("SJM-CCS", "gua_san_juan_morros", "ccs_la_bandera", 140, 2.50, 7.00, "REGIONAL", "Villa de Cura"),
    ("CAL-SJM", "gua_calabozo", "gua_san_juan_morros", 145, 2.50, 8.00, "REGIONAL", "Dos Caminos"),
    ("SFA-CAL", "apu_san_fernando", "gua_calabozo", 130, 2.25, 8.00, "REGIONAL", "Camaguán"),
    ("SNC-VAL", "coj_san_carlos", "car_big_low", 102, 1.75, 6.00, "REGIONAL", "Tinaquillo"),
    ("BAR-GUA", "bar_barinas", "por_guanare", 95, 1.75, 6.00, "REGIONAL", "Boconoíto"),
    ("BAR-MER", "bar_barinas", "mer_jose_antonio_paredes", 165, 4.00, 12.00, "REGIONAL", "Santo Domingo"),
    ("PLC-MAT", "anz_puerto_la_cruz", "mon_maturin", 210, 3.50, 12.00, "REGIONAL", "Punta de Mata"),
    ("MAT-PZO", "mon_maturin", "bol_manuel_piar", 210, 3.50, 13.00, "REGIONAL", "Temblador"),
    ("MAT-CAR", "mon_maturin", "suc_carupano", 165, 3.00, 11.00, "REGIONAL", "Casanay"),
    ("CUM-CAR", "suc_cumana", "suc_carupano", 135, 2.75, 9.00, "REGIONAL", "Cariaco"),
    ("TUC-MAT", "del_tucupita", "mon_maturin", 175, 3.25, 12.00, "REGIONAL", "Temblador"),
    ("PZO-CBL", "bol_manuel_piar", "bol_tomas_heres", 105, 1.75, 7.00, "REGIONAL", "Peaje Bolívar"),
    ("MER-SCR", "mer_jose_antonio_paredes", "tac_la_concordia", 255, 5.50, 16.00, "REGIONAL", "La Fría"),
    ("VLR-BRM", "tru_valera", "lar_barquisimeto", 215, 4.00, 14.00, "REGIONAL", "Carora"),
    ("PTP-PLC", "nes_punta_piedras", "anz_puerto_la_cruz", 120, 3.50, 22.00, "REGIONAL", "Enlace Marítimo Guanta"),
    # INTERSTATE (300 - 800+ km)
    ("CCS-BRM", "ccs_la_bandera", "lar_barquisimeto", 360, 5.50, 16.00, "INTERSTATE", "Parador Valencia / Chivacoa"),
    ("CCS-MCB", "ccs_la_bandera", "zul_maracaibo_central", 694, 10.50, 28.00, "INTERSTATE", "Parador Carora"),
    ("VAL-MCB", "car_big_low", "zul_maracaibo_central", 550, 8.00, 24.00, "INTERSTATE", "Parador Carora"),
    ("CCS-SCR", "ccs_la_bandera", "tac_la_concordia", 815, 13.00, 35.00, "INTERSTATE", "Parador Socopó"),
    ("CCS-MER", "ccs_la_bandera", "mer_jose_antonio_paredes", 680, 11.50, 30.00, "INTERSTATE", "Parador Barinas"),
    ("CCS-PLC", "mir_terminal_oriente", "anz_puerto_la_cruz", 320, 4.50, 16.00, "INTERSTATE", "Parador Clarines"),
    ("CCS-PZO", "mir_terminal_oriente", "bol_manuel_piar", 670, 9.00, 28.00, "INTERSTATE", "Parador El Tigre"),
    ("TOR-MAT", "mir_terminal_oriente", "mon_maturin", 515, 7.50, 24.00, "INTERSTATE", "Parador Km 52"),
    ("TOR-CUM", "mir_terminal_oriente", "suc_cumana", 400, 6.00, 20.00, "INTERSTATE", "Parador Puerto La Cruz"),
    ("VAL-SCR", "car_big_low", "tac_la_concordia", 655, 11.00, 32.00, "INTERSTATE", "Parador Barinas"),
    ("BAR-VAL", "bar_barinas", "car_big_low", 345, 5.50, 18.00, "INTERSTATE", "Parador San Carlos"),
    ("SFA-CCS", "apu_san_fernando", "ccs_la_bandera", 410, 7.00, 22.00, "INTERSTATE", "Parador Calabozo"),
    ("GUA-CCS", "por_guanare", "ccs_la_bandera", 430, 7.00, 22.00, "INTERSTATE", "Parador Acarigua"),
    ("VLR-CCS", "tru_valera", "ccs_la_bandera", 565, 9.00, 26.00, "INTERSTATE", "Parador Barquisimeto"),
    ("BRM-MCB", "lar_barquisimeto", "zul_maracaibo_central", 335, 5.50, 18.00, "INTERSTATE", "Parador Carora"),
    ("MER-MCB", "mer_jose_antonio_paredes", "zul_maracaibo_central", 385, 7.00, 22.00, "INTERSTATE", "Parador Caja Seca"),
    ("SCR-MCB", "tac_la_concordia", "zul_maracaibo_central", 470, 9.50, 28.00, "INTERSTATE", "Parador El Vigía"),
    ("COR-VAL", "fal_coro", "car_big_low", 290, 4.75, 16.00, "INTERSTATE", "Parador Tucacas"),
    ("COR-MCB", "fal_coro", "zul_maracaibo_central", 255, 4.25, 15.00, "INTERSTATE", "Parador Dabajuro"),
    ("PLC-PZO", "anz_puerto_la_cruz", "bol_manuel_piar", 385, 5.50, 19.00, "INTERSTATE", "Parador El Tigre"),
    ("PZO-SEU", "bol_manuel_piar", "bol_santa_elena", 615, 10.00, 35.00, "INTERSTATE", "Parador Tumeremo / Km 88"),
    ("PYA-SFA", "ama_puerto_ayacucho", "apu_san_fernando", 390, 8.00, 25.00, "INTERSTATE", "Paso El Burro"),
    ("PYA-CCS", "ama_puerto_ayacucho", "ccs_la_bandera", 750, 13.50, 40.00, "INTERSTATE", "Parador Calabozo"),
    ("VLP-PLC", "gua_valle_pascua", "anz_puerto_la_cruz", 265, 4.50, 15.00, "INTERSTATE", "Parador Zaraza"),
    # INTERNATIONAL (con transbordo fronterizo)
    ("SCR-CUC", "tac_la_concordia", "col_cucuta_terminal", 60, 2.00, 18.00, "INTERNATIONAL", "Aduana San Antonio / Puente Internacional"),
    ("MCB-MAI", "zul_maracaibo_central", "col_maicao_terminal", 125, 3.00, 22.00, "INTERNATIONAL", "Frontera Paraguachón"),
    ("SEU-PAC", "bol_santa_elena", "bra_pacaraima_enlace", 15, 0.75, 12.00, "INTERNATIONAL", "La Línea Migración Brasil"),
]


DEPARTURE_OFFSETS_HOURS = [5.5, 7.5, 9.5, 12.0, 14.5, 17.0, 19.5, 21.5]
DRIVERS = [
    "Carlos Rodríguez", "Pedro Martínez", "Ramón Gómez", "Franklin Mendoza",
    "Carlos Quintero", "José Gregorio Pérez", "Luis Alberto Silva", "Miguel Ángel Torres",
]


def get_database_dsn() -> str:
    dsn = os.getenv("DATABASE_URL_SYNC") or os.getenv("DATABASE_URL")
    if dsn:
        return dsn.replace("postgresql+asyncpg://", "postgresql://")
    user = os.getenv("POSTGRES_USER", "komodo_user")
    password = os.getenv("POSTGRES_PASSWORD", "komodo_secure_password")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "komodo_db")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"


async def ensure_schemas(conn: asyncpg.Connection):
    script_path = Path(__file__).resolve()
    candidates = [script_path.parents[1] / "db", script_path.parents[2] / "db"]
    db_dir = next((p for p in candidates if p.exists()), candidates[0])
    for filename in ["00_extensions.sql", "01_schema.sql", "03_extended_schema.sql", "04_venezuela_operators_schema.sql"]:
        path = db_dir / filename
        if path.exists():
            sql = path.read_text(encoding="utf-8")
            # Avoid failing on duplicate trigger creation if 01_schema already ran
            if filename == "01_schema.sql":
                existing = await conn.fetchval(
                    "SELECT to_regclass('public.terminals') IS NOT NULL"
                )
                if existing:
                    continue
            await conn.execute(sql)


async def seed_all():
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn)
    try:
        await ensure_schemas(conn)

        async with conn.transaction():
            # 1. Seed Users
            await conn.execute(
                """
                INSERT INTO users (id, full_name, phone_number, email, password_hash, role) VALUES
                    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'María García', '+58412-1234567', 'maria@example.com',
                     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'passenger'),
                    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Carlos Rodríguez', '+58414-7654321', 'carlos@example.com',
                     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'driver'),
                    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Admin Sistema', '+58416-0000000', 'admin@komodo.com',
                     '$2b$12$LJ3m5Z1z5z5z5z5z5z5z5uKx9x9x9x9x9x9x9x9x9x9x9x9x9x', 'admin')
                ON CONFLICT (phone_number) DO NOTHING;
                """
            )

            # 2. Seed Terminals (24 Venezuelan Entities + Private Hubs + Border Nodes)
            terminal_ids: dict[str, uuid.UUID] = {}
            terminal_coords: dict[str, tuple[float | None, float | None]] = {}
            for code, name, city, state, country, ttype, addr, lat, lon in TERMINALS:
                tid = det_uuid("terminal", code)
                terminal_ids[code] = tid
                terminal_coords[code] = (lat, lon)
                if lat is not None and lon is not None:
                    await conn.execute(
                        """
                        INSERT INTO terminals (id, terminal_code, name, city, state, country, terminal_type, address, location, timezone)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326)::geography, 'America/Caracas')
                        ON CONFLICT (terminal_code) DO NOTHING
                        """,
                        tid, code, name, city, state, country, ttype, addr, lon, lat,
                    )
                else:
                    await conn.execute(
                        """
                        INSERT INTO terminals (id, terminal_code, name, city, state, country, terminal_type, address, location, timezone)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, 'America/Caracas')
                        ON CONFLICT (terminal_code) DO NOTHING
                        """,
                        tid, code, name, city, state, country, ttype, addr,
                    )

            # 3. Seed Bus Operators
            operator_ids: dict[str, uuid.UUID] = {}
            for op_code, name, legal_name, tier, home_code in OPERATORS:
                oid = det_uuid("operator", op_code)
                operator_ids[op_code] = oid
                home_id = terminal_ids.get(home_code)
                await conn.execute(
                    """
                    INSERT INTO bus_operators (id, operator_code, name, legal_name, service_tier, home_terminal_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (operator_code) DO NOTHING
                    """,
                    oid, op_code, name, legal_name, tier, home_id,
                )

            # 4. Seed Routes, Buses (>= 8 per route, mapped by distance & operator), Trips & Waypoints
            base_day = datetime(2026, 12, 1, 0, 0, tzinfo=timezone.utc)
            bus_counter = 1
            for r_code, orig_code, dest_code, dist_km, hours, base_price_usd, category, rest_name in ROUTES:
                rid = det_uuid("route", r_code)
                orig_id = terminal_ids[orig_code]
                dest_id = terminal_ids[dest_code]
                o_lat, o_lon = terminal_coords[orig_code]
                d_lat, d_lon = terminal_coords[dest_code]
                dur_interval = timedelta(hours=hours)

                if None not in (o_lat, o_lon, d_lat, d_lon):
                    await conn.execute(
                        """
                        INSERT INTO routes (
                            id, origin_terminal_id, destination_terminal_id, route_code,
                            distance_km, estimated_duration, base_price_usd, service_category, route_geometry
                        )
                        VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8,
                            ST_MakeLine(ST_SetSRID(ST_MakePoint($9, $10), 4326), ST_SetSRID(ST_MakePoint($11, $12), 4326))::geography
                        )
                        ON CONFLICT (route_code) DO NOTHING
                        """,
                        rid, orig_id, dest_id, r_code, dist_km, dur_interval, base_price_usd, category,
                        o_lon, o_lat, d_lon, d_lat,
                    )
                else:
                    await conn.execute(
                        """
                        INSERT INTO routes (
                            id, origin_terminal_id, destination_terminal_id, route_code,
                            distance_km, estimated_duration, base_price_usd, service_category
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (route_code) DO NOTHING
                        """,
                        rid, orig_id, dest_id, r_code, dist_km, dur_interval, base_price_usd, category,
                    )

                # Rest stop waypoint
                await conn.execute(
                    """
                    INSERT INTO route_waypoints (id, route_id, sequence_order, waypoint_type, name, stop_duration_m)
                    VALUES ($1, $2, 1, 'REST_STOP', $3, 20)
                    ON CONFLICT (route_id, sequence_order) DO NOTHING
                    """,
                    det_uuid("waypoint", f"{r_code}-rest-1"), rid, rest_name,
                )

                # Assign at least 8 buses + 8 scheduled trips for this route
                slots = CATEGORY_SLOTS[category][:8]
                for idx, (op_code, model_code, delta_cents) in enumerate(slots):
                    brand, model_name, decks, capacity, amenities = FLEET_CATALOG[model_code]
                    plate = f"KMD-{bus_counter:04d}"
                    bus_counter += 1
                    bus_id = det_uuid("bus", f"{r_code}-slot-{idx+1}")
                    op_id = operator_ids[op_code]
                    layout = build_layout(model_code, brand, model_name, decks, capacity, amenities)

                    await conn.execute(
                        """
                        INSERT INTO buses (id, plate, model, brand, decks, amenities, status, operator_id, model_code, capacity, seat_layout)
                        VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'ACTIVE', $7, $8, $9, $10::jsonb)
                        ON CONFLICT (plate) DO NOTHING
                        """,
                        bus_id, plate, model_name, brand, decks, json.dumps(amenities),
                        op_id, model_code, capacity, json.dumps(layout),
                    )

                    trip_code = f"{r_code}-T{idx+1:02d}"
                    trip_id = det_uuid("trip", trip_code)
                    dep_at = base_day + timedelta(hours=DEPARTURE_OFFSETS_HOURS[idx % len(DEPARTURE_OFFSETS_HOURS)])
                    arr_at = dep_at + dur_interval
                    price_cents = max(300, int(round(base_price_usd * 100)) + delta_cents)
                    driver = DRIVERS[idx % len(DRIVERS)]

                    await conn.execute(
                        """
                        INSERT INTO trips (
                            id, trip_code, route_id, bus_id, operator_id, departure_at, arrival_at,
                            bus_plate, driver_name, status, total_seats, available_seats, price_usd_cents
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED', $10, $10, $11)
                        ON CONFLICT (trip_code) DO NOTHING
                        """,
                        trip_id, trip_code, rid, bus_id, op_id, dep_at, arr_at,
                        plate, driver, capacity, price_cents,
                    )

                    # Bulk seed seats idempotently for this trip
                    await conn.execute(
                        """
                        INSERT INTO seats (trip_id, seat_number, deck_number, seat_type, status)
                        SELECT
                            $1::UUID,
                            n,
                            CASE WHEN $3 = 2 AND n > 12 THEN 2 ELSE 1 END,
                            CASE
                                WHEN $3 = 2 AND n <= 12 THEN 'VIP'
                                WHEN n <= 4 THEN 'PREMIUM'
                                ELSE 'STANDARD'
                            END,
                            'AVAILABLE'
                        FROM generate_series(1, $2::INT) AS n
                        ON CONFLICT (trip_id, seat_number) DO NOTHING
                        """,
                        trip_id, capacity, decks,
                    )

            # 5. Seed Segmented Media Assets (4 mandatory collections)
            sample_media = [
                ("ROUTE", "CCS-MCB", "TERMINAL", "https://cdn.komodo.app/media/ccs-la-bandera.webp", "Terminal La Bandera, Caracas", 1),
                ("ROUTE", "CCS-MCB", "BUS", "https://cdn.komodo.app/media/marcopolo-paradiso-g6.webp", "Marcopolo Paradiso G6 1800 DD", 1),
                ("ROUTE", "CCS-MCB", "SCENERY", "https://cdn.komodo.app/media/puente-lago-maracaibo.webp", "Puente Rafael Urdaneta sobre el Lago", 1),
                ("ROUTE", "CCS-MCB", "DESTINATION", "https://cdn.komodo.app/media/maracaibo-centro.webp", "Maracaibo, Estado Zulia", 1),
                ("ROUTE", "CCS-VAL", "TERMINAL", "https://cdn.komodo.app/media/bello-campo-privado.webp", "Terminal Privado Bello Campo", 1),
                ("ROUTE", "CCS-VAL", "BUS", "https://cdn.komodo.app/media/encava-ent-3300.webp", "Encava ENT-3300 Regional", 1),
                ("ROUTE", "CCS-VAL", "SCENERY", "https://cdn.komodo.app/media/tunel-la-cabrera.webp", "Autopista Regional del Centro", 1),
                ("ROUTE", "CCS-VAL", "DESTINATION", "https://cdn.komodo.app/media/valencia-carabobo.webp", "Valencia, Estado Carabobo", 1),
            ]
            for etype, eref, ckind, url, caption, order in sample_media:
                await conn.execute(
                    """
                    INSERT INTO media_assets (id, entity_type, entity_ref, collection_kind, url, thumbnail_url, caption, sort_order)
                    VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
                    ON CONFLICT (entity_type, entity_ref, collection_kind, sort_order) DO NOTHING
                    """,
                    det_uuid("media", f"{etype}:{eref}:{ckind}:{order}"), etype, eref, ckind, url, caption, order,
                )

        # Verification summary
        counts = await conn.fetchrow(
            """
            SELECT
                (SELECT count(*) FROM terminals) AS terminals,
                (SELECT count(DISTINCT state) FROM terminals WHERE country = 'VEN') AS states_covered,
                (SELECT count(*) FROM bus_operators) AS operators,
                (SELECT count(*) FROM routes) AS routes,
                (SELECT count(*) FROM buses) AS buses,
                (SELECT count(*) FROM trips) AS trips,
                (SELECT count(*) FROM seats) AS seats,
                (SELECT COALESCE(MIN(cnt), 0) FROM (
                    SELECT count(tr.id) AS cnt
                    FROM routes r
                    JOIN terminals o ON r.origin_terminal_id = o.id
                    JOIN terminals d ON r.destination_terminal_id = d.id
                    LEFT JOIN trips tr ON tr.route_id = r.id
                    WHERE o.country = 'VEN' AND d.country = 'VEN' AND o.state != d.state
                    GROUP BY r.id
                ) sub) AS min_trips_per_interstate_route
            """
        )
        print(
            f"[seed_venezuela] OK -> terminals={counts['terminals']} "
            f"states_covered={counts['states_covered']} operators={counts['operators']} "
            f"routes={counts['routes']} buses={counts['buses']} trips={counts['trips']} "
            f"seats={counts['seats']} min_interstate_trips={counts['min_trips_per_interstate_route']}"
        )
        if counts["states_covered"] < 24:
            print(f"ERROR: Expected 24 Venezuelan entities covered, got {counts['states_covered']}", file=sys.stderr)
            sys.exit(1)
        if counts["min_trips_per_interstate_route"] < 8:
            print(
                f"ERROR: Expected >= 8 trips per state-to-state route, got {counts['min_trips_per_interstate_route']}",
                file=sys.stderr,
            )
            sys.exit(1)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_all())
