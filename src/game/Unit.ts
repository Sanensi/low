import { DisplayObject, Text } from "pixi.js";

export interface Unit {
  readonly display: DisplayObject;
}

export class Villager implements Unit {
  readonly display: Text;

  constructor() {
    this.display = new Text("V", {
      fontSize: 64,
      fontFamily: "verdana",
      fontWeight: "bold",
    });
    this.display.pivot.set(this.display.width / 2, this.display.height / 2);
  }
}
