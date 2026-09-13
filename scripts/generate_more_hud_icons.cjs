const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'hud_icons');

async function generateMoreIcons() {
  const icons = [
    {
      name: 'icon_crown.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="crownGold" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="25%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="85%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#78350f"/>
          </radialGradient>
          <radialGradient id="rubyGem" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="40%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </radialGradient>
          <radialGradient id="emeraldGem" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#6ee7b7"/>
            <stop offset="40%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </radialGradient>
          <radialGradient id="sapphireGem" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#93c5fd"/>
            <stop offset="40%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </radialGradient>
          <filter id="crownShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="crownGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.8"/>
          </filter>
        </defs>

        <g filter="url(#crownShadow)">
          <!-- Red velvet inner cushion -->
          <path d="M 40 120 C 40 70 152 70 152 120 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
          <path d="M 96 68 C 96 68 96 118 96 118" stroke="#fef08a" stroke-width="2" opacity="0.4"/>
          <circle cx="96" cy="66" r="6" fill="url(#crownGold)"/>

          <!-- Crown Body Silhouette (5 peaks) -->
          <path d="M 28 136 L 36 68 L 68 98 L 96 46 L 124 98 L 156 68 L 164 136 Z" 
                fill="url(#crownGold)" stroke="#fef08a" stroke-width="4" stroke-linejoin="round" filter="url(#crownGlow)"/>

          <!-- Base Band -->
          <rect x="24" y="130" width="144" height="24" rx="6" fill="url(#crownGold)" stroke="#fef08a" stroke-width="3"/>
          <rect x="28" y="134" width="136" height="16" rx="4" fill="#78350f" opacity="0.3"/>

          <!-- Pearls on Peaks -->
          <circle cx="36" cy="68" r="8" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
          <circle cx="96" cy="46" r="11" fill="#ffffff" stroke="#fef08a" stroke-width="2.5"/>
          <circle cx="156" cy="68" r="8" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
          <circle cx="68" cy="98" r="6" fill="#ffffff" stroke="#fef08a" stroke-width="1.5"/>
          <circle cx="124" cy="98" r="6" fill="#ffffff" stroke="#fef08a" stroke-width="1.5"/>

          <!-- Pearl glints -->
          <circle cx="34" cy="66" r="2.5" fill="#ffffff"/>
          <circle cx="93" cy="43" r="3.5" fill="#ffffff"/>
          <circle cx="154" cy="66" r="2.5" fill="#ffffff"/>

          <!-- Jewels on Base Band -->
          <circle cx="96" cy="142" r="7.5" fill="url(#rubyGem)" stroke="#fef08a" stroke-width="1.5"/>
          <circle cx="60" cy="142" r="6" fill="url(#emeraldGem)" stroke="#fef08a" stroke-width="1.5"/>
          <circle cx="132" cy="142" r="6" fill="url(#sapphireGem)" stroke="#fef08a" stroke-width="1.5"/>
          <circle cx="38" cy="142" r="4.5" fill="url(#rubyGem)" stroke="#fef08a" stroke-width="1"/>
          <circle cx="154" cy="142" r="4.5" fill="url(#rubyGem)" stroke="#fef08a" stroke-width="1"/>

          <!-- Center Arch Jewel -->
          <ellipse cx="96" cy="100" rx="9" ry="12" fill="url(#rubyGem)" stroke="#fef08a" stroke-width="2"/>
          <ellipse cx="94" cy="97" rx="3" ry="4" fill="#ffffff" opacity="0.7"/>

          <!-- Decorative Carvings -->
          <path d="M 40 128 L 96 112 L 152 128" fill="none" stroke="#78350f" stroke-width="2" opacity="0.6"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_star.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="starGoldGlow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="20%" stop-color="#fef08a"/>
            <stop offset="55%" stop-color="#f59e0b"/>
            <stop offset="85%" stop-color="#b45309"/>
            <stop offset="100%" stop-color="#78350f"/>
          </radialGradient>
          <filter id="starShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <filter id="starHalo" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#fbbf24" flood-opacity="0.85"/>
          </filter>
        </defs>

        <g filter="url(#starShadow)">
          <!-- Outer Backing Star -->
          <polygon points="96,16 120,68 176,74 134,114 146,170 96,142 46,170 58,114 16,74 72,68"
                   fill="url(#starGoldGlow)" stroke="#fef08a" stroke-width="5" stroke-linejoin="round" filter="url(#starHalo)"/>

          <!-- 3D Bevel Facets (Light & Dark halves of each star point) -->
          <!-- Top point light facet -->
          <polygon points="96,16 96,104 72,68" fill="#fffbeb" opacity="0.8"/>
          <!-- Top point dark facet -->
          <polygon points="96,16 120,68 96,104" fill="#d97706" opacity="0.6"/>

          <!-- Right top point light -->
          <polygon points="176,74 96,104 120,68" fill="#fef08a" opacity="0.85"/>
          <!-- Right top point dark -->
          <polygon points="176,74 134,114 96,104" fill="#b45309" opacity="0.7"/>

          <!-- Bottom right point light -->
          <polygon points="146,170 96,104 134,114" fill="#fde047" opacity="0.8"/>
          <!-- Bottom right point dark -->
          <polygon points="146,170 96,142 96,104" fill="#92400e" opacity="0.75"/>

          <!-- Bottom left point light -->
          <polygon points="96,142 46,170 96,104" fill="#fbbf24" opacity="0.8"/>
          <!-- Bottom left point dark -->
          <polygon points="46,170 58,114 96,104" fill="#78350f" opacity="0.7"/>

          <!-- Left top point light -->
          <polygon points="58,114 16,74 96,104" fill="#fde047" opacity="0.85"/>
          <!-- Left top point dark -->
          <polygon points="16,74 72,68 96,104" fill="#d97706" opacity="0.65"/>

          <!-- Central Core Sparkle Jewel -->
          <circle cx="96" cy="104" r="14" fill="#ffffff" opacity="0.7"/>
          <polygon points="96,84 100,104 120,104 104,108 108,124 96,112 84,124 88,108 72,104 92,104" fill="#ffffff" opacity="0.9"/>
        </g>
      </svg>
      `
    },
    {
      name: 'icon_hammer.webp',
      svg: `
      <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hammerSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="40%" stop-color="#94a3b8"/>
            <stop offset="80%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="goldInlay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="handleWood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="40%" stop-color="#92400e"/>
            <stop offset="100%" stop-color="#451a03"/>
          </linearGradient>
          <filter id="hammerShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.65"/>
          </filter>
          <filter id="hammerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#f59e0b" flood-opacity="0.7"/>
          </filter>
        </defs>

        <g filter="url(#hammerShadow)" transform="rotate(-30 96 96)">
          <!-- Wood Handle -->
          <rect x="88" y="58" width="16" height="110" rx="6" fill="url(#handleWood)" stroke="#78350f" stroke-width="2"/>
          <!-- Leather Grips -->
          <rect x="86" y="104" width="20" height="8" rx="2" fill="#78350f"/>
          <rect x="86" y="118" width="20" height="8" rx="2" fill="#78350f"/>
          <rect x="86" y="132" width="20" height="8" rx="2" fill="#78350f"/>
          <rect x="86" y="146" width="20" height="8" rx="2" fill="#78350f"/>
          <!-- Pommel Gold Base -->
          <circle cx="96" cy="168" r="12" fill="url(#goldInlay)" stroke="#fef08a" stroke-width="2"/>
          <circle cx="96" cy="168" r="4" fill="#ef4444"/>

          <!-- Steel Hammer Head -->
          <rect x="44" y="32" width="104" height="42" rx="8" fill="url(#hammerSteel)" stroke="#e2e8f0" stroke-width="3" filter="url(#hammerGlow)"/>
          
          <!-- Hammer Striking Faces -->
          <rect x="38" y="28" width="12" height="50" rx="3" fill="url(#goldInlay)" stroke="#fef08a" stroke-width="2"/>
          <rect x="142" y="28" width="12" height="50" rx="3" fill="url(#goldInlay)" stroke="#fef08a" stroke-width="2"/>

          <!-- Rune Center Plate -->
          <rect x="74" y="36" width="44" height="34" rx="4" fill="#1e1b4b" stroke="url(#goldInlay)" stroke-width="2"/>
          <circle cx="96" cy="53" r="8" fill="url(#goldInlay)"/>
          <path d="M 96 46 L 96 60 M 89 53 L 103 53" stroke="#1e1b4b" stroke-width="2"/>
        </g>
      </svg>
      `
    }
  ];

  for (const item of icons) {
    const destPath = path.join(targetDir, item.name);
    console.log(`Generating ${item.name}...`);
    await sharp(Buffer.from(item.svg))
      .resize(192, 192)
      .webp({ quality: 95, lossless: false })
      .toFile(destPath);
    const stat = fs.statSync(destPath);
    console.log(`✓ Created ${item.name} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

generateMoreIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
