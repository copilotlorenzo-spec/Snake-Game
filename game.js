import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// LUCI
const light = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(light);

// FISICA E MOVIMENTO (WASD + SALTO)
let moveF = false, moveB = false, moveL = false, moveR = false, canJump = false;
const vel = new THREE.Vector3();
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveF = true;
    if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true;
    if(e.code === 'KeyD') moveR = true;
    if(e.code === 'Space' && canJump) { vel.y += 5; canJump = false; }
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveF = false;
    if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false;
    if(e.code === 'KeyD') moveR = false;
});

// GENERAZIONE MONDO A STRATI (Erba, Terra, Pietra, Minerali)
const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);
const mats = {
    erba: new THREE.MeshLambertMaterial({ color: 0x3c8527 }),
    terra: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    pietra: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    oro: new THREE.MeshLambertMaterial({ color: 0xffd700 })
};

for (let x = -10; x < 10; x++) {
    for (let z = -10; z < 10; z++) {
        for (let y = 0; y > -8; y--) {
            let type = mats.pietra;
            if (y === 0) type = mats.erba;
            else if (y > -3) type = mats.terra;
            else if (Math.random() < 0.05) type = mats.oro; // Minerali rari

            const block = new THREE.Mesh(geo, type);
            block.position.set(x, y, z);
            scene.add(block);
            blocks.push(block);
        }
    }
}

// ROMPERE I BLOCCHI (Tasto sinistro)
const ray = new THREE.Raycaster();
window.addEventListener('mousedown', (e) => {
    if(e.button === 0 && controls.isLocked) {
        ray.setFromCamera(new THREE.Vector2(0,0), camera);
        const inter = ray.intersectObjects(blocks);
        if(inter.length > 0) {
            scene.remove(inter[0].object);
            blocks.splice(blocks.indexOf(inter[0].object), 1);
        }
    }
});

camera.position.set(0, 2, 5);
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    if(controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        
        vel.x -= vel.x * 10.0 * delta;
        vel.z -= vel.z * 10.0 * delta;
        vel.y -= 9.8 * 2.0 * delta; // Gravità

        if (moveF) vel.z -= 100.0 * delta;
        if (moveB) vel.z += 100.0 * delta;
        if (moveL) vel.x -= 100.0 * delta;
        if (moveR) vel.x += 100.0 * delta;

        controls.moveRight(-vel.x * delta);
        controls.moveForward(-vel.z * delta);
        camera.position.y += vel.y * delta;

        if (camera.position.y < 2) { camera.position.y = 2; vel.y = 0; canJump = true; }
        prevTime = time;
    }
    renderer.render(scene, camera);
}
animate();