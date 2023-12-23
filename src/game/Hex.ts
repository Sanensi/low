import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { Unit, Villager } from "./Unit";

const CITY_FOOD_CONSUMPTION = 1;
const UNIT_FOOD_COST = 5;

export abstract class Hex {
  protected _unit?: Unit;
  readonly isSelected: boolean = false;

  get unit() {
    return this._unit;
  }

  constructor(readonly position: HexCoordinate) {}

  abstract advanceToNextTurn(): void;
}

export class HexField extends Hex {
  advanceToNextTurn = noop;
}

export class HexCity extends Hex {
  private _food = 25;

  advanceToNextTurn(): void {
    this._food -= CITY_FOOD_CONSUMPTION;
  }

  canCreateVillager() {
    return this._food >= UNIT_FOOD_COST && this._unit === undefined;
  }

  createVillager() {
    if (this.canCreateVillager()) {
      this._food -= UNIT_FOOD_COST;
      this._unit = new Villager();
    }
  }
}

function noop() {}
