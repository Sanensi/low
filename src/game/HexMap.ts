import { assert } from "../lib/Assertion";
import { Vec2 } from "../lib/Vec2";
import { hexToDoubleHeightCoordinates } from "../lib/hex/HexCoordinatesConversion";
import { HexMap } from "../lib/hex/HexMap";
import { Hex } from "./Hex";

export function serialize(map: HexMap<Hex>) {
  const coords = map
    .values()
    .map((hex) => hexToDoubleHeightCoordinates(hex.position));

  const originOffset = findMinimumVec(coords);

  const lines = [`origin offset: (${originOffset.x}, ${originOffset.y})`];
  const array2d: string[][] = [];

  for (const vec of coords) {
    const offsetVec = vec.substract(originOffset);
    assert(offsetVec.x >= 0 && offsetVec.y >= 0);

    if (!array2d[offsetVec.y]) {
      array2d[offsetVec.y] = [];
    }

    array2d[offsetVec.y][offsetVec.x] = "0";
  }

  for (const line of array2d.values()) {
    lines.push([...(line ?? []).values()].map((v) => v ?? " ").join(""));
  }

  return lines.join("\n");
}

function findMinimumVec(vectors: Vec2[]) {
  let minVec = new Vec2(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

  for (const vec of vectors) {
    if (vec.x < minVec.x) {
      minVec = new Vec2(vec.x, minVec.y);
    }
    if (vec.y < minVec.y) {
      minVec = new Vec2(minVec.x, vec.y);
    }
  }

  return minVec;
}
