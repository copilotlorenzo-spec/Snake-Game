import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 16;
const VIEW_DISTANCE = 1; 
const GRAVITY = -0.01;
const JUMP_FORCE = 0.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 20, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Forza performance alte
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- GESTIONE MONDO ---
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const blocks = []; 
const chunks = new Map();

const types = {
    grass: { color: 0x3c8527, hp: 1 },
    dirt:  { color: 0x8b4513, hp: 1 },
    stone: { color: 0x707070, hp: 3 } // Più resistente
};

function creaBlocco(x, y, z, typeName) {
    const mat = new THREE.MeshLambertMaterial({ color: types[typeName].color });
    const mesh = new THREE.Mesh(blockGeo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { hp: types[typeName].hp, type: typeName };
    
    // Bordi leggeri per non pesare sulla GPU
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(blockGeo), 
        new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 })
    );
    mesh.add(edges);
    
    scene.add(mesh);
    blocks.push(mesh);
}

function generateWorld() {
    const pX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pZ = Math.floor(camera.position.z / CHUNK_SIZE);

    for (let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
        for (let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
            const key = `${pX + x},${pZ + z}`;
            if (!chunks.has(key)) {
                buildChunk(pX + x, pZ + z);
                chunks.set(key, true);
            }
        }
    }
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(wX * 0.1) * Math.cos(wZ * 0.1) * 8 + 20);
            
            creaBlocco(wX, h, wZ, 'grass');
            if (Math.random() > 0.5) creaBlocco(wX, h-1, wZ, 'dirt'); // Strati minimi per fluidità
        }
    }
}

// --- FISICA E INPUT ---
let playerVelY = 0;
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// Scavo (Click sinistro)
window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && controls.isLocked) {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), camera);
        const inter = ray.intersectObjects(blocks);
        if (inter.length > 0) {
            const target = inter[0].object;
            target.userData.hp -= 1;
            if (target.userData.hp <= 0) {
                scene.remove(target);
                blocks.splice(blocks.indexOf(target), 1);
            }
        }
    }
});

camera.position.set(0, 30, 0);

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        generateWorld();

        const speed = 0.12;
        if (keys['KeyW']) controls.moveForward(speed);
        if (keys['KeyS']) controls.moveForward(-speed);
        if (keys['KeyA']) controls.moveRight(-speed);
        if (keys['KeyD']) controls.moveRight(speed);

        // GRAVITÀ E COLLISIONE (Caduta nei buchi)
        playerVelY += GRAVITY;
        camera.position.y += playerVelY;

        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0, 1.8);
        const ground = ray.intersectObjects(blocks);

        if (ground.length > 0) {
            playerVelY = 0;
            camera.position.y = ground[0].point.y + 1.8;
            if (keys['Space']) playerVelY = JUMP_FORCE;
        }
    }
    renderer.render(scene, camera);
}
animate();