-- ==============================================================================
-- REINO DE LAS NUBES: AETHERIA EMPIRES
-- Master Database Schema for Supabase Cloud (PostgreSQL)
--
-- REGLAS CLAVE:
-- 1. Ningún usuario puede repetir correo (LOWER case-insensitive UNIQUE).
-- 2. Ningún usuario puede repetir nombre de comandante (LOWER case-insensitive UNIQUE).
-- 3. Misiones (quests) guardadas en base de datos sin duplicados (player_id, quest_id UNIQUE).
-- 4. Ranking 100% libre de usuarios fantasma (solo jugadores reales de kingdom_saves).
-- ==============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PARTIDAS Y GUARDADO EN LA NUBE (Con restricción única de Email y Nombre)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.kingdom_saves (
    id TEXT PRIMARY KEY,
    player_email TEXT,
    player_name TEXT NOT NULL DEFAULT 'Lord King',
    kingdom_name TEXT NOT NULL DEFAULT 'Reino de las Nubes',
    kingdom_level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 400,
    military_power BIGINT NOT NULL DEFAULT 1200,
    avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si kingdom_saves ya existía previamente
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS player_email TEXT;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS player_name TEXT NOT NULL DEFAULT 'Lord King';
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS kingdom_name TEXT NOT NULL DEFAULT 'Reino de las Nubes';
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS kingdom_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS trophies INTEGER NOT NULL DEFAULT 400;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS military_power BIGINT NOT NULL DEFAULT 1200;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp';
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS game_state JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ==============================================================================
-- DEDUPLICACIÓN PREVIA OBLIGATORIA (Evita error 23505 duplicate key)
-- ==============================================================================

-- 1. Purgar bots y cuentas ficticias previas de kingdom_saves
DELETE FROM public.kingdom_saves
WHERE is_bot = TRUE 
   OR id LIKE 'bot_%' 
   OR id LIKE 'lb_%' 
   OR id = 'test_real_check'
   OR player_name IN ('Bot Novicio', 'Señor Feudal', 'Lord Soberano');

-- 2. DEDUPLICAR NOMBRES DE COMANDANTE EN KINGDOM_SAVES:
-- Si existen varias partidas con el mismo nombre (ej: 'Lord King'), conserva solo la más avanzada o reciente:
DELETE FROM public.kingdom_saves a
USING public.kingdom_saves b
WHERE a.id != b.id
  AND LOWER(TRIM(a.player_name)) = LOWER(TRIM(b.player_name))
  AND (
    (a.kingdom_level < b.kingdom_level)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at < b.updated_at)
    OR (a.kingdom_level = b.kingdom_level AND a.updated_at = b.updated_at AND a.ctid < b.ctid)
  );

-- 3. DEDUPLICAR CORREOS EN KINGDOM_SAVES:
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

-- REGLA 1: Correo electrónico ÚNICO (Insensible a mayúsculas/minúsculas)
-- Excluye nulos o vacíos para permitir modo invitado anónimo
CREATE UNIQUE INDEX IF NOT EXISTS uq_kingdom_saves_email_lower 
ON public.kingdom_saves (LOWER(TRIM(player_email))) 
WHERE player_email IS NOT NULL AND TRIM(player_email) != '';

-- REGLA 2: Nombre de Comandante ÚNICO (Insensible a mayúsculas/minúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS uq_kingdom_saves_player_name_lower 
ON public.kingdom_saves (LOWER(TRIM(player_name))) 
WHERE is_bot = FALSE;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_kingdom_saves_updated_at ON public.kingdom_saves(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_kingdom_saves_level ON public.kingdom_saves(kingdom_level DESC);

-- ==============================================================================
-- 2. TABLA DE MISIONES / QUESTS (Misma regla: 1 solo reclamo por jugador y quest)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.player_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    chapter INTEGER NOT NULL DEFAULT 1,
    quest_type TEXT NOT NULL DEFAULT 'story' CHECK (quest_type IN ('story', 'daily', 'epic')),
    title TEXT,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_claimed BOOLEAN NOT NULL DEFAULT TRUE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- REGLA: Ningún jugador puede tener o reclamar la misma misión más de una vez
    CONSTRAINT uq_player_quest_claim UNIQUE (player_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_player_quests_player ON public.player_quests(player_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_chapter ON public.player_quests(player_id, chapter);
CREATE INDEX IF NOT EXISTS idx_player_quests_claimed_at ON public.player_quests(claimed_at DESC);

-- Catálogo oficial de misiones de historia para auditoría del servidor
CREATE TABLE IF NOT EXISTS public.quests_catalog (
    id TEXT PRIMARY KEY,
    chapter INTEGER NOT NULL DEFAULT 1,
    quest_type TEXT NOT NULL DEFAULT 'story',
    title TEXT NOT NULL,
    description TEXT,
    action_type TEXT,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABLA DE CLASIFICACIÓN GLOBAL (PURAMENTE USUARIOS REALES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    kingdom_name TEXT NOT NULL DEFAULT 'Reino de las Nubes',
    level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 400,
    military_power BIGINT NOT NULL DEFAULT 1200,
    avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    league_id TEXT NOT NULL DEFAULT 'league_bronze',
    dungeon_floor INTEGER NOT NULL DEFAULT 1,
    dungeon_stars INTEGER NOT NULL DEFAULT 0,
    arena_wins INTEGER NOT NULL DEFAULT 0,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si leaderboard ya existía previamente
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS kingdom_name TEXT NOT NULL DEFAULT 'Reino de las Nubes';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS military_power BIGINT NOT NULL DEFAULT 1200;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS league_id TEXT NOT NULL DEFAULT 'league_bronze';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS dungeon_floor INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS dungeon_stars INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS arena_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- LIMPIEZA INMEDIATA: Purgar bots y usuarios fantasmas antiguos
DELETE FROM public.leaderboard 
WHERE id LIKE 'lb_%' 
   OR id LIKE 'bot_%' 
   OR id = 'test_real_check' 
   OR is_bot = TRUE 
   OR player_name IN ('Señor Feudal', 'Lord Soberano', 'Soberano Real', 'Bot Novicio');

-- DEDUPLICAR LEADERBOARD ANTES DE CREAR ÍNDICE:
DELETE FROM public.leaderboard a
USING public.leaderboard b
WHERE a.id != b.id
  AND LOWER(TRIM(a.player_name)) = LOWER(TRIM(b.player_name))
  AND (
    (a.military_power < b.military_power)
    OR (a.military_power = b.military_power AND a.updated_at < b.updated_at)
    OR (a.military_power = b.military_power AND a.updated_at = b.updated_at AND a.ctid < b.ctid)
  );

-- REGLA: Nombre de comandante único en el ranking
CREATE UNIQUE INDEX IF NOT EXISTS uq_leaderboard_player_name_lower 
ON public.leaderboard (LOWER(TRIM(player_name))) 
WHERE is_bot = FALSE;

-- Índices optimizados para las 3 categorías del Ranking
CREATE INDEX IF NOT EXISTS idx_leaderboard_power ON public.leaderboard(military_power DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_arena ON public.leaderboard(trophies DESC, arena_wins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_dungeon ON public.leaderboard(dungeon_floor DESC, dungeon_stars DESC);

-- ==============================================================================
-- 4. VISTAS DEL RANKING (Cero bots, puro usuario real con posición calculada)
-- ==============================================================================

-- 4.1. Ranking de Poder Militar del Reino
CREATE OR REPLACE VIEW public.v_ranking_power AS
SELECT 
    l.id,
    l.player_name,
    l.kingdom_name,
    l.level,
    l.military_power,
    l.avatar,
    l.updated_at,
    DENSE_RANK() OVER (ORDER BY l.military_power DESC, l.level DESC) AS rank
FROM public.leaderboard l
WHERE l.is_bot = FALSE 
  AND l.player_name IS NOT NULL 
  AND TRIM(l.player_name) != ''
ORDER BY l.military_power DESC;

-- 4.2. Ranking del Vórtice Astral (PvP)
CREATE OR REPLACE VIEW public.v_ranking_arena AS
SELECT 
    l.id,
    l.player_name,
    l.kingdom_name,
    l.trophies,
    l.arena_wins,
    l.league_id,
    l.avatar,
    l.updated_at,
    DENSE_RANK() OVER (ORDER BY l.trophies DESC, l.arena_wins DESC) AS rank
FROM public.leaderboard l
WHERE l.is_bot = FALSE 
  AND l.player_name IS NOT NULL 
  AND TRIM(l.player_name) != ''
ORDER BY l.trophies DESC;

-- 4.3. Ranking de Conquista de Mazmorras
CREATE OR REPLACE VIEW public.v_ranking_dungeon AS
SELECT 
    l.id,
    l.player_name,
    l.kingdom_name,
    l.dungeon_floor,
    l.dungeon_stars,
    l.avatar,
    l.updated_at,
    DENSE_RANK() OVER (ORDER BY l.dungeon_floor DESC, l.dungeon_stars DESC) AS rank
FROM public.leaderboard l
WHERE l.is_bot = FALSE 
  AND l.player_name IS NOT NULL 
  AND TRIM(l.player_name) != ''
ORDER BY l.dungeon_floor DESC;

-- ==============================================================================
-- 5. TRIGGER AUTOMÁTICO: Sincronizar kingdom_saves -> leaderboard
-- (Cualquier guardado de jugador real actualiza el ranking en milisegundos)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_kingdom_save_to_leaderboard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_troops JSONB;
    v_slots JSONB;
    v_military_power BIGINT;
    v_completed_nodes_count INTEGER := 0;
    v_dungeon_floor INTEGER := 1;
    v_dungeon_stars INTEGER := 0;
    v_trophies INTEGER := 400;
    v_arena_wins INTEGER := 0;
    v_league_id TEXT := 'league_bronze';
    v_player_name TEXT;
    v_avatar TEXT;
    v_level INTEGER;
BEGIN
    -- Ignorar bots o registros vacíos sin nombre
    IF NEW.is_bot = TRUE OR NEW.player_name IS NULL OR TRIM(NEW.player_name) = '' THEN
        RETURN NEW;
    END IF;

    v_player_name := TRIM(NEW.player_name);
    v_avatar := COALESCE(NEW.avatar, '/assets/avatars/avatar_king.webp');
    v_level := GREATEST(1, LEAST(10, COALESCE(NEW.kingdom_level, 1)));
    v_trophies := GREATEST(0, LEAST(99999, COALESCE(NEW.trophies, 400)));

    -- Calcular poder militar a partir del estado de juego
    IF NEW.game_state IS NOT NULL AND NEW.game_state ? 'troops' THEN
        v_troops := NEW.game_state->'troops';
        v_military_power := (v_level * 1500)
            + (COALESCE((v_troops->>'infantry')::BIGINT, 0) * 15)
            + (COALESCE((v_troops->>'archers')::BIGINT, 0) * 20)
            + (COALESCE((v_troops->>'mages')::BIGINT, 0) * 35)
            + (CASE WHEN (v_troops->>'commander')::BOOLEAN = TRUE OR (v_troops->>'commander')::INT > 0 THEN 500 ELSE 0 END);
    ELSE
        v_military_power := COALESCE(NEW.military_power, v_level * 1500);
    END IF;

    -- Mazmorras: pisos y estrellas calculadas desde completedNodes
    IF NEW.game_state IS NOT NULL AND NEW.game_state ? 'completedNodes' AND jsonb_typeof(NEW.game_state->'completedNodes') = 'array' THEN
        v_completed_nodes_count := jsonb_array_length(NEW.game_state->'completedNodes');
        v_dungeon_floor := GREATEST(1, v_completed_nodes_count + 1);
        v_dungeon_stars := v_completed_nodes_count * 3;
    END IF;

    -- Vórtice Astral: victorias y ligas
    IF NEW.game_state IS NOT NULL AND NEW.game_state ? 'arenaData' THEN
        v_arena_wins := COALESCE((NEW.game_state->'arenaData'->>'wins')::INT, FLOOR(v_trophies / 24));
        v_league_id := COALESCE(NEW.game_state->'arenaData'->>'leagueId', 'league_bronze');
    ELSE
        v_arena_wins := FLOOR(v_trophies / 24);
    END IF;

    IF v_trophies >= 2800 THEN
        v_league_id := 'league_grandmaster';
    ELSIF v_trophies >= 2000 THEN
        v_league_id := 'league_master';
    ELSIF v_trophies >= 1400 THEN
        v_league_id := 'league_gold';
    ELSIF v_trophies >= 800 THEN
        v_league_id := 'league_silver';
    ELSE
        v_league_id := 'league_bronze';
    END IF;

    -- Sincronizar en la tabla leaderboard
    INSERT INTO public.leaderboard (
        id,
        player_name,
        kingdom_name,
        level,
        trophies,
        military_power,
        avatar,
        league_id,
        dungeon_floor,
        dungeon_stars,
        arena_wins,
        is_bot,
        updated_at
    ) VALUES (
        NEW.id,
        v_player_name,
        COALESCE(NEW.kingdom_name, 'Reino de las Nubes'),
        v_level,
        v_trophies,
        v_military_power,
        v_avatar,
        v_league_id,
        v_dungeon_floor,
        v_dungeon_stars,
        v_arena_wins,
        FALSE,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        player_name = EXCLUDED.player_name,
        kingdom_name = EXCLUDED.kingdom_name,
        level = EXCLUDED.level,
        trophies = EXCLUDED.trophies,
        military_power = EXCLUDED.military_power,
        avatar = EXCLUDED.avatar,
        league_id = EXCLUDED.league_id,
        dungeon_floor = EXCLUDED.dungeon_floor,
        dungeon_stars = EXCLUDED.dungeon_stars,
        arena_wins = EXCLUDED.arena_wins,
        is_bot = FALSE,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_kingdom_save_to_leaderboard ON public.kingdom_saves;
CREATE TRIGGER trg_sync_kingdom_save_to_leaderboard
AFTER INSERT OR UPDATE ON public.kingdom_saves
FOR EACH ROW
EXECUTE FUNCTION public.sync_kingdom_save_to_leaderboard();

-- ==============================================================================
-- 6. RPC: VALIDACIÓN DE NOMBRES Y CORREOS EN TIEMPO REAL
-- ==============================================================================

-- 6.1. Verificar si un nombre de comandante ya está ocupado por otro jugador
CREATE OR REPLACE FUNCTION public.check_username_available(
    p_username TEXT,
    p_exclude_player_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean TEXT := LOWER(TRIM(p_username));
    v_exists BOOLEAN;
BEGIN
    IF v_clean IS NULL OR v_clean = '' THEN
        RETURN jsonb_build_object('available', false, 'error', 'EMPTY_NAME');
    END IF;

    IF LENGTH(v_clean) < 2 OR LENGTH(v_clean) > 24 THEN
        RETURN jsonb_build_object('available', false, 'error', 'INVALID_LENGTH');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.kingdom_saves
        WHERE LOWER(TRIM(player_name)) = v_clean
          AND is_bot = FALSE
          AND (p_exclude_player_id IS NULL OR id != p_exclude_player_id)
    ) INTO v_exists;

    RETURN jsonb_build_object(
        'available', NOT v_exists,
        'username', p_username
    );
END;
$$;

-- 6.2. Verificar si un correo ya está registrado en otra partida
CREATE OR REPLACE FUNCTION public.check_email_available(
    p_email TEXT,
    p_exclude_player_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean TEXT := LOWER(TRIM(p_email));
    v_exists BOOLEAN;
BEGIN
    IF v_clean IS NULL OR v_clean = '' THEN
        RETURN jsonb_build_object('available', false, 'error', 'EMPTY_EMAIL');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.kingdom_saves
        WHERE LOWER(TRIM(player_email)) = v_clean
          AND (p_exclude_player_id IS NULL OR id != p_exclude_player_id)
    ) INTO v_exists;

    RETURN jsonb_build_object(
        'available', NOT v_exists,
        'email', p_email
    );
END;
$$;

-- 6.3. Reclamar misión atómicamente en el servidor
CREATE OR REPLACE FUNCTION public.claim_player_quest(
    p_player_id TEXT,
    p_quest_id TEXT,
    p_chapter INTEGER DEFAULT 1,
    p_quest_type TEXT DEFAULT 'story',
    p_title TEXT DEFAULT '',
    p_rewards JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_already_claimed BOOLEAN;
BEGIN
    -- 1. Verificar si ya fue reclamada
    SELECT EXISTS (
        SELECT 1 FROM public.player_quests
        WHERE player_id = p_player_id AND quest_id = p_quest_id
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUEST_ALREADY_CLAIMED',
            'quest_id', p_quest_id
        );
    END IF;

    -- 2. Registrar en player_quests
    INSERT INTO public.player_quests (
        player_id,
        quest_id,
        chapter,
        quest_type,
        title,
        rewards,
        is_claimed,
        claimed_at
    ) VALUES (
        p_player_id,
        p_quest_id,
        p_chapter,
        p_quest_type,
        p_title,
        p_rewards,
        TRUE,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'quest_id', p_quest_id,
        'claimed_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 7. TABLAS DE ARENA PVP, COMBATE Y SISTEMAS MULTIJUGADOR
-- ==============================================================================

-- Defensas de ciudadelas para PvP
CREATE TABLE IF NOT EXISTS public.pvp_defenses (
    player_id TEXT PRIMARY KEY REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    kingdom_name TEXT NOT NULL DEFAULT 'Fortaleza Imperial',
    level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 400,
    league_id TEXT NOT NULL DEFAULT 'league_bronze',
    defense_hp INTEGER NOT NULL DEFAULT 200,
    infantry_count INTEGER NOT NULL DEFAULT 2,
    archers_count INTEGER NOT NULL DEFAULT 1,
    mages_count INTEGER NOT NULL DEFAULT 0,
    has_commander BOOLEAN NOT NULL DEFAULT FALSE,
    damage_per_hit INTEGER NOT NULL DEFAULT 15,
    peace_shield_until BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pvp_defenses_trophies ON public.pvp_defenses(trophies);
CREATE INDEX IF NOT EXISTS idx_pvp_defenses_shield ON public.pvp_defenses(peace_shield_until);

-- Registro de batallas PvP y Registro Defensivo
CREATE TABLE IF NOT EXISTS public.pvp_combat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defender_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    attacker_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    attacker_name TEXT NOT NULL,
    attacker_avatar TEXT NOT NULL,
    attacker_kingdom TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('victory', 'defeat')),
    trophies_diff INTEGER NOT NULL DEFAULT 0,
    gold_lost INTEGER NOT NULL DEFAULT 0,
    stone_lost INTEGER NOT NULL DEFAULT 0,
    revenge_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combat_logs_defender ON public.pvp_combat_logs(defender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_combat_logs_attacker ON public.pvp_combat_logs(attacker_id, created_at DESC);

-- Temporadas de Arena Competitiva y Recompensas
CREATE TABLE IF NOT EXISTS public.arena_seasons (
    id SERIAL PRIMARY KEY,
    season_number INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    rewards_distributed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.arena_season_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_number INTEGER NOT NULL,
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    league_id TEXT NOT NULL,
    trophies_before INTEGER NOT NULL DEFAULT 0,
    trophies_after INTEGER NOT NULL DEFAULT 0,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_number, player_id)
);

-- ==============================================================================
-- 8. ECONOMÍA, RULETA Y COMPRAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wheel_spins_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    reward_id TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    reward_amount INTEGER NOT NULL DEFAULT 0,
    is_free_spin BOOLEAN NOT NULL DEFAULT TRUE,
    cost_gems INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_player ON public.wheel_spins_log(player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.shop_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_category TEXT NOT NULL CHECK (item_category IN ('gem_pack', 'starter_pack', 'vip_perk', 'honor_item')),
    price_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency_used TEXT NOT NULL DEFAULT 'USD',
    granted_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    transaction_status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. COMUNICACIÓN, GREMIOS Y CHAT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.player_mail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL DEFAULT 'Heraldo Real',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    attached_rewards JSONB DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    tag VARCHAR(5) UNIQUE NOT NULL,
    emblem TEXT NOT NULL DEFAULT '/assets/hud_icons/btn_ranking.webp',
    description TEXT DEFAULT 'Una legión de comandantes de Aetheria.',
    leader_id TEXT NOT NULL,
    guild_level INTEGER NOT NULL DEFAULT 1,
    total_trophies INTEGER NOT NULL DEFAULT 0,
    members_count INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 30,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES public.kingdom_saves(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    player_avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'elder', 'member')),
    trophies INTEGER NOT NULL DEFAULT 0,
    power_score BIGINT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(guild_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL DEFAULT 'global' CHECK (channel IN ('global', 'guild', 'system')),
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_channel_created ON public.chat_messages(channel, created_at DESC);

-- ==============================================================================
-- 10. RPC SERVER-SIDE: RULETA (20 Horas) Y RECOMPENSAS DE TEMPORADA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_daily_wheel_spin(
    p_player_id TEXT,
    p_is_free BOOLEAN DEFAULT TRUE,
    p_cost_gems INTEGER DEFAULT 0,
    p_reward_id TEXT DEFAULT 'reward_gold',
    p_reward_type TEXT DEFAULT 'gold',
    p_reward_amount INTEGER DEFAULT 2500
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_free_time TIMESTAMPTZ;
    v_hours_since_spin NUMERIC;
BEGIN
    IF p_is_free THEN
        SELECT created_at INTO v_last_free_time
        FROM public.wheel_spins_log
        WHERE player_id = p_player_id AND is_free_spin = TRUE
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_last_free_time IS NOT NULL THEN
            v_hours_since_spin := EXTRACT(EPOCH FROM (NOW() - v_last_free_time)) / 3600.0;
            IF v_hours_since_spin < 20.0 THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'COOLDOWN_ACTIVE',
                    'hours_remaining', ROUND((20.0 - v_hours_since_spin)::numeric, 2),
                    'server_now', NOW()
                );
            END IF;
        END IF;
    END IF;

    INSERT INTO public.wheel_spins_log (
        player_id,
        reward_id,
        reward_type,
        reward_amount,
        is_free_spin,
        cost_gems,
        created_at
    ) VALUES (
        p_player_id,
        p_reward_id,
        p_reward_type,
        p_reward_amount,
        p_is_free,
        p_cost_gems,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'reward_id', p_reward_id,
        'reward_type', p_reward_type,
        'reward_amount', p_reward_amount,
        'server_timestamp', NOW()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_arena_season_reward(
    p_player_id TEXT,
    p_season_number INTEGER,
    p_league_id TEXT,
    p_trophies_before INTEGER,
    p_trophies_after INTEGER,
    p_rewards JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_already_claimed BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.arena_season_claims 
        WHERE player_id = p_player_id AND season_number = p_season_number
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Season rewards already claimed for this season'
        );
    END IF;

    INSERT INTO public.arena_season_claims (
        season_number,
        player_id,
        league_id,
        trophies_before,
        trophies_after,
        rewards,
        claimed_at
    ) VALUES (
        p_season_number,
        p_player_id,
        p_league_id,
        p_trophies_before,
        p_trophies_after,
        p_rewards,
        NOW()
    );

    UPDATE public.leaderboard
    SET trophies = p_trophies_after,
        updated_at = NOW()
    WHERE id = p_player_id;

    RETURN jsonb_build_object(
        'success', true,
        'season_number', p_season_number,
        'trophies_after', p_trophies_after,
        'rewards', p_rewards,
        'server_timestamp', NOW()
    );
END;
$$;

-- Temporada 1 inicial
INSERT INTO public.arena_seasons (season_number, title, starts_at, ends_at, is_active)
VALUES (1, 'Temporada de los Primeros Conquistadores', NOW(), NOW() + INTERVAL '30 days', TRUE)
ON CONFLICT (season_number) DO NOTHING;

-- ==============================================================================
-- 11. SEGURIDAD Y POLÍTICAS (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.kingdom_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_defenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_combat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_season_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas universales permisivas para Anon Key con validación
DROP POLICY IF EXISTS "Permitir lectura publica de guardados" ON public.kingdom_saves;
CREATE POLICY "Permitir lectura publica de guardados" ON public.kingdom_saves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir upsert publico de guardados" ON public.kingdom_saves;
CREATE POLICY "Permitir upsert publico de guardados" ON public.kingdom_saves FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de quests" ON public.player_quests;
CREATE POLICY "Permitir lectura de quests" ON public.player_quests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestion de quests" ON public.player_quests;
CREATE POLICY "Permitir gestion de quests" ON public.player_quests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de catalogo quests" ON public.quests_catalog;
CREATE POLICY "Permitir lectura de catalogo quests" ON public.quests_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica del ranking" ON public.leaderboard;
CREATE POLICY "Permitir lectura publica del ranking" ON public.leaderboard FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir upsert publico del ranking" ON public.leaderboard;
CREATE POLICY "Permitir upsert publico del ranking" ON public.leaderboard FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de defensas pvp" ON public.pvp_defenses;
CREATE POLICY "Permitir lectura de defensas pvp" ON public.pvp_defenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestion de defensas pvp" ON public.pvp_defenses;
CREATE POLICY "Permitir gestion de defensas pvp" ON public.pvp_defenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion de registros pvp" ON public.pvp_combat_logs;
CREATE POLICY "Permitir insercion de registros pvp" ON public.pvp_combat_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de temporadas" ON public.arena_seasons;
CREATE POLICY "Permitir lectura de temporadas" ON public.arena_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir reclamos de temporada" ON public.arena_season_claims;
CREATE POLICY "Permitir reclamos de temporada" ON public.arena_season_claims FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir ruleta" ON public.wheel_spins_log;
CREATE POLICY "Permitir ruleta" ON public.wheel_spins_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir transacciones" ON public.shop_transactions;
CREATE POLICY "Permitir transacciones" ON public.shop_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir correo" ON public.player_mail;
CREATE POLICY "Permitir correo" ON public.player_mail FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir gremios" ON public.guilds;
CREATE POLICY "Permitir gremios" ON public.guilds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir miembros gremio" ON public.guild_members;
CREATE POLICY "Permitir miembros gremio" ON public.guild_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir chat" ON public.chat_messages;
CREATE POLICY "Permitir chat" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
