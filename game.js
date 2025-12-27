// Importiamo la libreria Three.js per il 3D
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let objects = [];
let raycaster;

const moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Inizializzazione del mondo di Lollocraft
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azzurro
    scene.fog = new THREE.Fog(0x87ceeb, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Altezza degli occhi del giocatore

    const light = new THREE.HemisphereLight(0xeeeeee, 0x888888, 0.75);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Creazione del terreno (blocchi d'erba)
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x3c8527 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
animate();