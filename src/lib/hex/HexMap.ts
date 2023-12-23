import { HexCoordinate } from "./HexCoordinate";

export class HexMap<T> {
  private readonly map = new Map<string, { key: HexCoordinate; value: T }>();

  constructor(entries: [HexCoordinate, T][] = []) {
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

  keys() {
    return [...this.map.values()].map(({ key }) => key);
  }

  values() {
    return [...this.map.values()].map(({ value }) => value);
  }

  entries() {
    return [...this.map.values()].map(
      ({ key, value }) => [key, value] as const,
    );
  }
}
