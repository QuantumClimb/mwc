// Three.js Scene Setup
let scene, camera, renderer, controls;
let ktx2Loader = null;
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

// Composite scene configuration (floor persists, one roof at a time, one pods type at a time, humans toggle)
const compositeConfig = {
  floor: { path: './public/models/floor.glb' },
  roof: {
    default: 'roof1',
    options: {
      roof1: { path: './public/models/roof1.glb' },
      roof2: { path: './public/models/roof2.glb' },
      roof3: { path: './public/models/roof3.glb' }
    }
  },
  pods: {
    default: 'circle_pods',
    options: {
      circle_pods: { path: './public/models/circle_pods.glb' },
      triangle_pods: { path: './public/models/triangle_pods.glb' }
    }
  },
  humans: { path: './public/models/humans.glb', defaultVisible: true }
};

// Loaded GLB scenes cache
const loadedParts = {
  floor: null,
  roof: { roof1: null, roof2: null, roof3: null },
  pods: { circle_pods: null, triangle_pods: null },
  humans: null
};

let activeRoof = compositeConfig.roof.default;
let activePods = compositeConfig.pods.default;
let humansVisible = compositeConfig.humans.defaultVisible;

// Lighting variables
let ambientLight, hemisphereLight, directionalLight, pointLight;
let lightingControls = {
  ambient: { intensity: 1.0 },
  hemisphere: { intensity: 0.8, skyColor: 0x092239, groundColor: 0xd1d1d1 },
  directional: { intensity: 1.0, position: { x: 5, y: 10, z: 5 } },
  point: { intensity: 1.0, position: { x: 0, y: 2, z: 0 } }
};

// Initialize the 3D scene
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#092239');

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
  // Ensure proper color space for textures
  renderer.outputEncoding = THREE.sRGBEncoding;

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

  // Skip infinite plane floor; using floor.glb instead
  // KTX2Loader removed for stability with r128 and current pipeline

  // Load initial composite (floor, default roof, default pods, humans toggle)
  initComposite();

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
function initKTX2Loader() {
  try {
    // KTX2Loader requires the transcoder files; we use the CDN path for three r128
    ktx2Loader = new THREE.KTX2Loader()
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/basis/')
      .detectSupport(renderer);
    console.log('KTX2Loader initialized');
  } catch (e) {
    console.warn('KTX2Loader not available or failed to initialize:', e);
    ktx2Loader = null;
  }
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
  // Intentionally left empty; we use floor.glb instead of a generated plane
}

// ---------- Composite model loading ----------

async function loadGLBScene(path) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);
    // KTX2 disabled
    // Ensure external resources (if any) resolve relative to the GLB directory
    try {
      const lastSlash = path.lastIndexOf('/') + 1;
      if (lastSlash > 0) loader.setResourcePath(path.substring(0, lastSlash));
    } catch(e) {}

    loader.load(
      path,
      gltf => {
        const model = gltf.scene;
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        // Apply material adjustments similar to legacy flow
        // Optional material tweaks (kept but non-fatal)
        try { removeShadowsForSpecificMaterials(model); } catch (e) {}
        // Skip texture/material summary logs
        resolve(model);
      },
      undefined,
      err => reject(err)
    );
  });
}

async function ensureFloorLoaded() {
  if (!loadedParts.floor) {
    showLoading(true);
    try {
      loadedParts.floor = await loadGLBScene(compositeConfig.floor.path);
      scene.add(loadedParts.floor);
    } finally {
      showLoading(false);
    }
  }
}

async function ensureRoofLoaded(option) {
  if (!loadedParts.roof[option]) {
    showLoading(true);
    try {
      const cfg = compositeConfig.roof.options[option];
      loadedParts.roof[option] = await loadGLBScene(cfg.path);
      loadedParts.roof[option].visible = false;
      scene.add(loadedParts.roof[option]);
      // Targeted debug: log textures for this roof (helps find missing ones)
      try { debugLogMaterialTextures(loadedParts.roof[option], `roof: ${option} (${cfg.path})`); } catch (e) {}
    } finally {
      showLoading(false);
    }
  }
}

async function ensurePodsLoaded(option) {
  if (!loadedParts.pods[option]) {
    showLoading(true);
    try {
      const cfg = compositeConfig.pods.options[option];
      loadedParts.pods[option] = await loadGLBScene(cfg.path);
      loadedParts.pods[option].visible = false;
      scene.add(loadedParts.pods[option]);
    } finally {
      showLoading(false);
    }
  }
}

async function ensureHumansLoaded() {
  if (!loadedParts.humans) {
    showLoading(true);
    try {
      loadedParts.humans = await loadGLBScene(compositeConfig.humans.path);
      loadedParts.humans.visible = humansVisible;
      scene.add(loadedParts.humans);
    } finally {
      showLoading(false);
    }
  }
}

async function initComposite() {
  // Load floor and defaults
  await ensureFloorLoaded();
  await Promise.all([
    ensureRoofLoaded(activeRoof),
    ensurePodsLoaded(activePods),
    ensureHumansLoaded()
  ]);
  setActiveRoof(activeRoof);
  setActivePods(activePods);
  setHumansVisible(humansVisible);
}

function setActiveRoof(option) {
  // Hide all roofs
  Object.keys(loadedParts.roof).forEach(key => {
    const node = loadedParts.roof[key];
    if (node) node.visible = false;
  });
  // Show requested roof if loaded
  if (loadedParts.roof[option]) {
    loadedParts.roof[option].visible = true;
    activeRoof = option;
  }
  updateOptionButtonsUI();
}

function setActivePods(option) {
  // Hide all pods
  Object.keys(loadedParts.pods).forEach(key => {
    const node = loadedParts.pods[key];
    if (node) node.visible = false;
  });
  if (loadedParts.pods[option]) {
    loadedParts.pods[option].visible = true;
    activePods = option;
  }
  updateOptionButtonsUI();
}

function setHumansVisible(visible) {
  humansVisible = !!visible;
  if (loadedParts.humans) {
    loadedParts.humans.visible = humansVisible;
  }
  const humansToggle = document.getElementById('humansToggle');
  if (humansToggle) humansToggle.checked = humansVisible;
}

function updateOptionButtonsUI() {
  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => {
    const group = btn.getAttribute('data-group');
    const option = btn.getAttribute('data-option');
    let isActive = false;
    if (group === 'roof') isActive = option === activeRoof;
    if (group === 'pods') isActive = option === activePods;
    if (isActive) btn.classList.add('active'); else btn.classList.remove('active');
  });
}

// Debug helper: log material texture usage for a model to spot missing/undefined textures
function debugLogMaterialTextures(rootNode, label) {
  const seenMaterials = new Set();
  const rows = [];
  rootNode.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => {
        if (seenMaterials.has(mat)) return;
        seenMaterials.add(mat);
        const entry = { name: mat.name || '(unnamed)', maps: {} };
        ['map','normalMap','metalnessMap','roughnessMap','aoMap','emissiveMap','alphaMap','specularMap','displacementMap','clearcoatMap','clearcoatNormalMap','clearcoatRoughnessMap'].forEach(key => {
          const tex = mat[key];
          if (tex) {
            let src = (tex.image && (tex.image.currentSrc || tex.image.src)) || tex.source?.data?.src || '(embedded or blob)';
            entry.maps[key] = src || '(no image)';
          }
        });
        rows.push(entry);
      });
    }
  });
  if (rows.length === 0) {
    console.warn(`[Textures] ${label}: no materials found`);
    return;
  }
  console.groupCollapsed(`[Textures] ${label}: ${rows.length} materials`);
  rows.forEach(r => {
    console.log(r.name, r.maps);
  });
  console.groupEnd();
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

  // Load the model (legacy single-model viewer) - kept for reference; not used in composite flow
  loader.load(
    config.path,
    function (gltf) {
      const model = gltf.scene;
      model.scale.setScalar(config.scale);
      model.position.set(config.position.x, config.position.y, config.position.z);
      model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
      model.traverse(function (child) { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      scene.add(model);
      currentModel = model;
      currentModelName = modelName;
      removeShadowsForSpecificMaterials(model);
      updateButtonStates(modelName);
      showLoading(false);
      resetCamera();
      console.log(`Model ${modelName} loaded successfully`);
    },
    function () {},
    function (error) {
      console.error(`Error loading model ${modelName}:`, error);
      showLoading(false);
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
  // Option buttons (roof/pods)
  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const group = this.getAttribute('data-group');
      const option = this.getAttribute('data-option');
      if (!group || !option) return;
      try {
        if (group === 'roof') {
          await ensureRoofLoaded(option);
          setActiveRoof(option);
        } else if (group === 'pods') {
          await ensurePodsLoaded(option);
          setActivePods(option);
        }
      } catch (e) {
        console.error('Error switching option', group, option, e);
        showError(`Failed to load ${group} option: ${option}`);
      }
    });
  });

  // Keyboard controls
  document.addEventListener('keydown', function(event) {
    switch(event.key.toLowerCase()) {
      case 'r':
        resetCamera();
        break;
      case 'h':
        setHumansVisible(!humansVisible);
        break;

    }
  });

  // Window resize
  window.addEventListener('resize', onWindowResize);

  // Humans toggle checkbox
  const humansToggle = document.getElementById('humansToggle');
  if (humansToggle) {
    humansToggle.addEventListener('change', function() {
      setHumansVisible(this.checked);
    });
  }
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
        try { hemisphereLight.color.set(color); } catch (e) { hemisphereLight.color.setHex(parseInt(color.replace('#',''),16)); }
      }
      // Also update scene background to match the selected sky color for clearer visual feedback
      if (scene) {
        try { scene.background = new THREE.Color(color); } catch (e) {}
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
        try { hemisphereLight.groundColor.set(color); } catch (e) { hemisphereLight.groundColor.setHex(parseInt(color.replace('#',''),16)); }
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

// Gallery and Lightbox functionality (supports nested folders)
let galleryImages = [];
let currentImageIndex = 0;
let imageTree = null; // Recursive tree of images/ folders and files
let currentPath = []; // Array of folder names from root (e.g., ['R1', 'CIRCLE'])

// Initialize gallery
function initGallery() {
  // Load image tree (server API or static manifest fallback)
  loadImageTree().then(() => {
    console.log('Image tree loaded');
  }).catch(err => {
    console.warn('Failed to load image tree:', err);
  });
  setupGalleryEventListeners();
}

async function loadImageTree() {
  // Try server API first
  try {
    const res = await fetch('/api/image-tree', { cache: 'no-store' });
    if (res.ok) {
      imageTree = await res.json();
      return;
    }
  } catch (e) {
    // ignore and try fallback
  }

  // Fallback to static manifest if available (for static hosting)
  const manifestCandidates = [
    './images/manifest.json',
    '/images/manifest.json'
  ];
  for (const url of manifestCandidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        imageTree = await res.json();
        return;
      }
    } catch (e) { /* continue */ }
  }

  // If no tree could be loaded, create an empty structure
  imageTree = { name: 'images', path: 'images', type: 'directory', children: [] };
}

function getNodeForPath(pathParts) {
  if (!imageTree) return null;
  if (!pathParts || pathParts.length === 0) return imageTree;
  let node = imageTree;
  for (const part of pathParts) {
    if (!node || !node.children) return null;
    node = node.children.find(ch => ch.type === 'directory' && ch.name === part);
  }
  return node || null;
}

function renderBreadcrumbs() {
  const breadcrumbs = document.getElementById('gallery-breadcrumbs');
  const backBtn = document.getElementById('galleryBackBtn');
  const closeBtn = document.getElementById('galleryCloseBtn');
  if (!breadcrumbs) return;
  breadcrumbs.innerHTML = '';

  const parts = ['images', ...currentPath];
  let accum = [];
  parts.forEach((part, idx) => {
    const span = document.createElement('span');
    span.textContent = part;
    span.style.cursor = 'pointer';
    span.addEventListener('click', () => {
      // Navigate to this level
      accum = currentPath.slice(0, idx); // idx 0 is root 'images'
      if (idx === 0) {
        navigateTo([]);
      } else {
        navigateTo(currentPath.slice(0, idx));
      }
    });
    breadcrumbs.appendChild(span);
    if (idx < parts.length - 1) {
      const sep = document.createElement('span');
      sep.textContent = ' / ';
      breadcrumbs.appendChild(sep);
    }
  });

  // Toggle Back and Close visibility
  if (backBtn) {
    backBtn.style.display = currentPath.length > 0 ? 'inline-block' : 'none';
  }
  if (closeBtn) {
    // Only show close at root level
    closeBtn.style.display = currentPath.length === 0 ? 'inline-block' : 'none';
  }
}

function navigateTo(pathParts) {
  currentPath = pathParts || [];
  renderCurrentDirectory();
}

function renderCurrentDirectory() {
  const galleryContainer = document.querySelector('.gallery-container');
  const headerTitle = document.querySelector('.gallery-header h2');
  if (!galleryContainer) return;

  const node = getNodeForPath(currentPath);
  if (!node) return;

  // Update title and breadcrumbs
  if (headerTitle) {
    headerTitle.textContent = currentPath.length === 0 ? 'Image Gallery' : currentPath.join(' / ');
  }
  renderBreadcrumbs();

  // Separate folders and files
  const folders = (node.children || []).filter(ch => ch.type === 'directory');
  const files = (node.children || []).filter(ch => ch.type === 'file');

  // Update current file list for lightbox navigation
  galleryImages = files.map(f => ({
    src: normalizePathForWeb(f.path),
    caption: f.name.replace(/\.[^/.]+$/, '')
  }));

  // Render grid
  galleryContainer.innerHTML = '';

  // Render folders first
  folders.forEach(folder => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;background:#f7f7f7;color:#03092b;font-weight:700;font-size:18px;">
        📁 ${folder.name}
      </div>
      <div class="gallery-item-caption">${folder.name}</div>
    `;
    item.addEventListener('click', () => navigateTo([...currentPath, folder.name]));
    galleryContainer.appendChild(item);
  });

  // Then files (with thumbnails)
  files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const src = normalizePathForWeb(file.path);
    item.innerHTML = `
      <img src="${src}" alt="${file.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnJz4='">
      <div class="gallery-item-caption">${file.name.replace(/\.[^/.]+$/, '')}</div>
    `;
    item.addEventListener('click', () => openLightbox(index));
    galleryContainer.appendChild(item);
  });
}

function normalizePathForWeb(p) {
  if (!p) return p;
  // Ensure forward slashes and strip leading './'
  let out = p.replace(/\\/g, '/');
  if (out.startsWith('./')) out = out.slice(2);
  return out;
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

  // Back button
  const backBtn = document.getElementById('galleryBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentPath.length > 0) {
        navigateTo(currentPath.slice(0, -1));
      }
    });
  }
}

// Open gallery view
function openGallery() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    galleryGrid.classList.remove('hidden');
    // Ensure tree is loaded, then render current directory (default root)
    (async () => {
      if (!imageTree) {
        await loadImageTree();
      }
      navigateTo(currentPath); // render current level
    })();
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
// Note: loadGalleryImages removed; directory renderer handles grid

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

// Mannai_Blue override disabled per request (no-op)
function findMannaiBlueMaterial(model) {
  return [];
}

// Create controls for Mannai_Blue material
function createMannaiBlueControls() {}

// Setup Mannai_Blue material controls
function setupMannaiBlueControls() {}

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

function updateMannaiBlueMaterials() {}

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
      
      // Remove any Mannai_Blue controls if present
      const mannaiControls = document.getElementById('mannai-blue-controls');
      if (mannaiControls) mannaiControls.remove();

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
