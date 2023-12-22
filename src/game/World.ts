import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { createRing } from "../lib/hex/HexCoordinatesFactory";
import { Hex } from "./Hex";

const coordinates = [HexCoordinate.ZERO, ...createRing(1)];

export const WORLD: Hex[] = coordinates.map(
  (coord): Hex => ({
    position: coord,
    color: 0x00c040,
  }),
);
