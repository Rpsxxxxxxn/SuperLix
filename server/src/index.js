const GameCore = require("./gamecore");

const engine = new GameCore();
engine.onCreate();
engine.onLoop();