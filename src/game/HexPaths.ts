import { assert, throwError } from "../lib/Assertion";
import { Comparer, Heap } from "../lib/Heap";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap, ReadonlyHexMap } from "../lib/hex/HexMap";

export interface Traversable {
  readonly isTraversable: boolean;
}

export function findReachableHex(
  origin: HexCoordinate,
  range: number,
  map: ReadonlyHexMap<Traversable>,
) {
  const visited = [origin];
  const fringes = [[origin]];

  for (let step = 1; step <= range; step++) {
    fringes.push([]);
    for (const coord of fringes[step - 1]) {
      for (const neighborCoord of coord.neighbors()) {
        const neighborHex = map.get(neighborCoord);
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

  return visited;
}

type HexDistancePair = [HexCoordinate, number];

const compareHexDistance: Comparer<HexDistancePair> = (
  [, distanceA],
  [, distanceB],
) => distanceB - distanceA;

export function findShortestPath(
  origin: HexCoordinate,
  destination: HexCoordinate,
  map: ReadonlyHexMap<Traversable>,
) {
  const frontier = new Heap(compareHexDistance);
  frontier.push([origin, 0]);

  const breadCrumbs = new HexMap<HexCoordinate | null>();
  const stepToReach = new HexMap<number>();
  breadCrumbs.set(origin, null);
  stepToReach.set(origin, 0);

  while (!frontier.isEmpty) {
    const [currentHex] = frontier.pop();

    if (currentHex.equals(destination)) {
      break;
    }

    const traversableNeighbors = currentHex
      .neighbors()
      .filter((neighbor) => map.get(neighbor)?.isTraversable);
    for (const nextNeighbor of traversableNeighbors) {
      const stepToReachNextNeighbor =
        (stepToReach.get(currentHex) ?? throwError()) + 1;

      if (
        !breadCrumbs.has(nextNeighbor) ||
        stepToReachNextNeighbor <
          (stepToReach.get(nextNeighbor) ?? throwError())
      ) {
        frontier.push([nextNeighbor, stepToReachNextNeighbor]);
        breadCrumbs.set(nextNeighbor, currentHex);
        stepToReach.set(nextNeighbor, stepToReachNextNeighbor);
      }
    }
  }

  let currentHex = breadCrumbs.get(destination);
  const shortestPath = [destination];
  while (currentHex !== null) {
    assert(currentHex);
    shortestPath.push(currentHex);
    currentHex = breadCrumbs.get(currentHex);
  }
  shortestPath.reverse();

  return {
    shortestPath,
    breadCrumbs,
    stepToReach,
  };
}
