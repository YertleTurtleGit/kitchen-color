/* global THREE */

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("canvas")
);
canvas.width = 1920;
canvas.height = 1440;

const colorPicker = /** @type {HTMLInputElement} */ (
  document.getElementById("colorPicker")
);

const camera = new THREE.OrthographicCamera();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setClearColor(new THREE.Color("white"));

const vertexShaderSource = /*glsl*/ `#version 300 es
in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
  gl_Position = vec4(position, 1.0);
  vUv = uv;
}
`;

const fragmentShaderSource = /*glsl*/ `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uImage;
uniform sampler2D uMask;

out vec4 fragmentColor;

uniform vec3 wallColor;

void main() {
  vec3 imageColor = texture(uImage, vUv).rgb;
  float maskColor = texture(uMask, vUv).r;

  if (maskColor > 0.5) {
    imageColor *= wallColor;
  }

  fragmentColor = vec4(imageColor, 1.0);
}
`;

// Track loading state
let imageLoaded = false;
let maskLoaded = false;

// Render function
function render() {
  renderer.render(scene, camera);
}

// Check if both textures are loaded and render
function checkAndRender() {
  if (imageLoaded && maskLoaded) {
    render();
  }
}

const textureLoader = new THREE.TextureLoader();

// Load image texture with callback
const imageTexture = textureLoader.load(
  "data/image.jpg",
  () => {
    imageLoaded = true;
    checkAndRender();
  },
  undefined,
  (err) => {
    console.error("Error loading image texture:", err);
  }
);

// Load mask texture with callback
const maskTexture = textureLoader.load(
  "data/mask.jpg",
  () => {
    maskLoaded = true;
    checkAndRender();
  },
  undefined,
  (err) => {
    console.error("Error loading mask texture:", err);
  }
);

const material = new THREE.RawShaderMaterial({
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource,
  uniforms: {
    uImage: { value: imageTexture },
    uMask: { value: maskTexture },
    wallColor: { value: new THREE.Color(colorPicker.value) },
  },
});

// Create a plane geometry
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);

// Create scene and add mesh
const scene = new THREE.Scene();
scene.add(mesh);

// Update color picker
colorPicker.addEventListener("input", () => {
  material.uniforms.wallColor.value = new THREE.Color(colorPicker.value);
  render();
});