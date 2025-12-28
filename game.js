import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const CHUNK_SIZE = 8; 
const VIEW_DISTANCE = 1; // Ridotto al minimo per il primo avvio
const GRAVITY = -0.01;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());
scene.add(new THREE.AmbientLight(0xffffff, 1));

const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const blocks = [];
const chunks = new Set();
const mats = {
    grass: new THREE.MeshBasicMaterial({ color: 0x3c8527 }),
    dirt:  new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshBasicMaterial({ color: 0x707070 })
};

function addBlock(x, y, z, type) {
    const mesh = new THREE.Mesh(blockGeo, mats[type]);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    blocks.push(mesh);
}

// FUNZIONE ASINCRONA: permette alla barra di aggiornarsi!
async function generateInitialWorld() {
    const total = (VIEW_DISTANCE * 2 + 1) * (VIEW_DISTANCE * 2 + 1);
    let count = 0;

    for (let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
        for (let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
            buildChunk(x, z);
            chunks.add(`${x},${z}`);
            count++;
            
            const progress = Math.floor((count / total) * 100);
            window.updateLoadingBar(progress, `Creazione zolla ${count}/${total}...`);
            
            // Questo comando "dorme" per 10 millisecondi, permettendo alla barra di muoversi
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    camera.position.set(0, 22, 0);
    window.updateLoadingBar(100, "Mondo pronto!");
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            addBlock(wX, 20, wZ, 'grass');
        }
    }
}

// Logica di movimento e gravità
let velY = 0;
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const s = 0.1;
        if (keys['KeyW']) controls.moveForward(s);
        if (keys['KeyS']) controls.moveForward(-s);
        if (keys['KeyA']) controls.moveRight(-s);
        if (keys['KeyD']) controls.moveRight(s);

        velY += GRAVITY;
        camera.position.y += velY;

        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const ground = ray.intersectObjects(blocks);
        if (ground.length > 0) {
            velY = 0;
            camera.position.y = ground[0].point.y + 1.8;
            if (keys['Space']) velY = 0.2;
        }
    }
    renderer.render(scene, camera);
}

generateInitialWorld();
animate();