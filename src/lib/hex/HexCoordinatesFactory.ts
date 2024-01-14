import { HexCoordinate } from "./HexCoordinate";

export function createRing(radius = 1, center = HexCoordinate.ZERO) {
  const ring: HexCoordinate[] = [];

  let hex = center.add(HexCoordinate.flatDirection("2h").scale(radius));
  const directions = [
    HexCoordinate.flatDirection("6h"),
    HexCoordinate.flatDirection("8h"),
    HexCoordinate.flatDirection("10h"),
    HexCoordinate.flatDirection("12h"),
    HexCoordinate.flatDirection("2h"),
    HexCoordinate.flatDirection("4h"),
  ];

  for (const direction of directions) {
    for (let step = 0; step < radius; step++) {
      ring.push(hex);
      hex = hex.add(direction);
    }
  }

  return ring;
}

export function createArea(radius = 1, center = HexCoordinate.ZERO) {
  const area = [center];

  for (let currentRadius = 1; currentRadius <= radius; currentRadius++) {
    area.push(...createRing(currentRadius, center));
  }

  return area;
}
