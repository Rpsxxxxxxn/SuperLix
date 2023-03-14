export class Chip {
    constructor(type) {
        this.animType = type;
        this.isAnimation = false;
        this.animTime = 0;
        this.animEndTime = 1000;    
    }

    update(deltaTime) {
        if (this.animTime <= this.animEndTime) {
            this.animTime += deltaTime;
        }
    }

    draw(ctx) {
        ctx.fillRect();
    }
}