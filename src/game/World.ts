import { assert, throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap, ReadonlyHexMap } from "../lib/hex/HexMap";
import { Borders } from "./Borders";
import { Hex, HexFarm, HexField } from "./hexes/Hex";
import { HexCity, HexSettlement } from "./hexes/HexCity";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { Unit, Villager } from "./Unit";

export interface ReadonlyWorld {
  readonly map: ReadonlyHexMap<Hex>;
}

export class World implements Iterable<Hex>, ReadonlyWorld {
  readonly map = new HexMap<Hex>();
  private readonly borders: Borders;

  private selectedCoords?: HexCoordinate;
  get selectedHex() {
    return this.map.get(this.selectedCoords);
  }

  private _selectedUnit?: Unit;
  get selectedUnit() {
    return this._selectedUnit;
  }

  private _reachableHexes?: HexCoordinate[];
  get reachableHexes() {
    return this._reachableHexes;
  }

  constructor(hexMap: HexMap<Hex>, borders: Borders) {
    this.map = hexMap;
    this.borders = borders;
  }

  [Symbol.iterator](): IterableIterator<Hex> {
    return this.map.values()[Symbol.iterator]();
  }

  has(coord: HexCoordinate) {
    return this.map.has(coord);
  }

  advanceToNextTurn() {
    this.applyPlannedMovements();
    this.map.values().forEach((hex) => hex.advanceToNextTurn());
    this._selectedUnit = undefined;
    this._reachableHexes = undefined;
  }

  private applyPlannedMovements() {
    const targetPositions = new Array<[Unit, HexCoordinate]>();

    this.map.values().forEach((hex) => {
      if (hex.unit?.plannedPath) {
        const targetPosition =
          hex.unit.plannedPath[hex.unit.plannedPath.length - 1];
        targetPositions.push([hex.unit, targetPosition]);
        hex.unit.clearPlannedPath();
        hex.unit = undefined;
      }
    });

    for (const [unit, targetPosition] of targetPositions) {
      const targetHex = this.map.get(targetPosition) ?? throwError();
      targetHex.unit = unit;
      unit.position = targetPosition;
    }
  }

  select(coord: HexCoordinate): asserts this is this & { selectedHex: Hex } {
    this.selectedCoords = coord;
    assert(this.selectedHex);
  }

  canSelectUnit(): this is this & { selectedHex: Hex & { unit: Unit } } {
    return !!this.selectedHex?.unit;
  }

  selectUnit() {
    if (this.canSelectUnit()) {
      this._selectedUnit = this.selectedHex.unit;
      const origin = this._selectedUnit.position;
      this._reachableHexes = findReachableHex(
        origin,
        this.selectedHex.unit.movement,
        this.map,
      )
        .filter((coord) => !origin.equals(coord))
        .filter((reachableCoord) => !this.isGoingToBeOccupied(reachableCoord));
    }
  }

  private isGoingToBeOccupied(coord: HexCoordinate) {
    return this.map.values().some((hex) => {
      if (hex.unit?.plannedPath) {
        const destination =
          hex.unit.plannedPath[hex.unit.plannedPath.length - 1];
        return coord.equals(destination);
      } else {
        return coord.equals(hex.unit?.position);
      }
    });
  }

  canUnselectUnit() {
    return !!this._selectedUnit;
  }

  unselectUnit() {
    if (this.canUnselectUnit()) {
      this._selectedUnit = undefined;
      this._reachableHexes = undefined;
    }
  }

  canMoveSelectedUnit(): this is this & {
    selectedUnit: Unit;
    selectedHex: Hex;
  } {
    return !!(
      this._selectedUnit &&
      this.selectedHex &&
      this._reachableHexes?.some((hex) =>
        hex.equals(this.selectedHex?.position),
      )
    );
  }

  moveSelectedUnit() {
    if (this.canMoveSelectedUnit()) {
      const { shortestPath } = findShortestPath(
        this.selectedUnit.position,
        this.selectedHex.position,
        this.map,
      );

      this.selectedUnit.setPlannedPath(shortestPath);
      this._selectedUnit = undefined;
      this._reachableHexes = undefined;
    }
  }

  canCancelSelectedUnitMovement(): this is this & {
    selectedUnit: Unit & { plannedPath: HexCoordinate[] };
  } {
    return !!(this._selectedUnit && this._selectedUnit.plannedPath);
  }

  cancelSelectedUnitMovement() {
    if (this.canCancelSelectedUnitMovement()) {
      this.selectedUnit.clearPlannedPath();
      this._selectedUnit = undefined;
      this._reachableHexes = undefined;
    }
  }

  canCreateFarm(): this is this & {
    selectedHex: HexField & { unit: Villager };
  } {
    return (
      this.selectedHex instanceof HexField &&
      this.selectedHex.unit instanceof Villager &&
      this.selectedHex.position
        .neighbors()
        .some(
          (neighbor) =>
            this.map.get(neighbor) instanceof HexCity ||
            this.map.get(neighbor) instanceof HexFarm,
        )
    );
  }

  createFarm() {
    if (this.canCreateFarm()) {
      const hexField = this.selectedHex;
      const villager = this.selectedHex.unit;

      const hexFarm = new HexFarm(this.selectedHex.position);
      this.map.set(hexFarm.position, hexFarm);
      hexField.unit = undefined!;

      return villager;
    }
  }

  canGrowCity(): this is this & { selectedHex: Hex } {
    return (
      (this.selectedHex instanceof HexField ||
        this.selectedHex instanceof HexFarm) &&
      this.selectedHex.position.neighbors().some((neighborCoord) => {
        const neighborHex = this.map.get(neighborCoord);
        return neighborHex instanceof HexCity && neighborHex.canGrow();
      })
    );
  }

  growCity() {
    if (this.canGrowCity()) {
      const neighborCityHexesThatCanGrow = this.selectedHex.position
        .neighbors()
        .map((coord) => this.map.get(coord))
        .filter(
          (hex): hex is HexCity => hex instanceof HexCity && hex.canGrow(),
        );
      const cityHex = neighborCityHexesThatCanGrow[0];
      const cityExtension = cityHex.grow(this.selectedHex);
      this.map.set(this.selectedHex.position, cityExtension);
    }
  }

  canFoundNewSettlement(): this is this & {
    selectedHex: HexField & { unit: Villager };
  } {
    const existingCityBorders = this.map
      .values()
      .filter(
        (hex): hex is HexCity | HexSettlement =>
          hex instanceof HexCity || hex instanceof HexSettlement,
      )
      .flatMap((city) => city.border);

    const selectedHexOutsideExistingCityBorder = !existingCityBorders.some(
      (hex) => hex.equals(this.selectedHex?.position),
    );

    return (
      this.selectedHex instanceof HexField &&
      this.selectedHex.unit instanceof Villager &&
      selectedHexOutsideExistingCityBorder
    );
  }

  foundNewSettlement() {
    if (this.canFoundNewSettlement()) {
      const hexFields = this.selectedHex;
      const villager = this.selectedHex.unit;
      const settlement = new HexSettlement(
        this.selectedHex.position,
        this.borders,
      );
      this.map.set(settlement.position, settlement);
      hexFields.unit = undefined!;

      return villager;
    }
  }

  canJoinSettlement(): this is this & {
    selectedHex: Hex & { unit: Villager };
  } {
    const isOnSettlement = this.selectedHex instanceof HexSettlement;
    const isNextToSettlement = this.selectedHex?.position
      .neighbors()
      .some((coord) => this.map.get(coord) instanceof HexSettlement);

    return !!(
      this.selectedHex &&
      this.selectedHex.unit instanceof Villager &&
      (isOnSettlement || isNextToSettlement)
    );
  }

  joinSettlement() {
    if (this.canJoinSettlement()) {
      const villagerHex = this.selectedHex;
      const villager = this.selectedHex.unit;
      const settlement =
        this.selectedHex instanceof HexSettlement
          ? this.selectedHex
          : this.selectedHex.position
              .neighbors()
              .map((coord) => this.map.get(coord))
              .filter(
                (hex): hex is HexSettlement => hex instanceof HexSettlement,
              )[0];
      settlement.addVillager();
      villagerHex.unit = undefined!;

      if (settlement.canPromoteToCity()) {
        const city = new HexCity(this, settlement.position, this.borders);
        city.unit = settlement.unit;
        this.map.set(city.position, city);
        this.borders.transferOwnership(settlement, city);
      }

      return villager;
    }
  }
}
