# 🎨 3D Model Expo Viewer

An interactive 3D model viewer built with Three.js and WebGL, designed for showcasing GLB models in expo environments. Features smooth model switching, professional lighting, and mobile-optimized controls.

## ✨ Features

- **🎮 Interactive 3D Controls**: Orbit, zoom, and pan around GLB models
- **📱 Mobile Optimized**: Touch-friendly controls with responsive design
- **🔄 Model Switching**: Click buttons to switch between different 3D models
- **💡 Professional Lighting**: Studio-quality lighting with shadows
- **⚡ Real-time Loading**: Smooth loading transitions with progress feedback
- **🌐 Web Deployment Ready**: Includes Vercel configuration

## 🎯 Demo

Visit the live demo: [https://3d-model-expo.vercel.app](https://3d-model-expo.vercel.app) *(Deploy to see live URL)*

## 🚀 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/QuantumClimb/3d-model-expo.git
   cd 3d-model-expo
   ```

2. **Start a local server** (required for loading GLB models):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

## 🎮 Controls

- **🖱️ Mouse Drag**: Rotate camera around model
- **🔄 Scroll Wheel**: Zoom in/out
- **🖱️ Right-Click Drag**: Pan camera position
- **📱 Touch**: Drag to rotate, pinch to zoom
- **⌨️ 'R' Key**: Reset camera position
- **⌨️ '1', '2', '3' Keys**: Switch between models
- **🔘 Buttons**: Click to switch between different models

## 📁 Project Structure

```
3d-model-expo/
├── index.html          # Main HTML file with modern UI
├── main.js             # Three.js 3D rendering and model loading
├── vercel.json         # Deployment configuration
├── public/             # Model assets
│   └── models/         # GLB model files
│       ├── V1.glb      # Model 1 (test model)
│       ├── V2.glb      # Model 2 (add your models)
│       └── V3.glb      # Model 3 (add your models)
└── README.md           # This file
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Graphics**: [Three.js](https://threejs.org/) with WebGL
- **Model Loading**: GLTFLoader for GLB/GLTF files
- **Deployment**: [Vercel](https://vercel.com/) ready
- **Assets**: GLB model files

## 🌐 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow prompts** and your site will be live!

### Other Platforms

This project works on any static hosting service:
- GitHub Pages
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

## 🎨 Customization

### Adding New Models

1. **Add your GLB files** to the `public/models/` directory
2. **Update the model configuration** in `main.js`:

```javascript
const modelConfigs = {
  V1: {
    path: './public/models/your-model.glb',
    name: 'Your Model Name',
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
  // Add more models...
};
```

3. **Update the HTML buttons** to match your model names

### Model Configuration Options

- **scale**: Adjust model size (1.0 = original size)
- **position**: Set model position in 3D space
- **rotation**: Set model rotation in radians
- **name**: Display name for the model

### Styling

- Edit CSS in `index.html` to change colors and layout
- Modify the gradient theme by updating the color values
- Adjust button styles and animations

### Lighting

- Modify `setupLighting()` function in `main.js`
- Add/remove lights for different effects
- Adjust shadow settings for performance

## 🐛 Troubleshooting

**Models not loading?**
- Ensure you're running a local server (not opening HTML directly)
- Check that all GLB files exist in the `public/models/` directory
- Verify file paths in the `modelConfigs` object

**Performance issues?**
- Reduce model file sizes (optimize GLB files)
- Adjust shadow map sizes in `setupLighting()`
- Lower renderer pixel ratio for mobile devices

**Mobile issues?**
- Clear browser cache
- Ensure WebGL is supported in your browser
- Check touch event handling

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🚀 Author

**QuantumClimb**
- GitHub: [@QuantumClimb](https://github.com/QuantumClimb)
- Project: [3D Model Expo Viewer](https://github.com/QuantumClimb/3d-model-expo)

---

⭐ **Star this project** if you found it useful! 