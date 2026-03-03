import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --------------------------- ESCENA ---------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x636768);

// --------------------------- CÁMARA ---------------------------
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 6);
const initialCameraPosition = camera.position.clone();
const initialCameraTarget = new THREE.Vector3(0, 0, 0);

// --------------------------- RENDERER ---------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --------------------------- LUCES ---------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
dirLight2.position.set(-5, -5, -5);
dirLight2.castShadow = true;
scene.add(dirLight2);

// --------------------------- CONTROLES ---------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(initialCameraTarget);

// --------------------------- OBJETOS CLICABLES ---------------------------
const cameraObjects = ["Kelsier","Lona1","Hornet","Lona2","Lona4"];
const clickableObjects = ["Kelsier", "Lona1", "Hornet","Lona2","Lona4"];
const spotLights = {};

// --------------------------- CARGAR MODELOS ---------------------------
const loader = new GLTFLoader();

loader.load(
  'EscenarioV4.glb',
  (gltf) => {
    scene.add(gltf.scene);

    // activar sombras a todos los meshes clicables
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (clickableObjects.includes(child.name)) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });

    // crear focos
    cameraObjects.forEach(name => {
      const object = gltf.scene.getObjectByName(name);
      if (!object) {
        console.warn("No se encontró el objeto:", name);
        return;
      }

      const spot = new THREE.SpotLight(0xffffff, 15);
      spot.angle = Math.PI / 10;
      spot.penumbra = 0.2;
      spot.decay = 2;
      spot.distance = 10;
      spot.castShadow = true;
      spot.visible = false;

      scene.add(spot);
      scene.add(spot.target);

      spotLights[name] = { light: spot, object: object };
    });
  },
  undefined,
  (error) => console.error(error)
);

// --------------------------- RAYCASTER ---------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --------------------------- BOTÓN X ---------------------------
const exitButton = document.createElement('button');
exitButton.innerText = 'X';
exitButton.style.position = 'absolute';
exitButton.style.top = '20px';
exitButton.style.left = '20px';
exitButton.style.padding = '8px 12px';
exitButton.style.fontSize = '18px';
exitButton.style.display = 'none';
document.body.appendChild(exitButton);

// --------------------------- OVERLAY PARA PRESENTACIÓN --------------------------- 
const overlay2 = document.createElement('div');
overlay2.style.position = 'fixed';
overlay2.style.top = 0;
overlay2.style.left = 0;
overlay2.style.width = '100%';
overlay2.style.height = '100%';
overlay2.style.display = 'none';
overlay2.style.justifyContent = 'center';
overlay2.style.alignItems = 'center';
overlay2.style.zIndex = 100;
document.body.appendChild(overlay2);

const presentacionImage = document.createElement('img');
presentacionImage.src = 'TextoLona1.png'; // tu imagen
presentacionImage.style.maxWidth = '55%';
presentacionImage.style.maxHeight = '55%';
overlay2.appendChild(presentacionImage);

overlay2.addEventListener('click', () => {overlay2.style.display = 'none';});

// --------------------------- OVERLAY PARA PORTAFOLIO ---------------------------
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = 0;
overlay.style.left = 0;
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.display = 'none';
overlay.style.justifyContent = 'center';
overlay.style.alignItems = 'center';
overlay.style.zIndex = 100;
document.body.appendChild(overlay);

const portfolioImage = document.createElement('img');
portfolioImage.src = 'Portafolios.png'; // tu imagen
portfolioImage.style.maxWidth = '45%';
portfolioImage.style.maxHeight = '45%';
overlay.appendChild(portfolioImage);

overlay.addEventListener('click', () => {overlay.style.display = 'none';});

// --------------------------- VARIABLES CÁMARA --------------------------

let targetPosition = null;
let targetLookAt = null;
let activeSpot = null;
let showPortfolioOnFocus = false;
let showPresentationOnFocus = false;

// --------------------------- CLICK SOBRE OBJETO ---------------------------
renderer.domElement.addEventListener('click', (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  let obj = intersects[0].object;
  while (obj && !clickableObjects.includes(obj.name)) obj = obj.parent;
  if (!obj) return;

  // ---------------- ENFOQUE CÁMARA ----------------
  if (cameraObjects.includes(obj.name)) {

    const data = spotLights[obj.name];
    if (!data) return;

    const object = data.object;
    const spot = data.light;

    const objPos = new THREE.Vector3();
    object.getWorldPosition(objPos);

    // mover foco encima del objeto
    spot.position.set(objPos.x, objPos.y + 4, objPos.z);
    spot.target.position.copy(objPos);

    if (activeSpot) activeSpot.visible = false;
    spot.visible = true;
    activeSpot = spot;

    ambientLight.intensity = 0;

    const forward = new THREE.Vector3(0, 0, 1);
    const worldQuaternion = object.getWorldQuaternion(new THREE.Quaternion());
    forward.applyQuaternion(worldQuaternion);

    targetPosition = objPos.clone().add(forward.multiplyScalar(2));
    targetPosition.y += 0.3;
    targetLookAt = objPos.clone();

    controls.enabled = false;
    exitButton.style.display = 'block';

    // si es Presentación, marcar para mostrar overlay al llegar
    showPortfolioOnFocus = (obj.name === "Lona2");
    showPresentationOnFocus = (obj.name === "Lona1");
  }
});


// --------------------------- BOTÓN X ---------------------------
exitButton.addEventListener('click', () => {

  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialCameraTarget);

  targetPosition = null;
  targetLookAt = null;

  exitButton.style.display = 'none';
  infoDiv.style.display = 'none';

  controls.enabled = true;
  controls.update();

  ambientLight.intensity = 0.8;

  if (activeSpot) {
    activeSpot.visible = false;
    activeSpot = null;
  }

  overlay.style.display = 'none';
  overlay2.style.display = 'none';
});

// --------------------------- LOOP ---------------------------
function animate() {
  requestAnimationFrame(animate);

  if (targetPosition && targetLookAt) {
    camera.position.lerp(targetPosition, 0.08);
    controls.target.lerp(targetLookAt, 0.08);

    if (camera.position.distanceTo(targetPosition) < 0.01) {
      targetPosition = null;
      targetLookAt = null;

      // mostrar overlay si corresponde
      if (showPortfolioOnFocus) {
        overlay.style.display = "flex";
        showPortfolioOnFocus = false;
      }
      // mostrar overlay si corresponde
      if (showPresentationOnFocus) {
        overlay2.style.display = "flex";
        showPresentationOnFocus = false;
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// --------------------------- RESIZE ---------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});