import { throwError } from "../lib/Assertion";
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
