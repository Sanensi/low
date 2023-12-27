import { Container, Graphics, Text } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexField, HexWater } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { drawHex, drawPlannedPath } from "./displays/HexDisplay";
import { assert, throwError } from "../lib/Assertion";
import { Unit } from "./Unit";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { createUnitDisplay, drawUnit } from "./displays/UnitDisplay";
import { applyPlannedMovements, isGoingToBeOccupied } from "./World";

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

const unitDisplays = new Map<Unit, Text>();

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
        if (
          this.selectedHex instanceof HexCity &&
          this.selectedHex.canCreateVillager()
        ) {
          this.selectedHex.createVillager();
          const unit = this.selectedHex.unit ?? throwError();
          const display = createUnitDisplay(unit);
          unitDisplays.set(unit, display);
        }
        break;
      case "s":
        if (this.selectedHex?.unit) {
          this.selectedUnit = this.selectedHex.unit;
          this.selectedUnit.select();
          const origin = this.selectedUnit.position;
          this.reachableHexes = findReachableHex(
            origin,
            this.selectedHex.unit.movement,
            this.world,
          )
            .filter((coord) => !origin.equals(coord))
            .filter(
              (reachableCoord) =>
                !isGoingToBeOccupied(reachableCoord, this.world),
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
          this.selectedUnit.clearPlannedPath();
        }
        break;
    }
  }

  private advanceToNextTurn() {
    this.currentTurn++;
    applyPlannedMovements(this.world);
    this.world.values().forEach((hex) => hex.advanceToNextTurn());
    this.world.values().forEach((hex) => {
      if (hex.unit?.isSelected) {
        hex.unit.unselect();
      }
    });
    this.selectedUnit = undefined;
    this.reachableHexes = undefined;

    console.log("Current turn:", this.currentTurn);
  }

  private onHexClick(coord: HexCoordinate) {
    this.selectedHex?.unselect();
    this.selectedCoords = coord;
    this.selectedHex?.select();
    const selectedHex = this.selectedHex ?? throwError();

    console.log(selectedHex);

    const actionDescription = ["Actions:"];

    if (
      this.selectedHex instanceof HexCity &&
      this.selectedHex.canCreateVillager()
    ) {
      actionDescription.push("\t[v]: Create Villager (-5 food)");
    }

    if (selectedHex.unit) {
      actionDescription.push("\t[s]: Select Unit");
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

      if (hex.unit) {
        const unitDisplay = unitDisplays.get(hex.unit) ?? throwError();
        drawUnit(hex.unit, unitDisplay, hexGraphic);
      }

      if (hex.unit?.plannedPath && hex.unit.plannedPath.length > 0) {
        drawPlannedPath(hex.unit.plannedPath, pathGraphics);
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
