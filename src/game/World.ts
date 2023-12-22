import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex } from "./Hex";

const coordinates = createArea(3);

export const WORLD: Hex[] = coordinates.map(
  (coord): Hex => ({
    position: coord,
    color: 0x00c040,
  }),
);
