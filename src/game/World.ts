import { throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { Hex } from "./Hex";

export function applyPlannedMovements(world: HexMap<Hex>) {
  world.values().forEach((hex) => {
    if (hex.unit?.plannedPath) {
      const targetPosition =
        hex.unit.plannedPath[hex.unit.plannedPath.length - 1];
      const targetHex = world.get(targetPosition) ?? throwError();
      targetHex.unit = hex.unit;
      hex.unit.position = targetPosition;
      hex.unit.clearPlannedPath();
      hex.unit = undefined;
    }
  });
}

export function isGoingToBeOccupied(coord: HexCoordinate, world: HexMap<Hex>) {
  return world.values().some((hex) => {
    if (hex.unit?.plannedPath) {
      const destination = hex.unit.plannedPath[hex.unit.plannedPath.length - 1];
      return coord.equals(destination);
    } else {
      return coord.equals(hex.unit?.position);
    }
  });
}
