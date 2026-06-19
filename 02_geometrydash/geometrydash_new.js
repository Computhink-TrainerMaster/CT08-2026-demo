//player box
let box;

// game variables
let startGame = false;
let mapUsed;
let startCoordinates = [];
const MAX_JUMP = 1;
let jumpChance = MAX_JUMP;
let gameOver = false;
let endTimer = 0;
let level = 1;
let lastlevel = 2;
let lost = true;

// asset names
let cube;
let cube2;
let startGameImg;
let endGameImg;
let spike;
let tileMap1;
let tileMap2;
let bg;

// world building groups
let ground;
let orbs;
let sharp;
let finishline;
let particles;

// image sprites
let startImg;
let endImg;

// menu
let menuOpen = false;
let menu;
let menuImg;
let menubg;
let menubgImg;
let choice1;
let choice2;

// sound assets
let backgroundTrack;
let failSound;
let passSound;

function preload() {
    bg = loadImage('assets/geobg.png');
    cube = loadImage('assets/cube.png');
    cube2 = loadImage('assets/cube2.png');
    startGameImg = loadImage('assets/startgame.png');
    endGameImg = loadImage('assets/clear!.png');
    spike = loadImage('assets/spike.png');
    menu = loadImage('assets/menu.png');
    menubgImg = loadImage('assets/menubg.png');

    tileMap1 = loadStrings('stages/tiles1.txt');
    tileMap2 = loadStrings('stages/tiles2.txt');

    backgroundTrack = createAudio('assets/stereo-madness.mp3');
    failSound = createAudio('assets/geometry-dash-death-sound.mp3');
    passSound = createAudio('assets/game-start.mp3');
}

function setup() {
    new Canvas(700, 600);
    world.gravity.y = 32;

    box = new Sprite(50, height, 50, 50);
    box.img = cube;
    box.friction = 0;
    box.bounciness = 0;
    box.collider = "none";

    startCoordinates = [50, height - box.height/2];

    ground = new Group();
    ground.tile = 'g';
    ground.w = 50;
    ground.h = 50;
    ground.collider = 'static';
    ground.color = 'black';
    ground.stroke = 'rgba(0,0,0,0)';

    orbs = new Group();
    orbs.tile = 'o';
    orbs.d = 24;
    orbs.collider = 'static';
    orbs.color = 'white';
    orbs.strokeWeight = 0;

    sharp = new Group();
    sharp.tile = 's';
    sharp.h = 25;
    sharp.w = 25;
    sharp.img = spike;
    sharp.collider = 'static';

    finishline = new Group();
    finishline.tile = 'f';
    finishline.w = 50;
    finishline.h = 1200;
    finishline.visible = false;
    finishline.collider = 'static';

    particles = new Group();

    new Tiles(tileMap1, 0, 0, 50, 50);
    mapUsed = tileMap1;

    startImg = new Sprite(width / 2, height / 2, 190, 90);
    startImg.img = startGameImg;
    startImg.collider = 'none';

    menuImg = new Sprite(50, 20, 92, 29);
    menuImg.img = menu;
    menuImg.collider = 'static';

    menubg = new Sprite(width / 2, height / 2, 240, 140, 'static');
    menubg.img = menubgImg;

    choice1 = new Sprite(width / 2 - 50, height / 2, 50, 50, 'static');
    choice2 = new Sprite(width / 2 + 50, height / 2, 50, 50, 'static');

    choice1.img = cube;
    choice2.img = cube2;

    closeMenu();
}

function draw() {
    drawBackground();

    if (!startGame && (mouse.presses() || kb.presses('space'))) {
        if (menuImg.mouse.hovering() && menuImg.visible === true) {
            menuOpen = true;
            openMenu();
        } else if (menuOpen === false) {
            startGame = true;
            startImg.visible = false;
            menuImg.visible = false;
        }

        choiceSelect();

    } else if (!startGame) {
        if ((frameCount % 60) < 30) {
            startImg.visible = true;
        } else {
            startImg.visible = false;
        }

        menuImg.visible = true;
    }

    if (startGame) {
        if (backgroundTrack.elt.paused) {
            backgroundTrack.play();
        }

        box.collider = "dynamic";
        box.vel.x = 8;

        if (box.x >= width / 2) {
            camera.x = box.x;
        } else {
            camera.x = width/2;
        }

        for (let orb of orbs) {
            if (box.colliding(orb)) {
                orb.visible = false;
                orb.collider = 'none';
                box.vel.y = -5;
                jumpChance = MAX_JUMP;
            }
        }

        for (let tile of ground) {
            if (box.colliding(tile)) {
                if (abs(tile.x - box.x) > 100) continue;

                let leftEdge = tile.x - tile.w / 2;
                let leftEdgeHeight = tile.y - tile.h / 2;

                if (box.x < leftEdge && box.y > leftEdgeHeight) {
                    lost = true;
                    resetGame();
                    break;
                }
            }
        }

        if (box.collides(sharp)) {
            startGame = false;
            lost = true;
            resetGame();
        }

        if (box.collides(finishline)) {
            lost = false;
            triggerGameOver();
        }

        if (gameOver) {
            if (frameCount - endTimer > 120) {
                if (endImg) {
                    endImg.remove();
                }

                startGame = false;
                gameOver = false;
                resetGame();

                level += 1;
                loadLevel();
            }
        }

        if ((kb.presses('space') || mouse.presses()) && jumpChance > 0 && !gameOver) {
            box.vel.y = -10;
            box.rotateTo(box.rotation + 360, 15);
            jumpChance -= 1;
        }

        if (box.collides(ground) && jumpChance < MAX_JUMP) {
            jumpChance = MAX_JUMP;
        }

        if (frameCount % 3 === 0 && box.colliding(ground) && box.vel.x >= 0.5) {
            box.rotation = 0;

            let particle = new Sprite(box.x, box.y + box.h / 2, 8, 8, 'none');
            particle.color = 'white';
            particle.strokeWeight = 0;
            particle.vel.x = -5;
            particle.vel.y = random(-2, 0);
            particle.life = 30;
            particles.add(particle);
        }
    }
}

function drawBackground() {
    let lastRow = mapUsed[mapUsed.length - 1];
    let numCols = lastRow.length;
    let totalJourney = numCols * 50;

    let progress = map(box.x, 0, totalJourney, -100, 0);

    let c1 = color('#9933ff');
    let c2 = color('#4169e1');

    let amt = (sin(frameCount * 0.5) + 1) / 2;
    let blend = lerpColor(c1, c2, amt);

    tint(blend);
    image(bg, progress, 0, 800, 600);
    noTint();
}

function resetGame() {
    if (lost) {
        backgroundTrack.stop();
        failSound.play();
    }

    particles.removeAll();

    startGame = false;

    box.vel.y = 0;
    box.vel.x = 0;
    box.rotation = 0;

    box.x = startCoordinates[0];
    box.y = startCoordinates[1];

    jumpChance = MAX_JUMP;

    camera.x = width / 2;

    for (let orb of orbs) {
        orb.visible = true;
        orb.collider = 'static';
    }
}

function triggerGameOver() {
    backgroundTrack.stop();

    if (!gameOver) {
        passSound.play();

        box.vel.x = 0;
        jumpChance = 0;

        gameOver = true;
        endTimer = frameCount;

        if (endImg) {
            endImg.remove();
        }

        endImg = new Sprite(box.x, height / 2, 126, 24);
        endImg.collider = 'none';
        endImg.img = endGameImg;
    }
}

function loadLevel() {
    ground.removeAll();
    sharp.removeAll();
    orbs.removeAll();
    finishline.removeAll();

    if (lastlevel < level) {
        level = 1;
    }

    if (level === 1) {
        new Tiles(tileMap1, 0, 0, 50, 50);
        mapUsed = tileMap1;
    } else if (level === 2) {
        new Tiles(tileMap2, 0, 0, 50, 50);
        mapUsed = tileMap2;
    }
}

function openMenu() {
    menubg.visible = true;
    choice1.visible = true;
    choice2.visible = true;

    menubg.collider = 'static';
    choice1.collider = 'static';
    choice2.collider = 'static';
}

function closeMenu() {
    menuOpen = false;

    menubg.visible = false;
    choice1.visible = false;
    choice2.visible = false;

    menubg.collider = 'none';
    choice1.collider = 'none';
    choice2.collider = 'none';
}

function choiceSelect() {
    if (menuOpen) {
        let clicked = world.getSpriteAt(mouse);

        if (clicked == choice1) {
            box.img = cube;
            closeMenu();
        } else if (clicked == choice2) {
            box.img = cube2;
            closeMenu();
        }
    }
}