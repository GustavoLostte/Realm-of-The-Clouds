const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'hud_icons');

async function generateIcons() {
  const icons = [
    {
      name: 'icon_lock.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="35%" stop-color="#f59e0b"/>
            <stop offset="75%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#78350f"/>
          </radialGradient>
          <linearGradient id="shackleMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="50%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
          <linearGradient id="bodyPlate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="50%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#92400e"/>
          </linearGradient>
          <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.8"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Shackle -->
          <path d="M 64 88 V 56 C 64 36 78 22 96 22 C 114 22 128 36 128 56 V 88" 
                fill="none" stroke="url(#shackleMetal)" stroke-width="20" stroke-linecap="round"/>
          <path d="M 64 88 V 56 C 64 36 78 22 96 22 C 114 22 128 36 128 56 V 88" 
                fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>

          <!-- Body -->
          <rect x="44" y="80" width="104" height="92" rx="20" fill="url(#bodyPlate)" stroke="#fef08a" stroke-width="4" filter="url(#glow)"/>
          
          <!-- Inner Rim -->
          <rect x="52" y="88" width="88" height="76" rx="14" fill="none" stroke="#78350f" stroke-width="3" opacity="0.6"/>
          
          <!-- Gem Accent -->
          <circle cx="96" cy="102" r="10" fill="#ef4444" stroke="#fef08a" stroke-width="2"/>
          <circle cx="94" cy="100" r="3" fill="#ffffff" opacity="0.8"/>

          <!-- Keyhole -->
          <circle cx="96" cy="126" r="9" fill="#1e1b4b"/>
          <polygon points="92,126 100,126 102,148 90,148" fill="#1e1b4b"/>
          
          <!-- Highlight line -->
          <path d="M 52 96 C 65 90 127 90 140 96" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_check.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="emeraldBg" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stop-color="#34d399"/>
            <stop offset="50%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </radialGradient>
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#34d399" flood-opacity="0.7"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Circle Base -->
          <circle cx="96" cy="96" r="76" fill="url(#emeraldBg)" stroke="url(#goldBorder)" stroke-width="8" filter="url(#glow)"/>
          
          <!-- Inner Ring -->
          <circle cx="96" cy="96" r="64" fill="none" stroke="#a7f3d0" stroke-width="2.5" opacity="0.5"/>
          
          <!-- Bold Checkmark with double line -->
          <path d="M 58 98 L 84 124 L 136 68" fill="none" stroke="#042f2e" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 58 98 L 84 124 L 136 68" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 60 96 L 84 120 L 134 66" fill="none" stroke="#fef08a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
          
          <!-- Glint -->
          <circle cx="68" cy="62" r="6" fill="#ffffff" opacity="0.7"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_potion.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="elixirGlow" cx="45%" cy="65%" r="60%">
            <stop offset="0%" stop-color="#f472b6"/>
            <stop offset="45%" stop-color="#c026d3"/>
            <stop offset="85%" stop-color="#701a75"/>
            <stop offset="100%" stop-color="#2e1065"/>
          </radialGradient>
          <linearGradient id="corkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="50%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
          <linearGradient id="glassEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#67e8f9"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#e879f9" flood-opacity="0.8"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Cork Stopper -->
          <polygon points="80,32 112,32 108,18 84,18" fill="url(#corkGradient)" stroke="#fef08a" stroke-width="2"/>
          <ellipse cx="96" cy="18" rx="12" ry="4" fill="#fbbf24"/>
          
          <!-- Flask Lip & Neck -->
          <ellipse cx="96" cy="34" rx="20" ry="7" fill="#38bdf8" stroke="#ffffff" stroke-width="2.5" opacity="0.9"/>
          <path d="M 82 34 L 84 66 L 50 128 C 42 144 52 170 74 176 C 96 182 116 180 134 168 C 150 156 152 136 142 124 L 110 66 L 112 34 Z" 
                fill="url(#elixirGlow)" stroke="url(#glassEdge)" stroke-width="5" filter="url(#glow)"/>

          <!-- Elixir Liquid Level Surface -->
          <path d="M 60 120 C 78 112 114 112 132 120 C 146 150 136 170 96 172 C 56 170 48 146 60 120 Z" 
                fill="url(#elixirGlow)" opacity="0.9"/>

          <!-- Magic bubbles -->
          <circle cx="86" cy="142" r="6" fill="#fbcfe8" opacity="0.8"/>
          <circle cx="106" cy="132" r="4" fill="#fbcfe8" opacity="0.9"/>
          <circle cx="94" cy="158" r="5" fill="#fbcfe8" opacity="0.7"/>
          
          <!-- Glass highlight -->
          <path d="M 64 126 C 56 140 60 158 72 168" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
          <path d="M 88 48 L 88 64" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <circle cx="120" cy="150" r="3" fill="#ffffff" opacity="0.8"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_warning.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="warnAmber" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="40%" stop-color="#f59e0b"/>
            <stop offset="80%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#b45309"/>
          </radialGradient>
          <linearGradient id="warnRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#fde047"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.8"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Rounded Hazard Shield Triangle -->
          <path d="M 96 22 C 104 22 110 26 114 34 L 174 140 C 180 150 176 164 164 168 C 158 170 150 170 144 170 L 48 170 C 36 170 26 162 24 150 C 22 144 24 138 28 132 L 84 34 C 88 26 92 22 96 22 Z" 
                fill="url(#warnAmber)" stroke="url(#warnRim)" stroke-width="7" stroke-linejoin="round" filter="url(#glow)"/>
          
          <!-- Inner Dark border -->
          <path d="M 96 38 L 158 152 L 34 152 Z" fill="none" stroke="#78350f" stroke-width="4" stroke-linejoin="round" opacity="0.6"/>

          <!-- Exclamation Mark -->
          <rect x="90" y="66" width="12" height="46" rx="6" fill="#1e1b4b"/>
          <rect x="91" y="68" width="10" height="24" rx="5" fill="#fef08a" opacity="0.4"/>
          <circle cx="96" cy="132" r="7.5" fill="#1e1b4b"/>
          <circle cx="94.5" cy="130.5" r="2.5" fill="#ffffff" opacity="0.6"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_trophy.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="trophyGold" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="30%" stop-color="#fde047"/>
            <stop offset="65%" stop-color="#eab308"/>
            <stop offset="90%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#854d0e"/>
          </radialGradient>
          <linearGradient id="cupRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#fde047" flood-opacity="0.8"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Handles -->
          <path d="M 52 56 C 26 56 22 96 56 104" fill="none" stroke="url(#trophyGold)" stroke-width="12" stroke-linecap="round"/>
          <path d="M 140 56 C 166 56 170 96 136 104" fill="none" stroke="url(#trophyGold)" stroke-width="12" stroke-linecap="round"/>
          
          <!-- Cup Base & Stem -->
          <polygon points="76,146 116,146 110,122 82,122" fill="url(#trophyGold)" stroke="#854d0e" stroke-width="2"/>
          <rect x="58" y="146" width="76" height="24" rx="6" fill="#713f12" stroke="url(#cupRim)" stroke-width="4"/>
          
          <!-- Main Chalice Bowl -->
          <path d="M 50 46 C 50 96 74 122 96 122 C 118 122 142 96 142 46 Z" 
                fill="url(#trophyGold)" stroke="url(#cupRim)" stroke-width="5" filter="url(#glow)"/>

          <!-- Top Rim -->
          <ellipse cx="96" cy="46" rx="46" ry="12" fill="url(#cupRim)" stroke="#854d0e" stroke-width="3"/>
          <ellipse cx="96" cy="46" rx="40" ry="8" fill="#ca8a04"/>

          <!-- Star Insignia -->
          <polygon points="96,66 99,75 108,75 101,81 103,90 96,84 89,90 91,81 84,75 93,75" fill="#ffffff" stroke="#a16207" stroke-width="1.5"/>
          
          <!-- Glint highlight -->
          <path d="M 64 62 C 60 78 68 96 76 104" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
          <circle cx="132" cy="58" r="4" fill="#ffffff" opacity="0.8"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_skull.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="boneColor" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="45%" stop-color="#cbd5e1"/>
            <stop offset="85%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#334155"/>
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.7"/>
          </filter>
          <filter id="eyeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#dc2626" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Cranium -->
          <path d="M 44 92 C 40 44 70 24 96 24 C 122 24 152 44 148 92 C 146 114 136 126 124 130 V 154 C 124 162 118 166 108 166 H 84 C 74 166 68 162 68 154 V 130 C 56 126 46 114 44 92 Z" 
                fill="url(#boneColor)" stroke="#1e293b" stroke-width="5"/>
          
          <!-- Eye Sockets with fiery ruby glow -->
          <ellipse cx="76" cy="94" rx="14" ry="18" fill="#1e1b4b" filter="url(#eyeGlow)"/>
          <ellipse cx="116" cy="94" rx="14" ry="18" fill="#1e1b4b" filter="url(#eyeGlow)"/>
          <circle cx="76" cy="96" r="6" fill="#ef4444"/>
          <circle cx="116" cy="96" r="6" fill="#ef4444"/>
          <circle cx="74" cy="94" r="2" fill="#fef08a"/>
          <circle cx="114" cy="94" r="2" fill="#fef08a"/>

          <!-- Nasal Cavity -->
          <polygon points="96,114 90,128 102,128" fill="#0f172a"/>

          <!-- Teeth Slots -->
          <line x1="82" y1="148" x2="82" y2="164" stroke="#0f172a" stroke-width="3"/>
          <line x1="96" y1="146" x2="96" y2="166" stroke="#0f172a" stroke-width="3"/>
          <line x1="110" y1="148" x2="110" y2="164" stroke="#0f172a" stroke-width="3"/>

          <!-- Highlight bone shine -->
          <path d="M 64 48 C 76 36 100 34 120 40" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_bomb.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ironSphere" cx="38%" cy="38%" r="65%">
            <stop offset="0%" stop-color="#64748b"/>
            <stop offset="35%" stop-color="#334155"/>
            <stop offset="75%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </radialGradient>
          <linearGradient id="fuseBurn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ef4444"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.7"/>
          </filter>
          <filter id="sparkGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#f97316" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <!-- Fuse -->
          <path d="M 112 56 C 122 42 134 40 144 26" fill="none" stroke="#d97706" stroke-width="7" stroke-linecap="round"/>
          
          <!-- Fuse Spark -->
          <circle cx="148" cy="22" r="14" fill="url(#fuseBurn)" filter="url(#sparkGlow)"/>
          <polygon points="148,8 152,18 162,22 152,26 148,36 144,26 134,22 144,18" fill="#ffffff"/>

          <!-- Bomb Neck Cap -->
          <rect x="96" y="52" width="30" height="14" rx="4" fill="#d97706" stroke="#fef08a" stroke-width="2" transform="rotate(-20 96 52)"/>

          <!-- Iron Sphere -->
          <circle cx="90" cy="112" r="66" fill="url(#ironSphere)" stroke="#475569" stroke-width="4"/>

          <!-- Golden Rune Inscription -->
          <path d="M 64 104 L 88 126 L 114 98" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
          <circle cx="88" cy="126" r="4" fill="#fef08a"/>

          <!-- Curved Specular Light Reflection -->
          <path d="M 52 86 C 60 70 76 60 94 58" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
          <circle cx="118" cy="74" r="4" fill="#ffffff" opacity="0.5"/>
        </g>
      </svg>
      `
    }
  ];

  for (const item of icons) {
    const filePath = path.join(targetDir, item.name);
    await sharp(Buffer.from(item.svg))
      .webp({ quality: 95, effort: 6 })
      .toFile(filePath);
    console.log(`Successfully created: ${item.name}`);
  }
}

generateIcons().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
