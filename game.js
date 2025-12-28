import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE OTTIMIZZATA ---
const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 60; // Altezza bilanciata per le prestazioni
const VIEW_DISTANCE = 1; // Carica solo i chunk necessari per evitare lag
const GRAVITY = -0.012;
const JUMP_FORCE = 0.22;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 15, 40);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1 : window.devicePixelRatio); // Riduce il carico sui PC meno potenti
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- GESTIONE BLOCCHI OTTIMIZZATA (INSTANCING) ---
const geometry = new THREE.BoxGeometry(1, 1, 1);
const materialErba = new THREE.MeshLambertMaterial({ color: 0x3c8527 });
const instancedErba = new THREE.InstancedMesh(geometry, materialErba, 10000);
scene.add(instancedErba);

const chunks = new Set();
let blockCount = 0;
const dummy = new THREE.Object3D();

function generateWorld(pX, pZ) {
    const cx = Math.floor(pX / CHUNK_SIZE);
    const cz = Math.floor(pZ / CHUNK_SIZE);
    
    for (let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
        for (let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
            const key = `${cx + x},${cz + z}`;
            if (!chunks.has(key)) {
                buildChunk(cx + x, cz + z);
                chunks.add(key);
            }
        }
    }
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Generazione montagne fluida
            const h = Math.floor(Math.sin(worldX * 0.05) * Math.cos(worldZ * 0.05) * 8 + 15);
            
            dummy.position.set(worldX, h, worldZ);
            dummy.updateMatrix();
            instancedErba.setMatrixAt(blockCount++, dummy.matrix);
        }
    }
    instancedErba.instanceMatrix.needsUpdate = true;
}

// --- FISICA E MOVIMENTO ---
let playerVelY = 0;
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

camera.position.set(0, 30, 0);

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        generateWorld(camera.position.x, camera.position.z);

        const speed = 0.15;
        if (keys['KeyW']) controls.moveForward(speed);
        if (keys['KeyS']) controls.moveForward(-speed);
        if (keys['KeyA']) controls.moveRight(-speed);
        if (keys['KeyD']) controls.moveRight(speed);

        // Gravità semplice e fluida
        playerVelY += GRAVITY;
        camera.position.y += playerVelY;

        if (camera.position.y < 20) { // Pavimento fisso temporaneo per evitare lag di collisione
            camera.position.y = 20;
            playerVelY = 0;
            if (keys['Space']) playerVelY = JUMP_FORCE;
        }
    }
    renderer.render(scene, camera);
}
animate();