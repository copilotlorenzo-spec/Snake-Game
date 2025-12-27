import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo azzurro
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => {
    controls.lock();
});

// LUCI (Fondamentali per non vedere tutto nero)
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// TERRENO DI CUBI
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const dirtMat = new THREE.MeshBasicMaterial({ color: 0x8b4513 }); // Materiale base semplice

for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
        const block = new THREE.Mesh(boxGeo, dirtMat);
        block.position.set(x, 0, z);
        scene.add(block);
    }
}

camera.position.y = 2;
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
console.log("Lollocraft avviato con successo!");