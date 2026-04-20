import { Canvas2D } from "./canvas";
import { Vector2 } from "./math/vector2";

export class Camera {

    public static readonly MIN_SCALE = 0.2;
    public static readonly MAX_SCALE = 2.5;
    public static readonly DEFAULT_SCALE = 1;

    private _canvas: Canvas2D;
    private _position: Vector2;
    private _scale: number;

    constructor(canvas: Canvas2D) {
        this._canvas = canvas;
        this._position = new Vector2(0, 0);
        this._scale = Camera.DEFAULT_SCALE;
    }

    public get position(): Vector2 {
        return this._position;
    }

    public get scale(): number {
        return this._scale;
    }

    public set scale(value: number) {
        this._scale = Math.max(Camera.MIN_SCALE, Math.min(Camera.MAX_SCALE, value));
    }

    prepareViewport() {
        this._canvas.translate(Math.round(this._position.x), Math.round(this._position.y));
        if (this._scale !== 1) {
            this._canvas.scale(this._scale, this._scale);
        }
    }

    moveRelative(value: Vector2) {
        this._position = this._position.add(value);
    }

    centerAbsolutePosition(value: Vector2) {
        this._position = new Vector2(
            Math.round(value.x * this._scale + this._canvas.width / 2),
            Math.round(value.y * this._scale + this._canvas.height / 2));
    }

    zoomAt(screenPoint: Vector2, factor: number) {
        const oldScale = this._scale;
        this.scale = oldScale * factor;
        const k = this._scale / oldScale;
        if (k === 1) return;

        this._position = new Vector2(
            screenPoint.x - k * (screenPoint.x - this._position.x),
            screenPoint.y - k * (screenPoint.y - this._position.y)
        );
    }

    resetZoom() {
        this._scale = Camera.DEFAULT_SCALE;
    }
}
