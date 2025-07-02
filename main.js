// p5.js 3D Cube Viewer - Enhanced Camera Controls
let cubeImages = [];
let topImage2; // Alternative top image
let imageFiles = [
  './public/front.jpg',
  './public/back.jpg', 
  './public/top.jpg',
  './public/bottom.jpg',
  './public/right.jpg',
  './public/left.jpg'
];

let stickerVisible = true; // Track sticker state
let isMobile = false; // Track if we're on mobile
let cubeSize = 200; // Default cube size

// Camera variables
let cameraDistance = 400;
let cameraAngleX = 0;
let cameraAngleY = 0;
let showControls = true;

function preload() {
  // Load all cube face images
  for (let i = 0; i < imageFiles.length; i++) {
    cubeImages[i] = loadImage(imageFiles[i]);
  }
  // Load alternative top image
  topImage2 = loadImage('./public/top2.jpg');
}

function setup() {
  // Detect mobile and set cube size once
  isMobile = windowWidth < 600 || window.innerWidth < 600;
  cubeSize = isMobile ? min(windowWidth, windowHeight, window.innerWidth, window.innerHeight) * 0.4 : 200;
  
  // Create canvas and attach to viewer div
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Safely attach to viewer div
  let viewerElement = document.getElementById('viewer');
  if (viewerElement) {
    canvas.parent('viewer');
  }
  
  // Set better perspective for 3D rendering
  perspective(PI/3.0, width/height, 10, 5000);
  
  // Set background color
  background(17, 17, 17);
  
  // Set initial camera position for better view
  cameraDistance = isMobile ? cubeSize * 2 : cubeSize * 2.5;
  
  // Add button event listener
  let button = document.getElementById('stickerBtn');
  if (button) {
    button.addEventListener('click', toggleSticker);
  }

  // Hide controls after 5 seconds
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
}

function draw() {
  background(17, 17, 17);
  
  // Enhanced camera controls with better positioning
  orbitControl();
  
  // Alternative: Manual camera control (uncomment to use instead of orbitControl)
  // camera(
  //   cameraDistance * cos(cameraAngleY) * cos(cameraAngleX),
  //   cameraDistance * sin(cameraAngleX),
  //   cameraDistance * sin(cameraAngleY) * cos(cameraAngleX),
  //   0, 0, 0,
  //   0, 1, 0
  // );
  
  // Add some ambient lighting for better 3D appearance
  ambientLight(100);
  directionalLight(255, 255, 255, -1, 0.5, -1);
  
  // Remove wireframe lines
  noStroke();
  
  // Use the fixed cube size set in setup
  let halfSize = cubeSize / 2;
  
  // Draw the textured cube
  push();
  
  // Front face
  push();
  translate(0, 0, halfSize);
  texture(cubeImages[0]);
  plane(cubeSize, cubeSize);
  pop();
  
  // Back face  
  push();
  translate(0, 0, -halfSize);
  rotateY(PI);
  texture(cubeImages[1]);
  plane(cubeSize, cubeSize);
  pop();
  
  // Top face
  push();
  translate(0, -halfSize, 0);
  rotateX(PI/2);
  texture(stickerVisible ? cubeImages[2] : topImage2);
  plane(cubeSize, cubeSize);
  pop();
  
  // Bottom face
  push();
  translate(0, halfSize, 0);
  rotateX(-PI/2);
  texture(cubeImages[3]);
  plane(cubeSize, cubeSize);
  pop();
  
  // Right face
  push();
  translate(halfSize, 0, 0);
  rotateY(PI/2);
  texture(cubeImages[4]);
  plane(cubeSize, cubeSize);
  pop();
  
  // Left face
  push();
  translate(-halfSize, 0, 0);
  rotateY(-PI/2);
  texture(cubeImages[5]);
  plane(cubeSize, cubeSize);
  pop();
  
  pop();
  
  // Display camera controls info
  if (showControls) {
    drawControlsInfo();
  }
}

function drawControlsInfo() {
  // Switch to 2D mode for UI text
  camera();
  hint(DISABLE_DEPTH_TEST);
  
  // Semi-transparent background
  fill(0, 0, 0, 150);
  noStroke();
  rect(-width/2, height/2 - 120, width, 100);
  
  // White text
  fill(255);
  textAlign(CENTER);
  textSize(isMobile ? 14 : 16);
  text("🎮 CAMERA CONTROLS:", 0, height/2 - 90);
  textSize(isMobile ? 12 : 14);
  text("• Drag to rotate camera around cube", 0, height/2 - 65);
  text("• Scroll wheel or pinch to zoom in/out", 0, height/2 - 45);
  text("• Right-click drag to pan camera", 0, height/2 - 25);
  
  hint(ENABLE_DEPTH_TEST);
}

// Enhanced mouse controls
function keyPressed() {
  // Press 'H' to toggle help
  if (key === 'h' || key === 'H') {
    showControls = !showControls;
  }
  
  // Press 'R' to reset camera
  if (key === 'r' || key === 'R') {
    // Reset orbitControl camera (this is approximate)
    cameraAngleX = 0;
    cameraAngleY = 0;
  }
}

function windowResized() {
  // Recalculate mobile detection and cube size on resize
  isMobile = windowWidth < 600 || window.innerWidth < 600;
  cubeSize = isMobile ? min(windowWidth, windowHeight, window.innerWidth, window.innerHeight) * 0.4 : 200;
  cameraDistance = isMobile ? cubeSize * 2 : cubeSize * 2.5;
  
  resizeCanvas(windowWidth, windowHeight);
  
  // Reset perspective for new canvas size
  perspective(PI/3.0, width/height, 10, 5000);
}
