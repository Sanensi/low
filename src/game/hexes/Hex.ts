import { assert } from "../../lib/Assertion";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { Traversable } from "../HexPaths";
import { Unit } from "../Unit";

export abstract class Hex implements Traversable {
  readonly isTraversable: boolean = true;
  readonly foodCapacity: number = 5;

  protected _food2 = 0;
  get food2() {
    return this._food2;
  }
  set food2(value) {
    assert(value >= 0, "There can't be negative food on an Hex");
    assert(
      value <= this.foodCapacity,
      `Can't have more food than the capacity of this Hex: (${value}/${this.foodCapacity})`,
    );
    this._food2 = value;
  }

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
