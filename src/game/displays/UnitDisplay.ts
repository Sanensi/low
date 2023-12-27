import { throwError } from "../../lib/Assertion";
import { Unit, Villager } from "../Unit";
import { Graphics, Text } from "pixi.js";

const UNIT_LETTER_MAP = new Map([[Villager, "V"]]);

export function createUnitDisplay(unit: Unit) {
  const letter =
    UNIT_LETTER_MAP.get(Object.getPrototypeOf(unit).constructor) ??
    throwError();
  return createTextDisplay(letter);
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

export function drawUnit(unit: Unit, unitDisplay: Text, hexGraphic: Graphics) {
  hexGraphic.addChild(unitDisplay);
  if (unit.isSelected) {
    unitDisplay.style.fill = 0x0000ff;
  } else {
    unitDisplay.style.fill = 0x000000;
  }
}
