import { describe, expect, test } from "bun:test";
import { HexFarm, HexField } from "./hexes/Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexCity, HexSettlement } from "./hexes/HexCity";
import { Borders } from "./Borders";
import { World } from "./World";
import { HexMap } from "../lib/hex/HexMap";
import { deserialize } from "./MapSerialization";
import { assert } from "../lib/Assertion";

const ANY_WORLD = new World(new HexMap(), new Borders());

describe("Each Hex has a food capacity of 5 by default", () => {
  test("Field", () => {
    expect(new HexField(HexCoordinate.ZERO).foodCapacity).toEqual(5);
  });

  test("Farm", () => {
    expect(new HexFarm(HexCoordinate.ZERO).foodCapacity).toEqual(5);
  });

  test("Settlement", () => {
    expect(
      new HexSettlement(HexCoordinate.ZERO, new Borders()).foodCapacity,
    ).toEqual(5);
  });
});

test("A City has a food capacity of 25", () => {
  expect(
    new HexCity(ANY_WORLD, HexCoordinate.ZERO, new Borders()).foodCapacity,
  ).toEqual(25);
});

describe("A Farm generates 1 food per turn on its Hex", () => {
  test("A farm starts with 0 food", () => {
    expect(new HexFarm(HexCoordinate.ZERO).food2).toEqual(0);
  });

  test("A farm has 1 food after a single turn", () => {
    const farm = new HexFarm(HexCoordinate.ZERO);

    farm.advanceToNextTurn();

    expect(farm.food2).toEqual(1);
  });

  test("After more than 5 turn, the farm reach its food capacity", () => {
    const farm = new HexFarm(HexCoordinate.ZERO);

    for (let i = 0; i < 7; i++) {
      farm.advanceToNextTurn();
    }

    expect(farm.food2).toEqual(farm.foodCapacity);
  });
});

describe("An Hex with food can deliver its food to its nearest City", () => {
  test("When an Hex has food but no city to deliver to, then it keep its food for the turn", () => {
    const world = deserialize("(0, 0)\n0 0 0");
    const hexField = world.map.get(HexCoordinate.ZERO);
    assert(hexField instanceof HexField);
    hexField.food2 = 3;

    world.advanceToNextTurn();

    expect(hexField.food2).toEqual(3);
  });

  test("When the food is right next to the city, then the city receives it the next turn", () => {
    const world = deserialize("(0, 0)\n0 c");
    const foodOrigin = world.map.get(HexCoordinate.ZERO);
    const city = world.map.get(HexCoordinate.pointyDirection("3h"));
    assert(foodOrigin instanceof HexField);
    assert(city instanceof HexCity);

    foodOrigin.food2 = 3;
    city.food2 = 0;
    world.advanceToNextTurn();

    expect(foodOrigin.food2).toEqual(0);
    expect(city.food2).toEqual(3);
  });

  test("When the food is exactly 3 tiles away from a city, then the city receives it the next turn", () => {
    const world = deserialize("(0, 0)\n0 0 0 c");
    const foodOrigin = world.map.get(HexCoordinate.ZERO);
    const city = world.map.get(HexCoordinate.pointyDirection("3h").scale(3));
    assert(foodOrigin instanceof HexField);
    assert(city instanceof HexCity);

    foodOrigin.food2 = 3;
    city.food2 = 0;
    world.advanceToNextTurn();

    expect(foodOrigin.food2).toEqual(0);
    expect(city.food2).toEqual(3);
  });

  test("When the food is more than 3 tiles away from a city, then the food move up to 3 hexes per turn before reaching the city", () => {
    const world = deserialize("(0, 0)\n0 0 0 0 0 0 c");
    const foodOrigin = world.map.get(HexCoordinate.ZERO);
    const middleHex = world.map.get(
      HexCoordinate.pointyDirection("3h").scale(3),
    );
    const city = world.map.get(HexCoordinate.pointyDirection("3h").scale(6));
    assert(foodOrigin instanceof HexField);
    assert(middleHex instanceof HexField);
    assert(city instanceof HexCity);
    foodOrigin.food2 = 3;
    city.food2 = 0;

    world.advanceToNextTurn();
    expect(foodOrigin.food2).toEqual(0);
    expect(middleHex.food2).toEqual(3);
    expect(city.food2).toEqual(0);

    world.advanceToNextTurn();
    expect(foodOrigin.food2).toEqual(0);
    expect(middleHex.food2).toEqual(0);
    expect(city.food2).toEqual(3);
  });

  test("When there is a trail of food leading to a city, then that city receives only the food within 3 tiles from it", () => {
    const world = deserialize("(0, 0)\n0 0 0 0 c");
    const city = world.map.get(HexCoordinate.pointyDirection("3h").scale(4));
    assert(city instanceof HexCity);
    world.map
      .values()
      .filter((hex): hex is HexField => hex instanceof HexField)
      .forEach((hex) => (hex.food2 = 1));

    world.advanceToNextTurn();

    expect(city.food2).toEqual(3);

    world.advanceToNextTurn();

    expect(city.food2).toEqual(4);
  });

  test("When there are 2 cities in range of some food, then the food moves to the nearest city", () => {
    const world = deserialize("(-4, 0)\nc 0 0 c");
    const foodOrigin = world.map.get(HexCoordinate.ZERO);
    const city1 = world.map.get(HexCoordinate.pointyDirection("3h").scale(1));
    const city2 = world.map.get(HexCoordinate.pointyDirection("9h").scale(2));
    assert(foodOrigin instanceof HexField);
    assert(city1 instanceof HexCity);
    assert(city2 instanceof HexCity);
    foodOrigin.food2 = 3;
    city1.food2 = 0;
    city2.food2 = 0;

    world.advanceToNextTurn();

    expect(foodOrigin.food2).toEqual(0);
    expect(city1.food2).toEqual(3);
    expect(city2.food2).toEqual(0);
  });

  test("When there are 2 cities at the same distance of one food, then the food moves to the city with the least food", () => {
    const world = deserialize("(-4, 0)\nc 0 0 0 c");
    const foodOrigin = world.map.get(HexCoordinate.ZERO);
    const city1 = world.map.get(HexCoordinate.pointyDirection("3h").scale(2));
    const city2 = world.map.get(HexCoordinate.pointyDirection("9h").scale(2));
    assert(foodOrigin instanceof HexField);
    assert(city1 instanceof HexCity);
    assert(city2 instanceof HexCity);
    foodOrigin.food2 = 1;
    city1.food2 = 1;
    city2.food2 = 0;

    world.advanceToNextTurn();

    expect(foodOrigin.food2).toEqual(0);
    expect(city1.food2).toEqual(1);
    expect(city2.food2).toEqual(1);
  });
});
