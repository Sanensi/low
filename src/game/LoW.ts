import { Container, Graphics, Text } from "pixi.js";
import { PixiApplicationBase } from "../lib/PixiApplicationBase";
import { createWorldGraphics } from "./displays/WorldDisplay";
import { createArea } from "../lib/hex/HexCoordinatesFactory";
import { Hex, HexCity, HexFarm, HexField, HexWater } from "./Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { drawHex, drawPlannedPath } from "./displays/HexDisplay";
import { assert, throwError } from "../lib/Assertion";
import { Unit, Villager } from "./Unit";
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
      this.selectedHex instanceof HexField &&
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
    this.world.values().forEach((hex) => {
      if (hex.unit?.isSelected) {
        hex.unit.unselect();
      }
    });
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
      this.selectedUnit.select();
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
      this.selectedUnit.unselect();
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
      this.selectedHex &&
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
