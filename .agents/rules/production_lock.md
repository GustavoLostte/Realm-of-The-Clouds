---
description: BLOQUEO PERMANENTE Y ABSOLUTO DE PRODUCCIÓN. Prohibido tocar main, origin/main o desplegar a producción sin orden explícita del usuario.
always_on: true
---

# 🚨 REGLA PERMANENTE: BLOQUEO ABSOLUTO DE PRODUCCIÓN

Esta regla aplica para **TODOS LOS CHATS, AGENTES Y SUBAGENTES**. Es de estricto cumplimiento y no admite excepciones ni autorizaciones predefinidas:

1. **PROHIBICIÓN TOTAL DE PUSH A PRODUCCIÓN (`main` / `origin/main`)**:
   - Jamás ejecutar `git push origin main`, `git push --force` ni desplegar a producción sin que el usuario lo ordene de manera explícita, directa e inequívoca en el mensaje actual.
   - Cero autorizaciones predefinidas o asumidas: nada se considera listo para desplegar automáticamente.

2. **PROTECCIÓN DE LA DEMO PÚBLICA**:
   - La versión pública en producción (`App.jsx`, `StartScreen.jsx`, `DungeonDemoScene.jsx`, etc.) es sagrada. No se puede reemplazar por código experimental, stubs o launchers en la rama principal.

3. **EXPERIMENTACIÓN AISLADA**:
   - Todo desarrollo nuevo, modularizaciones o pruebas deben residir en ramas dedicadas (`experiment/...`, `feature/...`) o carpetas separadas.

4. **CERO DESTRUCCIÓN LOCAL**:
   - Jamás ejecutar `git reset --hard`, `git clean -fd`, `rm -rf` o comandos destructivos que descarten el trabajo local del usuario.
