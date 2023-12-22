import { Vec2 } from "./Vec2";

export class HexCoordinate {
  constructor(
    readonly q: number,
    readonly r: number,
    readonly s: number,
  ) {
    hexagonalConstraint(q, r, s);
  }

  toString() {
    return `(${this.q}, ${this.r}, ${this.s})`;
  }
}

function hexagonalConstraint(q: number, r: number, s: number) {
  if (q + r + s !== 0)
    throw new Error(
      `(${q}, ${r}, ${s}) doesn't respect the hexagonal constraint: "q + r + s = 0"`,
    );
}

const sqrt3 = Math.sqrt(3);
const hexToPixelMatrix = [3 / 2, 0, sqrt3 / 2, sqrt3];
const pixelToHexMatrix = [2 / 3, 0, -1 / 3, sqrt3 / 3];

export function hexToPixel(h: HexCoordinate, scale: Vec2): Vec2 {
  const m = hexToPixelMatrix;
  const x = (m[0] * h.q + m[1] * h.r) * scale.x;
  const y = (m[2] * h.q + m[3] * h.r) * scale.y;

  return new Vec2(x, y);
}

export function pixelToHex(p: Vec2, scale: Vec2) {
  p = p.divide(scale);

  const m = pixelToHexMatrix;
  const q = m[0] * p.x + m[1] * p.y;
  const r = m[2] * p.x + m[3] * p.y;

  return new HexCoordinate(q, r, -q - r);
}
