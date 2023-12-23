import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { Unit, Villager } from "./Unit";

const CITY_FOOD_CONSUMPTION = 1;
const UNIT_FOOD_COST = 5;

export interface Hex {
  readonly position: HexCoordinate;
  readonly unit?: Unit;

  advanceToNextTurn(): void;
}

export class HexField implements Hex {
  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}

  advanceToNextTurn = noop;
}

export class HexCity implements Hex {
  private _food = 25;
  private _unit?: Unit;

  get food() {
    return this._food;
  }

  get unit() {
    return this._unit;
  }

  constructor(readonly position = new HexCoordinate(0, 0, 0)) {}

  advanceToNextTurn(): void {
    this._food -= CITY_FOOD_CONSUMPTION;
  }

  createVillager() {
    if (this._food >= UNIT_FOOD_COST && this._unit === undefined) {
      this._food -= UNIT_FOOD_COST;
      this._unit = new Villager();
    }
  }
}

function noop() {}
