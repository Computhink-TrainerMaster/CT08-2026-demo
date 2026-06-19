let handPose;
let video;
let videoW = 640;
let videoH = 480;
let hands = []; // global variable to store hands

function preload() {
    // Create options for model settings
  let options = {
    flipped: true,
    runtime: "tfjs",
    modelType: "full",
    detectorModelUrl: undefined, //default to use the tf.hub model
    landmarkModelUrl: undefined, //default to use the tf.hub model
  }

  // Load the handPose model
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(videoW, videoH);
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
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, videoW, videoH);

  // Draw all the tracked hand points
  // Loop through all the hands detected (can detect left or right)
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i]; // current hand (left or right)

    // loop through all the 21 keypoints
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];

      // for every keypoint, draw a circle.
      circle(keypoint.x, keypoint.y, 10);
    }
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}


