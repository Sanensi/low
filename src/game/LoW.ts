import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics, drawHex } from "./graphics/WorldGraphics";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexField } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";

const fields = createArea(3).map((coord) => new HexField(coord));
const world = new HexMap<Hex>(fields.map((hex) => [hex.position, hex]));
const city = new HexCity(HexCoordinate.ZERO);
world.set(city.position, city);

const worldGraphics = createWorldGraphics(world.keys());

export class LoW extends PixiApplicationBase {
  private world = world;
  private currentTurn = 1;
  private selectedCoords?: HexCoordinate;
  private get selectedHex() {
    return this.world.get(this.selectedCoords);
  }

  private map = new Container();
  private worldGraphics = worldGraphics;

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
    console.log("Press [Enter] to advance to next turn");
  }

  private onKeyPress(key: string) {
    switch (key) {
      case "Enter":
        this.advanceToNextTurn();
        break;
      case "v":
        if (this.selectedHex instanceof HexCity) {
          this.selectedHex.createVillager();
          console.log(this.selectedHex);
        }
        break;
    }
  }

  private advanceToNextTurn() {
    this.currentTurn++;
    this.selectedCoords = undefined;

    this.world.values().forEach((hex) => hex.advanceToNextTurn());
    console.log("Current turn:", this.currentTurn);
  }

  private onHexClick(coord: HexCoordinate) {
    this.selectedCoords = coord;

    console.log(this.selectedHex, this.worldGraphics.get(coord));
    if (this.selectedHex instanceof HexCity) {
      console.log(`Actions:
\t[v]: Create Villager (-5 food)`);
    }
  }

  protected update(): void {
    for (const hex of this.world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position) ?? throwError();
      drawHex(hex, hexGraphic);
    }
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}

function throwError(msg?: string): never {
  throw new Error(msg);
}
