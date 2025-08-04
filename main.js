// Three.js Scene Setup
let scene, camera, renderer, controls;
let currentModel = null;
let models = {};
let currentModelName = 'V1';
let pointLightGizmo = null;
let debugMode = false;

// Camera presets
const cameraPresets = {
  front: { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } },
  back: { position: { x: 0, y: 0, z: -10 }, target: { x: 0, y: 0, z: 0 } },
  left: { position: { x: -10, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  right: { position: { x: 10, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  top: { position: { x: 0, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  bottom: { position: { x: 0, y: -10, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  isometric: { position: { x: 8, y: 8, z: 8 }, target: { x: 0, y: 0, z: 0 } },
  default: { position: { x: 0, y: 3, z: 12 }, target: { x: 0, y: 0, z: 0 } }
};

// Model configurations
const modelConfigs = {
  V1: {
    path: './public/models/V1.glb',
    name: 'Model 1',
    scale: 1.0,
    position: { x: 0, y: -0.45, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },
  V2: {
    path: './public/models/V2.glb', // You can add more models here
    name: 'Model 2',
    scale: 1.0,
    position: { x: 0, y: -0.45, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  },

};

// Lighting variables
let ambientLight, hemisphereLight, directionalLight, pointLight;
let lightingControls = {
  ambient: { intensity: 1.0 },
  hemisphere: { intensity: 0.8, skyColor: 0xc9c9c9, groundColor: 0xd1d1d1 },
  directional: { intensity: 1.0, position: { x: 5, y: 10, z: 5 } },
  point: { intensity: 1.0, position: { x: 0, y: 2, z: 0 } }
};

// Initialize the 3D scene
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 3, 12);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Add renderer to DOM
  const container = document.getElementById('canvas-container');
  container.appendChild(renderer.domElement);

  // Add orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 2; // Limit to prevent going below floor
  controls.minPolarAngle = 0; // Prevent camera from going below floor

  // Add lighting
  setupLighting();

  // Add infinite floor
  setupFloor();

  // Load initial model
  loadModel('V1');

  // Add event listeners
  setupEventListeners();

  // Create lighting controls
  createLightingControls();

  // Create camera preset controls
  createCameraPresetControls();

  // Create point light gizmo
  createPointLightGizmo();

  // Setup debug mode
  setupDebugMode();

  // Initialize gallery
  initGallery();

  // Start animation loop
  animate();
}

// Setup lighting for the scene
function setupLighting() {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0x404040, lightingControls.ambient.intensity);
  scene.add(ambientLight);

  // Hemisphere light (sky and ground lighting)
  hemisphereLight = new THREE.HemisphereLight(
    lightingControls.hemisphere.skyColor,
    lightingControls.hemisphere.groundColor,
    lightingControls.hemisphere.intensity
  );
  scene.add(hemisphereLight);

  // Directional light for shadows and highlights
  directionalLight = new THREE.DirectionalLight(0xffffff, lightingControls.directional.intensity);
  directionalLight.position.set(
    lightingControls.directional.position.x,
    lightingControls.directional.position.y,
    lightingControls.directional.position.z
  );
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // Point light in the center
  pointLight = new THREE.PointLight(0xffffff, lightingControls.point.intensity, 100);
  pointLight.position.set(
    lightingControls.point.position.x,
    lightingControls.point.position.y,
    lightingControls.point.position.z
  );
  scene.add(pointLight);
}

// Setup infinite white floor
function setupFloor() {
  // Create a large plane for the floor
  const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
  const floorMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  floor.position.y = -0.5; // Position at model's base level
  floor.receiveShadow = true;
  
  scene.add(floor);
}

// Load a GLB model
function loadModel(modelName) {
  const config = modelConfigs[modelName];
  if (!config) {
    console.error(`Model configuration not found for: ${modelName}`);
    return;
  }

  // Show loading screen
  showLoading(true);

  // Remove current model if it exists
  if (currentModel) {
    scene.remove(currentModel);
  }

  // Create GLTF loader with DRACO support
  const loader = new THREE.GLTFLoader();
  
  // Set up DRACO loader
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
  loader.setDRACOLoader(dracoLoader);

  // Load the model
  loader.load(
    config.path,
    function (gltf) {
      const model = gltf.scene;
      
      // Apply model configuration
      model.scale.setScalar(config.scale);
      model.position.set(config.position.x, config.position.y, config.position.z);
      model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);

      // Enable shadows for all meshes
      model.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Don't center the model - use the configured position

      // Add to scene
      scene.add(model);
      currentModel = model;
      currentModelName = modelName;

      // Search for Mannai_Blue material
      console.log(`Processing Mannai_Blue materials for ${modelName}...`);
      findMannaiBlueMaterial(model);

      // Remove shadows for specific materials
      console.log(`Processing shadow removal for specific materials in ${modelName}...`);
      removeShadowsForSpecificMaterials(model);

      // Update button states
      updateButtonStates(modelName);

      // Hide loading screen
      showLoading(false);

      // Reset camera position
      resetCamera();

      console.log(`Model ${modelName} loaded successfully`);
    },
    function (xhr) {
      // Progress callback
      const percent = (xhr.loaded / xhr.total) * 100;
      console.log(`Loading ${modelName}: ${percent.toFixed(0)}%`);
    },
    function (error) {
      // Error callback
      console.error(`Error loading model ${modelName}:`, error);
      showLoading(false);
      
      // Show error message
      showError(`Failed to load ${config.name}. Please check if the file exists.`);
    }
  );
}

// Show/hide loading screen
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

// Show error message
function showError(message) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `
      <div class="spinner" style="border-top-color: #f5576c;"></div>
      <h3 style="color: #f5576c;">Error</h3>
      <p>${message}</p>
    `;
  }
}

// Update button states
function updateButtonStates(activeModel) {
  const buttons = document.querySelectorAll('.model-button');
  buttons.forEach(button => {
    const modelName = button.getAttribute('data-model');
    if (modelName === activeModel) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// Reset camera to default position
function resetCamera() {
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);
  controls.reset();
}

// Set camera to a specific preset
function setCameraPreset(presetName) {
  const preset = cameraPresets[presetName];
  if (preset) {
    // Smooth camera transition
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3();
    controls.target.clone(startTarget);
    
    const endPosition = new THREE.Vector3(preset.position.x, preset.position.y, preset.position.z);
    const endTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);
    
    // Animate camera movement
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPosition, endPosition, easeProgress);
      controls.target.lerpVectors(startTarget, endTarget, easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    }
    
    animateCamera();
    
    console.log(`Camera moved to ${presetName} preset`);
  } else {
    console.error(`Camera preset "${presetName}" not found`);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Model selector buttons
  const buttons = document.querySelectorAll('.model-button');
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      const modelName = this.getAttribute('data-model');
      if (modelName !== currentModelName) {
        loadModel(modelName);
      }
    });
  });

  // Keyboard controls
  document.addEventListener('keydown', function(event) {
    switch(event.key.toLowerCase()) {
      case 'r':
        resetCamera();
        break;
      case '1':
        loadModel('V1');
        break;
      case '2':
        loadModel('V2');
        break;

    }
  });

  // Window resize
  window.addEventListener('resize', onWindowResize);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Render scene
  renderer.render(scene, camera);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  init();
});

// Create lighting controls
function createLightingControls() {
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'lighting-controls debug-controls';
  controlsContainer.innerHTML = `
    <h3>Lighting Controls</h3>
    <div class="control-group">
      <label>Ambient Intensity: <span id="ambientValue">1.0</span></label>
      <input type="range" id="ambientSlider" min="0" max="3" step="0.1" value="1.0">
    </div>
    <div class="control-group">
      <label>Hemisphere Intensity: <span id="hemisphereValue">0.8</span></label>
      <input type="range" id="hemisphereSlider" min="0" max="2" step="0.1" value="0.8">
    </div>
    <div class="control-group">
      <label>Sky Color: <span id="skyColorValue">#c9c9c9</span></label>
      <input type="color" id="skyColorPicker" value="#c9c9c9">
    </div>
    <div class="control-group">
      <label>Ground Color: <span id="groundColorValue">#d1d1d1</span></label>
      <input type="color" id="groundColorPicker" value="#d1d1d1">
    </div>
    <div class="control-group">
      <label>Directional Intensity: <span id="directionalValue">1.0</span></label>
      <input type="range" id="directionalSlider" min="0" max="2" step="0.1" value="1.0">
    </div>
    <div class="control-group">
      <label>Directional X: <span id="dirXValue">5</span></label>
      <input type="range" id="dirXSlider" min="-20" max="20" step="1" value="5">
    </div>
    <div class="control-group">
      <label>Directional Y: <span id="dirYValue">10</span></label>
      <input type="range" id="dirYSlider" min="-20" max="20" step="1" value="10">
    </div>
    <div class="control-group">
      <label>Directional Z: <span id="dirZValue">5</span></label>
      <input type="range" id="dirZSlider" min="-20" max="20" step="1" value="5">
    </div>
    <div class="control-group">
      <label>Point Light Intensity: <span id="pointValue">1.0</span></label>
      <input type="range" id="pointSlider" min="0" max="3" step="0.1" value="1.0">
    </div>
    <div class="control-group">
      <label>Point Light X: <span id="pointXValue">0</span></label>
      <input type="range" id="pointXSlider" min="-10" max="10" step="0.1" value="0">
    </div>
    <div class="control-group">
      <label>Point Light Y: <span id="pointYValue">2</span></label>
      <input type="range" id="pointYSlider" min="-5" max="10" step="0.1" value="2">
    </div>

    <hr style="margin: 20px 0; border: 1px solid #ddd;">


  `;
  
  document.body.appendChild(controlsContainer);
  
  // Add event listeners for sliders
  setupLightingSliders();
}

// Setup lighting slider event listeners
function setupLightingSliders() {
  // Ambient light intensity
  const ambientSlider = document.getElementById('ambientSlider');
  const ambientValue = document.getElementById('ambientValue');
  if (ambientSlider && ambientValue) {
    ambientSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.ambient.intensity = value;
      ambientValue.textContent = value.toFixed(1);
      if (ambientLight) {
        ambientLight.intensity = value;
      }
    });
  }

  // Hemisphere light intensity
  const hemisphereSlider = document.getElementById('hemisphereSlider');
  const hemisphereValue = document.getElementById('hemisphereValue');
  if (hemisphereSlider && hemisphereValue) {
    hemisphereSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.hemisphere.intensity = value;
      hemisphereValue.textContent = value.toFixed(1);
      if (hemisphereLight) {
        hemisphereLight.intensity = value;
      }
    });
  }

  // Sky color picker
  const skyColorPicker = document.getElementById('skyColorPicker');
  const skyColorValue = document.getElementById('skyColorValue');
  if (skyColorPicker && skyColorValue) {
    skyColorPicker.addEventListener('input', function() {
      const color = this.value;
      lightingControls.hemisphere.skyColor = color;
      skyColorValue.textContent = color;
      if (hemisphereLight) {
        hemisphereLight.color.setHex(parseInt(color.replace('#', ''), 16));
      }
    });
  }

  // Ground color picker
  const groundColorPicker = document.getElementById('groundColorPicker');
  const groundColorValue = document.getElementById('groundColorValue');
  if (groundColorPicker && groundColorValue) {
    groundColorPicker.addEventListener('input', function() {
      const color = this.value;
      lightingControls.hemisphere.groundColor = color;
      groundColorValue.textContent = color;
      if (hemisphereLight) {
        hemisphereLight.groundColor.setHex(parseInt(color.replace('#', ''), 16));
      }
    });
  }

  // Directional light intensity
  const directionalSlider = document.getElementById('directionalSlider');
  const directionalValue = document.getElementById('directionalValue');
  if (directionalSlider && directionalValue) {
    directionalSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.directional.intensity = value;
      directionalValue.textContent = value.toFixed(1);
      if (directionalLight) {
        directionalLight.intensity = value;
      }
    });
  }

  // Directional light position X
  const dirXSlider = document.getElementById('dirXSlider');
  const dirXValue = document.getElementById('dirXValue');
  if (dirXSlider && dirXValue) {
    dirXSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.directional.position.x = value;
      dirXValue.textContent = value;
      if (directionalLight) {
        directionalLight.position.x = value;
      }
    });
  }

  // Directional light position Y
  const dirYSlider = document.getElementById('dirYSlider');
  const dirYValue = document.getElementById('dirYValue');
  if (dirYSlider && dirYValue) {
    dirYSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.directional.position.y = value;
      dirYValue.textContent = value;
      if (directionalLight) {
        directionalLight.position.y = value;
      }
    });
  }

  // Directional light position Z
  const dirZSlider = document.getElementById('dirZSlider');
  const dirZValue = document.getElementById('dirZValue');
  if (dirZSlider && dirZValue) {
    dirZSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.directional.position.z = value;
      dirZValue.textContent = value;
      if (directionalLight) {
        directionalLight.position.z = value;
      }
    });
  }

  // Point light intensity
  const pointSlider = document.getElementById('pointSlider');
  const pointValue = document.getElementById('pointValue');
  if (pointSlider && pointValue) {
    pointSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.point.intensity = value;
      pointValue.textContent = value.toFixed(1);
      if (pointLight) {
        pointLight.intensity = value;
      }
    });
  }

  // Point light X position
  const pointXSlider = document.getElementById('pointXSlider');
  const pointXValue = document.getElementById('pointXValue');
  if (pointXSlider && pointXValue) {
    pointXSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.point.position.x = value;
      pointXValue.textContent = value;
      if (pointLight) {
        pointLight.position.x = value;
      }
    });
  }

  // Point light Y position
  const pointYSlider = document.getElementById('pointYSlider');
  const pointYValue = document.getElementById('pointYValue');
  if (pointYSlider && pointYValue) {
    pointYSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.point.position.y = value;
      pointYValue.textContent = value;
      if (pointLight) {
        pointLight.position.y = value;
      }
    });
  }

  // Point light Z position
  const pointZSlider = document.getElementById('pointZSlider');
  const pointZValue = document.getElementById('pointZValue');
  if (pointZSlider && pointZValue) {
    pointZSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      lightingControls.point.position.z = value;
      pointZValue.textContent = value;
      if (pointLight) {
        pointLight.position.z = value;
      }
    });
  }




}

// Gallery and Lightbox functionality
let galleryImages = [];
let currentImageIndex = 0;

// Initialize gallery
function initGallery() {
  // Load images from the images folder automatically
  loadGalleryImagesFromFolder();
  setupGalleryEventListeners();
}

// Load images from the images folder
function loadGalleryImagesFromFolder() {
  // Try to fetch images from the API first
  fetch('/api/images')
    .then(response => {
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    })
    .then(images => {
      console.log('Loaded images from API:', images);
      galleryImages = images.map(img => ({
        src: `images/${img}`,
        caption: img.replace(/\.[^/.]+$/, '') // Remove file extension for caption
      }));
    })
    .catch(error => {
      console.log('Using fallback image loading method');
      // Fallback: use a predefined list based on the images we know exist
      // Sorted by number for proper ordering
      const fallbackImages = [
        'TH_OP1_EAST.png', 'TH_OP1_EAST_02.png', 'TH_OP1_NORTH.png',
        'TH_OP1_NE.png', 'TH_OP1_NW.png', 'TH_OP1_NW2.png', 'TH_OP1_SE.png',
        'TH_OP1_SOUTH.png', 'TH_OP1_SOUTH_02.png', 'TH_OP1_SOUTH_03.png',
        'TH_OP1_SW.png', 'TH_OP1_WEST.png', 'TH_OP1_WEST_02.png',
        'TH_OP2_EAST.png', 'TH_OP2_NORTH.png', 'TH_OP2_NORTH_02.png',
        'TH_OP2_NORTH_03.png', 'TH_OP2_NORTH_04.png', 'TH_OP2_SOUTH.png',
        'TH_OP2_SOUTH_02.png', 'TH_OP2_SOUTH_03.png', 'TH_OP2_WEST.png'
      ].sort((a, b) => {
        // Extract numbers from filenames for proper numerical sorting
        const getNumber = (filename) => {
          const match = filename.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const numA = getNumber(a);
        const numB = getNumber(b);
        if (numA !== numB) {
          return numA - numB;
        }
        return a.localeCompare(b); // Alphabetical fallback for same numbers
      });
      
      galleryImages = fallbackImages.map(img => ({
        src: `images/${img}`,
        caption: img.replace(/\.[^/.]+$/, '') // Remove file extension for caption
      }));
    });
}

// Setup gallery event listeners
function setupGalleryEventListeners() {
  // Gallery button
  const galleryBtn = document.getElementById('galleryBtn');
  if (galleryBtn) {
    galleryBtn.addEventListener('click', openGallery);
  }

  // Close gallery
  const closeGallery = document.querySelector('.close-gallery');
  if (closeGallery) {
    closeGallery.addEventListener('click', closeGalleryView);
  }

  // Lightbox close
  const closeLightboxBtn = document.querySelector('.close-lightbox');
  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeLightbox);
  }

  // Lightbox navigation
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
  if (nextBtn) nextBtn.addEventListener('click', showNextImage);

  // Keyboard navigation
  document.addEventListener('keydown', handleGalleryKeyboard);
}

// Open gallery view
function openGallery() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    galleryGrid.classList.remove('hidden');
    loadGalleryImages();
  }
}

// Close gallery view
function closeGalleryView() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    galleryGrid.classList.add('hidden');
  }
}

// Load gallery images
function loadGalleryImages() {
  const galleryContainer = document.querySelector('.gallery-container');
  if (!galleryContainer) return;

  galleryContainer.innerHTML = '';
  
  galleryImages.forEach((image, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.innerHTML = `
      <img src="${image.src}" alt="${image.caption}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlICR7aW5kZXgrMX08L3RleHQ+PC9zdmc+'">
      <div class="gallery-item-caption">${image.caption}</div>
    `;
    
    galleryItem.addEventListener('click', () => openLightbox(index));
    galleryContainer.appendChild(galleryItem);
  });
}

// Open lightbox
function openLightbox(imageIndex) {
  currentImageIndex = imageIndex;
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const captionText = document.getElementById('lightbox-caption-text');
  const counter = document.getElementById('lightbox-counter');
  
  if (lightbox && lightboxImage && galleryImages[imageIndex]) {
    lightboxImage.src = galleryImages[imageIndex].src;
    captionText.textContent = galleryImages[imageIndex].caption;
    counter.textContent = `${imageIndex + 1} / ${galleryImages.length}`;
    lightbox.classList.remove('hidden');
  }
}

// Close lightbox
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
  }
}

// Show previous image
function showPreviousImage() {
  if (currentImageIndex > 0) {
    openLightbox(currentImageIndex - 1);
  }
}

// Show next image
function showNextImage() {
  if (currentImageIndex < galleryImages.length - 1) {
    openLightbox(currentImageIndex + 1);
  }
}

// Handle keyboard navigation
function handleGalleryKeyboard(event) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox && !lightbox.classList.contains('hidden')) {
    switch(event.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        showPreviousImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
    }
  }
}

// Create camera preset controls
function createCameraPresetControls() {
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'camera-preset-controls';
  controlsContainer.className = 'debug-controls';
  controlsContainer.style.cssText = `
    position: fixed;
    top: 120px;
    left: 320px;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #03092b;
    border-radius: 8px;
    padding: 20px;
    z-index: 1000;
    font-size: 14px;
    line-height: 1.6;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    backdrop-filter: blur(10px);
  `;
  
  controlsContainer.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #03092b; font-size: 18px; text-align: center; border-bottom: 1px solid #03092b; padding-bottom: 8px;">
      Camera Presets
    </h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <button class="preset-btn" data-preset="front">Front</button>
      <button class="preset-btn" data-preset="back">Back</button>
      <button class="preset-btn" data-preset="left">Left</button>
      <button class="preset-btn" data-preset="right">Right</button>
      <button class="preset-btn" data-preset="top">Top</button>
      <button class="preset-btn" data-preset="bottom">Bottom</button>
      <button class="preset-btn" data-preset="isometric">Isometric</button>
      <button class="preset-btn" data-preset="default">Default</button>
    </div>
  `;
  
  document.body.appendChild(controlsContainer);
  
  // Add event listeners for preset buttons
  const presetButtons = controlsContainer.querySelectorAll('.preset-btn');
  presetButtons.forEach(button => {
    button.addEventListener('click', function() {
      const presetName = this.getAttribute('data-preset');
      setCameraPreset(presetName);
      
      // Visual feedback
      presetButtons.forEach(btn => btn.style.background = '#f0f0f0');
      this.style.background = '#03092b';
      this.style.color = '#ffffff';
      
      // Reset button style after animation
      setTimeout(() => {
        this.style.background = '#f0f0f0';
        this.style.color = '#000000';
      }, 1000);
    });
  });
  
  // Add CSS for preset buttons
  const style = document.createElement('style');
  style.textContent = `
    .preset-btn {
      padding: 8px 12px;
      border: 1px solid #03092b;
      background: #f0f0f0;
      color: #000000;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .preset-btn:hover {
      background: #03092b;
      color: #ffffff;
    }
  `;
  document.head.appendChild(style);
}

// Create point light gizmo for positioning
function createPointLightGizmo() {
  // Create a small sphere to represent the point light position
  const gizmoGeometry = new THREE.SphereGeometry(0.1, 8, 6);
  const gizmoMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    transparent: true, 
    opacity: 0.8,
    wireframe: true
  });
  
  pointLightGizmo = new THREE.Mesh(gizmoGeometry, gizmoMaterial);
  pointLightGizmo.position.copy(pointLight.position);
  scene.add(pointLightGizmo);
  
  // Create drag controls for the gizmo
  const dragControls = new THREE.DragControls([pointLightGizmo], camera, renderer.domElement);
  
  // Update point light position when gizmo is dragged
  dragControls.addEventListener('drag', function(event) {
    pointLight.position.copy(pointLightGizmo.position);
    // Update the lighting controls position values
    lightingControls.point.position.x = pointLightGizmo.position.x;
    lightingControls.point.position.y = pointLightGizmo.position.y;
    lightingControls.point.position.z = pointLightGizmo.position.z;
  });
  
  // Toggle gizmo visibility with 'G' key
  document.addEventListener('keydown', function(event) {
    if (event.key.toLowerCase() === 'g') {
      pointLightGizmo.visible = !pointLightGizmo.visible;
    }
  });
  
  // Initially hide the gizmo
  pointLightGizmo.visible = false;
}

// Find and display Mannai_Blue material information
function findMannaiBlueMaterial(model) {
  let foundMaterials = [];
  
  model.traverse(function(child) {
    if (child.isMesh && child.material) {
      let materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material, index) => {
        if (material.name && material.name.toLowerCase().includes('mannai_blue')) {
          foundMaterials.push({
            mesh: child,
            material: material,
            materialIndex: index,
            meshName: child.name || 'Unnamed Mesh'
          });
          
          // Override the Mannai_Blue material with #004161
          material.color.setHex(0x004161);
          console.log(`Applied color #004161 to Mannai_Blue material in mesh: ${child.name || 'Unnamed Mesh'}`);
        }
      });
    }
  });
  
  if (foundMaterials.length > 0) {
    console.log('Found and updated Mannai_Blue materials:', foundMaterials);
    
    // Create material controls if in debug mode
    if (debugMode) {
      createMannaiBlueControls(foundMaterials);
    }
    
    return foundMaterials;
  } else {
    console.log('No Mannai_Blue materials found in the model');
    return [];
  }
}

// Create controls for Mannai_Blue material
function createMannaiBlueControls(materials) {
  // Remove existing controls if any
  const existingControls = document.getElementById('mannai-blue-controls');
  if (existingControls) {
    existingControls.remove();
  }
  
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'mannai-blue-controls';
  controlsContainer.style.cssText = `
    position: fixed;
    top: 120px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #03092b;
    border-radius: 8px;
    padding: 20px;
    z-index: 1001;
    font-size: 14px;
    line-height: 1.6;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-width: 250px;
    backdrop-filter: blur(10px);
  `;
  
  controlsContainer.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #03092b; font-size: 18px; text-align: center; border-bottom: 1px solid #03092b; padding-bottom: 8px;">
      Mannai_Blue Material Controls
    </h3>
    <div style="margin-bottom: 15px;">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Found ${materials.length} material(s)</p>
      <p style="margin: 0; font-size: 12px; color: #666;">Default color: #004161</p>
    </div>
    <div class="control-group">
      <label>Color: <span id="mannaiColorValue">#004161</span></label>
      <input type="color" id="mannaiColorPicker" value="#004161">
    </div>
    <div class="control-group">
      <label>Opacity: <span id="mannaiOpacityValue">1.0</span></label>
      <input type="range" id="mannaiOpacitySlider" min="0" max="1" step="0.1" value="1.0">
    </div>
    <div class="control-group">
      <label>Metalness: <span id="mannaiMetalnessValue">0.0</span></label>
      <input type="range" id="mannaiMetalnessSlider" min="0" max="1" step="0.1" value="0.0">
    </div>
    <div class="control-group">
      <label>Roughness: <span id="mannaiRoughnessValue">0.5</span></label>
      <input type="range" id="mannaiRoughnessSlider" min="0" max="1" step="0.1" value="0.5">
    </div>
  `;
  
  document.body.appendChild(controlsContainer);
  
  // Add event listeners
  setupMannaiBlueControls(materials);
}

// Setup Mannai_Blue material controls
function setupMannaiBlueControls(materials) {
  const colorPicker = document.getElementById('mannaiColorPicker');
  const colorValue = document.getElementById('mannaiColorValue');
  const opacitySlider = document.getElementById('mannaiOpacitySlider');
  const opacityValue = document.getElementById('mannaiOpacityValue');
  const metalnessSlider = document.getElementById('mannaiMetalnessSlider');
  const metalnessValue = document.getElementById('mannaiMetalnessValue');
  const roughnessSlider = document.getElementById('mannaiRoughnessSlider');
  const roughnessValue = document.getElementById('mannaiRoughnessValue');
  
  if (colorPicker && colorValue) {
    colorPicker.addEventListener('input', function() {
      const color = this.value;
      colorValue.textContent = color;
      updateMannaiBlueMaterials(materials, 'color', color);
    });
  }
  
  if (opacitySlider && opacityValue) {
    opacitySlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      opacityValue.textContent = value.toFixed(1);
      updateMannaiBlueMaterials(materials, 'opacity', value);
    });
  }
  
  if (metalnessSlider && metalnessValue) {
    metalnessSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      metalnessValue.textContent = value.toFixed(1);
      updateMannaiBlueMaterials(materials, 'metalness', value);
    });
  }
  
  if (roughnessSlider && roughnessValue) {
    roughnessSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      roughnessValue.textContent = value.toFixed(1);
      updateMannaiBlueMaterials(materials, 'roughness', value);
    });
  }
}

// Remove shadows for specific materials
function removeShadowsForSpecificMaterials(model) {
  let processedMeshes = [];
  
  model.traverse(function(child) {
    if (child.isMesh && child.material) {
      let materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material, index) => {
        if (material.name) {
          const materialName = material.name.toLowerCase();
          
          // Check for materials containing "75", "mannai_techhub", or "mannai_tech_"
          if (materialName.includes('75') || materialName.includes('mannai_techhub') || materialName.includes('mannai_tech_')) {
            // Disable shadows for this mesh
            child.castShadow = false;
            child.receiveShadow = false;
            
            processedMeshes.push({
              mesh: child,
              material: material,
              materialName: material.name,
              meshName: child.name || 'Unnamed Mesh'
            });
            
            console.log(`Disabled shadows for material "${material.name}" in mesh: ${child.name || 'Unnamed Mesh'}`);
          }
        }
      });
    }
  });
  
  if (processedMeshes.length > 0) {
    console.log(`Processed ${processedMeshes.length} mesh(es) with shadow removal:`, processedMeshes);
  } else {
    console.log('No materials found matching "75", "Mannai_techhub", or "Mannai_Tech_" criteria');
  }
  
  return processedMeshes;
}

// Update Mannai_Blue materials
function updateMannaiBlueMaterials(materials, property, value) {
  materials.forEach(({material}) => {
    switch(property) {
      case 'color':
        material.color.setHex(parseInt(value.replace('#', ''), 16));
        break;
      case 'opacity':
        material.opacity = value;
        material.transparent = value < 1.0;
        break;
      case 'metalness':
        if (material.metalness !== undefined) {
          material.metalness = value;
        }
        break;
      case 'roughness':
        if (material.roughness !== undefined) {
          material.roughness = value;
        }
        break;
    }
  });
}

// Setup debug mode functionality
function setupDebugMode() {
  const debugToggle = document.getElementById('debugToggle');
  if (debugToggle) {
    debugToggle.addEventListener('change', function() {
      debugMode = this.checked;
      
      // Toggle gizmo visibility based on debug mode
      if (pointLightGizmo) {
        pointLightGizmo.visible = debugMode;
      }
      
      // Toggle controls visibility
      const debugControls = document.querySelectorAll('.debug-controls');
      debugControls.forEach(control => {
        if (debugMode) {
          control.classList.add('show');
        } else {
          control.classList.remove('show');
        }
      });
      
      // Toggle Mannai_Blue controls
      const mannaiControls = document.getElementById('mannai-blue-controls');
      if (mannaiControls) {
        mannaiControls.style.display = debugMode ? 'block' : 'none';
      }
      
      // Toggle camera preset controls
      const cameraPresetControls = document.getElementById('camera-preset-controls');
      if (cameraPresetControls) {
        cameraPresetControls.style.display = debugMode ? 'block' : 'none';
      }
      
      // Toggle additional debug information
      if (debugMode) {
        console.log('Debug mode enabled');
        console.log('Current lighting settings:', lightingControls);
        console.log('Current model:', currentModelName);
        
        // Re-search for Mannai_Blue materials if model is loaded
        if (currentModel) {
          findMannaiBlueMaterial(currentModel);
        }
      } else {
        console.log('Debug mode disabled');
      }
    });
  }
}

// Export functions for potential external use
window.ModelViewer = {
  loadModel,
  resetCamera,
  getCurrentModel: () => currentModelName,
  openGallery,
  closeGalleryView
};
