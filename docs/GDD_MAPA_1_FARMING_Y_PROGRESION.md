# Protocolo de Red y Contrato Cliente-Servidor (MMORPG Autoritativo)
**Juego:** Realm of Kingdoms (Reinos en Guerra)  
**Estudio:** WizzarDev Studios  
**Arquitectura:** Servidor Autoritativo con Predicción de Cliente (Tick Rate: 20 Hz / 50ms)  
**Canal de Red:** WebSocket (Tiempo Real) + REST API (Autenticación y Persistencia)

---

## 🏛️ 1. Filosofía de Arquitectura: "Never Trust the Client"

```
┌──────────────────────────────────────────────┐
│            CLIENTE (LAUNCHER / FRONT)        │
│          "Los Ojos y Manos del Jugador"      │
├──────────────────────────────────────────────┤
│ 1. Captura inputs (WASD, hotkeys, clics).    │
│ 2. Predice movimiento local para 60 FPS.     │
│ 3. Muestra animaciones, números de daño y SFX│
│ 4. NUNCA decide si un monstruo vive o muere. │
└──────────────────────┬───────────────────────┘
                       │
       [WebSocket / JSON Frames - 20 Hz]
                       │
┌──────────────────────▼───────────────────────┐
│        SERVIDOR AUTORITATIVO (BACKEND)       │
│             "El Dueño de la Verdad"          │
├──────────────────────────────────────────────┤
│ 1. Corre el ciclo de IA de monstruos (Tick). │
│ 2. Valida distancias, cooldowns y colisiones.│
│ 3. Calcula daño real, críticos y vida.       │
│ 4. Otorga EXP y drops a la Base de Datos.    │
│ 5. Sincroniza el snapshot a todos en la sala.│
└──────────────────────────────────────────────┘
```

---

## 📡 2. Catálogo de Mensajes (El Contrato)

### 🔹 FASE A: Autenticación y Entrada al Mundo

#### 1. `CLIENT -> SERVER: AUTH_CONNECT`
Enviado cuando el jugador presiona **"Entrar al Reino"** en el Launcher.
```json
{
  "event": "AUTH_CONNECT",
  "data": {
    "token": "usr_session_jwt_or_temp_uuid",
    "playerName": "Gustavo",
    "characterClass": "valquiria",
    "clientVersion": "1.0.0"
  }
}
```

#### 2. `SERVER -> CLIENT: AUTH_SUCCESS`
El servidor confirma acceso, instancia la sesión y devuelve los datos iniciales.
```json
{
  "event": "AUTH_SUCCESS",
  "data": {
    "playerId": "p_98421",
    "mapId": "dungeon_sanctuary_01",
    "spawnPoint": { "x": 400, "y": 600 },
    "serverTickRate": 20,
    "stats": {
      "level": 1,
      "exp": 0,
      "expNeeded": 62,
      "hp": 240,
      "maxHp": 240,
      "mana": 120,
      "maxMana": 120,
      "gold": 150
    }
  }
}
```

---

### 🔹 FASE B: Movimiento y Estado del Mundo (20 Ticks / segundo)

#### 3. `CLIENT -> SERVER: PLAYER_INPUT_MOVE`
El cliente envía los vectores de dirección deseados.
```json
{
  "event": "PLAYER_INPUT_MOVE",
  "data": {
    "sequence": 1042,
    "inputX": 1,
    "inputY": 0,
    "facing": "right",
    "isRunning": false,
    "timestamp": 1727318000123
  }
}
```

#### 4. `SERVER -> CLIENT: WORLD_SNAPSHOT` (Broadcast a 20 Hz)
El servidor emite el estado oficial de la sala (jugadores y monstruos) para que el frontend simplemente los dibuje.
```json
{
  "event": "WORLD_SNAPSHOT",
  "data": {
    "tick": 45012,
    "players": [
      {
        "id": "p_98421",
        "name": "Gustavo",
        "class": "valquiria",
        "x": 420.5,
        "y": 600.0,
        "state": "walk",
        "facing": "right",
        "hp": 240,
        "maxHp": 240
      }
    ],
    "monsters": [
      {
        "id": "m_101",
        "type": "slime_green",
        "x": 650.0,
        "y": 590.0,
        "hp": 80,
        "maxHp": 80,
        "state": "chase",
        "targetPlayerId": "p_98421"
      },
      {
        "id": "m_102",
        "type": "slime_blue",
        "x": 820.0,
        "y": 610.0,
        "hp": 120,
        "maxHp": 120,
        "state": "patrol",
        "targetPlayerId": null
      }
    ]
  }
}
```

---

### 🔹 FASE C: Combate Autoritativo y Habilidades

#### 5. `CLIENT -> SERVER: PLAYER_CAST_SKILL`
El jugador presiona atacar o usa una tecla de habilidad (1, 2, 3). **No envía el daño**, solo la intención.
```json
{
  "event": "PLAYER_CAST_SKILL",
  "data": {
    "skillId": "slash_sword",
    "targetPos": { "x": 640, "y": 595 }
  }
}
```

#### 6. `SERVER -> CLIENT: COMBAT_DAMAGE_EVENT` (Broadcast)
El servidor valida si el monstruo estaba en rango, calcula defensa/crítico y ordena mostrar el golpe.
```json
{
  "event": "COMBAT_DAMAGE_EVENT",
  "data": {
    "attackerId": "p_98421",
    "targetId": "m_101",
    "targetType": "monster",
    "damage": 38,
    "isCritical": true,
    "remainingHp": 42,
    "maxHp": 80,
    "knockback": { "vx": 4.5, "vy": -1.2 },
    "hitPosition": { "x": 650, "y": 570 }
  }
}
```

---

### 🔹 FASE D: Muerte de Monstruos, EXP y Recompensas

#### 7. `SERVER -> CLIENT: ENTITY_DEATH` (Broadcast)
```json
{
  "event": "ENTITY_DEATH",
  "data": {
    "entityId": "m_101",
    "entityType": "monster",
    "killerPlayerId": "p_98421",
    "deathAnimation": "slime_pop_death"
  }
}
```

#### 8. `SERVER -> CLIENT: LOOT_EXP_AWARDED` (Unicast exclusivo al jugador)
El servidor acredita la experiencia y el botín directamente en Supabase.
```json
{
  "event": "LOOT_EXP_AWARDED",
  "data": {
    "expGained": 25,
    "goldGained": 18,
    "didLevelUp": false,
    "progression": {
      "level": 1,
      "exp": 25,
      "expNeeded": 62
    },
    "drops": [
      {
        "id": "mat_slime_gel",
        "name": "Gel Viscoso de Slime",
        "rarity": "common",
        "count": 1
      }
    ]
  }
}
```

---

## 🛠️ 3. Mapeo de Tablas de Monstruos Autoritativos

Los atributos base de los monstruos residen exclusivamente en `server/src/engine/authoritativeEngine.js`:

| ID de Monstruo | Nombre | HP Máx | Daño Base | Velocidad | EXP Otorgada | Drops |
|---|---|---|---|---|---|---|
| `slime_green` | Slime Verde | 80 | 8 | 1.8 | 25 EXP | Gel Viscoso (65%), Poción Menor (20%) |
| `slime_blue` | Slime Glacial | 120 | 14 | 2.1 | 35 EXP | Gel Helado (70%), Fragmento Azul (8%) |
| `slime_boss` | Rey Slime Colosal | 1,200 | 45 | 1.4 | 250 EXP | Elixir Real (100%), Corona Real (85%) |

---

## 📋 4. Plan de Ejecución del Protocolo

1. **Documento de Contrato listo** (Este archivo).
2. **Frontend Launcher (`RealmOFKingdoms-Launcher`)**:
   * Vista de selección de héroe (`LauncherHome` -> `CharacterSelectView` -> `GameWorldScreen`).
   * Envío del evento `AUTH_CONNECT`.
3. **Backend (`server/src/engine/`)**:
   * Instanciar `Socket.io` o WebSocket server para escuchar `AUTH_CONNECT` y emitir `WORLD_SNAPSHOT` a 20 Hz.
   * Monitorear los monstruos vivos en memoria del servidor.

---

## ⚔️ 5. Sistema de Farmeo, Curva de Niveles y Zonas del Mapa 1

### 🗺️ A. Zonificación de Pasillos del Mapa 1 ("Santuario de las Nubes")

El Mapa 1 está estructurado como una mazmorra lineal con 4 zonas de progresión conectadas por pasillos:

```
[ZONA 1: Entrada / Campamento Seguro]
  • Zona de paz: NPCs de curación y cofre de alijo.
  • Sin enemigos.
       │
   (Pasillo de la Arboleda)
       │
[ZONA 2: Pasillo de Práctica • Nivel 1 - 2]
  • 4 Slimes Verdes (80 HP, lentos, daño bajo).
  • Agro pasivo (te atacan si te acercas a menos de 140px).
  • Farmeo rápido: 25 EXP c/u (3 slimes = Nivel 2).
  • Respawn: 30 segundos tras morir.
       │
   (Garganta Rocosa)
       │
[ZONA 3: Sala de Cristales Glaciales • Nivel 3 - 4]
  • 4 Slimes Verdes + 3 Slimes Glaciales (120 HP, rápidos, daño medio).
  • Agro agresivo (te detectan a 200px y persiguen en grupo).
  • Requiere usar habilidad en área y esquivas.
  • Farmeo de materiales: Gel Helado y Fragmentos de Cristal Azul.
  • Respawn: 45 segundos.
       │
   (Puerta del Trono de Baba)
       │
[ZONA 4: Cámara del Rey Slime • Nivel 5+ (Jefe de Mazmorra)]
  • 1 Rey Slime Colosal (1,200 HP, daño alto, salto aplastante en área).
  • Invoca 2 Slimes Verdes al llegar al 50% de HP.
  • Recompensa épica: 250 EXP + Corona Real de Slime (Material de forja) + Pociones Mayores.
  • Respawn: 180 segundos (o reinicio de instancia de mazmorra).
```

---

### 📈 B. Curva Matemática de Niveles (Nivel 1 al 5 en Mapa 1)

El servidor autoritativo utiliza la fórmula exponencial:
$$\text{EXP Necesaria} = 50 + (\text{Nivel})^{1.65} \times 12$$

| Nivel | EXP Necesaria | Enemigos Requeridos | Recompensa al Subir de Nivel |
|---|---|---|---|
| **Lv 1 ➔ 2** | **62 EXP** | ~3 Slimes Verdes | **Desbloquea Habilidad 2 (Giro Torbellino)** • +20 HP Máx |
| **Lv 2 ➔ 3** | **140 EXP** | ~6 Slimes Verdes | +25 HP Máx • +15 Maná Máx • +4 Daño Base |
| **Lv 3 ➔ 4** | **245 EXP** | ~7 Slimes Glaciales | **Desbloquea Habilidad 3 (Embestida Sagrada)** • +30 HP Máx |
| **Lv 4 ➔ 5** | **378 EXP** | ~11 Slimes Glaciales | +40 HP Máx • +20 Maná Máx • +8 Daño Base (Listo para el Jefe) |
| **Lv 5 (Cap Mapa 1)**| **Derrota al Rey Slime**| 1 Victoria de Raid Boss | **Acceso al Portal del Bioma 2** + Forja de Armas Raras |

---

### ✨ C. Feedback Audiovisual de Subida de Nivel (Level Up)

Cuando el servidor emite `didLevelUp: true` en `LOOT_EXP_AWARDED`:
1. **Restauración Total**: El servidor regenera el 100% de la vida y el maná instantáneamente (recompensa clásica de RPG).
2. **Pilar de Luz Dorada**: El frontend dispara una columna de luz celestial desde el suelo que envuelve al héroe.
3. **Efecto de Audio**: Fanfarria orquestal triunfal (*level_up_fanfare.ogg*).
4. **Texto Flotante**: *"¡NIVEL ALCANZADO!"* con animación de escala y destello dorado.

---

### 💎 D. Economía de Drops y Materiales de Farmeo

| Objeto | Tipo | Probabilidad | Monstruo de Origen | Uso en el Juego |
|---|---|---|---|---|
| **Gel Viscoso** | Material Común | 65% | Slime Verde | Fabricación de armaduras básicas y vendas |
| **Poción Menor HP** | Consumible | 20% | Slime Verde | Restaura 60 HP al instante |
| **Gel Helado** | Material Poco Común| 70% | Slime Glacial | Forja de armas de escarcha |
| **Fragmento Cristal Azul**| Material Raro | 8% | Slime Glacial | Encantamiento de armas (añade daño elemental) |
| **Elixir de Vida Real** | Consumible Épico | 100% | Rey Slime Colosal | Restaura el 100% de HP |
| **Corona Real de Slime** | Material Legendario| 85% | Rey Slime Colosal | Creación de la Espada Real de Slime (Tier 1 Máximo) |

---

## 🧙‍♂️ 6. Plano de las 4 Clases Clásicas de MMORPG (Nivel 1)

Todos los personajes comienzan en **Nivel 1** con roles, arquetipos y estadísticas asimétricas para incentivar el juego en equipo y la estrategia.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LA SANTA TRINIDAD DEL MMORPG                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│  🛡️ TANQUES       │  ⚔️ DAÑO (DPS)     │  💚 SOPORTE                    │
│  • Knight         │  • Mage (Arcano)  │  • Healer (Sanador)            │
│  • Paladin        │  • Paladin (Luz)  │  • Paladin (Auras secundarias) │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### 🛡️ 1. KNIGHT (El Caballero Guardián)
* **Arquetipo:** Tanque Pesado Melé / Control de Masas.
* **Armamento:** Espada pesada y Escudo de torre blindado.
* **Estilo de Juego:** La muralla de la primera línea. Recibe golpes, protege a los hechiceros y controla el campo de batalla.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `320` *(El más alto del juego)*
  * **Maná Máximo:** `80`
  * **Daño Base:** `16`
  * **Defensa Física:** `24` *(Reduce 25% del daño recibido)*
  * **Velocidad de Movimiento:** `160 px/s` *(Pesado)*
* **Habilidades:**
  * **Habilidad 1 (Nivel 1):** `Golpe de Escudo` *(Coste: 15 MP • CD: 3s)* — Impacta al enemigo frontalmente con el escudo, causando 22 de daño y aturdiéndolo por 1 segundo.
  * **Habilidad 2 (Nivel 2):** `Giro de Espadón` *(Coste: 25 MP • CD: 5s)* — Ataque circular de 360° que golpea a todos los slimes alrededor por 34 de daño.
  * **Habilidad 3 (Nivel 4):** `Grito de Provocación` *(Coste: 30 MP • CD: 12s)* — Obliga a todos los monstruos en un radio de 250px a atacarlo a él durante 4s y le otorga un escudo de absorción.

---

### ✝️ 2. PALADIN (El Guerrero de la Luz)
* **Arquetipo:** Híbrido Ofensivo / Tanque Sagrado / Soporte Secundario.
* **Armamento:** Maza / Espada de una mano bendecida y Escudo heráldico (o Arco Sagrado en variante).
* **Estilo de Juego:** El balance perfecto. Inflige daño sagrado y potencia a los aliados cercanos con auras pasivas.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `270` *(Alto)*
  * **Maná Máximo:** `140` *(Medio-Alto)*
  * **Daño Base:** `20` *(Físico + Daño Sagrado)*
  * **Defensa Física:** `18` *(Media-Alta)*
  * **Velocidad de Movimiento:** `175 px/s` *(Equilibrado)*
* **Habilidades:**
  * **Habilidad 1 (Nivel 1):** `Estocada Sagrada` *(Coste: 18 MP • CD: 2.5s)* — Estocada rápida que quema con luz divina, causando 28 de daño.
  * **Habilidad 2 (Nivel 2):** `Sentencia Celestial` *(Coste: 30 MP • CD: 6s)* — Invoca una hoja de luz que cae desde el cielo, ralentizando al enemigo un 30% por 3s.
  * **Habilidad 3 (Nivel 4):** `Aura de Redención` *(Coste: 45 MP • CD: 15s)* — Libera un pulso sagrado que cura 55 HP a sí mismo y a los aliados a 200px.

---

### 🔥 3. MAGE (El Archimago Arcano)
* **Arquetipo:** DPS a Distancia / Cañón de Cristal (*Glass Cannon*).
* **Armamento:** Bastón elemental o Grimorio arcano.
* **Estilo de Juego:** Destrucción masiva a distancia. Si está a salvo, aniquila grupos enteros de slimes en segundos; si lo atrapan en cuerpo a cuerpo, muere rápido.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `170` *(El más frágil)*
  * **Maná Máximo:** `280` *(La mayor reserva de energía)*
  * **Daño Base:** `32` *(Mágico a distancia)*
  * **Defensa Física:** `8` *(Muy baja)*
  * **Velocidad de Movimiento:** `170 px/s`
* **Habilidades:**
  * **Habilidad 1 (Nivel 1):** `Proyectil Arcano` *(Coste: 20 MP • CD: 1.5s)* — Disparo directo a 500px de alcance que inflige 40 de daño mágico.
  * **Habilidad 2 (Nivel 2):** `Llamarada en Área` *(Coste: 40 MP • CD: 7s)* — Crea un círculo de fuego en el suelo que quema a todos los enemigos dentro causando 60 de daño total.
  * **Habilidad 3 (Nivel 4):** `Parpadeo Astral (Blink)` *(Coste: 35 MP • CD: 10s)* — Teletransporte instantáneo de 220px en la dirección que mira para escapar del peligro.

---

### 💚 4. HEALER (El Sacerdote de la Restauración)
* **Arquetipo:** Sanador Puro / Soporte de Grupo / Purificador.
* **Armamento:** Cetro de bendición y Talismán de vida.
* **Estilo de Juego:** La vida del equipo. Esencial en mazmorras y guerras de clanes. Mantiene vivo al Knight, regenera maná y bendice con escudos.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `210`
  * **Maná Máximo:** `260`
  * **Daño Base:** `16` *(Ataque sagrado a distancia)*
  * **Defensa Física:** `12`
  * **Velocidad de Movimiento:** `180 px/s` *(El más ágil para posicionarse)*
* **Habilidades:**
  * **Habilidad 1 (Nivel 1):** `Destello Solar` *(Coste: 15 MP • CD: 2s)* — Orbe de luz que impacta al enemigo causando 24 de daño sagrado (+50% de daño si el objetivo es no-muerto).
  * **Habilidad 2 (Nivel 2):** `Rezo Curativo` *(Coste: 35 MP • CD: 4s)* — Restaura 85 HP al aliado con menor vida en su rango (o a sí mismo si juega en solitario).
  * **Habilidad 3 (Nivel 4):** `Escudo de Gracia` *(Coste: 45 MP • CD: 14s)* — Otorga a un aliado una barrera protectora brillante que absorbe hasta 120 puntos de daño durante 6 segundos.

---

### 📊 Comparativa Directa de Clases (Nivel 1)

| Clase | Rol Principal | HP Inicial | Maná Inicial | Daño Base | Defensa | Rango de Ataque |
|---|---|---|---|---|---|---|
| **Knight** | Tanque Puro | **320** | 80 | 16 | **24** | Melé Corto (60px) |
| **Paladin** | Tanque / Híbrido | 270 | 140 | 20 | 18 | Melé Medio (90px) |
| **Mage** | DPS Burst | 170 | **280** | **32** | 8 | Largo (500px) |
| **Healer** | Sanador / Soporte | 210 | 260 | 16 | 12 | Medio (400px) |


