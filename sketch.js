class Piece {
    constructor(color, width, height, centers, tiles) {
        this.color = color;
        this.width = width;
        this.height = height;
        this.centers = centers;
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

    getCenterX(rotation) {
        return this.centers[rotation][0];
    }

    getCenterY(rotation) {
        return this.centers[rotation][1];
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

class Design {
    constructor(name, colors) {
        this.name = name;
        this.colors = colors;
    }
}

const gameModes = ["Normal", "Cleanup", "Garbage Removal", "Expanse"];

const designs = [
    new Design("Vibrant", ["#969696", "#7777FF", "#0000FF", "#FF7700", "#DDDD00", "#00FF00", "#7700FF", "#FF0000"]),
    new Design("Grayscale", ["#000000", "#727272", "#727272", "#565656", "#727272", "#565656", "#727272", "#565656"]),
    new Design("Google", ["#FFFFFF", "#008744", "#0057e7", "#d62d20", "#ffa700", "#008744", "#0057e7", "#d62d20"]),
    new Design("No Outlines", [undefined, "#7777FF", "#0000FF", "#FF7700", "#DDDD00", "#00FF00", "#7700FF", "#FF0000"]),
    new Design("Pastel", ["#969696", "#fea3aa", "#f8b88b", "#faf884", "#baed91", "#b2cefe", "#f2a2e8", "#faf884"])
];

const defaultCenters = [
    [1, 1],
    [1, 1],
    [1, 0],
    [0, 1]
];
const pieceI = new Piece(1, 4, 1, [
    [1, 0],
    [-1, 1],
    [1, -1],
    [0, 1]
], [
    [true, true, true, true]
]);
const pieceJ = new Piece(2, 3, 2, defaultCenters, [
    [true, false, false],
    [true, true, true]
]);
const pieceL = new Piece(3, 3, 2, defaultCenters, [
    [false, false, true],
    [true, true, true]
]);
const pieceO = new Piece(4, 2, 2, [
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1]
], [
    [true, true],
    [true, true]
]);
const pieceS = new Piece(5, 3, 2, defaultCenters, [
    [false, true, true],
    [true, true, false]
]);
const pieceT = new Piece(6, 3, 2, defaultCenters, [
    [false, true, false],
    [true, true, true]
]);
const pieceZ = new Piece(7, 3, 2, defaultCenters, [
    [true, true, false],
    [false, true, true]
]);

const menuOptions = 5;
let gridWidth;
let gridHeight;

let isMainMenu;
let selectedMenuOption;
let selectedDesign;
let selectedGameMode;

let isGameOver;
let isPaused;

let board;
let displayRatio;
let seed;
let killScreenEnabled;

let pieceQueue;
let currPiece;
let currX;
let currY;
let previewY;
let currRotation;

let holdPiece;
let isSwitchedPiece;

let lastUpdateMillis;
let level;

let highestPoints;
let clearedRows;
let currentPoints;
let turnMultiplier;

let messageQueue;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);

    initMainMenu();

    highestPoints = getCookie("highscore");
    if (!highestPoints)
        highestPoints = 0;
    selectedDesign = getCookie("design");
    if (!selectedDesign)
        selectedDesign = 0;
}

function calcRatios() {
    displayRatio = min(windowWidth / (gridWidth * 2.5), windowHeight / (gridHeight + 2));
}

function initMainMenu() {
    gridWidth = 10;
    gridHeight = 22;
    calcRatios();
    selectedMenuOption = 0;
    selectedGameMode = 0;
    isMainMenu = true;
    seed = undefined;
    killScreenEnabled = true;
}

function initGame() {
    if (seed)
        randomSeed(seed);
    isMainMenu = false;
    isGameOver = false;
    isPaused = false;
    holdPiece = undefined;
    clearedRows = 0;
    currentPoints = 0;
    turnMultiplier = 0
    level = 1;;
    pieceQueue = [];
    messageQueue = [];
    board = [];
    for (let i = 0; i < gridWidth; i++)
        board[i] = [];

    if (selectedGameMode == 1)
        addClutter();
    else if (selectedGameMode == 2)
        addGarbage();

    selectNewPiece(getPieceFromQueue());
    lastUpdateMillis = millis();
}

function addClutter() {
    while (true) {
        let piece = getPieceFromQueue();
        let rotation = floor(random(0, 3));
        let width = piece.getWidth(rotation);
        let x = floor(random(floor(width / 2), floor(gridWidth - width / 2)));

        let y = 1;
        while (isValidPosition(piece, x, y + 1, rotation)) {
            y++;
        }
        if (y <= 8)
            break;
        placePiece(x, y, piece, rotation);
    }
}

function addGarbage() {
    for (let y = gridHeight - 1; y >= 10; y--) {
        let air = floor(random(0, gridWidth));
        for (let x = 0; x < gridWidth; x++) {
            if (x != air) {
                board[x][y] = "#595650";
            }
        }
    }
}

function draw() {
    background(255);

    let boardX = windowWidth / 2 - (gridWidth / 2) * displayRatio;
    let boardY = windowHeight / 2 - (gridHeight / 2) * displayRatio;
    let scale = displayRatio;

    if (isMainMenu) {
        stroke(0);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(scale * 2);
        let s = "Tetro";
        text(s, width / 2, height / 4);
        setOutlineColor();
        fill(currentColors()[pieceT.color]);
        drawPiece(pieceT, width / 2 + textWidth(s) - scale, height / 4 - scale * 2, 1, scale);

        stroke(0);
        fill(0);
        textSize(scale * 0.5);
        text("Totally not a Tetris clone", width / 2 + scale, height / 4 + scale);

        let spacing = scale * 1.5;
        let y = height / 3 + 1.5 * spacing;
        let leftX = width / 2 - gridWidth * 0.85 * scale;
        let rightX = width / 2 + gridWidth * 0.85 * scale;

        setOutlineColor();
        fill(currentColors()[pieceL.color]);
        drawPiece(pieceL, rightX, y + spacing * selectedMenuOption, 1, scale / 2);
        drawPiece(pieceL, leftX, y + scale / 3 + spacing * selectedMenuOption, 3, scale / 2);

        stroke(0);
        fill(0);
        textSize(scale * 1.25);
        text("Play", width / 2, y);
        textSize(scale);

        drawMenuOption("Game Mode", gameModes[selectedGameMode], leftX, rightX, y += spacing);
        let seedText = seed ? seed : (selectedMenuOption == 2 ? "(type numbers)" : "None");
        drawMenuOption("Seed", seedText, leftX, rightX, y += spacing);
        drawMenuOption("Kill Screen", killScreenEnabled ? "Enabled" : "Disabled", leftX, rightX, y += spacing);
        drawMenuOption("Design", designs[selectedDesign].name, leftX, rightX, y += spacing);

        y += spacing * 2;
        textSize(scale * 0.5);
        textAlign(CENTER, CENTER);
        text("Arrow keys to navigate menu", width / 2, y += scale * 0.75);
        text("Enter to select an option", width / 2, y += scale * 0.75);

        textAlign(RIGHT, BOTTOM);
        text("Created by Ellpeck", width - scale, height - scale);
        return;
    }

    setOutlineColor();
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            let field = board[x][y];
            fill(!field || isPaused ? 225 : field);
            rect(boardX + x * scale, boardY + y * scale, scale, scale);
        }
    }
    strokeWeight(4);
    line(boardX, boardY + 2 * scale, boardX + gridWidth * scale, boardY + 2 * scale);
    strokeWeight(1);

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
            setOutlineColor();
            let color = currentColors()[currPiece.color];
            fill(color);
            drawPiece(currPiece, boardX + currX * scale, boardY + currY * scale, currRotation, scale, currY);

            noStroke();
            fill(red(color), green(color), blue(color), 75);
            drawPiece(currPiece, boardX + currX * scale, boardY + previewY * scale, currRotation, scale, previewY);
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
            setOutlineColor();
            for (let i = 0; i < 5; i++) {
                fill(currentColors()[pieceQueue[i].color]);
                drawPiece(pieceQueue[i], boardX + (gridWidth + 2) * scale, boardY + scale + 2 * (i + 1) * scale, 0, queueScale);
            }
        }

        if (holdPiece) {
            setOutlineColor();
            fill(currentColors()[holdPiece.color]);
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
            if (!killScreenEnabled && speedFactor < 0.2)
                speedFactor = 0.2;
            let now = millis();
            if (now - lastUpdateMillis >= 1000 * speedFactor) {
                lastUpdateMillis = now;
                movePiece(0, 1);
            }
        }
    }

    if (isGameOver || isPaused) {
        stroke(0);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(scale * 2);
        text(isPaused ? "Paused" : "Game Over", width / 2, height / 3);
        textSize(scale * 0.75);
        text("Press Enter to quit", width / 2, height / 3 + 1.5 * scale);
    }

    stroke(0);
    fill(0);
    textAlign(RIGHT, BOTTOM);
    let y = boardY + gridHeight * displayRatio;
    textSize(0.5 * scale);
    text("ESC to " + (isPaused ? "unpause" : "pause"), boardX - scale, y - scale * 3.75);
    text("Arrow keys to move", boardX - scale, y - scale * 3);
    text("Q, E to rotate", boardX - scale, y - scale * 2.25);
    text("Space to drop", boardX - scale, y - scale * 1.5);
    text("TAB to hold", boardX - scale, y - scale * 0.75);
}

function currentColors() {
    return designs[selectedDesign].colors;
}

function setOutlineColor() {
    let color = currentColors()[0];
    if (color)
        stroke(color);
    else
        noStroke();
}

function drawMenuOption(left, right, leftX, rightX, y) {
    textAlign(LEFT, TOP);
    text(left, leftX, y);
    textAlign(RIGHT, TOP);
    text(right, rightX, y);
}

function drawPiece(piece, theX, theY, rotation, scale, logicalY) {
    let w = piece.getWidth(rotation);
    let h = piece.getHeight(rotation);
    let startX = theX - piece.getCenterX(rotation) * scale;
    let startY = theY - piece.getCenterY(rotation) * scale;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (piece.hasTile(x, y, rotation) && (logicalY == undefined || logicalY - piece.getCenterY(rotation) + y >= 0)) {
                rect(startX + x * scale, startY + y * scale, scale, scale);
            }
        }
    }
}

function keyPressed() {
    if (isMainMenu) {
        if (keyCode == DOWN_ARROW) {
            selectedMenuOption++;
            if (selectedMenuOption >= menuOptions)
                selectedMenuOption = 0;
        } else if (keyCode == UP_ARROW) {
            selectedMenuOption--;
            if (selectedMenuOption < 0)
                selectedMenuOption = menuOptions - 1;
        } else if (selectedMenuOption == 0 && keyCode == ENTER) {
            initGame();
        } else if (selectedMenuOption == 1) {
            if (keyCode == LEFT_ARROW) {
                selectedGameMode--;
                if (selectedGameMode < 0)
                    selectedGameMode = gameModes.length - 1;
            } else if (keyCode == RIGHT_ARROW) {
                selectedGameMode++;
                if (selectedGameMode >= gameModes.length)
                    selectedGameMode = 0;
            }
        } else if (selectedMenuOption == 2) {
            if (keyCode == BACKSPACE) {
                if (seed)
                    seed = seed.substring(0, seed.length - 1);
            } else if (int(key) >= 0 && int(key) <= 9) {
                if (!seed)
                    seed = "";
                seed += key;
            }
        } else if (selectedMenuOption == 3 && (keyCode == LEFT_ARROW || keyCode == RIGHT_ARROW || keyCode == ENTER)) {
            killScreenEnabled = !killScreenEnabled;
        } else if (selectedMenuOption == 4) {
            if (keyCode == LEFT_ARROW) {
                selectedDesign--;
                if (selectedDesign < 0)
                    selectedDesign = designs.length - 1;
            } else if (keyCode == RIGHT_ARROW) {
                selectedDesign++;
                if (selectedDesign >= designs.length)
                    selectedDesign = 0;
            } else {
                return;
            }
            setCookie("design", selectedDesign, 365);
        }
        return;
    }

    if (!isGameOver) {
        if (keyCode == ESCAPE) {
            isPaused = !isPaused;
        } else if (isPaused) {
            if (keyCode == ENTER) {
                initMainMenu();
            }
        } else if (!isPaused) {
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
            initMainMenu();
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
        let kicks = [];
        let w = floor(currPiece.getWidth(newRotation) / 2);
        for (let x = -w; x <= w; x++) {
            if (x != 0)
                kicks.push([x, 0]);
        }
        let h = floor(currPiece.getHeight(newRotation) / 2);
        for (let y = -h; y <= h; y++) {
            if (y != 0)
                kicks.push([0, y]);
        }
        kicks.sort((a, b) => (abs(a[0]) + abs(a[1])) - (abs(b[0]) + abs(b[1])));
        for (kick of kicks) {
            if (isValidPosition(currPiece, currX + kick[0], currY + kick[1], newRotation)) {
                currX += kick[0];
                currY += kick[1];
                currRotation = newRotation;
                break;
            }
        }
    } else {
        currRotation = newRotation;
    }
}

function movePiece(xOff, yOff) {
    let newX = currX + xOff;
    let newY = currY + yOff;
    if (!isValidPosition(currPiece, newX, newY, currRotation)) {
        if (yOff > 0) {
            placePiece(currX, currY, currPiece, currRotation);
            clearRows();
            selectNewPiece(getPieceFromQueue());
        }
        return false;
    }
    currX = newX;
    currY = newY;
    return true;
}

function placePiece(theX, theY, piece, rotation) {
    let w = piece.getWidth(rotation);
    let h = piece.getHeight(rotation);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if (!piece.hasTile(x, y, rotation))
                continue;
            board[theX - piece.getCenterX(rotation) + x][theY - piece.getCenterY(rotation) + y] = currentColors()[piece.color];
        }
    }

    if (selectedGameMode == 3) {
        if (theY <= 6 && gridHeight < 52) {
            gridHeight += h;
            calcRatios();

            let rowsToMove = [];
            for (let i = 1; i <= h; i++)
                rowsToMove.push(gridHeight - i);
            moveRowsDown(rowsToMove);
        }
    }
}

function selectNewPiece(piece) {
    currPiece = piece;
    currX = floor(gridWidth / 2);
    currY = 1;
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
            let newX = x - piece.getCenterX(rotation) + xOff;
            let newY = y - piece.getCenterY(rotation) + yOff;
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
    moveRowsDown(cleared);
    awardPoints(cleared.length);
}

function moveRowsDown(rows) {
    for (let i = rows.length - 1; i >= 0; i--) {
        for (let y = rows[i] - 1; y >= 0; y--) {
            for (let x = 0; x < gridWidth; x++) {
                board[x][y + 1] = board[x][y];
            }
        }
    }
}

function awardPoints(rowsCleared) {
    if (rowsCleared >= 4) {
        messageQueue.push(new Message("#09c600", "Tetro!"));
    } else if (rowsCleared >= 3) {
        messageQueue.push(new Message(0, "Triple Clear!"));
    } else if (rowsCleared >= 2) {
        messageQueue.push(new Message(0, "Double Clear!"));
    }

    if (rowsCleared <= 0)
        turnMultiplier = 0;
    else
        turnMultiplier++;

    let points = 500 * rowsCleared * rowsCleared + (2000 * turnMultiplier);
    let newPoints = currentPoints + points;
    if (currentPoints <= highestPoints && newPoints > highestPoints) {
        messageQueue.push(new Message("#ff7905", "New Highscore!"));
    }
    currentPoints = newPoints;

    let newTotal = clearedRows + rowsCleared;
    if (floor(newTotal / 5) != floor(clearedRows / 5)) {
        level++;
        messageQueue.push(new Message("#2c89f4", "Level Up!"));
    }
    clearedRows = newTotal;
}

function getPieceFromQueue() {
    while (pieceQueue.length <= 7) {
        let pieces = [pieceI, pieceJ, pieceL, pieceO, pieceS, pieceT, pieceZ];
        pieces.sort(() => random() - 0.5);
        pieceQueue = pieceQueue.concat(pieces);
    }
    return pieceQueue.shift();
}

function getCookie(key) {
    let c = document.cookie;
    if (!c)
        return undefined;
    let keyIndex = c.indexOf(key + "=");
    if (keyIndex < 0)
        return undefined;
    let start = keyIndex + key.length + 1;
    let end = c.indexOf(";", start);
    return c.substring(start, end < 0 ? c.length : end);
}

function setCookie(key, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = key + "=" + value + "; expires=" + date.toUTCString();
}