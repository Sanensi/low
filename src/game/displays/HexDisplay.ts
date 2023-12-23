import { Graphics } from "pixi.js";
import { Vec2 } from "../../lib/Vec2";
import { Hex, HexField, HexCity } from "../Hex";
import { getUnitDisplay } from "./UnitDisplay";

export const SCALE = Vec2.ONE.scale(100);
const VERTICES = Array.from({ length: 6 }, (_, i) =>
  flatHexCorner(Vec2.ZERO, SCALE, i),
);

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
    hexGraphics.addChild(getUnitDisplay(hex.unit));
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