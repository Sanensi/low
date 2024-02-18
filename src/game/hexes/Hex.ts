import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { Traversable } from "../HexPaths";
import { Unit } from "../Unit";

export abstract class Hex implements Traversable {
  readonly isTraversable: boolean = true;
  readonly foodCapacity: number = 5;
  public food2 = 0;

  protected _unit?: Unit;
  get unit() {
    return this._unit;
  }
  set unit(unit: Unit | undefined) {
    this._unit = unit;
  }

  constructor(readonly position: HexCoordinate) {}

  abstract advanceToNextTurn(): void;
}

export class HexField extends Hex {
  advanceToNextTurn = noop;
}

export class HexWater extends Hex {
  readonly isTraversable = false;

  advanceToNextTurn = noop;
}

export class HexFarm extends Hex {
  advanceToNextTurn() {
    this.food2 = Math.min(this.food2 + 1, this.foodCapacity);
  }
}

function noop() {}
