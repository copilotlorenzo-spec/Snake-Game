import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ULTRA FLUIDA ---
const CHUNK_SIZE = 8; // Più piccolo per non laggare
const RENDER_DISTANCE = 1; 
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

// --- GESTIONE BLOCCHI ---
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
    mesh.userData = { hp: type === 'stone' ? 3 : 1 };
    
    // Bordi visibili ma leggeri
    const e = new THREE.EdgesGeometry(blockGeo);
    const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true}));
    mesh.add(l);
    
    scene.add(mesh);
    blocks.push(mesh);
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            
            // Terreno fisso ma con buchi per le caverne
            const h = 20; 
            addBlock(wX, h, wZ, 'grass');
            addBlock(wX, h - 1, wZ, 'dirt');
            if (Math.random() > 0.1) addBlock(wX, h - 2, wZ, 'stone'); 
        }
    }
}

// --- FISICA E SCUOLA ---
let velY = 0;
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && controls.isLocked) {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), camera);
        const inter = ray.intersectObjects(blocks);
        if (inter.length > 0) {
            const target = inter[0].object;
            target.userData.hp--;
            if (target.userData.hp <= 0) {
                scene.remove(target);
                blocks.splice(blocks.indexOf(target), 1);
            }
        }
    }
});

camera.position.set(0, 25, 0);

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        // Genera chunk solo se necessario
        const cX = Math.floor(camera.position.x / CHUNK_SIZE);
        const cZ = Math.floor(camera.position.z / CHUNK_SIZE);
        const key = `${cX},${cZ}`;
        if (!chunks.has(key)) {
            buildChunk(cX, cZ);
            chunks.add(key);
        }

        const s = 0.1;
        if (keys['KeyW']) controls.moveForward(s);
        if (keys['KeyS']) controls.moveForward(-s);
        if (keys['KeyA']) controls.moveRight(-s);
        if (keys['KeyD']) controls.moveRight(s);

        // Gravità reale
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
animate();