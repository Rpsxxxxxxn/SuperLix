class Timer {
    constructor(interval) {
        this.interval = interval;
        this.time = 0;
    }

    getTiming(dt) {
        this.time += dt;
        if (this.time > this.interval) {
            this.time = 0;
            return true;
        }
        return false;
    }
}

module.exports = Timer;