# Instrucciones Permanentes del Proyecto (AGENTS.md)

## 🚨 BLOQUEO ABSOLUTO DE PRODUCCIÓN

1. **NO TOCAR PRODUCCIÓN:**
   - Queda estrictamente prohibido hacer push a `main` / `origin/main` o disparar despliegues de producción (Vercel) en cualquier chat.
   - **CERO AUTORIZACIONES PREDEFINIDAS:** Ningún asistente, agente o subagente tiene permiso automático de subir a producción a menos que el usuario lo ordene de forma expresa, literal e inequívoca en ese momento exacto.

2. **PROTECCIÓN DE LA DEMO DE PRODUCCIÓN:**
   - La versión funcional con Kina, la mazmorra de Senda de Esporas, intro de WizzarDev Studios y pantalla con toque para entrar jamás debe alterarse en la rama de producción.

3. **CERO DESTRUCCIÓN DE ARCHIVOS LOCALES:**
   - Nunca ejecutar `git reset --hard`, `git checkout -- .`, `git clean -fd` ni eliminar archivos de trabajo local del usuario. Todo trabajo nuevo debe quedar en ramas de experimento o carpetas separadas.
