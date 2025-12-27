import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

let inventory = { terra: 5 }; // Parti con 5 blocchi
let health = 10;
const blocks = [];
let zombie;

// --- MOVIMENTO ---
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': if (camera.position.y <= 2.1) velocity.y += 5; break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- MONDO E LUCI ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, 10);
scene.add(sun);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
        const block = new THREE.Mesh(boxGeo, dirtMat);
        block.position.set(x, 0, z);
        scene.add(block);
        blocks.push(block);
    }
}

// Zombie
const zombieMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
zombie = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), zombieMat);
zombie.position.set(5, 1, -5);
scene.add(zombie);

// --- INTERAZIONE MOUSE ---
const raycaster = new THREE.Raycaster();
window.addEventListener('mousedown', (e) => {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length > 0) {
        if (e.button === 0) { // TASTO SINISTRO: Rompi
            const target = intersects[0].object;
            scene.remove(target);
            blocks.splice(blocks.indexOf(target), 1);
            inventory.terra++;
        } 
        else if (e.button === 2) { // TASTO DESTRO: Piazza
            if (inventory.terra > 0) {
                const intersect = intersects[0];
                const newBlock = new THREE.Mesh(boxGeo, dirtMat);
                // Calcola la posizione accanto al blocco cliccato
                newBlock.position.copy(intersect.object.position).add(intersect.face.normal);
                scene.add(newBlock);
                blocks.push(newBlock);
                inventory.