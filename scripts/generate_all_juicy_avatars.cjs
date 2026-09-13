const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'public', 'assets', 'avatars');
const mazmorrasDir = path.join(__dirname, '..', 'public', 'assets', 'mazmorras');

const COMMON_DEFS = `
  <filter id="avatarDropShadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.65"/>
  </filter>
  <filter id="goldGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.8"/>
  </filter>
  <filter id="cyanGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#38bdf8" flood-opacity="0.85"/>
  </filter>
  <filter id="rubyGlow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ef4444" flood-opacity="0.85"/>
  </filter>
  <radialGradient id="goldBevelRim" cx="45%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#fffbeb"/>
    <stop offset="25%" stop-color="#fef08a"/>
    <stop offset="60%" stop-color="#f59e0b"/>
    <stop offset="85%" stop-color="#b45309"/>
    <stop offset="100%" stop-color="#78350f"/>
  </radialGradient>
`;

const AVATARS = [
  // ==========================================
  // 1. AVATARS DEL JUGADOR
  // ==========================================
  {
    dir: avatarsDir,
    name: 'avatar_king.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="kingBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#1e3a8a"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <linearGradient id="kingCape" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="50%" stop-color="#be123c"/>
          <stop offset="100%" stop-color="#881337"/>
        </linearGradient>
        <radialGradient id="skinGrad" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#ffedd5"/>
          <stop offset="60%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#fba06b"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <!-- Outer Golden Beveled Frame -->
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#kingBg)" stroke="#451a03" stroke-width="4"/>
        <circle cx="128" cy="128" r="98" fill="none" stroke="#fde047" stroke-width="2" opacity="0.4"/>

        <!-- Clip to Medallion Circle -->
        <g clip-path="url(#kingClip)">
          <clipPath id="kingClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Royal Velvet Cape & Fur Collar -->
          <path d="M 40 240 C 40 180 76 168 128 168 C 180 168 216 180 216 240 Z" fill="url(#kingCape)" stroke="#78350f" stroke-width="4"/>
          <!-- Ermine Fur Collar (White with gold trim) -->
          <path d="M 64 210 C 76 178 100 172 128 172 C 156 172 180 178 192 210 C 172 224 146 228 128 228 C 110 228 84 224 64 210 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
          <circle cx="96" cy="202" r="3" fill="#1e1b4b"/>
          <circle cx="128" cy="206" r="3.5" fill="#1e1b4b"/>
          <circle cx="160" cy="202" r="3" fill="#1e1b4b"/>

          <!-- Golden Royal Chain Medallion -->
          <path d="M 98 174 L 128 198 L 158 174" fill="none" stroke="url(#goldBevelRim)" stroke-width="5" stroke-linecap="round"/>
          <circle cx="128" cy="198" r="10" fill="#ef4444" stroke="url(#goldBevelRim)" stroke-width="3" filter="url(#rubyGlow)"/>

          <!-- King Head & Neck -->
          <rect x="112" y="140" width="32" height="32" fill="url(#skinGrad)"/>
          <ellipse cx="128" cy="116" rx="42" ry="46" fill="url(#skinGrad)" stroke="#b45309" stroke-width="3"/>

          <!-- Noble Beard & Mustache -->
          <path d="M 88 116 C 88 164 128 176 128 176 C 128 176 168 164 168 116 C 156 126 142 124 128 126 C 114 124 100 126 88 116 Z" fill="#78350f"/>
          <path d="M 104 128 C 116 134 140 134 152 128 C 144 138 112 138 104 128 Z" fill="#451a03"/>

          <!-- Eyes & Brows -->
          <path d="M 100 102 Q 112 98 118 104" stroke="#451a03" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M 156 102 Q 144 98 138 104" stroke="#451a03" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="112" cy="110" r="4.5" fill="#1e293b"/>
          <circle cx="144" cy="110" r="4.5" fill="#1e293b"/>
          <circle cx="114" cy="108" r="1.5" fill="#ffffff"/>
          <circle cx="146" cy="108" r="1.5" fill="#ffffff"/>
          <!-- Nose -->
          <path d="M 128 106 V 122 H 122" stroke="#b45309" stroke-width="3" stroke-linecap="round" fill="none"/>

          <!-- Noble Hair Under Crown -->
          <path d="M 86 100 C 80 124 82 144 86 150 C 90 144 92 120 90 100" fill="#78350f"/>
          <path d="M 170 100 C 176 124 174 144 170 150 C 166 144 164 120 166 100" fill="#78350f"/>

          <!-- Imperial 5-Peak Crown -->
          <path d="M 80 84 L 88 44 L 108 64 L 128 32 L 148 64 L 168 44 L 176 84 Z" 
                fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="4" stroke-linejoin="round" filter="url(#goldGlow)"/>
          <rect x="76" y="80" width="104" height="18" rx="4" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2.5"/>
          <!-- Crown Jewels -->
          <circle cx="128" cy="88" r="5.5" fill="#ef4444" stroke="#fffbeb" stroke-width="1.5"/>
          <circle cx="102" cy="88" r="4.5" fill="#3b82f6" stroke="#fffbeb" stroke-width="1.5"/>
          <circle cx="154" cy="88" r="4.5" fill="#10b981" stroke="#fffbeb" stroke-width="1.5"/>
          <circle cx="128" cy="32" r="7" fill="#ffffff" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="88" cy="44" r="5" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5"/>
          <circle cx="168" cy="44" r="5" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5"/>
        </g>

        <!-- Medallion Top Crest Gem -->
        <circle cx="128" cy="18" r="12" fill="#ef4444" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#rubyGlow)"/>
        <circle cx="125" cy="15" r="3.5" fill="#ffffff" opacity="0.9"/>
      </g>
    </svg>
    `
  },
  {
    dir: avatarsDir,
    name: 'avatar_paladin.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="paladinBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <linearGradient id="silverPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#e2e8f0"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#paladinBg)" stroke="#0f172a" stroke-width="4"/>
        <circle cx="128" cy="128" r="98" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.5"/>

        <g clip-path="url(#paladinClip)">
          <clipPath id="paladinClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Steel Pauldrons with Gold Trim -->
          <path d="M 32 230 C 44 176 80 166 128 166 C 176 166 212 176 224 230 Z" fill="url(#silverPlate)" stroke="#1e293b" stroke-width="4"/>
          <!-- Gold Inlay Gorget -->
          <path d="M 84 186 C 98 174 112 170 128 170 C 144 170 158 174 172 186 L 158 220 H 98 Z" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2.5"/>
          <!-- Sacred Sapphire Cross -->
          <polygon points="128,180 133,192 144,192 135,198 138,210 128,203 118,210 121,198 112,192 123,192" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" filter="url(#cyanGlow)"/>

          <!-- Paladin Face & Head -->
          <rect x="114" y="142" width="28" height="30" fill="#fed7aa"/>
          <ellipse cx="128" cy="122" rx="38" ry="42" fill="#fed7aa" stroke="#78350f" stroke-width="2.5"/>
          
          <!-- Eyes & Confident Expression -->
          <path d="M 104 108 Q 114 104 120 110" stroke="#78350f" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <path d="M 152 108 Q 142 104 136 110" stroke="#78350f" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <circle cx="114" cy="116" r="4.5" fill="#0284c7"/>
          <circle cx="142" cy="116" r="4.5" fill="#0284c7"/>
          <circle cx="116" cy="114" r="1.5" fill="#ffffff"/>
          <circle cx="144" cy="114" r="1.5" fill="#ffffff"/>
          <!-- Warm Smile -->
          <path d="M 116 138 Q 128 146 140 138" stroke="#92400e" stroke-width="2.5" stroke-linecap="round" fill="none"/>

          <!-- Golden Knight Circlet / Helmet Wing Guards -->
          <path d="M 74 116 C 68 84 84 66 128 66 C 172 66 188 84 182 116 C 176 102 168 96 156 94 C 140 92 128 94 100 94 C 88 96 80 102 74 116 Z" 
                fill="url(#silverPlate)" stroke="#1e293b" stroke-width="3"/>
          <!-- Golden Wing Side Plumes -->
          <polygon points="72,112 56,86 78,92" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2"/>
          <polygon points="184,112 200,86 178,92" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2"/>

          <!-- Golden Brow Diadem -->
          <rect x="86" y="90" width="84" height="14" rx="4" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2"/>
          <polygon points="128,82 136,96 120,96" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>

          <!-- Holy Aura Sparkles -->
          <circle cx="82" cy="54" r="4" fill="#ffffff" filter="url(#cyanGlow)"/>
          <circle cx="174" cy="54" r="4" fill="#ffffff" filter="url(#cyanGlow)"/>
        </g>

        <!-- Top Holy Sun Crest Gem -->
        <circle cx="128" cy="18" r="12" fill="#38bdf8" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#cyanGlow)"/>
        <circle cx="125" cy="15" r="3.5" fill="#ffffff" opacity="0.9"/>
      </g>
    </svg>
    `
  },
  {
    dir: avatarsDir,
    name: 'avatar_mage.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="mageBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#6b21a8"/>
          <stop offset="60%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#090514"/>
        </radialGradient>
        <radialGradient id="arcaneOrb" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#67e8f9"/>
          <stop offset="70%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#3b0764"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#mageBg)" stroke="#3b0764" stroke-width="4"/>
        <circle cx="128" cy="128" r="98" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.4"/>

        <g clip-path="url(#mageClip)">
          <clipPath id="mageClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Sorcerer Velvet Mantle with Gold Trims -->
          <path d="M 36 240 C 44 174 80 164 128 164 C 176 164 212 174 220 240 Z" fill="#4c1d95" stroke="#78350f" stroke-width="4"/>
          <!-- Gold Embroidered Stole -->
          <path d="M 88 170 L 102 240 H 120 L 110 170 Z" fill="url(#goldBevelRim)"/>
          <path d="M 168 170 L 154 240 H 136 L 146 170 Z" fill="url(#goldBevelRim)"/>

          <!-- Wizard Long Silver Beard -->
          <path d="M 104 130 C 104 190 128 214 128 214 C 128 214 152 190 152 130 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2.5"/>
          <path d="M 116 140 L 128 184 L 140 140" fill="none" stroke="#cbd5e1" stroke-width="2"/>

          <!-- Arcane Hood -->
          <path d="M 72 140 C 66 70 94 42 128 42 C 162 42 190 70 184 140 C 170 136 156 120 146 110 C 138 104 118 104 110 110 C 100 120 86 136 72 140 Z" 
                fill="#581c87" stroke="#78350f" stroke-width="4"/>
          <!-- Hood Gold Filigree Rim -->
          <path d="M 80 134 C 88 78 108 52 128 52 C 148 52 168 78 176 134" fill="none" stroke="url(#goldBevelRim)" stroke-width="3"/>

          <!-- Mysterious Glowing Eyes in Shadow -->
          <ellipse cx="114" cy="112" rx="7" ry="4" fill="#38bdf8" filter="url(#cyanGlow)"/>
          <ellipse cx="142" cy="112" rx="7" ry="4" fill="#38bdf8" filter="url(#cyanGlow)"/>
          <circle cx="114" cy="112" r="2.5" fill="#ffffff"/>
          <circle cx="142" cy="112" r="2.5" fill="#ffffff"/>

          <!-- Floating Celestial Arcane Orb -->
          <circle cx="128" cy="168" r="16" fill="url(#arcaneOrb)" stroke="#ffffff" stroke-width="2" filter="url(#cyanGlow)"/>
          <circle cx="124" cy="164" r="4" fill="#ffffff"/>
          <!-- Orbiting Mystic Sparkles -->
          <circle cx="106" cy="160" r="3" fill="#fbcfe8" filter="url(#rubyGlow)"/>
          <circle cx="150" cy="172" r="3.5" fill="#67e8f9" filter="url(#cyanGlow)"/>
        </g>

        <!-- Top Amethyst Crest Gem -->
        <circle cx="128" cy="18" r="12" fill="#a855f7" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#cyanGlow)"/>
        <circle cx="125" cy="15" r="3.5" fill="#ffffff" opacity="0.9"/>
      </g>
    </svg>
    `
  },
  {
    dir: avatarsDir,
    name: 'avatar_valkyrie.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="valkBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#065f46"/>
          <stop offset="55%" stop-color="#022c22"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <radialGradient id="valkHair" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#fde047"/>
          <stop offset="80%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#valkBg)" stroke="#064e3b" stroke-width="4"/>
        <circle cx="128" cy="128" r="98" fill="none" stroke="#34d399" stroke-width="2" opacity="0.4"/>

        <g clip-path="url(#valkClip)">
          <clipPath id="valkClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Golden Armor with Fur Shoulders -->
          <path d="M 36 240 C 44 174 80 166 128 166 C 176 166 212 174 220 240 Z" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="4"/>
          <!-- White Wolf Fur Mantle -->
          <path d="M 50 190 C 70 170 94 168 128 168 C 162 168 186 170 206 190 C 188 206 156 214 128 214 C 100 214 68 206 50 190 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
          <circle cx="128" cy="186" r="8" fill="#10b981" stroke="#fde047" stroke-width="2"/>

          <!-- Graceful Neck and Face -->
          <rect x="116" y="142" width="24" height="28" fill="#fed7aa"/>
          <ellipse cx="128" cy="122" rx="34" ry="38" fill="#fed7aa" stroke="#b45309" stroke-width="2.5"/>

          <!-- Flowing Platinum Blonde Hair -->
          <path d="M 80 110 C 70 144 68 184 76 220 C 86 184 94 150 94 120 Z" fill="url(#valkHair)"/>
          <path d="M 176 110 C 186 144 188 184 180 220 C 170 184 162 150 162 120 Z" fill="url(#valkHair)"/>

          <!-- Fierce Emerald Eyes -->
          <path d="M 106 110 Q 116 106 122 112" stroke="#78350f" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <path d="M 150 110 Q 140 106 134 112" stroke="#78350f" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <circle cx="114" cy="116" r="4.5" fill="#10b981"/>
          <circle cx="142" cy="116" r="4.5" fill="#10b981"/>
          <circle cx="116" cy="114" r="1.5" fill="#ffffff"/>
          <circle cx="144" cy="114" r="1.5" fill="#ffffff"/>
          <!-- Ruby Lips -->
          <path d="M 120 138 Q 128 144 136 138" stroke="#e11d48" stroke-width="3" stroke-linecap="round" fill="none"/>

          <!-- Winged Golden Valkyrie Helm / Tiara -->
          <!-- Left Wing -->
          <path d="M 86 100 C 60 72 44 48 42 28 C 58 38 74 64 88 88 Z" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2.5" filter="url(#goldGlow)"/>
          <!-- Right Wing -->
          <path d="M 170 100 C 196 72 212 48 214 28 C 198 38 182 64 168 88 Z" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2.5" filter="url(#goldGlow)"/>

          <!-- Forehead Tiara -->
          <path d="M 92 98 Q 128 106 164 98 L 158 84 Q 128 92 98 84 Z" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="2"/>
          <polygon points="128,76 136,92 120,92" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>
        </g>

        <!-- Top Emerald Crest Gem -->
        <circle cx="128" cy="18" r="12" fill="#10b981" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#goldGlow)"/>
        <circle cx="125" cy="15" r="3.5" fill="#ffffff" opacity="0.9"/>
      </g>
    </svg>
    `
  },

  // ==========================================
  // 2. AVATARS DE COMBATE Y MAZMORRAS
  // ==========================================
  {
    dir: mazmorrasDir,
    name: 'hero_avatar.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="heroCombatBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#b91c1c"/>
          <stop offset="60%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#heroCombatBg)" stroke="#7f1d1d" stroke-width="4"/>

        <g clip-path="url(#heroClip)">
          <clipPath id="heroClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Steel Battle Armor -->
          <path d="M 36 240 C 44 176 80 166 128 166 C 176 166 212 176 220 240 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="4"/>
          <path d="M 88 180 L 128 220 L 168 180" fill="none" stroke="url(#goldBevelRim)" stroke-width="6" stroke-linecap="round"/>
          <circle cx="128" cy="220" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>

          <!-- Young Valiant Champion -->
          <rect x="114" y="142" width="28" height="30" fill="#fed7aa"/>
          <ellipse cx="128" cy="120" rx="38" ry="42" fill="#fed7aa" stroke="#78350f" stroke-width="2.5"/>

          <!-- Eyes & Battle Expression -->
          <path d="M 104 106 L 120 112" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>
          <path d="M 152 106 L 136 112" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>
          <circle cx="114" cy="116" r="4.5" fill="#0284c7"/>
          <circle cx="142" cy="116" r="4.5" fill="#0284c7"/>
          <circle cx="116" cy="114" r="1.5" fill="#ffffff"/>
          <circle cx="144" cy="114" r="1.5" fill="#ffffff"/>

          <!-- Golden Battle Crown / Crest -->
          <path d="M 76 86 L 86 52 L 108 70 L 128 42 L 148 70 L 170 52 L 180 86 Z" 
                fill="url(#goldBevelRim)" stroke="#78350f" stroke-width="3.5" filter="url(#goldGlow)"/>
          <circle cx="128" cy="42" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
        </g>
        <circle cx="128" cy="18" r="12" fill="#ef4444" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#rubyGlow)"/>
      </g>
    </svg>
    `
  },
  {
    dir: mazmorrasDir,
    name: 'orc_avatar.webp',
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="orcBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#3f6212"/>
          <stop offset="60%" stop-color="#14532d"/>
          <stop offset="100%" stop-color="#022c22"/>
        </radialGradient>
        <radialGradient id="orcSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#84cc16"/>
          <stop offset="50%" stop-color="#65a30d"/>
          <stop offset="90%" stop-color="#4d7c0f"/>
          <stop offset="100%" stop-color="#365314"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <!-- Rough Iron & Bronze Frame -->
        <circle cx="128" cy="128" r="116" fill="#78350f" stroke="#451a03" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#orcBg)" stroke="#14532d" stroke-width="4"/>

        <g clip-path="url(#orcClip)">
          <clipPath id="orcClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Studded Leather Shoulders -->
          <path d="M 32 240 C 44 176 80 166 128 166 C 176 166 212 176 224 240 Z" fill="#451a03" stroke="#1e293b" stroke-width="4"/>
          <!-- Iron Spikes on Shoulders -->
          <polygon points="62,174 72,148 82,174" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
          <polygon points="174,174 184,148 194,174" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>

          <!-- Orc Head & Massive Jaw -->
          <ellipse cx="128" cy="126" rx="48" ry="52" fill="url(#orcSkin)" stroke="#365314" stroke-width="4"/>
          
          <!-- Pointed Orc Ears -->
          <polygon points="80,118 42,96 76,134" fill="url(#orcSkin)" stroke="#365314" stroke-width="2.5"/>
          <polygon points="176,118 214,96 180,134" fill="url(#orcSkin)" stroke="#365314" stroke-width="2.5"/>
          <!-- Bronze Earring -->
          <circle cx="48" cy="106" r="6" fill="none" stroke="#f59e0b" stroke-width="2.5"/>

          <!-- Scarlet War Paint -->
          <path d="M 100 96 L 118 128 M 156 96 L 138 128" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>

          <!-- Glowing Yellow Predator Eyes -->
          <ellipse cx="110" cy="112" rx="7" ry="5" fill="#facc15" filter="url(#goldGlow)"/>
          <ellipse cx="146" cy="112" rx="7" ry="5" fill="#facc15" filter="url(#goldGlow)"/>
          <circle cx="110" cy="112" r="2.5" fill="#450a0a"/>
          <circle cx="146" cy="112" r="2.5" fill="#450a0a"/>

          <!-- Tusks Piercing Up from Lower Jaw -->
          <polygon points="102,154 94,124 112,146" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
          <polygon points="154,154 162,124 144,146" fill="#fef08a" stroke="#78350f" stroke-width="2"/>
          <!-- Snarl Mouth -->
          <path d="M 108 144 Q 128 152 148 144" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>
        <circle cx="128" cy="18" r="12" fill="#84cc16" stroke="#451a03" stroke-width="4" filter="url(#goldGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'minotaur_avatar.webp',
    dir: mazmorrasDir,
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="minoBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#991b1b"/>
          <stop offset="60%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="#b45309" stroke="#451a03" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#minoBg)" stroke="#450a0a" stroke-width="4"/>

        <g clip-path="url(#minoClip)">
          <clipPath id="minoClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Beast Fur Shoulders -->
          <path d="M 28 240 C 38 172 74 162 128 162 C 182 162 218 172 228 240 Z" fill="#451a03" stroke="#1c1917" stroke-width="4"/>

          <!-- Massive Bovine Head -->
          <ellipse cx="128" cy="132" rx="46" ry="50" fill="#78350f" stroke="#292524" stroke-width="4"/>

          <!-- Giant Curved Bull Horns with Iron Tips -->
          <!-- Left Horn -->
          <path d="M 88 106 C 54 84 32 54 36 28 C 54 38 72 68 96 90 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="3"/>
          <polygon points="36,28 46,42 32,46" fill="#f59e0b"/>
          <!-- Right Horn -->
          <path d="M 168 106 C 202 84 224 54 220 28 C 202 38 184 68 160 90 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="3"/>
          <polygon points="220,28 210,42 224,46" fill="#f59e0b"/>

          <!-- Glowing Amber Eyes -->
          <circle cx="108" cy="112" r="6.5" fill="#f59e0b" filter="url(#goldGlow)"/>
          <circle cx="148" cy="112" r="6.5" fill="#f59e0b" filter="url(#goldGlow)"/>
          <circle cx="108" cy="112" r="2.5" fill="#450a0a"/>
          <circle cx="148" cy="112" r="2.5" fill="#450a0a"/>

          <!-- Muzzle & Golden Nose Ring -->
          <ellipse cx="128" cy="150" rx="28" ry="20" fill="#451a03" stroke="#292524" stroke-width="2"/>
          <circle cx="128" cy="166" r="10" fill="none" stroke="#fde047" stroke-width="4"/>
        </g>
        <circle cx="128" cy="18" r="12" fill="#f59e0b" stroke="#451a03" stroke-width="4" filter="url(#goldGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'miniboss_avatar.webp',
    dir: mazmorrasDir,
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="minibossBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#4a044e"/>
          <stop offset="60%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <circle cx="128" cy="128" r="116" fill="#581c87" stroke="#1e1b4b" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#minibossBg)" stroke="#2e1065" stroke-width="4"/>

        <g clip-path="url(#mbClip)">
          <clipPath id="mbClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Obsidian Spiked Armor -->
          <path d="M 32 240 C 44 176 80 166 128 166 C 176 166 212 176 224 240 Z" fill="#0f172a" stroke="#581c87" stroke-width="4"/>
          <!-- Spikes -->
          <polygon points="56,170 70,136 84,170" fill="#3b0764" stroke="#a855f7" stroke-width="2"/>
          <polygon points="172,170 186,136 200,170" fill="#3b0764" stroke="#a855f7" stroke-width="2"/>

          <!-- Skull Mask Face -->
          <path d="M 88 116 C 84 76 104 60 128 60 C 152 60 172 76 168 116 C 166 142 154 154 144 158 V 172 H 112 V 158 C 102 154 90 142 88 116 Z" 
                fill="#f1f5f9" stroke="#0f172a" stroke-width="3.5"/>

          <!-- Glowing Crimson Eye Sockets -->
          <ellipse cx="112" cy="112" rx="10" ry="12" fill="#0f172a" filter="url(#rubyGlow)"/>
          <ellipse cx="144" cy="112" rx="10" ry="12" fill="#0f172a" filter="url(#rubyGlow)"/>
          <circle cx="112" cy="114" r="5" fill="#ef4444"/>
          <circle cx="144" cy="114" r="5" fill="#ef4444"/>

          <!-- Horns of the Crypt -->
          <path d="M 94 80 C 72 60 64 34 70 18 C 84 32 96 54 104 74 Z" fill="#3b0764" stroke="#a855f7" stroke-width="2"/>
          <path d="M 162 80 C 184 60 192 34 186 18 C 172 32 160 54 152 74 Z" fill="#3b0764" stroke="#a855f7" stroke-width="2"/>
        </g>
        <circle cx="128" cy="18" r="12" fill="#a855f7" stroke="#1e1b4b" stroke-width="4" filter="url(#rubyGlow)"/>
      </g>
    </svg>
    `
  },
  {
    name: 'boss_avatar.webp',
    dir: mazmorrasDir,
    width: 256,
    height: 256,
    svg: `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${COMMON_DEFS}
        <radialGradient id="bossBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="45%" stop-color="#991b1b"/>
          <stop offset="85%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <g filter="url(#avatarDropShadow)">
        <!-- Molten Gold & Obsidian Demon Frame -->
        <circle cx="128" cy="128" r="116" fill="url(#goldBevelRim)" stroke="#450a0a" stroke-width="6"/>
        <circle cx="128" cy="128" r="104" fill="url(#bossBg)" stroke="#ea580c" stroke-width="4"/>
        <circle cx="128" cy="128" r="98" fill="none" stroke="#fde047" stroke-width="2" opacity="0.6"/>

        <g clip-path="url(#bossClip)">
          <clipPath id="bossClip">
            <circle cx="128" cy="128" r="100"/>
          </clipPath>

          <!-- Magma Demon Armor -->
          <path d="M 28 240 C 38 170 74 158 128 158 C 182 158 218 170 228 240 Z" fill="#1c1917" stroke="#ea580c" stroke-width="4"/>
          <!-- Magma Vein Cracks in Armor -->
          <path d="M 74 186 L 102 210 L 128 190 L 154 210 L 182 186" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" filter="url(#goldGlow)"/>

          <!-- Demonic Lord Helmet -->
          <path d="M 80 114 C 76 68 100 50 128 50 C 156 50 180 68 176 114 C 172 146 156 164 128 166 C 100 164 84 146 80 114 Z" 
                fill="#292524" stroke="#ea580c" stroke-width="4"/>

          <!-- Giant Flaming Curved Demon Horns -->
          <path d="M 86 80 C 48 50 32 20 40 4 C 60 16 80 48 98 70 Z" fill="#7f1d1d" stroke="#f97316" stroke-width="3" filter="url(#rubyGlow)"/>
          <path d="M 170 80 C 208 50 224 20 216 4 C 196 16 176 48 158 70 Z" fill="#7f1d1d" stroke="#f97316" stroke-width="3" filter="url(#rubyGlow)"/>

          <!-- Burning Infernal Eyes -->
          <polygon points="102,108 120,114 104,118" fill="#fde047" filter="url(#goldGlow)"/>
          <polygon points="154,108 136,114 152,118" fill="#fde047" filter="url(#goldGlow)"/>
          <circle cx="110" cy="113" r="2.5" fill="#ffffff"/>
          <circle cx="146" cy="113" r="2.5" fill="#ffffff"/>

          <!-- Lava Breath Mouth Grille -->
          <line x1="114" y1="138" x2="142" y2="138" stroke="#f97316" stroke-width="4" stroke-linecap="round" filter="url(#goldGlow)"/>
          <line x1="118" y1="146" x2="138" y2="146" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
        </g>
        <!-- Supreme Crown Gem -->
        <circle cx="128" cy="18" r="14" fill="#ef4444" stroke="url(#goldBevelRim)" stroke-width="4" filter="url(#rubyGlow)"/>
        <polygon points="128,8 131,15 138,15 133,19 135,26 128,22 121,26 123,19 118,15 125,15" fill="#ffffff"/>
      </g>
    </svg>
    `
  }
];

async function run() {
  console.log(`Starting juicy avatars generation (${AVATARS.length} avatars)...`);
  
  let count = 0;
  for (const item of AVATARS) {
    if (!fs.existsSync(item.dir)) {
      fs.mkdirSync(item.dir, { recursive: true });
    }
    const dest = path.join(item.dir, item.name);
    await sharp(Buffer.from(item.svg))
      .resize(item.width, item.height)
      .webp({ quality: 95, effort: 6 })
      .toFile(dest);
    const stat = fs.statSync(dest);
    count++;
    console.log(`[${count}/${AVATARS.length}] Generated ${item.name} (${item.width}x${item.height}, ${(stat.size / 1024).toFixed(1)} KB)`);
  }

  console.log('✨ All avatars successfully generated in juicy mobile style!');
}

run().catch(err => {
  console.error('Error generating avatars:', err);
  process.exit(1);
});
