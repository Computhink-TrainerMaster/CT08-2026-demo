let handPose;
let video;
let videoW = 640;
let videoH = 480;
let hands = []; // global variable to store hands

let fingerTip; // sprite for index finger tip
let balloon; // sprite for balloon
let bottomWall, topWall, rightWall, leftWall, boundaryGroup;

let gameStarted = false;
let gameOver = false;
let bounceCooldown = 0; // Timer that counts down after a bounce. When > 0, no scoring allowed.
let bounceDelay = 200; // Minimum delay (in ms) between bounces to prevent double scoring
let score = 0;
let bounceSound, gameOverSound;

function preload() {
    // Create options for model settings
  let options = {
    flipped: true, 
    runtime: "tfjs",
    modelType: "lite", // lite or full
    detectorModelUrl: undefined, //default to use the tf.hub model
    landmarkModelUrl: undefined, //default to use the tf.hub model
  }

  // Load the handPose model
  handPose = ml5.handPose(options);

  // load sounds used in game
  bounceSound = createAudio('assets/LowBoing.mp3');
  gameOverSound = createAudio('assets/DunDunn.mp3');
}

function setup() {
  createCanvas(videoW, videoH);

  // p5play world boundaries
  world.gravity.y = 6; // Balloon floats upward gently

  let constraints = {
  video: {
      mandatory: {
      minWidth: videoW,
      minHeight: videoH
      },
      optional: [{ minFrameRate: 60 }]
  },
  audio: false,
  flipped:true, // makes the video mirrored
  };

  // Create the webcam video and hide it
  // video = createCapture(VIDEO);
  video = createCapture(constraints);
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video + model
  handPose.detectStart(video, gotHands);

  // define the finger tip sprite
  fingerTip = new Sprite();
  fingerTip.diameter = 60;
  fingerTip.collider = 'kinematic';
  fingerTip.color = 'rgba(0, 255, 0, 0.05)';
  // fingerTip.visible = false;

  // Sprite for the balloon
  balloon = new Sprite();
  balloon.diameter = 60;
  balloon.collider = 'none';
  balloon.color = 'red';
  balloon.x = width / 2;
  balloon.y = 100  ;

  // Create invisible edge walls to contain the balloon
  topWall = new Sprite(width / 2, 0, width, 10, 'static');
  bottomWall = new Sprite(width / 2, height, width, 10, 'static');
  leftWall = new Sprite(0, height / 2, 10, height, 'static');
  rightWall = new Sprite(width, height / 2, 10, height, 'static');

  boundaryGroup = new Group();
  boundaryGroup.add(topWall);
  boundaryGroup.add(bottomWall);
  boundaryGroup.add(leftWall);
  boundaryGroup.add(rightWall);
  boundaryGroup.visible = false;
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, videoW, videoH);

  // Reduce the cooldown timer every frame
  if (bounceCooldown > 0){
    bounceCooldown = bounceCooldown - deltaTime;
    // deltaTime = time passed since last frame in milliseconds
    // This makes the timer count down smoothly over time
  }

  if (gameOver === false){
    // check if got hands in the array i.e. hand detected
    if (hands.length > 0){
      let hand = hands[0]; // get the default first hand
      let keypoint = hand.keypoints[8]; // get the index tip keypoint

      fingerTip.x = keypoint.x;
      fingerTip.y = keypoint.y;
      fingerTip.visible = true;
    }
    else{
      fingerTip.visible = false;
    }

    // Check if the balloon touches the finger AND bounce cooldown is over
    if (bounceCooldown <= 0 && balloon.collides(fingerTip)){
      score++;
      bounceSound.play();

      // Start a cooldown period so next bounce can only happen after 200ms
      bounceCooldown = bounceDelay;
    }

    // check for game over i.e. balloon hits bottom
    if (balloon.collides(bottomWall)){
      gameOver = true;
      gameOverSound.play();
      balloon.vel.y = 0;
      balloon.vel.x = 0;
      balloon.collider = 'none'; 
    }
  }
  // Display score
  fill(0);  
  textSize(24);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 10, 10);

  // display game over message
  if(gameOver === true){
    textSize(36);
    textAlign(CENTER, CENTER);
    fill('magenta ');
    text("Game Over", width/ 2, height/ 2);
    textSize(18);
    text("Press Space to restart.", width / 2, height / 2 + 40);
  }

  if (gameStarted === false){
    textSize(28);
    textAlign(CENTER, CENTER);
    fill('limegreen');
    textSize(20);
    text("Use Index Finger to bounce the ball.", width / 2, height / 2 -40);
    textSize(28);
    text("Press SPACE to start the game", width / 2, height / 2);
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

function keyPressed() {
  if (key === ' ') {
    gameStarted = true;
    gameOver = false;
    score = 0;

    // Reset balloon state 
    balloon.x = width / 2;
    balloon.y = 100;
    balloon.vel.x = 0;
    balloon.vel.y = 0;
    balloon.collider = 'dynamic';
    balloon.bounciness = 1; 
    balloon.mass = 2;
    balloon.drag = 0.01;
  }
}


