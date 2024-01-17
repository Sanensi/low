import { throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexSet } from "../lib/hex/HexSet";
import { HexCity, HexSettlement } from "./hexes/HexCity";

export class Borders {
  private readonly borderByCities = new Map<HexCity | HexSettlement, HexSet>();

  updateBorderFor(city: HexCity | HexSettlement, coords: HexCoordinate[]) {
    this.borderByCities.set(city, new HexSet(coords));
  }

  getBorderFor(city: HexCity | HexSettlement) {
    return (
      this.borderByCities.get(city)?.values() ??
      throwError("No border founds for this city")
    );
  }
}
