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
document.addEventListener('click', () => {
    if(document.getElementById('game-menu').style.display !== 'flex') controls.lock();
});

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- MATERIALI ---
const mats = {
    grass: new THREE.MeshLambertMaterial({ color: 0x3c8527 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x707070 }),
    sword: new THREE.MeshBasicMaterial({ color: 0x33cccc })
};

// --- SPADA ---
const sword = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), mats.sword);
sword.position.set(0.6, -0.6, -1);
sword.rotation.x = Math.PI / 4;
camera.add(sword);
scene.add(camera);

// --- MONDO ---
const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);

function createBlock(x, y, z, mat) {
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, y, z);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true}));
    b.add(e);
    scene.add(b);
    blocks.push(b);
}

// Generazione iniziale sicura
for(let x = -20; x < 20; x++) {
    for(let z = -20; z < 20; z++) {
        const h = Math.floor(Math.sin(x*0.1) * Math.cos(z*0.1) * 3 + 10);
        createBlock(x, h, z, mats.grass);
    }
}

// --- LOGICA GIOCATORE ---
camera.position.set(0, 15, 0); 
let velY = 0;
let keys = {};
let currentSlot = '1';
let canFall = false; 
let clock = new THREE.Clock();

setTimeout(() => { canFall = true; }, 500); // Impedisce caduta nel void all'avvio

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.key >= '1' && e.key <= '9') {
        currentSlot = e.key;
        if(window.selectSlot) window.selectSlot(e.key);
        sword.visible = (e.key === '1');
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// --- INTERAZIONE ---
window.addEventListener('mousedown', (e) => {
    if(!controls.isLocked) return;
    
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const inter = ray.intersectObjects(blocks);

    if(inter.length > 0) {
        if(e.button === 0) { // SINISTRO: ROMPI
            scene.remove(inter[0].object);
            blocks.splice(blocks.indexOf(inter[0].object), 1);
        } 
        else if(e.button === 2) { // DESTRO: PIAZZA
            const pos = inter[0].object.position.clone();
            const normal = inter[0].face.normal;
            
            let matToUse = mats.dirt; // Default
            if(currentSlot === '2') matToUse = mats.grass;
            if(currentSlot === '3') matToUse = mats.dirt;
            if(currentSlot === '4') matToUse = mats.stone;
            
            createBlock(pos.x + normal.x, pos.y + normal.y, pos.z + normal.z, matToUse);
        }
    }
});

window.addEventListener('contextmenu', e => e.preventDefault());

function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    if(controls.isLocked) {
        const s = 0.15;
        if(keys['KeyW']) controls.moveForward(s);
        if(keys['KeyS']) controls.moveForward(-s);
        if(keys['KeyA']) controls.moveRight(-s);
        if(keys['KeyD']) controls.moveRight(s);

        if(canFall) {
            velY -= 0.012;
            camera.position.y += velY;
            const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
            const ground = ray.intersectObjects(blocks);
            if(ground.length > 0) {
                velY = 0;
                camera.position.y = ground[0].point.y + 1.8;
                if(keys['Space']) velY = 0.22;
            }
        }

        if(sword.visible) {
            sword.position.y = -0.6 + Math.sin(t * 8) * 0.03;
        }
    }
    renderer.render(scene, camera);
}
loop();