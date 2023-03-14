const Config = require("../commons/config");


class Paint {
    constructor() {
        this.color = Config.Field_None;
        this.playerId = 0;
    }

    setColor(value) {
        this.color = value;
    }
}

module.exports = Paint;