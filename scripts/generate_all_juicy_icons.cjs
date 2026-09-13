const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'hud_icons');

// Shared SVG defs helper for juicy lighting
const COMMON_FILTERS = `
  <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
  </filter>
  <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#fbbf24" flood-opacity="0.75"/>
  </filter>
  <filter id="cyanGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#38bdf8" flood-opacity="0.8"/>
  </filter>
  <filter id="rubyGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f43f5e" flood-opacity="0.8"/>
  </filter>
`;

const ICONS = [
  // ==========================================
  // 1. RECURSOS
  // ==========================================
  {
    name: 'icon_gold.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="goldCoinTop" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="25%" stop-color="#fef08a"/>
          <stop offset="60%" stop-color="#f59e0b"/>
          <stop offset="90%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
        <linearGradient id="goldSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="50%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
        <linearGradient id="ingotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <!-- Bottom Ingot -->
        <polygon points="50,152 142,152 134,166 58,166" fill="#78350f"/>
        <polygon points="46,134 146,134 142,152 50,152" fill="url(#ingotGrad)" stroke="#fef08a" stroke-width="2"/>
        <polygon points="54,124 138,124 146,134 46,134" fill="#fffbeb" opacity="0.6"/>

        <!-- Left Coin Stack -->
        <g transform="translate(40, 94)">
          <path d="M 0 18 C 0 34 60 34 60 18 V 28 C 60 44 0 44 0 28 Z" fill="url(#goldSide)"/>
          <ellipse cx="30" cy="18" rx="30" ry="15" fill="url(#goldCoinTop)" stroke="#fffbeb" stroke-width="2.5"/>
          <ellipse cx="30" cy="18" rx="22" ry="10" fill="none" stroke="#78350f" stroke-width="1.5" opacity="0.6"/>
          <circle cx="30" cy="18" r="5" fill="#fef08a"/>
        </g>

        <!-- Right Coin Stack -->
        <g transform="translate(92, 102)">
          <path d="M 0 16 C 0 32 60 32 60 16 V 26 C 60 42 0 42 0 26 Z" fill="url(#goldSide)"/>
          <ellipse cx="30" cy="16" rx="30" ry="15" fill="url(#goldCoinTop)" stroke="#fffbeb" stroke-width="2.5"/>
          <ellipse cx="30" cy="16" rx="22" ry="10" fill="none" stroke="#78350f" stroke-width="1.5" opacity="0.6"/>
          <polygon points="30,11 34,16 39,13 36,21 24,21 21,13 26,16" fill="#78350f" opacity="0.7"/>
        </g>

        <!-- Main Center Big Coin -->
        <g transform="translate(48, 38)">
          <path d="M 0 42 C 0 80 96 80 96 42 V 54 C 96 92 0 92 0 54 Z" fill="url(#goldSide)"/>
          <ellipse cx="48" cy="42" rx="48" ry="28" fill="url(#goldCoinTop)" stroke="#fffbeb" stroke-width="4"/>
          <ellipse cx="48" cy="42" rx="38" ry="21" fill="none" stroke="#78350f" stroke-width="2" opacity="0.5"/>
          
          <!-- Crown Insignia on Center Coin -->
          <path d="M 32 46 L 36 34 L 43 40 L 48 30 L 53 40 L 60 34 L 64 46 Z" fill="#78350f" opacity="0.8"/>
          <ellipse cx="48" cy="47" rx="16" ry="4" fill="#78350f" opacity="0.8"/>

          <!-- Curved Specular Glint -->
          <path d="M 16 38 C 22 24 38 18 56 18" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
          <circle cx="20" cy="44" r="3.5" fill="#ffffff" opacity="0.9"/>
        </g>

        <!-- Sparkles -->
        <polygon points="144,32 148,42 158,46 148,50 144,60 140,50 130,46 140,42" fill="#ffffff" filter="url(#softGlow)"/>
        <polygon points="34,70 36,76 42,78 36,80 34,86 32,80 26,78 32,76" fill="#ffffff" opacity="0.85"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_wood.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="barkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#92400e"/>
          <stop offset="50%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
        <radialGradient id="woodCut" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="35%" stop-color="#fde68a"/>
          <stop offset="70%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#92400e"/>
        </radialGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#86efac"/>
          <stop offset="50%" stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#15803d"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <!-- Bottom Left Log -->
        <g transform="translate(18, 88)">
          <path d="M 38 6 L 108 6 C 118 6 126 24 126 40 C 126 56 118 74 108 74 L 38 74 Z" fill="url(#barkGrad)" stroke="#451a03" stroke-width="3"/>
          <path d="M 60 22 L 102 22 M 52 44 L 110 44 M 68 60 L 98 60" stroke="#451a03" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
          <ellipse cx="38" cy="40" rx="26" ry="34" fill="url(#woodCut)" stroke="#451a03" stroke-width="3.5"/>
          <ellipse cx="38" cy="40" rx="18" ry="24" fill="none" stroke="#b45309" stroke-width="2" opacity="0.7"/>
          <ellipse cx="38" cy="40" rx="10" ry="14" fill="none" stroke="#78350f" stroke-width="2" opacity="0.8"/>
          <circle cx="38" cy="40" r="3.5" fill="#451a03"/>
        </g>

        <!-- Bottom Right Log -->
        <g transform="translate(56, 96)">
          <path d="M 38 6 L 108 6 C 118 6 126 24 126 40 C 126 56 118 74 108 74 L 38 74 Z" fill="url(#barkGrad)" stroke="#451a03" stroke-width="3"/>
          <path d="M 60 22 L 102 22 M 52 44 L 110 44" stroke="#451a03" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
          <ellipse cx="38" cy="40" rx="26" ry="34" fill="url(#woodCut)" stroke="#451a03" stroke-width="3.5"/>
          <ellipse cx="38" cy="40" rx="18" ry="24" fill="none" stroke="#b45309" stroke-width="2" opacity="0.7"/>
          <ellipse cx="38" cy="40" rx="10" ry="14" fill="none" stroke="#78350f" stroke-width="2" opacity="0.8"/>
          <circle cx="38" cy="40" r="3.5" fill="#451a03"/>
        </g>

        <!-- Top Log -->
        <g transform="translate(36, 32)">
          <path d="M 40 6 L 112 6 C 122 6 130 24 130 42 C 130 60 122 78 112 78 L 40 78 Z" fill="url(#barkGrad)" stroke="#451a03" stroke-width="4"/>
          <path d="M 58 14 C 76 12 98 12 110 14" stroke="#d97706" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
          <path d="M 64 30 L 114 30 M 56 50 L 112 50" stroke="#451a03" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
          <ellipse cx="40" cy="42" rx="28" ry="36" fill="url(#woodCut)" stroke="#451a03" stroke-width="4"/>
          <ellipse cx="40" cy="42" rx="20" ry="26" fill="none" stroke="#b45309" stroke-width="2.5" opacity="0.7"/>
          <ellipse cx="40" cy="42" rx="11" ry="15" fill="none" stroke="#78350f" stroke-width="2" opacity="0.8"/>
          <circle cx="40" cy="42" r="4" fill="#451a03"/>
          <path d="M 22 28 C 26 18 36 12 48 12" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        </g>

        <!-- Fresh Green Leaf Sprig -->
        <g transform="translate(136, 38)">
          <path d="M 0 30 C 16 26 30 14 32 -4 C 18 0 4 14 0 30 Z" fill="url(#leafGrad)" stroke="#14532d" stroke-width="2"/>
          <path d="M 2 28 C 10 18 20 8 30 -2" stroke="#bbf7d0" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
        </g>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_stone.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="stoneTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="40%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
        <linearGradient id="stoneLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="60%" stop-color="#64748b"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
        <linearGradient id="stoneRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="60%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
        <linearGradient id="crystalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#67e8f9"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0e7490"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <!-- Base Masonry Block -->
        <g transform="translate(16, 80)">
          <polygon points="46,14 118,6 150,26 80,36" fill="url(#stoneTop)" stroke="#1e293b" stroke-width="3"/>
          <polygon points="46,14 80,36 80,82 46,60" fill="url(#stoneLeft)" stroke="#1e293b" stroke-width="3"/>
          <polygon points="80,36 150,26 150,72 80,82" fill="url(#stoneRight)" stroke="#1e293b" stroke-width="3"/>
        </g>

        <!-- Top Block (Beveled & Layered) -->
        <g transform="translate(42, 28)">
          <polygon points="48,8 108,18 78,52 18,42" fill="url(#stoneTop)" stroke="#1e293b" stroke-width="3.5"/>
          <polygon points="18,42 78,52 78,102 18,92" fill="url(#stoneLeft)" stroke="#1e293b" stroke-width="3.5"/>
          <polygon points="78,52 108,18 108,68 78,102" fill="url(#stoneRight)" stroke="#1e293b" stroke-width="3.5"/>
          <polyline points="48,8 18,42 78,52" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" opacity="0.8"/>
          <polygon points="60,60 72,48 76,64 66,74" fill="url(#crystalGlow)" stroke="#e0f2fe" stroke-width="1.5" filter="url(#cyanGlow)"/>
          <polygon points="70,54 82,44 86,58 76,66" fill="url(#crystalGlow)" stroke="#e0f2fe" stroke-width="1.5"/>
          <circle cx="72" cy="52" r="2" fill="#ffffff"/>
        </g>

        <!-- Stone Chipped Details -->
        <line x1="84" y1="84" x2="94" y2="104" stroke="#1e293b" stroke-width="2"/>
        <line x1="94" y1="104" x2="88" y2="120" stroke="#1e293b" stroke-width="1.5"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_food.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="wheatGold" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
        <radialGradient id="breadCrust" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="25%" stop-color="#fde68a"/>
          <stop offset="60%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
        <linearGradient id="ribbonRed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <!-- Wheat Sheaf Stems -->
        <g stroke="#b45309" stroke-width="3.5" stroke-linecap="round" fill="none">
          <path d="M 96 110 Q 80 145 74 174"/>
          <path d="M 96 110 Q 96 145 96 176"/>
          <path d="M 96 110 Q 112 145 118 174"/>
        </g>

        <!-- Left Wheat Ear -->
        <g transform="translate(68, 62) rotate(-22)">
          <path d="M 0 0 V -48" stroke="#b45309" stroke-width="3"/>
          <ellipse cx="-8" cy="-12" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -8 -12)"/>
          <ellipse cx="8" cy="-18" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 8 -18)"/>
          <ellipse cx="-8" cy="-28" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -8 -28)"/>
          <ellipse cx="8" cy="-34" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 8 -34)"/>
          <ellipse cx="0" cy="-48" rx="6" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5"/>
        </g>

        <!-- Right Wheat Ear -->
        <g transform="translate(124, 62) rotate(22)">
          <path d="M 0 0 V -48" stroke="#b45309" stroke-width="3"/>
          <ellipse cx="-8" cy="-18" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -8 -18)"/>
          <ellipse cx="8" cy="-12" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 8 -12)"/>
          <ellipse cx="-8" cy="-34" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -8 -34)"/>
          <ellipse cx="8" cy="-28" rx="7" ry="11" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 8 -28)"/>
          <ellipse cx="0" cy="-48" rx="6" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5"/>
        </g>

        <!-- Center Wheat Ear -->
        <g transform="translate(96, 52)">
          <path d="M 0 0 V -48" stroke="#b45309" stroke-width="3"/>
          <ellipse cx="-9" cy="-12" rx="8" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -9 -12)"/>
          <ellipse cx="9" cy="-16" rx="8" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 9 -16)"/>
          <ellipse cx="-9" cy="-26" rx="8" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(-30 -9 -26)"/>
          <ellipse cx="9" cy="-30" rx="8" ry="12" fill="url(#wheatGold)" stroke="#78350f" stroke-width="1.5" transform="rotate(30 9 -30)"/>
          <ellipse cx="0" cy="-44" rx="7" ry="14" fill="url(#wheatGold)" stroke="#78350f" stroke-width="2"/>
        </g>

        <!-- Golden Sheaf Ribbon -->
        <rect x="76" y="98" width="40" height="14" rx="4" fill="url(#ribbonRed)" stroke="#fef08a" stroke-width="2"/>
        <circle cx="96" cy="105" r="5" fill="#fef08a" stroke="#78350f" stroke-width="1.5"/>

        <!-- Rustic Baked Bread Loaf -->
        <ellipse cx="96" cy="138" rx="46" ry="26" fill="url(#breadCrust)" stroke="#78350f" stroke-width="3.5"/>
        <path d="M 74 130 Q 82 142 84 148 M 96 126 Q 96 142 96 150 M 118 130 Q 110 142 108 148" stroke="#fffbeb" stroke-width="3" stroke-linecap="round"/>
        <path d="M 68 132 C 78 122 114 122 124 132" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_gem.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="gemTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#bae6fd"/>
          <stop offset="70%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="gemMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
        <linearGradient id="gemBot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="60%" stop-color="#0369a1"/>
          <stop offset="100%" stop-color="#1e3a8a"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <polygon points="96,22 154,64 96,168 38,64" fill="none" stroke="#38bdf8" stroke-width="6" opacity="0.5" filter="url(#cyanGlow)"/>
        <!-- Bottom Pavilion Facets -->
        <polygon points="96,168 76,68 116,68" fill="url(#gemBot)" stroke="#0c4a6e" stroke-width="2"/>
        <polygon points="96,168 38,68 76,68" fill="#0369a1" stroke="#0c4a6e" stroke-width="2"/>
        <polygon points="96,168 116,68 154,68" fill="#1e3a8a" stroke="#0c4a6e" stroke-width="2"/>

        <!-- Crown Upper Facets -->
        <polygon points="96,68 70,36 122,36" fill="url(#gemTop)" stroke="#0284c7" stroke-width="2"/>
        <polygon points="70,36 122,36 142,68 116,68" fill="#e0f2fe" opacity="0.9" stroke="#0284c7" stroke-width="2"/>
        <polygon points="70,36 50,68 76,68" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
        <polygon points="38,68 50,68 70,36" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
        <polygon points="122,36 142,68 154,68" fill="#0284c7" stroke="#0284c7" stroke-width="2"/>

        <line x1="38" y1="68" x2="154" y2="68" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>
        <polygon points="70,36 74,44 82,46 74,48 70,56 66,48 58,46 66,44" fill="#ffffff" filter="url(#cyanGlow)"/>
        <circle cx="122" cy="80" r="3.5" fill="#ffffff" opacity="0.8"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_population.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="popGold" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="60%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
        <radialGradient id="popRuby" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fecdd3"/>
          <stop offset="40%" stop-color="#f43f5e"/>
          <stop offset="80%" stop-color="#be123c"/>
          <stop offset="100%" stop-color="#881337"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <circle cx="96" cy="96" r="76" fill="#1e1b4b" stroke="url(#popGold)" stroke-width="6"/>
        <circle cx="96" cy="96" r="66" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.4"/>

        <!-- Back Person (Lady / Queen) -->
        <g transform="translate(112, 60)">
          <circle cx="14" cy="18" r="16" fill="url(#popRuby)" stroke="#fffbeb" stroke-width="2"/>
          <path d="M 2 12 C 6 4 22 4 26 12" stroke="#fef08a" stroke-width="3" fill="none"/>
          <path d="M -8 68 C -8 44 8 36 24 36 C 40 36 56 44 56 68 Z" fill="url(#popRuby)" stroke="#fffbeb" stroke-width="2"/>
        </g>

        <!-- Front Person (King / Sovereign) -->
        <g transform="translate(52, 66)">
          <polygon points="18,10 24,0 30,8 36,0 42,10" fill="url(#popGold)" stroke="#78350f" stroke-width="1.5"/>
          <circle cx="30" cy="22" r="18" fill="url(#popGold)" stroke="#78350f" stroke-width="2.5"/>
          <circle cx="24" cy="18" r="2.5" fill="#ffffff"/>
          <path d="M 4 72 C 4 46 20 40 30 40 C 40 40 56 46 56 72 Z" fill="url(#popGold)" stroke="#78350f" stroke-width="3"/>
          <path d="M 20 42 L 30 56 L 40 42" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
          <circle cx="30" cy="58" r="4.5" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
        </g>

        <!-- Laurel Branch -->
        <path d="M 52 148 C 76 162 116 162 140 148" fill="none" stroke="url(#popGold)" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="68" cy="153" rx="5" ry="3" fill="url(#popGold)" transform="rotate(-20 68 153)"/>
        <ellipse cx="96" cy="158" rx="5" ry="3" fill="url(#popGold)"/>
        <ellipse cx="124" cy="153" rx="5" ry="3" fill="url(#popGold)" transform="rotate(20 124 153)"/>
      </g>
    </svg>
    `
  },

  // ==========================================
  // 2. BOTONES DE ACCIÓN Y NAVEGACIÓN
  // ==========================================
  {
    name: 'btn_build.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="hammerHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="40%" stop-color="#fde047"/>
          <stop offset="80%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="trowelSteel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <g transform="rotate(45 96 96)">
          <polygon points="96,24 116,74 96,94 76,74" fill="url(#trowelSteel)" stroke="#0f172a" stroke-width="3"/>
          <line x1="96" y1="26" x2="96" y2="92" stroke="#ffffff" stroke-width="2.5" opacity="0.8"/>
          <rect x="92" y="94" width="8" height="24" fill="#334155"/>
          <rect x="88" y="118" width="16" height="46" rx="6" fill="#78350f" stroke="#fde047" stroke-width="2.5"/>
        </g>
        <g transform="rotate(-45 96 96)">
          <rect x="90" y="46" width="12" height="116" rx="5" fill="#78350f" stroke="#451a03" stroke-width="2"/>
          <rect x="86" y="118" width="20" height="38" rx="4" fill="#d97706" stroke="#fde047" stroke-width="2"/>
          <circle cx="96" cy="158" r="8" fill="#fde047" stroke="#78350f" stroke-width="2"/>
          <rect x="52" y="24" width="88" height="42" rx="8" fill="url(#hammerHead)" stroke="#fef08a" stroke-width="3.5" filter="url(#softGlow)"/>
          <rect x="46" y="20" width="10" height="50" rx="3" fill="#fde047" stroke="#78350f" stroke-width="2"/>
          <rect x="136" y="20" width="10" height="50" rx="3" fill="#fde047" stroke="#78350f" stroke-width="2"/>
          <polygon points="96,33 105,45 96,57 87,45" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
        </g>
        <polygon points="152,38 156,48 166,52 156,56 152,66 148,56 138,52 148,48" fill="#ffffff" filter="url(#softGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_army.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="swordBlade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
        <radialGradient id="helmGold" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <g transform="rotate(45 96 96)">
          <path d="M 92 18 L 96 6 L 100 18 L 100 134 L 92 134 Z" fill="url(#swordBlade)" stroke="#1e293b" stroke-width="2"/>
          <line x1="96" y1="8" x2="96" y2="134" stroke="#ffffff" stroke-width="2"/>
          <rect x="74" y="134" width="44" height="10" rx="3" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
          <rect x="92" y="144" width="8" height="24" rx="2" fill="#78350f"/>
          <circle cx="96" cy="172" r="8" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
        </g>
        <g transform="rotate(-45 96 96)">
          <path d="M 92 18 L 96 6 L 100 18 L 100 134 L 92 134 Z" fill="url(#swordBlade)" stroke="#1e293b" stroke-width="2"/>
          <line x1="96" y1="8" x2="96" y2="134" stroke="#ffffff" stroke-width="2"/>
          <rect x="74" y="134" width="44" height="10" rx="3" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
          <rect x="92" y="144" width="8" height="24" rx="2" fill="#78350f"/>
          <circle cx="96" cy="172" r="8" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
        </g>
        <g transform="translate(48, 48)">
          <path d="M 32 4 C 48 -10 68 8 72 24 C 62 18 42 16 32 26 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2.5" filter="url(#rubyGlow)"/>
          <path d="M 16 48 C 16 20 80 20 80 48 V 74 C 70 86 58 86 48 88 C 38 86 26 86 16 74 Z" fill="url(#helmGold)" stroke="#78350f" stroke-width="4"/>
          <path d="M 28 54 H 68 V 62 H 52 V 82 H 44 V 62 H 28 Z" fill="#0f172a" stroke="#78350f" stroke-width="2"/>
          <path d="M 28 62 L 18 78" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
          <path d="M 68 62 L 78 78" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
          <path d="M 22 46 C 36 40 60 40 74 46" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_quests.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="scrollPaper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="25%" stop-color="#fef3c7"/>
          <stop offset="70%" stop-color="#fde68a"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
        <radialGradient id="waxSeal" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fca5a5"/>
          <stop offset="40%" stop-color="#ef4444"/>
          <stop offset="85%" stop-color="#991b1b"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <ellipse cx="96" cy="38" rx="64" ry="12" fill="#d97706" stroke="#78350f" stroke-width="3"/>
        <ellipse cx="36" cy="38" rx="8" ry="12" fill="#fde68a" stroke="#78350f" stroke-width="2"/>
        <ellipse cx="156" cy="38" rx="8" ry="12" fill="#fde68a" stroke="#78350f" stroke-width="2"/>
        <path d="M 38 38 C 38 78 30 118 34 150 C 60 156 132 156 158 150 C 162 118 154 78 154 38 Z" 
              fill="url(#scrollPaper)" stroke="#78350f" stroke-width="4"/>
        <ellipse cx="96" cy="150" rx="62" ry="10" fill="#d97706" stroke="#78350f" stroke-width="3"/>
        <line x1="56" y1="62" x2="136" y2="62" stroke="#78350f" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <line x1="56" y1="78" x2="126" y2="78" stroke="#78350f" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <line x1="56" y1="94" x2="132" y2="94" stroke="#78350f" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <line x1="56" y1="110" x2="106" y2="110" stroke="#78350f" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
        <path d="M 126 100 L 138 174 L 148 166 L 158 174 L 146 100 Z" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
        <circle cx="134" cy="120" r="22" fill="url(#waxSeal)" stroke="#450a0a" stroke-width="3" filter="url(#rubyGlow)"/>
        <circle cx="134" cy="120" r="16" fill="none" stroke="#fecdd3" stroke-width="2" opacity="0.6"/>
        <polygon points="134,110 137,118 144,118 139,123 141,130 134,126 127,130 129,123 124,118 131,118" fill="#ffffff" opacity="0.9"/>
        <circle cx="128" cy="114" r="2.5" fill="#ffffff" opacity="0.8"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_expedition.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="compassBrass" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="25%" stop-color="#fde047"/>
          <stop offset="60%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
        <radialGradient id="compassDial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="70%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <circle cx="96" cy="24" r="16" fill="none" stroke="url(#compassBrass)" stroke-width="6"/>
        <circle cx="96" cy="24" r="16" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
        <circle cx="96" cy="104" r="74" fill="url(#compassBrass)" stroke="#78350f" stroke-width="5"/>
        <circle cx="96" cy="104" r="66" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.7"/>
        <circle cx="96" cy="104" r="60" fill="url(#compassDial)" stroke="#78350f" stroke-width="3"/>
        <line x1="96" y1="48" x2="96" y2="58" stroke="#fde047" stroke-width="3"/>
        <line x1="96" y1="150" x2="96" y2="160" stroke="#fde047" stroke-width="3"/>
        <line x1="40" y1="104" x2="50" y2="104" stroke="#fde047" stroke-width="3"/>
        <line x1="142" y1="104" x2="152" y2="104" stroke="#fde047" stroke-width="3"/>
        <polygon points="96,52 105,104 96,98" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" filter="url(#rubyGlow)"/>
        <polygon points="96,52 87,104 96,98" fill="#f87171" stroke="#7f1d1d" stroke-width="1.5"/>
        <polygon points="96,156 105,104 96,110" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>
        <polygon points="96,156 87,104 96,110" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
        <circle cx="96" cy="104" r="10" fill="url(#compassBrass)" stroke="#ffffff" stroke-width="2"/>
        <circle cx="96" cy="104" r="4" fill="#ef4444"/>
        <path d="M 48 80 C 60 56 86 48 116 52" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_inventory.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="chestWood" cx="45%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#b45309"/>
          <stop offset="40%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </radialGradient>
        <linearGradient id="chestGoldRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <ellipse cx="96" cy="92" rx="52" ry="16" fill="#fef08a" filter="url(#softGlow)" opacity="0.8"/>
        <rect x="34" y="92" width="124" height="68" rx="10" fill="url(#chestWood)" stroke="#451a03" stroke-width="4"/>
        <line x1="36" y1="114" x2="156" y2="114" stroke="#451a03" stroke-width="3"/>
        <line x1="36" y1="136" x2="156" y2="136" stroke="#451a03" stroke-width="3"/>
        <rect x="34" y="92" width="18" height="68" fill="url(#chestGoldRim)" stroke="#451a03" stroke-width="2"/>
        <rect x="140" y="92" width="18" height="68" fill="url(#chestGoldRim)" stroke="#451a03" stroke-width="2"/>
        <rect x="87" y="92" width="18" height="68" fill="url(#chestGoldRim)" stroke="#451a03" stroke-width="2"/>
        <circle cx="43" cy="104" r="3" fill="#fef08a"/>
        <circle cx="43" cy="126" r="3" fill="#fef08a"/>
        <circle cx="43" cy="148" r="3" fill="#fef08a"/>
        <circle cx="149" cy="104" r="3" fill="#fef08a"/>
        <circle cx="149" cy="126" r="3" fill="#fef08a"/>
        <circle cx="149" cy="148" r="3" fill="#fef08a"/>
        <path d="M 28 88 C 28 50 164 50 164 88 Z" fill="url(#chestWood)" stroke="#451a03" stroke-width="4"/>
        <path d="M 28 88 C 28 50 164 50 164 88" fill="none" stroke="url(#chestGoldRim)" stroke-width="8"/>
        <path d="M 87 52 C 93 51 99 51 105 52 V 88 H 87 Z" fill="url(#chestGoldRim)" stroke="#451a03" stroke-width="2"/>
        <circle cx="96" cy="104" r="12" fill="url(#chestGoldRim)" stroke="#451a03" stroke-width="2.5" filter="url(#softGlow)"/>
        <circle cx="96" cy="102" r="3" fill="#1e1b4b"/>
        <polygon points="94,102 98,102 99,110 93,110" fill="#1e1b4b"/>
        <polygon points="68,82 74,74 82,80 78,88 70,88" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="124" cy="84" r="6" fill="#ef4444" stroke="#fef08a" stroke-width="1.5"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_ranking.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="rankGold" cx="45%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="25%" stop-color="#fef08a"/>
          <stop offset="60%" stop-color="#f59e0b"/>
          <stop offset="90%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <rect x="24" y="112" width="44" height="52" rx="6" fill="#64748b" stroke="#cbd5e1" stroke-width="3"/>
        <text x="46" y="146" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>
        <rect x="124" y="126" width="44" height="38" rx="6" fill="#b45309" stroke="#fde68a" stroke-width="3"/>
        <text x="146" y="154" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">3</text>
        <rect x="68" y="90" width="56" height="74" rx="8" fill="url(#rankGold)" stroke="#fef08a" stroke-width="3.5" filter="url(#softGlow)"/>
        <text x="96" y="136" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#78350f" text-anchor="middle">1</text>
        <text x="96" y="135" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">1</text>
        <g transform="translate(58, 28)">
          <path d="M 8 52 L 14 26 L 28 38 L 38 16 L 48 38 L 62 26 L 68 52 Z" 
                fill="url(#rankGold)" stroke="#78350f" stroke-width="3" filter="url(#softGlow)"/>
          <rect x="6" y="50" width="64" height="12" rx="4" fill="url(#rankGold)" stroke="#78350f" stroke-width="2"/>
          <circle cx="14" cy="26" r="4.5" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
          <circle cx="38" cy="16" r="6" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5"/>
          <circle cx="62" cy="26" r="4.5" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
          <circle cx="38" cy="56" r="4" fill="#ef4444"/>
          <circle cx="20" cy="56" r="3" fill="#38bdf8"/>
          <circle cx="56" cy="56" r="3" fill="#22c55e"/>
        </g>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_settings.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="gearGold" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="65%" stop-color="#f59e0b"/>
          <stop offset="90%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <g transform="translate(96, 96)">
          <g fill="url(#gearGold)" stroke="#78350f" stroke-width="4">
            <rect x="-14" y="-76" width="28" height="24" rx="5"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(45)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(90)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(135)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(180)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(225)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(270)"/>
            <rect x="-14" y="-76" width="28" height="24" rx="5" transform="rotate(315)"/>
            <circle cx="0" cy="0" r="62" fill="url(#gearGold)" stroke="#78350f" stroke-width="4"/>
          </g>
          <circle cx="0" cy="0" r="48" fill="#78350f"/>
          <circle cx="0" cy="0" r="44" fill="#0f172a"/>
          <circle cx="0" cy="0" r="28" fill="#0284c7" stroke="#38bdf8" stroke-width="3" filter="url(#cyanGlow)"/>
          <circle cx="0" cy="0" r="14" fill="#ffffff" opacity="0.85"/>
          <circle cx="-6" cy="-6" r="5" fill="#ffffff"/>
          <path d="M -38 -38 C -14 -58 24 -56 46 -36" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        </g>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_sound.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="bellGold" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="65%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <g transform="translate(42, 38)">
          <ellipse cx="44" cy="10" rx="12" ry="7" fill="none" stroke="url(#bellGold)" stroke-width="5"/>
          <path d="M 44 14 C 28 14 24 38 18 68 C 14 84 4 92 4 98 H 84 C 84 92 74 84 70 68 C 64 38 60 14 44 14 Z" 
                fill="url(#bellGold)" stroke="#78350f" stroke-width="4"/>
          <circle cx="44" cy="106" r="12" fill="#78350f" stroke="#fde047" stroke-width="2.5"/>
          <ellipse cx="44" cy="98" rx="40" ry="8" fill="url(#bellGold)" stroke="#78350f" stroke-width="3"/>
          <path d="M 28 32 C 26 50 24 70 20 84" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.8"/>
        </g>
        <g stroke="#38bdf8" stroke-width="5" stroke-linecap="round" fill="none" filter="url(#cyanGlow)">
          <path d="M 136 70 C 148 84 148 108 136 122"/>
          <path d="M 152 54 C 172 76 172 116 152 138"/>
        </g>
        <polygon points="144,36 148,44 156,48 148,52 144,60 140,52 132,48 140,44" fill="#ffffff" filter="url(#softGlow)"/>
      </g>
    </svg>
    `
  },

  // ==========================================
  // 3. MODOS DE JUEGO Y CONTROLES
  // ==========================================
  {
    name: 'btn_arena.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="arenaSand" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#7c2d12"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 96 22 L 158 52 V 110 C 158 146 128 168 96 176 C 64 168 34 146 34 110 V 52 Z" 
              fill="url(#arenaSand)" stroke="#fef08a" stroke-width="5" filter="url(#softGlow)"/>
        <g fill="#451a03" opacity="0.8">
          <rect x="52" y="70" width="12" height="20" rx="6"/>
          <rect x="74" y="64" width="14" height="24" rx="7"/>
          <rect x="104" y="64" width="14" height="24" rx="7"/>
          <rect x="128" y="70" width="12" height="20" rx="6"/>
        </g>
        <g stroke="#ffffff" stroke-width="2.5">
          <line x1="56" y1="138" x2="136" y2="58" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
          <line x1="56" y1="138" x2="136" y2="58" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <line x1="136" y1="138" x2="56" y2="58" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
          <line x1="136" y1="138" x2="56" y2="58" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        </g>
        <circle cx="96" cy="116" r="24" fill="#991b1b" stroke="#fef08a" stroke-width="3"/>
        <polygon points="96,104 100,114 110,114 102,120 105,130 96,124 87,130 90,120 82,114 92,114" fill="#fef08a"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_harvest_all.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="scytheGold" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
        <linearGradient id="scytheBlade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <g transform="translate(96, 110)">
          <ellipse cx="-20" cy="-20" rx="9" ry="24" fill="#f59e0b" transform="rotate(-30)"/>
          <ellipse cx="0" cy="-28" rx="10" ry="28" fill="#fde047"/>
          <ellipse cx="20" cy="-20" rx="9" ry="24" fill="#f59e0b" transform="rotate(30)"/>
        </g>
        <path d="M 52 152 Q 88 124 108 92" stroke="#78350f" stroke-width="10" stroke-linecap="round" fill="none"/>
        <path d="M 52 152 Q 88 124 108 92" stroke="#d97706" stroke-width="6" stroke-linecap="round" fill="none"/>
        <circle cx="48" cy="156" r="8" fill="url(#scytheGold)" stroke="#78350f" stroke-width="2"/>
        <path d="M 102 96 C 114 62 136 34 162 26 C 144 56 122 88 96 110 Z" 
              fill="url(#scytheBlade)" stroke="#475569" stroke-width="2.5" filter="url(#softGlow)"/>
        <path d="M 102 96 C 114 62 136 34 162 26" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <polygon points="152,56 156,66 166,70 156,74 152,84 148,74 138,70 148,66" fill="#ffffff" filter="url(#softGlow)"/>
        <circle cx="116" cy="138" r="4" fill="#fef08a"/>
        <circle cx="74" cy="92" r="3" fill="#fef08a"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_upgrade.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="upgGold" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="25%" stop-color="#fef08a"/>
          <stop offset="55%" stop-color="#f59e0b"/>
          <stop offset="85%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 44 146 L 96 98 L 148 146 L 132 162 L 96 128 L 60 162 Z" 
              fill="url(#upgGold)" stroke="#78350f" stroke-width="3"/>
        <path d="M 32 96 L 96 34 L 160 96 L 140 114 L 96 72 L 52 114 Z" 
              fill="url(#upgGold)" stroke="#fef08a" stroke-width="4" filter="url(#softGlow)"/>
        <polyline points="38,92 96,38 154,92" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>
        <polygon points="96,16 99,26 109,29 99,32 96,42 93,32 83,29 93,26" fill="#ffffff" filter="url(#softGlow)"/>
        <circle cx="56" cy="46" r="4" fill="#fef08a"/>
        <circle cx="136" cy="46" r="4" fill="#fef08a"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_close.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="closeRuby" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fecdd3"/>
          <stop offset="25%" stop-color="#f43f5e"/>
          <stop offset="60%" stop-color="#e11d48"/>
          <stop offset="90%" stop-color="#9f1239"/>
          <stop offset="100%" stop-color="#4c0519"/>
        </radialGradient>
        <radialGradient id="closeRim" cx="45%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <circle cx="96" cy="96" r="74" fill="url(#closeRim)" stroke="#78350f" stroke-width="5"/>
        <circle cx="96" cy="96" r="64" fill="url(#closeRuby)" stroke="#4c0519" stroke-width="4" filter="url(#rubyGlow)"/>
        <circle cx="96" cy="96" r="56" fill="none" stroke="#f43f5e" stroke-width="2" opacity="0.6"/>
        <g stroke="#ffffff" stroke-width="18" stroke-linecap="round">
          <line x1="64" y1="64" x2="128" y2="128"/>
          <line x1="128" y1="64" x2="64" y2="128"/>
        </g>
        <g stroke="#fff1f2" stroke-width="12" stroke-linecap="round">
          <line x1="64" y1="64" x2="128" y2="128"/>
          <line x1="128" y1="64" x2="64" y2="128"/>
        </g>
        <path d="M 52 64 C 64 48 84 42 108 42" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        <circle cx="58" cy="74" r="3.5" fill="#ffffff" opacity="0.9"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_zoom_in.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="zoomGlass" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#e0f2fe"/>
          <stop offset="70%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </radialGradient>
        <radialGradient id="zoomBrass" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 124 124 L 164 164" stroke="#78350f" stroke-width="26" stroke-linecap="round"/>
        <path d="M 124 124 L 164 164" stroke="url(#zoomBrass)" stroke-width="20" stroke-linecap="round"/>
        <circle cx="164" cy="164" r="10" fill="#fef08a" stroke="#78350f" stroke-width="3"/>
        <circle cx="82" cy="82" r="62" fill="url(#zoomBrass)" stroke="#78350f" stroke-width="5"/>
        <circle cx="82" cy="82" r="50" fill="url(#zoomGlass)" stroke="#0369a1" stroke-width="3" filter="url(#cyanGlow)"/>
        <rect x="74" y="52" width="16" height="60" rx="6" fill="#ffffff" stroke="#0369a1" stroke-width="2"/>
        <rect x="52" y="74" width="60" height="16" rx="6" fill="#ffffff" stroke="#0369a1" stroke-width="2"/>
        <path d="M 46 64 C 54 48 70 42 90 42" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
      </g>
    </svg>
    `
  },
  {
    name: 'btn_zoom_out.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="zoomGlassOut" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#e0f2fe"/>
          <stop offset="70%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </radialGradient>
        <radialGradient id="zoomBrassOut" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 124 124 L 164 164" stroke="#78350f" stroke-width="26" stroke-linecap="round"/>
        <path d="M 124 124 L 164 164" stroke="url(#zoomBrassOut)" stroke-width="20" stroke-linecap="round"/>
        <circle cx="164" cy="164" r="10" fill="#fef08a" stroke="#78350f" stroke-width="3"/>
        <circle cx="82" cy="82" r="62" fill="url(#zoomBrassOut)" stroke="#78350f" stroke-width="5"/>
        <circle cx="82" cy="82" r="50" fill="url(#zoomGlassOut)" stroke="#0369a1" stroke-width="3" filter="url(#cyanGlow)"/>
        <rect x="52" y="74" width="60" height="16" rx="6" fill="#ffffff" stroke="#0369a1" stroke-width="2"/>
        <path d="M 46 64 C 54 48 70 42 90 42" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
      </g>
    </svg>
    `
  },

  // ==========================================
  // 4. COMBATE, RELIQUIAS Y STATS
  // ==========================================
  {
    name: 'icon_shield.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="shieldBlue" cx="45%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="40%" stop-color="#0284c7"/>
          <stop offset="80%" stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
        <radialGradient id="shieldGold" cx="45%" cy="25%" r="70%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="65%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 96 22 C 146 22 164 42 164 78 C 164 128 122 166 96 176 C 70 166 28 128 28 78 C 28 42 46 22 96 22 Z" 
              fill="url(#shieldGold)" stroke="#78350f" stroke-width="4"/>
        <path d="M 96 32 C 138 32 152 48 152 80 C 152 122 118 154 96 164 C 74 154 40 122 40 80 C 40 48 54 32 96 32 Z" 
              fill="url(#shieldBlue)" stroke="#1e293b" stroke-width="3"/>
        <path d="M 96 46 L 102 76 L 126 76 L 106 92 L 114 122 L 96 104 L 78 122 L 86 92 L 66 76 L 90 76 Z" 
              fill="url(#shieldGold)" stroke="#78350f" stroke-width="2" filter="url(#softGlow)"/>
        <path d="M 52 46 C 66 38 82 36 96 36" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.8"/>
        <circle cx="56" cy="54" r="3" fill="#ffffff"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_crown.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="crownGoldNew" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="25%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="85%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 38 120 C 38 68 154 68 154 120 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
        <path d="M 96 68 V 120" stroke="#fef08a" stroke-width="2" opacity="0.4"/>
        <path d="M 28 136 L 36 68 L 68 98 L 96 46 L 124 98 L 156 68 L 164 136 Z" 
              fill="url(#crownGoldNew)" stroke="#fef08a" stroke-width="4" stroke-linejoin="round" filter="url(#softGlow)"/>
        <rect x="24" y="130" width="144" height="24" rx="6" fill="url(#crownGoldNew)" stroke="#fef08a" stroke-width="3"/>
        <rect x="28" y="134" width="136" height="16" rx="4" fill="#78350f" opacity="0.3"/>
        <circle cx="36" cy="68" r="8" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
        <circle cx="96" cy="46" r="11" fill="#ffffff" stroke="#fef08a" stroke-width="2.5"/>
        <circle cx="156" cy="68" r="8" fill="#ffffff" stroke="#fef08a" stroke-width="2"/>
        <circle cx="68" cy="98" r="6" fill="#ffffff" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="124" cy="98" r="6" fill="#ffffff" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="96" cy="142" r="7.5" fill="#ef4444" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="60" cy="142" r="6" fill="#10b981" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="132" cy="142" r="6" fill="#3b82f6" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="38" cy="142" r="4.5" fill="#ef4444" stroke="#fef08a" stroke-width="1"/>
        <circle cx="154" cy="142" r="4.5" fill="#ef4444" stroke="#fef08a" stroke-width="1"/>
        <ellipse cx="96" cy="100" rx="9" ry="12" fill="#ef4444" stroke="#fef08a" stroke-width="2"/>
        <ellipse cx="94" cy="97" rx="3" ry="4" fill="#ffffff" opacity="0.8"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_trophy.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="trophyGoldNew" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="65%" stop-color="#eab308"/>
          <stop offset="90%" stop-color="#ca8a04"/>
          <stop offset="100%" stop-color="#854d0e"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 50 56 C 24 56 20 96 54 104" fill="none" stroke="url(#trophyGoldNew)" stroke-width="12" stroke-linecap="round"/>
        <path d="M 142 56 C 168 56 172 96 138 104" fill="none" stroke="url(#trophyGoldNew)" stroke-width="12" stroke-linecap="round"/>
        <polygon points="76,146 116,146 110,122 82,122" fill="url(#trophyGoldNew)" stroke="#854d0e" stroke-width="2"/>
        <rect x="58" y="146" width="76" height="24" rx="6" fill="#713f12" stroke="#fef08a" stroke-width="3"/>
        <path d="M 50 46 C 50 96 74 122 96 122 C 118 122 142 96 142 46 Z" 
              fill="url(#trophyGoldNew)" stroke="#fef08a" stroke-width="5" filter="url(#softGlow)"/>
        <ellipse cx="96" cy="46" rx="46" ry="12" fill="#fef08a" stroke="#854d0e" stroke-width="3"/>
        <ellipse cx="96" cy="46" rx="40" ry="8" fill="#ca8a04"/>
        <polygon points="96,66 99,75 108,75 101,81 103,90 96,84 89,90 91,81 84,75 93,75" fill="#ffffff" stroke="#a16207" stroke-width="1.5"/>
        <path d="M 64 62 C 60 78 68 96 76 104" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_star.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="starGoldGlowNew" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#fef08a"/>
          <stop offset="55%" stop-color="#f59e0b"/>
          <stop offset="85%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <polygon points="96,16 120,68 176,74 134,114 146,170 96,142 46,170 58,114 16,74 72,68"
                 fill="url(#starGoldGlowNew)" stroke="#fef08a" stroke-width="5" stroke-linejoin="round" filter="url(#softGlow)"/>
        <polygon points="96,16 96,104 72,68" fill="#fffbeb" opacity="0.8"/>
        <polygon points="96,16 120,68 96,104" fill="#d97706" opacity="0.6"/>
        <polygon points="176,74 96,104 120,68" fill="#fef08a" opacity="0.85"/>
        <polygon points="176,74 134,114 96,104" fill="#b45309" opacity="0.7"/>
        <polygon points="146,170 96,104 134,114" fill="#fde047" opacity="0.8"/>
        <polygon points="146,170 96,142 96,104" fill="#92400e" opacity="0.75"/>
        <polygon points="96,142 46,170 96,104" fill="#fbbf24" opacity="0.8"/>
        <polygon points="46,170 58,114 96,104" fill="#78350f" opacity="0.7"/>
        <polygon points="58,114 16,74 96,104" fill="#fde047" opacity="0.85"/>
        <polygon points="16,74 72,68 96,104" fill="#d97706" opacity="0.65"/>
        <circle cx="96" cy="104" r="14" fill="#ffffff" opacity="0.7"/>
        <polygon points="96,84 100,104 120,104 104,108 108,124 96,112 84,124 88,108 72,104 92,104" fill="#ffffff" opacity="0.95"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_skull.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="boneColorNew" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="#cbd5e1"/>
          <stop offset="85%" stop-color="#64748b"/>
          <stop offset="100%" stop-color="#334155"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 44 92 C 40 44 70 24 96 24 C 122 24 152 44 148 92 C 146 114 136 126 124 130 V 154 C 124 162 118 166 108 166 H 84 C 74 166 68 162 68 154 V 130 C 56 126 46 114 44 92 Z" 
              fill="url(#boneColorNew)" stroke="#1e293b" stroke-width="5"/>
        <ellipse cx="76" cy="94" rx="14" ry="18" fill="#1e1b4b" filter="url(#rubyGlow)"/>
        <ellipse cx="116" cy="94" rx="14" ry="18" fill="#1e1b4b" filter="url(#rubyGlow)"/>
        <circle cx="76" cy="96" r="6" fill="#ef4444"/>
        <circle cx="116" cy="96" r="6" fill="#ef4444"/>
        <circle cx="74" cy="94" r="2" fill="#fef08a"/>
        <circle cx="114" cy="94" r="2" fill="#fef08a"/>
        <polygon points="96,114 90,128 102,128" fill="#0f172a"/>
        <line x1="82" y1="148" x2="82" y2="164" stroke="#0f172a" stroke-width="3"/>
        <line x1="96" y1="146" x2="96" y2="166" stroke="#0f172a" stroke-width="3"/>
        <line x1="110" y1="148" x2="110" y2="164" stroke="#0f172a" stroke-width="3"/>
        <path d="M 64 48 C 76 36 100 34 120 40" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_bomb.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="ironSphereNew" cx="38%" cy="38%" r="65%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="35%" stop-color="#334155"/>
          <stop offset="75%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 112 56 C 122 42 134 40 144 26" fill="none" stroke="#d97706" stroke-width="7" stroke-linecap="round"/>
        <circle cx="148" cy="22" r="14" fill="#ef4444" filter="url(#softGlow)"/>
        <polygon points="148,8 152,18 162,22 152,26 148,36 144,26 134,22 144,18" fill="#ffffff"/>
        <rect x="96" y="52" width="30" height="14" rx="4" fill="#d97706" stroke="#fef08a" stroke-width="2" transform="rotate(-20 96 52)"/>
        <circle cx="90" cy="112" r="66" fill="url(#ironSphereNew)" stroke="#475569" stroke-width="4"/>
        <path d="M 64 104 L 88 126 L 114 98" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
        <circle cx="88" cy="126" r="4" fill="#fef08a"/>
        <path d="M 52 86 C 60 70 76 60 94 58" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
        <circle cx="118" cy="74" r="4" fill="#ffffff" opacity="0.6"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_potion.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="elixirGlowNew" cx="45%" cy="65%" r="60%">
          <stop offset="0%" stop-color="#f472b6"/>
          <stop offset="45%" stop-color="#c026d3"/>
          <stop offset="85%" stop-color="#701a75"/>
          <stop offset="100%" stop-color="#2e1065"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <polygon points="80,32 112,32 108,18 84,18" fill="#d97706" stroke="#fef08a" stroke-width="2"/>
        <ellipse cx="96" cy="18" rx="12" ry="4" fill="#fbbf24"/>
        <ellipse cx="96" cy="34" rx="20" ry="7" fill="#38bdf8" stroke="#ffffff" stroke-width="2.5" opacity="0.9"/>
        <path d="M 82 34 L 84 66 L 50 128 C 42 144 52 170 74 176 C 96 182 116 180 134 168 C 150 156 152 136 142 124 L 110 66 L 112 34 Z" 
              fill="url(#elixirGlowNew)" stroke="#38bdf8" stroke-width="5" filter="url(#rubyGlow)"/>
        <circle cx="86" cy="142" r="6" fill="#fbcfe8" opacity="0.85"/>
        <circle cx="106" cy="132" r="4" fill="#fbcfe8" opacity="0.9"/>
        <circle cx="94" cy="158" r="5" fill="#fbcfe8" opacity="0.75"/>
        <path d="M 64 126 C 56 140 60 158 72 168" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
        <circle cx="120" cy="150" r="3.5" fill="#ffffff" opacity="0.85"/>
      </g>
    </svg>
    `
  },

  // ==========================================
  // 5. BUFFS, HERRAMIENTAS Y ESTADOS
  // ==========================================
  {
    name: 'icon_speedup.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="hourglassGold" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <ellipse cx="96" cy="30" rx="52" ry="12" fill="url(#hourglassGold)" stroke="#78350f" stroke-width="3"/>
        <ellipse cx="96" cy="162" rx="52" ry="12" fill="url(#hourglassGold)" stroke="#78350f" stroke-width="3"/>
        <line x1="52" y1="30" x2="52" y2="162" stroke="url(#hourglassGold)" stroke-width="7" stroke-linecap="round"/>
        <line x1="140" y1="30" x2="140" y2="162" stroke="url(#hourglassGold)" stroke-width="7" stroke-linecap="round"/>
        <path d="M 60 38 C 60 84 88 96 96 96 C 104 96 132 84 132 38 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="3" opacity="0.8"/>
        <path d="M 60 154 C 60 108 88 96 96 96 C 104 96 132 108 132 154 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="3" opacity="0.8"/>
        <path d="M 72 70 C 80 84 112 84 120 70 Z" fill="#38bdf8" filter="url(#cyanGlow)"/>
        <path d="M 68 152 C 78 126 114 126 124 152 Z" fill="#38bdf8" filter="url(#cyanGlow)"/>
        <line x1="96" y1="74" x2="96" y2="136" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <polygon points="112,48 84,94 102,94 82,144 116,92 98,92" fill="#fde047" stroke="#78350f" stroke-width="2.5" filter="url(#softGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_horn.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="hornIvory" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="40%" stop-color="#fed7aa"/>
          <stop offset="80%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 44 144 C 44 144 56 68 136 44 C 152 40 162 52 156 68 C 120 96 100 128 88 154 C 80 168 56 166 44 144 Z" 
              fill="url(#hornIvory)" stroke="#78350f" stroke-width="4"/>
        <path d="M 88 114 C 98 106 108 102 118 96" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
        <path d="M 64 140 C 70 134 78 130 84 126" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
        <rect x="36" y="142" width="16" height="14" rx="4" fill="#fde047" stroke="#78350f" stroke-width="2" transform="rotate(-35 36 142)"/>
        <g stroke="#f59e0b" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#softGlow)">
          <path d="M 160 38 C 172 48 176 64 170 78"/>
          <path d="M 172 26 C 188 42 192 68 182 90"/>
        </g>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_hammer.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="hammerSteelNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="80%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <g filter="url(#dropShadow)" transform="rotate(-30 96 96)">
        <rect x="88" y="58" width="16" height="110" rx="6" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <rect x="86" y="104" width="20" height="8" rx="2" fill="#d97706"/>
        <rect x="86" y="118" width="20" height="8" rx="2" fill="#d97706"/>
        <rect x="86" y="132" width="20" height="8" rx="2" fill="#d97706"/>
        <circle cx="96" cy="168" r="12" fill="#fde047" stroke="#78350f" stroke-width="2"/>
        <rect x="44" y="32" width="104" height="42" rx="8" fill="url(#hammerSteelNew)" stroke="#e2e8f0" stroke-width="3" filter="url(#softGlow)"/>
        <rect x="38" y="28" width="12" height="50" rx="3" fill="#fde047" stroke="#78350f" stroke-width="2"/>
        <rect x="142" y="28" width="12" height="50" rx="3" fill="#fde047" stroke="#78350f" stroke-width="2"/>
        <rect x="74" y="36" width="44" height="34" rx="4" fill="#1e1b4b" stroke="#fde047" stroke-width="2"/>
        <circle cx="96" cy="53" r="8" fill="#38bdf8" filter="url(#cyanGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_roulette.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="rimGold" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="30%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <circle cx="96" cy="96" r="76" fill="url(#rimGold)" stroke="#78350f" stroke-width="5"/>
        <g transform="translate(96, 96)">
          <path d="M 0 0 L 0 -64 A 64 64 0 0 1 45 -45 Z" fill="#ef4444"/>
          <path d="M 0 0 L 45 -45 A 64 64 0 0 1 64 0 Z" fill="#f59e0b"/>
          <path d="M 0 0 L 64 0 A 64 64 0 0 1 45 45 Z" fill="#10b981"/>
          <path d="M 0 0 L 45 45 A 64 64 0 0 1 0 64 Z" fill="#06b6d4"/>
          <path d="M 0 0 L 0 64 A 64 64 0 0 1 -45 45 Z" fill="#3b82f6"/>
          <path d="M 0 0 L -45 45 A 64 64 0 0 1 -64 0 Z" fill="#a855f7"/>
          <path d="M 0 0 L -64 0 A 64 64 0 0 1 -45 -45 Z" fill="#ec4899"/>
          <path d="M 0 0 L -45 -45 A 64 64 0 0 1 0 -64 Z" fill="#eab308"/>
        </g>
        <circle cx="96" cy="96" r="64" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.7"/>
        <circle cx="96" cy="96" r="22" fill="url(#rimGold)" stroke="#78350f" stroke-width="3" filter="url(#softGlow)"/>
        <circle cx="96" cy="96" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
        <polygon points="96,16 106,34 86,34" fill="#ffffff" stroke="#78350f" stroke-width="2.5" filter="url(#softGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_check.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="emeraldBgNew" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="50%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <circle cx="96" cy="96" r="76" fill="url(#emeraldBgNew)" stroke="#fde047" stroke-width="7" filter="url(#softGlow)"/>
        <circle cx="96" cy="96" r="64" fill="none" stroke="#a7f3d0" stroke-width="2.5" opacity="0.6"/>
        <path d="M 58 98 L 84 124 L 136 68" fill="none" stroke="#042f2e" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 58 98 L 84 124 L 136 68" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 60 96 L 84 120 L 134 66" fill="none" stroke="#fef08a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        <circle cx="68" cy="62" r="6" fill="#ffffff" opacity="0.75"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_warning.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <radialGradient id="warnAmberNew" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="80%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 96 22 C 104 22 110 26 114 34 L 174 140 C 180 150 176 164 164 168 C 158 170 150 170 144 170 L 48 170 C 36 170 26 162 24 150 C 22 144 24 138 28 132 L 84 34 C 88 26 92 22 96 22 Z" 
              fill="url(#warnAmberNew)" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" filter="url(#softGlow)"/>
        <path d="M 96 38 L 158 152 L 34 152 Z" fill="none" stroke="#78350f" stroke-width="4" stroke-linejoin="round" opacity="0.6"/>
        <rect x="90" y="66" width="12" height="46" rx="6" fill="#1e1b4b"/>
        <rect x="91" y="68" width="10" height="24" rx="5" fill="#fef08a" opacity="0.5"/>
        <circle cx="96" cy="132" r="7.5" fill="#1e1b4b"/>
        <circle cx="94.5" cy="130.5" r="2.5" fill="#ffffff" opacity="0.8"/>
      </g>
    </svg>
    `
  },
  {
    name: 'icon_lock.webp',
    svg: `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_FILTERS}
        <linearGradient id="shackleMetalNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
        <radialGradient id="lockGoldNew" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#f59e0b"/>
          <stop offset="75%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#dropShadow)">
        <path d="M 64 88 V 56 C 64 36 78 22 96 22 C 114 22 128 36 128 56 V 88" 
              fill="none" stroke="url(#shackleMetalNew)" stroke-width="20" stroke-linecap="round"/>
        <path d="M 64 88 V 56 C 64 36 78 22 96 22 C 114 22 128 36 128 56 V 88" 
              fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
        <rect x="44" y="80" width="104" height="92" rx="20" fill="url(#lockGoldNew)" stroke="#fef08a" stroke-width="4" filter="url(#softGlow)"/>
        <rect x="52" y="88" width="88" height="76" rx="14" fill="none" stroke="#78350f" stroke-width="3" opacity="0.6"/>
        <circle cx="96" cy="102" r="10" fill="#ef4444" stroke="#fef08a" stroke-width="2"/>
        <circle cx="94" cy="100" r="3" fill="#ffffff" opacity="0.85"/>
        <circle cx="96" cy="126" r="9" fill="#1e1b4b"/>
        <polygon points="92,126 100,126 102,148 90,148" fill="#1e1b4b"/>
        <path d="M 52 96 C 65 90 127 90 140 96" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
      </g>
    </svg>
    `
  }
];

async function run() {
  console.log(`Starting juicy icons generation: ${ICONS.length} icons to process...`);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let count = 0;
  for (const item of ICONS) {
    const dest = path.join(targetDir, item.name);
    await sharp(Buffer.from(item.svg))
      .resize(192, 192)
      .webp({ quality: 95, effort: 6 })
      .toFile(dest);
    const stat = fs.statSync(dest);
    count++;
    console.log(`[${count}/${ICONS.length}] Generated ${item.name} (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  console.log('✨ All 34 juicy icons generated and written successfully!');
}

run().catch(err => {
  console.error('Error during generation:', err);
  process.exit(1);
});
