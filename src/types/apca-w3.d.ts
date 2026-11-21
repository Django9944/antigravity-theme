declare module 'apca-w3' {
  export function sRGBtoY(rgb: readonly [number, number, number]): number;
  export function APCAcontrast(txtY: number, bgY: number, places?: -1): number;
  export function APCAcontrast(txtY: number, bgY: number, places: number): number | string;
}
