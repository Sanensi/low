import { Graphics } from "pixi.js";
import { Vec2 } from "../../lib/Vec2";
import { Hex, HexField, HexCity } from "../Hex";
import { getUnitDisplay } from "./UnitDisplay";

export const SCALE = Vec2.ONE.scale(100);
const VERTICES = Array.from({ length: 6 }, (_, i) =>
  flatHexCorner(Vec2.ZERO, SCALE, i),
);

type HexAttributes = {
  fillColor: number;
  strokeColor: number;
  zIndex: number;
};

export function drawHex(hex: Hex, hexGraphics: Graphics) {
  const { fillColor, strokeColor, zIndex } = mapHexToAttributes(hex);

  hexGraphics.clear();
  hexGraphics.beginFill(fillColor);
  hexGraphics.lineStyle({ width: 10, color: strokeColor });
  hexGraphics.moveTo(VERTICES[0].x, VERTICES[0].y);
  for (let i = 0; i < VERTICES.length + 2; i++) {
    const vertice = VERTICES[i % VERTICES.length];
    hexGraphics.lineTo(vertice.x, vertice.y);
  }
  hexGraphics.endFill();
  hexGraphics.zIndex = zIndex;

  if (hex.unit) {
    hexGraphics.addChild(getUnitDisplay(hex.unit));
  } else {
    hexGraphics.removeChildren();
  }
}

function mapHexToAttributes(hex: Hex): HexAttributes {
  const attributes: HexAttributes = {
    fillColor: 0xffffff,
    strokeColor: 0x000000,
    zIndex: 0,
  };

  if (hex instanceof HexField) {
    attributes.fillColor = 0x00c040;
  }

  if (hex instanceof HexCity) {
    attributes.fillColor = 0x808080;
  }

  if (hex.isSelected) {
    attributes.strokeColor = 0x0000ff;
    attributes.zIndex = 1;
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
