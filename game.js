import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

scene.add(new THREE.AmbientLight(0xffffff, 1));

const blocks = [];
const geo = new THREE.BoxGeometry(1, 1, 1);
const matGrass = new THREE.MeshBasicMaterial({ color: 0x3c8527 });

async function init() {
    let count = 0;
    const size = 10; // Mondo iniziale 10x10
    for(let x = -size; x < size; x++) {
        for(let z = -size; z < size; z++) {
            const b = new THREE.Mesh(geo, matGrass);
            b.position.set(x, 0, z);
            
            // Bordi per vedere i singoli blocchi
            const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2, transparent: true}));
            b.add(e);
            
            scene.add(b);
            blocks.push(b);
            
            count++;
            if(count % 20 === 0) {
                window.setLoad(Math.floor((count/(size*size*4))*100));
                await new Promise(r => setTimeout(r, 1));
            }
        }
    }
    camera.position.set(0, 2, 5);
    window.setLoad(100);
}

// Scavo e Gravità
let velY = 0;
let keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

window.addEventListener('mousedown', () => {
    if(!controls.isLocked) return;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const inter = ray.intersectObjects(blocks);
    if(inter.length > 0) {
        scene.remove(inter[0].object);
        blocks.splice(blocks.indexOf(inter[0].object), 1);
    }
});

function loop() {
    requestAnimationFrame(loop);
    if(controls.isLocked) {
        if(keys['KeyW']) controls.moveForward(0.1);
        if(keys['KeyS']) controls.moveForward(-0.1);
        if(keys['KeyA']) controls.moveRight(-0.1);
        if(keys['KeyD']) controls.moveRight(0.1);
        
        velY -= 0.01; // Gravità
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

init();
loop();