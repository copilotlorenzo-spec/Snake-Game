import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x72a0e5); // Cielo Java
scene.fog = new THREE.Fog(0x72a0e5, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// ILLUMINAZIONE REALE (Per togliere il nero piatto)
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

// MATERIALI CON BORDI (Effetto Minecraft)
const loader = new THREE.TextureLoader();
const blockGeo = new THREE.BoxGeometry(1, 1, 1);

function creaBlocco(x, y, z, colore) {
    const mat = new THREE.MeshLambertMaterial({ color: colore });
    const mesh = new THREE.Mesh(blockGeo, mat);
    mesh.position.set(x, y, z);
    
    // Aggiunge i bordi neri tipici di Minecraft
    const edges = new THREE.EdgesGeometry(blockGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
    mesh.add(line);
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// GENERAZIONE MONDO CON STRATI E CAVERNE
const blocchi = [];
for(let x = -12; x < 12; x++) {
    for(let z = -12; z < 12; z++) {
        // Strato 0: ERBA
        blocchi.push(creaBlocco(x, 0, z, 0x3c8527));
        
        // Strato -1 e -2: TERRA
        blocchi.push(creaBlocco(x, -1, z, 0x8b4513));
        blocchi.push(creaBlocco(x, -2, z, 0x8b4513));
        
        // Strato profondo: PIETRA E CAVERNE
        for(let y = -3; y > -8; y--) {
            if(Math.random() > 0.1) { // 10% di probabilità di trovare una caverna (buco)
                let color = 0x707070; // Pietra
                if(Math.random() < 0.05) color = 0xffd700; // Minerale Oro
                blocchi.push(creaBlocco(x, y, z, color));
            }
        }
    }
}

// MOVIMENTO WASD + SALTO
let vel = new THREE.Vector3();
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// ROMPERE I BLOCCHI
window.addEventListener('mousedown', (e) => {
    if(e.button === 0 && controls.isLocked) {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), camera);
        const inter = ray.intersectObjects(blocchi);
        if(inter.length > 0) {
            scene.remove(inter[0].object);
            blocchi.splice(blocchi.indexOf(inter[0].object), 1);
        }
    }
});

camera.position.set(0, 2, 5);
let canJump = true;

function animate() {
    requestAnimationFrame(animate);
    if(controls.isLocked) {
        const speed = 0.15;
        if(keys['KeyW']) controls.moveForward(speed);
        if(keys['KeyS']) controls.moveForward(-speed);
        if(keys['KeyA']) controls.moveRight(-speed);
        if(keys['KeyD']) controls.moveRight(speed);
        
        // Gravità e Salto basici
        camera.position.y += vel.y;
        if(camera.position.y > 2) {
            vel.y -= 0.01;
            canJump = false;
        } else {
            camera.position.y = 2;
            vel.y = 0;
            canJump = true;
        }
        if(keys['Space'] && canJump) vel.y = 0.2;
    }
    renderer.render(scene, camera);
}
animate();