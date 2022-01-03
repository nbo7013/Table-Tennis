"use strict";
const app = new PIXI.Application({
    backgroundColor: 0x0000FF,
    width: 1024,
    height: 768
});
document.body.appendChild(app.view);

const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

app.loader.add([
    "images/redpaddle.png",
    "images/blackpaddle.png",
    "images/ball.png"
]);
app.loader.onComplete.add(setup);
app.loader.load();

let stage;

let startScene;
let instructionsScene;
let gameScene, playerPaddle, enemyPaddle, enemyXVelocity, enemyYVelocity, scoreLabel, hitSound, scoreSound, ball;
let gameOverScene, endGameText;

let playerScore, enemyScore;
let paused = false;
let movingPaddle = false;

let enemyMovingSpeed = 0.7;
let enemeyRotationSpeed = 1.5;

let ballSpeed = 0;
let ballSide = "enemy";

let start, gameStart = false;

let playerRotateSpeed = 0;
function setup() {
    stage = app.stage;

    startScene = new PIXI.Container();
    startScene.visible = true;
    stage.addChild(startScene);

    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    instructionsScene = new PIXI.Container();
    instructionsScene.visible = false;
    stage.addChild(instructionsScene);

    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);
    
    createUI();

    playerPaddle = new Paddle(128, 512, true, "red");
    gameScene.addChild(playerPaddle);
    playerPaddle.on("pointerdown", followMouse);

    enemyPaddle = new Paddle(896, 512, false, "black");
    gameScene.addChild(enemyPaddle);

    // Here I use some code I found online to implement keyboard input in my pixi js code: https://github.com/kittykatattack/learningPixi#keyboard
    const left = keyboard("a"),
        right = keyboard("d");

    left.press = () => {
        playerRotateSpeed = -1.5;
    }
    left.release = () => {
        if(!right.isDown) {
            playerRotateSpeed = 0;
        }
    }

    right.press = () => {
        playerRotateSpeed = 1.5;
    }
    right.release = () => {
        if(!left.isDown) {
            playerRotateSpeed = 0;
        }
    }

    ball = new Ball(256, 512);
    gameScene.addChild(ball);

    app.ticker.add(gameLoop);
}

function createUI() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0x000000,
        fontSize: 36,
        fontFamily: "Verdana"
    });

    let titleLabel = new PIXI.Text("Table Tennis: For the Web!",
        {
            fill: 0xFFFFFF,
            fontSize: 64,
            fontFamily: "Verdana",
        });
    titleLabel.anchor.set(0.5, 0);
    titleLabel.x = sceneWidth / 2;
    titleLabel.y = 64;
    startScene.addChild(titleLabel);

    let catchphrase = new PIXI.Text("The place where you can play table tennis...online!", 
        {
            fill: 0xFFFFFF,
            fontSize: 24,
            fontFamily: "Futara",
        });
    catchphrase.anchor.set(0.5, 0);
    catchphrase.x = sceneWidth / 2;
    catchphrase.y = (sceneHeight / 2) - 50;
    startScene.addChild(catchphrase);

    let startButton = new PIXI.Text("Play Some Table Tennis!");
    startButton.style = buttonStyle;
    startButton.anchor.set(0.5, 0);
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight - 96;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", giveInstructions);
    startButton.on('pointerover', e => e.target.color = 0.7);
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    let instructionsTitle = new PIXI.Text("Here's how you play:",
        {
            fill: 0xFFFFFF,
            fontSize: 64,
            fontFamily: "Verdana",
        });
    instructionsTitle.anchor.set(0.5, 0);
    instructionsTitle.x = sceneWidth / 2;
    instructionsTitle.y = 64;
    instructionsScene.addChild(instructionsTitle);

    let instructions = new PIXI.Text("The goal is to get to eleven points before your oponent does. To score points, you must get\n" + 
    " the ball through the end of the board on the opponents side. You can move the ball with \n" + 
    "your paddle (the red one on the left). Click on it to start moving it around. Once the paddle \n" + 
    "has been clicked the paddle will follow your mouse, only stopping when it gets to \n" +
    "the edge of your side. Which is the left half of the board. You can rotate your paddle to \n" + 
    " angle your hit using the 'A' and 'D' keys Good Luck!", {
            fill: 0xFFFF00,
            fontsize: 14,
            fontFamily: "Futara"
        });
    instructions.x = 64;
    instructions.y = 256;
    instructionsScene.addChild(instructions);

    let okButton = new PIXI.Text("Got It!");
    okButton.style = buttonStyle;
    okButton.anchor.set(0.5, 1);
    okButton.x = sceneWidth / 2;
    okButton.y = sceneHeight - 128;
    okButton.interactive = true;
    okButton.buttonMode = true;
    okButton.on("pointerup", startGame);
    okButton.on('pointerover', e => e.target.color = 0.7);
    okButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    instructionsScene.addChild(okButton);

    let net = new PIXI.Graphics();
    net.lineStyle(8, 0xFFFFFF, 1);
    net.moveTo(0,0);
    net.lineTo(0, 512);
    net.x = 512;
    net.y = 256;
    gameScene.addChild(net);

    let boundryLine = new PIXI.Graphics();
    boundryLine.lineStyle(6, 0xFFFFFF, 1);
    boundryLine.moveTo(3, 259);
    boundryLine.lineTo(1021, 259);
    boundryLine.lineTo(1021, 765);
    boundryLine.lineTo(3, 765);
    boundryLine.lineTo(3, 256);
    gameScene.addChild(boundryLine);
    
    let middleLine1 = new PIXI.Graphics();
    middleLine1.lineStyle(6, 0xFFFFFF, 1);
    middleLine1.moveTo(6, 512);
    middleLine1.lineTo(474, 512);
    gameScene.addChild(middleLine1);

    let middleLine2 = new PIXI.Graphics();
    middleLine2.lineStyle(6, 0xFFFFFF, 1);
    middleLine2.moveTo(1018, 512);
    middleLine2.lineTo(553, 512);
    gameScene.addChild(middleLine2);

    scoreLabel = new PIXI.Text("", {
        fill: 0xFFFFFF,
        fontSize: 72,
        fontFamily: "Futara"
    });
    scoreLabel.anchor.set(0.5, 0);
    scoreLabel.x = sceneWidth / 2;
    scoreLabel.y = 25;
    gameScene.addChild(scoreLabel);

    endGameText = new PIXI.Text("",
    {
        fill: 0xFFFF00,
        fontSize: 96,
        fontFamily: "Verdana"
    });
    endGameText.anchor.set(0.5, 0);
    endGameText.x = sceneWidth / 2;
    endGameText.y = 200;
    gameOverScene.addChild(endGameText);

    let playAgainButton = new PIXI.Text("Another Game?");
    playAgainButton.style = buttonStyle;
    playAgainButton.anchor.set(0.5, 1);
    playAgainButton.x = sceneWidth / 2;
    playAgainButton.y = sceneHeight - 125;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup", startGame);
    playAgainButton.on('pointerover', e => e.target.color = 0.7);
    playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    gameOverScene.addChild(playAgainButton);
}

function giveInstructions() {
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = false;
    instructionsScene.visible = true;
}

function startGame() {
    reset();
    startScene.visible = false;
    gameOverScene.visible = false;
    instructionsScene.visible = false;
    gameScene.visible = true;
    start = true;
    playerScore = -1;
    enemyScore = 0;
    increaseScore("player");
}

function followMouse() {
    movingPaddle = !movingPaddle;
}

function gameLoop() {
    if (start) {
        if (movingPaddle) {
            let mousePosition = app.renderer.plugins.interaction.mouse.global;
            if (mousePosition.x <= 64) mousePosition.x = 64;
            else if (mousePosition.x >= 448) mousePosition.x = 448;
            else if (mousePosition.y <= 256) mousePosition.y = 256;
            else if (mousePosition.y >= 722) mousePosition.y = 722;
            playerPaddle.x = mousePosition.x;
            playerPaddle.y = mousePosition.y;
        }
    
        playerPaddle.rotate(playerRotateSpeed);
    
        enemyMove();
    
        if (rectsIntersect(playerPaddle, ball)) {
            ballSpeed = 3;
            ball.rotate(playerPaddle.angle);
        } else if (rectsIntersect(enemyPaddle, ball)) {
            ballSpeed = -3;
            ball.rotate(enemyPaddle.angle);
        }
    
        ball.move(ballSpeed);
    
        let checkScore = ball.scoreCheck();
        if (movingPaddle && !gameStart) gameStart = true;

        if (checkScore == "player") {
            increaseScore(checkScore);
            reset(checkScore);
            ballSide = checkScore;
        } else if (checkScore == "enemy") {
            increaseScore(checkScore);
            reset(checkScore);
            ballSide = checkScore;
        }
        
        if (playerScore == 11) {
            start = false;
            gameOver("player");
        } else if (enemyScore == 11) {
            start = false;
            gameOver("enemy");
        }
    }
}

function enemyMove() {
    let xVelocity = (ball.x - enemyPaddle.x);
    let yVelocity = (ball.y - enemyPaddle.y);

    let length = Math.sqrt(Math.pow(xVelocity, 2) + Math.pow(yVelocity, 2));

    enemyXVelocity = (xVelocity / length) * enemyMovingSpeed;
    enemyYVelocity = (yVelocity / length) * enemyMovingSpeed;

    let angle = Math.atan(yVelocity / xVelocity);
    enemyPaddle.setAngle(angle);

    if (((enemyPaddle.x >= 662 && enemyXVelocity < 0) || 
        (enemyPaddle.x <= 934 && enemyXVelocity > 0)) && 
        (gameStart || (gameStart && ballSide == "enemy"))) enemyPaddle.x += enemyXVelocity;
    if (((enemyPaddle.y >= 64 && enemyYVelocity < 0) ||
        (enemyPaddle.y <= 722 && enemyYVelocity > 0)) && 
        (gameStart || (gameStart && ballSide == "enemy"))) enemyPaddle.y += enemyYVelocity;
}

function gameOver(winner) {
    startScene.visible = false;
    gameScene.visible = false;
    gameOverScene.visible = true;
    if(winner == "player") {
        endGameText.text = "YOU WON!";
    } else {
        endGameText.text = "YOU LOST!";
    }
}

function reset(ballSide) {
    playerPaddle.x = 128;
    playerPaddle.y = 512;
    playerPaddle.setAngle(0);
    movingPaddle = false;

    enemyPaddle.x = 896;
    enemyPaddle.y = 512;
    enemyPaddle.setAngle(0);

    if (ballSide == "player") {
        ball.x = 256;
    } else {
        ball.x = 768;
    }
    ball.y = 512;

    ballSpeed = 0;

    gameStart = false;
}

function increaseScore(player) {
    if(player == "player")
    {
        playerScore++;
    }
    else if(player == "enemy")
    {
        enemyScore++;
    }
    else
    {
        return;
    }
    scoreLabel.text = `P1: ${playerScore}  |   P2: ${enemyScore}`;
}

// Function I found online that allows access to keyboard input: https://github.com/kittykatattack/learningPixi#keyboard
function keyboard(value) {
    const key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = (event) => {
      if (event.key === key.value) {
            if (key.isUp && key.press) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };
  
    //The `upHandler`
    key.upHandler = (event) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
                key.release();
            }
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);
    
    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };
    
    return key;
}

// Using the rects intersect function from the Circle Blast! HW
function rectsIntersect(a,b){
    var ab = a.getBounds();
    var bb = b.getBounds();
    return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
}