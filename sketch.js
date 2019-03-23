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
const pieceO = new Piece("#FFFF00", 2, 2, [
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
const updateTime = 1000;
let board;

let pieceQueue = [];
let currPiece;
let currX;
let currY;
let previewY;
let currRotation;

let lastUpdateMillis;
let isGameOver;

function setup() {
    createCanvas(640, 480);
    initGame();
}

function initGame() {
    isGameOver = false;
    board = [];
    for (let i = 0; i < gridWidth; i++)
        board[i] = [];
    selectNewPiece();
    lastUpdateMillis = millis();
}

function draw() {
    background(255);
    stroke(0);

    let scale = 20;
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            let field = board[x][y];
            fill(!field ? 255 : field);
            rect(x * scale, y * scale, scale, scale);
        }
    }

    if (!isGameOver) {
        fill(currPiece.color);
        drawPiece(currPiece, currX * scale, currY * scale, currRotation, scale);

        noStroke();
        fill(red(currPiece.color), green(currPiece.color), blue(currPiece.color), 75);
        drawPiece(currPiece, currX * scale, previewY * scale, currRotation, scale);
        stroke(0);

        for (let i = 0; i < 5; i++) {
            fill(pieceQueue[i].color);
            drawPiece(pieceQueue[i], 240, 20 + i * 50, 0, 15);
        }

        let now = millis();
        if (now - lastUpdateMillis >= updateTime) {
            lastUpdateMillis = now;
            movePiece(0, 1);
        }
    } else {
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(50);
        text("Game Over :(", width / 2, height / 2);
    }
}

function drawPiece(piece, theX, theY, rotation, scale) {
    let w = piece.getWidth(rotation);
    let h = piece.getHeight(rotation);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (piece.hasTile(x, y, rotation)) {
                rect(theX + (-floor(w / 2) + x) * scale, theY + (-floor(h / 2) + y) * scale, scale, scale);
            }
        }
    }
}

function keyPressed() {
    if (!isGameOver) {
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
        }
    } else {
        if (key == ' ') {
            initGame();
        }
    }
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
            selectNewPiece();
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

function selectNewPiece() {
    currPiece = getPieceFromQueue();
    currX = floor(gridWidth / 2);
    currY = currPiece.height - 1;
    currRotation = 0;

    if (!isValidPosition(currPiece, currX, currY, currRotation)) {
        isGameOver = true;
    } else {
        updatePreview();
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
}

function getPieceFromQueue() {
    while (pieceQueue.length <= 7) {
        let pieces = [pieceI, pieceJ, pieceL, pieceO, pieceS, pieceT, pieceZ];
        pieces.sort(() => Math.random() - 0.5);
        pieceQueue = pieceQueue.concat(pieces);
    }
    return pieceQueue.shift();
}