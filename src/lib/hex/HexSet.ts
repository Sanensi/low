import { HexCoordinate } from "./HexCoordinate";

export class HexSet {
  private readonly map = new Map<string, HexCoordinate>();

  public get size() {
    return this.map.size;
  }

  constructor(hexes: HexCoordinate[] = []) {
    this.map = new Map(hexes.map((hex) => [hex.toString(), hex]));
  }

  add(value: HexCoordinate) {
    this.map.set(value.toString(), value);
  }

  has(value: HexCoordinate) {
    return this.map.has(value.toString());
  }

  delete(value: HexCoordinate) {
    this.map.delete(value.toString());
  }

  clear(): void {
    this.map.clear();
  }

  values() {
    return [...this.map.values()];
  }
}
