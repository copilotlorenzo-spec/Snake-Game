import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE AVANZATA ---
const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 100;
const VIEW_DISTANCE = 2; // Quanti chunk caricare intorno al giocatore
const GRAVITY = -0.015;
const JUMP_FORCE = 0.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// Luci
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 100, 50);
scene.add(sun);

// --- GESTIONE MONDO E CHUNK ---
const chunks = new Map();
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();

const blockTypes = {
    grass: { color: 0x3c8527, strength: 10 },  // Veloce da rompere
    dirt:  { color: 0x8b4513, strength: 10 },
    stone: { color: 0x707070, strength: 40 }   // Più lenta da rompere
};

function getChunkKey(x, z) { return `${Math.floor(x/CHUNK_SIZE)},${Math.floor(z/CHUNK_SIZE)}`; }

function generateChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (chunks.has(key)) return;

    const group = new THREE.Group();
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Altezza variabile (Montagne fino a 100 blocchi)
            const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 10 + 20);
            
            for (let y = 0; y <= h; y++) {
                let type = 'stone';
                if (y === h) type = 'grass';
                else if (y > h - 3) type = 'dirt';

                const mat = new THREE.MeshLambertMaterial({ color: blockTypes[type].color });
                const mesh = new THREE.Mesh(blockGeo, mat);
                mesh.position.set(worldX, y, worldZ);
                mesh.userData = { type: type, hp: blockTypes[type].strength };
                
                // Bordi per realismo
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(blockGeo), new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true}));
                mesh.add(edges);
                
                group.add(mesh);
            }
        }
    }
    scene.add(group);
    chunks.set(key, group);
}

// --- LOGICA DI GIOCO ---
let playerVelY = 0;
let isBreaking = false;
let breakTarget = null;

window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && controls.isLocked) isBreaking = true;
});
window.addEventListener('mouseup', () => { isBreaking = false; breakTarget = null; });

function updateBreaking() {
    if (!isBreaking) return;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const intersects = ray.intersectObjects(Array.from(chunks.values()).flatMap(g => g.children));

    if (intersects.length > 0) {
        const target = intersects[0].object;
        if (breakTarget !== target) breakTarget = target;
        
        target.userData.hp--; // Riduce la vita del blocco
        if (target.userData.hp <= 0) {
            target.parent.remove(target); // Rompe il blocco
        }
    }
}

// --- LOOP PRINCIPALE ---
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

camera.position.set(8, 40, 8); // Inizia in alto per vedere il mondo

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        // Genera chunk intorno al giocatore
        const pCX = Math.floor(camera.position.x / CHUNK_SIZE);
        const pCZ = Math.floor(camera.position.z / CHUNK_SIZE);
        for(let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
            for(let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
                generateChunk(pCX + x, pCZ + z);
            }
        }

        // Movimento
        const speed = 0.12;
        if (keys['KeyW']) controls.moveForward(speed);
        if (keys['KeyS']) controls.moveForward(-speed);
        if (keys['KeyA']) controls.moveRight(-speed);
        if (keys['KeyD']) controls.moveRight(speed);

        // GRAVITÀ REALE (Rilevazione collisioni semplificata)
        playerVelY += GRAVITY;
        camera.position.y += playerVelY;

        // Collisione con il terreno (scansione blocchi sotto i piedi)
        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0, 1.8);
        const floorIntersects = ray.intersectObjects(Array.from(chunks.values()).flatMap(g => g.children));
        
        if (floorIntersects.length > 0) {
            playerVelY = 0;
            camera.position.y = floorIntersects[0].point.y + 1.8;
            if (keys['Space']) playerVelY = JUMP_FORCE;
        }

        updateBreaking();
    }
    renderer.render(scene, camera);
}
animate();