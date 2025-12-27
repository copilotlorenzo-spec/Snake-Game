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
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

// FISICA E MOVIMENTO
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = (e) => {
    switch(e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': if(canJump) velocity.y += 5; canJump = false; break;
    }
};
const onKeyUp = (e) => {
    switch(e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
};
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// GENERAZIONE MONDO A STRATI
const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);
const matErba = new THREE.MeshStandardMaterial({ color: 0x3c8527 });
const matTerra = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const matPietra = new THREE.MeshStandardMaterial({ color: 0x808080 });

for (let x = -8; x < 8; x++) {
    for (let z = -8; z < 8; z++) {
        for (let y = 0; y > -5; y--) {
            let mat = matPietra;
            if(y === 0) mat = matErba;
            else if(y > -3) mat = matTerra;
            
            const block = new THREE.Mesh(geo, mat);
            block.position.set(x, y, z);
            scene.add(block);
            blocks.push(block);
        }
    }
}

// ROMPERE I BLOCCHI
const raycaster = new THREE.Raycaster();
window.addEventListener('mousedown', (e) => {
    if(e.button === 0 && controls.isLocked) {
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(blocks);
        if(intersects.length > 0) {
            const obj = intersects[0].object;
            scene.remove(obj);
            blocks.splice(blocks.indexOf(obj), 1);
        }
    }
});

camera.position.set(0, 2, 5);

function animate() {
    requestAnimationFrame(animate);
    if(controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 2.0 * delta; // Gravità

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += (velocity.y * delta);

        if (camera.position.y < 2) {
            velocity.y = 0;
            camera.position.y = 2;
            canJump = true;
        }
        prevTime = time;
    }
    renderer.render(scene, camera);
}
let prevTime = performance.now();
animate();