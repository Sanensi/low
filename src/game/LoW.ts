import { Container, Graphics, Text } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { Hex, HexCity, HexFarm, HexField } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { drawHex, drawPlannedPath } from "./displays/HexDisplay";
import { assert, throwError } from "../lib/Assertion";
import { Unit, Villager } from "./Unit";
import { findReachableHex, findShortestPath } from "./HexPaths";
import { createUnitDisplay, drawUnit } from "./displays/UnitDisplay";
import { applyPlannedMovements, isGoingToBeOccupied } from "./World";
import { deserialize } from "./HexMap";
import defaultHexMap from "./maps/default-map.hex?raw";
import { Vec2 } from "../lib/Vec2";

const world = deserialize(defaultHexMap);
const worldGraphics = createWorldGraphics(world.keys());
const pathGraphics = new Graphics();
const unitDisplays = new Map<Unit, Text>();

export class LoW extends PixiApplicationBase {
  private world = world;
  private currentTurn = 1;

  private highlightedCoords?: HexCoordinate;

  private isDragging = false;
  private initialMapPivotPosition?: Vec2;
  private initialMousePosition?: Vec2;

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
    this.selectedHex?.unselect();
    this.selectedCoords = coord;
    this.selectedHex?.select();
    assert(this.selectedHex);
    const selectedHexNeighbors = this.selectedHex.position
      .neighbors()
      .map((coord) => this.world.get(coord))
      .filter((hex): hex is Hex => hex !== undefined);

    if (this.selectedHex instanceof HexCity) {
      const lines = [
        "City:",
        `\t(${this.selectedHex.food}/${this.selectedHex.foodCap}) Food (${this.selectedHex.foodBalance}/turn)`,
      ];

      console.log(lines.join("\n"));
    }

    if (this.selectedHex instanceof HexField) {
      console.log("Fields");
    }

    if (this.selectedHex instanceof HexFarm) {
      const lines = ["Farms:", `\t(+1 Food/turn)`];

      console.log(lines.join("\n"));
    }

    const actionDescription = ["Actions:"];

    if (
      this.selectedHex instanceof HexCity &&
      this.selectedHex.canCreateVillager()
    ) {
      actionDescription.push("\t[v]: Create Villager (-5 food)");
    }

    if (this.selectedHex.unit) {
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

    if (
      this.selectedHex instanceof HexField &&
      this.selectedHex.unit instanceof Villager &&
      selectedHexNeighbors.some(
        (neighbor) =>
          neighbor instanceof HexCity || neighbor instanceof HexFarm,
      )
    ) {
      actionDescription.push("\t[f]: Create Farm");
    }

    if (
      (this.selectedHex instanceof HexField ||
        this.selectedHex instanceof HexFarm) &&
      selectedHexNeighbors.some(
        (neighbor) => neighbor instanceof HexCity && neighbor.canGrow(),
      )
    ) {
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
        this.selectUnit();
        break;
      case "u":
        this.unselectUnit();
        break;
      case "m":
        this.moveUnit();
        break;
      case "f":
        this.createFarm();
        break;
      case "c":
        if (this.selectedUnit && this.selectedUnit.plannedPath) {
          this.selectedUnit.clearPlannedPath();
        }
        break;
      case "g":
        this.growCity();
        break;
    }
  }

  private advanceToNextTurn() {
    this.currentTurn++;
    applyPlannedMovements(this.world);
    this.world.values().forEach((hex) => hex.advanceToNextTurn());
    this.selectedUnit = undefined;
    this.reachableHexes = undefined;

    console.log("Current turn:", this.currentTurn);
  }

  private createVillager() {
    if (
      this.selectedHex instanceof HexCity &&
      this.selectedHex.canCreateVillager()
    ) {
      this.selectedHex.createVillager();
      const unit = this.selectedHex.unit ?? throwError();
      const display = createUnitDisplay(unit);
      unitDisplays.set(unit, display);
    }
  }

  private selectUnit() {
    if (this.selectedHex?.unit) {
      this.selectedUnit = this.selectedHex.unit;
      const origin = this.selectedUnit.position;
      this.reachableHexes = findReachableHex(
        origin,
        this.selectedHex.unit.movement,
        this.world,
      )
        .filter((coord) => !origin.equals(coord))
        .filter(
          (reachableCoord) => !isGoingToBeOccupied(reachableCoord, this.world),
        );
    }
  }

  private unselectUnit() {
    if (this.selectedUnit) {
      this.selectedUnit = undefined;
      this.reachableHexes = undefined;
    }
  }

  private moveUnit() {
    if (
      this.selectedUnit &&
      this.selectedCoords &&
      this.reachableHexes?.some((hex) => hex.equals(this.selectedCoords))
    ) {
      const { shortestPath } = findShortestPath(
        this.selectedUnit.position,
        this.selectedCoords,
        this.world,
      );

      this.selectedUnit.setPlannedPath(shortestPath);
      this.selectedUnit = undefined;
      this.reachableHexes = undefined;
    }
  }

  private createFarm() {
    if (
      this.selectedHex instanceof HexField &&
      this.selectedHex.unit instanceof Villager &&
      this.selectedHex.position
        .neighbors()
        .some(
          (neighbor) =>
            this.world.get(neighbor) instanceof HexCity ||
            this.world.get(neighbor) instanceof HexFarm,
        )
    ) {
      const hexField = this.selectedHex;
      const villager = this.selectedHex.unit;
      const neighbors = hexField.position
        .neighbors()
        .map((coord) => this.world.get(coord));
      const neighborCity =
        neighbors.filter((hex): hex is HexCity => hex instanceof HexCity)[0] ??
        neighbors.filter((hex): hex is HexFarm => hex instanceof HexFarm)[0]
          .associatedCity;

      const hexFarm = new HexFarm(this.selectedHex.position, neighborCity);
      this.world.set(hexFarm.position, hexFarm);

      const unitDisplay = unitDisplays.get(villager) ?? throwError();
      unitDisplay.destroy();
      unitDisplays.delete(villager);
      hexField.unselect();
    }
  }

  private growCity() {
    const selectedHexNeighborCityHexesThatCanGrow = this.selectedHex?.position
      .neighbors()
      .map((coord) => this.world.get(coord))
      .filter((hex): hex is HexCity => hex instanceof HexCity && hex.canGrow());

    if (
      (this.selectedHex instanceof HexField ||
        this.selectedHex instanceof HexFarm) &&
      selectedHexNeighborCityHexesThatCanGrow &&
      selectedHexNeighborCityHexesThatCanGrow.length > 0
    ) {
      const cityHex = selectedHexNeighborCityHexesThatCanGrow[0];
      const cityExtension = cityHex.grow(this.selectedHex);
      this.world.set(this.selectedHex.position, cityExtension);
    }
  }

  protected update(): void {
    pathGraphics.clear();

    for (const hex of this.world.values()) {
      const hexGraphic = this.worldGraphics.get(hex.position) ?? throwError();
      drawHex(hex, hexGraphic);

      if (hex.unit) {
        const unitDisplay = unitDisplays.get(hex.unit) ?? throwError();
        const isSelected = this.selectedUnit === hex.unit;
        drawUnit(unitDisplay, hexGraphic, isSelected);
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
