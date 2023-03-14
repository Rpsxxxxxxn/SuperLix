import { Config } from "../commons/constant";
import { Vector2 } from "../commons/utility";

export class Camera {
    constructor() {
        this.position = new Vector2(0, 0);
        this.mapPosition = new Vector2(0, 0);
        this.zoomRange = 1.0;
    }

    update() {
        this.mapPosition.x = ~~(this.position.x / Config.ChipSize);
        this.mapPosition.y = ~~(this.position.y / Config.ChipSize);
    }
}