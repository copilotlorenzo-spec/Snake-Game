import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE LOGICA ---
let health = 10;
const maxHealth = 10;
let isSurvival = true; // Di default impostiamo survival

// --- CONFIGURAZIONE GRAFICA ---
let scene, camera, renderer, controls;
const objects = [];

function init() {
    // 1. Creazione Scena e Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azzurro
    scene.fog = new THREE.Fog(0x87ceeb, 0, 500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Altezza occhi giocatore

    // 2. Luci
    const light = new THREE.HemisphereLight(0xeeeeee, 0x888888, 0.75);
    scene.add(light);

    // 3. Controlli Mouse (Pointer Lock)
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Clicca per attivare il controllo mouse
    document.addEventListener('click', () => {
        controls.lock();
    });

    // 4. Terreno (Prato verde)
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x3c8527 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 5. Creazione Interfaccia Cuori (Survival)
    createSurvivalUI();

    // 6. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    
    animate();
}

function createSurvivalUI() {
    const uiContainer = document.createElement('div');
    uiContainer.id = 'survival-ui';
    uiContainer.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); display:flex; gap:5px; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; z-index:100;';
    document.body.appendChild(uiContainer);
    updateHearts();
}

function updateHearts() {
    const container = document.getElementById('survival-ui');
    if(!container) return;
    container.innerHTML = ''; 
    for (let i = 0; i < maxHealth; i++) {
        const heart = document.createElement('span');
        heart.innerHTML = i < health ? '❤️' : '🖤';
        heart.style.fontSize = '24px';
        container.appendChild(heart);
    }
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

// Avvia tutto
init();