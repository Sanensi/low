import { assert, throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { Hex } from "./Hex";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { Unit } from "./Unit";

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
