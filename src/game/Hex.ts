import { HexCoordinate } from "../lib/hex/HexCoordinate";

const CITY_FOOD_CONSUMPTION = 1;

export interface Hex {
  readonly position: HexCoordinate;
  readonly color: number;

  advanceToNextTurn(): void;
}

export class HexField implements Hex {
  readonly color: number = 0x00c040;

  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}

  advanceToNextTurn = noop;
}

export class HexCity implements Hex {
  readonly color: number = 0x808080;
  private _food = 25;

  get food() {
    return this._food;
  }

  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}

  advanceToNextTurn(): void {
    this._food -= CITY_FOOD_CONSUMPTION;
  }
}

function noop() {}
