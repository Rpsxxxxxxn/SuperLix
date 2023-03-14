const Config = require("../config");

class CustomLoop {
    constructor(loop) {
        this.loop = loop;
        this.oldTime = Date.now();
    }

    onCreate() {
        this.onLoop();
    }

    onLoop() {
        const dt = Date.now() - this.oldTime;
        this.oldTime = Date.now();
        if (this.loop) {
            this.loop(dt);
        }
        
        setTimeout(
            this.onLoop.bind(this),
            Config.Server_Interval/Config.Server_FPS
        );
    }
}

module.exports = CustomLoop;