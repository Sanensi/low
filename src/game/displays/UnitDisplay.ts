import { throwError } from "../../lib/Assertion";
import { Unit, Villager } from "../Unit";
import { Text } from "pixi.js";

const VILLAGER_DISPLAY = createTextDisplay("V");

const UNIT_DISPLAY_MAP = new Map([[Villager, VILLAGER_DISPLAY]]);

export function getUnitDisplay(unit: Unit) {
  const display =
    UNIT_DISPLAY_MAP.get(Object.getPrototypeOf(unit).constructor) ??
    throwError();

  if (unit.isSelected) {
    display.style.fill = 0x0000ff;
  } else {
    display.style.fill = 0x000000;
  }

  return display;
}

function createTextDisplay(text: string) {
  const textDisplay = new Text(text, {
    fontSize: 64,
    fontFamily: "verdana",
    fontWeight: "bold",
  });
  textDisplay.pivot.set(textDisplay.width / 2, textDisplay.height / 2);

  return textDisplay;
}
