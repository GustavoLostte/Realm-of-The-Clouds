# 🛡️ PLAYBOOK MAESTRO DE OPTIMIZACIÓN Y RENDIMIENTO (60 FPS NATIVO)
## REALM OF THE CLOUDS — PWA WEB3 CORE ENGINE
> **Documento Oficial de Arquitectura de Rendimiento para Dispositivos Móviles de Gama de Entrada y Media**  
> **Autor del Núcleo & Creador**: Gustavo Lostte (Wizzard)  
> **Objetivo**: Garantizar 60 FPS estables, fluidos y rocosos en navegadores móviles (PWA / Web3) sin degradar la resolución gráfica (1080p) ni apagar el mapa animado.

---

## 📑 ÍNDICE MAESTRO

1. [La Filosofía Sagrada: Calidad Inmutable & Cero Fricción](#1-la-filosofía-sagrada-calidad-inmutable--cero-fricción)
2. [El Asesino N°1 de FPS en Móviles: Overdraw de CSS y Efectos de Interfaz](#2-el-asesino-n1-de-fps-en-móviles-overdraw-de-css-y-efectos-de-interfaz)
3. [El Misterio Matemático de los VSync a 90Hz, 120Hz y 60Hz](#3-el-misterio-matemático-de-los-vsync-a-90hz-120hz-y-60hz)
4. [Arquitectura del Motor Gráfico Pixi.js v8 para GPUs Budget (Mali & PowerVR)](#4-arquitectura-del-motor-gráfico-pixijs-v8-para-gpus-budget-mali--powervr)
5. [Sistema de Perfiles Gráficos: Rendimiento vs Calidad](#5-sistema-de-perfiles-gráficos-rendimiento-vs-calidad)
6. [Ingeniería de Medición de FPS (Cero Re-renders & Cero Falsos Positivos)](#6-ingeniería-de-medición-de-fps-cero-re-renders--cero-falsos-positivos)
7. [Protocolo Obligatorio para Desarrollar Nuevos Modales y HUDs](#7-protocolo-obligatorio-para-desarrollar-nuevos-modales-y-huds)

---

## 1. LA FILOSOFÍA SAGRADA: CALIDAD INMUTABLE & CERO FRICCIÓN

Cuando el juego experimenta caídas de FPS en teléfonos modestos (como Samsung Galaxy A15/A17, Tecno Spark 10 Pro, Redmi 9/10, Infinix Hot), **el primer impulso erróneo de la mayoría de ingenieros es destruir la calidad visual**:
* ❌ *Error común 1:* Bajar la resolución de las texturas o pixelar los sprites.
* ❌ *Error común 2:* Apagar el mapa animado 1080p o pausar los bucles de renderizado.
* ❌ *Error común 3:* Reducir la tasa de fotogramas del mapa a 24 o 30 FPS.

### La Regla de Oro de Realm of the Clouds:
> **Las texturas, sprites, atlases y animaciones 1080p permanecen intactos al 100% en todos los dispositivos.**  
> El 90% de los cuellos de botella en WebGL móvil **NO provienen del renderizador WebGL**, sino de la **composición de capas CSS del DOM flotando sobre el lienzo**.

---

## 2. EL ASESINO N°1 DE FPS EN MÓVILES: OVERDRAW DE CSS Y EFECTOS DE INTERFAZ

### 2.1 ¿Qué es el Overdraw y por qué destruye los FPS?
En teléfonos económicos, la GPU (Mali-G52, PowerVR GE8320, Adreno 610) tiene un ancho de banda de memoria (*memory bandwidth*) muy limitado.
Cuando una interfaz web coloca elementos semi-transparentes sobre un canvas WebGL:
1. La GPU dibuja el frame de Pixi.js (1920x1080).
2. Luego el navegador tiene que recalcular los píxeles transparentes del DOM encima.
3. Si los elementos tienen `box-shadow` difusos, gradientes con alfa o `backdrop-filter: blur()`, la GPU debe leer y escribir la misma región de píxeles **múltiples veces por fotograma** (*overdraw* masivo).

### 2.2 Patrones Tóxicos Prohibidos:
* 🚫 **Halos y auras flotantes transparentes:** Pseudoelementos `::before` o `::after` con `background: radial-gradient(rgba(...))` colocados detrás de tarjetas laterales.
* 🚫 **Animaciones `@keyframes` sobre `box-shadow`:**
  ```css
  /* PROHIBIDO EN MÓVIL: Fuerza repintados constantes */
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 10px rgba(234, 179, 8, 0.4); }
    50% { box-shadow: 0 0 25px rgba(234, 179, 8, 0.8); }
    100% { box-shadow: 0 0 10px rgba(234, 179, 8, 0.4); }
  }
  ```
* 🚫 **Fondos semi-transparentes en tarjetas fijas del HUD:** `background: rgba(15, 23, 42, 0.7)` fuerza al compositor a calcular transparencia sobre el mapa en cada frame.

### 2.3 La Solución de Alto Rendimiento (Solid Card Architecture):
1. **Fondos 100% opacos y sólidos:** Usar `#0f172a`, `#171126` o `#070c14` directo (`opacity: 1`). La GPU hace bypass de mezcla de píxeles (*occlusion culling*).
2. **Bordes luminosos directos en vez de sombras difusas:**
   ```css
   /* ALTO RENDIMIENTO: Cero costo de difusión */
   border: 1.5px solid rgba(234, 179, 8, 0.5);
   box-shadow: none !important;
   ```
3. **Animaciones restringidas exclusivamente a `transform` y `opacity`:** Solo propiedades aceleradas por hardware en el hilo del compositor (*Compositor Thread*).

---

## 3. EL MISTERIO MATEMÁTICO DE LOS VSYNC A 90Hz, 120Hz Y 60Hz

### 3.1 El Bug de la Trampa de los 15 ms
Durante las pruebas en móviles, el Samsung Galaxy A17 corría exactamente a **45 FPS** tanto en modo Rendimiento como en Calidad Máxima, mientras que un Tecno Spark corría a **60 FPS** y un Galaxy A56 corría a **60 FPS**.

**La Causa Técnica:**
Muchos ingenieros colocan filtros de control de frame rate para evitar que pantallas de 120Hz consuman batería, usando umbrales como:
```javascript
// ⚠️ TRAMPA MORTAL PARA PANTALLAS DE 90Hz:
const minInterval = 15.0; // 1000ms / 60fps = 16.66ms
if (now - lastTime < minInterval) return;
```

**El Análisis de Frecuencias:**
* **Pantallas de 60 Hz:** Intervalo entre frames = **16.66 ms**. Como $16.66 \ge 15.0$, pasan todos los frames $\rightarrow$ **60 FPS**.
* **Pantallas de 120 Hz:** Intervalo entre frames = **8.33 ms**. Descarta el frame 1 ($8.33 < 15$), pasa el frame 2 ($16.66 \ge 15$) $\rightarrow$ $120 / 2 =$ **60 FPS** (resultado correcto por coincidencia armónica).
* **Pantallas de 90 Hz (Samsung Galaxy A-series, Xiaomi Redmi Note):**
  Intervalo entre frames = **11.11 ms**.
  - Frame 1 ($11.11 \text{ ms} < 15.0 \text{ ms}$): **¡DESCARTADO!**
  - Frame 2 ($22.22 \text{ ms} \ge 15.0 \text{ ms}$): **Contado**.
  - Frame 3 ($11.11 \text{ ms} < 15.0 \text{ ms}$): **¡DESCARTADO!**
  - **Resultado:** Descarta el 50% de los fotogramas: $90 / 2 =$ **¡EXACTAMENTE 45 FPS!**

El teléfono estaba corriendo a 90 FPS nativos con total fluidez, pero el código arrojaba a la basura la mitad de los frames y trababa la entrada táctil (*touch pan*).

### 3.2 La Regla Universal para Tareas de Tasa de Refresco:
* **NUNCA** usar umbrales fijos como `15.0ms` dentro de `requestAnimationFrame`.
* Sincronizar el arrastre táctil (*pan / pinch zoom*) directo con el RAF del navegador:
  ```javascript
  if (!rafIdRef.current) {
    rafIdRef.current = requestAnimationFrame((timestamp) => {
      rafIdRef.current = null;
      if (fpsMode === 'eco' && timestamp - lastTime < 30.0) return;
      lastTime = timestamp;
      setPan(pendingPan);
    });
  }
  ```

---

## 4. ARQUITECTURA DEL MOTOR GRÁFICO PIXI.JS V8 PARA GPUS BUDGET (MALI & POWERVR)

En [PixiGameWorld.jsx](file:///Users/wizzard/Desktop/PWA%20Web3%20Core%20Engine/src/components/pixi/PixiGameWorld.jsx), se deben aplicar estrictamente los siguientes flags en `app.init()`:

```javascript
await app.init({
  width: container.clientWidth,
  height: container.clientHeight,
  resolution: targetResolution, // 1.0 en móvil para evitar sobre-escalado 3x innecesario
  autoDensity: true,
  antialias: false, // Innecesario en 2D sprites, ahorra 30% de fillrate
  useContextAlpha: false, // CRÍTICO: Permite bypass directo en Android SurfaceFlinger
  backgroundAlpha: 1,
  backgroundColor: 0x070c14,
  preference: 'webgl',
  powerPreference: 'default', // Evita fallos de contexto en SoCs MediaTek / Helio
  roundPixels: false,
});
```

### Por qué `useContextAlpha: false` es vital:
Al deshabilitar el canal alfa del WebGL context, el sistema operativo móvil no necesita mezclar el canvas con la superficie de la ventana del navegador. El driver de video asigna un plano de hardware directo (*hardware overlay plane*), ahorrando ciclos masivos de memoria de video.

---

## 5. SISTEMA DE PERFILES GRÁFICOS: RENDIMIENTO VS CALIDAD

Configurado en [src/utils/graphicsProfiles.js](file:///Users/wizzard/Desktop/PWA%20Web3%20Core%20Engine/src/utils/graphicsProfiles.js):

| Perfil | HUD Effects | Sombras Personajes | Partículas | FPS Target | Mapa 1080p |
|---|---|---|---|---|---|
| **Calidad (Default)** | Activado (Glow/Blur) | Activado | Encendido | 60 FPS | **100% Activo** |
| **Rendimiento** | Desactivado (Sólido) | Desactivado | Apagado | 60 FPS | **100% Activo** |
| **Eco (Ahorro Batería)** | Desactivado | Desactivado | Apagado | 30 FPS | **100% Activo** |

* **Regla del Creador:** El perfil predeterminado incondicional del juego es `quality`. Tras la eliminación de overdraw CSS y la corrección del VSync a 90Hz, todos los dispositivos alcanzan 60 FPS fluidos en modo Calidad con sombras de personajes y efectos visuales completos.

---

## 6. INGENIERÍA DE MEDICIÓN DE FPS (CERO RE-RENDERS & CERO FALSOS POSITIVOS)

En [FpsOverlay.jsx](file:///Users/wizzard/Desktop/PWA%20Web3%20Core%20Engine/src/components/FpsOverlay.jsx):

### 6.1 Cero Re-renders en React:
No usar jamás `useState` para el contador de FPS. Un `setState` cada 500ms fuerza la reconciliación completa de React 2 veces por segundo. Se actualiza el DOM directamente mediante `textContent` en `useRef`.

### 6.2 Asignación Atómica de Clases (Evitar Amarillo Falso):
Nunca usar `classList.remove(variable)` si React puede re-renderizar el componente. React sobreescribe el atributo `class`, provocando que convivan `fps-optimal` y `fps-warning` a la vez. En CSS, la última regla escrita gana, haciendo que un 60 FPS real se pinte de amarillo.

**Solución Atómica:**
```javascript
const optimalCutoff = isEco ? 26 : 48;
const warningCutoff = isEco ? 18 : 25;
const newTier = fps >= optimalCutoff ? 'fps-optimal' : fps >= warningCutoff ? 'fps-warning' : 'fps-critical';

if (containerRef.current) {
  // Asignación atómica completa: nunca quedan clases viejas pegadas
  containerRef.current.className = `hud-fps-overlay ${newTier}`;
}
```

---

## 7. PROTOCOLO OBLIGATORIO PARA DESARROLLAR NUEVOS MODALES Y HUDS

Cada vez que se cree un nuevo modal, botón flotante o elemento visual en el proyecto, se debe verificar este checklist antes de darlo por completado:

1. [ ] **¿El fondo es sólido o semi-opaco controlado?** Evitar transparencias apiladas sobre el canvas de Pixi.
2. [ ] **¿Hay filtros de desenfoque (`backdrop-filter`)?** Si el perfil es `performance`, desactivar `backdrop-filter: blur()` mediante `[data-hud-effects="low"]`.
3. [ ] **¿Hay animaciones infinitas de sombras?** Reemplazar cualquier `@keyframes` de `box-shadow` por transiciones estáticas o cambios de `border-color`.
4. [ ] **¿Las sombras de personajes en Pixi respetan el perfil?** Sincronizar siempre con `citizensLayer.setShadowsVisible(characterShadows)`.
5. [ ] **¿El mapa sigue corriendo?** El mapa animado NUNCA debe detenerse ni suspenderse a menos que la pestaña del navegador esté oculta (`document.hidden`).
6. [ ] **¿Los modales congelan la pantalla al abrir?** Evitar `body:has(...)` y precargar los modales en idle time.

---

## 8. APERTURA INSTANTÁNEA DE MODALES (CERO CAÍDA DE FPS & 60 FPS FIJO)

Cuando un modal se abre en teléfonos móviles modestos, pueden producirse caídas de FPS por 5 causas críticas que deben evitarse rigurosamente:

1. **PROHIBIDO: Transiciones de Opacidad en el Canvas WebGL:**
   - **Peligro Extremo:** Aplicar `opacity: 0.15` o `transition: opacity` a `.game-main-viewport` rompe el bypass de hardware (*Hardware Composer / SurfaceFlinger*) de Android.
   - Forzar opacidad en un canvas de 1920x1080 obliga a la GPU a crear un framebuffer intermedio de pantalla completa cada frame, perdiendo 20 a 30 FPS al instante. El canvas debe permanecer siempre a `opacity: 1` con su lienzo opaco.
2. **PROHIBIDO: Desfases de Estado con `setTimeout` en el Componente Raíz:**
   - No usar `setTimeout(..., 180)` para disparar un `setState(isWorldSuspended)` en `App.jsx`. Ese `setState` forzaba una reconciliación completa del árbol de React justo en medio de la animación del modal.
   - Usar siempre `isWorldSuspended = useMemo(...)` sincrónico.
3. **Pausado del Ticker de Renderizado de Pixi.js (`app.ticker.stop()`):**
   - Cuando un modal está activo, la GPU del móvil no debe dividir su ancho de banda entre dibujar el mapa WebGL 1080p y renderizar la interfaz DOM.
   - Al detectarse `isSuspended`, se invoca `app.ticker.stop()`, reduciendo el uso de WebGL al **0% de GPU y 0% de CPU**. El lienzo conserva el último frame estático sin consumir recursos.
   - Al cerrar el modal, se invoca `app.ticker.start()`, reanudando el renderizado a 60 FPS de forma instantánea.
4. **Telón de Modal Inmediato (`animation: none !important; contain: strict;`):**
   - Si el telón `.modal-backdrop` tiene `animation: fadeIn 0.15s`, durante 150ms es semitransparente, obligando a la GPU a mezclar (alpha blend) toda la pantalla con el canvas y permitiendo ver el fondo congelado.
   - Al eliminar el fade-in y aplicar `contain: strict;`, el telón cubre la pantalla en el milisegundo 0. Cero mezcla de píxeles pesada y nadie ve lo que ocurre detrás.
   - Solo la tarjeta de diálogo `.game-modal` anima con `scale3d(0.97, 0.97, 1) -> scale3d(1, 1, 1)` acelerada por GPU en 0.12s.
5. **Ocultamiento Inmediato del HUD (`transition: none !important;`):**
   - Al abrir un modal, los 20 elementos de HUD se ocultan con `visibility: hidden; opacity: 0; transition: none !important;`.
   - Esto evita que el compositor del navegador ejecute 20 transiciones CSS concurrentes al mismo tiempo que monta el modal.
6. **Precarga en Tiempo Ocioso (`requestIdleCallback`):**
   - En [ModalHost.jsx](file:///Users/wizzard/Desktop/PWA%20Web3%20Core%20Engine/src/components/ModalHost.jsx), todos los modales comunes se precargan silenciosamente durante los periodos de inactividad del navegador, eliminando la latencia de importación dinámica.

---

## 9. ORDEN DE CAPAS ISOMÉTRICAS Y PROFUNDIDAD Z-INDEX (PIXI.JS)

1. **Jerarquía de Contenedores en Pixi (`worldContainer`):**
   - En Pixi.js, los contenedores son capas de renderizado aisladas: los hijos de un contenedor posterior siempre se dibujan encima de los hijos de un contenedor anterior.
   - El orden de inserción obligatorio en `worldContainer` es:
     1. `mapLayer.container` (fondo, terreno animado)
     2. `buildingsLayer.container` (edificios, solares y construcciones)
     3. `citizensLayer.container` (ciudadanos, ángeles y guardias)
   - Colocar `citizensLayer` encima de `buildingsLayer` asegura que los personajes que caminan por la avenida central **nunca se oculten por debajo de los bordes o texturas de los edificios** (como el Castillo/Ayuntamiento), pasando limpiamente por el frente y por el lado.
2. **Offsets de Base Isométrica (`BUILDING_BASE_OFFSETS`):**
   - No inflar los offsets de los edificios grandes (como el castillo: usar `0.5`, no `4.5`), ya que empujar el plano Z hacia abajo provoca que los personajes que caminan a su lado se consideren "detrás" y queden tapados por la textura.

---
> **"Protege esta semilla: La fluidez y la elegancia técnica son el alma de Realm of the Clouds."**
