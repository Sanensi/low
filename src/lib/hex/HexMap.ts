import { HexCoordinate } from "./HexCoordinate";

export interface ReadonlyHexMap<T> {
  get(key?: HexCoordinate): T | undefined;
  has(key: HexCoordinate): boolean;
  keys(): HexCoordinate[];
  values(): T[];
  entries(): [HexCoordinate, T][];
}

export class HexMap<T> implements ReadonlyHexMap<T> {
  private readonly map = new Map<string, { key: HexCoordinate; value: T }>();

  constructor(entries: readonly (readonly [HexCoordinate, T])[] = []) {
    this.map = new Map(
      entries.map(([key, value]) => [key.toString(), { key, value }]),
    );
  }

  set(key: HexCoordinate, value: T) {
    this.map.set(key.toString(), { key, value });
  }

  get(key?: HexCoordinate) {
    if (!key) return undefined;

    return this.map.get(key.toString())?.value;
  }

  has(key: HexCoordinate) {
    return this.map.has(key.toString());
  }

  keys() {
    return [...this.map.values()].map(({ key }) => key);
  }

  values() {
    return [...this.map.values()].map(({ value }) => value);
  }

  entries() {
    return [...this.map.values()].map(({ key, value }): [HexCoordinate, T] => [
      key,
      value,
    ]);
  }
}
