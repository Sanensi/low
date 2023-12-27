import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { Traversable } from "./HexPaths";
import { Unit, Villager } from "./Unit";

const CITY_FOOD_CONSUMPTION = 1;
const CITY_FOOD_CAP = 25;
const UNIT_FOOD_COST = 5;

export abstract class Hex implements Traversable {
  readonly isTraversable: boolean = true;

  protected _unit?: Unit;
  get unit() {
    return this._unit;
  }
  set unit(unit: Unit | undefined) {
    this._unit = unit;
  }

  protected _isSelected = false;
  get isSelected() {
    return this._isSelected;
  }

  constructor(readonly position: HexCoordinate) {}

  abstract advanceToNextTurn(): void;

  select(): void {
    this._isSelected = true;
  }

  unselect(): void {
    this._isSelected = false;
  }
}

export class HexField extends Hex {
  advanceToNextTurn = noop;
}

export class HexWater extends Hex {
  readonly isTraversable = false;

  advanceToNextTurn = noop;
}

export class HexCity extends Hex {
  private _food = 25;
  private associatedFarms: HexFarm[] = [];

  get foodBalance() {
    return this.associatedFarms.length - CITY_FOOD_CONSUMPTION;
  }

  advanceToNextTurn(): void {
    this._food = Math.max(
      Math.min(this._food + this.foodBalance, CITY_FOOD_CAP),
      0,
    );
  }

  canCreateVillager() {
    return this._food >= UNIT_FOOD_COST && this._unit === undefined;
  }

  createVillager() {
    if (this.canCreateVillager()) {
      this._food -= UNIT_FOOD_COST;
      this._unit = new Villager(this.position);
    }
  }

  addFarm(farm: HexFarm) {
    this.associatedFarms.push(farm);
  }
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
