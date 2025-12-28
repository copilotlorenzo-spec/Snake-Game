import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 16;
const VIEW_DISTANCE = 1; 
const GRAVITY = -0.012;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => { if(document.getElementById('game-menu').style.display !== 'flex') controls.lock(); });

// --- MATERIALI ---
const mats = {
    grass: new THREE.MeshLambertMaterial({ color: 0x3c8527 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    deepslate: new THREE.MeshLambertMaterial({ color: 0x3d3d3d }),
    bedrock: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    wood: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
    leaves: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    zombie: new THREE.MeshLambertMaterial({ color: 0x4caf50 })
};

const blocks = [];
const chunks = new Set();
const mobs = [];
const geo = new THREE.BoxGeometry(1, 1, 1);

// --- GENERATORE MONDO ---
function createBlock(x, y, z, mat) {
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, y, z);
    scene.add(b);
    blocks.push(b);
    return b;
}

function generateTree(x, y, z) {
    for(let i=1; i<=3; i++) createBlock(x, y+i, z, mats.wood); // Tronco
    for(let lx=-1; lx<=1; lx++) {
        for(let lz=-1; lz<=1; lz++) {
            createBlock(x+lx, y+4, z+lz, mats.leaves); // Chioma
        }
    }
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(wX * 0.1) * 3 + 10);

            createBlock(wX, h, wZ, mats.grass); // Superficie
            createBlock(wX, h-1, wZ, mats.dirt); 
            
            // Strati sotterranei
            for(let y = h-2; y > 0; y--) {
                let mat = mats.stone;
                if(y < 5) mat = mats.deepslate;
                if(y === 0) mat = mats.bedrock;
                createBlock(wX, y, wZ, mat);
            }

            // Alberi rari
            if(Math.random() < 0.02) generateTree(wX, h, wZ);
        }
    }
}

// --- MOB (ZOMBIE) ---
function spawnZombie(x, z) {
    const zomb = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), mats.zombie);
    zomb.position.set(x, 15, z);
    scene.add(zomb);
    mobs.push(zomb);
}

// --- LOGICA SURVIVAL ---
let health = 10;
let velY = 0;
let keys = {};
let currentSlot = '1';
camera.position.set(0, 20, 0);

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.key >= '1' && e.key <= '9') {
        currentSlot = e.key;
        if(window.selectSlot) window.selectSlot(e.key);
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

function updateSurvival() {
    const hearts = "❤".repeat(health) + "🖤".repeat(10 - health);
    document.getElementById('hearts').innerText = hearts;
    if(health <= 0) {
        alert("SEI MORTO!");
        location.reload();
    }
}

// --- LOOP ---
function loop() {
    requestAnimationFrame(loop);
    if(controls.isLocked) {
        // Mondo Infinito
        const pX = Math.floor(camera.position.x / CHUNK_SIZE);
        const pZ = Math.floor(camera.position.z / CHUNK_SIZE);
        if(!chunks.has(`${pX},${pZ}`)) {
            buildChunk(pX, pZ);
            chunks.add(`${pX},${pZ}`);
            if(Math.random() < 0.1) spawnZombie(camera.position.x + 10, camera.position.z + 10);
        }

        // Movimento
        const s = 0.15;
        if(keys['KeyW']) controls.moveForward(s);
        if(keys['KeyS']) controls.moveForward(-s);
        if(keys['KeyA']) controls.moveRight(-s);
        if(keys['KeyD']) controls.moveRight(s);

        // Gravità e Collisione
        velY += GRAVITY;
        camera.position.y += velY;
        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const ground = ray.intersectObjects(blocks);
        if(ground.length > 0) {
            velY = 0;
            camera.position.y = ground[0].point.y + 1.8;
            if(keys['Space']) velY = 0.22;
        }

        // Mob AI e Danno
        mobs.forEach(m => {
            const dist = m.position.distanceTo(camera.position);
            if(dist < 10) { // Insegue
                m.lookAt(camera.position.x, m.position.y, camera.position.z);
                m.translateZ(0.05);
            }
            if(dist < 1.5 && Math.random() < 0.05) { // Attacca
                health -= 1;
                updateSurvival();
            }
        });
    }
    renderer.render(scene, camera);
}

scene.add(new THREE.DirectionalLight(0xffffff, 0.6));
loop();