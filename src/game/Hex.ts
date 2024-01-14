import { assert } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Traversable } from "./HexPaths";
import { Unit, Villager } from "./Unit";

const INITIAL_CITY_FOOD = 25;

const CITY_FOOD_CONSUMPTION = 1;
const CITY_FOOD_CAP = 25;

const UNIT_FOOD_COST = 5;
const CITY_GROWTH_COST = 25;

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

export class HexCity extends Hex {
  private _food;
  private associatedFarms = new Set<HexFarm>();
  private initialCity: HexCity;
  private _size = 1;

  get food() {
    return this.initialCity._food;
  }

  get foodBalance() {
    return (
      this.initialCity.associatedFarms.size -
      CITY_FOOD_CONSUMPTION * this.initialCity._size
    );
  }

  get foodCap() {
    return this.initialCity._size * CITY_FOOD_CAP;
  }

  constructor(position: HexCoordinate, initialCity?: HexCity) {
    super(position);
    this.initialCity = initialCity ?? this;
    this._food = this.initialCity === this ? INITIAL_CITY_FOOD : 0;
  }

  advanceToNextTurn(): void {
    if (this === this.initialCity) {
      this.initialCity._food = Math.max(
        Math.min(
          this.initialCity._food + this.initialCity.foodBalance,
          this.initialCity.foodCap,
        ),
        0,
      );
    }
  }

  canCreateVillager() {
    return this.initialCity._food >= UNIT_FOOD_COST && this._unit === undefined;
  }

  createVillager() {
    assert(this.canCreateVillager());

    this.initialCity._food -= UNIT_FOOD_COST;
    this._unit = new Villager(this.position);
  }

  addFarm(farm: HexFarm) {
    this.initialCity.associatedFarms.add(farm);
  }

  canGrow() {
    return (
      this.initialCity._food >= CITY_GROWTH_COST &&
      this.initialCity.associatedFarms.size > 0
    );
  }

  grow(hex: Hex): HexCity {
    assert(this.canGrow());

    this.initialCity._food -= CITY_GROWTH_COST;
    this.initialCity._size += 1;
    const hexCity = new HexCity(hex.position, this.initialCity);
    hexCity._unit = hex.unit;

    if (hex instanceof HexFarm) {
      hex.associatedCity.initialCity.associatedFarms.delete(hex);
    }

    return hexCity;
  }

  getBorder() {
    return createArea(3, this.position);
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
