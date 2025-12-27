import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// --- LOGICA GIOCO ---
let inventory = { terra: 0 };
let health = 10;
const blocks = [];
let zombie;

// --- LUCI ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(10, 20, 10);
scene.add(sunLight);

// --- GENERAZIONE TERRENO (Blocchi romponibili) ---
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

// --- CREAZIONE ZOMBIE (Mob semplice) ---
const zombieGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
const zombieMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
zombie = new THREE.Mesh(zombieGeo, zombieMat);
zombie.position.set(5, 1, -5);
scene.add(zombie);

// --- INTERFACCIA (UI) ---
const ui = document.createElement('div');
ui.style.cssText = "position:fixed; top:20px; left:20px; color:white; font-family:monospace; background:rgba(0,0,0,0.5); padding:10px;";
document.body.appendChild(ui);

const heartContainer = document.createElement('div');
heartContainer.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); font-size:30px;";
document.body.appendChild(heartContainer);

function updateUI() {
    ui.innerHTML = `INVENTARIO: ${inventory.terra} Terra<br>MODALITÀ: Survival`;
    heartContainer.innerHTML = '❤️'.repeat(health) + '🖤'.repeat(10 - health);
}

// --- ROMPERE BLOCCHI ---
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Click sinistro
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(blocks);
        if (intersects.length > 0) {
            const target = intersects[0].object;
            scene.remove(target);
            blocks.splice(blocks.indexOf(target), 1);
            inventory.terra++;
            updateUI();
        }
    }
});

// --- MOVIMENTO E ANIMAZIONE ---
camera.position.y = 2;
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    
    // Lo zombie ti segue lentamente
    const dx = camera.position.x - zombie.position.x;
    const dz = camera.position.z - zombie.position.z;
    zombie.position.x += dx * 0.005;
    zombie.position.z += dz * 0.005;

    // Se lo zombie ti tocca, perdi vita
    const dist = Math.sqrt(dx*dx + dz*dz);
    if(dist < 1) {
        health = Math.max(0, health - 0.01);
        updateUI();
        if(health <= 0) {
             alert("LO ZOMBIE TI HA UCCISO!");
             location.reload();
        }
    }

    renderer.render(scene, camera);
}

updateUI();
animate();