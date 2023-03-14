const Timer = require("../commons/utils/timer");
const Utility = require("../commons/utils/utility");
const Player = require("./player");

class BotPlayer extends Player {
    constructor(gamecore, id) {
        super(gamecore, null, id);
        this.direction = { x: 0, y: 0 };
        this.targetPosition = Utility.getRandomPosition();
        this.nextTargetTimer = new Timer(Utility.getRandom() % 4000 + 1000);
        this.turnSpeed = Utility.getRandom() % 10 + 2;
    }

    update(dt, field) {
        if (this.nextTargetTimer.getTiming(dt)) {
            this.targetPosition = Utility.getRandomPosition();
        }
        let dx = this.targetPosition.x - this.position.x;
        let dy = this.targetPosition.y - this.position.y;
        let magnitude = this.magnitude({ x: dx, y: dy });
        dx /= magnitude;
        dy /= magnitude;
        const dot = Utility.dot({ x: dx, y: dy }, this.direction);
        if (dot < 0.98) {
            const cross = Utility.cross({ x: dx, y: dy }, this.direction);
            if (cross >= Utility.toRadian(this.turnSpeed)) {
                this.angle -= Utility.toRadian(this.turnSpeed);
            }
            
            if (cross <= Utility.toRadian(-this.turnSpeed)) {
                this.angle += Utility.toRadian(this.turnSpeed);
            }
            this.direction.x = Math.cos(this.angle);
            this.direction.y = Math.sin(this.angle);
        }
        super.update(dt, field);
    }
    
	magnitude(v) {
        return Math.sqrt((v.x * v.x) + (v.y * v.y));
	}
}

module.exports = BotPlayer;