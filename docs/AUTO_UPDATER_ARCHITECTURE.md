# 🔄 Realm of Kingdoms — Arquitectura del Sistema de Auto-Actualización (OTA & Auto-Patcher)

Documento técnico de diseño para el sistema de actualizaciones automáticas del cliente y Launcher de **Realm of Kingdoms (WizzarDev Studios)**.

---

## 🎯 Objetivo
Garantizar que el jugador descargue el Launcher **una sola vez** (~13 MB) y que todas las actualizaciones futuras de contenido, balance, mapas y personajes se apliquen **automáticamente en segundo plano sin reinstalar ejecutables**.

---

## 🏗️ Flujo de Comprobación y Parcheo

```text
┌─────────────────────────┐
│ Jugador abre el Launcher│
└────────────┬────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Consulta HTTP: GET /api/game/version         │
└────────────────────┬─────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌──────────────────────────────────┐
│ Versión Coincide│     │ Versión Desactualizada           │
│ (v1.0.0 = v1.0.0│     │ (Local: v1.0.0 vs Server: v1.0.1)│
└────────┬────────┘     └────────────────┬─────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐     ┌──────────────────────────────────┐
│ Botón ORO Activo│     │ Botón: [ ACTUALIZANDO... 0% - 100% ]
│ [ JUGAR AHORA ] │     │ Descarga delta de assets nuevos  │
└─────────────────┘     └────────────────┬─────────────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ [ JUGAR AHORA ] │
                                └─────────────────┘
```

---

## 📡 Endpoints del Backend (`server/`)

### 1. `GET /api/game/version`
Respuesta esperada del servidor autoritario:
```json
{
  "latest_version": "1.0.1",
  "min_required_version": "1.0.0",
  "maintenance_mode": false,
  "patch_notes_url": "/api/game/patch-notes/latest",
  "bundle_url": "https://cdn.realmofkingdoms.com/patches/v1.0.1.tar.gz",
  "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## ⚙️ Métodos de Implementación

### Método 1: OTA Webview Cache (In-App Hot Patching)
* El Launcher descarga los bundles modificados directamente a la carpeta local de datos del usuario (`AppData` en Windows / `Application Support` en macOS).
* Los cambios de lógica, balances y assets ligeros se aplican en 3 segundos sin tocar el ejecutable nativo.

### Método 2: Tauri Native Auto-Updater (`@tauri-apps/plugin-updater`)
* Se utiliza para actualizar el motor Rust mismo si se modifican permisos nativos, aceleración de video o librerías de sistema.
* Utiliza firmas criptográficas ed25519 para máxima seguridad anti-tamper.

---

> *Este documento queda guardado y listo para ser implementado cuando terminemos el diseño y maquetado de las vistas del Launcher.*
