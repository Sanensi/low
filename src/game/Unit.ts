export interface Unit {
  readonly isSelected: boolean;
  readonly movement: number;

  select(): void;
  unselect(): void;
}

export class Villager implements Unit {
  readonly movement = 3;
  private _isSelected = false;

  get isSelected() {
    return this._isSelected;
  }

  select(): void {
    this._isSelected = true;
  }

  unselect(): void {
    this._isSelected = false;
  }
}
