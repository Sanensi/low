import { assert, throwError } from "../lib/Assertion";
import { Vec2 } from "../lib/Vec2";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import {
  doubleWidthCoordinatesToHex,
  hexToDoubleWidthCoordinates,
} from "../lib/hex/HexCoordinatesConversion";
import { HexMap } from "../lib/hex/HexMap";
import { World } from "./World";
import { Hex, HexFarm, HexField, HexWater } from "./hexes/Hex";
import { HexCity } from "./hexes/HexCity";

export function serialize(map: HexMap<Hex>) {
  const coords = map
    .values()
    .map((hex) => hexToDoubleWidthCoordinates(hex.position));

  const originOffset = findMinimumVec(coords);

  const lines = [`origin offset: (${originOffset.x}, ${originOffset.y})`];
  const array2d: string[][] = [];

  for (const vec of coords) {
    const hexCoord = doubleWidthCoordinatesToHex(vec);
    const hex = map.get(hexCoord) ?? throwError();
    const offsetVec = vec.substract(originOffset);
    assert(offsetVec.x >= 0 && offsetVec.y >= 0);

    if (!array2d[offsetVec.y]) {
      array2d[offsetVec.y] = [];
    }

    if (hex instanceof HexField) {
      array2d[offsetVec.y][offsetVec.x] = "0";
    } else if (hex instanceof HexWater) {
      array2d[offsetVec.y][offsetVec.x] = "w";
    } else if (hex instanceof HexCity) {
      array2d[offsetVec.y][offsetVec.x] = "c";
    } else {
      throw new Error("Unsupported hex type");
    }
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

export function deserialize(mapAsString: string) {
  const [firstLine, ...hexes] = mapAsString.split("\n");
  const [, x, y] =
    firstLine.match(/\((-?\d+), (-?\d+)\)/) ??
    throwError("Couldn't parse origin offset");
  const originOffset = new Vec2(Number.parseInt(x), Number.parseInt(y));

  const map = new HexMap<Hex>();
  const coordsToBeConvertedToFarms = new Array<HexCoordinate>();

  for (let y = 0; y < hexes.length; y++) {
    for (let x = 0; x < hexes[y].length; x++) {
      const doubleWidthCoord = new Vec2(x, y).add(originOffset);
      const coord = doubleWidthCoordinatesToHex(doubleWidthCoord);
      const hex = hexes[y][x];

      const isDecimalCoord =
        !Number.isInteger(coord.q) ||
        !Number.isInteger(coord.r) ||
        !Number.isInteger(coord.s);
      if (isDecimalCoord && hex !== " ") {
        throw new Error(
          `The "${hex}" symbol at position (${x}, ${y}) is not at a valid hex position`,
        );
      }

      if (hex === "0") {
        map.set(coord, new HexField(coord));
      } else if (hex === "w") {
        map.set(coord, new HexWater(coord));
      } else if (hex === "c") {
        map.set(coord, new HexCity(coord));
      } else if (hex === "f") {
        coordsToBeConvertedToFarms.push(coord);
      } else if (hex !== " ") {
        throw new Error(`Unsupported symbol at position (${x}, ${y}): ${hex}`);
      }
    }
  }

  for (const farmCoord of coordsToBeConvertedToFarms) {
    const neighboringCities = farmCoord
      .neighbors()
      .map((coord) => map.get(coord))
      .filter((hex): hex is HexCity => hex instanceof HexCity);

    const p = hexToDoubleWidthCoordinates(farmCoord);
    assert(
      neighboringCities.length === 1,
      `Expected farm at (${p.x}, ${p.y}) to be neighbor of exactly one city`,
    );

    const city = neighboringCities[0];
    const farm = new HexFarm(farmCoord, city);
    city.addFarm(farm);
    map.set(farmCoord, farm);
  }

  return new World(map);
}
