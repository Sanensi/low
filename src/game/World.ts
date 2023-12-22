import { Hex } from "./Hex";

export class World {
  private readonly world = new Map<string, Hex>();

  constructor(hexes: Hex[]) {
    this.world = new Map(hexes.map((hex) => [hex.position.toString(), hex]));
  }

  update(hex: Hex) {
    this.world.set(hex.position.toString(), hex);
  }

  getHexes() {
    return this.world.values();
  }
}
