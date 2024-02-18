import { describe, expect, test } from "bun:test";
import { HexFarm, HexField } from "./hexes/Hex";
import { HexCoordinate } from "../lib/hex/HexCoordinate";
import { HexCity, HexSettlement } from "./hexes/HexCity";
import { Borders } from "./Borders";
import { World } from "./World";
import { HexMap } from "../lib/hex/HexMap";

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

describe("A Farm generates 1 food per turn on its Hex", () => {});

describe("An Hex with food but no city to deliver it to keep its food for the turn", () => {});

describe("An Hex with food deliver its food to its nearest City", () => {});
