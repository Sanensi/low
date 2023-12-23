import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createHexGraphic, createWorldGraphics } from "./HexGraphics";
import { Vec2 } from "../lib/Vec2";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexField } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";

const SCALE = Vec2.ONE.scale(100);
const HEX_TEMPLATE = createHexGraphic({ radius: SCALE.x, lineWidth: 10 });

const fields = createArea(3).map((coord) => new HexField(coord));
const world = new HexMap<Hex>(fields.map((hex) => [hex.position, hex]));
const city = new HexCity(HexCoordinate.ZERO);
world.set(city.position, city);

export class LoW extends PixiApplicationBase {
  private world = world;
  private currentTurn = 1;

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
    window.addEventListener("keypress", (e) => this.onKeyPress(e.key));
    for (const [coord, hexGraphic] of this.worldGraphics.entries()) {
      hexGraphic.eventMode = "static";
      hexGraphic.addEventListener("click", () => this.onHexClick(coord));
      this.map.addChild(hexGraphic);
    }
    this.map.scale.set(0.5);
    this.app.stage.addChild(this.map);
    this.resize();

    console.log("Current turn:", this.currentTurn);
  }

  private onKeyPress(key: string) {
    switch (key) {
      case "Enter":
        this.advanceToNextTurn();
        break;
    }
  }

  private advanceToNextTurn() {
    this.currentTurn++;
    this.world.values().forEach((hex) => hex.advanceToNextTurn());
    console.log("Current turn:", this.currentTurn);
  }

  private onHexClick(coord: HexCoordinate) {
    console.log(this.world.get(coord));
  }

  protected update(): void {
    for (const hex of this.world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position);
      if (hexGraphic) {
        hexGraphic.tint = hex.color;
      }
    }
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}
