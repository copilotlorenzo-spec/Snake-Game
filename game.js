import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 16;
const GRAVITY = -0.012;
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('mousedown', () => { if(!document.pointerLockElement) controls.lock(); });

// --- MATERIALI ---
const mats = {
    grass: new THREE.MeshLambertMaterial({ color: 0x3c8527 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    deepslate: new THREE.MeshLambertMaterial({ color: 0x3d3d3d }),
    bedrock: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    wood: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
    leaves: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    cloud: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
    sun: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    moon: new THREE.MeshBasicMaterial({ color: 0xeeeeee })
};

const blocks = [];
const chunks = new Set();
const geo = new THREE.BoxGeometry(1, 1, 1);

// --- CIELO E CICLO GIORNO/NOTTE ---
const skyColors = { day: 0x72a0e5, night: 0x0a0a12 };
scene.background = new THREE.Color(skyColors.day);
scene.fog = new THREE.Fog(skyColors.day, 20, 55);

const celestialGroup = new THREE.Group(); // Gruppo per far ruotare sole e luna
scene.add(celestialGroup);

const sun = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), mats.sun);
sun.position.set(0, 60, 0);
celestialGroup.add(sun);

const moon = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), mats.moon);
moon.position.set(0, -60, 0);
celestialGroup.add(moon);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
scene.add(dirLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// --- NUVOLE QUADRATE ---
function spawnClouds() {
    for(let i = 0; i < 25; i++) {
        const cloud = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), mats.cloud);
        cloud.position.set((Math.random() - 0.5) * 300, 45, (Math.random() - 0.5) * 300);
        scene.add(cloud);
    }
}
spawnClouds();

// --- GENERAZIONE MONDO ---
function createBlock(x, y, z, mat) {
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, y, z);
    scene.add(b);
    blocks.push(b);
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(wX * 0.1) * 3 + 10);

            createBlock(wX, h, wZ, mats.grass);
            createBlock(wX, h-1, wZ, mats.dirt); 
            
            for(let y = h-2; y >= 0; y--) {
                let mat = mats.stone;
                if(y < 6) mat = mats.deepslate;
                if(y === 0) mat = mats.bedrock;
                createBlock(wX, y, wZ, mat);
            }
            if(Math.random() < 0.015) { // Alberi
                for(let i=1; i<=3; i++) createBlock(wX, h+i, wZ, mats.wood);
                for(let lx=-1; lx<=1; lx++) for(let lz=-1; lz<=1; lz++) createBlock(wX+lx, h+4, wZ+lz, mats.leaves);
            }
        }
    }
}

// --- MANO ---
const hand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.8), new THREE.MeshLambertMaterial({ color: 0x33cccc }));
hand.position.set(0.6, -0.5, -0.8);
hand.rotation.set(0.3, -0.2, 0);
camera.add(hand);
scene.add(camera);

camera.position.set(0, 20, 0);
let velY = 0, keys = {}, time = 0;

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.key >= '1' && e.key <= '9' && window.selectSlot) window.selectSlot(e.key);
});
document.addEventListener('keyup', e => keys[e.code] = false);

function loop() {
    requestAnimationFrame(loop);
    
    // Ciclo Giorno/Notte
    time += 0.002; 
    celestialGroup.rotation.z = time;
    
    // Cambia colore cielo e luce in base alla posizione del sole
    const sunY = Math.sin(time);
    const isDay = sunY > 0;
    const targetColor = isDay ? skyColors.day : skyColors.night;
    scene.background.lerp(new THREE.Color(targetColor), 0.02);
    scene.fog.color.copy(scene.background);
    dirLight.intensity = Math.max(0, sunY * 0.8);
    ambientLight.intensity = isDay ? 0.4 : 0.1;

    if(controls.isLocked) {
        const cx = Math.floor(camera.position.x / CHUNK_SIZE);
        const cz = Math.floor(camera.position.z / CHUNK_SIZE);
        if(!chunks.has(`${cx},${cz}`)) { buildChunk(cx, cz); chunks.add(`${cx},${cz}`); }

        const s = 0.15;
        if(keys['KeyW']) controls.moveForward(s);
        if(keys['KeyS']) controls.moveForward(-s);
        if(keys['KeyA']) controls.moveRight(-s);
        if(keys['KeyD']) controls.moveRight(s);

        velY += GRAVITY;
        camera.position.y += velY;
        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const ground = ray.intersectObjects(blocks);
        if(ground.length > 0) {
            velY = 0;
            camera.position.y = ground[0].point.y + 1.8;
            if(keys['Space']) velY = 0.22;
        }

        // Animazione mano
        if(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
            hand.position.y = -0.5 + Math.sin(performance.now() * 0.01) * 0.03;
        }
    }
    renderer.render(scene, camera);
}
loop();