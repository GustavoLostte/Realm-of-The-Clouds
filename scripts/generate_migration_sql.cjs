const fs = require('fs');
const path = require('path');

const schemaSqlPath = path.resolve(__dirname, '../supabase/schema.sql');
const backupJsonPath = path.resolve(__dirname, '../supabase/old_database_backup.json');
const outputPath = path.resolve(__dirname, '../supabase/setup_new_database.sql');

const schemaContent = fs.readFileSync(schemaSqlPath, 'utf8');
const backup = JSON.parse(fs.readFileSync(backupJsonPath, 'utf8'));

let insertSql = `\n\n-- ==============================================================================
-- 9. MIGRACIÓN DE DATOS PREVIOS (56 PARTIDAS Y LOGS SALVAGUARDADOS)
-- ==============================================================================\n`;

if (backup.saves && backup.saves.length > 0) {
  insertSql += `-- Insertar partidas existentes salvaguardadas\n`;
  for (const s of backup.saves) {
    const id = s.id ? `'${s.id.replace(/'/g, "''")}'` : 'NULL';
    const email = s.player_email ? `'${s.player_email.replace(/'/g, "''")}'` : 'NULL';
    const name = s.player_name ? `'${s.player_name.replace(/'/g, "''")}'` : "'Lord King'";
    const level = Number(s.kingdom_level) || 1;
    const trophies = Number(s.trophies) || 250;
    const gameState = s.game_state ? `'${JSON.stringify(s.game_state).replace(/'/g, "''")}'::jsonb` : "'{}'::jsonb";
    const updatedAt = s.updated_at ? `'${s.updated_at}'` : 'NOW()';

    insertSql += `INSERT INTO public.kingdom_saves (id, player_email, player_name, kingdom_level, trophies, game_state, updated_at)
VALUES (${id}, ${email}, ${name}, ${level}, ${trophies}, ${gameState}, ${updatedAt})
ON CONFLICT (id) DO UPDATE SET
    player_name = EXCLUDED.player_name,
    kingdom_level = EXCLUDED.kingdom_level,
    trophies = EXCLUDED.trophies,
    game_state = EXCLUDED.game_state,
    updated_at = EXCLUDED.updated_at;\n`;
  }
}

if (backup.spins && backup.spins.length > 0) {
  insertSql += `\n-- Insertar logs de ruleta existentes\n`;
  for (const sp of backup.spins) {
    const id = sp.id ? `'${sp.id.replace(/'/g, "''")}'` : 'NULL';
    const pid = sp.player_id ? `'${sp.player_id.replace(/'/g, "''")}'` : 'NULL';
    const rid = sp.reward_id ? `'${sp.reward_id.replace(/'/g, "''")}'` : "'reward_gold'";
    const rtype = sp.reward_type ? `'${sp.reward_type.replace(/'/g, "''")}'` : "'gold'";
    const ramt = Number(sp.reward_amount) || 0;
    const isFree = sp.is_free_spin ? 'TRUE' : 'FALSE';
    const costGems = Number(sp.cost_gems) || 0;
    const createdAt = sp.created_at ? `'${sp.created_at}'` : 'NOW()';

    insertSql += `INSERT INTO public.wheel_spins_log (id, player_id, reward_id, reward_type, reward_amount, is_free_spin, cost_gems, created_at)
VALUES (${id}, ${pid}, ${rid}, ${rtype}, ${ramt}, ${isFree}, ${costGems}, ${createdAt})
ON CONFLICT (id) DO NOTHING;\n`;
  }
}

if (backup.claims && backup.claims.length > 0) {
  insertSql += `\n-- Insertar reclamos de temporada existentes\n`;
  for (const c of backup.claims) {
    const id = c.id ? `'${c.id.replace(/'/g, "''")}'` : 'NULL';
    const snum = Number(c.season_number) || 1;
    const pid = c.player_id ? `'${c.player_id.replace(/'/g, "''")}'` : 'NULL';
    const lid = c.league_id ? `'${c.league_id.replace(/'/g, "''")}'` : "'league_bronze'";
    const tb = Number(c.trophies_before) || 0;
    const ta = Number(c.trophies_after) || 0;
    const rew = c.rewards ? `'${JSON.stringify(c.rewards).replace(/'/g, "''")}'::jsonb` : "'{}'::jsonb";
    const claimedAt = c.claimed_at ? `'${c.claimed_at}'` : 'NOW()';

    insertSql += `INSERT INTO public.arena_season_claims (id, season_number, player_id, league_id, trophies_before, trophies_after, rewards, claimed_at)
VALUES (${id}, ${snum}, ${pid}, ${lid}, ${tb}, ${ta}, ${rew}, ${claimedAt})
ON CONFLICT (id) DO NOTHING;\n`;
  }
}

const fullSql = schemaContent + insertSql;
fs.writeFileSync(outputPath, fullSql, 'utf8');
console.log('Generated complete migration SQL script at:', outputPath);
