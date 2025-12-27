import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- STATO DEL GIOCO ---
let inventory = { "dirt": 0, "wood": 0, "stone": 0 };
let health = 10;
const blocks = []; // Array per i blocchi che si possono rompere

// --- SCENA E CONTROLLI ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// --- GENERAZIONE MONDO ---
// Creiamo alcuni blocchi di prova
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Terra

for(let x = -5; x < 5; x++) {
    for(let z = -5; z < 5; z++) {
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, 0, z);
        scene.add(block);
        blocks.push(block); // Aggiungiamo alla lista di quelli "rompibili"
    }
}

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

camera.position.z = 5;
camera.position.y = 2;

// --- FUNZIONE PER ROMPERE BLOCCHI ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // Il centro dello schermo

window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Click sinistro per rompere
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(blocks);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            scene.remove(object); // Rimuove dal mondo
            inventory.dirt++; // Aggiunge all'inventario
            updateInventoryUI();
        }
    }
});

// --- INTERFACCIA (UI) ---
function createUI() {
    const invDiv = document.createElement('div');
    invDiv.id = "inventory";
    invDiv.style.cssText = "position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.7); padding:15px; border:2px solid #555; color:white;";
    document.body.appendChild(invDiv);
    updateInventoryUI();
}

function updateInventoryUI() {
    const inv = document.getElementById('inventory');
    if(inv) inv.innerHTML = `<b>INVENTARIO</b><br>Terra: ${inventory.dirt}<br>Pietra: ${inventory.stone}`;
}

createUI();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();