import { Graphics } from "pixi.js";
import { Vec2 } from "../../lib/Vec2";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { hexToPixel } from "../../lib/hex/HexCoordinatesConversion";
import { HexMap } from "../../lib/hex/HexMap";
import { Hex, HexCity, HexField } from "../Hex";

const SCALE = Vec2.ONE.scale(100);
const VERTICES = Array.from({ length: 6 }, (_, i) =>
  flatHexCorner(Vec2.ZERO, SCALE, i),
);

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

type HexAttributes = {
  fillCollor: number;
};

export function drawHex(hex: Hex, hexGraphics: Graphics) {
  const { fillCollor } = mapHexToAttributes(hex);

  hexGraphics.clear();
  hexGraphics.beginFill(fillCollor);
  hexGraphics.lineStyle({ width: 10, color: 0x000000 });
  hexGraphics.moveTo(VERTICES[0].x, VERTICES[0].y);
  for (let i = 0; i < VERTICES.length + 2; i++) {
    const vertice = VERTICES[i % VERTICES.length];
    hexGraphics.lineTo(vertice.x, vertice.y);
  }
  hexGraphics.endFill();

  if (hex.unit) {
    hexGraphics.addChild(hex.unit.display);
  } else {
    hexGraphics.removeChildren();
  }
}

function mapHexToAttributes(hex: Hex): HexAttributes {
  if (hex instanceof HexField) {
    return {
      fillCollor: 0x00c040,
    };
  }

  if (hex instanceof HexCity) {
    return {
      fillCollor: 0x808080,
    };
  }

  throw new Error("Unsupported hex type");
}

function flatHexCorner(center: Vec2, scale: Vec2, i: number) {
  const angleDeg = 60 * i;
  const angleRad = (Math.PI / 180) * angleDeg;
  return new Vec2(
    center.x + scale.x * Math.cos(angleRad),
    center.y + scale.y * Math.sin(angleRad),
  );
}
