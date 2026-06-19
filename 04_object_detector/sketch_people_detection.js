let video;
let detector;
let detections = [];
let showBordersCheckbox;

// DOM references for lightweight UI updates.
const countEl = document.getElementById("people-count");
const statusEl = document.getElementById("status-text");

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("sketch-holder");

  // Use webcam feed as input and hide the raw HTML video element.
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Create control panel checkbox using p5 DOM.
  showBordersCheckbox = createCheckbox("Show tracking borders", true);
  showBordersCheckbox.parent("controls-host");

  initializeDetector();
}

function initializeDetector() {
  // Support both ml5 APIs used across versions.
  const detectorFactory = ml5.objectDetector || ml5.objectDetection;

  if (!detectorFactory) {
    statusEl.textContent = "Object detector API not found in loaded ml5.js version.";
    return;
  }

  statusEl.textContent = "Loading model...";

  detector = detectorFactory("cocossd", () => {
    statusEl.textContent = "Model ready. Detecting people...";

    // Newer API: internal continuous loop.
    if (typeof detector.detectStart === "function") {
      detector.detectStart(video, gotDetections);
      return;
    }

    // Older API: recursive detect callback loop.
    if (typeof detector.detect === "function") {
      runDetectionLoop();
      return;
    }

    statusEl.textContent = "Detector loaded, but no supported detect method was found.";
  });
}

function runDetectionLoop() {
  detector.detect(video, (error, results) => {
    if (error) {
      statusEl.textContent = "Detection error. Check console for details.";
      // Keep loop alive even after transient errors.
      requestAnimationFrame(runDetectionLoop);
      return;
    }

    gotDetections(results);
    requestAnimationFrame(runDetectionLoop);
  });
}

// Callback called after each detection cycle.
function gotDetections(results) {
  detections = results || [];
}

function draw() {
  image(video, 0, 0, width, height);

  // Build a list of only person detections.
  const peopleDetections = detections.filter((detection) => detection.label === "person");

  // Counter at the top updates in real time.
  countEl.textContent = peopleDetections.length;

  if (showBordersCheckbox.checked()) {
    for (let i = 0; i < peopleDetections.length; i += 1) {
      const person = peopleDetections[i];

      // Draw tracking border and label for each detected person.
      stroke(34, 197, 94);
      strokeWeight(3);
      noFill();
      rect(person.x, person.y, person.width, person.height);

      noStroke();
      fill(34, 197, 94);
      textSize(16);
      text("person", person.x + 6, person.y > 20 ? person.y - 6 : person.y + 18);
    }
  }
}
