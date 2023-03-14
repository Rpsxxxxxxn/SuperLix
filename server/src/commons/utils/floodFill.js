const Config = require("../config");

class FloodFill {
    constructor() {
        this.workField = null;
    }

    /**
     * 探索開始
     * @param {*} mapField 
     * @param {*} myColor 
     */
    start(mapField, myColor) {
        // 値コピー
        this.workField = JSON.parse(JSON.stringify(mapField));
        this.checkHitCube(myColor);
    }

    /**
     * 円を探す
     * @param {*} myColor 
     */
    checkHitCube(myColor) {
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            for (let x = 0; x < Config.Game_FieldSize; x++) {
                if (x === 0 || y === 0 || x === Config.Game_FieldSize - 1 || y === Config.Game_FieldSize - 1) {
                    this.findField(x, y, myColor);
                }
            }
        }
    }

    /**
     * フィールドをチェック
     * @param {*} x 
     * @param {*} y 
     * @param {*} myColor 
     * @returns 
     */
    findField(x, y, myColor) {
        if (x < 0 || y < 0 || x >= Config.Game_FieldSize || y >= Config.Game_FieldSize) {
            return;
        }

        if (this.workField[y][x] === Config.Field_Check) {
            return;
        }

        // なにも塗っていないとこと敵の塗ったところはチェック
        if (this.workField[y][x] === myColor) {
            return;
        }

        // チェックしたところ
        this.workField[y][x] = Config.Field_Check;

        // 周りを見る
        this.findField(x + 1, y, myColor);
        this.findField(x - 1, y, myColor);   
        this.findField(x, y + 1, myColor);
        this.findField(x, y - 1, myColor);
    }

    get mapField() {
        return this.workField;
    }
}

module.exports = FloodFill;