-- ==============================================================================
-- THRONE OF CHAOS: FORGING OF EMPIRES (TOC FOE)
-- Master Database Schema for Supabase Cloud (PostgreSQL)
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PARTIDAS Y GUARDADO EN LA NUBE (Existente - Reforzado)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.kingdom_saves (
    id TEXT PRIMARY KEY,
    player_email TEXT,
    player_name TEXT NOT NULL DEFAULT 'Lord King',
    kingdom_level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 250,
    game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si kingdom_saves ya existía previamente
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS player_email TEXT;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS player_name TEXT NOT NULL DEFAULT 'Lord King';
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS kingdom_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS trophies INTEGER NOT NULL DEFAULT 250;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS game_state JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.kingdom_saves ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índices de búsqueda rápida para guardado y login por email
CREATE INDEX IF NOT EXISTS idx_kingdom_saves_email ON public.kingdom_saves(LOWER(player_email));
CREATE INDEX IF NOT EXISTS idx_kingdom_saves_updated_at ON public.kingdom_saves(updated_at DESC);

-- ==============================================================================
-- 2. TABLA DE CLASIFICACIÓN GLOBAL (Existente - Expandida para 3 Categorías)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL DEFAULT 'Lord King',
    kingdom_name TEXT NOT NULL DEFAULT 'Trono del Caos',
    level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 250,
    military_power BIGINT NOT NULL DEFAULT 1200,
    avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    league_id TEXT NOT NULL DEFAULT 'league_bronze',
    dungeon_floor INTEGER NOT NULL DEFAULT 1,
    dungeon_stars INTEGER NOT NULL DEFAULT 0,
    arena_wins INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migración segura: agregar columnas si leaderboard ya existía previamente
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS kingdom_name TEXT NOT NULL DEFAULT 'Trono del Caos';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS military_power BIGINT NOT NULL DEFAULT 1200;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS league_id TEXT NOT NULL DEFAULT 'league_bronze';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS dungeon_floor INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS dungeon_stars INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS arena_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índices para cada una de las 3 pestañas de clasificación en RankingModal
CREATE INDEX IF NOT EXISTS idx_leaderboard_power ON public.leaderboard(military_power DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_arena ON public.leaderboard(trophies DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_dungeon ON public.leaderboard(dungeon_floor DESC, dungeon_stars DESC);

-- ==============================================================================
-- 3. ARENA PVP Y EMPAREJAMIENTO MULTIJUGADOR (FALTANTE - CRÍTICA)
-- ==============================================================================
-- Permite que los rivales de la Arena sean jugadores reales y no solo bots
CREATE TABLE IF NOT EXISTS public.pvp_defenses (
    player_id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    kingdom_name TEXT NOT NULL DEFAULT 'Fortaleza Imperial',
    level INTEGER NOT NULL DEFAULT 1,
    trophies INTEGER NOT NULL DEFAULT 250,
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

-- Asegurar columnas si pvp_defenses ya existía previamente
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp';
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS kingdom_name TEXT NOT NULL DEFAULT 'Fortaleza Imperial';
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS league_id TEXT NOT NULL DEFAULT 'league_bronze';
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS defense_hp INTEGER NOT NULL DEFAULT 200;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS infantry_count INTEGER NOT NULL DEFAULT 2;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS archers_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS mages_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS has_commander BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS damage_per_hit INTEGER NOT NULL DEFAULT 15;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS peace_shield_until BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.pvp_defenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_pvp_defenses_trophies ON public.pvp_defenses(trophies);
CREATE INDEX IF NOT EXISTS idx_pvp_defenses_league ON public.pvp_defenses(league_id);
CREATE INDEX IF NOT EXISTS idx_pvp_defenses_shield ON public.pvp_defenses(peace_shield_until);

-- Registro de batallas PvP y Registro Defensivo (Defense Log / Revancha)
CREATE TABLE IF NOT EXISTS public.pvp_combat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    defender_id TEXT NOT NULL,
    attacker_id TEXT NOT NULL,
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

-- Registro de Reclamos de Recompensas de Temporada (Previene reclamo múltiple)
CREATE TABLE IF NOT EXISTS public.arena_season_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_number INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    league_id TEXT NOT NULL,
    trophies_before INTEGER NOT NULL DEFAULT 0,
    trophies_after INTEGER NOT NULL DEFAULT 0,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_number, player_id)
);

CREATE INDEX IF NOT EXISTS idx_season_claims_player ON public.arena_season_claims(player_id, season_number);

-- ==============================================================================
-- 4. ECONOMÍA, BAZAR IMPERIAL Y RULETA DE LA FORTUNA (FALTANTE - SEGURIDAD)
-- ==============================================================================
-- Registro de tiradas de la Ruleta (Valida tiempo real y evita trampas de 24h)
CREATE TABLE IF NOT EXISTS public.wheel_spins_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT NOT NULL,
    reward_id TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    reward_amount INTEGER NOT NULL DEFAULT 0,
    is_free_spin BOOLEAN NOT NULL DEFAULT TRUE,
    cost_gems INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_player ON public.wheel_spins_log(player_id, created_at DESC);

-- Transacciones del Bazar Imperial (Gemas, Paquetes de Inicio, Ventajas VIP)
CREATE TABLE IF NOT EXISTS public.shop_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_category TEXT NOT NULL CHECK (item_category IN ('gem_pack', 'starter_pack', 'vip_perk', 'honor_item')),
    price_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency_used TEXT NOT NULL DEFAULT 'USD',
    granted_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    transaction_status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_transactions_player ON public.shop_transactions(player_id, created_at DESC);

-- ==============================================================================
-- 5. MENSAJERO REAL, CORREO Y REGALOS (FALTANTE - HERALDO Y SOPORTE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.player_mail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT NOT NULL,
    sender_name TEXT NOT NULL DEFAULT 'Heraldo Real',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    attached_rewards JSONB DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_mail_recipient ON public.player_mail(player_id, is_read, is_claimed);

-- Anuncios del Sistema y Eventos Globales
CREATE TABLE IF NOT EXISTS public.game_announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    badge_tag TEXT DEFAULT 'NOTICIA',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. ALIANZAS / GREMIOS Y CHAT GLOBAL (FALTANTE - SOCIAL MULTIJUGADOR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    tag VARCHAR(5) UNIQUE NOT NULL,
    emblem TEXT NOT NULL DEFAULT '/assets/hud_icons/btn_ranking.webp',
    description TEXT DEFAULT 'Una alianza de soberanos.',
    leader_id TEXT NOT NULL,
    guild_level INTEGER NOT NULL DEFAULT 1,
    total_trophies INTEGER NOT NULL DEFAULT 0,
    members_count INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 30,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guild_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    player_avatar TEXT NOT NULL DEFAULT '/assets/avatars/avatar_king.webp',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'elder', 'member')),
    trophies INTEGER NOT NULL DEFAULT 0,
    power_score BIGINT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(guild_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_members_player ON public.guild_members(player_id);

-- Chat Global y de Alianza (Para integración con Supabase Realtime)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 7. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.kingdom_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_defenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_combat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura abierta para el juego (Anon Key)
DROP POLICY IF EXISTS "Permitir lectura publica de guardados" ON public.kingdom_saves;
CREATE POLICY "Permitir lectura publica de guardados" ON public.kingdom_saves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir upsert publico de guardados" ON public.kingdom_saves;
CREATE POLICY "Permitir upsert publico de guardados" ON public.kingdom_saves FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura publica del ranking" ON public.leaderboard;
CREATE POLICY "Permitir lectura publica del ranking" ON public.leaderboard FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir upsert publico del ranking" ON public.leaderboard;
CREATE POLICY "Permitir upsert publico del ranking" ON public.leaderboard FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura publica de defensas pvp" ON public.pvp_defenses;
CREATE POLICY "Permitir lectura publica de defensas pvp" ON public.pvp_defenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestion de defensas pvp" ON public.pvp_defenses;
CREATE POLICY "Permitir gestion de defensas pvp" ON public.pvp_defenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de registros pvp" ON public.pvp_combat_logs;
CREATE POLICY "Permitir lectura de registros pvp" ON public.pvp_combat_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de registros pvp" ON public.pvp_combat_logs;
CREATE POLICY "Permitir insercion de registros pvp" ON public.pvp_combat_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de temporadas" ON public.arena_seasons;
CREATE POLICY "Permitir lectura de temporadas" ON public.arena_seasons FOR SELECT USING (true);

ALTER TABLE public.arena_season_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir insercion y lectura de reclamos de temporada" ON public.arena_season_claims;
CREATE POLICY "Permitir insercion y lectura de reclamos de temporada" ON public.arena_season_claims FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion y lectura de ruleta" ON public.wheel_spins_log;
CREATE POLICY "Permitir insercion y lectura de ruleta" ON public.wheel_spins_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir insercion y lectura de compras" ON public.shop_transactions;
CREATE POLICY "Permitir insercion y lectura de compras" ON public.shop_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y gestion de correo" ON public.player_mail;
CREATE POLICY "Permitir lectura y gestion de correo" ON public.player_mail FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de anuncios" ON public.game_announcements;
CREATE POLICY "Permitir lectura de anuncios" ON public.game_announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura y gestion de alianzas" ON public.guilds;
CREATE POLICY "Permitir lectura y gestion de alianzas" ON public.guilds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y gestion de miembros" ON public.guild_members;
CREATE POLICY "Permitir lectura y gestion de miembros" ON public.guild_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y envio de chat" ON public.chat_messages;
CREATE POLICY "Permitir lectura y envio de chat" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. FUNCIONES DE SERVIDOR AUTORITATIVAS (RPC) Y TRIGGERS ANTI-TRAMPAS
-- ==============================================================================

-- Función RPC para Tirada de Ruleta Server-Side (Valida 20h en el servidor)
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
    -- 1. Si es tirada gratuita, validar tiempo inmutable del servidor (20 horas)
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

    -- 2. Registrar la tirada en el log del servidor
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

-- Trigger para validar límites e integridad en Leaderboard (Anti-Cheat)
CREATE OR REPLACE FUNCTION public.validate_leaderboard_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nivel máximo de reino soportado: 10
    IF NEW.level > 10 THEN
        NEW.level := 10;
    END IF;
    IF NEW.level < 1 THEN
        NEW.level := 1;
    END IF;

    -- Límite máximo de poder militar razonable para evitar inyecciones gigantes
    IF NEW.military_power > 25000000 THEN
        NEW.military_power := 25000000;
    END IF;
    IF NEW.military_power < 0 THEN
        NEW.military_power := 0;
    END IF;

    -- Límite de copas
    IF NEW.trophies > 99999 THEN
        NEW.trophies := 99999;
    END IF;
    IF NEW.trophies < 0 THEN
        NEW.trophies := 0;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_leaderboard ON public.leaderboard;
CREATE TRIGGER trg_validate_leaderboard
BEFORE INSERT OR UPDATE ON public.leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.validate_leaderboard_integrity();

-- Trigger para sanitizar y proteger kingdom_saves
CREATE OR REPLACE FUNCTION public.validate_kingdom_save_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar rangos de nivel y copas
    IF NEW.kingdom_level > 10 THEN
        NEW.kingdom_level := 10;
    END IF;
    IF NEW.trophies < 0 THEN
        NEW.trophies := 0;
    ELSIF NEW.trophies > 99999 THEN
        NEW.trophies := 99999;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_kingdom_save ON public.kingdom_saves;
CREATE TRIGGER trg_validate_kingdom_save
BEFORE INSERT OR UPDATE ON public.kingdom_saves
FOR EACH ROW
EXECUTE FUNCTION public.validate_kingdom_save_integrity();

-- ==============================================================================
-- 7. RECOMPENSAS Y REINICIO DE TEMPORADAS DE ARENA (RPC ANTI-TRAMPAS)
-- ==============================================================================
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
    -- 1. Verificar si ya fue reclamada por este jugador en esta temporada
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

    -- 2. Registrar el reclamo de forma inmutable
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

    -- 3. Actualizar copas en Leaderboard para sincronización en tiempo real
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

-- Inicializar Temporada 1 de Arena por defecto si no existe
INSERT INTO public.arena_seasons (season_number, title, starts_at, ends_at, is_active)
VALUES (1, 'Temporada de los Reyes Fundadores', NOW(), NOW() + INTERVAL '30 days', TRUE)
ON CONFLICT (season_number) DO NOTHING;