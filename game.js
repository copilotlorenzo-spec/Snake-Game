import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
scene.fog = new THREE.Fog(0x72a0e5, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => { if(document.getElementById('game-menu').style.display !== 'flex') controls.lock(); });

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// --- SPADA DI DIAMANTE (MANO) ---
const swordGroup = new THREE.Group();
const swordGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
const swordMat = new THREE.MeshBasicMaterial({ color: 0x33cccc });
const sword = new THREE.Mesh(swordGeo, swordMat);
sword.position.set(0.5, -0.5, -1); // Posizione in basso a destra
sword.rotation.x = Math.PI / 4;
camera.add(sword);
scene.add(camera);

// --- MONDO ---
const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);
const grassMat = new THREE.MeshLambertMaterial({ color: 0x3c8527 });

for(let x = -15; x < 15; x++) {
    for(let z = -15; z < 15; z++) {
        const h = Math.floor(Math.sin(x*0.2) * 2); // Piccole colline
        const b = new THREE.Mesh(geo, grassMat);
        b.position.set(x, h, z);
        
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.1, transparent: true}));
        b.add(e);
        
        scene.add(b);
        blocks.push(b);
    }
}

// Movimento e Animazione Spada
let velY = 0;
let keys = {};
let clock = new THREE.Clock();
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    if(controls.isLocked) {
        const speed = 0.12;
        if(keys['KeyW']) controls.moveForward(speed);
        if(keys['KeyS']) controls.moveForward(-speed);
        if(keys['KeyA']) controls.moveRight(-speed);
        if(keys['KeyD']) controls.moveRight(speed);

        // Effetto "Bobbing" della spada (oscilla mentre cammini)
        if(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
            sword.position.y = -0.5 + Math.sin(t * 10) * 0.05;
            sword.position.x = 0.5 + Math.cos(t * 5) * 0.02;
        }

        // Gravità
        velY -= 0.01;
        camera.position.y += velY;
        const ray = new THREE.Raycaster(camera.position, new THREE.Vector3(0,-1,0), 0, 1.8);
        const check = ray.intersectObjects(blocks);
        if(check.length > 0) {
            velY = 0;
            camera.position.y = check[0].point.y + 1.8;
            if(keys['Space']) velY = 0.15;
        }
    }
    renderer.render(scene, camera);
}
loop();