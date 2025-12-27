import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo
scene.fog = new THREE.Fog(0x87ceeb, 0, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixelato stile Java
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// LUCI
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(10, 20, 10);
scene.add(sun);

// TEXTURES
const loader = new THREE.TextureLoader();
// Usiamo una texture di erba reale di Minecraft
const grassTex = loader.load('https://js-minecraft.vercel.app/textures/grass.png');
grassTex.magFilter = THREE.NearestFilter; // Rende i pixel nitidi come Java

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ map: grassTex });

// GENERAZIONE MONDO
for (let x = -15; x < 15; x++) {
    for (let z = -15; z < 15; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

// UI: HOTBAR (La barra degli oggetti in basso)
const hotbar = document.createElement('div');
hotbar.style.cssText = "position:fixed; bottom:10px; left:50%; transform:translateX(-50%); width:400px; height:44px; background:rgba(0,0,0,0.5); border:2px solid #fff; display:flex; gap:2px; padding:2px; z-index:100;";
for(let i=0; i<9; i++) {
    const slot = document.createElement('div');
    slot.style.cssText = "width:44px; height:44px; border:2px solid #555; background:rgba(255,255,255,0.1);";
    if(i===0) slot.style.borderColor = "white"; // Slot selezionato
    hotbar.appendChild(slot);
}
document.body.appendChild(hotbar);

// UI: CUORI
const hearts = document.createElement('div');
hearts.style.cssText = "position:fixed; bottom:65px; left:50%; transform:translateX(-50%); font-size:20px; z-index:100;";
hearts.innerHTML = "❤️".repeat(10);
document.body.appendChild(hearts);

camera.position.y = 2;
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();