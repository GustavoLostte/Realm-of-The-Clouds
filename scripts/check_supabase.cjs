const { createClient } = require('@supabase/supabase-js');

const oldUrl = 'https://hoghpltpvqfdpxcepqlr.supabase.co';
const oldKey = 'sb_publishable_BtISgMp6lgm6kD6vXCQWzw_WheXO0cf';

const newUrl = 'https://ugdzhydclffxwaflomex.supabase.co';
const newKey = 'sb_publishable_eqTBcAWlley9TbPyP3v89Q_J3cDJJZL';

const oldClient = createClient(oldUrl, oldKey);
const newClient = createClient(newUrl, newKey);

const tables = ['kingdom_saves', 'leaderboard', 'wheel_spins_log', 'arena_season_claims'];

async function checkInstance(name, client) {
  console.log(`\n========================================`);
  console.log(`Checking ${name}...`);
  console.log(`========================================`);

  for (const table of tables) {
    try {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log(`❌ Table [${table}]: Error -> ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ Table [${table}]: OK (${count} total rows). Sample count: ${data ? data.length : 0}`);
        if (data && data.length > 0) {
          console.log(`   Sample columns:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`⚠️ Table [${table}]: Exception -> ${err.message}`);
    }
  }
}

async function run() {
  await checkInstance('OLD SUPABASE (hoghpltpvqfdpxcepqlr)', oldClient);
  await checkInstance('NEW SUPABASE (ugdzhydclffxwaflomex)', newClient);
}

run().catch(console.error);
