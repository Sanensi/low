import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createHex } from "./HexGraphics";

export class LoW extends PixiApplicationBase {
  private map = new Container();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, { backgroundColor: "#ffffff", antialias: true });
    this.init();
  }

  protected start(): void {
    const hex = createHex();
    this.map.addChild(hex);
    this.app.stage.addChild(this.map);
    this.resize();
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}
