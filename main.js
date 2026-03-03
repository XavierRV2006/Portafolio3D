import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --------------------
// ESCENA
// --------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// --------------------
// CÁMARA
// --------------------
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 4);

// --------------------
// RENDERER
// --------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --------------------
// CONTROLES
// --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --------------------
// LUCES
// --------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// --------------------
// PANEL HTML
// --------------------
const infoPanel = document.getElementById("infoPanel");
const title = document.getElementById("title");
const description = document.getElementById("description");

// --------------------
// DESCRIPCIONES
// --------------------
const descriptions = {
  "Objeto1": {
    title: "Proyecto 1",
    text: "Descripción del Objeto 1."
  },
  "Objeto2(Mono)": {
    title: "Modelo Mono",
    text: "Este es el modelo Suzanne usado como prueba."
  }
};
let activeObject = null;

// --------------------
// LOADER
// --------------------
const loader = new GLTFLoader();
let roomModel;

loader.load('EscenarioV4.glb', (gltf) => {
  roomModel = gltf.scene;
  scene.add(roomModel);
  console.log("Modelo cargado:");
  console.log(gltf.scene);
});

// --------------------
// RAYCASTER
// --------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function zoomToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5;
  
  controls.target.copy(center);
  camera.position.copy(center);
  camera.position.z += cameraZ;
  camera.updateProjectionMatrix();
  controls.update();
}

window.addEventListener('click', (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  // Click fuera → cerrar
  if (intersects.length === 0) {
    infoPanel.classList.add("hidden");
    activeObject = null;
    return;
  }

  let clicked = intersects[0].object;

  // Subir jerarquía hasta encontrar objeto válido
  while (clicked.parent && !descriptions[clicked.name]) {
    clicked = clicked.parent;
  }

  // Si no es interactivo → cerrar
  if (!descriptions[clicked.name]) {
    infoPanel.classList.add("hidden");
    activeObject = null;
    return;
  }

  // Si clicas el mismo objeto → cerrar
  if (activeObject === clicked.name) {
    infoPanel.classList.add("hidden");
    activeObject = null;
    return;
  }

  // Si clicas otro objeto → actualizar
  activeObject = clicked.name;

  title.textContent = descriptions[clicked.name].title;
  description.textContent = descriptions[clicked.name].text;
  infoPanel.classList.remove("hidden");
  
  // Zoom a objeto
  zoomToObject(clicked);

});

// --------------------
// ANIMATE
// --------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// --------------------
// RESIZE
// --------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

