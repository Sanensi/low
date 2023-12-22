import { HexCoordinate } from "../lib/hex/HexCoordinate";

export class Hex {
  readonly position = new HexCoordinate(0, 0, 0);
  readonly color: number = 0x00c040;
  readonly food: number = 0;
}
