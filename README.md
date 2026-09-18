# 👑 Realm of Kingdoms

Motor progresivo de aplicaciones web y juegos de estrategia descentralizados (PWA + Web3) construido con **React 19**, **Vite 8**, soporte PWA offline-first y persistencia híbrida.

![Realm of the Clouds Logo](/public/assets/logo/logo.webp)

---

## ⚔️ Características Principales

- 🏰 **Gestión y Construcción del Feudo**: Construye y mejora castillos, cuarteles, minas de oro, canteras, almacenes y graneros con animaciones de construcción dinámicas.
- 🌾 **Producción y Cosechas en Tiempo Real**: Recolecta oro, madera, piedra y trigo con visualización de rendimientos y multiplicadores VIP.
- 🛡️ **Guarnición y Sistema Militar**: Recluta infantería, arqueros y comandantes imperiales para proteger tu soberanía.
- 🏆 **El Coliseo de los Soberanos (PvP)**: Asalta ciudadelas rivales, compara tu poderío militar y saquea recursos y coronas para ascender en la liga imperial.
- 📜 **Heraldo Real & Campaña**: Misiones de historia dinámicas y exploración territorial a través de biomas salvajes.
- 🔮 **Gran Academia (Árbol Tecnológico)**: Desbloquea investigaciones en ramas económica, militar y arcana.
- 🎲 **Bazar Imperial & Ruleta de la Fortuna**: Tiradas diarias y premios de recursos, gemas, pócimas y tropas.
- ☁️ **Persistencia en la Nube con Supabase**: Sincronización automática de progreso, recursos y clasificaciones globales.
- 📱 **Diseño Ergonómico Móvil & Desktop**: Soporte para pantallas táctiles, orientación horizontal bloqueada y adaptación responsiva de alta definición.

---

## 🛠️ Tecnologías

- **Frontend**: React 19, Vite 8, Vanilla CSS
- **Iconografía**: Lucide React
- **Base de Datos & Auth**: Supabase (`@supabase/supabase-js`)
- **Audio Engine**: Web Audio API con síntesis polifónica y efectos de sonido

---

## 🚀 Despliegue en Vercel

Este proyecto está 100% preconfigurado para Vercel:

1. Importa el repositorio en [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Variables de Entorno (Opcionales, cuentan con fallback automático):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
