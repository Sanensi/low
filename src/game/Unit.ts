export interface Unit {
  readonly isSelected: boolean;
  select(): void;
  unselect(): void;
}

export class Villager implements Unit {
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
