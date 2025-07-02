# 🍎 Red Apple 3D Cube Viewer

An interactive 3D textured cube viewer built with p5.js and WebGL. Features enhanced camera controls, mobile optimization, and a unique sticker toggle functionality.

## ✨ Features

- **🎮 Interactive 3D Controls**: Orbit, zoom, and pan around the textured cube
- **📱 Mobile Optimized**: Touch-friendly controls with responsive design
- **🎯 Sticker Toggle**: Switch between two different top face textures
- **⚡ Real-time Instructions**: On-screen camera control guide
- **🌐 Web Deployment Ready**: Includes Vercel configuration

## 🎯 Demo

Visit the live demo: [https://redapplecube.vercel.app](https://redapplecube.vercel.app) *(Deploy to see live URL)*

## 🚀 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/QuantumClimb/redapplecube.git
   cd redapplecube
   ```

2. **Start a local server** (required for loading textures):
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

- **🖱️ Mouse Drag**: Rotate camera around cube
- **🔄 Scroll Wheel**: Zoom in/out
- **🖱️ Right-Click Drag**: Pan camera position
- **📱 Touch**: Drag to rotate, pinch to zoom
- **⌨️ 'H' Key**: Toggle help display
- **⌨️ 'R' Key**: Reset camera position
- **🔘 Button**: Toggle between top face textures

## 📁 Project Structure

```
redapplecube/
├── index.html          # Main HTML file with Red Apple theme
├── main.js             # p5.js 3D rendering and camera controls
├── vercel.json         # Deployment configuration
├── public/             # Texture assets
│   ├── front.jpg       # Front face texture
│   ├── back.jpg        # Back face texture
│   ├── top.jpg         # Top face texture (default)
│   ├── top2.jpg        # Alternative top face texture
│   ├── bottom.jpg      # Bottom face texture
│   ├── right.jpg       # Right face texture
│   └── left.jpg        # Left face texture
└── README.md           # This file
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Graphics**: [p5.js](https://p5js.org/) with WebGL mode
- **Deployment**: [Vercel](https://vercel.com/) ready
- **Assets**: 6 texture images + 1 alternative texture

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

### Adding New Textures
1. Add your texture images to the `public/` directory
2. Update the `imageFiles` array in `main.js`
3. Modify the cube face assignments in the `draw()` function

### Styling
- Edit CSS in `index.html` to change colors and layout
- Modify the Red Apple theme by updating the `#b00020` color values

### Camera Settings
- Adjust `cubeSize` for different cube dimensions
- Modify `cameraDistance` for initial zoom level
- Change `perspective()` values for different field of view

## 🐛 Troubleshooting

**Textures not loading?**
- Ensure you're running a local server (not opening HTML directly)
- Check that all texture files exist in the `public/` directory

**Camera not responding?**
- Verify that p5.js is loading correctly from CDN
- Check browser console for any JavaScript errors

**Mobile issues?**
- Clear browser cache
- Ensure touch events are enabled in your browser

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🚀 Author

**QuantumClimb**
- GitHub: [@QuantumClimb](https://github.com/QuantumClimb)
- Project: [Red Apple 3D Cube Viewer](https://github.com/QuantumClimb/redapplecube)

---

⭐ **Star this project** if you found it useful! 