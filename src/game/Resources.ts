import { throwError } from "../lib/Assertion";
import { ReadonlyHexMap } from "../lib/hex/HexMap";
import { findNearestHexes, findShortestPath } from "./HexPaths";
import { Hex } from "./hexes/Hex";
import { HexCity } from "./hexes/HexCity";

const FOOD_MOVEMENT = 3;

type FoodTransaction = {
  from: Hex;
  to: Hex;
  ammount: number;
};

export function moveFood(map: ReadonlyHexMap<Hex>) {
  const nonCityHexWithFood = map
    .values()
    .filter((hex) => !(hex instanceof HexCity))
    .filter((hex) => hex.food2 > 0);

  nonCityHexWithFood
    .map((hex) => calculateFoodTransaction(hex, map))
    .filter((transaction): transaction is FoodTransaction => !!transaction)
    .forEach(applyFoodTransaction);
}

function calculateFoodTransaction(
  foodProvider: Hex,
  map: ReadonlyHexMap<Hex>,
): FoodTransaction | undefined {
  const nearestCities = findNearestHexes(
    foodProvider.position,
    map,
    (hex): hex is HexCity => hex instanceof HexCity,
  );

  if (nearestCities.length > 0) {
    const [city] = nearestCities;
    const { shortestPath } = findShortestPath(
      foodProvider.position,
      city.position,
      map,
    );
    const clampedPath = shortestPath.slice(0, FOOD_MOVEMENT + 1);
    const foodReceiverCoord = clampedPath[clampedPath.length - 1];
    const foodReceiver = map.get(foodReceiverCoord) ?? throwError();

    return {
      from: foodProvider,
      to: foodReceiver,
      ammount: foodProvider.food2,
    };
  }
}

function applyFoodTransaction({ from, to, ammount }: FoodTransaction) {
  from.food2 -= ammount;
  to.food2 += ammount;
}
