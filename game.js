import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBreakSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

// --- ITEMS & INVENTARIO ---
const allItems = [
    { name: 'Grass', color: 0x3c8527, icon: '🌿' },
    { name: 'Dirt', color: 0x8b4513, icon: '🌑' },
    { name: 'Stone', color: 0x808080, icon: '🧱' },
    { name: 'Deepslate', color: 0x3d3d3d, icon: '⬛' },
    { name: 'Wood', color: 0x5d4037, icon: '🪵' },
    { name: 'Leaves', color: 0x2e7d32, icon: '🍃' },
    { name: 'Diamond', color: 0x33cccc, icon: '💎' },
    { name: 'Gold', color: 0xffd700, icon: '🟡' }
];
let hotbarItems = [null, allItems[0], allItems[1], allItems[2], allItems[4], null, null, null, null];
let selectedIdx = 1;

const grid = document.getElementById('inv-grid');
allItems.forEach(item => {
    const d = document.createElement('div'); d.className = 'inv-slot'; d.innerHTML = item.icon;
    d.onclick = () => { hotbarItems[selectedIdx-1] = item; window.updateHotbarUI(selectedIdx, item.icon); };
    grid.appendChild(d);
});

// --- MONDO ---
const blocks = [], particles = [], chunks = new Set();
const geo = new THREE.BoxGeometry(1, 1, 1);

function createBlock(x, y, z, color) {
    const b = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    b.position.set(x, y, z);
    scene.add(b);
    blocks.push(b);
}

function spawnParticles(pos, color) {
    for(let i=0; i<6; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: color}));
        p.position.copy(pos);
        p.userData = { vel: new THREE.Vector3((Math.random()-0.5)*0.1, 0.1, (Math.random()-0.5)*0.1), life: 25 };
        scene.add(p); particles.push(p);
    }
}

// --- CARICAMENTO INIZIALE ---
async function initWorld() {
    const bar = document.getElementById('loading-bar');
    const total = 16 * 16;
    let count = 0;

    for (let x = -8; x < 8; x++) {
        for (let z = -8; z < 8; z++) {
            const h = Math.floor(Math.sin(x * 0.1) * 3 + 10);
            createBlock(x, h, z, 0x3c8527); // Grass
            createBlock(x, h-1, z, 0x8b4513); // Dirt
            count++;
            bar.style.width = (count / total * 100) + "%";
            if(count % 20 === 0) await new Promise(r => setTimeout(r, 10)); // Simula attesa
        }
    }
    
    window.hideLoading();
    camera.position.set(0, 20, 0);
}

// --- LOOP ---
let velY = 0, keys = {}, time = 0;
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.6); scene.add(sun);

window.addEventListener('mousedown', (e) => {
    if(!controls.isLocked) return;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(blocks);
    if(hits.length > 0) {
        if(e.button === 0) { // Rompi
            const obj = hits[0].object;
            spawnParticles(obj.position, obj.material.color);
            playBreakSound();
            scene.remove(obj);
            blocks.splice(blocks.indexOf(obj), 1);
        } else if(e.button === 2) { // Piazza
            const item = hotbarItems[selectedIdx-1];
            if(item) {
                const p = hits[0].object.position.clone().add(hits[0].face.normal);
                createBlock(p.x, p.y, p.z, item.color);
            }
        }
    }
});

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.key === 'e') window.toggleInventory();
    if(e.key >= '1' && e.key <= '9') { selectedIdx = parseInt(e.key); window.selectSlotHUD(selectedIdx); }
});
document.addEventListener('keyup', e => keys[e.code] = false);

function loop() {
    requestAnimationFrame(loop);
    
    // Anima particelle
    for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.position.add(p.userData.vel);
        p.userData.vel.y -= 0.005;
        p.userData.life--;
        if(p.userData.life <= 0) { scene.remove(p); particles.splice(i, 1); }
    }

    if(controls.isLocked) {
        // Ciclo Giorno/Notte (2 minuti)
        time += 0.001;
        const dayProgress = (Math.sin(time * 0.5) + 1) / 2;
        scene.background = new THREE.Color(0x0a0a12).lerp(new THREE.Color(0x72a0e5), dayProgress);
        sun.intensity = dayProgress;

        const s = 0.15;
        if(keys['KeyW']) controls.moveForward(s);
        if(keys['KeyS']) controls.moveForward(-s);
        if(keys['KeyA']) controls.moveRight(-s);
        if(keys['KeyD']) controls.moveRight(s);

        velY -= 0.01; camera.position.y += velY;
        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const hit = ray.intersectObjects(blocks);
        if(hit.length > 0) {
            velY = 0; camera.position.y = hit[0].point.y + 1.8;
            if(keys['Space']) velY = 0.2;
        }
    }
    renderer.render(scene, camera);
}

initWorld();
loop();