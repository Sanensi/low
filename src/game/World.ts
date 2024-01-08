import { assert, throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { Hex, HexCity, HexFarm, HexField } from "./Hex";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { Unit, Villager } from "./Unit";

export class World implements Iterable<Hex> {
  private map = new HexMap<Hex>();

  private selectedCoords?: HexCoordinate;
  get selectedHex() {
    return this.map.get(this.selectedCoords);
  }

  selectedUnit?: Unit;
  reachableHexes?: HexCoordinate[];

  constructor(hexMap: HexMap<Hex>) {
    this.map = hexMap;
  }

  [Symbol.iterator](): IterableIterator<Hex> {
    return this.map.values()[Symbol.iterator]();
  }

  advanceToNextTurn() {
    this.applyPlannedMovements();
    this.map.values().forEach((hex) => hex.advanceToNextTurn());
    this.selectedUnit = undefined;
    this.reachableHexes = undefined;
  }

  select(coord: HexCoordinate): asserts this is this & { selectedHex: Hex } {
    this.selectedHex?.unselect();
    this.selectedCoords = coord;
    this.selectedHex?.select();
    assert(this.selectedHex);
  }

  canSelectUnit(): this is this & { selectedHex: Hex & { unit: Unit } } {
    return !!this.selectedHex?.unit;
  }

  selectUnit() {
    if (this.canSelectUnit()) {
      this.selectedUnit = this.selectedHex.unit;
      const origin = this.selectedUnit.position;
      this.reachableHexes = findReachableHex(
        origin,
        this.selectedHex.unit.movement,
        this.map,
      )
        .filter((coord) => !origin.equals(coord))
        .filter((reachableCoord) => !this.isGoingToBeOccupied(reachableCoord));
    }
  }

  canUnselectUnit() {
    return !!this.selectedUnit;
  }

  unselectUnit() {
    if (this.canUnselectUnit()) {
      this.selectedUnit = undefined;
      this.reachableHexes = undefined;
    }
  }

  canMoveSelectedUnit(): this is this & {
    selectedUnit: Unit;
    selectedHex: Hex;
  } {
    return !!(
      this.selectedUnit &&
      this.selectedHex &&
      this.reachableHexes?.some((hex) => hex.equals(this.selectedHex?.position))
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
      this.selectedUnit = undefined!;
      this.reachableHexes = undefined;
    }
  }

  canCancelSelectedUnitMovement(): this is this & {
    selectedUnit: Unit & { plannedPath: HexCoordinate[] };
  } {
    return !!(this.selectedUnit && this.selectedUnit.plannedPath);
  }

  cancelSelectedUnitMovement() {
    if (this.canCancelSelectedUnitMovement()) {
      this.selectedUnit.clearPlannedPath();
      this.selectedUnit = undefined!;
      this.reachableHexes = undefined;
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
      const neighbors = hexField.position
        .neighbors()
        .map((coord) => this.map.get(coord));
      const neighborCity =
        neighbors.filter((hex): hex is HexCity => hex instanceof HexCity)[0] ??
        neighbors.filter((hex): hex is HexFarm => hex instanceof HexFarm)[0]
          .associatedCity;

      const hexFarm = new HexFarm(this.selectedHex.position, neighborCity);
      this.map.set(hexFarm.position, hexFarm);

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

  private applyPlannedMovements() {
    this.map.values().forEach((hex) => {
      if (hex.unit?.plannedPath) {
        const targetPosition =
          hex.unit.plannedPath[hex.unit.plannedPath.length - 1];
        const targetHex = this.map.get(targetPosition) ?? throwError();
        targetHex.unit = hex.unit;
        hex.unit.position = targetPosition;
        hex.unit.clearPlannedPath();
        hex.unit = undefined;
      }
    });
  }
}
