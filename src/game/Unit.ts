import { HexCoordinate } from "../lib/hex/HexCoordinate";

export abstract class Unit {
  readonly movement = 3;

  private _position: HexCoordinate;
  get position() {
    return this._position;
  }
  set position(position: HexCoordinate) {
    this._position = position;
  }

  protected _plannedPath?: HexCoordinate[];
  get plannedPath() {
    return this._plannedPath;
  }

  constructor(position: HexCoordinate) {
    this._position = position;
  }

  setPlannedPath(path: HexCoordinate[]) {
    this._plannedPath = path;
  }

  clearPlannedPath() {
    this._plannedPath = undefined;
  }
}

export class Villager extends Unit {}
