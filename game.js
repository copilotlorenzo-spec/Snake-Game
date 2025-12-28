import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 10, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);

// Sblocca il mouse solo se il menu non è visibile
document.addEventListener('click', () => {
    if(document.getElementById('game-menu').style.display !== 'flex') {
        controls.lock();
    }
});

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- SPADA DI DIAMANTE (MANO) ---
const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.6, 0.15), 
    new THREE.MeshBasicMaterial({ color: 0x33cccc })
);
sword.position.set(0.6, -0.6, -1);
sword.rotation.x = Math.PI / 4;
camera.add(sword);
scene.add(camera);

// --- GENERAZIONE MONDO (20x20) ---
const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshLambertMaterial({ color: 0x3c8527 });

for(let x = -20; x < 20; x++) {
    for(let z = -20; z < 20; z++) {
        // Altezza variabile per le colline
        const h = Math.floor(Math.sin(x*0.1) * Math.cos(z*0.1) * 3 + 10);
        const b = new THREE.Mesh(geo, grassMat);
        b.position.set(x, h, z);
        
        // Bordi neri sottili per lo stile Java
        const e = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo), 
            new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true})
        );
        b.add(e);
        
        scene.add(b);
        blocks.push(b);
    }
}

// --- STATO INIZIALE E INPUT ---
camera.position.set(0, 15, 0); // SPAWN A TERRA
let velY = 0;
let keys = {};
let clock = new THREE.Clock();

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Cambio Slot 1-9
    if (e.key >= '1' &&