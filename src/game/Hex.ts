import { HexCoordinate } from "../lib/hex/HexCoordinate";

export interface Hex {
  readonly position: HexCoordinate;
  readonly color: number;
}

export class HexField implements Hex {
  readonly color: number = 0x00c040;

  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}
}

export class HexCity implements Hex {
  readonly color: number = 0x808080;
  readonly food: number = 25;

  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}
}
