import { ReadonlyHexMap } from "../lib/hex/HexMap";
import { Hex } from "./hexes/Hex";
import { HexCity } from "./hexes/HexCity";

export function moveFood(map: ReadonlyHexMap<Hex>) {
  const cities = map
    .values()
    .filter((hex): hex is HexCity => hex instanceof HexCity);
  const otherHex = map.values().filter((hex) => !(hex instanceof HexCity));

  const foodNotInCities = otherHex.reduce((sum, hex) => sum + hex.food2, 0);
  if (cities.length === 1) {
    cities[0].food2 += foodNotInCities;
    otherHex.forEach((hex) => (hex.food2 = 0));
  }
}
