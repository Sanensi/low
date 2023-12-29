import { Graphics } from "pixi.js";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { pointyHexToPixel } from "../../lib/hex/HexCoordinatesConversion";
import { HexMap } from "../../lib/hex/HexMap";
import { SCALE } from "./HexDisplay";

export function createWorldGraphics(coordinates: HexCoordinate[]) {
  return new HexMap(
    coordinates.map((coord) => {
      const position = pointyHexToPixel(coord, SCALE);
      const hex = new Graphics();
      hex.position.copyFrom(position);
      return [coord, hex];
    }),
  );
}
