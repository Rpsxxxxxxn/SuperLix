class Logger {
    constructor() {
        this.logHistory = [];
    }

    static worn(message) {
        this.log(`[WORN ] ${message}`);
    }

    static info(message) {
        this.log(`[INFO ] ${message}`);
    }

    static debug(message) {
        this.log(`[DEBUG] ${message}`);
    }

    static error(message) {
        this.log(`[ERROR] ${message}`);
    }

    static log(message) {
        console.log(message);
    }
}