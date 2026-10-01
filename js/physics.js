// =========================================================================
    // ACTUALIZACIÓN DE FÍSICAS (60 FPS)
    // =========================================================================
    function update() {
      // Si el juego está en pausa, congelar físicas, tiempo, proyectiles y animaciones
      if (game.isPaused) return;

      // 1. Dash & Cooldowns
      if (player.dashCooldown > 0) player.dashCooldown--;
      if (player.tripleCooldown > 0) player.tripleCooldown--;
      if (player.magicCooldown > 0) player.magicCooldown--;
      updateMobileCooldownVisuals();
      if (player.isDashing) {
        player.dashTimer--;
        player.vx = player.dashDir * DASH_SPEED;
        player.vy = 0;

        // Ecos de celaje (afterimage)
        dashGhosts.push({
          x: player.x,
          y: player.y,
          facing: player.facing,
          alpha: 0.65,
          frame: 10
        });

        if (player.dashTimer <= 0) {
          player.isDashing = false;
          player.vx *= 0.5;
          stopSound('dash', 0.02);
        }
      } else {
        // Bloqueo estricto durante ataque: la orientación queda congelada en attackFacing (cero desvíos al girar)
        if (player.attackType) {
          player.facing = player.attackFacing || player.facing;
          if (player.isGrounded) {
            player.vx = 0;
          } else {
            player.vx *= 0.85;
          }
          player.runAnimTimer = 0;
          player.lastStepFoot = 0;
        } else if (game.state !== 'PLAYING') {
          // Congelar movimiento cuando está en Time's Up, Game Over o Victoria
          player.vx *= 0.5;
          if (Math.abs(player.vx) < 0.1) player.vx = 0;
          player.runAnimTimer = 0;
          player.lastStepFoot = 0;
        } else {
          // Movimiento horizontal normal solo durante PLAYING
          let move = 0;
          if (keys['KeyA'] || keys['ArrowLeft']) move -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) move += 1;

          if (move !== 0) {
            player.vx += move * RUN_ACCEL;
            if (Math.abs(player.vx) > RUN_MAX_SPEED) {
              player.vx = Math.sign(player.vx) * RUN_MAX_SPEED;
            }
            player.facing = move;
            player.runAnimTimer++;
          } else {
            player.vx *= FRICTION;
            if (Math.abs(player.vx) < 0.1) player.vx = 0;
            player.runAnimTimer = 0;
          }
        }

        // Sincronización quirúrgica de pisadas con el ciclo de correr en tierra firme
        const isRunningOnGround = player.isGrounded && Math.abs(player.vx) > 0.8 && !player.isDashing && !player.attackType;
        if (isRunningOnGround) {
          const runFrame = Math.floor(player.runAnimTimer * 0.45) % sheets.run.frames;
          // Contactos anatómicos del pie en frames 5, 15, 24 y 33 del spritesheet
          let currentFoot = 0;
          if (runFrame >= 5 && runFrame <= 9) currentFoot = 1;
          else if (runFrame >= 15 && runFrame <= 19) currentFoot = 2;
          else if (runFrame >= 24 && runFrame <= 28) currentFoot = 3;
          else if (runFrame >= 33 && runFrame <= 37) currentFoot = 4;

          if (currentFoot > 0 && player.lastStepFoot !== currentFoot) {
            player.lastStepFoot = currentFoot;
            const soundKey = (currentFoot % 2 === 1) ? 'step1' : 'step2';
            playSound(soundKey, {
              volume: 0.32,
              detune: (Math.random() * 60 - 30),
              maxDuration: 0.16
            });
          } else if (currentFoot === 0) {
            player.lastStepFoot = 0;
          }
        } else {
          player.lastStepFoot = 0;
        }

        // Gravedad
        player.vy += GRAVITY;
        if (player.vy > 14) player.vy = 14;
      }

      // Progresión de Ataques y Disparo sincronizado por frames exactos
      if (player.attackType) {
        player.attackTick++;
        const TOTAL_TICKS = 28;

        // Disparo exacto según el frame de la animación:
        if (player.attackType === 'basic') {
          // Básico: 62 frames. Dispara en frame 44, alineado al centro del arco
          const currentFrame = Math.min(61, Math.floor((player.attackTick / 27) * 61));
          if (currentFrame >= 44 && !player.shotsFired.includes(44)) {
            spawnStraightArrow('normal', 38, -56.0, 'basic'); // Centro exacto del arco
            player.shotsFired.push(44);
            playSound('disparo', { volume: 0.85 });
          }
        } else if (player.attackType === 'magic') {
          // Magic arrow: 28 frames. Dispara en frame 22, perfectamente alineado en X con el disparo básico (38px)
          const currentFrame = player.attackTick;
          if (currentFrame >= 22 && !player.shotsFired.includes(22)) {
            spawnStraightArrow('magic', 38, -55.5, 'magic'); // 38px, exactamente alineado con el arco y los demás ataques
            player.shotsFired.push(22);
            // El estallido sonoro de magic_arrow.ogg alcanza su clímax exactamente a los 0.354s coincidiendo con este frame 22!
          }
        } else if (player.attackType === 'triple') {
          // Triple: 28 frames. Dispara en frames 10, 17 y 25, cada uno en el centro de su onda
          const currentFrame = player.attackTick;
          if (currentFrame >= 10 && !player.shotsFired.includes(10)) {
            spawnStraightArrow('normal', 35, -72.0, 'triple'); // Onda 1 (alta)
            player.shotsFired.push(10);
            playSound('disparo', { volume: 0.75, detune: 50 });
          }
          if (currentFrame >= 17 && !player.shotsFired.includes(17)) {
            spawnStraightArrow('normal', 35, -37.5, 'triple'); // Onda 2 (baja)
            player.shotsFired.push(17);
            playSound('disparo_alt1', { volume: 0.80, detune: 0 });
          }
          if (currentFrame >= 25 && !player.shotsFired.includes(25)) {
            spawnStraightArrow('normal', 35, -52.5, 'triple'); // Onda 3 (media)
            player.shotsFired.push(25);
            playSound('disparo_alt2', { volume: 0.85, detune: -50 });
          }
        }

        if (player.attackTick >= TOTAL_TICKS) {
          player.attackType = null;
          player.attackTick = 0;
          player.shotsFired = [];
        }
      }

      // Progresión de Doble Salto
      if (player.isDoubleJumping) {
        player.doubleJumpFrame++;
        if (player.doubleJumpFrame >= 42) {
          player.isDoubleJumping = false;
        }
      }

      // 2. Temporizador de caída voluntaria de plataforma
      if (player.dropTimer > 0) {
        player.dropTimer--;
        if (player.dropTimer === 0) {
          player.ignorePlatform = null;
        }
      }
      moveAndCollide();

      // Aire / Suelo
      if (!player.isGrounded) {
        player.airTimer++;
      } else {
        player.airTimer = 0;
        player.isDoubleJumping = false;
      }

      // Física de los muñecos de prueba (resorte oscilatorio, amortiguación elástica y regeneración)
      for (const d of dummies) {
        // Lag fluido de barra de vida
        if (d.hpLag > d.hp) {
          d.hpLag += (d.hp - d.hpLag) * 0.08;
          if (Math.abs(d.hpLag - d.hp) < 1) d.hpLag = d.hp;
        } else {
          d.hpLag = d.hp;
        }

        // En TIME_ATTACK: Los objetivos NO se recuperan jamás hasta el siguiente nivel
        if (d.isDead) {
          if (game.mode === 'PRACTICE') {
            d.respawnTimer--;
            // Partículas mágicas de reconstrucción antes de regenerar
            if (d.respawnTimer <= 45 && d.respawnTimer > 0 && d.respawnTimer % 3 === 0) {
              spawnRespawnParticles(d.x, d.y - 25);
            }
            if (d.respawnTimer <= 0) {
              d.isDead = false;
              d.hp = d.maxHp;
              d.hpLag = d.maxHp;
              d.respawnScale = 0.15;
              playRespawnSound();
              spawnRespawnBurst(d.x, d.y - 45);
              damageTexts.push({
                x: d.x,
                y: d.y - 75,
                vx: 0,
                vy: -1.6,
                text: 'RESPAWNED',
                color: '#38bdf8',
                isCrit: true,
                isBullseye: false,
                life: 1.0
              });
            }
          }
          // En modo juego (TIME_ATTACK), el objetivo queda eliminado permanentemente en esta fase
          continue;
        } else {
          // Si acaba de regenerarse, efecto rebote elástico hacia escala 1.0
          if (d.respawnScale < 1.0) {
            d.respawnScale += (1.0 - d.respawnScale) * 0.18;
            if (d.respawnScale > 0.99) d.respawnScale = 1.0;
          }
        }

        // Oscilación y movimiento dinámico de objetivos móviles
        if (d.oscillateAxis && !d.isDead) {
          const t = (Date.now() / 1000) * (Math.PI * 2 / d.oscillatePeriod) + d.oscillateOffset;
          const delta = Math.sin(t) * d.oscillateRange;
          if (d.oscillateAxis === 'x') {
            d.x = d.baseX + delta;
          } else if (d.oscillateAxis === 'y') {
            d.y = d.baseY + delta;
          }
        }

        const springK = 0.075;
        const damping = 0.88;
        const springForce = -d.angle * springK;
        d.angleVel = (d.angleVel + springForce) * damping;
        d.angle += d.angleVel;
        d.wobbleX *= 0.78;
        if (d.hitFlash > 0) d.hitFlash -= 0.12;
      }

      // 3. Flechas (Línea recta pura y colisiones con muñecos y entorno)
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];

        if (arrow.stuck) {
          // Ya impactó: desvanecer al ratico (~0.85s) y desaparecer de la pantalla
          arrow.stuckTimer--;
          if (arrow.stuckTimer < 20) {
            arrow.alpha = Math.max(0, arrow.stuckTimer / 20);
          }
          if (arrow.stuckTimer <= 0) {
            arrows.splice(i, 1);
            continue;
          }
        } else {
          // En vuelo: línea recta pura sin gravedad
          arrow.x += arrow.vx;
          arrow.y += arrow.vy;
          arrow.life--;

          // Desaparece si sale de la pantalla o expira su tiempo de vuelo
          if (arrow.life <= 0 || arrow.x < -100 || arrow.x > 1500) {
            arrows.splice(i, 1);
            continue;
          }

          // A. Colisión de flecha con muñecos de prueba (Tiro al blanco)
          let hitDummy = false;
          for (const dummy of dummies) {
            if (dummy.isDead) continue; // Si está destruido, las flechas no colisionan y siguen de largo

            const tipX = arrow.x + (arrow.vx > 0 ? 16 : -16);
            const tipY = arrow.y;

            if (tipX >= dummy.x - 22 && tipX <= dummy.x + 22 &&
                tipY >= dummy.y - 88 && tipY <= dummy.y) {

              const bullseyeY = dummy.y - 56; // Centro exacto del tiro al blanco
              const distFromBullseye = Math.abs(tipY - bullseyeY);
              const isBullseye = distFromBullseye <= 7.0; // ¡Diana perfecta en el centro!
              const impactDir = Math.sign(arrow.vx) || 1;

              if (arrow.type === 'magic') {
                // Flecha mágica azur: atraviesa con onda de choque y golpe crítico
                arrow.hitDummies = arrow.hitDummies || [];
                if (!arrow.hitDummies.includes(dummy.id)) {
                  arrow.hitDummies.push(dummy.id);
                  dummy.angleVel += impactDir * (isBullseye ? 0.28 : 0.20);
                  dummy.wobbleX = impactDir * 10;
                  dummy.hitFlash = 1.0;

                  const dmg = isBullseye 
                    ? (500 + Math.floor(Math.random() * 60)) 
                    : (410 + Math.floor(Math.random() * 50));

                  dummy.hits++;
                  dummy.totalDamage += dmg;
                  dummy.lastHitTime = Date.now();
                  dummy.hp = Math.max(0, dummy.hp - dmg);
                  game.score += isBullseye ? 250 : 100;

                  spawnDamageText(dummy.x, dummy.y - 65, dmg, true, isBullseye, '#38bdf8');
                  spawnDummyImpactParticles(tipX, tipY, 'magic', isBullseye);
                  playImpactSound('magic', isBullseye);

                  if (dummy.hp <= 0 && !dummy.isDead) {
                    explodeDummy(dummy);
                  }
                }
              } else {
                // Flecha normal / triple: se clava en la diana y se balancea con el muñeco
                arrow.stuck = true;
                arrow.stuckTo = dummy;
                arrow.stuckOffsetX = arrow.x - dummy.x;
                arrow.stuckOffsetY = arrow.y - dummy.y;
                arrow.stuckAngle = arrow.angle;
                arrow.stuckTimer = 55; // Se desvanece tras 55 frames (~0.9s)
                arrow.vx = 0;
                arrow.vy = 0;

                dummy.angleVel += impactDir * (isBullseye ? 0.16 : 0.11);
                dummy.wobbleX = impactDir * 6;
                dummy.hitFlash = 0.85;

                let dmg = 0;
                if (arrow.subType === 'triple') {
                  dmg = isBullseye ? (140 + Math.floor(Math.random() * 20)) : (95 + Math.floor(Math.random() * 20));
                } else {
                  dmg = isBullseye ? (185 + Math.floor(Math.random() * 25)) : (140 + Math.floor(Math.random() * 20));
                }

                dummy.hits++;
                dummy.totalDamage += dmg;
                dummy.lastHitTime = Date.now();
                dummy.hp = Math.max(0, dummy.hp - dmg);
                game.score += isBullseye ? 150 : 50;

                const textCol = isBullseye ? '#fbbf24' : '#f8fafc';
                spawnDamageText(dummy.x, dummy.y - 65, dmg, isBullseye, isBullseye, textCol);
                spawnDummyImpactParticles(tipX, tipY, 'normal', isBullseye);
                playImpactSound('normal', isBullseye);

                if (dummy.hp <= 0 && !dummy.isDead) {
                  explodeDummy(dummy);
                }

                hitDummy = true;
                break;
              }
            }
          }

          if (hitDummy) continue;

          // B. Colisión de flecha con plataformas
          for (const p of platforms) {
            if (arrow.x >= p.x && arrow.x <= p.x + p.w &&
                arrow.y >= p.y && arrow.y <= p.y + p.h) {
              arrow.stuck = true;
              arrow.vx = 0;
              arrow.vy = 0;
              arrow.stuckTimer = 50; // Permanece un ratico (~0.85s) clavada y desaparece
              arrow.alpha = 1.0;
              spawnArrowImpact(arrow.x, arrow.y, arrow.type);
              playImpactSound('wall', false);
              break;
            }
          }
        }
      }

      // 4. Partículas (Física de explosión, humo, fragmentos y anillos)
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.gravity) pt.vy += pt.gravity;
        if (pt.rot !== undefined) pt.rot += pt.vRot || 0.08;
        if (pt.isRing) {
          pt.radius += pt.expandSpeed || 2.2;
        } else if (pt.isSmoke) {
          pt.radius = (pt.radius || 4) + 0.35;
          pt.vx *= 0.94;
          pt.vy *= 0.94;
        }
        pt.life -= pt.decay || 0.025;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // 4.1 Partículas atmosféricas y climáticas del mundo activo (optimizadas para móvil de gama baja)
      const isMobileDevice = (window.innerWidth <= 1024) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const maxAmbient = isMobileDevice ? 40 : 85;
      if (Math.random() < (isMobileDevice ? 0.20 : 0.35) && particles.length < maxAmbient) {
        spawnAmbientWorldParticle(currentWorld);
      }

      // 5. Textos de Daño Flotantes
      for (let i = damageTexts.length - 1; i >= 0; i--) {
        const dt = damageTexts[i];
        dt.x += dt.vx;
        dt.y += dt.vy;
        dt.vy += 0.08;
        dt.life -= 0.022;
        if (dt.life <= 0) damageTexts.splice(i, 1);
      }

      // 5. Ecos de celaje
      for (let i = dashGhosts.length - 1; i >= 0; i--) {
        const g = dashGhosts[i];
        g.alpha -= 0.055;
        if (g.alpha <= 0) dashGhosts.splice(i, 1);
      }

      // 6. Temporizador y lógica de juego (TIME ATTACK & COMBO)
      if (game.mode === 'TIME_ATTACK') {
        if (game.state === 'PLAYING') {
          game.timeLeft = Math.max(0, game.timeLeft - 1 / 60);

          // Audio urgente cuando quedan <= 5 segundos
          const currentIntSec = Math.floor(game.timeLeft);
          if (game.timeLeft <= 5.0 && game.timeLeft > 0 && currentIntSec !== game.lastTickSec) {
            game.lastTickSec = currentIntSec;
            playTimerTickSound(true);
            game.screenShake = Math.max(game.screenShake, 3.0);
          }

          if (game.timeLeft <= 0) {
            game.timeLeft = 0;
            game.state = 'GAME_OVER';
            playGameOverSound();
            game.screenShake = 12.0;
            if (bgmAudio) bgmAudio.pause(); // Detener música para dar paso al gong trágico de derrota
            player.vx = 0;
            player.isDashing = false;
            stopSound('dash');
            stopSound('run');
            for (const k in keys) keys[k] = false;
            if (game.score > game.highScore) {
              game.highScore = game.score;
              try { localStorage.setItem('atlas_timeattack_highscore', game.highScore.toString()); } catch (e) {}
            }
          }
        } else if (game.state === 'STAGE_CLEAR') {
          game.clearBannerTimer--;
          if (game.clearBannerTimer <= 0) {
            if (game.currentStage < game.totalStages) {
              loadStage(game.currentStage + 1);
              game.state = 'PLAYING';
            } else {
              game.state = 'VICTORY';
              playStageClearSound();
              game.screenShake = 10.0;
              if (game.score > game.highScore) {
                game.highScore = game.score;
                try { localStorage.setItem('atlas_timeattack_highscore', game.highScore.toString()); } catch (e) {}
              }
            }
          }
        }
      }

      // Contador de combo
      if (game.comboTimer > 0) {
        game.comboTimer--;
        if (game.comboTimer <= 0) {
          game.combo = 0;
        }
      }

      // Banner de inicio de nivel y mundo
      if (game.stageBannerTimer > 0) {
        game.stageBannerTimer--;
      }
      if (game.worldBannerTimer > 0) {
        game.worldBannerTimer--;
      }

      // Animación suave de aumento de puntuación
      if (game.displayScore < game.score) {
        const diff = game.score - game.displayScore;
        game.displayScore += Math.max(1, Math.ceil(diff * 0.16));
        if (game.displayScore > game.score) game.displayScore = game.score;
      }
    }

    function moveAndCollide() {
      player.x += player.vx;

      // Límites laterales del cuadro de prueba
      if (player.x < 100) {
        player.x = 100;
        player.vx = 0;
      }
      if (player.x + player.width > 1180) {
        player.x = 1180 - player.width;
        player.vx = 0;
      }

      const prevY = player.y;
      player.y += player.vy;
      player.isGrounded = false;

      // Techo superior de la arena (ampliado para libertad aérea absoluta en la cima)
      if (player.y < -700) {
        player.y = -700;
        player.vy = 0;
      }

      for (const p of platforms) {
        if (p.isOneWay) {
          // Si estamos cayendo voluntariamente a través de ESTA plataforma específica, permitirle atravesarla
          if (player.ignorePlatform === p && player.dropTimer > 0) {
            continue;
          }

          // Aterrizar estrictamente cuando cae hacia abajo (vy >= 0)
          if (player.vy >= 0) {
            const footPrev = prevY + player.height;
            const footNow = player.y + player.height;

            // Margen dinámico adaptativo a la velocidad de caída (vy) para erradicar el tunneling a cualquier velocidad
            const fallMargin = Math.max(14, player.vy + 4);

            // Los pies estaban por encima (o en el paso de caída) y ahora cruzaron la superficie superior
            if (footPrev <= p.y + fallMargin && footNow >= p.y) {
              // Comprobación horizontal con margen de seguridad en los bordes
              if (player.x + player.width - 4 > p.x && player.x + 4 < p.x + p.w) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
                player.canDoubleJump = true;
                player.isDoubleJumping = false;
                player.ignorePlatform = null;
              }
            }
          }
        } else {
          // Plataforma sólida (suelo principal)
          if (player.x + player.width > p.x && player.x < p.x + p.w) {
            const solidFallMargin = Math.max(14, player.vy + 4);
            if (player.vy >= 0 && prevY + player.height <= p.y + solidFallMargin && player.y + player.height >= p.y) {
              player.y = p.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
              player.canDoubleJump = true;
              player.isDoubleJumping = false;
              player.ignorePlatform = null;
            } else if (player.vy < 0 && prevY >= p.y + p.h - 10 && player.y <= p.y + p.h) {
              player.y = p.y + p.h;
              player.vy = 0;
            }
          }
        }
      }
    }

    function spawnArrowImpact(x, y, type) {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 2.0 + 1.0;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0.32,
          color: type === 'magic' ? '#38bdf8' : '#cbd5e1',
          size: Math.random() * 1.5 + 1.0
        });
      }
    }

    function spawnAmbientWorldParticle(world) {
      if (!world) return;
      const type = world.particleType || 'sparks';
      const arenaX = 90;
      const arenaW = 1100;

      if (type === 'embers') {
        // Chispas ardientes volcánicas ascendentes
        particles.push({
          x: arenaX + Math.random() * arenaW,
          y: 540 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.0,
          vy: -Math.random() * 2.6 - 1.2,
          gravity: -0.012,
          size: Math.random() * 2.8 + 1.2,
          color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
          life: 1.0,
          decay: 0.013
        });
      } else if (type === 'snow') {
        // Ventisca helada cayendo en diagonal
        particles.push({
          x: arenaX + Math.random() * (arenaW + 200),
          y: -700 + Math.random() * 80,
          vx: -1.8 - Math.random() * 1.2,
          vy: 2.2 + Math.random() * 1.8,
          size: Math.random() * 2.6 + 1.2,
          color: Math.random() > 0.3 ? '#e0f2fe' : '#ffffff',
          life: 1.0,
          decay: 0.007
        });
      } else if (type === 'spores') {
        // Esporas esmeralda bioluminiscentes flotantes
        particles.push({
          x: arenaX + Math.random() * arenaW,
          y: -650 + Math.random() * 1150,
          vx: (Math.random() - 0.5) * 0.7,
          vy: 0.4 + Math.random() * 0.6,
          size: Math.random() * 2.4 + 1.0,
          color: Math.random() > 0.3 ? '#34d399' : '#10b981',
          life: 1.0,
          decay: 0.009
        });
      } else if (type === 'stardust') {
        // Polvo estelar cósmico dorado y amatista
        particles.push({
          x: arenaX + Math.random() * arenaW,
          y: -680 + Math.random() * 1200,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2.4 + 1.0,
          color: Math.random() > 0.4 ? '#facc15' : '#c084fc',
          life: 1.0,
          decay: 0.012
        });
      } else {
        // Chispas tecnológicas cian ascendentes
        particles.push({
          x: arenaX + Math.random() * arenaW,
          y: 520 - Math.random() * 800,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.8 - 0.6,
          size: Math.random() * 2.0 + 1.0,
          color: '#38bdf8',
          life: 1.0,
          decay: 0.015
        });
      }
    }
