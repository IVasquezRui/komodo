# 🦎 Komodo — Ultra-Resilient Bus Ticket Platform

[![Architecture: Hybrid Shield](https://img.shields.io/badge/Architecture-Hybrid%20Redis%20Shield-2d6a4f.svg)](#architecture)
[![Backend: FastAPI + Go](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Go%20Gin-0284c7.svg)](#services)
[![Database: PostgreSQL + PostGIS](https://img.shields.io/badge/Database-PostGIS%2016-1d3557.svg)](#services)
[![Mobile: React Native Expo](https://img.shields.io/badge/Mobile-Expo%20SDK%20%7C%20Offline--First-4f46e5.svg)](#mobile-client)

Komodo is a bus ticket reservation and issuance platform engineered specifically for **hostile network and hardware environments** (unstable 3G cellular connections, frequent power outages, and budget mobile devices).

---

## Architecture Overview

```
📱 Mobile Client (React Native / Expo — Offline-First SQLite)
       ↓ (Gzip + Minified JSON Keys)
🛡️ Go Gateway (Gin — Redis Shield + High Concurrency)
       ├──▶ ⚡ Redis 7 (Ephemeral Cache < 5ms, Distributed Seat Locks TTL 5m)
       │       ↳ Silent Bypass to PostgreSQL if Redis is offline
       └──▶ ⚙️ FastAPI Core (Python 3.12 — ACID Transactions, Pydantic v2)
               └──▶ 🐘 PostgreSQL 16 + PostGIS (Absolute Source of Truth, WAL fsync=on)
```

### Key Resilience Guarantees

- **Idempotency Keys (`UUID v4`)**: Network retries will never generate duplicate charges or orphan seats.
- **Volatile Redis by Design**: Redis contains **zero persistent data** (`save ""` & `appendonly no`). If restarted, it recovers on demand from PostgreSQL via Cache-Aside.
- **Zero Loss on Power Outages**: PostgreSQL operates with `fsync=on`, `synchronous_commit=on`, and `wal_level=replica`.
- **Silent Failover**: If Redis experiences downtime, the Gateway automatically falls back to PostgreSQL transaction locks without dropping customer purchases.
- **Offline-First Tickets**: Mobile boarding passes with cryptographic QR codes are saved locally in SQLite for presentation without cell reception.

---

## Services & Ports

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Go Gateway** | `8080` | Go 1.23 + Gin + pgxpool | High-throughput gateway, search cache-aside, distributed seat holds |
| **FastAPI Core** | `8000` | Python 3.12 + SQLAlchemy 2.0 | Transactional business logic, ACID ticket purchase |
| **PostgreSQL** | `5432` | PostGIS 16 (Alpine) | Geolocation, relational persistence, WAL durability |
| **Redis** | `6379` | Redis 7 (Alpine) | Ephemeral search cache, seat holding mutex locks |
| **Mobile App** | `8081` | React Native (Expo SDK) | Passenger mobile application (Android & iOS) |

---

## Quick Start (Development)

### 1. Configure Generic Environment Variables
A template with generic development credentials is provided in `.env.example`:
```bash
cp .env.example .env
```

### 2. Start Backend Infrastructure (Docker)
```bash
docker compose up --build
```

Verify service health:
```bash
curl http://localhost:8080/health   # Gateway Health
curl http://localhost:8000/health   # Core Health
```
Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Launch Mobile Application
```bash
cd mobile
npm install
npx expo start
```
- Press `i` to launch in iOS Simulator.
- Press `a` to launch in Android Emulator.
- Scan the terminal QR code with **Expo Go** on a physical mobile device.

---

## Project Structure & Documentation

Detailed project documentation has been organized by development phases inside the [`Docs/`](./Docs) directory:

```
komodo/
├── Docs/
│   ├── RESUMEN_PROYECTO_KOMODO.md         # 📑 Resumen integral detallado de todo el proyecto
│   ├── 00_Arquitectura_y_Diseno/          # Arquitectura maestra y tokens de diseño visual
│   │   ├── komodo_plan.md
│   │   └── DESIGN.md
│   ├── 01_Fase0_Infraestructura/          # Docker Compose, PostGIS y Redis efímero
│   │   └── walkthrough-komodo-infraestructura.md
│   ├── 02_Fase1_Core_FastAPI/             # Core transaccional, ACID y resolución de concurrencia
│   │   ├── komodo-Core&Fase1(resultados).md
│   │   └── komodo-reforma_fase1.md
│   ├── 03_Fase2_Gateway_Go/               # Gateway de alto rendimiento y tolerancia a fallos
│   │   ├── Komodo_Fase2_plan.md
│   │   ├── Komodo-Fase2_Reforma.md
│   │   └── Komodo-Fase2_wk.md
│   ├── 04_Fase3_Mobile_ReactNative/       # App móvil Expo y capa SQLite offline-first
│   │   ├── Komodo-Fase3_plan.md
│   │   ├── komodo-Fase3_plan-1.md
│   │   └── komodo-Fase3_wk1.md
│   └── 05_Fase4_UI_Polish_y_Swift/        # Pulido visual de interfaz y hoja de ruta Swift nativo
│       └── Komodo-FrontendUpdate&Swift-plan.md
├── core/                                  # Backend FastAPI en Python
├── gateway/                               # Gateway de alto rendimiento en Go
├── db/                                    # Scripts de inicialización SQL (esquema y datos de prueba)
├── redis/                                 # Configuración de Redis volátil
├── mobile/                                # Aplicación móvil React Native (Expo)
├── frontend/                              # Panel de administración web (reservado)
├── docker-compose.yml                     # Orquestación de contenedores
├── .env.example                           # Plantilla de credenciales genéricas
└── .gitignore                             # Reglas de exclusión de git
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](mobile/LICENSE) file for details.
