export const CELL_W = 64;
export const CELL_H = 80;
export const PANEL_PAD = 18;
export const AXIS_ROW_H = 30;
export const AXIS_GAP = 6;
export const AXIS_COL_W = 30;
export const LAN_ROW_GAP = 8;

export const MAIN_COLS = 18;
export const MAIN_ROWS = 7;
export const LAN_COLS = 15;
export const LAN_ROWS = 2;

export const MAIN_W = 2 * PANEL_PAD + AXIS_COL_W + MAIN_COLS * CELL_W;
export const MAIN_H = 2 * PANEL_PAD + AXIS_ROW_H + AXIS_GAP + MAIN_ROWS * CELL_H;
export const LAN_W = 2 * PANEL_PAD + AXIS_COL_W + LAN_COLS * CELL_W;
export const LAN_H = 2 * PANEL_PAD + AXIS_ROW_H + AXIS_GAP + LAN_ROWS * CELL_H + LAN_ROW_GAP;

export function centerX(col) {
  return PANEL_PAD + AXIS_COL_W + col * CELL_W + CELL_W / 2;
}

export function centerY(row) {
  return PANEL_PAD + AXIS_ROW_H + AXIS_GAP + row * CELL_H + CELL_H / 2;
}

export function lanCenterY(row) {
  return centerY(row) + (row > 0 ? LAN_ROW_GAP : 0);
}