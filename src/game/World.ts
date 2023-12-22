import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex } from "./Hex";

const coords = createArea(3);
export const world = new Map(
  coords.map((coord): [string, Hex] => [
    coord.toString(),
    {
      position: coord,
      color: 0x00c040,
    },
  ]),
);

const city: Hex = {
  position: HexCoordinate.ZERO,
  color: 0x808080,
};

world.set(city.position.toString(), city);
