import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 16;
const VIEW_DISTANCE = 1; 
const GRAVITY = -0.012;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 15, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => { 
    if(document.getElementById('game-menu').style.display !== 'flex') controls.lock(); 
});

// --- MATERIALI ---
const mats = {
    grass: new THREE.MeshLambertMaterial({ color: 0x3c8527 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    deepslate: new THREE.MeshLambertMaterial({ color: 0x3d3d3d }),
    bedrock: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    wood: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
    leaves: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    zombie: new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
    pig: new THREE.MeshLambertMaterial({ color: 0xffafaf }), // Rosa
    sheep: new THREE.MeshLambertMaterial({ color: 0xffffff }) // Bianco
};

const blocks = [];
const chunks = new Set();
const entities = []; // Mob e Animali
const geo = new THREE.BoxGeometry(1, 1, 1);

// --- GENERATORE MONDO ---
function createBlock(x, y, z, mat) {
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, y, z);
    scene.add(b);
    blocks.push(b);
}

function generateTree(x, y, z) {
    for(let i=1; i<=3; i++) createBlock(x, y+i, z, mats.wood);
    for(let lx=-1; lx<=1; lx++) {
        for(let lz=-1; lz<=1; lz++) {
            createBlock(x+lx, y+4, z+lz, mats.leaves);
        }
    }
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(wX * 0.1) * 3 + 10);

            createBlock(wX, h, wZ, mats.grass);
            createBlock(wX, h-1, wZ, mats.dirt); 
            
            // Strati sotterranei
            for(let y = h-2; y >= 0; y--) {
                let mat = mats.stone;
                if(y < 6) mat = mats.deepslate;
                if(y === 0) mat = mats.bedrock;
                createBlock(wX, y, wZ, mat);
            }

            // Alberi e Animali
            const rand = Math.random();
            if(rand < 0.02) generateTree(wX, h, wZ);
            if(rand > 0.98) spawnEntity(wX, h+2, wZ, 'sheep');
            if(rand > 0.99) spawnEntity(wX, h+2, wZ, 'pig');
            if(rand < 0.01) spawnEntity(wX, h+2, wZ, 'zombie');
        }
    }
}

// --- ENTITÀ (ZOMBIE, PECORE, MAIALI) ---
function spawnEntity(x, y, z, type) {
    let mesh;
    if(type === 'zombie') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), mats.zombie);
    else if(type === 'pig') mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), mats.pig);
    else mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.1), mats.sheep);
    
    mesh.position.set(x, y, z);
    mesh.userData = { type: type, velY: 0, timer: 0 };
    scene.add(mesh);
    entities.push(mesh);
}

// --- LOGICA SURVIVAL ---
let health = 10;
let velY = 0;
let keys = {};
camera.position.set(0, 25, 0);

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.key >= '1' && e.key <= '9' && window.selectSlot) window.selectSlot(e.key);
});
document.addEventListener('keyup', e => keys[e.code] = false);

function updateHUD() {
    const heartsDisplay = "❤".repeat(health) + "🖤".repeat(Math.max(0, 10 - health));
    const hElement = document.getElementById('hearts');
    if(hElement) hElement.innerText = heartsDisplay;
    
    if(health <= 0) {
        alert("GAME OVER - SEI MORTO!");
        location.reload();
    }
}

// Luci
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// --- LOOP PRINCIPALE ---
function loop() {
    requestAnimationFrame(loop);
    
    if(controls.isLocked) {
        // Generazione Chunk Infinito
        const pX = Math.floor(camera.position.x / CHUNK_SIZE);
        const pZ = Math.floor(camera.position.z / CHUNK_SIZE);
        if(!chunks.has(`${pX},${pZ}`)) {
            buildChunk(pX, pZ);
            chunks.add(`${pX},${pZ}`);
        }

        // Movimento Giocatore
        const s = 0.15;
        if(keys['KeyW']) controls.moveForward(s);
        if(keys['KeyS']) controls.moveForward(-s);
        if(keys['KeyA']) controls.moveRight(-s);
        if(keys['KeyD']) controls.moveRight(s);

        // Fisica Giocatore
        velY += GRAVITY;
        camera.position.y += velY;
        const pRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const pGround = pRay.intersectObjects(blocks);
        if(pGround.length > 0) {
            velY = 0;
            camera.position.y = pGround[0].point.y + 1.8;
            if(keys['Space']) velY = 0.22;
        }

        // AI Entità (Mob e Animali)
        entities.forEach(ent => {
            // Gravità entità
            ent.userData.velY += GRAVITY;
            ent.position.y += ent.userData.velY;
            const eRay = new THREE.Raycaster(ent.position, new THREE.Vector3(0,-1,0), 0, 1);
            const eGround = eRay.intersectObjects(blocks);
            if(eGround.length > 0) {
                ent.userData.velY = 0;
                ent.position.y = eGround[0].point.y + (ent.userData.type === 'zombie' ? 1 : 0.5);
            }

            const dist = ent.position.distanceTo(camera.position);
            
            if(ent.userData.type === 'zombie') {
                if(dist < 12) {
                    ent.lookAt(camera.position.x, ent.position.y, camera.position.z);
                    ent.translateZ(0.04);
                }
                if(dist < 1.5 && Math.random() < 0.02) {
                    health -= 1;
                    updateHUD();
                }
            } else {
                // Animali che vagano a caso
                ent.userData.timer++;
                if(ent.userData.timer % 100 === 0) ent.rotation.y += (Math.random() - 0.5) * 2;
                ent.translateZ(0.02);
            }
        });
    }
    renderer.render(scene, camera);
}

loop();