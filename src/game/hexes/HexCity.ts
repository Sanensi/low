import { assert } from "../../lib/Assertion";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { createArea } from "../../lib/hex/HexCoordinatesFactory";
import { Borders } from "../Borders";
import { Villager } from "../Unit";
import { ReadonlyWorld } from "../World";
import { Hex, HexFarm } from "./Hex";

const INITIAL_CITY_FOOD = 10;

const CITY_FOOD_CONSUMPTION = 1;
const CITY_FOOD_CAP = 25;

const UNIT_FOOD_COST = 5;
const CITY_GROWTH_COST = 25;

const CITY_BORDER_RADIUS = 3;

export const SETTLEMENT_POPULATION_FOR_PROMOTION = 5;

export class HexCity extends Hex {
  private _food;
  private initialCity: HexCity;
  private associatedCities = new Set<HexCity>();
  private readonly borders: Borders;

  readonly foodCapacity = 25;

  private get size() {
    return 1 + this.initialCity.associatedCities.size;
  }

  private get associatedFarms() {
    return this.border
      .map((coord) => this.world.map.get(coord))
      .filter((hex): hex is HexFarm => hex instanceof HexFarm);
  }

  get food() {
    return this.initialCity._food;
  }

  get foodBalance() {
    return (
      this.initialCity.associatedFarms.length -
      CITY_FOOD_CONSUMPTION * this.initialCity.size
    );
  }

  get foodCap() {
    return this.initialCity.size * CITY_FOOD_CAP;
  }

  get border() {
    return this.borders.getBorderFor(this.initialCity);
  }

  constructor(
    private readonly world: ReadonlyWorld,
    position: HexCoordinate,
    borders: Borders,
    initialCity?: HexCity,
  ) {
    super(position);
    this.initialCity = initialCity ?? this;
    this._food = this.initialCity === this ? INITIAL_CITY_FOOD : 0;
    this.borders = borders;
    this.borders.acquireUnclaimedBorderFor(
      this.initialCity,
      createArea(CITY_BORDER_RADIUS, this.position),
    );
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

  canGrow() {
    return (
      this.initialCity._food >= CITY_GROWTH_COST &&
      this.initialCity.associatedFarms.length > 0
    );
  }

  grow(hex: Hex): HexCity {
    assert(this.canGrow());

    this.initialCity._food -= CITY_GROWTH_COST;
    const hexCity = new HexCity(
      this.world,
      hex.position,
      this.borders,
      this.initialCity,
    );
    hexCity._unit = hex.unit;
    this.initialCity.associatedCities.add(hexCity);

    return hexCity;
  }
}

export class HexSettlement extends Hex {
  private _population = 1;
  private readonly borders: Borders;

  get population() {
    return this._population;
  }

  get border() {
    return this.borders.getBorderFor(this);
  }

  constructor(position: HexCoordinate, borders: Borders) {
    super(position);
    this.borders = borders;
    this.borders.claimBorder(this, createArea(1, this.position));
    this.borders.acquireUnclaimedBorderFor(
      this,
      createArea(CITY_BORDER_RADIUS, this.position),
    );
  }

  advanceToNextTurn = noop;

  addVillager() {
    this._population++;
  }

  canPromoteToCity() {
    return this.population === SETTLEMENT_POPULATION_FOR_PROMOTION;
  }
}

function noop() {}
