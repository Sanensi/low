import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexSet } from "../lib/hex/HexSet";

export class Borders {
  private coords = new HexSet();

  overwriteWith(coords: HexCoordinate[]) {
    this.coords = new HexSet(coords);
  }

  values() {
    return this.coords.values();
  }
}
