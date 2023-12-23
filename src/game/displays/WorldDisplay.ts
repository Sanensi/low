import { Graphics } from "pixi.js";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { hexToPixel } from "../../lib/hex/HexCoordinatesConversion";
import { HexMap } from "../../lib/hex/HexMap";
import { SCALE } from "./HexDisplay";

export function createWorldGraphics(coordinates: HexCoordinate[]) {
  return new HexMap(
    coordinates.map((coord) => {
      const position = hexToPixel(coord, SCALE);
      const hex = new Graphics();
      hex.position.copyFrom(position);
      return [coord, hex];
    }),
  );
}
