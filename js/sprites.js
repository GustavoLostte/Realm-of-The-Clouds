// =========================================================================
// SPRITES & ATLAS DEL ARQUERO (160x160, 1:1 ESCALA ANATÓMICA UNIFICADA • WEBP)
// =========================================================================
const CELL_W = 160;
const CELL_H = 160;
const ANCHOR_X = 80;
const ANCHOR_Y = 142;

const sheets = {
  idle:         { img: new Image(), frames: 34, fps: 24, src: 'sprites_juego/archer_idle_sheet.webp' },
  run:          { img: new Image(), frames: 38, fps: 24, src: 'sprites_juego/archer_run_sheet.webp' },
  jump:         { img: new Image(), frames: 33, fps: 24, src: 'sprites_juego/archer_jump_sheet.webp' },
  double_jump:  { img: new Image(), frames: 42, fps: 24, src: 'sprites_juego/archer_double_jump_sheet.webp' },
  basic_shoot:  { img: new Image(), frames: 62, fps: 60, src: 'sprites_juego/archer_basic_shoot_sheet.webp' },
  triple_shoot: { img: new Image(), frames: 28, fps: 60, src: 'sprites_juego/archer_triple_shoot_sheet.webp' },
  magic_arrow:  { img: new Image(), frames: 28, fps: 60, src: 'sprites_juego/archer_magic_arrow_sheet.webp' }
};

for (const key in sheets) {
  sheets[key].img.src = sheets[key].src;
}
