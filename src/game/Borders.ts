import { throwError } from "../lib/Assertion";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexMap } from "../lib/hex/HexMap";
import { HexSet } from "../lib/hex/HexSet";
import { HexCity, HexSettlement } from "./hexes/HexCity";

export class Borders {
  private readonly hexOwnership = new HexMap<HexCity | HexSettlement>();
  private readonly borderByCities = new Map<HexCity | HexSettlement, HexSet>();

  getBorderFor(city: HexCity | HexSettlement) {
    return this.borderByCities.get(city)?.values() ?? throwError();
  }

  acquireUnclaimedBorderFor(
    city: HexCity | HexSettlement,
    claimedCoords: HexCoordinate[],
  ) {
    if (!this.borderByCities.get(city)) {
      this.borderByCities.set(city, new HexSet());
    }

    for (const coord of claimedCoords) {
      if (!this.hexOwnership.has(coord)) {
        this.hexOwnership.set(coord, city);
        this.borderByCities.get(city)?.add(coord);
      }
    }
  }

  transferOwnership(from: HexSettlement, to: HexCity) {
    if (!this.borderByCities.get(to)) {
      this.borderByCities.set(to, new HexSet());
    }

    const borderToTransfer = this.borderByCities.get(from) ?? throwError();
    for (const coord of borderToTransfer) {
      this.hexOwnership.set(coord, to);
      this.borderByCities.get(to)?.add(coord);
    }

    this.borderByCities.delete(from);
  }
}
