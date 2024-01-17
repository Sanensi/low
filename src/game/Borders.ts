import { throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexSet } from "../lib/hex/HexSet";
import { HexCity } from "./hexes/HexCity";

export class Borders {
  private readonly borderByCities = new Map<HexCity, HexSet>();

  updateBorderFor(city: HexCity, coords: HexCoordinate[]) {
    this.borderByCities.set(city, new HexSet(coords));
  }

  getBorderFor(city: HexCity) {
    return (
      this.borderByCities.get(city)?.values() ??
      throwError("No border founds for this city")
    );
  }
}
