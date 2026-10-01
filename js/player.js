// =========================================================================
// MOTOR DE FÍSICAS Y MECÁNICAS DEL ARQUERO (PLATAFORMAS PRECISAS)
// =========================================================================
    const GRAVITY = 0.52;
    const RUN_ACCEL = 0.85;
    const RUN_MAX_SPEED = 4.8;
    const FRICTION = 0.78;
    const JUMP_FORCE = -12.5;
    const DOUBLE_JUMP_FORCE = -12.2;
    const DASH_SPEED = 14.0;

    const player = {
      x: 640,
      y: 400,
      vx: 0,
      vy: 0,
      width: 40,
      height: 72,
      facing: 1, // 1: derecha, -1: izquierda
      isGrounded: false,
      canDoubleJump: true,
      isDoubleJumping: false,
      doubleJumpFrame: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      tripleCooldown: 0,
      magicCooldown: 0,
      dashDir: 1,
      attackType: null, // 'basic' | 'triple' | 'magic'
      attackTick: 0,
      attackFrame: 0,
      shotsFired: [],
      airTimer: 0,
      dropTimer: 0,
      ignorePlatform: null,
      runAnimTimer: 0,
      lastStepFoot: 0
    };

    const arrows = [];
    const particles = [];
    const dashGhosts = [];


const damageTexts = [];

    // Canvas auxiliar para teñir la silueta del dash sin cuadros azules
    let dashOffscreenCanvas = null;
    let dashOffscreenCtx = null;
    function getDashCanvas() {
      if (!dashOffscreenCanvas) {
        dashOffscreenCanvas = document.createElement('canvas');
        dashOffscreenCanvas.width = CELL_W;
        dashOffscreenCanvas.height = CELL_H;
        dashOffscreenCtx = dashOffscreenCanvas.getContext('2d');
      }
      return { canvas: dashOffscreenCanvas, ctx: dashOffscreenCtx };
    }

    function triggerDrop() {
      if (game.state !== 'PLAYING') return; // Bloqueo estricto durante Time's Up / Game Over
      unlockAudioOnTouch();
      if (player.isGrounded && player.y + player.height < 540) {
        // Encontrar la plataforma específica sobre la que está parado actualmente
        const currentP = platforms.find(p => 
          p.isOneWay && 
          Math.abs((player.y + player.height) - p.y) <= 8 &&
          player.x + player.width > p.x && player.x < p.x + p.w
        );
        player.ignorePlatform = currentP || null;
        player.dropTimer = 16; // Inmunidad exclusiva para atravesar la plataforma actual
        player.isGrounded = false;
        player.canDoubleJump = true;
        player.vy = 3.5;
        player.y += 3;
        triggerHaptic('light');
      }
    }

    function triggerJump() {
      if (game.state !== 'PLAYING') return; // Bloqueo estricto durante Time's Up / Game Over
      unlockAudioOnTouch();
      if (player.attackType) return; // Ninguna animación de ataque puede ser interrumpida por salto

      if (player.isGrounded) {
        player.vy = JUMP_FORCE; // -12.5 (Salto principal potente)
        player.isGrounded = false;
        player.canDoubleJump = true;
        spawnJumpDust(player.x + player.width / 2, player.y + player.height, 8);
        playSound('jump', { volume: 0.85, maxDuration: 0.22 });
        triggerHaptic('light');
      } else if (player.canDoubleJump && player.dropTimer <= 0) {
        player.canDoubleJump = false;
        player.isDoubleJumping = true;
        player.doubleJumpFrame = 0;
        player.vy = DOUBLE_JUMP_FORCE; // -12.2 (Doble salto completo, resetea cualquier caída previa)
        spawnDoubleJumpParticles(player.x + player.width / 2, player.y + player.height);
        playSound('jump', { volume: 0.90, detune: 180, maxDuration: 0.22 });
        triggerHaptic('medium');
      }
    }

    function resetPlayer(fullReset = false) {
      player.x = 640 - player.width / 2;
      player.y = 550 - player.height;
      player.vx = 0;
      player.vy = 0;
      player.facing = 1;
      player.isGrounded = true;
      player.canDoubleJump = true;
      player.isDoubleJumping = false;
      player.isDashing = false;
      player.attackType = null;
      dashGhosts.length = 0;
      arrows.length = 0;
      damageTexts.length = 0;
      stopSound('dash');
      stopSound('magic_arrow');
      player.lastStepFoot = 0;
      player.ignorePlatform = null;
      player.dropTimer = 0;
      game.isPaused = false;

      if (fullReset) {
        if (game.mode === 'TIME_ATTACK') {
          startMinigame();
        } else {
          initPracticeMode();
        }
      }
    }

    function triggerDash() {
      if (game.state !== 'PLAYING') return; // Bloqueo estricto durante Time's Up / Game Over
      if (player.attackType || player.dashCooldown > 0 || player.isDashing) return; // No interrumpir ataques con dash
      player.isDashing = true;
      player.dashTimer = 14; // frames a 60fps (0.233s)
      player.dashCooldown = 24;

      let moveDir = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) moveDir -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveDir += 1;
      player.dashDir = moveDir !== 0 ? moveDir : player.facing;
      player.facing = player.dashDir;
      player.vy = 0;

      // Sonido de dash sincronizado exactamente a los 14 frames (0.233s)
      playSound('dash', { volume: 0.85, maxDuration: 0.233 });

      // Destellos al arrancar el dash
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: player.x + player.width / 2,
          y: player.y + player.height * 0.5 + (Math.random() * 26 - 13),
          vx: -player.dashDir * (Math.random() * 12 + 6),
          vy: (Math.random() - 0.5) * 3,
          life: 1.0,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
          length: Math.random() * 20 + 10
        });
      }
    }

    function spawnStraightArrow(type = 'normal', offsetX = 38, offsetY = -56, subType = 'basic') {
      const facing = player.attackFacing || player.facing;
      const feetX = player.x + player.width / 2;
      const feetY = player.y + player.height;
      const startX = feetX + facing * offsetX;
      const startY = feetY + offsetY;
      const speed = type === 'magic' ? 20.0 : 18.5;

      arrows.push({
        x: startX,
        y: startY,
        vx: facing * speed,
        vy: 0, // Línea recta pura sin desviación
        angle: facing > 0 ? 0 : Math.PI,
        stuck: false,
        stuckTo: null,
        stuckOffsetX: 0,
        stuckOffsetY: 0,
        stuckAngle: 0,
        stuckTimer: 0,
        life: 180, // Límite de vida en vuelo
        alpha: 1.0,
        type: type,
        subType: subType
      });
    }

    function triggerShoot(type) {
      if (game.state !== 'PLAYING') return; // Bloqueo estricto durante Time's Up / Game Over
      if (player.attackType) return; // NINGUNA animación de ataque puede ser interrumpida
      if (type === 'triple' && player.tripleCooldown > 0) return;
      if (type === 'magic' && player.magicCooldown > 0) return;

      player.attackType = type;
      player.attackTick = 0;
      player.attackFrame = 0;
      player.shotsFired = []; // Rastreará los frames exactos que ya dispararon
      player.attackFacing = player.facing; // Fijar rígidamente la orientación del disparo (cero desvíos)
      // El personaje al atacar debe detenerse un momento mientras se reproduce la animación
      player.vx = 0;
      player.isDashing = false;
      stopSound('dash');

      if (type === 'triple') {
        player.tripleCooldown = 90; // 1.5s a 60fps
        triggerHaptic('medium');
      } else if (type === 'magic') {
        player.magicCooldown = 150; // 2.5s a 60fps
        triggerHaptic('heavy');
        playSound('magic_arrow', { volume: 0.95 });
      } else {
        triggerHaptic('light');
      }
    }

    function spawnJumpDust(x, y, count) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() * 24 - 12),
          y: y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 2 - 0.5,
          life: 0.6,
          color: 'rgba(56, 189, 248, 0.7)',
          size: Math.random() * 3 + 2
        });
      }
    }

    function spawnDoubleJumpParticles(x, y) {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 2;
        particles.push({
          x: x,
          y: y - 10,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0.7,
          color: Math.random() > 0.5 ? '#e0f2fe' : '#38bdf8',
          size: Math.random() * 3.5 + 1.5
        });
      }
    }
