// =========================================================================
    // LOOP PRINCIPAL (FIXED TIMESTEP 60 FPS • SINCRONIZACIÓN PERFECTA EN PANTALLAS 60Hz / 120Hz / 144Hz)
    // =========================================================================
    let lastTime = performance.now();
    const TARGET_FPS = 60;
    const STEP = 1000 / TARGET_FPS; // 16.6667 ms por tick de física
    let accumulator = 0;

    function gameLoop(currentTime) {
      if (!currentTime) currentTime = performance.now();
      let deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Limitar deltaTime máximo para evitar espiral de cálculo si la pestaña estuvo en segundo plano
      if (deltaTime > 150) deltaTime = 150;

      accumulator += deltaTime;

      // Ejecutar update() estrictamente a 60 ticks por segundo
      let numUpdates = 0;
      while (accumulator >= STEP && numUpdates < 5) {
        update();
        accumulator -= STEP;
        numUpdates++;
      }

      // Renderizar al refresco nativo del dispositivo (fluidez de pantalla)
      render();
      requestAnimationFrame(gameLoop);
    }

    // Carga anticipada de buffers OGG de alta fidelidad y preparación de música
    loadGameSounds();
    initBGM();

    // Inicializar controles táctiles móviles
    initTouchControls();

    // Carga anticipada de la fase 1 en memoria manteniendo la pantalla de inicio
    loadStage(1);
    game.state = 'START_SCREEN';
    requestAnimationFrame(gameLoop);

