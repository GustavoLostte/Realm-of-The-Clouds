// =========================================================================
// MOTOR DE AUDIO QUIRÚRGICO OGG (SINCRONIZACIÓN MILIMÉTRICA Y CERO LATENCIA)
// =========================================================================
    let audioCtx = null;
    let userHasInteracted = false;

    function getAudioCtx() {
      if (!userHasInteracted) return null;
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }

    function unlockAudio() {
      userHasInteracted = true;
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      startBGM();
      loadGameSounds();
    }

    // Escuchar interacción inicial del usuario para activar el motor de audio sin advertencias
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('mousedown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { passive: true });

    const SOUND_FILES = {
      jump: 'SOUNDS/jump.ogg',
      dash: 'SOUNDS/dash.ogg',
      disparo: 'SOUNDS/disparo.ogg',
      disparo2: 'SOUNDS/disparo2.ogg',
      disparo_alt1: 'SOUNDS/disparo_alt1.ogg',
      disparo_alt2: 'SOUNDS/disparo_alt2.ogg',
      magic_arrow: 'SOUNDS/magic_arrow.ogg',
      impacto: 'SOUNDS/impacto.ogg',
      step1: 'SOUNDS/step1.ogg',
      step2: 'SOUNDS/step2.ogg',
      run: 'SOUNDS/run.ogg'
    };

    const soundBuffers = {};
    const activeAudioSources = {};
    let soundsLoading = false;

    async function loadGameSounds() {
      if (soundsLoading && Object.keys(soundBuffers).length === Object.keys(SOUND_FILES).length) return;
      const actx = getAudioCtx();
      if (!actx) return;
      soundsLoading = true;

      for (const [key, url] of Object.entries(SOUND_FILES)) {
        if (soundBuffers[key]) continue;
        try {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const arrayBuf = await resp.arrayBuffer();
          actx.decodeAudioData(
            arrayBuf,
            (buffer) => { soundBuffers[key] = buffer; },
            (err) => { console.warn('Error decodificando audio:', key, err); }
          );
        } catch (e) {
          console.warn('Error cargando audio:', key, e);
        }
      }
    }

    // =========================================================================
    // MÚSICA DE FONDO OGG (BACKGROUND BGM) EN LOOP PERPETUO DE ALTA CALIDAD
    // =========================================================================
    let bgmAudio = null;
    let bgmStarted = false;

    function initBGM() {
      if (bgmAudio) return;
      bgmAudio = new Audio('SOUNDS/BACKGROUND.ogg');
      bgmAudio.loop = true;
      bgmAudio.preload = 'auto';
      bgmAudio.volume = (typeof game !== 'undefined' && game.bgmMuted) ? 0 : (typeof game !== 'undefined' ? game.bgmVolume : 0.48);
    }

    function startBGM() {
      initBGM();
      if (bgmAudio && (typeof game === 'undefined' || !game.bgmMuted) && !bgmStarted && userHasInteracted) {
        const p = bgmAudio.play();
        if (p !== undefined) {
          p.then(() => {
            bgmStarted = true;
          }).catch(err => {
            // Autoplay bloqueado hasta la primera interacción del usuario
          });
        }
      }
    }

    function restartBGM() {
      initBGM();
      if (bgmAudio && userHasInteracted) {
        try {
          bgmAudio.currentTime = 0;
          if (typeof game === 'undefined' || !game.bgmMuted) {
            bgmAudio.volume = (typeof game !== 'undefined') ? game.bgmVolume : 0.48;
            const p = bgmAudio.play();
            if (p !== undefined) {
              p.then(() => {
                bgmStarted = true;
              }).catch(() => {});
            }
          }
        } catch (e) {}
      }
    }

    function toggleBGM() {
      initBGM();
      game.bgmMuted = !game.bgmMuted;
      if (bgmAudio) {
        if (game.bgmMuted) {
          bgmAudio.pause();
        } else {
          bgmAudio.volume = game.bgmVolume;
          bgmAudio.play().then(() => {
            bgmStarted = true;
          }).catch(() => {});
        }
      }
    }

    function playSound(key, options = {}) {
      try {
        const actx = getAudioCtx();
        if (!actx || actx.state === 'suspended') return null;
        const buffer = soundBuffers[key];
        if (!buffer) return null;

        const source = actx.createBufferSource();
        source.buffer = buffer;

        const gainNode = actx.createGain();
        const vol = options.volume !== undefined ? options.volume : 1.0;
        gainNode.gain.setValueAtTime(vol, actx.currentTime);

        if (options.playbackRate) {
          source.playbackRate.setValueAtTime(options.playbackRate, actx.currentTime);
        }

        if (options.detune) {
          source.detune.setValueAtTime(options.detune, actx.currentTime);
        }

        source.connect(gainNode);
        gainNode.connect(actx.destination);

        const now = actx.currentTime;
        source.start(now);

        // Control milimétrico de duración ajustada al movimiento o animación
        if (options.maxDuration && options.maxDuration > 0) {
          const stopTime = now + options.maxDuration;
          const fadeStart = Math.max(now, stopTime - 0.035);
          gainNode.gain.setValueAtTime(vol, fadeStart);
          gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
          source.stop(stopTime);
        }

        activeAudioSources[key] = { source, gainNode, startTime: now };
        return { source, gainNode };
      } catch (e) {
        return null;
      }
    }

    function stopSound(key, fadeOutDuration = 0.03) {
      try {
        const active = activeAudioSources[key];
        if (active && active.source) {
          const actx = getAudioCtx();
          if (actx && fadeOutDuration > 0) {
            const now = actx.currentTime;
            active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);
            active.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeOutDuration);
            active.source.stop(now + fadeOutDuration);
          } else {
            active.source.stop();
          }
          delete activeAudioSources[key];
        }
      } catch (e) {}
    }

    // =========================================================================
    // RESPUESTA HÁPTICA MÓVIL (VIBRACIÓN TÁCTIL)
    // =========================================================================
    function triggerHaptic(type = 'light') {
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      try {
        if (type === 'light') navigator.vibrate(18);
        else if (type === 'medium') navigator.vibrate(30);
        else if (type === 'heavy') navigator.vibrate([35, 40, 45]);
      } catch (e) {}
    }

    function playImpactSound(type, isBullseye) {
      triggerHaptic(isBullseye ? 'heavy' : 'medium');
      // 1. Sonido quirúrgico OGG de impacto físico real
      if (type === 'wall') {
        playSound('impacto', { volume: 0.50, detune: 180, maxDuration: 0.22 });
      } else {
        playSound('impacto', { 
          volume: isBullseye ? 0.95 : 0.80, 
          detune: isBullseye ? 70 : 0 
        });
      }

      // 2. Capa sintetizada complementaria (campana de diana cristalina o resonancia mágica)
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        const osc = actx.createOscillator();
        const gain = actx.createGain();

        if (type === 'magic') {
          // Impacto Mágico: silbido místico
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        } else if (isBullseye) {
          // ¡Diana Perfecta!: Campana cristalina de diana
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        } else {
          return;
        }

        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + (isBullseye ? 0.35 : 0.28));
      } catch (e) {}
    }

    function playExplosionSound() {
      triggerHaptic('heavy');
      // Explosión pesada con el impacto OGG pitch-down y resonancia física profunda
      playSound('impacto', { volume: 0.95, playbackRate: 0.65, detune: -450 });
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        // Estruendo sordo de impacto y explosión
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(26, now + 0.45);
        gain.gain.setValueAtTime(0.40, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.45);

        // Crujido de madera y paja
        const osc2 = actx.createOscillator();
        const gain2 = actx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(360, now);
        osc2.frequency.exponentialRampToValueAtTime(45, now + 0.22);
        gain2.gain.setValueAtTime(0.28, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(actx.destination);
        osc2.start(now);
        osc2.stop(now + 0.22);
      } catch (e) {}
    }

    function playRespawnSound() {
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        // Campanilla mágica ascendente
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
      } catch (e) {}
    }

    function playTimerTickSound(isUrgent) {
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;
        const osc = actx.createOscillator();
        const gain = actx.createGain();

        if (isUrgent) {
          // Heartbeat pulse for critical countdown (<= 5s)
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);
          gain.gain.setValueAtTime(0.20, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        } else {
          // Subtle rhythmic tick
          osc.type = 'sine';
          osc.frequency.setValueAtTime(560, now);
          osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }
      } catch (e) {}
    }

    function playTimeBonusSound() {
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        // High crystalline gem ding (+2.5s time bonus)
        const freqs = [1046.50, 1318.51, 1567.98];
        freqs.forEach((f, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.035);
          gain.gain.setValueAtTime(0.18, now + idx * 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.28);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now + idx * 0.035);
          osc.stop(now + idx * 0.035 + 0.28);
        });
      } catch (e) {}
    }

    function playStageClearSound() {
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        // Ascending triumphant major chord
        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        chord.forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.24, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.45);
        });
      } catch (e) {}
    }

    function playGameOverSound() {
      try {
        const actx = getAudioCtx();
        if (!actx) return;
        const now = actx.currentTime;

        // Deep bass gong
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.7);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      } catch (e) {}
    }

    function playStageStartSound() {
      if (!userHasInteracted) return; // Evitar iniciar osciladores antes de la primera interacción del usuario
      try {
        const actx = getAudioCtx();
        if (!actx || actx.state === 'suspended') return;
        const now = actx.currentTime;

        // Energetic synth swoosh
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.22);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }
