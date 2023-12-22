import { Application, IApplicationOptions } from "pixi.js";

export abstract class PixiApplicationBase {
  protected readonly canvas: HTMLCanvasElement;
  protected readonly app: Application;

  constructor(
    canvas: HTMLCanvasElement,
    options?: Omit<Partial<IApplicationOptions>, "view">,
  ) {
    this.canvas = canvas;

    this.app = new Application({
      view: canvas,
      ...options,
    });
  }

  protected start() {
    /** noop */
  }

  protected update() {
    /** noop */
  }

  protected resize() {
    /** noop */
  }

  protected init() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.app.screen.width = this.canvas.clientWidth;
    this.app.screen.height = this.canvas.clientHeight;
    this.start();

    this.app.ticker.add(this._update);
    window.addEventListener("resize", this._resize);

    return this;
  }

  private _resize = () => {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.app.screen.width = this.canvas.clientWidth;
    this.app.screen.height = this.canvas.clientHeight;
    this.resize();
  };

  private _update = () => {
    this.update();
  };
}
