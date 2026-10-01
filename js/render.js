// =========================================================================
// CONFIGURACIÓN DE PANTALLA & ESCENA DE PRUEBAS
// =========================================================================
    const canvas = document.getElementById('viewCanvas');
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    ctx.imageSmoothingEnabled = false;

    // Dimensiones internas del escenario de grabación (16:9 o ultra-panorámico móvil)
    let VIEW_W = 1280;
    let VIEW_H = 720;
    let zoom = (window.innerWidth <= 1024 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) ? 1.38 : 1.05;
    let camCurrentX = 640;
    let camCurrentY = 360;

    function resizeCanvas() {
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      const isMobile = (windowW <= 1024) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

      // Si la pantalla es ultra-panorámica móvil (19.5:9 / 20:9), adaptamos VIEW_W para llenar el 100% de la pantalla sin barras negras
      const screenAspect = windowW / windowH;
      if (screenAspect > (16 / 9)) {
        VIEW_H = 720;
        VIEW_W = Math.min(1760, Math.round(720 * screenAspect));
      } else {
        VIEW_H = 720;
        VIEW_W = 1280;
      }

      const aspect = VIEW_W / VIEW_H;
      let targetW = windowW;
      let targetH = windowW / aspect;

      if (targetH > windowH) {
        targetH = windowH;
        targetW = windowH * aspect;
      }

      canvas.width = VIEW_W;
      canvas.height = VIEW_H;
      canvas.style.width = Math.floor(targetW) + 'px';
      canvas.style.height = Math.floor(targetH) + 'px';
      ctx.imageSmoothingEnabled = false;

      if (isMobile && (zoom > 1.5 || zoom < 1.1)) {
        zoom = 1.38;
      }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // =========================================================================
    // RENDERIZADO VISUAL LIMPIO (CERO DISTRACCIONES)
    // =========================================================================
    function render() {
      ctx.fillStyle = '#040814';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      const centerX = 640;
      // Encuadre vertical fluido dinámico:
      // Con suelo en y = 550, groundCamY = 360 mantiene el suelo visible y enmarcado en la base.
      const groundCamY = 360;
      // Con la cima en y = -300 y arena expandida hasta y = -720, topCamY = -340
      // centra perfectamente la plataforma cumbre en pantalla (screenY ~ 420px),
      // dejando al arquero 100% visible con más de 250px despejados bajo el HUD.
      const topCamY = -340;

      // Altura deseada siguiendo el centro del personaje (con suave anticipo):
      const desiredCamY = player.y + player.height / 2 - 30;
      const targetY = Math.max(topCamY, Math.min(groundCamY, desiredCamY));

      // Horizontalmente centrado en 640 para una visión limpia y cinematográfica
      const followWeightX = Math.max(0, Math.min(1, (zoom - 1.0) / 0.6));
      const targetX = centerX * (1 - followWeightX) + (player.x + player.width / 2) * followWeightX;

      camCurrentX += (targetX - camCurrentX) * 0.12;
      // Cámara ágil y suave que anticipa los saltos y ascensos verticales
      const camSpeedY = (player.vy < -2) ? 0.13 : 0.095;
      camCurrentY += (targetY - camCurrentY) * camSpeedY;

      let shakeX = 0;
      let shakeY = 0;
      if (game.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * game.screenShake;
        shakeY = (Math.random() - 0.5) * game.screenShake;
        game.screenShake *= 0.88;
        if (game.screenShake < 0.2) game.screenShake = 0;
      }

      const camX = Math.round(VIEW_W / 2 - camCurrentX * zoom + shakeX);
      const camY = Math.round(VIEW_H / 2 - camCurrentY * zoom + shakeY);

      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(zoom, zoom);

      // 1. CUADRO AZUL OSCURO DE PRUEBA (STAGE ARENA EXPANDIDA)
      drawTestArena();

      // 2. PLATAFORMAS DE PRUEBA MULTICAPA
      drawPlatforms();

      // 3. MUÑECOS DE PRUEBA CON TIRO AL BLANCO (TARGET DUMMIES)
      drawTrainingDummies();

      // 4. ESTELA / CELAJE DE DASH (SILUETA CYAN AISLADA)
      drawDashGhosts();

      // 5. FLECHAS (PROYECTILES COHERENTES)
      drawArrows();

      // 6. PARTÍCULAS Y DESTELLOS DE IMPACTO
      drawParticles();

      // 7. PERSONAJE (ARQUERO 160x160 1:1)
      drawArcher();

      // 8. TEXTOS DE DAÑO FLOTANTES Y ¡DIANA!
      drawDamageTexts();

      ctx.restore();

      // 9. SCREEN-SPACE ARCADE HUD (HIGH-OCTANE MINIGAME INTERFACE)
      drawGameHUD();
    }

    let arenaCachedCanvas = null;
    let arenaCachedWorldId = null;

    function getArenaCacheCanvas() {
      if (arenaCachedCanvas && arenaCachedWorldId === currentWorld.id) {
        return arenaCachedCanvas;
      }
      const arenaW = 1120;
      const arenaH = 1350;
      if (!arenaCachedCanvas) {
        arenaCachedCanvas = document.createElement('canvas');
        arenaCachedCanvas.width = arenaW;
        arenaCachedCanvas.height = arenaH;
      }
      const aCtx = arenaCachedCanvas.getContext('2d', { alpha: true });
      aCtx.imageSmoothingEnabled = false;
      aCtx.clearRect(0, 0, arenaW, arenaH);

      // Fondo temático del bioma actual
      aCtx.fillStyle = currentWorld.themeBg1 || '#0a1329';
      aCtx.fillRect(0, 0, arenaW, arenaH);

      // Cuadrícula técnica sutil adaptada al mundo (pre-renderizada una sola vez)
      aCtx.strokeStyle = currentWorld.gridColor || 'rgba(56, 189, 248, 0.04)';
      aCtx.lineWidth = 1;
      aCtx.beginPath();
      for (let x = 0; x <= arenaW; x += 40) {
        aCtx.moveTo(x, 0);
        aCtx.lineTo(x, arenaH);
      }
      for (let y = 0; y <= arenaH; y += 40) {
        aCtx.moveTo(0, y);
        aCtx.lineTo(arenaW, y);
      }
      aCtx.stroke();

      // Borde del cuadro de juego con resplandor del bioma
      aCtx.strokeStyle = currentWorld.borderColor || 'rgba(56, 189, 248, 0.35)';
      aCtx.lineWidth = 2;
      aCtx.strokeRect(0, 0, arenaW, arenaH);

      // Marcas de esquina del bioma
      const cornerSize = 14;
      aCtx.strokeStyle = currentWorld.cornerColor || '#38bdf8';
      aCtx.lineWidth = 3;

      // TL
      aCtx.beginPath();
      aCtx.moveTo(0, cornerSize); aCtx.lineTo(0, 0); aCtx.lineTo(cornerSize, 0);
      aCtx.stroke();
      // TR
      aCtx.beginPath();
      aCtx.moveTo(arenaW - cornerSize, 0); aCtx.lineTo(arenaW, 0); aCtx.lineTo(arenaW, cornerSize);
      aCtx.stroke();
      // BL
      aCtx.beginPath();
      aCtx.moveTo(0, arenaH - cornerSize); aCtx.lineTo(0, arenaH); aCtx.lineTo(cornerSize, arenaH);
      aCtx.stroke();
      // BR
      aCtx.beginPath();
      aCtx.moveTo(arenaW - cornerSize, arenaH); aCtx.lineTo(arenaW, arenaH); aCtx.lineTo(arenaW, arenaH - cornerSize);
      aCtx.stroke();

      arenaCachedWorldId = currentWorld.id;
      return arenaCachedCanvas;
    }

    function drawTestArena() {
      const arenaX = 80;
      const arenaY = -720;
      ctx.drawImage(getArenaCacheCanvas(), arenaX, arenaY);
    }

    function drawPlatforms() {
      for (const p of platforms) {
        if (p.isSummit) {
          // Plataforma de la Cima (Nivel 6) con estética dorada y cumbre majestuosa
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(p.x, p.y, p.w, p.h);

          // Borde superior luminoso dorado de cumbre
          ctx.fillStyle = '#facc15';
          ctx.fillRect(p.x, p.y, p.w, 3.5);

          // Resplandor celestial
          ctx.strokeStyle = currentWorld.borderColor || 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(p.x, p.y, p.w, p.h);

          // Balizas en los extremos de la cima
          ctx.fillStyle = currentWorld.cornerColor || '#38bdf8';
          ctx.fillRect(p.x - 2, p.y - 10, 5, 10);
          ctx.fillRect(p.x + p.w - 3, p.y - 10, 5, 10);
          ctx.beginPath();
          ctx.arc(p.x, p.y - 12, 3, 0, Math.PI * 2);
          ctx.arc(p.x + p.w, p.y - 12, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();

          // Micro-patrón tecnológico dorado
          ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
          for (let bx = p.x + 16; bx < p.x + p.w - 16; bx += 28) {
            ctx.fillRect(bx, p.y + 6, 12, 2.5);
          }

          // Rótulo técnico de cumbre
          ctx.save();
          ctx.font = "800 8.5px 'JetBrains Mono', monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
          ctx.fillText(p.summitTitle || '▲ APEX SUMMIT • FIRMAMENT ▲', p.x + p.w / 2, p.y + 15);
          ctx.restore();
        } else {
          // Cuerpo de plataforma con tema de bioma actual
          ctx.fillStyle = currentWorld.platformBody || '#101d3b';
          ctx.fillRect(p.x, p.y, p.w, p.h);

          // Borde superior luminoso (suelo de aterrizaje)
          ctx.fillStyle = p.isOneWay ? (currentWorld.platformTop || '#38bdf8') : (currentWorld.platformGroundTop || '#0ea5e9');
          ctx.fillRect(p.x, p.y, p.w, 3);

          // Borde exterior
          ctx.strokeStyle = currentWorld.platformBorder || 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(p.x, p.y, p.w, p.h);

          // Micro-patrón técnico
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          for (let bx = p.x + 12; bx < p.x + p.w - 12; bx += 32) {
            ctx.fillRect(bx, p.y + 6, 12, 2);
          }
        }
      }
    }

    function drawDashGhosts() {
      const runSheet = sheets.run.img;
      if (!runSheet.complete || runSheet.naturalWidth === 0) return;

      const { canvas: offCanvas, ctx: offCtx } = getDashCanvas();

      for (const g of dashGhosts) {
        offCtx.clearRect(0, 0, CELL_W, CELL_H);
        offCtx.drawImage(
          runSheet,
          g.frame * CELL_W, 0, CELL_W, CELL_H,
          0, 0, CELL_W, CELL_H
        );

        // Tinte cyan aislado
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        offCtx.fillRect(0, 0, CELL_W, CELL_H);
        offCtx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = g.alpha * 0.7;
        ctx.translate(g.x + player.width / 2, g.y + player.height);
        ctx.scale(g.facing, 1);
        ctx.drawImage(offCanvas, -ANCHOR_X, -ANCHOR_Y);
        ctx.restore();
      }
    }

    function renderArrowGraphic(arrow) {
      if (arrow.type === 'magic') {
        // Flecha Mágica Azur Radiante (60px) - Halo luminoso ultra-optimizado sin Gaussian blur
        ctx.fillStyle = 'rgba(56, 189, 248, 0.30)';
        ctx.fillRect(-26, -5, 52, 10);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-24, -2.5, 48, 5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-22, -1.5, 46, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-20, -0.75, 42, 1.5);
        // Punta de cristal
        ctx.beginPath();
        ctx.moveTo(24, -5);
        ctx.lineTo(36, 0);
        ctx.lineTo(24, 5);
        ctx.lineTo(27, 0);
        ctx.closePath();
        ctx.fillStyle = '#a5f3fc';
        ctx.fill();
      } else {
        // Flecha Coherente 52px con fletching
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-18, -1.5, 38, 3);
        ctx.fillStyle = '#c68b59';
        ctx.fillRect(-17, -0.75, 36, 1.5);
        // Punta de acero
        ctx.beginPath();
        ctx.moveTo(20, -3.5);
        ctx.lineTo(32, 0);
        ctx.lineTo(20, 3.5);
        ctx.lineTo(22, 0);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        // Fletching cian oscuro
        ctx.beginPath();
        ctx.moveTo(-18, -3.5);
        ctx.lineTo(-10, -0.75);
        ctx.lineTo(-18, 0);
        ctx.closePath();
        ctx.fillStyle = '#0f766e';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-18, 3.5);
        ctx.lineTo(-10, 0.75);
        ctx.lineTo(-18, 0);
        ctx.closePath();
        ctx.fillStyle = '#0f766e';
        ctx.fill();
      }

      // Estela de aire
      if (!arrow.stuck) {
        ctx.fillStyle = arrow.type === 'magic' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(72, 229, 194, 0.35)';
        ctx.fillRect(-38, -1, 16, 2);
      }
    }

    function drawArrows() {
      // Frustum culling para evitar dibujar flechas fuera del encuadre
      const halfW = (VIEW_W / zoom) * 0.55;
      const halfH = (VIEW_H / zoom) * 0.55;
      const minX = camCurrentX - halfW;
      const maxX = camCurrentX + halfW;
      const minY = camCurrentY - halfH;
      const maxY = camCurrentY + halfH;

      for (let i = 0; i < arrows.length; i++) {
        const arrow = arrows[i];
        if (arrow.stuckTo) continue;
        if (arrow.x < minX || arrow.x > maxX || arrow.y < minY || arrow.y > maxY) continue;

        ctx.save();
        ctx.globalAlpha = arrow.alpha !== undefined ? arrow.alpha : 1.0;
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(arrow.angle);
        renderArrowGraphic(arrow);
        ctx.restore();
      }
    }

    function drawParticles() {
      // Frustum culling de partículas: no calcular ni dibujar partículas fuera de pantalla
      const halfW = (VIEW_W / zoom) * 0.55;
      const halfH = (VIEW_H / zoom) * 0.55;
      const minX = camCurrentX - halfW;
      const maxX = camCurrentX + halfW;
      const minY = camCurrentY - halfH;
      const maxY = camCurrentY + halfH;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) continue;

        const alpha = Math.max(0, pt.life);
        if (pt.isRing) {
          ctx.save();
          const baseLW = pt.lineWidth || 2.5;
          // Resplandor exterior de choque sin blur
          ctx.strokeStyle = pt.color;
          ctx.globalAlpha = alpha * 0.35;
          ctx.lineWidth = baseLW + 3;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.stroke();
          // Núcleo nítido
          ctx.globalAlpha = alpha;
          ctx.lineWidth = baseLW;
          ctx.stroke();
          ctx.restore();
        } else if (pt.isDebris) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rot || 0);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
          ctx.restore();
        } else if (pt.isSmoke) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.length) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, pt.length, 2);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    }

    function drawTrainingDummies() {
      for (const dummy of dummies) {
        drawTrainingDummy(dummy);
      }
    }

    function drawTrainingDummy(dummy) {
      ctx.save();
      // Anclar y oscilar alrededor de la base en el suelo
      ctx.translate(dummy.x + dummy.wobbleX, dummy.y);
      ctx.rotate(dummy.angle);

      // Si es Jefe de Mundo: aura majestuosa y escala imponente
      if (dummy.isBoss && !dummy.isDead) {
        ctx.scale(1.24, 1.24);
        const auraPulse = (Math.sin(Date.now() / 140) + 1) * 0.5;
        const auraR = 56 + auraPulse * 10;
        const auraGrad = ctx.createRadialGradient(0, -50, 8, 0, -50, auraR);
        auraGrad.addColorStop(0, 'rgba(250, 204, 21, 0.42)');
        auraGrad.addColorStop(0.65, 'rgba(249, 115, 22, 0.20)');
        auraGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, -50, auraR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. BASE DE MADERA Y SOPORTE CRUZADO (STAND)
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(-22, -6, 44, 6);
      ctx.fillStyle = '#4a2818';
      ctx.fillRect(-20, -5, 40, 4);

      // Remaches de bronce
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-16, -4, 2.5, 2.5);
      ctx.fillRect(13.5, -4, 2.5, 2.5);

      // Puntales diagonales de refuerzo
      ctx.strokeStyle = '#381e11';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(-4, -18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, -4);
      ctx.lineTo(4, -18);
      ctx.stroke();

      // Si el objetivo fue destruido
      if (dummy.isDead) {
        if (game.mode === 'TIME_ATTACK') {
          // En TIME ATTACK queda completamente eliminado hasta el siguiente nivel
          ctx.restore();
          return;
        }

        // Muñón astillado y quemado resultante de la explosión (solo en modo PRACTICE)
        ctx.fillStyle = '#2d1810';
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(-5, -22);
        ctx.lineTo(-3, -27);
        ctx.lineTo(-1, -20);
        ctx.lineTo(1, -26);
        ctx.lineTo(3, -19);
        ctx.lineTo(5, -24);
        ctx.lineTo(5, -6);
        ctx.closePath();
        ctx.fill();

        // Relieve y textura de madera quemada
        ctx.fillStyle = '#4a2818';
        ctx.beginPath();
        ctx.moveTo(-3, -6);
        ctx.lineTo(-3, -23);
        ctx.lineTo(0, -19);
        ctx.lineTo(2, -22);
        ctx.lineTo(3, -6);
        ctx.closePath();
        ctx.fill();

        // Brasas ardientes
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-2, -23, 2, 2);
        ctx.fillRect(1, -25, 2, 2);

        if (game.mode === 'PRACTICE') {
          // Barra flotante de regeneración con cuenta atrás
          ctx.save();
          ctx.rotate(-dummy.angle); // Mantener horizontal

          const regenProgress = Math.max(0, Math.min(1, 1 - (dummy.respawnTimer / 220)));
          const pillY = -48;
          const pillW = 106;
          const pillH = 22;

          ctx.fillStyle = 'rgba(7, 13, 27, 0.92)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-pillW / 2, pillY - pillH / 2, pillW, pillH, 11);
          ctx.fill();
          ctx.stroke();

          // Barra de progreso interior
          const progW = (pillW - 14) * regenProgress;
          ctx.fillStyle = '#0f2942';
          ctx.beginPath();
          ctx.roundRect(-pillW / 2 + 7, pillY + 3.5, pillW - 14, 3.5, 1.75);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(-pillW / 2 + 7, pillY + 3.5, progW, 3.5, 1.75);
          ctx.fill();

          ctx.font = "700 9px 'JetBrains Mono', monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`RESPAWN ${(dummy.respawnTimer / 60).toFixed(1)}s`, 0, pillY - 2);

          ctx.restore();
        }

        ctx.restore();
        return;
      }

      // Rebote elástico si acaba de regenerarse
      if (dummy.respawnScale < 1.0) {
        ctx.scale(dummy.respawnScale, dummy.respawnScale);
      }

      // 2. POSTE PRINCIPAL DE ROBLE (TRUNK)
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(-5, -84, 10, 80);
      ctx.fillStyle = '#54301c';
      ctx.fillRect(-3, -84, 6, 80);

      // Abrazaderas metálicas
      ctx.fillStyle = '#334155';
      ctx.fillRect(-6, -26, 12, 4);
      ctx.fillRect(-6, -74, 12, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, -25, 12, 1.5);
      ctx.fillRect(-6, -73, 12, 1.5);

      // 3. BRAZOS TRANSVERSALES (CROSSBAR)
      ctx.fillStyle = '#3a2012';
      ctx.fillRect(-28, -63, 56, 6);
      ctx.fillStyle = '#54301c';
      ctx.fillRect(-27, -62, 54, 3.5);

      // Vendas de tela en los brazos
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-24, -63, 6, 6);
      ctx.fillRect(18, -63, 6, 6);
      // Flecos de paja en los extremos
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-31, -62, 4, 4);
      ctx.fillRect(27, -62, 4, 4);

      // 4. CUERPO DE PAJA Y ARPILLERA (TORSO)
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(-16, -72);
      ctx.lineTo(16, -72);
      ctx.lineTo(19, -56);
      ctx.lineTo(14, -30);
      ctx.lineTo(-14, -30);
      ctx.lineTo(-19, -56);
      ctx.closePath();
      ctx.fill();

      // Relieve y textura de paja
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-12, -70);
      ctx.lineTo(12, -70);
      ctx.lineTo(15, -56);
      ctx.lineTo(10, -32);
      ctx.lineTo(-10, -32);
      ctx.lineTo(-15, -56);
      ctx.closePath();
      ctx.fill();

      // Cuerdas de amarre en la cintura
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, -34);
      ctx.lineTo(15, -34);
      ctx.moveTo(-17, -42);
      ctx.lineTo(17, -42);
      ctx.stroke();

      // Costuras 'X' decorativas
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-11, -66); ctx.lineTo(-7, -62);
      ctx.moveTo(-7, -66); ctx.lineTo(-11, -62);
      ctx.moveTo(7, -66); ctx.lineTo(11, -62);
      ctx.moveTo(11, -66); ctx.lineTo(7, -62);
      ctx.stroke();

      // 5. CABEZA DEL MUÑECO CON CINTA MARCIAL
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(0, -82, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(-1, -83, 9, 0, Math.PI * 2);
      ctx.fill();

      // Moño / mechón de paja superior
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-3, -92);
      ctx.lineTo(0, -99);
      ctx.lineTo(3, -92);
      ctx.closePath();
      ctx.fill();

      // Cinta roja marcial
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-11, -84, 22, 4);
      ctx.beginPath();
      ctx.moveTo(10, -83);
      ctx.lineTo(19, -86);
      ctx.lineTo(18, -82);
      ctx.lineTo(11, -81);
      ctx.closePath();
      ctx.fill();

      // Ojos bordados 'X'
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -83); ctx.lineTo(-2, -80);
      ctx.moveTo(-2, -83); ctx.lineTo(-5, -80);
      ctx.moveTo(2, -83);  ctx.lineTo(5, -80);
      ctx.moveTo(5, -83);  ctx.lineTo(2, -80);
      ctx.stroke();

      // 6. LA DIANA / TIRO AL BLANCO (CENTRADO EXACTO EN Y: -56)
      const targetY = -56;

      // Base circular de madera / escudo
      ctx.beginPath();
      ctx.arc(0, targetY, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#3a1f11';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Remaches dorados
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const rx = Math.cos(a) * 23.5;
        const ry = targetY + Math.sin(a) * 23.5;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }

      // Anillo 1 (Blanco Marfil, r: 21)
      ctx.beginPath();
      ctx.arc(0, targetY, 21, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Anillo 2 (Azul Marino Profundo, r: 16)
      ctx.beginPath();
      ctx.arc(0, targetY, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Anillo 3 (Rojo Carmesí Intenso, r: 11)
      ctx.beginPath();
      ctx.arc(0, targetY, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Anillo 4 (Dorado Brillante, r: 6)
      ctx.beginPath();
      ctx.arc(0, targetY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();

      // Diana Central / Bullseye ("El Punto Rojo Central", r: 2.5)
      ctx.beginPath();
      ctx.arc(0, targetY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Ticks de mira en cruz
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-16, targetY); ctx.lineTo(-12, targetY);
      ctx.moveTo(12, targetY);  ctx.lineTo(16, targetY);
      ctx.moveTo(0, targetY - 16); ctx.lineTo(0, targetY - 12);
      ctx.moveTo(0, targetY + 12); ctx.lineTo(0, targetY + 16);
      ctx.stroke();

      // 7. CRISP IMPACT FLASH (SUBTLE, REFINED INNER GLEAM - NO OVERSIZED RINGS)
      if (dummy.hitFlash > 0.05) {
        ctx.save();
        // Destello nítido sobre el anillo central de la diana
        ctx.strokeStyle = `rgba(255, 255, 255, ${dummy.hitFlash * 0.95})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, targetY, 11, 0, Math.PI * 2);
        ctx.stroke();

        // Núcleo áureo sutil
        ctx.fillStyle = `rgba(251, 191, 36, ${dummy.hitFlash * 0.4})`;
        ctx.beginPath();
        ctx.arc(0, targetY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. FLECHAS CLAVADAS EN ESTE MUÑECO (SE BALANCEAN EN TIEMPO REAL CON ÉL)
      for (const arrow of arrows) {
        if (arrow.stuckTo === dummy) {
          ctx.save();
          ctx.globalAlpha = arrow.alpha !== undefined ? arrow.alpha : 1.0;
          ctx.translate(arrow.stuckOffsetX, arrow.stuckOffsetY);
          ctx.rotate(arrow.stuckAngle);
          renderArrowGraphic(arrow);
          ctx.restore();
        }
      }

      // 9. BARRA DE VIDA Y MARCADOR SOBRE LA CABEZA (SIEMPRE HORIZONTAL)
      ctx.save();
      // Anular rotación para mantener la barra horizontal y perfectamente legible
      ctx.rotate(-dummy.angle);

      const isBoss = dummy.isBoss;
      const barY = isBoss ? -122 : -112;
      const barW = isBoss ? 132 : 86;
      const barH = isBoss ? 9 : 7;
      const hpPct = Math.max(0, Math.min(1, dummy.hp / dummy.maxHp));
      const lagPct = Math.max(0, Math.min(1, dummy.hpLag / dummy.maxHp));

      // 9.1 Name & hits indicator above the health bar
      ctx.font = isBoss ? "900 11px 'Cinzel', serif" : "700 9.5px 'Outfit', -apple-system, sans-serif";
      ctx.textAlign = 'center';
      const nameText = isBoss ? `👑 ${dummy.bossTitle}` : (dummy.hits > 0 ? `TARGET • ${dummy.hits} HITS` : 'TARGET');
      ctx.fillStyle = isBoss ? '#facc15' : (dummy.hits > 0 ? '#38bdf8' : '#94a3b8');
      ctx.fillText(nameText, 0, barY - 6.5);

      // 9.2 Marco exterior oscuro de la barra de vida
      ctx.fillStyle = 'rgba(7, 13, 27, 0.94)';
      ctx.strokeStyle = isBoss ? '#facc15' : 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = isBoss ? 1.8 : 1;
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW, barH, 4);
      ctx.fill();
      ctx.stroke();

      // 9.3 Barra de daño residual / lag (rojo)
      if (lagPct > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(-barW / 2 + 1, barY + 1, (barW - 2) * lagPct, barH - 2, 3);
        ctx.fill();
      }

      // 9.4 Barra de vida actual (Verde esmeralda -> Ámbar -> Rojo)
      if (hpPct > 0) {
        let hpGradient = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
        if (hpPct > 0.5) {
          hpGradient.addColorStop(0, '#22c55e');
          hpGradient.addColorStop(1, '#16a34a');
        } else if (hpPct > 0.25) {
          hpGradient.addColorStop(0, '#fbbf24');
          hpGradient.addColorStop(1, '#d97706');
        } else {
          hpGradient.addColorStop(0, '#f87171');
          hpGradient.addColorStop(1, '#dc2626');
        }
        ctx.fillStyle = hpGradient;
        ctx.beginPath();
        ctx.roundRect(-barW / 2 + 1, barY + 1, (barW - 2) * hpPct, barH - 2, 3);
        ctx.fill();

        // Brillo superior de cristal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(-barW / 2 + 1, barY + 1, (barW - 2) * hpPct, 1.5);
      }

      // 9.5 Texto numérico de vida (ej: 850 / 1000)
      ctx.font = "700 8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${Math.ceil(dummy.hp)} / ${dummy.maxHp}`, 0, barY + barH + 9.5);

      ctx.restore();

      ctx.restore();
    }

    function drawDamageTexts() {
      for (const dt of damageTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, dt.life);
        ctx.font = dt.isBullseye 
          ? "800 13px 'JetBrains Mono', monospace" 
          : (dt.isCrit ? "800 12.5px 'JetBrains Mono', monospace" : "700 11.5px 'JetBrains Mono', monospace");
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#050a17';
        ctx.strokeText(dt.text, dt.x, dt.y);

        ctx.fillStyle = dt.color;
        ctx.fillText(dt.text, dt.x, dt.y);
        ctx.restore();
      }
    }



    function drawArcher() {
      let sheetObj = sheets.idle;
      let frameIndex = 0;

      // Prioridad máxima: NINGUNA animación de ataque puede ser interrumpida visualmente
      if (player.attackType === 'magic') {
        sheetObj = sheets.magic_arrow;
        frameIndex = Math.min(sheets.magic_arrow.frames - 1, player.attackTick);
      } else if (player.attackType === 'triple') {
        sheetObj = sheets.triple_shoot;
        frameIndex = Math.min(sheets.triple_shoot.frames - 1, player.attackTick);
      } else if (player.attackType === 'basic') {
        // Disparo Básico: 62 frames acelerados para durar exactamente lo mismo que Triple y Mágico (28 ticks = ~0.47 s)
        sheetObj = sheets.basic_shoot;
        frameIndex = Math.min(sheets.basic_shoot.frames - 1, Math.floor((player.attackTick / 27) * (sheets.basic_shoot.frames - 1)));
      } else if (player.isDashing) {
        sheetObj = sheets.run;
        frameIndex = 10;
      } else if (player.isDoubleJumping) {
        sheetObj = sheets.double_jump;
        frameIndex = Math.min(sheets.double_jump.frames - 1, player.doubleJumpFrame);
      } else if (!player.isGrounded) {
        sheetObj = sheets.jump;
        frameIndex = Math.min(sheets.jump.frames - 1, Math.floor(player.airTimer * 0.85));
      } else if (Math.abs(player.vx) > 0.5) {
        sheetObj = sheets.run;
        frameIndex = Math.floor(player.runAnimTimer * 0.45) % sheets.run.frames;
      } else {
        sheetObj = sheets.idle;
        frameIndex = Math.floor(Date.now() / (1000 / 24)) % sheets.idle.frames;
      }

      const img = sheetObj.img;
      if (!img.complete || img.naturalWidth === 0) return;

      ctx.save();
      // Anclar exactamente en la base de los pies (ANCHOR_X=80, ANCHOR_Y=142)
      ctx.translate(player.x + player.width / 2, player.y + player.height);
      ctx.scale(player.facing, 1);

      // Compensación anatómica para magic_arrow (+18px para que los pies queden en X=83 idéntico a idle y basic_shoot)
      const drawOffsetX = (player.attackType === 'magic') ? (-ANCHOR_X + 18) : -ANCHOR_X;

      ctx.drawImage(
        img,
        frameIndex * CELL_W, 0, CELL_W, CELL_H,
        drawOffsetX, -ANCHOR_Y, CELL_W, CELL_H
      );

      ctx.restore();
    }

    // =========================================================================
    // SCREEN-SPACE ARCADE HUD (HIGH-OCTANE TIME ATTACK & MINIGAME INTERFACE)
    // =========================================================================
    function drawGameHUD() {
      // 1. EMERGENCY LOW-TIME VIGNETTE ALERT (<= 5.0 SECONDS)
      if (game.mode === 'TIME_ATTACK' && game.state === 'PLAYING' && game.timeLeft <= 5.0) {
        const pulse = (Math.sin(Date.now() / 90) + 1) * 0.5;
        const alertAlpha = 0.12 + pulse * 0.22;
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${alertAlpha * 0.45})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.strokeStyle = `rgba(239, 68, 68, ${alertAlpha})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - 4);
        ctx.restore();
      }

      // Si la partida está en la pantalla de inicio, no dibujar HUD ni modales
      if (game.state === 'START_SCREEN') {
        return;
      }

      // 2. TOP HEADER HUD CARDS
      const topY = 16;
      const cardH = 62;

      // 2.1 LEFT CARD: WORLD, STAGE & TARGETS REMAINING
      const leftW = 320;
      ctx.save();
      ctx.fillStyle = 'rgba(6, 12, 26, 0.90)';
      ctx.strokeStyle = currentWorld.cornerColor || 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(24, topY, leftW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      if (game.mode === 'TIME_ATTACK') {
        const stageCfg = STAGE_CONFIGS[game.currentStage - 1] || STAGE_CONFIGS[0];
        
        // Stage tag with World indicator & DEMO tag
        ctx.font = "800 12px 'Cinzel', serif";
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'left';
        ctx.fillText(`W${currentWorld.id} • STG ${game.currentStage}/${game.totalStages}`, 36, topY + 22);

        // DEMO Badge
        ctx.font = "800 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText('DEMO BUILD', 24 + leftW - 14, topY + 22);

        // Subtitle / Boss badge
        ctx.textAlign = 'left';
        ctx.font = "700 10.5px 'Outfit', sans-serif";
        ctx.fillStyle = stageCfg.isBoss ? '#f59e0b' : (currentWorld.platformTop || '#38bdf8');
        const titleBadge = stageCfg.isBoss ? `👑 ${stageCfg.title}` : stageCfg.title;
        ctx.fillText(titleBadge, 150, topY + 22);

        // Target Status Indicators
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`TARGETS:`, 36, topY + 46);

        // Draw Target Pips
        const total = game.stageTargetsTotal;
        const destroyed = total - game.stageTargetsRemaining;
        for (let i = 0; i < total; i++) {
          const pipX = 104 + i * 20;
          const pipY = topY + 43;
          const isDone = i < destroyed;
          const isBossPip = stageCfg.isBoss && (i === 0);

          ctx.beginPath();
          ctx.arc(pipX, pipY, isBossPip ? 7.5 : 5.5, 0, Math.PI * 2);
          if (isDone) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // Tiny cross
            ctx.beginPath();
            ctx.moveTo(pipX - 2.5, pipY - 2.5); ctx.lineTo(pipX + 2.5, pipY + 2.5);
            ctx.moveTo(pipX + 2.5, pipY - 2.5); ctx.lineTo(pipX - 2.5, pipY + 2.5);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          } else {
            ctx.fillStyle = isBossPip ? '#ef4444' : '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = isBossPip ? '#facc15' : '#f59e0b';
            ctx.lineWidth = isBossPip ? 2.0 : 1.4;
            ctx.stroke();
            // Bullseye center dot
            ctx.beginPath();
            ctx.arc(pipX, pipY, 2, 0, Math.PI * 2);
            ctx.fillStyle = isBossPip ? '#facc15' : '#ef4444';
            ctx.fill();
          }
        }

        // Remaining counter text
        ctx.font = "700 11px 'Outfit', sans-serif";
        ctx.fillStyle = game.stageTargetsRemaining > 0 ? '#f8fafc' : '#4ade80';
        ctx.fillText(`${game.stageTargetsRemaining} LEFT`, 104 + total * 20 + 8, topY + 47);
      } else {
        // Practice Mode Header
        ctx.font = "800 13px 'Cinzel', serif";
        ctx.fillStyle = currentWorld.cornerColor || '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(`PRACTICE: WORLD ${currentWorld.id}`, 38, topY + 24);

        ctx.font = "600 11px 'Outfit', sans-serif";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${currentWorld.name} • INFINITE RESPAWNS`, 38, topY + 46);
      }
      ctx.restore();

      // 2.2 CENTER CARD: HIGH-INTENSITY COUNTDOWN TIMER
      const timerW = 260;
      const timerX = VIEW_W / 2 - timerW / 2;
      const isUrgent = (game.mode === 'TIME_ATTACK' && game.timeLeft <= 5.0 && game.state === 'PLAYING');
      const urgentPulse = isUrgent ? (1.0 + 0.05 * Math.sin(Date.now() / 70)) : 1.0;

      ctx.save();
      ctx.translate(VIEW_W / 2, topY + cardH / 2);
      ctx.scale(urgentPulse, urgentPulse);
      ctx.translate(-VIEW_W / 2, -(topY + cardH / 2));

      ctx.fillStyle = 'rgba(6, 12, 26, 0.94)';
      ctx.beginPath();
      ctx.roundRect(timerX, topY, timerW, cardH, 12);
      ctx.fill();

      // Borde de alerta optimizado (doble trazo sin Gaussian blur)
      if (isUrgent) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Timer title
      ctx.font = "800 9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = isUrgent ? '#ef4444' : '#38bdf8';
      ctx.fillText(game.mode === 'TIME_ATTACK' ? (isUrgent ? 'CRITICAL TIME' : 'TIME REMAINING') : 'TRAINING MODE', VIEW_W / 2, topY + 18);

      // Digital Clock Readout
      if (game.mode === 'TIME_ATTACK') {
        const totalSec = Math.max(0, game.timeLeft);
        const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const ss = Math.floor(totalSec % 60).toString().padStart(2, '0');
        const tenths = Math.floor((totalSec * 10) % 10);
        const clockStr = `${mm}:${ss}.${tenths}`;

        ctx.font = "900 29px 'JetBrains Mono', monospace";
        ctx.fillStyle = isUrgent ? '#ef4444' : '#f8fafc';
        ctx.fillText(clockStr, VIEW_W / 2, topY + 49);
      } else {
        ctx.font = "800 24px 'Outfit', sans-serif";
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('∞ NO LIMIT', VIEW_W / 2, topY + 48);
      }
      ctx.restore();

      // 2.3 RIGHT CARD: SCORE & COMBO MULTIPLIER
      const isMobile = (typeof touchControlsVisible !== 'undefined' && touchControlsVisible) || (window.innerWidth <= 1024);
      const rightW = isMobile ? 185 : 230;

      // Cálculo de despeje dinámico para los botones HTML superiores (DISCORD y SETTINGS)
      // para evitar CUALQUIER solapamiento en cualquier dispositivo o resolución
      let topBarOffset = isMobile ? 360 : 210;
      const topBarEl = document.getElementById('mobileTopBar');
      if (topBarEl && canvas) {
        const topBarRect = topBarEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        if (canvasRect.width > 0 && topBarRect.width > 0) {
          const scale = VIEW_W / canvasRect.width;
          const pxFromCanvasRight = (canvasRect.right - topBarRect.left) * scale;
          if (pxFromCanvasRight > 0) {
            topBarOffset = Math.ceil(pxFromCanvasRight + (isMobile ? 18 : 14));
          } else {
            topBarOffset = 24;
          }
        }
      }

      // El Score Card se posiciona siempre a la izquierda de la barra de botones
      let rightX = VIEW_W - topBarOffset - rightW;

      // Salvaguarda: mantener siempre al menos 14px de separación con el temporizador central
      const timerRightEdge = (VIEW_W / 2 + 130);
      if (rightX < timerRightEdge + 14) {
        rightX = timerRightEdge + 14;
      }

      ctx.save();
      ctx.fillStyle = 'rgba(6, 12, 26, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightX, topY, rightW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      // Score row
      ctx.font = isMobile ? "700 8.5px 'JetBrains Mono', monospace" : "700 9.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE', rightX + 10, topY + 22);

      ctx.font = isMobile ? "900 14px 'JetBrains Mono', monospace" : "900 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(game.displayScore.toLocaleString(), rightX + (isMobile ? 48 : 54), topY + 23);

      // Best score tag (alineado al extremo derecho de la tarjeta sin estorbar)
      ctx.font = isMobile ? "700 8.5px 'JetBrains Mono', monospace" : "700 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = '#eab308';
      ctx.textAlign = 'right';
      ctx.fillText(`BEST ${game.highScore.toLocaleString()}`, rightX + rightW - 10, topY + 22);

      // Combo row
      if (game.combo > 1) {
        const mult = Math.min(5, game.combo);
        ctx.font = isMobile ? "800 11px 'Outfit', sans-serif" : "800 12px 'Outfit', sans-serif";
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'left';
        ctx.fillText(`COMBO x${mult}`, rightX + 10, topY + 47);

        // Combo decay bar
        const barX = rightX + (isMobile ? 74 : 86);
        const barY = topY + 40;
        const barW = rightW - (isMobile ? 84 : 98);
        const barH = 7;
        const pct = Math.max(0, Math.min(1, game.comboTimer / 210));

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3.5);
        ctx.fill();

        let comboGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        comboGrad.addColorStop(0, '#f59e0b');
        comboGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = comboGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * pct, barH, 3.5);
        ctx.fill();
      } else {
        ctx.font = isMobile ? "600 8.5px 'Outfit', sans-serif" : "600 9.5px 'Outfit', sans-serif";
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(isMobile ? 'COMBO BONUS (UP TO 5X)' : 'CHAIN KILLS FOR COMBO BONUS (UP TO 5X)', rightX + 10, topY + 47);
      }
      ctx.restore();

      // 2.5 DYNAMIC WORLD TRANSITION BANNER
      if (game.worldBannerTimer > 0) {
        let wbAlpha = 1.0;
        if (game.worldBannerTimer > 115) {
          wbAlpha = (140 - game.worldBannerTimer) / 25;
        } else if (game.worldBannerTimer < 25) {
          wbAlpha = game.worldBannerTimer / 25;
        }
        wbAlpha = Math.max(0, Math.min(1, wbAlpha));

        const wbW = 620;
        const wbH = 92;
        const wbX = VIEW_W / 2 - wbW / 2;
        const wbY = 100;

        ctx.save();
        ctx.globalAlpha = wbAlpha;
        ctx.fillStyle = 'rgba(5, 10, 22, 0.95)';
        ctx.beginPath();
        ctx.roundRect(wbX, wbY, wbW, wbH, 16);
        ctx.fill();

        // Resplandor de borde optimizado sin Gaussian blur
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = currentWorld.cornerColor || '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = "900 28px 'Cinzel', serif";
        ctx.fillStyle = currentWorld.cornerColor || '#facc15';
        ctx.fillText(game.worldBannerTitle, VIEW_W / 2, wbY + 40);

        ctx.font = "700 12.5px 'Outfit', sans-serif";
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(game.worldBannerSub, VIEW_W / 2, wbY + 68);
        ctx.restore();
      }

      // 3. DYNAMIC STAGE BANNER (DROPS IN AT STAGE START)
      if (game.stageBannerTimer > 0) {
        let bAlpha = 1.0;
        if (game.stageBannerTimer > 90) {
          bAlpha = (110 - game.stageBannerTimer) / 20; // Fade in
        } else if (game.stageBannerTimer < 25) {
          bAlpha = game.stageBannerTimer / 25; // Fade out
        }
        bAlpha = Math.max(0, Math.min(1, bAlpha));

        const bW = 560;
        const bH = 88;
        const bX = VIEW_W / 2 - bW / 2;
        const bY = 220;

        ctx.save();
        ctx.globalAlpha = bAlpha;
        ctx.fillStyle = 'rgba(7, 13, 27, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 14);
        ctx.fill();

        // Resplandor de borde suave sin coste de blur
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.30)';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = "900 28px 'Cinzel', serif";
        ctx.fillStyle = '#facc15';
        ctx.fillText(game.stageBannerText, VIEW_W / 2, bY + 38);

        ctx.font = "700 13px 'Outfit', sans-serif";
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(game.stageBannerSub, VIEW_W / 2, bY + 65);
        ctx.restore();
      }

      // 4. STAGE CLEARED BANNER
      if (game.state === 'STAGE_CLEAR') {
        const cW = 580;
        const cH = 100;
        const cX = VIEW_W / 2 - cW / 2;
        const cY = 210;

        ctx.save();
        ctx.fillStyle = 'rgba(6, 26, 17, 0.94)';
        ctx.beginPath();
        ctx.roundRect(cX, cY, cW, cH, 14);
        ctx.fill();

        // Resplandor verde esmeralda de victoria sin blur
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = "900 32px 'Cinzel', serif";
        ctx.fillStyle = '#4ade80';
        ctx.fillText('STAGE CLEARED!', VIEW_W / 2, cY + 40);

        ctx.font = "800 14px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#facc15';
        ctx.fillText(`TIME BONUS: +${game.clearBonusScore.toLocaleString()} PTS`, VIEW_W / 2, cY + 68);

        ctx.font = "700 12px 'Outfit', sans-serif";
        ctx.fillStyle = '#38bdf8';
        const nextText = (game.currentStage < game.totalStages) 
          ? `ADVANCING TO STAGE ${game.currentStage + 1}...` 
          : 'COMPLETING FINAL RESULTS...';
        ctx.fillText(nextText, VIEW_W / 2, cY + 88);
        ctx.restore();
      }

      // 5. GAME OVER MODAL (TIME'S UP)
      if (game.state === 'GAME_OVER') {
        ctx.save();
        // Translucent dark veil
        ctx.fillStyle = 'rgba(4, 7, 18, 0.82)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        const mW = 520;
        const mH = 370;
        const mX = VIEW_W / 2 - mW / 2;
        const mY = VIEW_H / 2 - mH / 2;

        ctx.fillStyle = 'rgba(7, 13, 27, 0.96)';
        ctx.beginPath();
        ctx.roundRect(mX, mY, mW, mH, 16);
        ctx.fill();

        // Resplandor carmesí optimizado sin blur
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = "900 42px 'Cinzel', serif";
        ctx.fillStyle = '#ef4444';
        ctx.fillText("TIME'S UP!", VIEW_W / 2, mY + 56);

        ctx.font = "700 13px 'Outfit', sans-serif";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('TIME ATTACK TRIAL ENDED • DEMO BUILD', VIEW_W / 2, mY + 84);

        // Stats Box
        const sBoxY = mY + 104;
        const sBoxW = mW - 60;
        const sBoxX = VIEW_W / 2 - sBoxW / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(sBoxX, sBoxY, sBoxW, 160, 10);
        ctx.fill();
        ctx.stroke();

        const rowY1 = sBoxY + 34;
        const rowY2 = sBoxY + 70;
        const rowY3 = sBoxY + 106;
        const rowY4 = sBoxY + 142;

        ctx.font = "600 13px 'Outfit', sans-serif";
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('STAGE REACHED:', sBoxX + 24, rowY1);
        ctx.fillText('FINAL SCORE:', sBoxX + 24, rowY2);
        ctx.fillText('TARGETS DESTROYED:', sBoxX + 24, rowY3);
        ctx.fillText('MAX COMBO STREAK:', sBoxX + 24, rowY4);

        ctx.textAlign = 'right';
        ctx.font = "800 13.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`STAGE ${game.currentStage} / ${game.totalStages}`, sBoxX + sBoxW - 24, rowY1);

        ctx.fillStyle = '#facc15';
        ctx.font = "900 17px 'JetBrains Mono', monospace";
        ctx.fillText(game.score.toLocaleString(), sBoxX + sBoxW - 24, rowY2);

        ctx.font = "800 14px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(game.totalTargetsDestroyed.toString(), sBoxX + sBoxW - 24, rowY3);

        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`x${game.maxCombo}`, sBoxX + sBoxW - 24, rowY4);

        // Action prompt
        ctx.textAlign = 'center';
        ctx.font = "800 15px 'Outfit', sans-serif";
        ctx.fillStyle = '#f8fafc';
        ctx.fillText('[ PRESS SPACE OR CLICK TO RETRY ]', VIEW_W / 2, mY + 300);

        ctx.font = "600 12px 'Outfit', sans-serif";
        ctx.fillStyle = '#64748b';
        ctx.fillText('[ PRESS P FOR PRACTICE MODE ]', VIEW_W / 2, mY + 328);
        ctx.restore();
      }

      // 6. VICTORY MODAL (ALL 5 STAGES CLEARED)
      if (game.state === 'VICTORY') {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 7, 18, 0.85)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        const vW = 540;
        const vH = 390;
        const vX = VIEW_W / 2 - vW / 2;
        const vY = VIEW_H / 2 - vH / 2;

        ctx.fillStyle = 'rgba(7, 13, 27, 0.96)';
        ctx.beginPath();
        ctx.roundRect(vX, vY, vW, vH, 16);
        ctx.fill();

        // Resplandor áureo triunfal sin blur
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.font = "900 44px 'Cinzel', serif";
        ctx.fillStyle = '#facc15';
        ctx.fillText('VICTORY!', VIEW_W / 2, vY + 58);

        ctx.font = "800 14px 'Outfit', sans-serif";
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('ALL 50 STAGES & 5 WORLDS CONQUERED • OFFICIAL DEMO COMPLETED', VIEW_W / 2, vY + 88);

        // Stats Box
        const vsBoxY = vY + 108;
        const vsBoxW = vW - 60;
        const vsBoxX = VIEW_W / 2 - vsBoxW / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.beginPath();
        ctx.roundRect(vsBoxX, vsBoxY, vsBoxW, 172, 10);
        ctx.fill();
        ctx.stroke();

        let rankTitle = 'RANK A • MASTER';
        let rankColor = '#4ade80';
        if (game.score >= 16000) {
          rankTitle = 'RANK S • SUPREME ARCHER';
          rankColor = '#facc15';
        } else if (game.score < 10000) {
          rankTitle = 'RANK B • SKILLED';
          rankColor = '#38bdf8';
        }

        const vy1 = vsBoxY + 34;
        const vy2 = vsBoxY + 70;
        const vy3 = vsBoxY + 106;
        const vy4 = vsBoxY + 144;

        ctx.font = "600 13px 'Outfit', sans-serif";
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('EVALUATION RANK:', vsBoxX + 24, vy1);
        ctx.fillText('TOTAL SCORE:', vsBoxX + 24, vy2);
        ctx.fillText('TARGETS DESTROYED:', vsBoxX + 24, vy3);
        ctx.fillText('TIME REMAINING:', vsBoxX + 24, vy4);

        ctx.textAlign = 'right';
        ctx.font = "900 15px 'Cinzel', serif";
        ctx.fillStyle = rankColor;
        ctx.fillText(rankTitle, vsBoxX + vsBoxW - 24, vy1);

        ctx.fillStyle = '#facc15';
        ctx.font = "900 18px 'JetBrains Mono', monospace";
        ctx.fillText(game.score.toLocaleString(), vsBoxX + vsBoxW - 24, vy2);

        ctx.font = "800 14px 'JetBrains Mono', monospace";
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(game.totalTargetsDestroyed.toString(), vsBoxX + vsBoxW - 24, vy3);

        ctx.fillStyle = '#4ade80';
        ctx.fillText(`${game.timeLeft.toFixed(1)}s`, vsBoxX + vsBoxW - 24, vy4);

        // Action prompt
        ctx.textAlign = 'center';
        ctx.font = "800 15px 'Outfit', sans-serif";
        ctx.fillStyle = '#f8fafc';
        ctx.fillText('[ PRESS SPACE OR CLICK TO PLAY AGAIN ]', VIEW_W / 2, vY + 318);

        ctx.font = "600 12px 'Outfit', sans-serif";
        ctx.fillStyle = '#64748b';
        ctx.fillText('[ PRESS P FOR PRACTICE MODE ]', VIEW_W / 2, vY + 346);
        ctx.restore();
      }

      // 7. BOTTOM CONTROLS HINT BAR (Solo en escritorio para mantener el móvil 100% limpio y cinematográfico)
      if (!touchControlsVisible) {
        const barBottomY = VIEW_H - 24;
        ctx.save();
        ctx.font = "600 10.5px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.fillText('[A/D] MOVE  •  [SPACE] JUMP / DROP (S+SPACE)  •  [1/2/3] ATTACK  •  [ESC] PAUSE  •  [N/B] STAGE  •  [SHIFT+1..5] MAP  •  [M] BGM  •  [R] RESTART', VIEW_W / 2, barBottomY);
        ctx.restore();
      }
    }
