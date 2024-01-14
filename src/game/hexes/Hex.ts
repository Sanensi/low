import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { Traversable } from "../HexPaths";
import { Unit } from "../Unit";
import { HexCity } from "./HexCity";

export abstract class Hex implements Traversable {
  readonly isTraversable: boolean = true;

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
  advanceToNextTurn = noop;

  readonly associatedCity: HexCity;

  constructor(position: HexCoordinate, associatedCity: HexCity) {
    super(position);
    this.associatedCity = associatedCity;
    this.associatedCity.addFarm(this);
  }
}

function noop() {}
