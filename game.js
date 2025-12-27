import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo azzurro
scene.fog = new THREE.Fog(0x87ceeb, 0, 40);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Effetto pixelato
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// LUCI
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// TEXTURE CARICATA DA MINECRAFT ASSETS
const loader = new THREE.TextureLoader();
const grassTex = loader.load('https://vignette.wikia.nocookie.net/minecraft-computer/images/2/22/Grass_Block.png');
grassTex.magFilter = THREE.NearestFilter; // Fondamentale per l'effetto pixel!

// CREAZIONE BLOCCHI INDIVIDUALI
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ map: grassTex });

for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, 0, z);
        // Aggiungiamo un bordo nero sottile per separare i cubi
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 }));
        cube.add(line);
        scene.add(cube);
    }
}

camera.position.set(0, 2, 5);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();