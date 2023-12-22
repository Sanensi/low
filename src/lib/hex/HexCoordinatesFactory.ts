import { HexCoordinate } from "./HexCoordinate";

export function createRing(radius = 1, center = new HexCoordinate(0, 0, 0)) {
  const ring: HexCoordinate[] = [];

  let hex = center.add(HexCoordinate.direction("2h").scale(radius));
  const directions = [
    HexCoordinate.direction("6h"),
    HexCoordinate.direction("8h"),
    HexCoordinate.direction("10h"),
    HexCoordinate.direction("12h"),
    HexCoordinate.direction("2h"),
    HexCoordinate.direction("4h"),
  ];

  for (const direction of directions) {
    for (let step = 0; step < radius; step++) {
      ring.push(hex);
      hex = hex.add(direction);
    }
  }

  return ring;
}
