const keys = {};


    function startGameFromTitle() {
      const startScreen = document.getElementById('startScreen');
      if (startScreen && !startScreen.classList.contains('hidden')) {
        startScreen.classList.add('hidden');
      }
      unlockAudio();

      // Iniciar automáticamente en pantalla grande / Fullscreen en móviles
      try {
        const isMobile = window.innerWidth <= 1024 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isMobile) {
          const doc = document;
          const elem = doc.documentElement;
          if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
            if (elem.requestFullscreen) {
              elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
              elem.webkitRequestFullscreen();
            }
          }
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
          // Zoom equilibrado (1.38x) en móvil para ver al personaje y el entorno
          zoom = 1.38;
        }
      } catch (e) {}

      if (game.state === 'START_SCREEN') {
        startMinigame();
      }
      const tc = document.getElementById('touchControls');
      if (tc && touchControlsVisible) {
        tc.classList.add('visible');
      }
    }

    window.addEventListener('keydown', e => {
      unlockAudio();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Tecla Escape: alternar Pausa y Configuración con música de fondo activa
      if (e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        const modal = document.getElementById('settingsModal');
        if (modal && !modal.classList.contains('hidden')) {
          if (window.closeSettingsModal) window.closeSettingsModal();
        } else if (game.state === 'PLAYING') {
          if (window.openSettingsModal) window.openSettingsModal();
        }
        return;
      }

      // Si está en la pantalla de inicio, iniciar inmediatamente
      if (game.state === 'START_SCREEN') {
        startGameFromTitle();
        return;
      }

      // Si la partida está en GAME OVER / TIME'S UP o VICTORIA, bloquear totalmente las acciones y solo permitir reiniciar
      if (game.state === 'GAME_OVER' || game.state === 'VICTORY') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
          startMinigame();
        } else if (e.code === 'KeyP') {
          toggleGameMode();
        } else if (e.code === 'KeyM') {
          toggleBGM();
        }
        return;
      }

      keys[e.code] = true;

      // Bajar de plataformas elevadas (S, Abajo, S + Espacio o Abajo + Espacio)
      const isDownKey = (e.code === 'KeyS' || e.code === 'ArrowDown');
      const isJumpKey = (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp');
      const hasDownHeld = (keys['KeyS'] || keys['ArrowDown']);

      if ((isDownKey && player.isGrounded && player.y + player.height < 540) ||
          (hasDownHeld && isJumpKey) ||
          (isDownKey && (keys['Space'] || keys['KeyW'] || keys['ArrowUp']))) {
        triggerDrop();
        return;
      }

      // Salto y Doble Salto Potente
      if (isJumpKey) {
        triggerJump();
      }

      // Dash (Shift o Z)
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyZ') {
        triggerDash();
      }

      // Atajos de navegación de fases y mundos (N: Siguiente, B: Anterior, Shift+1..5: Saltar de Mundo)
      if (e.code === 'KeyN') {
        if (game.currentStage < game.totalStages) {
          loadStage(game.currentStage + 1);
          game.state = 'PLAYING';
          resetPlayer(false);
        }
        return;
      }
      if (e.code === 'KeyB') {
        if (game.currentStage > 1) {
          loadStage(game.currentStage - 1);
          game.state = 'PLAYING';
          resetPlayer(false);
        }
        return;
      }
      if (e.shiftKey && ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const wNum = parseInt(e.code.replace('Digit', ''), 10);
        const targetStage = (wNum - 1) * 10 + 1;
        loadStage(targetStage);
        game.state = 'PLAYING';
        resetPlayer(false);
        return;
      }

      // Alternar Música de Fondo ON / OFF (M)
      if (e.code === 'KeyM') {
        toggleBGM();
        return;
      }

      // Habilidades de Ataque (1, 2, 3 o X, C, V)
      if (!e.shiftKey && (e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'KeyX' || e.code === 'KeyJ')) {
        triggerShoot('basic');
      }
      if (!e.shiftKey && (e.code === 'Digit2' || e.code === 'Numpad2' || e.code === 'KeyC')) {
        triggerShoot('triple');
      }
      if (!e.shiftKey && (e.code === 'Digit3' || e.code === 'Numpad3' || e.code === 'KeyV')) {
        triggerShoot('magic');
      }

      // Reiniciar al centro (R) y resetear partida
      if (e.code === 'KeyR') {
        resetPlayer(true);
        return;
      }

      // Alternar Modo Time Attack / Practice (P)
      if (e.code === 'KeyP') {
        toggleGameMode();
        return;
      }

      // Reintentar si se terminó la partida o se ganó (Espacio / Enter)
      if ((game.state === 'GAME_OVER' || game.state === 'VICTORY') && (e.code === 'Space' || e.code === 'Enter')) {
        startMinigame();
        return;
      }

      // Zoom dinámico (+ / - / 0)
      if (e.code === 'Equal' || e.code === 'NumpadAdd') zoom = Math.min(2.2, zoom + 0.1);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoom = Math.max(0.75, zoom - 0.1);
      if (e.code === 'Digit0' || e.code === 'Numpad0') zoom = touchControlsVisible ? 1.20 : 1.0;
    });

    window.addEventListener('keyup', e => {
      keys[e.code] = false;
      // Salto de altura variable sólo en salto inicial; el doble salto conserva su impulso acrobático completo
      if ((e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') && player.vy < -4 && !player.isDoubleJumping) {
        player.vy *= 0.60;
      }
    });

    window.addEventListener('mousedown', e => {
      unlockAudio();
      if (game.state === 'START_SCREEN') {
        startGameFromTitle();
        return;
      }
      if (game.state === 'GAME_OVER' || game.state === 'VICTORY') {
        startMinigame();
        return;
      }
      if (game.state !== 'PLAYING') return; // Bloquear disparos fuera de partida
      if (e.button === 0) triggerShoot('basic'); // Clic Izquierdo: Flecha Básica
      if (e.button === 2) triggerShoot('magic'); // Clic Derecho: Flecha Mágica Azur
    });

    canvas.addEventListener('touchstart', e => {
      unlockAudio();
      if (game.state === 'GAME_OVER' || game.state === 'VICTORY') {
        e.preventDefault();
        startMinigame();
      }
    }, { passive: false });

    // Control intuitivo de zoom con rueda del ratón y doble clic para restaurar escala
    window.addEventListener('wheel', e => {
      unlockAudio();
      e.preventDefault();
      if (e.deltaY < 0) {
        zoom = Math.min(2.2, zoom + 0.05);
      } else {
        zoom = Math.max(0.75, zoom - 0.05);
      }
    }, { passive: false });

    window.addEventListener('dblclick', () => {
      zoom = touchControlsVisible ? 1.38 : 1.05;
    });

    window.addEventListener('contextmenu', e => e.preventDefault());


    // SISTEMA DE CONTROLES TÁCTILES MÓVILES (HORIZONTAL • ERGONÓMICO • MULTI-TOUCH)
    // =========================================================================
    let touchControlsVisible = false;

    function unlockAudioOnTouch() {
      unlockAudio();
    }

    // Desbloquear audio en el primer toque de la pantalla (iOS Safari / Android Chrome)
    window.addEventListener('touchstart', unlockAudioOnTouch, { once: true, passive: true });
    window.addEventListener('pointerdown', unlockAudioOnTouch, { once: true, passive: true });

    function setTouchControlsVisibility(show) {
      touchControlsVisible = show;
      const tc = document.getElementById('touchControls');
      const btn = document.getElementById('btnToggleTouch');
      if (tc) {
        if (show && game.state !== 'START_SCREEN') tc.classList.add('visible');
        else tc.classList.remove('visible');
      }
      if (btn) {
        btn.style.borderColor = show ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
        btn.style.color = show ? '#38bdf8' : '#94a3b8';
        const txt = btn.querySelector('.pill-text');
        if (txt) txt.textContent = show ? 'TOUCH [ON]' : 'TOUCH [OFF]';
      }
      const btnSetting = document.getElementById('btnSettingTouch');
      if (btnSetting) {
        btnSetting.textContent = show ? 'ON' : 'OFF';
        btnSetting.className = 'setting-btn-toggle ' + (show ? 'active' : 'off');
      }
      // Zoom equilibrado (1.38x) en móvil para que los personajes y plataformas se vean claros y proporcionados
      zoom = show ? 1.38 : 1.05;
    }

    function toggleFullscreen() {
      const doc = document;
      const elem = doc.documentElement;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      }
    }

    function updateMobileCooldownVisuals() {
      // Cooldown de Dash
      const dashOverlay = document.getElementById('cdDashOverlay');
      const dashBtn = document.getElementById('btnActDash');
      if (dashOverlay && dashBtn) {
        if (player.dashCooldown > 0) {
          dashBtn.classList.add('on-cooldown');
          dashOverlay.textContent = (player.dashCooldown / 60).toFixed(1);
        } else {
          dashBtn.classList.remove('on-cooldown');
        }
      }

      // Cooldown de Flecha Triple
      const tripleOverlay = document.getElementById('cdTripleOverlay');
      const tripleBtn = document.getElementById('btnActTriple');
      if (tripleOverlay && tripleBtn) {
        if (player.tripleCooldown > 0) {
          tripleBtn.classList.add('on-cooldown');
          tripleOverlay.textContent = (player.tripleCooldown / 60).toFixed(1);
        } else {
          tripleBtn.classList.remove('on-cooldown');
        }
      }

      // Cooldown de Flecha Mágica
      const magicOverlay = document.getElementById('cdMagicOverlay');
      const magicBtn = document.getElementById('btnActMagic');
      if (magicOverlay && magicBtn) {
        if (player.magicCooldown > 0) {
          magicBtn.classList.add('on-cooldown');
          magicOverlay.textContent = (player.magicCooldown / 60).toFixed(1);
        } else {
          magicBtn.classList.remove('on-cooldown');
        }
      }

      // Sincronizar botón de BGM en barra superior
      const topBgmBtn = document.getElementById('btnTopBGM');
      if (topBgmBtn) {
        topBgmBtn.style.color = game.bgmMuted ? '#f87171' : '#4ade80';
        topBgmBtn.style.borderColor = game.bgmMuted ? 'rgba(248, 113, 113, 0.4)' : 'rgba(74, 222, 128, 0.4)';
        const bgmIcon = document.getElementById('bgmIcon');
        const bgmText = document.getElementById('bgmText');
        if (bgmIcon) bgmIcon.textContent = game.bgmMuted ? '🔇' : '🎵';
        if (bgmText) bgmText.textContent = game.bgmMuted ? 'BGM [OFF]' : 'BGM [ON]';
      }
    }

    function initTouchControls() {
      // =========================================================================
      // PALANCA ANALÓGICA TÁCTIL (VIRTUAL THUMBSTICK CON PERILLA Y REBOTE AL CENTRO)
      // =========================================================================
      const stickZone = document.getElementById('touchStickZone');
      const stickBase = document.getElementById('stickBase');
      const stickKnob = document.getElementById('stickKnob');
      const guideUp = document.getElementById('guideUp');
      const guideDown = document.getElementById('guideDown');
      const guideLeft = document.getElementById('guideLeft');
      const guideRight = document.getElementById('guideRight');

      let stickTouchId = null;
      let isStickMouseDown = false;
      const MAX_STICK_RADIUS = 46; // Radio máximo de desplazamiento de la perilla

      function resetStickKnob() {
        if (!stickKnob) return;
        stickKnob.classList.add('returning');
        stickKnob.style.transform = 'translate3d(0px, 0px, 0px)';
        keys['KeyA'] = false;
        keys['KeyD'] = false;
        keys['KeyS'] = false;
        keys['KeyW'] = false;
        if (guideUp) guideUp.classList.remove('active');
        if (guideDown) guideDown.classList.remove('active');
        if (guideLeft) guideLeft.classList.remove('active');
        if (guideRight) guideRight.classList.remove('active');
      }

      function handleStickMove(clientX, clientY) {
        if (!stickBase || !stickKnob) return;
        if (game.state !== 'PLAYING') {
          resetStickKnob();
          return;
        }

        const rect = stickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        // Limitar la perilla al círculo máximo (física de palanca analógica)
        const clampedDist = Math.min(dist, MAX_STICK_RADIUS);
        const normX = dist > 0 ? (dx / dist) : 0;
        const normY = dist > 0 ? (dy / dist) : 0;
        const knobX = normX * clampedDist;
        const knobY = normY * clampedDist;

        stickKnob.classList.remove('returning');
        stickKnob.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;

        // Zona muerta central de 10px
        if (clampedDist < 10) {
          keys['KeyA'] = false;
          keys['KeyD'] = false;
          keys['KeyS'] = false;
          keys['KeyW'] = false;
          if (guideUp) guideUp.classList.remove('active');
          if (guideDown) guideDown.classList.remove('active');
          if (guideLeft) guideLeft.classList.remove('active');
          if (guideRight) guideRight.classList.remove('active');
          return;
        }

        // Activación direccional precisa
        const isLeft = dx < -12;
        const isRight = dx > 12;
        const isDown = dy > 18;
        const isUp = dy < -22;

        const prevLeft = keys['KeyA'];
        const prevRight = keys['KeyD'];

        keys['KeyA'] = isLeft;
        keys['KeyD'] = isRight;
        // La palanca táctil NUNCA activa KeyS ni caída de plataformas para evitar atravesar el piso
        keys['KeyS'] = false;
        keys['KeyW'] = false;

        // Vibración háptica sutil al cruzar el umbral de movimiento horizontal
        if ((isLeft && !prevLeft) || (isRight && !prevRight)) {
          triggerHaptic('light');
        }

        // Iluminar guías direccionales de la base
        if (guideLeft) isLeft ? guideLeft.classList.add('active') : guideLeft.classList.remove('active');
        if (guideRight) isRight ? guideRight.classList.add('active') : guideRight.classList.remove('active');
        if (guideDown) isDown ? guideDown.classList.add('active') : guideDown.classList.remove('active');
        if (guideUp) isUp ? guideUp.classList.add('active') : guideUp.classList.remove('active');
      }

      if (stickZone) {
        // Touch events (Móvil)
        stickZone.addEventListener('touchstart', e => {
          e.preventDefault();
          unlockAudioOnTouch();
          if (game.state === 'GAME_OVER' || game.state === 'VICTORY') {
            startMinigame();
            return;
          }
          if (game.state !== 'PLAYING') return;
          if (stickTouchId === null && e.changedTouches.length > 0) {
            stickTouchId = e.changedTouches[0].identifier;
            handleStickMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          }
        }, { passive: false });

        stickZone.addEventListener('touchmove', e => {
          e.preventDefault();
          if (game.state !== 'PLAYING') {
            resetStickKnob();
            return;
          }
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === stickTouchId) {
              handleStickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
              break;
            }
          }
        }, { passive: false });

        const endStickTouch = e => {
          if (!e || !e.changedTouches) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === stickTouchId) {
              stickTouchId = null;
              resetStickKnob();
              if (e.cancelable && e.target === stickZone) {
                e.preventDefault();
              }
              break;
            }
          }
        };

        stickZone.addEventListener('touchend', endStickTouch, { passive: false });
        stickZone.addEventListener('touchcancel', endStickTouch, { passive: false });
        // En window usamos passive: true para NO bloquear los toques y clics en la barra superior
        window.addEventListener('touchend', endStickTouch, { passive: true });
        window.addEventListener('touchcancel', endStickTouch, { passive: true });

        // Mouse events (Pruebas en PC con modo táctil activo)
        stickZone.addEventListener('mousedown', e => {
          if (e.button === 0) {
            isStickMouseDown = true;
            unlockAudioOnTouch();
            handleStickMove(e.clientX, e.clientY);
          }
        });

        window.addEventListener('mousemove', e => {
          if (isStickMouseDown) {
            handleStickMove(e.clientX, e.clientY);
          }
        });

        window.addEventListener('mouseup', () => {
          if (isStickMouseDown) {
            isStickMouseDown = false;
            resetStickKnob();
          }
        });
      }

      // Helper para vincular botones de acción táctil con soporte táctil y ratón
      function bindAction(btnId, onTrigger, isContinuous = false) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        let repeatInterval = null;

        const startAction = (e) => {
          if (e) e.preventDefault();
          unlockAudioOnTouch();
          if (game.state === 'GAME_OVER' || game.state === 'VICTORY') {
            startMinigame();
            return;
          }
          if (game.state !== 'PLAYING') return;
          btn.classList.add('pressed');
          onTrigger();
          if (isContinuous && !repeatInterval) {
            repeatInterval = setInterval(() => {
              if (game.state !== 'PLAYING') {
                if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null; }
                return;
              }
              onTrigger();
            }, 180);
          }
        };

        const stopAction = (e) => {
          if (e) e.preventDefault();
          btn.classList.remove('pressed');
          if (repeatInterval) {
            clearInterval(repeatInterval);
            repeatInterval = null;
          }
        };

        btn.addEventListener('touchstart', startAction, { passive: false });
        btn.addEventListener('touchend', stopAction, { passive: false });
        btn.addEventListener('touchcancel', stopAction, { passive: false });
        btn.addEventListener('mousedown', startAction);
        btn.addEventListener('mouseup', stopAction);
        btn.addEventListener('mouseleave', stopAction);
      }

      // Botón Salto (salto, doble salto o caída de plataforma)
      bindAction('btnActJump', () => {
        triggerJump();
      });

      // Botón Disparo (disparo continuo al dejar presionado)
      bindAction('btnActShoot', () => {
        triggerShoot('basic');
      }, true);

      // Botón Dash
      bindAction('btnActDash', () => {
        triggerDash();
        triggerHaptic('medium');
      });

      // Botón Flecha Triple
      bindAction('btnActTriple', () => {
        triggerShoot('triple');
      });

      // Botón Flecha Mágica
      bindAction('btnActMagic', () => {
        triggerShoot('magic');
      });

      // Helper para vincular botones de barra superior con respuesta táctil instantánea y sin bloqueos
      function bindTopButton(id, callback) {
        const btn = document.getElementById(id);
        if (!btn) return;
        let lastTriggerTime = 0;
        const handleTrigger = (e) => {
          const now = Date.now();
          if (now - lastTriggerTime < 180) return; // Anti-rebote
          lastTriggerTime = now;
          if (e) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
          }
          callback();
        };
        btn.addEventListener('pointerdown', handleTrigger);
        btn.addEventListener('touchstart', handleTrigger, { passive: false });
        btn.addEventListener('click', handleTrigger);
      }

      // =========================================================================
      // SISTEMA DE CONFIGURACIONES (SETTINGS MODAL)
      // =========================================================================
      const settingsModal = document.getElementById('settingsModal');
      const btnTopSettings = document.getElementById('btnTopSettings');
      const btnCloseSettings = document.getElementById('btnCloseSettings');
      const btnResumeGame = document.getElementById('btnResumeGame');
      const btnSettingBGM = document.getElementById('btnSettingBGM');
      const btnSettingTouch = document.getElementById('btnSettingTouch');
      const btnSettingFullscreen = document.getElementById('btnSettingFullscreen');
      const btnSettingRestart = document.getElementById('btnSettingRestart');
      const settingFullscreenRow = document.getElementById('settingFullscreenRow');
      const btnLaunchLandscape = document.getElementById('btnLaunchLandscape');

      // Detección estricta de Android (Tauri Mobile, Capacitor, Cordova o Navegador Android)
      const isAndroid = /Android/i.test(navigator.userAgent) ||
                        (typeof window.__TAURI__ !== 'undefined' && /Android/i.test(navigator.userAgent)) ||
                        (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform());

      if (isAndroid) {
        document.body.classList.add('is-android');
        if (settingFullscreenRow) settingFullscreenRow.style.display = 'none';
        if (btnLaunchLandscape) btnLaunchLandscape.style.display = 'none';
      }

      function syncSettingsUI() {
        if (btnSettingBGM) {
          const isBgmOn = !game.bgmMuted;
          btnSettingBGM.textContent = isBgmOn ? 'ON' : 'OFF';
          btnSettingBGM.className = 'setting-btn-toggle ' + (isBgmOn ? 'active' : 'off');
        }
        if (btnSettingTouch) {
          btnSettingTouch.textContent = touchControlsVisible ? 'ON' : 'OFF';
          btnSettingTouch.className = 'setting-btn-toggle ' + (touchControlsVisible ? 'active' : 'off');
        }
        if (btnSettingFullscreen) {
          const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
          btnSettingFullscreen.textContent = isFs ? 'EXIT' : 'ACTIVATE';
        }
      }

      function openSettingsModal() {
        if (!settingsModal) return;
        // Pausar el juego de inmediato manteniendo la música de fondo activa
        if (game.state === 'PLAYING') {
          game.isPaused = true;
        }
        syncSettingsUI();
        settingsModal.classList.remove('hidden');
        triggerHaptic('light');
      }

      function closeSettingsModal() {
        if (!settingsModal) return;
        // Reanudar el juego de inmediato
        game.isPaused = false;
        settingsModal.classList.add('hidden');
        triggerHaptic('light');
      }

      window.openSettingsModal = openSettingsModal;
      window.closeSettingsModal = closeSettingsModal;

      // Botón Reanudar Partida dentro del modal
      bindTopButton('btnResumeGame', () => {
        closeSettingsModal();
      });

      // Botón Settings en la barra superior
      bindTopButton('btnTopSettings', () => {
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
          closeSettingsModal();
        } else {
          openSettingsModal();
        }
      });

      // Cerrar modal con el botón ✕
      bindTopButton('btnCloseSettings', () => {
        closeSettingsModal();
      });

      // Cerrar modal haciendo tap fuera de la tarjeta
      if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
          if (e.target === settingsModal) {
            closeSettingsModal();
          }
        });
        settingsModal.addEventListener('touchstart', (e) => {
          if (e.target === settingsModal) {
            e.preventDefault();
            closeSettingsModal();
          }
        }, { passive: false });
      }

      // Control de Música (BGM) dentro de Configuración
      bindTopButton('btnSettingBGM', () => {
        toggleBGM();
        syncSettingsUI();
        triggerHaptic('light');
      });

      // Control de Touch Controls dentro de Configuración
      bindTopButton('btnSettingTouch', () => {
        setTouchControlsVisibility(!touchControlsVisible);
        syncSettingsUI();
        triggerHaptic('light');
      });

      // Pantalla Completa dentro de Configuración
      bindTopButton('btnSettingFullscreen', () => {
        toggleFullscreen();
        setTimeout(syncSettingsUI, 250);
        triggerHaptic('light');
      });

      // Reiniciar Nivel dentro de Configuración
      bindTopButton('btnSettingRestart', () => {
        closeSettingsModal();
        resetPlayer(true);
        triggerHaptic('medium');
      });

      // Pantalla de inicio: tap o click en cualquier parte inicia la partida
      const startScreen = document.getElementById('startScreen');
      if (startScreen) {
        const handleStartTap = (e) => {
          if (e && e.cancelable) e.preventDefault();
          startGameFromTitle();
        };
        startScreen.addEventListener('click', handleStartTap);
        startScreen.addEventListener('touchstart', handleStartTap, { passive: false });
        startScreen.addEventListener('pointerdown', handleStartTap);
      }

      // Enlaces de Discord: propagación detenida para que no interfieran con el inicio
      const btnDiscord = document.getElementById('btnDiscord');
      if (btnDiscord) {
        const stopProp = (e) => e.stopPropagation();
        btnDiscord.addEventListener('pointerdown', stopProp);
        btnDiscord.addEventListener('click', stopProp);
        btnDiscord.addEventListener('touchstart', stopProp);
      }

      const btnTopDiscord = document.getElementById('btnTopDiscord');
      if (btnTopDiscord) {
        const stopProp = (e) => e.stopPropagation();
        btnTopDiscord.addEventListener('pointerdown', stopProp);
        btnTopDiscord.addEventListener('click', stopProp);
        btnTopDiscord.addEventListener('touchstart', stopProp);
      }

      // Botón del Modal de Orientación Vertical
      if (btnLaunchLandscape) {
        btnLaunchLandscape.addEventListener('click', (e) => {
          e.preventDefault();
          unlockAudioOnTouch();
          toggleFullscreen();
          triggerHaptic('medium');
        });
      }

      // Detector de orientación y activación automática
      function checkDeviceMode() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
        if (isTouch && !touchControlsVisible) {
          setTouchControlsVisibility(true);
        }

        const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 1024;
        const warning = document.getElementById('portraitWarning');
        if (warning) {
          warning.style.display = isPortrait ? 'flex' : 'none';
        }
      }

      window.addEventListener('resize', checkDeviceMode);
      window.addEventListener('orientationchange', checkDeviceMode);
      checkDeviceMode();

      if (new URLSearchParams(window.location.search).has('autostart')) {
        setTimeout(startGameFromTitle, 150);
      }
    }
