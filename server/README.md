# 👑 Realm of Kingdoms — Authoritative Backend & Telemetry Server

Servidor backend autoritario oficial de **Realm of Kingdoms (WizzarDev Studios)**.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd server
npm install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```
*(Utiliza el modo `--watch` nativo de Node.js, se reinicia automáticamente al guardar cambios).*

---

## 📡 Endpoints Disponibles

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de salud y tiempo activo del servidor |
| `POST` | `/api/telemetry/batch` | Ingesta masiva de métricas y eventos de jugadores |
| `GET` | `/api/telemetry/summary` | Resumen de sesiones activas y desglose de métricas |
| `POST` | `/api/game/kill-enemy` | Resolución autoritaria de muerte de enemigo (EXP, drops, oro) |
| `GET` | `/api/game/balance-tables` | Tablas de balance oficiales (monstruos, drops, EXP) |
| `POST` | `/api/game/validate-action` | Validación anti-cheat de daño y acciones |
| `GET` | `/api/player/profile/:id` | Consulta segura del perfil y guardado del jugador |
| `POST` | `/api/player/sync` | Sincronización autoritaria con Supabase |
| `GET` | `/api/player/leaderboard` | Tabla de clasificación verificada |

---

## 🗄️ Base de Datos Supabase
Las migraciones y tablas SQL correspondientes se encuentran en la carpeta raíz [`../supabase/`](../supabase/).
* `01_game_telemetry.sql`: Tabla de analíticas y eventos de juego.
* `schema.sql`: Esquema maestro de partidas (`kingdom_saves`), misiones y progreso.
