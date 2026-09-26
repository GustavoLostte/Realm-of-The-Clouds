-- ==============================================================================
-- SOLUCIÓN INMEDIATA PARA ERROR 23505 (DUPLICADOS EXISTENTES DE "Lord King")
-- Ejecuta este script directamente en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Purgar bots y cuentas ficticias de prueba
DELETE FROM public.kingdom_saves
WHERE is_bot = TRUE 
   OR id LIKE 'bot_%' 
   OR id LIKE 'lb_%' 
   OR id = 'test_real_check'
   OR player_name IN ('Bot Novicio', 'Señor Feudal', 'Lord Soberano');

-- 2. Deduplicar nombres repetidos en kingdom_saves:
-- Conserva únicamente la partida con mayor nivel de reino o fecha más reciente,
-- y elimina todas las demás copias repetidas de 'Lord King' u otros nombres de prueba:
DELETE FROM public.kingdom_saves a
USING public.kingdom_saves b
WHERE a.id != b.id
  AND LOWER(TRIM(a.player_name)) = LOWER(TRIM(b.player_name))
  AND (
    (a.kingdom_level < b.kingdom_level)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at < b.updated_at)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at = b.updated_at AND a.ctid < b.ctid)
  );

-- 3. Deduplicar correos repetidos en kingdom_saves si los hubiera:
DELETE FROM public.kingdom_saves a
USING public.kingdom_saves b
WHERE a.id != b.id
  AND a.player_email IS NOT NULL AND TRIM(a.player_email) != ''
  AND b.player_email IS NOT NULL AND TRIM(b.player_email) != ''
  AND LOWER(TRIM(a.player_email)) = LOWER(TRIM(b.player_email))
  AND (
    (a.kingdom_level < b.kingdom_level)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at < b.updated_at)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at = b.updated_at AND a.ctid < b.ctid)
  );

-- 4. Purgar bots y duplicados en leaderboard
DELETE FROM public.leaderboard 
WHERE id LIKE 'lb_%' 
   OR id LIKE 'bot_%' 
   OR id = 'test_real_check' 
   OR is_bot = TRUE 
   OR player_name IN ('Señor Feudal', 'Lord Soberano', 'Soberano Real', 'Bot Novicio');

DELETE FROM public.leaderboard a
USING public.leaderboard b
WHERE a.id != b.id
  AND LOWER(TRIM(a.player_name)) = LOWER(TRIM(b.player_name))
  AND (
    (a.military_power < b.military_power)
    OR (a.military_power = b.military_power AND a.updated_at < b.updated_at)
    OR (a.military_power = b.military_power AND a.updated_at = b.updated_at AND a.ctid < b.ctid)
  );

-- 5. Crear los índices únicos ahora que la base de datos está perfectamente limpia
CREATE UNIQUE INDEX IF NOT EXISTS uq_kingdom_saves_email_lower 
ON public.kingdom_saves (LOWER(TRIM(player_email))) 
WHERE player_email IS NOT NULL AND TRIM(player_email) != '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_kingdom_saves_player_name_lower 
ON public.kingdom_saves (LOWER(TRIM(player_name))) 
WHERE is_bot = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_leaderboard_player_name_lower 
ON public.leaderboard (LOWER(TRIM(player_name))) 
WHERE is_bot = FALSE;
