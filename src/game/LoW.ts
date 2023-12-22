import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createHex } from "./HexGraphics";
import { Vec2 } from "../lib/Vec2";
import { pixelToHex, hexToPixel } from "../lib/hex/HexCoordinatesConversion";
import { world } from "./World";

const SCALE = Vec2.ONE.scale(100);
const UNIT_HEX = createHex({ radius: SCALE.x, lineWidth: 10 });

export class LoW extends PixiApplicationBase {
  private map = new Container();

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
    for (const { position, color } of world.values()) {
      const p = hexToPixel(position, SCALE);
      const hex = UNIT_HEX.clone();
      hex.tint = color;
      hex.position.copyFrom(p);
      this.map.addChild(hex);
    }

    this.map.scale.set(0.5);
    this.app.stage.addChild(this.map);
    this.resize();
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}
