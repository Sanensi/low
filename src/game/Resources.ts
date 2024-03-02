import { throwError } from "../lib/Assertion";
import { ReadonlyHexMap } from "../lib/hex/HexMap";
import { findShortestPath } from "./HexPaths";
import { Hex } from "./hexes/Hex";
import { HexCity } from "./hexes/HexCity";

const FOOD_MOVEMENT = 3;

export function moveFood(map: ReadonlyHexMap<Hex>) {
  const nonCityHexWithFood = map
    .values()
    .filter((hex) => !(hex instanceof HexCity))
    .filter((hex) => hex.food2 > 0);

  nonCityHexWithFood.forEach((hex) => moveFoodTowardNearestCity(hex, map));
}

function moveFoodTowardNearestCity(hexWithFood: Hex, map: ReadonlyHexMap<Hex>) {
  const cities = map
    .values()
    .filter((hex): hex is HexCity => hex instanceof HexCity);

  if (cities.length === 1) {
    const [city] = cities;
    const { shortestPath } = findShortestPath(
      hexWithFood.position,
      city.position,
      map,
    );
    const clampedPath = shortestPath.slice(0, FOOD_MOVEMENT + 1);
    const foodReceiverCoord = clampedPath[clampedPath.length - 1];
    const foodReceiver = map.get(foodReceiverCoord) ?? throwError();
    foodReceiver.food2 += hexWithFood.food2;
    hexWithFood.food2 = 0;
  }
}
