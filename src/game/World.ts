import { assert, throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { Hex, HexCity, HexFarm, HexField } from "./Hex";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { Unit, Villager } from "./Unit";

export class World {
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

  advanceToNextTurn() {
    this.applyPlannedMovements();
    this.map.values().forEach((hex) => hex.advanceToNextTurn());
    this.selectedUnit = undefined;
    this.reachableHexes = undefined;
  }

  select(coord: HexCoordinate): asserts this is World & { selectedHex: Hex } {
    this.selectedHex?.unselect();
    this.selectedCoords = coord;
    this.selectedHex?.select();
    assert(this.selectedHex);
  }

  selectUnit() {
    if (this.selectedHex?.unit) {
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

  unselectUnit() {
    if (this.selectedUnit) {
      this.selectedUnit = undefined;
      this.reachableHexes = undefined;
    }
  }

  moveSelectedUnit() {
    if (
      this.selectedUnit &&
      this.selectedHex &&
      this.reachableHexes?.some((hex) => hex.equals(this.selectedHex?.position))
    ) {
      const { shortestPath } = findShortestPath(
        this.selectedUnit.position,
        this.selectedHex.position,
        this.map,
      );

      this.selectedUnit.setPlannedPath(shortestPath);
      this.selectedUnit = undefined;
      this.reachableHexes = undefined;
    }
  }

  cancelSelectedUnitMovement() {
    if (this.selectedUnit && this.selectedUnit.plannedPath) {
      this.selectedUnit.clearPlannedPath();
    }
  }

  createFarm() {
    if (
      this.selectedHex instanceof HexField &&
      this.selectedHex.unit instanceof Villager &&
      this.selectedHex.position
        .neighbors()
        .some(
          (neighbor) =>
            this.map.get(neighbor) instanceof HexCity ||
            this.map.get(neighbor) instanceof HexFarm,
        )
    ) {
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

  growCity() {
    const selectedNeighborCityHexesThatCanGrow = this.selectedHex?.position
      .neighbors()
      .map((coord) => this.map.get(coord))
      .filter((hex): hex is HexCity => hex instanceof HexCity && hex.canGrow());

    if (
      (this.selectedHex instanceof HexField ||
        this.selectedHex instanceof HexFarm) &&
      selectedNeighborCityHexesThatCanGrow &&
      selectedNeighborCityHexesThatCanGrow.length > 0
    ) {
      const cityHex = selectedNeighborCityHexesThatCanGrow[0];
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
