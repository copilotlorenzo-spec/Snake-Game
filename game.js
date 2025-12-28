import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const CHUNK_SIZE = 16;
const VIEW_DISTANCE = 1; 
const GRAVITY = -0.015;
const JUMP_FORCE = 0.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 15, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 50, 10);
scene.add(sun);

// --- MATERIALI E TIPI ---
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const blocks = []; // Array per collisioni e scavo
const chunks = new Set();

const types = {
    grass: { color: 0x3c8527, hp: 10 },
    dirt:  { color: 0x8b4513, hp: 10 },
    stone: { color: 0x707070, hp: 40 }
};

function creaBlocco(x, y, z, typeName) {
    const info = types[typeName];
    const mat = new THREE.MeshLambertMaterial({ color: info.color });
    const mesh = new THREE.Mesh(blockGeo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { hp: info.hp, type: typeName };
    
    // Bordi blocchi
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(blockGeo), 
        new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
    );
    mesh.add(edges);
    
    scene.add(mesh);
    blocks.push(mesh);
}

// --- GENERATORE CHUNK INFINITI ---
function generateWorld() {
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
}

function buildChunk(cx, cz) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const