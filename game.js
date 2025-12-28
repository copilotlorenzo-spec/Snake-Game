import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 8; 
const VIEW_DISTANCE = 2; // Carica 2 chunk intorno al giocatore
const GRAVITY = -0.01;
const JUMP_FORCE = 0.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 20, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

scene.add(new THREE.AmbientLight(0xffffff, 1));

// --- GESTIONE MONDO ---
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
    
    const e = new THREE.EdgesGeometry(blockGeo);
    const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true}));
    mesh.add(l);
    
    scene.add(mesh);
    blocks.push(mesh);
}

// Funzione per la generazione iniziale del mondo con caricamento
function generateInitialWorld() {
    const totalChunksToLoad = (VIEW_DISTANCE * 2 + 1) * (VIEW_DISTANCE * 2 + 1);
    let loadedChunks = 0;

    for (let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
        for (let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
            const cx = x;
            const cz = z;
            const key = `${cx},${cz}`;
            
            buildChunk(cx, cz);
            chunks.add(key);

            loadedChunks++;
            const progress = Math.floor((loadedChunks / totalChunksToLoad) * 100);
            window.updateLoadingBar(progress, `Generazione del terreno (${progress}%)`);
        }
    }
    // Una volta caricati tutti i chunk iniziali, posiziona il giocatore e nascondi la barra
    camera.position.set(0, 25, 0); // Posiziona il giocatore sopra il terreno iniziale
    window.updateLoadingBar(100, "Mondo pronto!");
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wX = cx * CHUNK_SIZE + x;
            const wZ = cz * CHUNK_SIZE + z;
            
            const h = Math.floor(Math.sin(wX * 0.1) * Math.cos(wZ * 0.1) * 8 + 20); // Terreno più fluido
            
            addBlock(wX, h, wZ, 'grass');
            addBlock(wX, h - 1, wZ, 'dirt');
            if (Math.random() > 0.7) addBlock(wX, h - 2, wZ, 'stone'); // Più pietra sotto
        }
    }
}

// --- FISICA E INPUT ---
let playerVelY = 0;
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

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        // Caricamento dinamico dei chunk durante il gioco
        const pX = Math.floor(camera.position.x / CHUNK_SIZE);
        const pZ = Math.floor(camera.position.z / CHUNK_SIZE);

        for (let x = -VIEW_DISTANCE; x <= VIEW_DISTANCE; x++) {
            for (let z = -VIEW_DISTANCE; z <= VIEW_DISTANCE; z++) {
                const key = `${pX + x},${pZ + z}`;
                if (!chunks.has(key)) {
                    buildChunk(pX + x, pZ + z);
                    chunks.add(key);
                }
            }
        }

        const speed = 0.12;
        if (keys['KeyW']) controls.moveForward(speed);
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
            if (keys['Space']) velY = JUMP_FORCE;
        }
    }
    renderer.render(scene, camera);
}

// Avvia la generazione iniziale del mondo
generateInitialWorld();
animate();