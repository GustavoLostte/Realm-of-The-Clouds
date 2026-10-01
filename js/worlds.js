// =========================================================================
    // 5 WORLDS / BIOMES SYSTEM (UNIQUE MAP PLATFORMS, PALETTES & ATMOSPHERES)
    // =========================================================================
    const WORLDS = [
      {
        id: 1,
        name: 'CYBER CITADEL',
        subtitle: 'TECH SPIRE OF NEO-ARCADIA',
        themeBg1: '#0a1329',
        gridColor: 'rgba(56, 189, 248, 0.04)',
        borderColor: 'rgba(56, 189, 248, 0.35)',
        cornerColor: '#38bdf8',
        platformBody: '#101d3b',
        platformTop: '#38bdf8',
        platformGroundTop: '#0ea5e9',
        platformBorder: 'rgba(56, 189, 248, 0.25)',
        particleType: 'sparks',
        particleColor: '#38bdf8',
        bossName: 'CYBER CORE TITAN',
        platforms: [
          { x: 100, y: 550, w: 1080, h: 40, isOneWay: false },
          { x: 140, y: 420, w: 280, h: 18, isOneWay: true },
          { x: 860, y: 420, w: 280, h: 18, isOneWay: true },
          { x: 440, y: 280, w: 400, h: 18, isOneWay: true },
          { x: 100, y: 280, w: 190, h: 18, isOneWay: true },
          { x: 990, y: 280, w: 190, h: 18, isOneWay: true },
          { x: 220, y: 130, w: 280, h: 18, isOneWay: true },
          { x: 780, y: 130, w: 280, h: 18, isOneWay: true },
          { x: 440, y: -20, w: 400, h: 18, isOneWay: true },
          { x: 120, y: -20, w: 200, h: 18, isOneWay: true },
          { x: 960, y: -20, w: 200, h: 18, isOneWay: true },
          { x: 340, y: -170, w: 600, h: 20, isOneWay: true },
          { x: 260, y: -235, w: 160, h: 18, isOneWay: true },
          { x: 860, y: -235, w: 160, h: 18, isOneWay: true },
          { x: 440, y: -300, w: 400, h: 22, isOneWay: true, isSummit: true, summitTitle: '▲ CYBER CORE SPIRE ▲' }
        ]
      },
      {
        id: 2,
        name: 'CRIMSON FORGE',
        subtitle: 'VOLCANIC FOUNDRY & MOLTEN CHASM',
        themeBg1: '#190606',
        gridColor: 'rgba(249, 115, 22, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.45)',
        cornerColor: '#f97316',
        platformBody: '#2d0f0f',
        platformTop: '#f97316',
        platformGroundTop: '#dc2626',
        platformBorder: 'rgba(249, 115, 22, 0.35)',
        particleType: 'embers',
        particleColor: '#f97316',
        bossName: 'INFERNAL MAGMA GOLEM',
        platforms: [
          { x: 100, y: 550, w: 1080, h: 40, isOneWay: false },
          { x: 120, y: 435, w: 320, h: 18, isOneWay: true },
          { x: 500, y: 390, w: 280, h: 18, isOneWay: true },
          { x: 840, y: 440, w: 320, h: 18, isOneWay: true },
          { x: 180, y: 290, w: 340, h: 18, isOneWay: true },
          { x: 620, y: 260, w: 380, h: 18, isOneWay: true },
          { x: 100, y: 140, w: 240, h: 18, isOneWay: true },
          { x: 400, y: 110, w: 480, h: 18, isOneWay: true },
          { x: 940, y: 140, w: 240, h: 18, isOneWay: true },
          { x: 220, y: -30, w: 380, h: 18, isOneWay: true },
          { x: 680, y: -30, w: 380, h: 18, isOneWay: true },
          { x: 380, y: -165, w: 520, h: 20, isOneWay: true },
          { x: 140, y: -210, w: 180, h: 18, isOneWay: true },
          { x: 960, y: -210, w: 180, h: 18, isOneWay: true },
          { x: 280, y: -245, w: 140, h: 18, isOneWay: true },
          { x: 860, y: -245, w: 140, h: 18, isOneWay: true },
          { x: 440, y: -300, w: 400, h: 22, isOneWay: true, isSummit: true, summitTitle: '▲ INFERNAL ANVIL ▲' }
        ]
      },
      {
        id: 3,
        name: 'JADE SANCTUARY',
        subtitle: 'ANCIENT CANOPY & EMERALD RUINS',
        themeBg1: '#041712',
        gridColor: 'rgba(16, 185, 129, 0.05)',
        borderColor: 'rgba(16, 185, 129, 0.42)',
        cornerColor: '#10b981',
        platformBody: '#0a2e23',
        platformTop: '#34d399',
        platformGroundTop: '#059669',
        platformBorder: 'rgba(16, 185, 129, 0.35)',
        particleType: 'spores',
        particleColor: '#34d399',
        bossName: 'JADE COLOSSUS',
        platforms: [
          { x: 100, y: 550, w: 1080, h: 40, isOneWay: false },
          { x: 150, y: 415, w: 380, h: 18, isOneWay: true },
          { x: 750, y: 415, w: 380, h: 18, isOneWay: true },
          { x: 320, y: 275, w: 640, h: 18, isOneWay: true },
          { x: 90, y: 310, w: 180, h: 18, isOneWay: true },
          { x: 1010, y: 310, w: 180, h: 18, isOneWay: true },
          { x: 160, y: 135, w: 320, h: 18, isOneWay: true },
          { x: 800, y: 135, w: 320, h: 18, isOneWay: true },
          { x: 520, y: 150, w: 240, h: 18, isOneWay: true },
          { x: 380, y: -15, w: 520, h: 18, isOneWay: true },
          { x: 110, y: -15, w: 220, h: 18, isOneWay: true },
          { x: 950, y: -15, w: 220, h: 18, isOneWay: true },
          { x: 300, y: -160, w: 680, h: 20, isOneWay: true },
          { x: 230, y: -230, w: 170, h: 18, isOneWay: true },
          { x: 880, y: -230, w: 170, h: 18, isOneWay: true },
          { x: 440, y: -300, w: 400, h: 22, isOneWay: true, isSummit: true, summitTitle: '▲ WORLD TREE CROWN ▲' }
        ]
      },
      {
        id: 4,
        name: 'GLACIAL CITADEL',
        subtitle: 'FROZEN PEAKS & ETERNAL PERMAFROST',
        themeBg1: '#07162b',
        gridColor: 'rgba(125, 211, 252, 0.05)',
        borderColor: 'rgba(147, 197, 253, 0.45)',
        cornerColor: '#7dd3fc',
        platformBody: '#0c233c',
        platformTop: '#bae6fd',
        platformGroundTop: '#38bdf8',
        platformBorder: 'rgba(186, 230, 253, 0.35)',
        particleType: 'snow',
        particleColor: '#e0f2fe',
        bossName: 'GLACIAL REAVER',
        platforms: [
          { x: 100, y: 550, w: 1080, h: 40, isOneWay: false },
          { x: 130, y: 425, w: 300, h: 18, isOneWay: true },
          { x: 480, y: 435, w: 320, h: 18, isOneWay: true },
          { x: 850, y: 425, w: 300, h: 18, isOneWay: true },
          { x: 220, y: 285, w: 360, h: 18, isOneWay: true },
          { x: 700, y: 285, w: 360, h: 18, isOneWay: true },
          { x: 90, y: 135, w: 260, h: 18, isOneWay: true },
          { x: 430, y: 125, w: 420, h: 18, isOneWay: true },
          { x: 930, y: 135, w: 260, h: 18, isOneWay: true },
          { x: 240, y: -25, w: 340, h: 18, isOneWay: true },
          { x: 700, y: -25, w: 340, h: 18, isOneWay: true },
          { x: 350, y: -175, w: 580, h: 20, isOneWay: true },
          { x: 240, y: -240, w: 160, h: 18, isOneWay: true },
          { x: 880, y: -240, w: 160, h: 18, isOneWay: true },
          { x: 440, y: -300, w: 400, h: 22, isOneWay: true, isSummit: true, summitTitle: '▲ FROZEN MONOLITH ▲' }
        ]
      },
      {
        id: 5,
        name: 'CELESTIAL VOID',
        subtitle: 'ASTRAL DOMAIN & THRONE OF CHAOS',
        themeBg1: '#120524',
        gridColor: 'rgba(192, 132, 252, 0.06)',
        borderColor: 'rgba(250, 204, 21, 0.50)',
        cornerColor: '#facc15',
        platformBody: '#240a42',
        platformTop: '#c084fc',
        platformGroundTop: '#9333ea',
        platformBorder: 'rgba(250, 204, 21, 0.40)',
        particleType: 'stardust',
        particleColor: '#facc15',
        bossName: 'CHAOS EMPEROR',
        platforms: [
          { x: 100, y: 550, w: 1080, h: 40, isOneWay: false },
          { x: 160, y: 410, w: 260, h: 18, isOneWay: true },
          { x: 490, y: 380, w: 300, h: 18, isOneWay: true },
          { x: 860, y: 410, w: 260, h: 18, isOneWay: true },
          { x: 100, y: 265, w: 260, h: 18, isOneWay: true },
          { x: 420, y: 250, w: 440, h: 18, isOneWay: true },
          { x: 920, y: 265, w: 260, h: 18, isOneWay: true },
          { x: 260, y: 120, w: 320, h: 18, isOneWay: true },
          { x: 700, y: 120, w: 320, h: 18, isOneWay: true },
          { x: 130, y: -20, w: 280, h: 18, isOneWay: true },
          { x: 470, y: -35, w: 340, h: 18, isOneWay: true },
          { x: 870, y: -20, w: 280, h: 18, isOneWay: true },
          { x: 320, y: -170, w: 640, h: 20, isOneWay: true },
          { x: 250, y: -235, w: 160, h: 18, isOneWay: true },
          { x: 870, y: -235, w: 160, h: 18, isOneWay: true },
          { x: 440, y: -300, w: 400, h: 22, isOneWay: true, isSummit: true, summitTitle: '▲ THRONE OF CHAOS ▲' }
        ]
      }
    ];

    let currentWorld = WORLDS[0];
    let platforms = currentWorld.platforms;


    // =========================================================================
    // 50 CAMPAIGN STAGES (10 STAGES PER WORLD INCLUDING 5 WORLD BOSSES)
    // =========================================================================
    function generateAll50Stages() {
      const titles = [
        // World 1: Cyber Citadel (1-10)
        ['CYBER AWAKENING', 'INITIALIZE TARGET SENSORS'],
        ['CIRCUIT ASCENT', 'SCALE THE LOWER DATA PATHS'],
        ['NEO PERIMETER', 'SWEEP THE PERIMETER TERRACES'],
        ['GRID RUNNER', 'CROSS-TIER PRECISION TRIAL'],
        ['PULSE MATRIX', 'BREACH THE MID BALCONIES'],
        ['KINETIC DRIFT', 'MOBILE TARGET SIGNALS DETECTED'],
        ['SPIRE SIEGE', 'HIGH-ELEVATION COMBAT STRIKE'],
        ['DATA TEMPEST', 'ELIMINATE DUAL OSCILLATING DRONES'],
        ['SUMMIT PROTOCOL', 'SCALE THE APEX BEACON'],
        ['CYBER CORE TITAN', 'WORLD 1 BOSS • DESTROY THE CORE TITAN'],

        // World 2: Crimson Forge (11-20)
        ['FORGE IGNITION', 'ENTER THE MOLTEN CRUCIBLE'],
        ['SLAG CATWALK', 'STRIKE THROUGH RISING FLAMES'],
        ['MOLTEN CHASM', 'CROSS THE SMELTING TERRACES'],
        ['CRUCIBLE ASSAULT', 'MULTI-LEVEL OBSIDIAN SIEGE'],
        ['LAVA JET DRIFT', 'TARGET EVASION IN ACTIVE HEAT'],
        ['EMBER HURRICANE', 'RAPID STRIKES ON DUAL MOBILE FOES'],
        ['MAGMA DUCT BREACH', 'ASCEND THE VOLCANIC DUCTS'],
        ['BLAST FURNACE', 'HIGH-TEMPERATURE SPIRE CLIMB'],
        ['INFERNAL APEX', 'CONQUER THE UPPER ANVIL TIERS'],
        ['INFERNAL MAGMA GOLEM', 'WORLD 2 BOSS • SMASH THE COLOSSAL GOLEM'],

        // World 3: Jade Sanctuary (21-30)
        ['EMERALD THRESHOLD', 'PENETRATE THE SACRED CANOPY'],
        ['CANOPY STRIKE', 'CLEAR THE LOWER ANCIENT ROOTS'],
        ['WHISPERING GROVE', 'TARGETS HIDDEN IN THE SHADOWS'],
        ['RUINS OF VERDANT', 'SWIFT TARGET ELIMINATION'],
        ['BIO-SPORE DRIFT', 'EVASIVE SPORE DRONES DETECTED'],
        ['SACRED BOUGHS', 'VERTICAL AGILITY TRIAL IN CANOPY'],
        ['SYLVAN ASCENSION', 'LEAP ACROSS THE HIGH BRANCHES'],
        ['TEMPLE OF ROOTS', 'HEAVY DEFENSES IN SACRED GROVE'],
        ['CANOPY OVERDRIVE', 'TRIPLE MOVING TARGET DRIFT'],
        ['JADE COLOSSUS', 'WORLD 3 BOSS • CRUSH THE FOREST GUARDIAN'],

        // World 4: Glacial Citadel (31-40)
        ['PERMAFROST GATE', 'BREACH THE SUB-ZERO THRESHOLD'],
        ['ICE FLOE RECON', 'SWEEP THE LOWER FROSTED LEDGES'],
        ['CRYSTAL PRECIPICE', 'LETHAL SHOTS ACROSS ICY BRIDGES'],
        ['FROSTVALE RIDGE', 'ADVANCE THROUGH BLINDING FROST'],
        ['BLIZZARD DRIFT', 'STRIKE TARGETS IN GALE-FORCE COLD'],
        ['ICE-BOUND SPIRES', 'DUAL DRIFTING CRYSTAL DRONES'],
        ['AVALANCHE ASCENT', 'CLIMB THE FROZEN MONOLITH WALL'],
        ['SUB-ZERO PINNACLE', 'PRECISION SHOTS AT ELEVATED REACH'],
        ['THE FROZEN SEAT', 'PENULTIMATE ARCTIC TRIAL'],
        ['GLACIAL REAVER', 'WORLD 4 BOSS • DEFEAT THE ICE MONARCH'],

        // World 5: Celestial Void (41-50)
        ['ASTRAL GENESIS', 'ENTER THE ZERO-G THRONE DOMAIN'],
        ['EVENT HORIZON', 'CROSS THE FLOATING COSMIC PILLARS'],
        ['NEBULA FLUX', 'GRAVITATIONAL TARGET DISTORTION'],
        ['VOID OBLIVION', 'MULTI-LEVEL ASTRAL COMBAT'],
        ['COSMIC CATACLYSM', 'MOBILE ASTEROID DRONES ACTIVE'],
        ['STARLIGHT CORRIDOR', 'HIGH-SPEED CELESTIAL TARGET FLUX'],
        ['SUPERNOVA ASCENT', 'SCALE TOWARDS THE VOID CITADEL'],
        ['CHAOS VORTEX', 'QUADRUPLE OSCILLATING SHADOWS'],
        ['FINAL SANCTUM', 'FINAL BASTION BEFORE THE EMPEROR'],
        ['CHAOS EMPEROR', 'FINAL BOSS • DEFEAT THE EMPEROR OF CHAOS']
      ];

      const bossHps = [4500, 7500, 11000, 15000, 22000];
      const stages = [];

      for (let i = 1; i <= 50; i++) {
        const wIdx = Math.floor((i - 1) / 10);
        const sInW = ((i - 1) % 10) + 1;
        const isBoss = (sInW === 10);
        const worldData = WORLDS[wIdx];
        const info = titles[i - 1];

        const timeLimit = isBoss ? 120.0 : Math.round((60 + sInW * 2.5 + wIdx * 3.0) * 10) / 10;
        const clearBonusTime = isBoss ? 35.0 : Math.round((18 + sInW * 1.5) * 10) / 10;
        const targets = [];

        if (isBoss) {
          // World Boss on Apex Summit
          targets.push({
            id: `s${i}_boss`,
            name: worldData.bossName,
            bossTitle: worldData.bossName,
            x: 640,
            y: -300,
            maxHp: bossHps[wIdx],
            isBoss: true,
            w: 80,
            h: 125,
            oscillateAxis: 'x',
            oscillateRange: 90,
            oscillatePeriod: 3.4,
            oscillateOffset: 0
          });

          // Minion Guard Targets flanking on lower platforms
          const guardCount = 2 + Math.min(2, wIdx);
          const guardHp = 850 + i * 25;
          const guardCoords = [
            { x: 300, y: -170 },
            { x: 980, y: -170 },
            { x: 220, y: 130 },
            { x: 1040, y: 130 }
          ];
          for (let g = 0; g < guardCount; g++) {
            const coord = guardCoords[g % guardCoords.length];
            targets.push({
              id: `s${i}_g${g + 1}`,
              name: 'Guardian',
              x: coord.x,
              y: coord.y,
              maxHp: guardHp,
              isBoss: false,
              oscillateAxis: (g % 2 === 1) ? 'x' : null,
              oscillateRange: (g % 2 === 1) ? 55 : 0,
              oscillatePeriod: 2.8,
              oscillateOffset: g * 1.2
            });
          }
        } else {
          // Normal Stage Targets (2 to 6 targets scaling across the world)
          let count = 2;
          if (sInW >= 3) count = 3;
          if (sInW >= 5) count = 4;
          if (sInW >= 7) count = 5;
          if (sInW >= 9) count = 6;

          const baseHp = 600 + i * 22;
          const slots = [
            { x: 960, y: 550 },
            { x: 280, y: 420 },
            { x: 880, y: 420 },
            { x: 640, y: 280 },
            { x: 240, y: 130 },
            { x: 920, y: 130 },
            { x: 440, y: -20 },
            { x: 840, y: -20 },
            { x: 480, y: -170 },
            { x: 800, y: -170 },
            { x: 640, y: -300 }
          ];

          for (let k = 0; k < count; k++) {
            const slot = slots[(k * 2 + sInW) % slots.length];
            const hasMove = (sInW >= 6 && k >= count - 2);
            targets.push({
              id: `s${i}_t${k + 1}`,
              name: 'Target',
              x: slot.x + (k % 2 === 0 ? 30 : -30),
              y: slot.y,
              maxHp: Math.round(baseHp * (1 + k * 0.1)),
              isBoss: false,
              oscillateAxis: hasMove ? 'x' : null,
              oscillateRange: hasMove ? (60 + k * 20) : 0,
              oscillatePeriod: 2.4 + k * 0.5,
              oscillateOffset: k * 0.85
            });
          }
        }

        stages.push({
          stage: i,
          world: wIdx + 1,
          stageInWorld: sInW,
          isBoss,
          title: info[0],
          subtitle: info[1],
          timeLimit,
          clearBonusTime,
          targets
        });
      }

      return stages;
    }

    const STAGE_CONFIGS = generateAll50Stages();

    const PRACTICE_TARGETS = [
      { id: 'p_t1', x: 980, y: 550, maxHp: 1200 },
      { id: 'p_t2', x: 270, y: 420, maxHp: 1000 },
      { id: 'p_t3', x: 920, y: 130, maxHp: 1000 },
      { id: 'p_t4', x: 820, y: -170, maxHp: 1500 },
      { id: 'p_t5', x: 640, y: -300, maxHp: 3000, isBoss: true, bossTitle: 'TRAINING TITAN' }
    ];
