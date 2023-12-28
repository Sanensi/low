import { HexCoordinate } from "./HexCoordinate";
import { Vec2 } from "../Vec2";

const sqrt3 = Math.sqrt(3);
const flatHexToPixelMatrix = [3 / 2, 0, sqrt3 / 2, sqrt3];
const pixelToFlatHexMatrix = [2 / 3, 0, -1 / 3, sqrt3 / 3];
const pointyHexToPixelMatrix = [sqrt3, sqrt3 / 2, 0, 3 / 2];
const pixelToPointyHexMatrix = [sqrt3 / 3, -1 / 3, 0, 2 / 3];

export function flatHexToPixel(h: HexCoordinate, scale: Vec2): Vec2 {
  const m = flatHexToPixelMatrix;
  const x = (m[0] * h.q + m[1] * h.r) * scale.x;
  const y = (m[2] * h.q + m[3] * h.r) * scale.y;

  return new Vec2(x, y);
}

export function pixelToFlatHex(p: Vec2, scale: Vec2) {
  p = p.divide(scale);

  const m = pixelToFlatHexMatrix;
  const q = m[0] * p.x + m[1] * p.y;
  const r = m[2] * p.x + m[3] * p.y;

  return new HexCoordinate(q, r, -q - r);
}

export function pointyHexToPixel(h: HexCoordinate, scale: Vec2): Vec2 {
  const m = pointyHexToPixelMatrix;
  const x = (m[0] * h.q + m[1] * h.r) * scale.x;
  const y = (m[2] * h.q + m[3] * h.r) * scale.y;

  return new Vec2(x, y);
}

export function pixelToPointyHex(p: Vec2, scale: Vec2) {
  p = p.divide(scale);

  const m = pixelToPointyHexMatrix;
  const q = m[0] * p.x + m[1] * p.y;
  const r = m[2] * p.x + m[3] * p.y;

  return new HexCoordinate(q, r, -q - r);
}

export function hexToOffsetCoordinates(hex: HexCoordinate) {
  const col = hex.q;
  const row = hex.r + (hex.q - (hex.q & 1)) / 2;
  return new Vec2(col, row);
}

export function offsetCoordinatesToHex(offsetCoord: Vec2) {
  const q = offsetCoord.x;
  const r = offsetCoord.y - (offsetCoord.x - (offsetCoord.y & 1)) / 2;
  const s = -q - r;

  return new HexCoordinate(q, r, s);
}

export function doubleHeightCoordinatesToHex(doubleHeightCoord: Vec2) {
  const q = doubleHeightCoord.x;
  const r = (doubleHeightCoord.y - doubleHeightCoord.x) / 2;
  const s = -q - r;

  return new HexCoordinate(q, r, s);
}

export function hexToDoubleHeightCoordinates(hex: HexCoordinate) {
  const col = hex.q;
  const row = 2 * hex.r + hex.q;

  return new Vec2(col, row);
}

export function doubleWidthCoordinatesToHex(doubleWidth: Vec2) {
  const q = (doubleWidth.x - doubleWidth.y) / 2;
  const r = doubleWidth.y;
  const s = -q - r;

  return new HexCoordinate(q, r, s);
}

export function hexToDoubleWidthCoordinates(hex: HexCoordinate) {
  const col = 2 * hex.q + hex.r;
  const row = hex.r;

  return new Vec2(col, row);
}
