let savedHighScore = 0;
    try {
      savedHighScore = parseInt(localStorage.getItem('atlas_timeattack_highscore') || '0', 10);
      if (isNaN(savedHighScore)) savedHighScore = 0;
    } catch (e) {}

    const game = {
      mode: 'TIME_ATTACK', // 'TIME_ATTACK' | 'PRACTICE'
      state: 'START_SCREEN', // 'START_SCREEN' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY'
      currentStage: 1,
      totalStages: STAGE_CONFIGS.length,
      timeLeft: 60.0,
      maxTime: 60.0,
      score: 0,
      displayScore: 0,
      combo: 0,
      maxCombo: 0,
      comboTimer: 0,
      totalTargetsDestroyed: 0,
      stageTargetsTotal: 2,
      stageTargetsRemaining: 2,
      stageBannerTimer: 120,
      stageBannerText: 'STAGE 1: CYBER AWAKENING',
      stageBannerSub: 'INITIALIZE TARGET SENSORS',
      worldBannerTimer: 140,
      worldBannerTitle: 'WORLD 1: CYBER CITADEL',
      worldBannerSub: 'TECH SPIRE OF NEO-ARCADIA',
      clearBannerTimer: 0,
      clearBonusScore: 0,
      lastTickSec: -1,
      screenShake: 0,
      highScore: savedHighScore,
      bgmMuted: false,
      bgmVolume: 0.48,
      isPaused: false
    };

    const dummies = [];

    function createDummyFromConfig(cfg) {
      return {
        id: cfg.id,
        name: cfg.name || (cfg.isBoss ? cfg.bossTitle : 'Target'),
        x: cfg.x,
        y: cfg.y,
        baseX: cfg.x,
        baseY: cfg.y,
        w: cfg.w || (cfg.isBoss ? 75 : 50),
        h: cfg.h || (cfg.isBoss ? 120 : 90),
        angle: 0,
        angleVel: 0,
        wobbleX: 0,
        hitFlash: 0,
        hits: 0,
        totalDamage: 0,
        lastHitTime: 0,
        maxHp: cfg.maxHp || 1000,
        hp: cfg.maxHp || 1000,
        hpLag: cfg.maxHp || 1000,
        isDead: false,
        isBoss: cfg.isBoss || false,
        bossTitle: cfg.bossTitle || '',
        oscillateAxis: cfg.oscillateAxis || null,
        oscillateRange: cfg.oscillateRange || 0,
        oscillatePeriod: cfg.oscillatePeriod || 3.0,
        oscillateOffset: cfg.oscillateOffset || 0,
        respawnTimer: 0,
        respawnScale: 1.0
      };
    }

    function loadStage(stageNum) {
      game.currentStage = stageNum;
      const cfg = STAGE_CONFIGS[stageNum - 1];
      if (!cfg) return;

      const worldIdx = Math.floor((stageNum - 1) / 10);
      const newWorld = WORLDS[worldIdx] || WORLDS[0];
      const worldChanged = (currentWorld !== newWorld);
      currentWorld = newWorld;
      platforms = currentWorld.platforms;

      dummies.length = 0;
      for (const t of cfg.targets) {
        dummies.push(createDummyFromConfig(t));
      }

      game.stageTargetsTotal = dummies.length;
      game.stageTargetsRemaining = dummies.length;
      game.stageBannerText = `STAGE ${stageNum}: ${cfg.title}`;
      game.stageBannerSub = cfg.subtitle;
      game.stageBannerTimer = 110;
      game.clearBannerTimer = 0;

      if (worldChanged || stageNum === 1) {
        game.worldBannerTimer = 140;
        game.worldBannerTitle = `WORLD ${currentWorld.id}: ${currentWorld.name}`;
        game.worldBannerSub = currentWorld.subtitle;
      }

      playStageStartSound();
      restartBGM();
    }

    function startMinigame() {
      game.isPaused = false;
      game.mode = 'TIME_ATTACK';
      game.state = 'PLAYING';
      game.currentStage = 1;
      game.timeLeft = STAGE_CONFIGS[0].timeLimit;
      game.maxTime = STAGE_CONFIGS[0].timeLimit;
      game.score = 0;
      game.displayScore = 0;
      game.combo = 0;
      game.maxCombo = 0;
      game.comboTimer = 0;
      game.totalTargetsDestroyed = 0;
      game.clearBannerTimer = 0;
      game.clearBonusScore = 0;
      game.lastTickSec = -1;
      resetPlayer(false);
      loadStage(1);
    }

    function initPracticeMode() {
      game.isPaused = false;
      game.mode = 'PRACTICE';
      game.state = 'PLAYING';
      game.currentStage = 1;
      game.timeLeft = 999;
      game.score = 0;
      game.displayScore = 0;
      game.combo = 0;
      game.comboTimer = 0;
      game.stageBannerText = 'PRACTICE ARENA';
      game.stageBannerSub = 'INFINITE RESPAWNS • TARGET SHOOTING';
      game.stageBannerTimer = 110;
      game.clearBannerTimer = 0;

      dummies.length = 0;
      for (const t of PRACTICE_TARGETS) {
        dummies.push(createDummyFromConfig(t));
      }
      game.stageTargetsTotal = dummies.length;
      game.stageTargetsRemaining = dummies.length;
      resetPlayer(false);
    }

    function toggleGameMode() {
      if (game.mode === 'TIME_ATTACK') {
        initPracticeMode();
      } else {
        startMinigame();
      }
    }

    function spawnDamageText(x, y, damage, isCrit, isBullseye, color) {
      let label = `${damage}`;
      if (isBullseye) {
        label = `BULLSEYE ${damage}`;
      } else if (isCrit) {
        label = `CRIT ${damage}`;
      }

      damageTexts.push({
        x: x + (Math.random() * 16 - 8),
        y: y - (Math.random() * 6),
        vx: (Math.random() - 0.5) * 0.8,
        vy: isCrit ? -2.2 : -1.7,
        text: label,
        color: color,
        isCrit: isCrit,
        isBullseye: isBullseye,
        life: 0.85
      });
    }

    function spawnDummyImpactParticles(x, y, type, isBullseye) {
      const count = isBullseye ? 9 : 6;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 2.2 + 1.2;
        
        let color = '#d4a359'; // Straw gold
        if (Math.random() > 0.6) color = '#854d0e'; // Wood splinter
        if (type === 'magic') color = Math.random() > 0.5 ? '#38bdf8' : '#e0f2fe';
        if (isBullseye && Math.random() > 0.4) color = '#fbbf24'; // Gold spark

        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 0.8,
          life: 0.4,
          color: color,
          size: Math.random() * 1.5 + 1.0
        });
      }

      // Compact micro-shockwave for bullseye
      if (isBullseye) {
        particles.push({
          x: x,
          y: y,
          vx: 0,
          vy: 0,
          life: 0.35,
          decay: 0.045,
          isRing: true,
          radius: 3,
          expandSpeed: 1.8,
          lineWidth: 1.4,
          color: '#fbbf24'
        });
      }
    }

    function explodeDummy(dummy) {
      dummy.isDead = true;
      dummy.hp = 0;
      dummy.hpLag = 0;

      if (game.mode === 'PRACTICE') {
        dummy.respawnTimer = 220; // ~3.6s
        dummy.respawnScale = 0.1;
      } else {
        dummy.respawnTimer = -1; // En TIME ATTACK nunca hay respawn durante el nivel
      }

      // Detach stuck arrows
      for (const arrow of arrows) {
        if (arrow.stuckTo === dummy) {
          arrow.stuckTo = null;
          arrow.stuck = false;
          arrow.vx = (Math.random() - 0.5) * 5;
          arrow.vy = -Math.random() * 4 - 1.5;
          arrow.life = 25;
        }
      }

      playExplosionSound();
      spawnDummyExplosion(dummy.x, dummy.y - 48);
      game.screenShake = 6.5;

      damageTexts.push({
        x: dummy.x,
        y: dummy.y - 70,
        vx: 0,
        vy: -1.6,
        text: 'DESTROYED',
        color: '#ef4444',
        isCrit: true,
        isBullseye: true,
        life: 1.1
      });

      // Minigame Stats & Combo
      game.totalTargetsDestroyed++;
      game.combo++;
      if (game.combo > game.maxCombo) game.maxCombo = game.combo;
      game.comboTimer = 210; // ~3.5s window
      const comboMultiplier = Math.min(5, game.combo);
      const killPoints = 500 * comboMultiplier;
      game.score += killPoints;

      if (game.mode === 'TIME_ATTACK' && game.state === 'PLAYING') {
        // Kill Time Bonus (+4.0s)
        const timeBonus = 4.0;
        game.timeLeft = Math.min(120.0, game.timeLeft + timeBonus);
        playTimeBonusSound();

        damageTexts.push({
          x: dummy.x,
          y: dummy.y - 94,
          vx: 0,
          vy: -1.8,
          text: `+${timeBonus.toFixed(1)}s TIME`,
          color: '#4ade80',
          isCrit: true,
          isBullseye: false,
          life: 1.25
        });

        // Check if all targets on stage are eliminated
        const aliveCount = dummies.filter(d => !d.isDead).length;
        game.stageTargetsRemaining = aliveCount;
        if (aliveCount === 0) {
          onStageCleared();
        }
      }
    }

    function onStageCleared() {
      playStageClearSound();
      game.screenShake = 9.0;
      game.state = 'STAGE_CLEAR';
      game.clearBannerTimer = 110; // ~1.8s delay before next stage

      const stageCfg = STAGE_CONFIGS[game.currentStage - 1];
      const timeBonusPts = Math.floor(game.timeLeft * 100);
      game.clearBonusScore = timeBonusPts;
      game.score += timeBonusPts;

      if (stageCfg && stageCfg.clearBonusTime) {
        game.timeLeft = Math.min(120.0, game.timeLeft + stageCfg.clearBonusTime);
      }
    }

    function spawnDummyExplosion(cx, cy) {
      // 1. Compact wood & straw splinters with physics
      const debrisColors = ['#854d0e', '#ca8a04', '#eab308', '#451a03', '#d97706'];
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4.2 + 1.5;
        particles.push({
          x: cx + (Math.random() * 12 - 6),
          y: cy + (Math.random() * 18 - 9),
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 2.0,
          gravity: 0.25,
          w: Math.random() * 3.5 + 2.5,
          h: Math.random() * 3 + 1.8,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
          isDebris: true,
          life: 0.85,
          decay: 0.022
        });
      }

      // 2. Micro spark burst
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.2 + 1.2;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.0,
          gravity: 0.1,
          size: Math.random() * 2.0 + 1.0,
          color: Math.random() > 0.4 ? '#fbbf24' : '#ef4444',
          life: 0.55,
          decay: 0.03
        });
      }

      // 3. Subtle smoke wisps
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 1.4 + 0.4;
        particles.push({
          x: cx + (Math.random() * 10 - 5),
          y: cy + (Math.random() * 10 - 5),
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 0.8,
          radius: Math.random() * 3 + 4,
          color: 'rgba(148, 163, 184, 0.35)',
          isSmoke: true,
          life: 0.65,
          decay: 0.025
        });
      }

      // 4. Compact shockwave ring
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: 4,
        expandSpeed: 2.2,
        lineWidth: 1.8,
        color: '#f59e0b',
        isRing: true,
        life: 0.4,
        decay: 0.04
      });
    }

    function spawnRespawnParticles(cx, cy) {
      // Swirling gathering particles
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 24 + 10;
        const targetX = cx;
        const targetY = cy;
        const startX = cx + Math.cos(angle) * dist;
        const startY = cy + Math.sin(angle) * dist;
        particles.push({
          x: startX,
          y: startY,
          vx: (targetX - startX) * 0.1,
          vy: (targetY - startY) * 0.1 - 0.4,
          size: Math.random() * 2.0 + 1.0,
          color: Math.random() > 0.4 ? '#38bdf8' : '#facc15',
          life: 0.5,
          decay: 0.035
        });
      }
    }

    function spawnRespawnBurst(cx, cy) {
      // Subtle reconstruction gleam upon respawn
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.0 + 1.0;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 2.0 + 1.0,
          color: Math.random() > 0.5 ? '#38bdf8' : '#e0f2fe',
          life: 0.55,
          decay: 0.03
        });
      }
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: 3,
        expandSpeed: 2.0,
        lineWidth: 1.5,
        color: '#38bdf8',
        isRing: true,
        life: 0.35,
        decay: 0.04
      });
    }
