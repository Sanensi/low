import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createHexGraphic, createWorldGraphics } from "./HexGraphics";
import { Vec2 } from "../lib/Vec2";
import { pixelToHex } from "../lib/hex/HexCoordinatesConversion";
import { World } from "./World";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";

const SCALE = Vec2.ONE.scale(100);
const HEX_TEMPLATE = createHexGraphic({ radius: SCALE.x, lineWidth: 10 });

const fields = createArea(3).map(
  (coord): Hex => ({
    position: coord,
    color: 0x00c040,
  }),
);
const world = new World(fields);
const city: Hex = {
  position: HexCoordinate.ZERO,
  color: 0x808080,
};
world.update(city);

export class LoW extends PixiApplicationBase {
  private map = new Container();
  private worldGraphics = createWorldGraphics(
    HEX_TEMPLATE,
    [...world.getHexes()].map(({ position }) => position),
    SCALE,
  );

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, { backgroundColor: "#ffffff", antialias: true });
    this.init();

    this.map.eventMode = "static";
    this.map.addEventListener("click", (e) => {
      const p = e.getLocalPosition(this.map);
      console.log(pixelToHex(new Vec2(p), SCALE));
    });
  }

  protected start(): void {
    for (const hex of this.worldGraphics.values()) {
      this.map.addChild(hex);
    }
    this.map.scale.set(0.5);
    this.app.stage.addChild(this.map);
    this.resize();
  }

  protected update(): void {
    for (const hex of world.getHexes()) {
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
