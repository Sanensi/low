type HexDirection = "2h" | "4h" | "6h" | "8h" | "10h" | "12h";

export class HexCoordinate {
  static readonly ZERO = new HexCoordinate(0, 0, 0);

  constructor(
    readonly q: number,
    readonly r: number,
    readonly s: number,
  ) {
    hexagonalConstraint(q, r, s);
  }

  equals(other: HexCoordinate) {
    return this.q === other.q && this.r === other.r && this.s === other.s;
  }

  add(other: HexCoordinate) {
    return new HexCoordinate(
      this.q + other.q,
      this.r + other.r,
      this.s + other.s,
    );
  }

  scale(s: number) {
    return new HexCoordinate(this.q * s, this.r * s, this.s * s);
  }

  neighbors() {
    return HexCoordinate.UNIT_HEXES.map((unitHex) => this.add(unitHex));
  }

  toString() {
    return `(${this.q}, ${this.r}, ${this.s})`;
  }

  static direction(direction: HexDirection) {
    switch (direction) {
      case "2h":
        return this.UNIT_HEXES[0];
      case "4h":
        return this.UNIT_HEXES[1];
      case "6h":
        return this.UNIT_HEXES[2];
      case "8h":
        return this.UNIT_HEXES[3];
      case "10h":
        return this.UNIT_HEXES[4];
      case "12h":
        return this.UNIT_HEXES[5];
    }
  }

  static readonly UNIT_HEXES: ReadonlyArray<HexCoordinate> = [
    new HexCoordinate(1, -1, 0),
    new HexCoordinate(1, 0, -1),
    new HexCoordinate(0, 1, -1),
    new HexCoordinate(-1, 1, 0),
    new HexCoordinate(-1, 0, 1),
    new HexCoordinate(0, -1, 1),
  ];
}

function hexagonalConstraint(q: number, r: number, s: number) {
  if (q + r + s !== 0)
    throw new Error(
      `(${q}, ${r}, ${s}) doesn't respect the hexagonal constraint: "q + r + s = 0"`,
    );
}
