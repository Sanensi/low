import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createHexGraphic, createWorldGraphics } from "./HexGraphics";
import { Vec2 } from "../lib/Vec2";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";

const SCALE = Vec2.ONE.scale(100);
const HEX_TEMPLATE = createHexGraphic({ radius: SCALE.x, lineWidth: 10 });

const fields = createArea(3).map(
  (coord): Hex => ({
    position: coord,
    color: 0x00c040,
    food: 0,
  }),
);
const world = new HexMap(fields.map((hex) => [hex.position, hex]));
const city: Hex = {
  position: HexCoordinate.ZERO,
  color: 0x808080,
  food: 25,
};
world.set(city.position, city);

export class LoW extends PixiApplicationBase {
  private map = new Container();
  private worldGraphics = createWorldGraphics(
    HEX_TEMPLATE,
    world.keys(),
    SCALE,
  );

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, { backgroundColor: "#ffffff", antialias: true });
    this.init();
  }

  protected start(): void {
    for (const hex of world.values()) {
      const hexGraphic =
        this.worldGraphics.get(hex.position.toString()) ?? throwError();
      hexGraphic.eventMode = "static";
      hexGraphic.addEventListener("click", () => {
        console.log(hex);
      });
      this.map.addChild(hexGraphic);
    }
    this.map.scale.set(0.5);
    this.app.stage.addChild(this.map);
    this.resize();
  }

  protected update(): void {
    for (const hex of world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position.toString());
      if (hexGraphic) {
        hexGraphic.tint = hex.color;
      }
    }
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}

function throwError(msg?: string): never {
  throw new Error(msg);
}
