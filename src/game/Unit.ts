import { HexCoordinate } from "../lib/hex/HexCoordinate";

export abstract class Unit {
  readonly movement = 3;

  protected _plannedPath?: HexCoordinate[];
  get plannedPath() {
    return this._plannedPath;
  }

  protected _isSelected = false;
  get isSelected() {
    return this._isSelected;
  }

  constructor(readonly position: HexCoordinate) {}

  select(): void {
    this._isSelected = true;
  }

  unselect(): void {
    this._isSelected = false;
  }

  setPlannedPath(path: HexCoordinate[]) {
    this._plannedPath = path;
  }

  cleatPlannedPath() {
    this._plannedPath = undefined;
  }
}

export class Villager extends Unit {}
