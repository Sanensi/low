import { Graphics } from "pixi.js";
import { Vec2 } from "../lib/Vec2";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { hexToPixel } from "../lib/hex/HexCoordinatesConversion";

type Props = { radius: number; lineWidth: number };

export function createHexGraphic({
  radius = 100,
  lineWidth = 1,
}: Partial<Props> = {}) {
  const vertices = Array.from({ length: 6 }, (_, i) =>
    flatHexCorner(Vec2.ZERO, radius, i),
  );

  const hex = new Graphics();
  hex.beginFill(0xffffff);
  hex.lineStyle({ width: lineWidth, color: 0x000000 });
  hex.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 0; i < vertices.length + 2; i++) {
    const vertice = vertices[i % vertices.length];
    hex.lineTo(vertice.x, vertice.y);
  }
  hex.endFill();

  return hex;
}

function flatHexCorner(center: Vec2, size: number, i: number) {
  const angleDeg = 60 * i;
  const angleRad = (Math.PI / 180) * angleDeg;
  return new Vec2(
    center.x + size * Math.cos(angleRad),
    center.y + size * Math.sin(angleRad),
  );
}

export function createWorldGraphics(
  hexTemplate: Graphics,
  coordinates: HexCoordinate[],
  scaleFactor: Vec2,
) {
  return new Map(
    coordinates.map((coord) => {
      const position = hexToPixel(coord, scaleFactor);
      const hex = hexTemplate.clone();
      hex.position.copyFrom(position);
      return [coord.toString(), hex];
    }),
  );
}
