import { Container, Graphics, LINE_CAP } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexField, HexWater } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { SCALE, drawHex } from "./displays/HexDisplay";
import { assert, throwError } from "../lib/Assertion";
import { Unit } from "./Unit";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { hexToPixel } from "../lib/hex/HexCoordinatesConversion";

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
const pathGraphics = new Graphics();
pathGraphics.zIndex = 10;

export class LoW extends PixiApplicationBase {
  private world = world;
  private currentTurn = 1;

  private highlightedCoords?: HexCoordinate;

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
      hexGraphic.addEventListener("mouseenter", () => {
        this.highlightedCoords = coord;
      });
      hexGraphic.addEventListener("mouseleave", () => {
        this.highlightedCoords = undefined;
      });
      this.map.addChild(hexGraphic);
    }

    this.map.addChild(pathGraphics);

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
      case "m":
        if (
          this.selectedUnit &&
          this.selectedCoords &&
          this.reachableHexes?.some((hex) => hex.equals(this.selectedCoords))
        ) {
          const { breadCrumbs } = findShortestPath(
            this.selectedUnit.position,
            this.selectedCoords,
            this.world,
          );

          let currentHex = breadCrumbs.get(this.selectedCoords);
          const path = [this.selectedCoords];
          while (currentHex !== null) {
            assert(currentHex);
            path.push(currentHex);
            currentHex = breadCrumbs.get(currentHex);
          }
          path.reverse();

          this.selectedUnit.setPlannedPath(path);
          this.selectedUnit.unselect();
          this.selectedUnit = undefined;
          this.reachableHexes = undefined;
        }
        break;
      case "c":
        if (this.selectedUnit && this.selectedUnit.plannedPath) {
          this.selectedUnit.cleatPlannedPath();
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

    if (
      this.selectedUnit &&
      this.selectedCoords &&
      this.reachableHexes?.some((hex) => hex.equals(this.selectedCoords))
    ) {
      actionDescription.push("\t[m]: Move Unit");
    }

    if (this.selectedUnit && this.selectedUnit.plannedPath) {
      actionDescription.push("\t[c]: Cancel Movement");
    }

    if (actionDescription.length === 1) {
      actionDescription.push("\tNo action available");
    }

    console.log(actionDescription.join("\n"));
  }

  protected update(): void {
    pathGraphics.clear();

    for (const hex of this.world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position) ?? throwError();
      drawHex(hex, hexGraphic);

      if (hex.unit?.plannedPath && hex.unit.plannedPath.length > 0) {
        const path = hex.unit.plannedPath;
        pathGraphics.beginFill(0xffffff, 0);
        pathGraphics.lineStyle({
          width: 10,
          color: 0x000000,
          cap: LINE_CAP.ROUND,
          alpha: 0.5,
        });
        const p0 = hexToPixel(path[0], SCALE);
        pathGraphics.moveTo(p0.x, p0.y);
        for (let index = 1; index < path.length; index++) {
          const p = hexToPixel(path[index], SCALE);
          pathGraphics.lineTo(p.x, p.y);
        }
        pathGraphics.endFill();
      }
    }

    for (const coord of this.reachableHexes ?? []) {
      const hexGraphic = this.worldGraphics.get(coord) ?? throwError();
      hexGraphic.alpha = 0.5;
    }

    if (this.highlightedCoords) {
      const hexGraphic =
        this.worldGraphics.get(this.highlightedCoords) ?? throwError();
      hexGraphic.tint = 0xc0c0c0;
    }
  }

  protected resize(): void {
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
  }
}
