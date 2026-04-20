import { Canvas2D } from "../canvas";
import { PinCategory } from "../data/pin/pin-category";
import { Vector2 } from "../math/vector2";
import { Control } from "./control";
import { DrawableControl } from "./interfaces/drawable";
import { PinControl } from "./pin.control";
import { UserControl } from "./user-control";
import { ColorUtils } from "./utils/color-utils";

export class NodeConnectionControl extends UserControl {

    private pinStart: PinControl;
    private pinEnd: PinControl;

    private pinStartPosition: Vector2;
    private pinEndPosition: Vector2;

    private curveValue: number;
    private color: string;
    private lineWidth: number;
    private isExec: boolean;

    constructor(pinStart: PinControl, pinEnd: PinControl) {
        super(0, 0, -1);

        this.pinStart = pinStart;
        this.pinEnd = pinEnd;

        this.pinStartPosition = this.pinStart.getPinAbsolutePosition();
        this.pinEndPosition = this.pinEnd.getPinAbsolutePosition();
        let difference = this.pinEndPosition.subtract(this.pinStartPosition);

        let distance = Math.sqrt((difference.x * difference.x) + (difference.y * difference.y)) - 12;
        this.curveValue = distance * 0.4;
        this.color = ColorUtils.getPinColor(this.pinStart.pinProperty);

        this.isExec = this.pinStart.pinProperty.category === PinCategory.exec;
        this.lineWidth = this.isExec ? 2.5 : 1.5;
    }

    public get execWire(): boolean {
        return this.isExec;
    }

    public get startNodeName(): string {
        return this.pinStart.pinProperty.nodeName;
    }

    public get endNodeName(): string {
        return this.pinEnd.pinProperty.nodeName;
    }

    private drawPath(canvas: Canvas2D) {
        canvas
            .beginPath()
            .moveTo(this.pinStartPosition.x, this.pinStartPosition.y)
            .lineTo(this.pinStartPosition.x + 6, this.pinStartPosition.y)
            .bezierCurveTo(
                this.pinStartPosition.x + this.curveValue + 6,
                this.pinStartPosition.y,
                this.pinEndPosition.x - this.curveValue - 6,
                this.pinEndPosition.y,
                this.pinEndPosition.x - 6,
                this.pinEndPosition.y
            )
            .lineTo(this.pinEndPosition.x, this.pinEndPosition.y);
    }

    onDraw(canvas: Canvas2D): void {
        this.pinStartPosition = this.pinStart.getPinAbsolutePosition();
        this.pinEndPosition = this.pinEnd.getPinAbsolutePosition();
        let difference = this.pinEndPosition.subtract(this.pinStartPosition);
        let distance = Math.sqrt((difference.x * difference.x) + (difference.y * difference.y)) - 12;
        this.curveValue = distance * 0.4;

        canvas.lineWidth(this.lineWidth).strokeStyle(this.color);
        this.drawPath(canvas);
        canvas.stroke();

        if (this.isExec && this.app && (this.app as any).animationEnabled) {
            const ctx = canvas.getContext();
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.lineCap = "round";
            ctx.setLineDash([6, 18]);
            ctx.lineDashOffset = -((this.app as any).animationTime || 0) * 0.06;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = this.lineWidth;
            this.drawPath(canvas);
            canvas.stroke();
            ctx.restore();
        }
    }
}
