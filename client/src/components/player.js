import { Config } from "../commons/constant";
import { Vector2 } from "../commons/utility";

export class Player {
    /**
     * コンストラクタ
     * @param {*} id 
     * @param {*} team 
     * @param {*} name 
     * @param {*} x 
     * @param {*} y 
     */
    constructor(id, team, name, x, y) {
        this.id = id;
        this.team = team;
        this.name = name;
        this.position = new Vector2(x, y);
        this.smoothPosition = new Vector2(x, y);
        this.mapPosition = new Vector2(0, 0);
        this.color = '#FFFFFF';
        this.angle = 0;
    }

    /**
     * パラメータの更新
     * @param {*} x 
     * @param {*} y 
     */
    updateParams(x, y) {
        this.position.set(x, y);
        // this.smoothPosition = Vector2.lerp(this.position, this.smoothPosition, 0.3);
    }

    /**
     * 描画処理
     * @param {*} ctx 
     * @param {*} color 
     */
    draw(ctx, color) {
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = color[this.team];
        ctx.arc(this.position.x, this.position.y, Config.ChipHalfSize, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.font = "30px 'arial'";
        ctx.textAlign = "center";
        ctx.strokeStyle = 'black';
        ctx.fillStyle = color[this.team];
        ctx.strokeText(this.name, this.position.x, this.position.y - Config.ChipHalfSize);
        ctx.fillText(this.name, this.position.x, this.position.y - Config.ChipHalfSize);
    }
}