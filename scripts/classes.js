class Paddle extends PIXI.Sprite {
    constructor (x = 0, y = 0, player = false, color="red", angle = 0) {
        super(app.loader.resources["images/" + color + "paddle.png"].texture);
        this.anchor.set(0.5, 0.5);
        this.scale.set(0.0768);
        this.x = x;
        this.y = y;
        this.rotation = angle;
        if (player){
            this.scale.x *= -1;
            this.buttonModer = true;
            this.interactive = true;
        }
    }

    rotate(angle) {
        this.rotation += ((angle * Math.PI) / 180);
    }

    setAngle(angle) {
        this.rotation = angle;
    }
}

class Ball extends PIXI.Sprite {
    constructor (x = 0, y = 0, angle = 0) {
        super(app.loader.resources["images/ball.png"].texture);
        this.anchor.set(0.5, 0.5);
        this.scale.set(0.0288);
        this.x = x;
        this.y = y;
        this.rotation = angle;
    }

    rotate(angle) {
        this.rotation = (angle * Math.PI) / 180;
    }

    move(speed) {
        let ballCos = Math.cos(this.rotation);
        let ballSin = Math.sin(this.rotation);

        this.x += (ballCos * speed);
        let y = this.y + (ballSin * speed);

        if (y <= 265) {
            y = 265;
            this.rotation = Math.asin(-Math.sin(this.rotation));
        } else if (y >= 777) {
            y = 777;
            this.rotation = Math.asin(-Math.sin(this.rotation));
        }
        this.y = y;
    }

    scoreCheck() {
        if (this.x <= -14) {
            return "enemy";
        } else if (this.x >= 1038) {
            return "player";
        } else {
            return "noscore";
        }
    }
}