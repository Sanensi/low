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
