import { Config, MapType } from "./constant";
import { Vector2 } from "./utility";

export class FloodFill {
    constructor() {
        this._workField = null;
    }

    start(mapField) {
        this._workField = mapField;
        this.checkHitCube();
    }

    checkHitCube() {
        for (let y = 0; y < Config.FIELD_SIZE; y++) {
            for (let x = 0; x < Config.FIELD_SIZE; x++) {
                if (x === 0 || y === 0 || x === Config.FIELD_SIZE - 1 || y === Config.FIELD_SIZE - 1) {
                    this.findField(x, y);
                }
            }
        }
    }

    findField(x, y) {
        if (x < 0 || y < 0 || x >= Config.FIELD_SIZE || y >= Config.FIELD_SIZE) {
            return;
        }

        if (this._workField[x][y] !== MapType.None) {
            return;
        }

        this._workField[x][y] = MapType.Check;
        this.findField(x + 1, y);
        this.findField(x - 1, y);   
        this.findField(x, y + 1);
        this.findField(x, y - 1);
    }

    get mapField() {
        return this._workField;
    }
}