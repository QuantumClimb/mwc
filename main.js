let cubeImages = [];
let topImage2;
let imageFiles = [
  './public/front.jpg',
  './public/back.jpg',
  './public/top.jpg',
  './public/bottom.jpg',
  './public/right.jpg',
  './public/left.jpg'
];

let stickerVisible = true;
let cubeSize = 250;
let showControls = true;
let showAnnotations = false;

let cam;
let minZoom = 200;
let maxZoom = 800;
let initialPos = { x: -400, y: -400, z: 400 };

function preload() {
  for (let i = 0; i < imageFiles.length; i++) {
    cubeImages[i] = loadImage(imageFiles[i]);
  }
  topImage2 = loadImage('./public/top2.jpg');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  let viewerElement = document.getElementById('viewer');
  if (viewerElement) {
    canvas.parent('viewer');
  }

  cam = createCamera();
  cam.setPosition(initialPos.x, initialPos.y, initialPos.z);
  cam.lookAt(0, 0, 0);

  perspective(PI / 3, width / height, 10, 5000);

  let button = document.getElementById('stickerBtn');
  if (button) {
    button.addEventListener('click', toggleSticker);
  }
  
  let annotationButton = document.getElementById('annotationBtn');
  if (annotationButton) {
    annotationButton.addEventListener('click', toggleAnnotations);
    // Set initial button text based on showAnnotations state
    annotationButton.textContent = showAnnotations ? 'Hide Markers' : 'Show Markers';
  }

  setTimeout(() => {
    showControls = false;
  }, 5000);
}

function toggleSticker() {
  stickerVisible = !stickerVisible;
  const button = document.getElementById('stickerBtn');
  if (button) {
    button.textContent = stickerVisible ? 'Remove Sticker' : 'Reveal Sticker';
  }
  
  // Update legend to reflect sticker state
  const topColorDot = document.getElementById('topColorDot');
  const topLabel = document.getElementById('topLabel');
  if (topColorDot && topLabel) {
    if (stickerVisible) {
      topColorDot.style.backgroundColor = 'rgb(255, 255, 0)'; // Yellow
      topLabel.textContent = 'TOP (Sticker)';
    } else {
      topColorDot.style.backgroundColor = 'rgb(255, 128, 0)'; // Orange
      topLabel.textContent = 'TOP (No Sticker)';
    }
  }
}

function toggleAnnotations() {
  showAnnotations = !showAnnotations;
  
  // Update button text
  const button = document.getElementById('annotationBtn');
  if (button) {
    button.textContent = showAnnotations ? 'Hide Markers' : 'Show Markers';
  }
  
  // Toggle legend visibility
  const legend = document.getElementById('legend');
  if (legend) {
    if (showAnnotations) {
      legend.classList.remove('hidden');
    } else {
      legend.classList.add('hidden');
    }
  }
}

function draw() {
  background(17);

  // Enable orbit control
  orbitControl(1, 1, 0.1);

  // Clamp zoom (distance from camera to origin)
  let d = dist(cam.eyeX, cam.eyeY, cam.eyeZ, 0, 0, 0);
  if (d < minZoom || d > maxZoom) {
    let dir = createVector(cam.eyeX, cam.eyeY, cam.eyeZ).normalize();
    let clamped = constrain(d, minZoom, maxZoom);
    cam.setPosition(dir.x * clamped, dir.y * clamped, dir.z * clamped);
  }

  // Lighting
  ambientLight(200);
  directionalLight(255, 255, 255, -1, 0.5, -1);

  noStroke();

  let halfSize = cubeSize / 2;

  push();
  // Front
  push();
  translate(0, 0, halfSize);
  texture(cubeImages[0]);
  plane(cubeSize, cubeSize);
  pop();
  // Back
  push();
  translate(0, 0, -halfSize);
  rotateY(PI);
  texture(cubeImages[1]);
  plane(cubeSize, cubeSize);
  pop();
  // Top
  push();
  translate(0, -halfSize, 0);
  rotateX(PI / 2);
  texture(stickerVisible ? cubeImages[2] : topImage2);
  plane(cubeSize, cubeSize);
  pop();
  // Bottom
  push();
  translate(0, halfSize, 0);
  rotateX(-PI / 2);
  texture(cubeImages[3]);
  plane(cubeSize, cubeSize);
  pop();
  // Right
  push();
  translate(halfSize, 0, 0);
  rotateY(PI / 2);
  texture(cubeImages[4]);
  plane(cubeSize, cubeSize);
  pop();
  // Left
  push();
  translate(-halfSize, 0, 0);
  rotateY(-PI / 2);
  texture(cubeImages[5]);
  plane(cubeSize, cubeSize);
  pop();
  pop();

  // Draw face annotations
  if (showAnnotations) {
    drawFaceAnnotations();
  }

  if (showControls) {
    drawControlsInfo();
  }
}

function drawControlsInfo() {
  push();
  camera();
  fill(176, 0, 32, 180);
  noStroke();
  let boxWidth = 250;
  let boxHeight = 100;
  rect(-width / 2 + 10, -height / 2 + 10, boxWidth, boxHeight, 8);

  fill(255);
  rect(-width / 2 + 25, -height / 2 + 30, 15, 20, 2);
  stroke(255);
  strokeWeight(2);
  noFill();
  arc(-width / 2 + 70, -height / 2 + 40, 20, 20, 0, PI);
  noStroke();
  fill(255);
  rect(-width / 2 + 110, -height / 2 + 38, 8, 2);
  rect(-width / 2 + 125, -height / 2 + 38, 8, 2);
  rect(-width / 2 + 129, -height / 2 + 34, 2, 8);
  rect(-width / 2 + 150, -height / 2 + 30, 2, 8);
  rect(-width / 2 + 150, -height / 2 + 34, 6, 2);
  rect(-width / 2 + 154, -height / 2 + 30, 2, 8);
  pop();
}

function drawFaceAnnotations() {
  push();
  
  // Draw colored spheres as face markers instead of text
  let markers = [
    { color: [255, 0, 0], pos: createVector(0, 0, cubeSize/2 + 20) }, // Red for FRONT
    { color: [0, 255, 255], pos: createVector(0, 0, -cubeSize/2 - 20) }, // Cyan for BACK
    { color: stickerVisible ? [255, 255, 0] : [255, 128, 0], pos: createVector(0, -cubeSize/2 - 20, 0) }, // Yellow/Orange for TOP
    { color: [0, 255, 0], pos: createVector(0, cubeSize/2 + 20, 0) }, // Green for BOTTOM
    { color: [255, 0, 255], pos: createVector(cubeSize/2 + 20, 0, 0) }, // Magenta for RIGHT
    { color: [0, 0, 255], pos: createVector(-cubeSize/2 - 20, 0, 0) } // Blue for LEFT
  ];
  
  for (let marker of markers) {
    push();
    translate(marker.pos.x, marker.pos.y, marker.pos.z);
    fill(marker.color[0], marker.color[1], marker.color[2]);
    noStroke();
    sphere(8);
    pop();
  }
  
  pop();
}

function keyPressed() {
  if (key === 'h' || key === 'H') {
    showControls = !showControls;
  }
  if (key === 'a' || key === 'A') {
    toggleAnnotations();
  }
  if (key === 'r' || key === 'R') {
    cam.setPosition(initialPos.x, initialPos.y, initialPos.z);
    cam.lookAt(0, 0, 0);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI / 3, width / height, 10, 5000);
}
