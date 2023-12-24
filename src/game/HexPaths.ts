import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";

export interface Traversable {
  readonly isTraversable: boolean;
}

export function findReachableHex(
  origin: HexCoordinate,
  range: number,
  world: HexMap<Traversable>,
) {
  const visited = [origin];
  const fringes = [[origin]];

  for (let step = 1; step <= range; step++) {
    fringes.push([]);
    for (const coord of fringes[step - 1]) {
      for (const neighborCoord of coord.neighbors()) {
        const neighborHex = world.get(neighborCoord);
        if (
          neighborHex &&
          neighborHex.isTraversable &&
          !visited.some((coord) => coord.equals(neighborCoord))
        ) {
          visited.push(neighborCoord);
          fringes[step].push(neighborCoord);
        }
      }
    }
  }

  return visited.filter((coord) => !origin.equals(coord));
}
