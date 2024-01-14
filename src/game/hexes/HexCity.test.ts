import { describe, expect, test } from "bun:test";

import { HexCoordinate } from "../../lib/hex/HexCoordinate";
import { HexCity } from "./Hex";
import { Villager } from "../Unit";

describe("HexCity", () => {
  test("When created, a city starts with 25 food", () => {
    const city = new HexCity(HexCoordinate.ZERO);

    expect(city.food).toEqual(25);
  });

  test("When advance by a turn, then a city consume one food", () => {
    const city = new HexCity(HexCoordinate.ZERO);

    city.advanceToNextTurn();

    expect(city.food).toEqual(24);
  });

  test("When empty, a city can create a villager for 5 food", () => {
    const city = new HexCity(HexCoordinate.ZERO);

    city.createVillager();

    expect(city.food).toEqual(20);
    expect(city.unit).toBeInstanceOf(Villager);
  });

  test("When not empty, then it is impossible to create a new unit in that city hex", () => {
    const city = new HexCity(HexCoordinate.ZERO);

    city.createVillager();

    expect(() => city.createVillager()).toThrow();
  });
});
