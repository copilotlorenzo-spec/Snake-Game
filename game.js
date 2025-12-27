import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

console.log("Lollocraft: Inizializzazione mondo...");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo azzurro Minecraft

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// Luci (fondamentali per non vedere nero!)
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Creazione del terreno di blocchi
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x3c8527 }); // Verde erba

for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

camera.position.y = 3;
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
console.log("Lollocraft: Mondo caricato correttamente!");