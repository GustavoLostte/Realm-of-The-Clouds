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

### 🏹 2. PALADIN (Tirador a Distancia / Arquero)
* **Arquetipo:** Tirador Físico a Distancia / Francotirador / Velocista.
* **Armamento:** Arco largo y carcaj de flechas (en la tradición clásica de Tibia/RO).
* **Estilo de Juego:** Daño constante a máxima distancia mientras kitea y corre. Gran velocidad de movimiento; si mantiene la distancia es letal, atacando antes de que los enemigos lo alcancen.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `230` *(Medio)*
  * **Maná Máximo:** `160` *(Medio)*
  * **Daño Base:** `24` *(Físico a Distancia)*
  * **Defensa Física:** `14` *(Media)*
  * **Velocidad de Movimiento:** `190 px/s` *(El más rápido del juego)*
  * **Rango de Ataque:** `520 px` *(El mayor alcance sostenido)*

---

### 🔥 3. MAGE (El Archimago Elemental)
* **Arquetipo:** DPS Mágico a Distancia / Cañón de Cristal (*Glass Cannon*).
* **Armamento:** Bastón elemental o Grimorio arcano.
* **Estilo de Juego:** Destrucción masiva a distancia. Si está a salvo, aniquila grupos enteros de enemigos en segundos; si lo atrapan en cuerpo a cuerpo, es muy frágil.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `170` *(El más frágil)*
  * **Maná Máximo:** `280` *(La mayor reserva de energía)*
  * **Daño Base:** `32` *(Mágico a distancia)*
  * **Defensa Física:** `8` *(Muy baja)*
  * **Velocidad de Movimiento:** `170 px/s`
  * **Rango de Ataque:** `480 px`

---

### 💚 4. HEALER (El Sacerdote de la Restauración)
* **Arquetipo:** Sanador Puro / Soporte de Grupo / Purificador.
* **Armamento:** Cetro de bendición y Talismán de vida.
* **Estilo de Juego:** La vida del equipo. Esencial en mazmorras y guerras de clanes. Mantiene vivo al Knight, regenera maná, mitiga daño con escudos y apoya con daño sagrado.
* **Atributos Iniciales (Nivel 1):**
  * **HP Máximo:** `210`
  * **Maná Máximo:** `260`
  * **Daño Base:** `16` *(Ataque sagrado a distancia)*
  * **Defensa Física:** `12`
  * **Velocidad de Movimiento:** `180 px/s` *(Muy ágil para posicionarse y salvar aliados)*
  * **Rango de Ataque:** `420 px`

---

### 📊 Comparativa Directa de Clases (Nivel 1)

| Clase | Rol Principal | HP Inicial | Maná Inicial | Daño Base | Defensa | Rango de Ataque | Velocidad |
|---|---|---|---|---|---|---|---|
| **Knight** | Tanque Melé / Frontlane | **320** | 80 | 18 | **24** | Corto (70 px) | 165 px/s |
| **Paladin** | Arquero / Tirador Físico | 230 | 160 | 24 | 14 | **Máximo (520 px)** | **190 px/s** |
| **Mage** | DPS Mágico en Área (Burst) | 170 | **280** | **32** | 8 | Largo (480 px) | 170 px/s |
| **Healer** | Soporte / Curandero / Escudos | 210 | 260 | 16 | 12 | Medio (420 px) | 180 px/s |

---

### ⚔️ Estructura del Sistema de Habilidades (4 Activas + Básico + 1 Pasiva)

Para que el combate sea ágil, intuitivo y coincida con el **HUD de 4 Slots (1, 2, 3, 4)** ya implementado en el juego, cada personaje cuenta con:
1. **Ataque Básico (Auto / Click / Tecla de Ataque)**: Ataque principal sin coste de maná ni cooldown.
2. **Habilidad 1 (Tecla 1 / Q)**: Daño directo / Rotación rápida (Cooldown bajo: 2 - 3s).
3. **Habilidad 2 (Tecla 2 / W)**: Daño en Área (AoE) o Control / Slow (Cooldown medio: 6 - 8s).
4. **Habilidad 3 (Tecla 3 / E)**: Defensiva / Escape / Soporte (Cooldown: 10 - 15s).
5. **Habilidad 4 / Super Skill (Tecla 4 / R o U)**: Habilidad Definitiva (SS) de impacto masivo (Cooldown largo: 25 - 30s).
6. **Pasiva de Clase**: Bonificación pasiva permanente que define la identidad única de cada héroe.

#### Resumen de Habilidades por Clase:

* 🛡️ **Knight**:
  * *Básico*: Tajo de Espadón (físico frontal).
  * *Skill 1 [1]*: `Golpe Sísmico` (impacta el suelo y desestabiliza).
  * *Skill 2 [2]*: `Torbellino de Acero` (daño 360° a todos los enemigos cercanos).
  * *Skill 3 [3]*: `Poder del Escudo` (guardia defensiva que absorbe 60% del daño).
  * *Skill 4 / SS [4]*: `Furia del Coloso` (salto destructor en área con aturdimiento).
  * *Pasiva*: `Coraza de Hierro` (+20% armadura pasiva y resistencia a empujes).

* 🏹 **Paladin** (Arquero):
  * *Básico*: Disparo de Flecha (proyectil físico veloz).
  * *Skill 1 [1]*: `Flecha Perforante` (atraviesa una fila entera de enemigos).
  * *Skill 2 [2]*: `Lluvia de Flechas` (dispara al cielo y hace llover flechas ralentizando en zona).
  * *Skill 3 [3]*: `Retirada Ágil` (salto evasivo hacia atrás + impulso de velocidad para mantener distancia).
  * *Skill 4 / SS [4]*: `Disparo Letal del Viento` (flecha masiva cargada que inflige daño crítico letal a larga distancia).
  * *Pasiva*: `Ojo de Halcón` (+15% velocidad de movimiento y +10% probabilidad de crítico).

* 🔥 **Mage**:
  * *Básico*: Orbe Elemental (proyectil mágico a distancia).
  * *Skill 1 [1]*: `Proyectil Arcano` (ráfaga de energía de impacto directo).
  * *Skill 2 [2]*: `Pilar de Fuego` (erupción en el suelo que incinera oleadas de enemigos).
  * *Skill 3 [3]*: `Parpadeo Astral (Blink)` (teletransporte instantáneo para escapar de emboscadas).
  * *Skill 4 / SS [4]*: `Cataclismo Cósmico` (lluvia de meteoros devastadora en gran área).
  * *Pasiva*: `Flujo de Maná` (+30% regeneración pasiva de maná y daño elemental aumentado).

* 💚 **Healer**:
  * *Básico*: Pulso de Luz (daño mágico sagrado a distancia).
  * *Skill 1 [1]*: `Destello Solar` (daño y debuff que reduce el ataque enemigo por 4s).
  * *Skill 2 [2]*: `Rezo Curativo` (ola de sanación directa para curar a aliados y a sí mismo).
  * *Skill 3 [3]*: `Escudo de Bendición` (barrera brillante que absorbe daño masivo).
  * *Skill 4 / SS [4]*: `Milagro Sagrado` (curación masiva en campo completo + buff de defensa para todo el gremio/party).
  * *Pasiva*: `Aura de Gracia` (regenera vida pasiva gradualmente a todos los aliados cercanos).

---

### 🆙 Progresión de Habilidades: 3 Niveles (Escala Épica hasta Nivel 500)

Las habilidades no se suben a cada rato; subir de rango una habilidad es un logro mayor que recompensa el esfuerzo y el farmeo a largo plazo:

* **Tope de Habilidad:** Exactamente **3 Niveles** por habilidad (`Nv. 1`, `Nv. 2`, `Nv. 3 - MAX`).
* **Hito de Nivel 500:** El **Nivel 3** solo se desbloquea al alcanzar el **Nivel 500** del personaje.

| Rango de Habilidad | Requisito de Personaje | Efecto y Poder |
|---|---|---|
| **Nivel 1 (Base)** | Inicio / Nivel 1 | Potencia inicial de la habilidad. Coste normal de Maná. |
| **Nivel 2 (Avanzado)** | Nivel 250 *(Hito intermedio)* | +50% Daño/Efecto, mayor área/rango de impacto y -15% coste de Maná. |
| **Nivel 3 (Trascendido - MAX)** | **Nivel 500** *(Pináculo del Farmeo)* | **Poder Definitivo:** +120% Daño/Efecto, reducción de Cooldown y efectos secundarios de combate (ej. mayor aturdimiento, penetración de armadura o área gigante para Guerras de Clanes). |

---

### 🛡️ Sistema de Skills de Combate Orgánicos (Estilo Tibia)

El poder del héroe no depende únicamente de su nivel general (`Level EXP`), sino de su **entrenamiento en combate (`Skill Training`)**. Los skills suben **por uso directo**:

#### 1. Los 4 Skills Fundamentales
* ⚔️ **Melee Fighting:** Aumenta el daño de golpes físicos de contacto cercano. Sube con cada golpe asestado con armas de cuerpo a cuerpo.
* 🏹 **Distance Fighting:** Aumenta el daño y precisión de proyectiles a distancia. Sube con cada flecha acertada con arco.
* 🛡️ **Shielding:** Aumenta la tasa de mitigación y la probabilidad de bloqueo absoluto (daño cero con sonido metálico / "Puff"). Sube al resistir y bloquear golpes en combate.
* ✨ **Magic Level (ML):** Determina el poder destructivo de hechizos y la cantidad de puntos de vida curados. Sube por **consumo de maná acumulado** (cada punto de MP gastado en habilidades o runas cuenta).

#### 2. Tasas de Aprendizaje por Clase (Multiplicador de Vocación)
Cada clase aprende sus especialidades mucho más rápido, emulando la pureza de roles de Tibia:

| Clase | Melee | Distance | Shielding | Magic Level |
|---|---|---|---|---|
| **Knight** | ⚡ **Rápido (1.1x)** | ❌ Muy Lento (2.0x) | ⚡ **Rápido (1.1x)** | ❌ Muy Lento (3.0x) |
| **Paladin** | ❌ Lento (1.6x) | ⚡ **Rápido (1.1x)** | 🛡️ **Rápido (1.1x)** | ⚖️ Moderado (1.4x) |
| **Mage** | ❌ Muy Lento (2.0x) | ❌ Nulo/Muy Lento | ❌ Muy Lento (1.8x) | 🔥 **Ultra Rápido (1.1x)** |
| **Healer** | ❌ Muy Lento (2.0x) | ❌ Nulo/Muy Lento | ⚖️ Moderado (1.4x) | 💚 **Ultra Rápido (1.1x)** |

#### 3. Validación Autoritativa en Servidor (`Server Protocol`)
Para evitar trampas (speedhacks o autoclickers fraudulentos):
* El servidor registra cada golpe válido y cada maná consumido.
* Cuando el contador llega a la meta, el servidor emite el paquete `SKILL_ADVANCE`:
```json
{
  "type": "SKILL_ADVANCE",
  "skill": "distance",
  "newLevel": 45,
  "playerId": "p_8841"
}
```
* El cliente reproduce el sonido clásico de felicitación, texto flotante verde sobre la cabeza del personaje (*«You advanced in distance fighting [45]»*) y actualiza la barra del HUD.

---

### 🏃 Sistema de Niveles Infinitos y Velocidad Progresiva

En *Realm of Kingdoms* **no hay límite artificial de nivel** (escala infinita estilo Tibia):
* **Fórmula de Velocidad:** `Velocidad (px/s) = Base + (Nivel * 0.7)`.
* **Nivel 1:** `140 px/s` — Movimiento pausado (`Animación: walk`). El jugador se siente novato.
* **Nivel 21+:** El sprite cambia a trote continuo (`Animación: run`).
* **Nivel 150+:** Desbloquea la estela espectral de velocidad (*Ghost Trail*) al correr.
* **Nivel 500:** `490 px/s` — Rapidez total que le permite kitear y dominar en Guerras de Clanes.
* **Botas de Velocidad:** Ítems raros de mazmorra (como las clásicas *Boots of Haste*) que otorgan un bono plano inmediato (+40 px/s).

---

### 💀 Sistema de Muerte, Castigo y Bendiciones (Blessings)

La muerte tiene consecuencias reales, generando tensión, respeto por el mapa y valor a la supervivencia:

#### 1. Muerte SIN Bendición (`Sin Bless`)
* **Pérdida de Experiencia:** Pierde el **15% de la EXP** acumulada del nivel actual (pudiendo bajar de nivel si la pérdida supera el umbral).
* **Pérdida de Habilidades:** Pierde un porcentaje de avance en sus Skills de combate (`Melee`, `Distance`, `Shielding`, `Magic Level`).
* **Pérdida de Ítems (Drop):** **Pierde la Mochila (Backpack)**.
  * La mochila cae inmediatamente al suelo en las coordenadas de su muerte como un contenedor de loot público.
  * Cualquier jugador que pase por el lugar puede abrirla y quedarse con el botín.

#### 2. Muerte CON Bendición (`Con Bless`)
* **Consumo de la Bless:** La bendición se consume en el momento de la muerte para proteger al alma del héroe.
* **50% de Reducción en la Pérdida de EXP:** En lugar del 15%, solo pierde el **7.5% de EXP**.
* **Protección Total de Ítems:** **CERO pérdida de ítems**. La mochila y el equipamiento se mantienen 100% seguros con el personaje.

#### 3. Reaparición y Recompra (`Respawn & Temple`)
* El jugador revive instantáneamente en el **Templo de la Ciudad Inicial** (Zona de Protección / *Protection Zone*).
* Para volver a estar seguro en sus cacerías, el jugador debe acudir al Sacerdote del Templo y pagar en **KC (Kingdom Coins)** para renovar su bendición antes de salir a farmear de nuevo.

#### 4. Paquetes de Red del Protocolo (`WebSocket`)
* **Servidor a Cliente (`PLAYER_DIED`):**
```json
{
  "type": "PLAYER_DIED",
  "playerId": "p_8841",
  "killerType": "player",
  "killerName": "LordVader",
  "hadBless": false,
  "lostExp": 15420,
  "droppedBackpack": true,
  "corpseLocation": { "x": 1420, "y": 890, "mapId": "map_corridor_01" }
}
```
* **Cliente a Servidor (`BUY_BLESSING`):**
```json
{
  "type": "BUY_BLESSING",
  "npcId": "npc_priest_temple"
}
```

---

### ☠️ 2. Sistema de PK, Calaveras y Zonas de Protección (Open-PvP)

Para que el PvP de mundo abierto tenga tensión, justicia y guerras épicas sin abusos tóxicos:

#### 1. Tipos de Calaveras (Skulls)
* ⚪ **Calavera Blanca (White Skull):**
  * Se activa de inmediato al atacar o matar a un jugador inocente (sin calavera).
  * **Duración:** 15 minutos en combate activo (se reinicia si sigue golpeando jugadores).
  * **Castigo inmediato:** Bloqueo absoluto de entrada a cualquier Zona de Protección (PZ / Templo). No puede esconderse mientras tenga calavera blanca.
  * Cualquier otro jugador del reino tiene derecho a atacarlo y matarlo sin ganar calavera ni penalización.
* 🟡 **Calavera Amarilla (Yellow Skull - Legítima Defensa):**
  * Si un jugador con Calavera Blanca te ataca a ti (siendo inocente), a tus ojos él aparece con Calavera Amarilla.
  * Puedes defenderte y matarlo sin sumar frags ni ganar calavera.
* 🔴 **Calavera Roja (Red Skull - Castigo Máximo):**
  * Se activa automáticamente si un jugador acumula **3 asesinatos injustificados (injusts / frags)** en un lapso de 24 horas (o 5 en la semana).
  * **Duración:** 30 días continuos con la calavera roja visible sobre la cabeza.
  * **Pena Máxima al Morir:** Si un jugador con Red Skull muere (a manos de monstruo o jugador), **PIERDE ABSOLUTAMENTE TODO SU EQUIPO Y SU MOCHILA**, incluso si tenía Bless activa. Es la marca del cazador proscrito.

#### 2. Zonas de Protección (PZ / Templo y Banco)
* En el mapa existen zonas marcadas con un icono de candado / cruz sagrada (el Templo de resurrección, el Banco y el Depósito de la ciudad).
* Dentro de una PZ:
  * Prohibido desenvainar armas, lanzar flechas o usar hechizos ofensivos.
  * Los jugadores no pueden recibir daño de ningún tipo.
  * Jugadores con Calavera Blanca o con bloqueo de batalla (*Battle Sign*) no pueden atravesar la puerta del templo hasta que se limpie su estado.

---

### 🧪 3. Pociones, Comida y Regeneración Sostenida (Sustain)

El ritmo de juego combina recuperación pasiva fuera de combate con reflejos en caliente:

#### 1. Sistema de Comida (`Food Regen Tick`)
* Los monstruos sueltan carne, pescado, bayas o setas al morir.
* Al comer un alimento, se llena la reserva de saciedad del estómago (hasta un tope de tiempo, ej. 15 minutos de comida).
* **Efecto Pasivo:** Cada 2 o 3 segundos (`Regen Tick`), el personaje recupera automáticamente una cantidad fija de HP y MP según su clase (el Knight regenera más HP; el Mage y Healer regeneran más MP).

#### 2. Pociones de Combate (`Hotkeys 1s Cooldown`)
* **HP Potions (Poción de Salud):** Restaura vida instantánea para aguantar golpes de jefes o combos de jugadores.
* **Mana Potions (Poción de Maná):** Restaura maná para mantener la rotación de habilidades activa.
* **Cooldown de Pociones:** Tienen un enfriamiento independiente de **1.0 segundo**.
* Esto exige habilidad manual: el jugador debe sincronizar sus ataques con la tecla rápida de poción (Hotkey) para mantenerse con vida mientras esquiva y ataca.

---

### 🎒 4. Ranuras de Inventario, Capacidad y Munición del Paladin

#### 1. Ranuras de Equipamiento Clásicas (8 Slots + Mochila)
* `Casco (Head)`
* `Armadura (Chest)`
* `Pantalones (Legs)`
* `Botas (Boots)`
* `Arma Principal (Main Hand)` — Espada para Knight, Arco para Paladin, Bastón para Mage, Cetro para Healer.
* `Escudo / Mano Secundaria (Off Hand)` — Escudos para Knight/Paladin/Healer, Grimorio/Orbe para Mage.
* `Amuleto (Neck)`
* `Mochila (Backpack)` — Contenedor portátil donde se almacenan pociones, comida, flechas y el botín recogido. **Regla de Espacio:** No existe Depot ni baúl infinito en el reino; los jugadores inician con una mochila básica de 16 casillas y deben **lootear mochilas con más slots (24, 30, 40 casillas)** de monstruos y bosses. Cada quien administra responsablemente el espacio que posee.

#### 2. La Munición Física del Paladin (Flechas Reales)
El **Paladin** no tiene disparos infinitos; es un arquero táctico que **gasta munición real** por cada disparo:
* En su ranura de carcaj o en su mochila debe llevar paquetes de flechas (apilables hasta 100 por casilla):
  * **Flechas de Madera (Wooden Arrows):** Munición básica de farmeo, barata y accesible.
  * **Flechas Pesadas (Heavy Arrows):** Mayor daño de penetración física contra enemigos acorazados.
  * **Flechas de Ráfaga / Perforantes (Burst Arrows / Sniper Arrows):** Flechas caras para cacerías de alto nivel que causan daño en línea o golpe crítico aumentado.
* Esto genera una economía viva: el Paladin debe calcular cuántos paquetes de flechas llevar a su cacería para no quedarse sin munición en medio del pasillo del mapa.

---

### 🪙 5. Economía Oficial: Sistema de Coins y KC (10,000 Coins = 1 KC)

La economía monetaria del reino se divide en dos denominaciones limpias y perfectamente equilibradas:

#### 1. Moneda Base: Coins
* Es la moneda estándar del farmeo diario. Los slimes y monstruos comunes sueltan **Coins** al morir (ej. 5 a 25 Coins por enemigo).
* Se apilan de 1 a 100 por casilla en la mochila.
* **Uso:** Cubren los gastos cotidianos de aventura (pociones de vida/maná, paquetes de flechas para el Paladin y comida).

#### 2. Moneda de Prestigio y Tesoro: KC (Kingdom Coin)
* **Regla de Equivalencia:**
  $$\mathbf{10,000\ Coins = 1\ KC}$$
* Cuando un jugador acumula 10,000 Coins, el sistema bancario las compacta en **1 KC (Kingdom Coin)**, una moneda de oro puro acuñada con el sello real.
* **Uso de los KC:** Es la moneda de los grandes intercambios y el contenido de clanes:
  * Fundar un Clan: cuesta `5 KC` (50,000 Coins).
  * Comercio entre jugadores de armas raras y armaduras de skills: se cotizan directamente en KC (ej. *«Vendo Espada Vorpal por 2 KC»*).
  * Invocación de Jefes de Clan (Gold Sink): cuesta `3 KC`, `6 KC` o `15 KC`.

#### 3. El Banco del Reino (NPC Banquero en el Templo)
Llevar miles de Coins o varios KC en la mochila fuera de la ciudad es un peligro, ya que morir sin Bless derriba la mochila al suelo.
* En el Banco del Templo, el jugador gestiona sus riquezas:
  * `deposit [cantidad] [coins/kc]`: Guarda su dinero en la bóveda protegida.
  * `withdraw [cantidad] [coins/kc]`: Retira los fondos necesarios para sus cacerías.
  * `change [coins/kc]`: Convierte 10,000 Coins en 1 KC (o viceversa) sin comisiones.
  * `balance`: Consulta su saldo total protegido en Coins y KC.
* Los fondos depositados en el banco están **100% a salvo** de muertes y robos.


---

### 👥 6. Sistema de Party y EXP Compartida (Shared EXP)

Fomenta que las 4 vocaciones clásicas (**Knight, Paladin, Mage, Healer**) cacen juntas en equipo:

#### 1. Activación de la Party
* El líder invita haciendo click derecho en otro jugador o mediante el comando `/party [nombre]`.
* Límite de Party: Hasta 5 jugadores en el mismo grupo.
* **Barra de Estado en el HUD:** Aparece un panel lateral con el nombre, nivel, barra de HP y MP de cada miembro en tiempo real (esencial para que el **Healer** monitoree la salud del equipo y el **Knight** gestione el aggro).

#### 2. Bono de Experiencia Compartida (`Shared EXP`)
* Se activa cuando todos los miembros están activos en el mismo radio de combate (dentro de la misma pantalla o pasillo).
* **Rango de Niveles Válido:** La diferencia no puede superar un tercio (el nivel más bajo debe ser al menos el 66% del nivel más alto).
* **Bono de Vocación Única:** Si la party tiene las **4 clases distintas** cazando juntas, el servidor otorga un **+20% de EXP bono** sobre cada monstruo eliminado, dividiendo la experiencia equitativamente.

---

### 🛡️ 7. Sistema de Clanes (Guilds) y Guerras (Guild War)

El pilar social para las batallas masivas de más de 100 jugadores en un solo shard:

#### 1. Creación y Estructura de Clan
* Cualquier jugador de nivel 50+ puede fundar un Clan en la ciudad pagando una cuota en **KC**.
* Rangos: Líder, Sub-líderes, Oficiales y Miembros.
* **Emblema de Clan:** Escudo heráldico personalizado visible junto al nombre del jugador para fácil identificación visual en combate.

#### 2. Declaración Formal de Guerra (`Guild War`)
* El líder del Clan A desafía al Clan B fijando las condiciones:
  * Límite de frags (ej. a 50 o 100 muertes).
  * Duración máxima (ej. 7 días).
  * Apuesta opcional en **KC** que el clan ganador cobra del banco.
* **Regla de Oro en Guerra (Cero Calaveras):**
  * Durante la guerra activa, matar a un miembro del clan rival **NO otorga Calavera Blanca ni suma asesinatos injustos (injusts)**.
  * Es combate total y libre en cualquier zona abierta del mundo (fuera de las Zonas de Protección).
  * El servidor lleva el contador en vivo en pantalla: `Clan A [24] vs [19] Clan B`.

---

### 🤝 8. Sistema de Comercio Seguro entre Jugadores (Player Trade)

Garantiza transacciones 100% seguras de ítems y **KC** sin riesgo de estafas:

#### 1. Ventana de Comercio Dual
* Click derecho sobre un jugador cercano ➔ `Comerciar (Trade)`.
* Se abre una interfaz con dos columnas simétricas:
  * **Tu Oferta (Izquierda):** Espacio para arrastrar ítems de la mochila y un campo numérico para ingresar **KC**.
  * **Oferta del Otro Jugador (Derecha):** Muestra con iconos, nombres y cantidades exactas lo que la otra persona está ofreciendo.

#### 2. Proceso de Confirmación de Dos Pasos
1. **Paso 1 - Aceptar Oferta:** Ambos jugadores revisan los ítems y presionan el botón verde `Aceptar`.
2. **Paso 2 - Confirmación Final:** Se bloquean las casillas (nadie puede cambiar ni retirar nada) y aparece el botón final `Confirmar Intercambio`.
3. **Mecanismo Anti-Estafa:** Si cualquiera de los dos intenta cambiar, retirar un ítem o alterar los **KC** después de haber aceptado, la ventana se cancela de inmediato y los ítems regresan a sus mochilas originales.

---

### 💬 9. Sistema de Chat y Canales de Comunicación

La comunicación social y estratégica del reino se divide en canales especializados:

1. **Chat Local (Say / En Pantalla):**
   * El texto escrito aparece flotando en color amarillo sobre la cabeza del personaje durante 4 segundos.
   * Solo es audible y visible para los jugadores que se encuentren en la misma pantalla o en un radio de 600px.
2. **Canal de Party (Grupo):**
   * Canal privado exclusivo para los miembros del grupo activo (texto en color azul claro).
   * Permite coordinar curaciones, descansos y avances por los pasillos sin que otros jugadores lo lean.
3. **Canal de Clan (Guild):**
   * Canal privado para todos los miembros del clan (texto en color verde).
   * Vital para convocar miembros, dar alertas de invasiones enemigas y dirigir guerras.
4. **Canal Global / Trade:**
   * Canal visible para todo el servidor.
   * Diseñado para anunciar compra/venta de ítems con **KC**, reclutar miembros para clanes o buscar party. Tiene un cooldown de mensaje (anti-spam) de 10 segundos.
5. **Mensaje Privado (Whisper):**
   * Comando `/msg [nombre_jugador] [mensaje]` o doble click al nombre en la lista de chat.
   * Abre una pestaña privada directa entre dos jugadores.

---

### 🛡️ 10. Prioridad de Loot (Anti-Ninja Looting)

Para premiar el esfuerzo de combate y erradicar el robo de drops ajenos:

#### 1. Regla de los 10 Segundos de Exclusividad
* Cuando un monstruo es derrotado en los pasillos o salas de caza:
  * El jugador (o la party) que infligió el **mayor porcentaje de daño total** al monstruo recibe **10 segundos de exclusividad absoluta** sobre el cuerpo.
  * Durante esos 10 segundos, ningún jugador ajeno puede abrir el cadáver, inspeccionarlo ni recoger los **KC** o ítems.
  * Si un jugador no autorizado intenta abrir el cuerpo, el juego le muestra el mensaje de bloqueo en pantalla: *«Este cuerpo no te pertenece todavía»*.

#### 2. Apertura Pública
* Si transcurren los 10 segundos y el dueño original no ha recogido el botín, el cadáver se vuelve público y cualquier aventurero que pase por allí puede abrirlo libremente.

---

### 🩸 11. Estados Alterados de Combate (DoTs y Debuffs)

Aportan profundidad táctica al combate y hacen imprescindible la presencia del **Healer**:

1. 🟢 **Veneno (Poison):**
   * Infligido por monstruos venenosos, slimes tóxicos o flechas envenenadas de arqueros.
   * Pierde vida de forma progresiva cada 2 segundos (números de daño verdes flotantes). No se detiene hasta que el efecto expire o sea purificado.
2. 🔥 **Quemadura (Burn):**
   * Causado por magias de fuego del Mage o monstruos ígneos.
   * Daño rápido y agresivo segundo a segundo (números naranjas).
3. ❄️ **Parálisis / Ralentización (Slow):**
   * Reduce drásticamente la velocidad de movimiento del objetivo a la mitad durante 4 a 6 segundos.
   * En situaciones de PvP o de escape es letal, ya que impide kitear o huir al templo.
4. 💚 **El Rol Purificador del Healer:**
   * El Healer posee habilidades específicas de disipación de estados (estilo *Exana Pox* / *Purificación Sagrada*):
   * Con un solo casteo puede limpiar el veneno, quemadura o parálisis de un aliado o de sí mismo, restaurando su movilidad y supervivencia de inmediato.

---

### 🛡️ 12. Sistema de Equipamiento: Objetos Comunes, Elementales y Bonificación de Skills

El equipamiento en *Realm of Kingdoms* se clasifica en 3 categorías de balance estricto:

#### 1. Objetos Comunes (Common Gear)
* **Función:** Armaduras, armas y escudos estándar sin efectos mágicos ni resistencias especiales.
* **Propósito:** Progresión base de farmeo y supervivencia diaria (Sets de Cuero, Bronce, Hierro, Acero).
* **Obtención:** Venta directa en tiendas de NPCs de la ciudad por **KC** y drops habituales de monstruos básicos en los pasillos.
* **Ejemplo:** *Cota de Hierro (`Arm 8`), Espada Larga (`Atk 24, Def 16`), Arco Simple (`Atk 18`).*

#### 2. Armaduras Elementales Universales (General Elemental Gear)
* **Función:** Piezas de equipo que otorgan **porcentajes de protección elemental** utilizables por **todas las clases** que cumplan el nivel requerido.
* **Propósito:** Permiten que cualquier jugador se prepare para cacerías en biomas extremos (cuevas de fuego, criptas oscuras o pantanos venenosos).
* **Ejemplo:**
  * *Capa del Glaciar:* `Arm 9 • +15% Protección contra Hielo` (equipable por Knight, Paladin, Mage, Healer).
  * *Escudo de Escamas de Dragón:* `Def 28 • +12% Protección contra Fuego • -5% Debilidad a Hielo`.
  * *Amuleto del Pantano:* `+20% Resistencia contra Veneno`.

#### 3. Armaduras Específicas de Clase y Bonificación de Skills (Class-Specific & Skill Boost Gear)
Son las piezas más codiciadas y de mayor valor económico en el mercado, ya que **potencian directamente las estadísticas de combate de cada vocación**:
* 🛡️ **Para Knight:**
  * Armaduras pesadas de placas y escudos de torre que potencian su bloqueo y melé.
  * *Ejemplo:* *Armadura del Coloso:* `Arm 16 • +3 Shielding • +2 Melee Fighting` (Solo Knight).
* 🏹 **Para Paladin:**
  * Cotas ligeras de tirador, grebas ágiles y arcos mágicos que potencian su daño y puntería a larga distancia.
  * *Ejemplo:* *Cota del Cazador Sombrío:* `Arm 12 • +4 Distance Fighting • +5% Velocidad de Movimiento` (Solo Paladin).
* 🔥 **Para Mage:**
  * Túnicas y capuchas arcanas imbuidas en energía elemental que amplifican el poder mágico.
  * *Ejemplo:* *Túnica de la Ignición Arcana:* `Arm 7 • +2 Magic Level • +10% Daño de Fuego` (Solo Mage).
* 💚 **Para Healer:**
  * Vestiduras sagradas que incrementan su nivel mágico y su capacidad de bloqueo para no caer en combate mientras sana.
  * *Ejemplo:* *Manto del Sumo Sacerdote:* `Arm 10 • +2 Magic Level • +2 Shielding • +15% Potencia de Curación` (Solo Healer).

---

### 🗝️ 13. Sistema de Farmeo de Cofres de Bosses y Llaves de Mazmorra

Los mejores tesoros del juego no son de un solo uso; **se farmean activamente cazando Bosses**:

#### 1. Probabilidad de Spawn del Cofre al derrotar al Boss (Boss Chest Chance)
* Cuando una party o jugador derrota al Boss final de un mapa o mazmorra:
  * El Boss suelta su botín y **KC** normales.
  * Además, existe una **probabilidad (chance)** de que aparezca un **Cofre del Tesoro del Boss (Boss Chest)** en el centro de la sala.
  * Cuando aparece, surge un destello dorado y un anuncio local: *«¡Un Cofre del Tesoro Ancestral ha emergido de los restos del Jefe!»*.
  * Si la suerte no acompaña en esa cacería, el cofre simplemente no aparece, obligando a los jugadores a volver a prepararse para enfrentarlo de nuevo.

#### 2. Apertura con Llaves de Mazmorra (Key Farming)
* El cofre aparece cerrado con cerradura y requiere la **Llave de Mazmorra / Boss** correspondiente para abrirse.
* **¿Cómo se consiguen las llaves?**
  * Farmeando mini-bosses y guardianes previos en los pasillos del mapa.
  * Como recompensas de misiones del reino.
  * O como drop especial previo.
* **Uso y Recompensa:**
  * El jugador que posee la llave interactúa con el cofre: **la llave se consume** y el cofre se abre liberando el loot más codiciado:
    * Armaduras exclusivas con **bonificación de Skills** (`+Distance`, `+Shielding`, `+Magic Level`).
    * Armas elementales de alto grado.
    * Mochilas de mayor capacidad (28, 32 o 40 casillas).
    * Grandes cantidades de **KC**.

#### 3. Bucle de Farmeo Infinito (Grinding Dinámico)
* **100% Rejugable y Farmeable:** No hay límites artificiales de una sola vez. Cada vez que el clan o la party organiza una cacería y vence al Boss, tienen la emoción de ver si sale el cofre y de gastar sus llaves acumuladas para obtener mejor equipo.

---

### 👑 14. Clasificación Oficial de Bosses (Los 8 Tipos de Jefes)

Para garantizar diversidad de juego, contenido diario, economía controlada y guerras a gran escala, *Realm of Kingdoms* cuenta con 8 arquetipos de jefes:

#### 1. Bosses de Tarea (`Task Bosses`)
* **Mecánica:** Un NPC cazador en la ciudad otorga tareas (ej. *«Elimina 300 Slimes del Pantano»*).
* **Acceso:** Al completar la cuota, el NPC entrega un pase especial a la guarida del Boss de Task.
* **Recompensa:** Puntos de reputación de cazador, **KC** y probabilidad de soltar cofres de mazmorra.

#### 2. Bosses Diarios (`Daily Bosses`)
* **Mecánica:** Jefes diseñados para completarse en party con un tiempo de enfriamiento (cooldown) fijo de **20 horas**.
* **Propósito:** Mantener el hábito de conexión diaria de los jugadores y sus amigos para conseguir materiales de forja y equipo intermedio.

#### 3. Bosses de Misión (`Quest Bosses`)
* **Mecánica:** Guardianes únicos situados al final de cadenas de acertijos, puertas con llaves o salas secretas.
* **Propósito:** Custodian accesos vitales de la historia y recompensas fijas de progresión.

#### 4. Bosses de Evento (`Event Bosses`)
* **Mecánica:** Jefes temporales que aparecen únicamente durante fechas festivas o eventos de temporada (Halloween, Navidad, Invasión del Dragón Dorado).
* **Propósito:** Sueltan ítems cosméticos, auras decorativas y títulos especiales para los participantes.

#### 5. Jefes de Mundo Abierto (`World Bosses`)
* **Mecánica:** Titanes legendarios que irrumpen por sorpresa en zonas abiertas de los mapas con un aviso global en pantalla: *«¡El Coloso del Ocaso ha descendido en las llanuras!»*.
* **Impacto Social & PvP:** Convocan a **más de 100 jugadores simultáneos en el mismo mapa**. Los clanes rivales colisionan en guerras de mundo abierto para dominar la zona, expulsar a los rivales y asegurar el botín supremo del cofre del World Boss.

#### 6. Jefes Guardianes de Mapa (`Gatekeeper Bosses`)
* **Mecánica:** Residen en la sala final de cada mapa (al fondo de los 3 pasillos).
* **Propósito:** **Custodian el Portal de transición hacia el siguiente mapa** (ej. Mapa 1 ➔ Mapa 2).
* **Freno Natural:** Impide que los novatos se salten mapas; para entrar a la siguiente región se debe haber derrotado al guardián del mapa anterior.

#### 7. Mini-Bosses de Pasillo (`Rare Elite Spawns`)
* **Mecánica:** Mientras los jugadores farmean en los pasillos comunes, existe una probabilidad baja (1% a 2%) de que nazca un monstruo Élite (más corpulento, con aura luminosa y mayor vida).
* **Rol Económico:** **Son la fuente principal de Llaves de Mazmorra** necesarias para abrir los cofres de los jefes grandes.

#### 8. Jefes de Santuario de Clan (`Guild Raid Bosses` - Sumidero Anti-Inflación)
* **Mecánica:** Jefes privados invocables únicamente por el líder de un clan en el Altar de su Santuario.
* **Mecanismo Económico (Quema de KC):**
  * Para invocarlo, el servidor **cobra y destruye ("quema") una cantidad fijada de KC** de la bóveda del clan (ej. `3 KC` [30,000 Coins], `6 KC` [60,000 Coins] o `15 KC` [150,000 Coins] según el rango del jefe).
  * **Retiro de Moneda:** Actúa como el sumidero de economía oficial (*Gold Sink*), retirando decenas de miles de Coins del mercado para evitar la inflación.
* **Experiencia de Hermandad:** Es un combate privado para los 30 a 80 miembros del gremio, libre de ataques o interrupciones de clanes rivales, recompensando el esfuerzo cooperativo del clan.

---

### 💎 15. Sistema de Gemas y Bendición Instantánea (Blessing)

Las **Gemas** representan la moneda de conveniencia y tienda del reino:
* **Comercio Legal y Seguro:** Las Gemas se pueden comprar en la tienda oficial o comerciar libremente en el mercado por **Coins o KC**. Así los jugadores free-to-play pueden adquirir servicios de gemas jugando gratis, y quienes compran gemas obtienen dinero in-game de forma legítima.
* **Coste Escalonado de la Bless en el Templo (NPC):**
  * Nivel 1 a 30: `500 Coins` (accesible para novatos).
  * Nivel 31 a 70: `2,500 Coins`.
  * Nivel 71 a 99: `5,000 Coins`.
  * Nivel 100+ (Tope): **`1 KC` (10,000 Coins)**.
* **Compra Rápida de Bless con Gemas (1 Click Remoto):**
  * Coste: **`50 Gemas`** fijas a cualquier nivel.
  * Permite restaurar la bendición al instante desde el menú sin necesidad de caminar hasta el Templo de la ciudad, ideal para retomar guerras de clanes y cacerías profundas de inmediato.

---

### 🐾 16. Sistema de Mascotas (Pets) y Auto-Loot

En *Realm of Kingdoms* **no existen monturas**; el compañero del aventurero son las **Mascotas (Pets)**:
* Acompañan al héroe caminando, flotando o volando a su lado en el plano 2.5D.
* **Categorías y Funcionalidad:**
  1. **Pet Básico (Compañía):** Reacciona a los ataques y añade vida visual al personaje (`300 Gemas` o misión del Entrenador en la ciudad + `1 KC`).
  2. **Pet Recolector (Auto-Loot de Coins):** **La función más cotizada.** Corretea de forma autónoma recogiendo automáticamente todas las Coins del suelo en un radio de 400px para que el jugador pelee sin detenerse (`600 Gemas` o drop raro de Mini-Boss de pasillo).
  3. **Pet Mítico (Compañero de Guerra):** Auto-loot de Coins + 6 casillas adicionales de alforja propia para guardar pociones/flechas + aura elemental decorativa (`1,000 Gemas`).

---

### 🦹 17. Sistema de Skins y Outfits (Prestigio Visual de Logro)

Las skins son **100% cosméticas** (Cero Pay-to-Win; no otorgan atributos de combate). El verdadero prestigio reside en **cómo se consiguen**:

#### Las 4 Vías de Obtención de Skins:
1. **Skins por Task (Gremio de Cazadores):**
   * Desbloqueadas al completar cadenas de tareas de caza masiva con el NPC de Tasks.
   * *Ejemplo:* *Atuendo del Maestro Rastreador* (se desbloquea tras completar 20 tareas de cazador y derrotar a 5 Task Bosses).
2. **Skins por Logros Épicos (Achievements):**
   * Reservadas para los mayores hitos alcanzados por los jugadores más dedicados.
   * *Ejemplos:*
     * *Armadura del Titán Trascendido:* Desbloqueada automáticamente al alcanzar el **Nivel 500**.
     * *Manto del Gran Señor de la Guerra:* Desbloqueada para miembros de clanes con más de 50 victorias oficiales en Guerras de Clanes.
     * *Túnica del Cartógrafo Ancestral:* Desbloqueada al descubrir todas las salas secretas del reino.
3. **Skins por Eventos de Temporada:**
   * Recompensas por participar en torneos PvP de fin de semana o festividades anuales (Halloween, Nochevieja, Invasión del Dragón Dorado).
4. **Skins de Tienda y Sastre Real:**
   * Diseños estéticos disponibles en la tienda de Gemas (`250 a 900 Gemas`) o crafteables con el Sastre de la ciudad entregando **KC** y materiales raros de recolección.

---

### 🏛️ 18. El Market Global (Casa de Subastas del Reino)

Para garantizar un comercio fluido sin requerir que los jugadores estén conectados simultáneamente:

#### 1. Mostrador Central de Comercio
* Ubicado en la plaza central de la ciudad inicial.
* **Ofertas de Venta (Sell Offers):** Cualquier jugador puede publicar armas, armaduras, consumibles de criaturas o mochilas fijando su precio en **Coins o KC** (ej. *Vendo Cota de Cazador por 2 KC*). La oferta permanece activa hasta que alguien la compre o el dueño la retire.
* **Ofertas de Compra (Buy Offers):** Los jugadores pueden dejar solicitudes automáticas de compra de materiales (ej. *Compro Dientes de Vampiro a 150 Coins cada uno, cantidad: 50*).
* **Depósito Automático:** Las ganancias de las ventas se transfieren de forma directa y segura a la cuenta bancaria del jugador, incluso si este se encuentra desconectado.

#### 2. Tasa de Mercado (Market Fee - Mecanismo Anti-Especulación)
* El banco cobra una tasa del **1%** del valor de la transacción al publicar una oferta.
* Esto previene el spam de ofertas absurdas y actúa como un sumidero constante de Coins para sanear la economía.

---

### 🔮 19. Sistema Completo de Imbuis (Imbuements) y Productos de Criaturas

Los **Imbuis** permiten encantar temporalmente las piezas de equipo en el Altar de Forja Mágica usando **Productos de Criaturas (Creature Products)**:

#### 1. Los 4 Pilares de Imbuición:

1. 🛡️ **Imbuis de Protección Elemental (Defensivos en Armadura y Escudo):**
   * Reducen directamente el daño recibido de un elemento específico:
     * *Protección a Fuego (Fire Shielding):* +5%, +10%, +15% reducción (requiere *Escamas de Dragón*).
     * *Protección a Hielo (Ice Shielding):* +5%, +10%, +15% reducción (requiere *Corazón Helado*).
     * *Protección a Energía (Energy Shielding):* +5%, +10%, +15% reducción (requiere *Polvo Electrificado*).
     * *Protección a Tierra / Veneno (Earth Shielding):* +5%, +10%, +15% reducción (requiere *Glándula Tóxica*).
     * *Protección a Muerte / Sombra (Death Shielding):* +5%, +10%, +15% reducción (requiere *Hueso Espectral*).
     * *Protección Sagrada (Holy Shielding):* +5%, +10%, +15% reducción (requiere *Esencia Solar*).

2. 📈 **Imbuis de Skills (Bonificación Directa a Estadísticas en Casco y Armadura):**
   * Aumentan los Skills de combate del personaje durante la cacería:
     * 🏹 **Precision Boost (Paladin):** `+2, +4 Distance Fighting` (requiere *Plumas de Halcón Sagrado*).
     * 🛡️ **Shielding Boost (Knight / Paladin):** `+2, +4 Shielding` (requiere *Placas de Caparazón de Quelonio*).
     * ⚔️ **Chop / Slash Boost (Knight):** `+2, +4 Melee Fighting` (requiere *Garras de Oso Sangriento*).
     * ✨ **Epiphany Boost (Mage / Healer):** `+1, +2 Magic Level` (requiere *Polvo de Elfo Místico*).

3. 🩸 **Imbuis de Sustento (Leech y Crítico en Armas y Cascos):**
   * 🩸 *Vampirismo (Life Leech):* Convierte del 5% al 12% del daño infligido en curación instantánea propia (requiere *Dientes de Vampiro*).
   * 🔷 *Vacío (Mana Leech):* Convierte del 3% al 8% del daño infligido en Maná restaurado (requiere *Cuerdas Vocales de Banshee*).
   * ⚡ *Golpe Crítico (Critical Strike):* Otorga +10% de probabilidad de infligir +50% de daño crítico (requiere *Ojo de Cíclope*).

4. 🔥 **Imbuis de Conversión Elemental (Ofensivos en Armas):**
   * Transforma el 25% o 50% del daño físico del arma en daño de Fuego, Hielo o Energía para explotar la debilidad del monstruo que se está cazando.

#### 2. Duración y Ranuras de Equipo
* Las armas y armaduras avanzadas poseen de **1 a 3 ranuras de imbuición**.
* **Duración:** Cada imbuición otorga **20 horas de combate activo**. El tiempo solo se consume cuando el jugador está atacando o recibiendo daño en combate.
* **Impacto Económico:** Otorga un valor incalculable a los monstruos de nivel bajo y medio, permitiendo que jugadores principiantes ganen buen dinero en el Market vendiendo materiales de criaturas a jugadores de nivel alto.

---

### 🌀 20. Sistema de Accesos a Zonas Especiales (Quest Access)

Los mapas más lucrativos y peligrosos del reino no son accesibles caminando libremente; requieren demostrar el derecho de entrada:

#### 1. Portales con Barrera Ancestral
* Las entradas a islas prohibidas, catacumbas profundas o santuarios de bosses están bloqueadas por vórtices sellados.
* Si un jugador no ha desbloqueado el acceso e intenta atravesarlo, la barrera lo expulsa: *«Una fuerza invisible te rechaza. No posees el conocimiento ancestral para cruzar este vórtice»*.

#### 2. Mecanismos de Desbloqueo de Acceso:
1. **Entrega de Materiales de Tributo:** Entregar un lote de productos de criaturas al sacerdote o arqueólogo que investiga la zona para estabilizar el portal.
2. **Prueba de Valentía (Mini-Boss Gatekeeper):** Derrotar al guardián que vigila la entrada exterior para obtener la *Marca de Paso*.
3. **Misiones de Sabiduría:** Resolver acertijos en el entorno y accionar palancas en orden específico.
* **Resultado:** Una vez completado el acceso, el portal se vuelve verde y el jugador tiene entrada permanente y libre a esa región.

