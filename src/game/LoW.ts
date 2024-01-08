import { Container, Graphics, Text } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { HexCity, HexFarm, HexField } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { drawHex, drawPlannedPath } from "./displays/HexDisplay";
import { assert, throwError } from "../lib/Assertion";
import { Unit } from "./Unit";
import { createUnitDisplay, drawUnit } from "./displays/UnitDisplay";
import { World } from "./World";
import { deserialize } from "./HexMap";
import defaultHexMap from "./maps/default-map.hex?raw";
import { Vec2 } from "../lib/Vec2";

const world = deserialize(defaultHexMap);
const worldGraphics = createWorldGraphics(world.keys());
const pathGraphics = new Graphics();
const unitDisplays = new Map<Unit, Text>();

export class LoW extends PixiApplicationBase {
  private world: World = new World(world);
  private currentTurn = 1;

  private highlightedCoords?: HexCoordinate;

  private isDragging = false;
  private initialMapPivotPosition?: Vec2;
  private initialMousePosition?: Vec2;

  private map = new Container();
  private worldGraphics = worldGraphics;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, { backgroundColor: "#ffffff", antialias: true });
    this.init();
  }

  protected start(): void {
    this.addCameraControlListeners();
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
    this.map.scale.set(0.2);
    this.map.position.set(this.canvas.width / 2, this.canvas.height / 2);
    this.app.stage.addChild(this.map);

    console.log("Current turn:", this.currentTurn);
    console.log("Press [Enter] to advance to next turn");
  }

  private onHexClick(coord: HexCoordinate) {
    this.world.select(coord);

    if (this.world.selectedHex instanceof HexCity) {
      const lines = [
        "City:",
        `\t(${this.world.selectedHex.food}/${this.world.selectedHex.foodCap}) Food (${this.world.selectedHex.foodBalance}/turn)`,
      ];

      console.log(lines.join("\n"));
    }

    if (this.world.selectedHex instanceof HexField) {
      console.log("Fields");
    }

    if (this.world.selectedHex instanceof HexFarm) {
      const lines = ["Farms:", `\t(+1 Food/turn)`];

      console.log(lines.join("\n"));
    }

    const actionDescription = ["Actions:"];

    if (
      this.world.selectedHex instanceof HexCity &&
      this.world.selectedHex.canCreateVillager()
    ) {
      actionDescription.push("\t[v]: Create Villager (-5 food)");
    }

    if (this.world.canSelectUnit()) {
      actionDescription.push("\t[s]: Select Unit");
    }

    if (this.world.canUnselectUnit()) {
      actionDescription.push("\t[u]: Unselect Unit");
    }

    if (this.world.canMoveSelectedUnit()) {
      actionDescription.push("\t[m]: Move Unit");
    }

    if (this.world.canCancelSelectedUnitMovement()) {
      actionDescription.push("\t[c]: Cancel Movement");
    }

    if (this.world.canCreateFarm()) {
      actionDescription.push("\t[f]: Create Farm");
    }

    if (this.world.canGrowCity()) {
      actionDescription.push("\t[g]: Grow City (-25 food)");
    }

    if (actionDescription.length === 1) {
      actionDescription.push("\tNo action available");
    }

    console.log(actionDescription.join("\n"));
  }

  private onKeyPress(key: string) {
    switch (key) {
      case "Enter":
        this.advanceToNextTurn();
        break;
      case "v":
        this.createVillager();
        break;
      case "s":
        this.world.selectUnit();
        break;
      case "u":
        this.world.unselectUnit();
        break;
      case "m":
        this.world.moveSelectedUnit();
        break;
      case "c":
        this.world.cancelSelectedUnitMovement();
        break;
      case "f":
        this.createFarm();
        break;
      case "g":
        this.world.growCity();
        break;
    }
  }

  private advanceToNextTurn() {
    this.currentTurn++;
    this.world.advanceToNextTurn();

    console.log("Current turn:", this.currentTurn);
  }

  private createVillager() {
    if (
      this.world.selectedHex instanceof HexCity &&
      this.world.selectedHex.canCreateVillager()
    ) {
      this.world.selectedHex.createVillager();
      const unit = this.world.selectedHex.unit ?? throwError();
      const display = createUnitDisplay(unit);
      unitDisplays.set(unit, display);
    }
  }

  private createFarm() {
    const villager = this.world.createFarm();
    if (villager) {
      const unitDisplay = unitDisplays.get(villager) ?? throwError();
      unitDisplay.destroy();
      unitDisplays.delete(villager);
    }
  }

  protected update(): void {
    pathGraphics.clear();

    for (const hex of this.world) {
      const hexGraphic = this.worldGraphics.get(hex.position) ?? throwError();
      drawHex(hex, hexGraphic);

      if (hex.unit) {
        const unitDisplay = unitDisplays.get(hex.unit) ?? throwError();
        const isSelected = this.world.selectedUnit === hex.unit;
        drawUnit(unitDisplay, hexGraphic, isSelected);
      }

      if (hex.unit?.plannedPath && hex.unit.plannedPath.length > 0) {
        drawPlannedPath(hex.unit.plannedPath, pathGraphics);
      }
    }

    for (const coord of this.world.reachableHexes ?? []) {
      const hexGraphic = this.worldGraphics.get(coord) ?? throwError();
      hexGraphic.alpha = 0.5;
    }

    if (this.highlightedCoords) {
      const hexGraphic =
        this.worldGraphics.get(this.highlightedCoords) ?? throwError();
      hexGraphic.tint = 0xc0c0c0;
    }
  }

  private addCameraControlListeners() {
    window.addEventListener("mousedown", (e) => {
      if (e.button === 2) {
        this.isDragging = true;
        this.initialMapPivotPosition = new Vec2(this.map.pivot);
        this.initialMousePosition = new Vec2(e.x, e.y);
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        assert(this.initialMapPivotPosition && this.initialMousePosition);
        const negativeScale = new Vec2(this.map.scale).scale(-1);
        const mousePosition = new Vec2(e.x, e.y);
        const mouseDelta = mousePosition.substract(this.initialMousePosition);
        this.map.pivot.copyFrom(
          this.initialMapPivotPosition.add(mouseDelta.divide(negativeScale)),
        );
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 2) {
        this.isDragging = false;
        this.initialMapPivotPosition = undefined;
        this.initialMousePosition = undefined;
      }
    });

    window.addEventListener("wheel", (e) => {
      assert(this.map.scale.x === this.map.scale.y);

      const previousScale = this.map.scale.y;
      const delta = e.deltaY / 2500;
      const scale = Math.max(Math.min(previousScale - delta, 1), 0.1);

      this.map.scale.set(scale, scale);
    });
  }
}
