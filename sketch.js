class Piece {
    constructor(color, width, height, tiles) {
        this.color = color;
        this.width = width;
        this.height = height;
        this.tiles = tiles;
    }

    getWidth(rotation) {
        if (rotation % 2 != 0)
            return this.height;
        else
            return this.width;
    }

    getHeight(rotation) {
        if (rotation % 2 != 0)
            return this.width;
        else
            return this.height;
    }

    hasTile(x, y, rotation) {
        let realX;
        let realY;
        if (rotation == 0) {
            realX = x;
            realY = y;
        } else if (rotation == 1) {
            realX = this.width - 1 - y;
            realY = x;
        } else if (rotation == 2) {
            realX = this.width - 1 - x;
            realY = this.height - 1 - y;
        } else if (rotation == 3) {
            realX = y;
            realY = this.height - 1 - x;
        }
        return this.tiles[realY][realX];
    }
}

class Message {
    constructor(color, text) {
        this.color = color;
        this.text = text;
        this.timer = 0;
    }
}

const pieceI = new Piece("#7777FF", 4, 1, [
    [true, true, true, true]
]);
const pieceJ = new Piece("#0000FF", 3, 2, [
    [true, false, false],
    [true, true, true]
]);
const pieceL = new Piece("#FF7700", 3, 2, [
    [false, false, true],
    [true, true, true]
]);
const pieceO = new Piece("#DDDD00", 2, 2, [
    [true, true],
    [true, true]
]);
const pieceS = new Piece("#00FF00", 3, 2, [
    [false, true, true],
    [true, true, false]
]);
const pieceT = new Piece("#7700FF", 3, 2, [
    [false, true, false],
    [true, true, true]
]);
const pieceZ = new Piece("#FF0000", 3, 2, [
    [true, true, false],
    [false, true, true]
]);

const gridWidth = 10;
const gridHeight = 20;
let board;

let displayRatio;

let pieceQueue = [];
let currPiece;
let currX;
let currY;
let previewY;
let currRotation;

let holdPiece;
let isSwitchedPiece;

let lastUpdateMillis;
let isGameOver;
let isPaused;
let level;

let highestPoints;
let clearedRows;
let currentPoints;
let turnMultiplier;

let messageQueue = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);

    initGame();
    calcRatios();

    highestPoints = getCookie("highscore");
    if (!highestPoints)
        highestPoints = 0;
}

function calcRatios() {
    displayRatio = min(windowWidth / (gridWidth * 2.5), windowHeight / (gridHeight + 2));
}

function initGame() {
    isGameOver = false;
    holdPiece = undefined;
    level = 1;
    board = [];
    for (let i = 0; i < gridWidth; i++)
        board[i] = [];
    selectNewPiece(getPieceFromQueue());
    lastUpdateMillis = millis();
    clearedRows = 0;
    currentPoints = 0;
    turnMultiplier = 0;
}

function draw() {
    background(255);

    let boardX = windowWidth / 2 - (gridWidth / 2) * displayRatio;
    let boardY = windowHeight / 2 - (gridHeight / 2) * displayRatio;
    let scale = displayRatio;

    stroke(150);
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            let field = board[x][y];
            fill(!field || isPaused ? 225 : field);
            rect(boardX + x * scale, boardY + y * scale, scale, scale);
        }
    }

    stroke(0);
    fill(0);
    textAlign(LEFT, TOP);
    textSize(scale);
    let sc = "Score: " + currentPoints;
    let high = "Highscore: " + max(currentPoints, highestPoints);
    let x = boardX - displayRatio - max(textWidth(sc), textWidth(high) * 0.75);
    text(sc, x, boardY + 5 * displayRatio);
    textSize(scale * 0.75);
    text(high, x, boardY + 6 * displayRatio);

    textAlign(RIGHT, TOP);
    text("Rows Cleared: " + clearedRows, boardX - displayRatio, boardY + 8 * displayRatio);
    text("Level " + level, boardX - displayRatio, boardY + 9 * displayRatio);

    if (!isGameOver) {
        if (!isPaused) {
            stroke(150);
            fill(currPiece.color);
            drawPiece(currPiece, boardX + currX * scale, boardY + currY * scale, currRotation, scale);

            noStroke();
            fill(red(currPiece.color), green(currPiece.color), blue(currPiece.color), 75);
            drawPiece(currPiece, boardX + currX * scale, boardY + previewY * scale, currRotation, scale);
        }

        stroke(0);
        fill(0);
        textAlign(LEFT, TOP);
        textSize(scale * 0.75);
        text("Next Pieces", boardX + (gridWidth + 1) * scale, boardY + scale);
        textAlign(RIGHT, TOP);
        text("Hold", boardX - scale, boardY + scale);

        let queueScale = displayRatio * 0.75;
        if (!isPaused) {
            stroke(150);
            for (let i = 0; i < 5; i++) {
                fill(pieceQueue[i].color);
                drawPiece(pieceQueue[i], boardX + (gridWidth + 2) * scale, boardY + scale + 2 * (i + 1) * scale, 0, queueScale);
            }
        }

        if (holdPiece) {
            stroke(150);
            fill(holdPiece.color);
            drawPiece(holdPiece, boardX - 2 * scale, boardY + 3 * scale, 0, queueScale);
        }

        let messageScale = scale;
        let y = boardY + gridHeight * displayRatio - messageScale * (messageQueue.length + 1);
        textAlign(LEFT, TOP);
        textSize(messageScale * 0.8);
        for (let i = messageQueue.length - 1; i >= 0; i--) {
            let message = messageQueue[i];
            stroke(message.color);
            fill(message.color);
            text(message.text, boardX + gridWidth * displayRatio + scale, y);
            y += messageScale;

            message.timer++;
            if (message.timer >= 90)
                messageQueue.splice(i, 1);
        }

        if (!isPaused) {
            let speedFactor = 1 - (level - 1) * 0.05;
            let now = millis();
            if (now - lastUpdateMillis >= 1000 * speedFactor) {
                lastUpdateMillis = now;
                movePiece(0, 1);
            }
        }
    } else {
        stroke(0);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(scale * 2);
        text("Game Over", width / 2, height / 3);
        textSize(scale * 0.75);
        text("Press Enter to restart", width / 2, height / 3 + 1.5 * scale);
    }

    if (isPaused) {
        stroke(0);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(scale * 2);
        text("Paused", width / 2, height / 3);
    }

    stroke(0);
    fill(0);
    textAlign(RIGHT, BOTTOM);
    let y = boardY + gridHeight * displayRatio;
    textSize(0.5 * scale);
    text("ESC to pause", boardX - scale, y - scale * 3.75);
    text("Arrow keys to move", boardX - scale, y - scale * 3);
    text("Q, E to rotate", boardX - scale, y - scale * 2.25);
    text("Space to drop", boardX - scale, y - scale * 1.5);
    text("TAB to hold", boardX - scale, y - scale * 0.75);
}

function drawPiece(piece, theX, theY, rotation, scale) {
    let w = piece.getWidth(rotation);
    let h = piece.getHeight(rotation);
    let startX = theX - floor(w / 2) * scale;
    let startY = theY - floor(h / 2) * scale;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (piece.hasTile(x, y, rotation)) {
                rect(startX + x * scale, startY + y * scale, scale, scale);
            }
        }
    }
}

function keyPressed() {
    if (keyCode == ESCAPE) {
        isPaused = !isPaused;
    } else if (!isGameOver) {
        if (!isPaused) {
            if (keyCode == LEFT_ARROW) {
                movePiece(-1, 0);
                updatePreview();
            } else if (keyCode == RIGHT_ARROW) {
                movePiece(1, 0);
                updatePreview();
            } else if (keyCode == DOWN_ARROW) {
                movePiece(0, 1);
            } else if (key == 'Q') {
                rotatePiece(1);
                updatePreview();
            } else if (key == 'E') {
                rotatePiece(-1);
                updatePreview();
            } else if (key == ' ') {
                while (true) {
                    if (!movePiece(0, 1))
                        break;
                }
            } else if (keyCode == TAB) {
                if (!isSwitchedPiece) {
                    let hold = holdPiece;
                    holdPiece = currPiece;
                    selectNewPiece(hold ? hold : getPieceFromQueue());
                    isSwitchedPiece = true;
                }
                return false;
            }
        }
    } else {
        if (keyCode == ENTER) {
            initGame();
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    calcRatios();
}

function rotatePiece(rotation) {
    let newRotation = currRotation + rotation;
    if (newRotation > 3)
        newRotation = 0;
    else if (newRotation < 0)
        newRotation = 3;
    if (!isValidPosition(currPiece, currX, currY, newRotation)) {
        return;
    }
    currRotation = newRotation;
}

function movePiece(xOff, yOff) {
    let newX = currX + xOff;
    let newY = currY + yOff;
    if (!isValidPosition(currPiece, newX, newY, currRotation)) {
        if (yOff > 0) {
            placeCurrPiece();
            clearRows();
            selectNewPiece(getPieceFromQueue());
        }
        return false;
    }
    currX = newX;
    currY = newY;
    return true;
}

function placeCurrPiece() {
    let w = currPiece.getWidth(currRotation);
    let h = currPiece.getHeight(currRotation);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (!currPiece.hasTile(x, y, currRotation))
                continue;
            board[currX - floor(w / 2) + x][currY - floor(h / 2) + y] = currPiece.color;
        }
    }
}

function selectNewPiece(piece) {
    currPiece = piece;
    currX = floor(gridWidth / 2);
    currY = currPiece.height - 1;
    currRotation = 0;

    if (isSwitchedPiece)
        isSwitchedPiece = false;

    if (!isValidPosition(currPiece, currX, currY, currRotation)) {
        isGameOver = true;
        onGameOver();
    } else {
        updatePreview();
    }
}

function onGameOver() {
    if (currentPoints > highestPoints) {
        setCookie("highscore", currentPoints, 365);
        highestPoints = currentPoints;
    }
}

function updatePreview() {
    previewY = currY;
    while (isValidPosition(currPiece, currX, previewY + 1, currRotation)) {
        previewY++;
    }
}

function isValidPosition(piece, x, y, rotation) {
    let w = piece.getWidth(rotation);
    let h = piece.getHeight(rotation);
    for (let xOff = 0; xOff < w; xOff++) {
        for (let yOff = 0; yOff < h; yOff++) {
            if (!piece.hasTile(xOff, yOff, rotation))
                continue;
            let newX = x - floor(w / 2) + xOff;
            let newY = y - floor(h / 2) + yOff;
            if (newX < 0)
                return false;
            if (newX >= gridWidth || newY >= gridHeight)
                return false;
            if (board[newX][newY])
                return false;
        }
    }
    return true;
}

function clearRows() {
    let cleared = [];
    for (let y = gridHeight - 1; y >= 0; y--) {
        let full = 0;
        for (let x = 0; x < gridWidth; x++) {
            if (board[x][y])
                full++;
        }
        if (full == gridWidth) {
            for (let x = 0; x < gridWidth; x++)
                board[x][y] = undefined;
            cleared.push(y);
        }
    }
    for (let i = cleared.length - 1; i >= 0; i--) {
        for (let y = cleared[i] - 1; y >= 0; y--) {
            for (let x = 0; x < gridWidth; x++) {
                board[x][y + 1] = board[x][y];
            }
        }
    }
    awardPoints(cleared.length);
}

function awardPoints(rowsCleared) {
    if (rowsCleared <= 0)
        turnMultiplier = 0;
    else
        turnMultiplier++;

    let points = 500 * rowsCleared * rowsCleared + (2000 * turnMultiplier);
    currentPoints += points;

    let newTotal = clearedRows + rowsCleared;
    if (floor(newTotal / 5) != floor(clearedRows / 5)) {
        level++;
        messageQueue.push(new Message("#2c89f4", "Level Up!"));
    }
    clearedRows = newTotal;

    if (rowsCleared >= 4) {
        messageQueue.push(new Message("#09c600", "Tetro!"));
    } else if (rowsCleared >= 3) {
        messageQueue.push(new Message(0, "Triple Clear!"));
    } else if (rowsCleared >= 2) {
        messageQueue.push(new Message(0, "Double Clear!"));
    }
}

function getPieceFromQueue() {
    while (pieceQueue.length <= 7) {
        let pieces = [pieceI, pieceJ, pieceL, pieceO, pieceS, pieceT, pieceZ];
        pieces.sort(() => Math.random() - 0.5);
        pieceQueue = pieceQueue.concat(pieces);
    }
    return pieceQueue.shift();
}

function getCookie(key) {
    let c = document.cookie;
    if (!c)
        return undefined;
    let start = c.indexOf(key + "=") + key.length + 1;
    let end = c.indexOf(";", start);
    return c.substring(start, end < 0 ? c.length : end);
}

function setCookie(key, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = key + "=" + value + "; expires=" + date.toUTCString();
}