import { Graphics, LINE_CAP } from "pixi.js";
import { Vec2 } from "../../lib/Vec2";
import { Hex, HexField, HexCity, HexWater, HexFarm } from "../Hex";
import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { pointyHexToPixel } from "../../lib/hex/HexCoordinatesConversion";

export const SCALE = Vec2.ONE.scale(100);
const VERTICES = Array.from({ length: 6 }, (_, i) =>
  pointyHexCorner(Vec2.ZERO, SCALE, i),
);

type HexAttributes = {
  fillColor: number;
  strokeColor: number;
  strokeWidth: number;
  zIndex: number;
};

export function drawHex(hex: Hex, hexGraphics: Graphics) {
  const { fillColor, strokeColor, strokeWidth, zIndex } =
    mapHexToAttributes(hex);

  hexGraphics.alpha = 1;
  hexGraphics.tint = 0xffffff;
  hexGraphics.clear();
  hexGraphics.beginFill(fillColor);
  hexGraphics.lineStyle({ width: strokeWidth, color: strokeColor });
  hexGraphics.moveTo(VERTICES[0].x, VERTICES[0].y);
  for (let i = 0; i < VERTICES.length + 2; i++) {
    const vertice = VERTICES[i % VERTICES.length];
    hexGraphics.lineTo(vertice.x, vertice.y);
  }
  hexGraphics.endFill();
  hexGraphics.zIndex = zIndex;
}

function mapHexToAttributes(hex: Hex): HexAttributes {
  const attributes: HexAttributes = {
    fillColor: 0xffffff,
    strokeColor: 0x000000,
    strokeWidth: 10,
    zIndex: 1,
  };

  if (hex instanceof HexField) {
    attributes.fillColor = 0x00c040;
  }

  if (hex instanceof HexWater) {
    attributes.fillColor = 0x0040c0;
    attributes.strokeWidth = 0;
    attributes.zIndex = 0;
  }

  if (hex instanceof HexCity) {
    attributes.fillColor = 0x808080;
  }

  if (hex instanceof HexFarm) {
    attributes.fillColor = 0xf5deb3;
  }

  if (hex.isSelected) {
    attributes.strokeColor = 0x0080ff;
    attributes.zIndex = 2;
  }

  return attributes;
}

function flatHexCorner(center: Vec2, scale: Vec2, i: number) {
  const angleDeg = 60 * i;
  const angleRad = (Math.PI / 180) * angleDeg;
  return new Vec2(
    center.x + scale.x * Math.cos(angleRad),
    center.y + scale.y * Math.sin(angleRad),
  );
}

function pointyHexCorner(center: Vec2, scale: Vec2, i: number) {
  const angle_deg = 60 * i - 30;
  const angle_rad = (Math.PI / 180) * angle_deg;
  return new Vec2(
    center.x + scale.x * Math.cos(angle_rad),
    center.y + scale.y * Math.sin(angle_rad),
  );
}

export function drawPlannedPath(path: HexCoordinate[], pathGraphics: Graphics) {
  pathGraphics.zIndex = 10;
  pathGraphics.beginFill(0xffffff, 0);
  pathGraphics.lineStyle({
    width: 10,
    color: 0x000000,
    cap: LINE_CAP.ROUND,
    alpha: 0.5,
  });
  const p0 = pointyHexToPixel(path[0], SCALE);
  pathGraphics.moveTo(p0.x, p0.y);
  for (let index = 1; index < path.length; index++) {
    const p = pointyHexToPixel(path[index], SCALE);
    pathGraphics.lineTo(p.x, p.y);
  }
  pathGraphics.endFill();
}
