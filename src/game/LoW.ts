import { Container } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexField, HexWater } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { drawHex } from "./displays/HexDisplay";
import { throwError } from "../lib/Assertion";
import { Unit } from "./Unit";
import { findReachableHex } from "./HexPaths";

const fields = createArea(4).map((coord) => new HexField(coord));
const world = new HexMap<Hex>(fields.map((hex) => [hex.position, hex]));

const city = new HexCity(HexCoordinate.ZERO);
world.set(city.position, city);

const water = [
  new HexCoordinate(1, 3, -4),
  new HexCoordinate(0, 3, -3),
  new HexCoordinate(1, 1, -2),
  new HexCoordinate(2, 0, -2),
  new HexCoordinate(2, -1, -1),
  new HexCoordinate(2, -2, 0),
  new HexCoordinate(1, -2, 1),
  new HexCoordinate(0, -2, 2),
  new HexCoordinate(0, -3, 3),
  new HexCoordinate(1, -4, 3),
];
water.forEach((coord) => {
  world.set(coord, new HexWater(coord));
});

const worldGraphics = createWorldGraphics(world.keys());

export class LoW extends PixiApplicationBase {
  private world = world;
  private currentTurn = 1;

  private selectedCoords?: HexCoordinate;
  private get selectedHex() {
    return this.world.get(this.selectedCoords);
  }

  private selectedUnit?: Unit;
  private reachableHexes?: HexCoordinate[];

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
    this.map.sortableChildren = true;
    this.map.scale.set(0.4);
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
        }
        break;
      case "s":
        if (this.selectedHex?.unit) {
          this.selectedUnit = this.selectedHex.unit;
          this.selectedUnit.select();
          this.reachableHexes = findReachableHex(
            this.selectedHex.position,
            this.selectedHex.unit.movement,
            this.world,
          );
        }
        break;
      case "u":
        if (this.selectedUnit) {
          this.selectedUnit.unselect();
          this.selectedUnit = undefined;
          this.reachableHexes = undefined;
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
    this.selectedHex?.unselect();
    this.selectedCoords = coord;
    this.selectedHex?.select();

    console.log(this.selectedHex);

    const actionDescription = ["Actions:"];
    if (this.selectedHex) {
      if (
        this.selectedHex instanceof HexCity &&
        this.selectedHex.canCreateVillager()
      ) {
        actionDescription.push("\t[v]: Create Villager (-5 food)");
      }

      if (this.selectedHex.unit) {
        actionDescription.push("\t[s]: Select Unit");
      }
    }

    if (this.selectedUnit) {
      actionDescription.push("\t[u]: Unselect Unit");
    }

    if (actionDescription.length === 1) {
      actionDescription.push("\tNo action available");
    }

    console.log(actionDescription.join("\n"));
  }

  protected update(): void {
    for (const hex of this.world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position) ?? throwError();
      drawHex(hex, hexGraphic);
    }

    for (const coord of this.reachableHexes ?? []) {
      const hexGraphic = this.worldGraphics.get(coord) ?? throwError();
      hexGraphic.alpha = 0.5;
    }
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}
