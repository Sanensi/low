import { HexCoordinate } from "../lib/HexCoordinate";
import { createRing } from "../lib/HexCoordinatesFactory";
import { Hex } from "./Hex";

const coordinates = [HexCoordinate.ZERO, ...createRing(1)];

export const WORLD: Hex[] = coordinates.map(
  (coord): Hex => ({
    position: coord,
    color: 0x00c040,
  }),
);
