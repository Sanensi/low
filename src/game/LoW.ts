import { Graphics } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";

export class LoW extends PixiApplicationBase {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas, { backgroundColor: "#ffffff" });
    this.init();
  }

  protected start(): void {
    const g = new Graphics();
    g.beginFill("#000000");
    g.drawRect(50, 50, 50, 50);
    g.endFill();

    this.app.stage.addChild(g);
  }
}
