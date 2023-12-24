import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { Hex } from "./Hex";

export function findReachableHex(
  origin: HexCoordinate,
  range: number,
  world: HexMap<Hex>,
) {
  const visited = [origin];
  const fringes = [[origin]];

  for (let step = 1; step <= range; step++) {
    fringes.push([]);
    for (const coord of fringes[step - 1]) {
      for (const neighbor of coord.neighbors()) {
        const neighborHex = world.get(neighbor);
        if (neighborHex && !neighborHex.isObstacle) {
          visited.push(neighbor);
          fringes[step].push(neighbor);
        }
      }
    }
  }

  return visited.filter((coord) => !origin.equals(coord));
}
