import { assert } from "../../lib/Assertion";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { createArea } from "../../lib/hex/HexCoordinatesFactory";
import { HexSet } from "../../lib/hex/HexSet";
import { Borders } from "../Borders";
import { Villager } from "../Unit";
import { World } from "../World";
import { Hex, HexFarm } from "./Hex";

const INITIAL_CITY_FOOD = 10;

const CITY_FOOD_CONSUMPTION = 1;
const CITY_FOOD_CAP = 25;

const UNIT_FOOD_COST = 5;
const CITY_GROWTH_COST = 25;

const CITY_BORDER_RADIUS = 3;
const FARM_BORDER_RADIUS = 1;

export const SETTLEMENT_POPULATION_FOR_PROMOTION = 5;

export class HexCity extends Hex {
  private _food;
  private initialCity: HexCity;
  private associatedFarms = new Set<HexFarm>();
  private associatedCities = new Set<HexCity>();
  private _border = new Borders();

  private get size() {
    return 1 + this.initialCity.associatedCities.size;
  }

  get food() {
    return this.initialCity._food;
  }

  get foodBalance() {
    return (
      this.initialCity.associatedFarms.size -
      CITY_FOOD_CONSUMPTION * this.initialCity.size
    );
  }

  get foodCap() {
    return this.initialCity.size * CITY_FOOD_CAP;
  }

  get border() {
    return this._border.values();
  }

  constructor(position: HexCoordinate, initialCity?: HexCity) {
    super(position);
    this.initialCity = initialCity ?? this;
    this._food = this.initialCity === this ? INITIAL_CITY_FOOD : 0;
    this.updateBorder();
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
    this.initialCity.updateBorder();
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
    const hexCity = new HexCity(hex.position, this.initialCity);
    hexCity._unit = hex.unit;
    this.initialCity.associatedCities.add(hexCity);

    if (hex instanceof HexFarm) {
      hex.associatedCity.initialCity.associatedFarms.delete(hex);
    }

    this.initialCity.updateBorder();
    return hexCity;
  }

  updateBorder() {
    const border = new Array<HexCoordinate>();

    for (const hex of createArea(
      CITY_BORDER_RADIUS,
      this.initialCity.position,
    )) {
      border.push(hex);
    }

    for (const city of this.initialCity.associatedCities) {
      for (const hex of createArea(CITY_BORDER_RADIUS, city.position)) {
        border.push(hex);
      }
    }

    for (const farm of this.initialCity.associatedFarms) {
      for (const hex of createArea(FARM_BORDER_RADIUS, farm.position)) {
        border.push(hex);
      }
    }

    this._border.overwriteWith(border);
  }
}

export class HexSettlement extends Hex {
  private _population = 1;
  private _border = new HexSet(createArea(CITY_BORDER_RADIUS, this.position));

  public get population() {
    return this._population;
  }

  public get border() {
    return this._border.values();
  }

  advanceToNextTurn = noop;

  getBorder(world: World) {
    return createArea(CITY_BORDER_RADIUS, this.position).filter((hex) =>
      world.has(hex),
    );
  }

  addVillager() {
    this._population++;
  }

  canPromoteToCity() {
    return this.population === SETTLEMENT_POPULATION_FOR_PROMOTION;
  }
}

function noop() {}
