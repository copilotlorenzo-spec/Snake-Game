import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// --- CONFIGURAZIONE GLOBALE ---
const BLOCK_SIZE = 1;
const WORLD_SIZE = 32; // Genera un'area di WORLD_SIZE x WORLD_SIZE
const CHUNK_HEIGHT = 16; // Profondità del mondo
const GRAVITY = 9.8 * 2; // Forza di gravità
const PLAYER_HEIGHT = 1.8; // Altezza del giocatore

// --- STATO DEL GIOCO ---
let health = 20; // Cuori pieni (20 = 10 cuori)
let inventory = { 'dirt': 0, 'stone': 0, 'wood': 0, 'plank': 0, 'crafting_table': 0, 'axe': 0 };
let currentBlockType = 'dirt'; // Tipo di blocco selezionato per piazzare

const world = new Map(); // Mappa dei blocchi nel mondo (x-y-z -> type)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixel effect
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// --- LUCI ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.position.set(WORLD_SIZE / 2, CHUNK_HEIGHT * 2, WORLD_SIZE / 2);
scene.add(sunLight);

// --- TEXTURE LOADER ---
const textureLoader = new THREE.TextureLoader();
const textures = {
    grass: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/grass.png'),
    dirt: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/dirt.png'),
    stone: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/stone.png'),
    wood: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/tree_side.png'),
    wood_top: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/tree_top.png'),
    plank: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/planks.png'),
    cobblestone: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/cobblestone.png'),
    crafting_table_top: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/crafting_table_top.png'),
    crafting_table_side: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/minecraft/crafting_table_side.png'),
};

// Configura i filtri per pixel art
Object.values(textures).forEach(tex => {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
});

// --- MATERIALI DEI BLOCCHI (con texture specifiche per lato) ---
const blockMaterials = {
    'grass': [
        new THREE.MeshLambertMaterial({ map: textures.grass }), // Right
        new THREE.MeshLambertMaterial({ map: textures.grass }), // Left
        new THREE.MeshLambertMaterial({ map: textures.grass }), // Top
        new THREE.MeshLambertMaterial({ map: textures.dirt }),  // Bottom
        new THREE.MeshLambertMaterial({ map: textures.grass }), // Front
        new THREE.MeshLambertMaterial({ map: textures.grass })  // Back
    ],
    'dirt': [new THREE.MeshLambertMaterial({ map: textures.dirt })],
    'stone': [new THREE.MeshLambertMaterial({ map: textures.stone })],
    'wood': [
        new THREE.MeshLambertMaterial({ map: textures.wood }),
        new THREE.MeshLambertMaterial({ map: textures.wood }),
        new THREE.MeshLambertMaterial({ map: textures.wood_top }),
        new THREE.MeshLambertMaterial({ map: textures.wood_top }),
        new THREE.MeshLambertMaterial({ map: textures.wood }),
        new THREE.MeshLambertMaterial({ map: textures.wood })
    ],
    'plank': [new THREE.MeshLambertMaterial({ map: textures.plank })],
    'cobblestone': [new THREE.MeshLambertMaterial({ map: textures.cobblestone })],
    'crafting_table': [
        new THREE.MeshLambertMaterial({ map: textures.crafting_table_side }),
        new THREE.MeshLambertMaterial({ map: textures.crafting_table_side }),
        new THREE.MeshLambertMaterial({ map: textures.crafting_table_top }),
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.crafting_table_side }),
        new THREE.MeshLambertMaterial({ map: textures.crafting_table_side })
    ],
    'air': [new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 })] // Per i buchi (caverne)
};

// --- FUNZIONI DI GESTIONE BLOCCHI ---
function addBlock(x, y, z, type) {
    const key = `${x}-${y}-${z}`;
    if (world.has(key)) return; // Evita di sovrascrivere
    
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const material = blockMaterials[type] || blockMaterials.dirt; // Default a dirt se non trovato
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
    mesh.userData = { type: type, x: x, y: y, z: z }; // Dati per la rottura

    scene.add(mesh);
    world.set(key, mesh);
}

function removeBlock(x, y, z) {
    const key = `${x}-${y}-${z}`;
    if (!world.has(key)) return null;

    const mesh = world.get(key);
    scene.remove(mesh);
    world.delete(key);
    return mesh.userData.type; // Restituisce il tipo di blocco rimosso
}

// --- GENERAZIONE MONDO PROCEDURALE ---
const terrainHeight = (x, z) => {
    // Funzione per generare altezze diverse (basica)
    const noise = Math.sin(x * 0.1) * 2 + Math.cos(z * 0.08) * 3;
    return Math.floor(noise + 4); // Alza il terreno base
};

function generateWorld() {
    for (let x = -WORLD_SIZE / 2; x < WORLD_SIZE / 2; x++) {
        for (let z = -WORLD_SIZE / 2; z < WORLD_SIZE / 2; z++) {
            const h = terrainHeight(x, z);
            for (let y = h; y >= h - CHUNK_HEIGHT; y--) {
                let blockType = 'stone';
                if (y === h) blockType = 'grass';
                else if (y > h - 4) blockType = 'dirt';

                addBlock(x, y, z, blockType);

                // Genera alberi in superficie occasionalmente
                if (blockType === 'grass' && Math.random() < 0.02 && y > 0) {
                    generateTree(x, y + 1, z);
                }

                // Genera caverne (molto semplice)
                if (y < h - 5 && Math.random() < 0.005) {
                    addCave(x, y, z);
                }
            }
        }
    }
}

function generateTree(x, y, z) {
    // Tronco
    for (let i = 0; i < 4; i++) {
        addBlock(x, y + i, z, 'wood');
    }
    // Foglie (semplificate)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            for (let dy = 3; dy <= 5; dy++) {
                if (Math.random() > 0.3) { // Rende le foglie irregolari
                    // addBlock(x + dx, y + dy, z + dz, 'leaves'); // Dovremmo aggiungere una texture leaves
                }
            }
        }
    }
}

function addCave(startX, startY, startZ, length = 10) {
    let currentX = startX;
    let currentY = startY;
    let currentZ = startZ;

    for (let i = 0; i < length; i++) {
        removeBlock(currentX, currentY, currentZ);
        removeBlock(currentX, currentY + 1, currentZ); // Per avere un po' più di spazio

        // Muovi la "caverna" in una direzione casuale
        currentX += Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        currentY += Math.floor(Math.random() * 3) - 1;
        currentZ += Math.floor(Math.random() * 3) - 1;
    }
}


// --- INVENTARIO E UI ---
const hotbarDiv = document.getElementById('hotbar');
const healthBarDiv = document.getElementById('health-bar');
const inventoryUIDiv = document.getElementById('inventory-ui');
const inventorySlotsDiv = document.getElementById('inventory-slots');

function updateHotbar() {
    hotbarDiv.innerHTML = '';
    const items = ['dirt', 'stone', 'wood', 'plank', 'crafting_table', 'axe']; // Esempio di oggetti nella hotbar
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.classList.add('hotbar-slot');
        if (i === 0) slot.classList.add('selected'); // Primo slot selezionato di default
        
        const itemType = items[i];
        if (itemType && inventory[itemType] > 0) {
             slot.innerText = inventory[itemType] > 0 ? inventory[itemType] : ''; // Mostra quantità
             // Qui potresti aggiungere un'immagine del blocco
        }
        hotbarDiv.appendChild(slot);
    }
}

function updateHealthBar() {
    healthBarDiv.innerHTML = '❤️'.repeat(Math.ceil(health / 2)) + '🖤'.repeat(10 - Math.ceil(health / 2));
}

function updateInventoryUI() {
    inventorySlotsDiv.innerHTML = '';
    const allItems = Object.keys(inventory); // Ottieni tutti gli oggetti nell'inventario
    const numSlots = 36; // 4 righe da 9 slot

    for (let i = 0; i < numSlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('inv-slot');
        const itemType = allItems[i];
        if (itemType && inventory[itemType] > 0) {
            slot.innerText = `${itemType.toUpperCase()}: ${inventory[itemType]}`;
            // Qui potresti aggiungere un'immagine per l'item
        }
        inventorySlotsDiv.appendChild(slot);
    }
}

// --- CRAFTING (Esempio: Asse di legno) ---
const recipes = {
    'plank': { input: { 'wood': 1 }, output: { 'plank': 4 } },
    'crafting_table': { input: { 'plank': 4 }, output: { 'crafting_table': 1 } },
    'axe': { input: { 'plank': 3, 'stick': 2 }, output: { 'axe': 1 } } // Richiede 'stick' non implementato
};

function craft(itemToCraft) {
    const recipe = recipes[itemToCraft];
    if (!recipe) { console.log("Ricetta non trovata!"); return; }

    let canCraft = true;
    for (const inputItem in recipe.input) {
        if (inventory[inputItem] < recipe.input[inputItem]) {
            canCraft = false;
            break;
        }
    }

    if (canCraft) {
        for (const inputItem in recipe.input) {
            inventory[inputItem] -= recipe.input[inputItem];
        }
        inventory[itemToCraft] = (inventory[itemToCraft] || 0) + recipe.output[itemToCraft];
        console.log(`Crafted ${itemToCraft}!`);
        updateHotbar();
        updateInventoryUI();
    } else {
        console.log("Non hai abbastanza materiali per craftare " + itemToCraft);
    }
}

// --- MOB (Zombie Semplice) ---
const mobGeometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.6, BLOCK_SIZE * 1.8, BLOCK_SIZE * 0.6);
const mobMaterial = new THREE.MeshLambertMaterial({ color: 0x008000 }); // Verde zombie
const zombie = new THREE.Mesh(mobGeometry, mobMaterial);
zombie.position.set(WORLD_SIZE / 4, PLAYER_HEIGHT, WORLD_SIZE / 4);
scene.add(zombie);

// --- CONTROLLI MOVIMENTO ---
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canPlayerJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

document.addEventListener('keydown', (event) => {
    if (!controls.isLocked) return;
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': if (canPlayerJump) velocity.y += 10; canPlayerJump = false; break;
        case 'KeyE': // Open/close inventory
            if (inventoryUIDiv.style.display === 'block') {
                inventoryUIDiv.style.display = 'none';
                controls.lock(); // Rilock controls
            } else {
                inventoryUIDiv.style.display = 'block';
                controls.unlock(); // Unlock controls
                updateInventoryUI();
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (!controls.isLocked) return;
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
});

// --- INTERAZIONE BLOCCHI (Rompere/Piazzare) ---
const raycaster = new THREE.Raycaster();
document.addEventListener('mousedown', (event) => {
    if (!controls.isLocked || inventoryUIDiv.style.display === 'block') return; // Non interagire se inventario aperto

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Centro dello schermo
    const intersects = raycaster.intersectObjects(Array.from(world.values()));

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const block = intersect.object.userData;

        if (event.button === 0) { // Click sinistro: Rompi blocco
            const typeRemoved = removeBlock(block.x, block.y, block.z);
            if (typeRemoved && inventory[typeRemoved] !== undefined) {
                inventory[typeRemoved]++;
                updateHotbar();
            } else if (typeRemoved) {
                // Se è un tipo che non è nell'inventario di base, aggiungilo
                inventory[typeRemoved] = (inventory[typeRemoved] || 0) + 1;
                updateHotbar();
            }
        } else if (event.button === 2) { // Click destro: Piazza blocco
            if (inventory[currentBlockType] > 0) {
                const newBlockPos = new THREE.Vector3().copy(intersect.object.position).add(intersect.face.normal);
                addBlock(newBlockPos.x / BLOCK_SIZE, newBlockPos.y / BLOCK_SIZE, newBlockPos.z / BLOCK_SIZE, currentBlockType);
                inventory[currentBlockType]--;
                updateHotbar();
            }
        }
    }
});


// --- CICLO DI ANIMAZIONE ---
let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= GRAVITY * delta; // Applica gravità

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Questo assicura che il movimento diagonale non sia più veloce

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += (velocity.y * delta);

        if (camera.position.y < PLAYER_HEIGHT) { // Il giocatore tocca il suolo
            velocity.y = 0;
            camera.position.y = PLAYER_HEIGHT;
            canPlayerJump = true;
        }

        // Zombie segue il giocatore
        const zombieSpeed = 0.5;
        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 2) { // Lo zombie si muove solo se abbastanza lontano
            zombie.position.x += (dx / distance) * zombieSpeed * delta;
            zombie.position.z += (dz / distance) * zombieSpeed * delta;
        }

        // Danno dal mob
        if (distance < BLOCK_SIZE) { // Se lo zombie è abbastanza vicino
            health -= 0.1; // Perde vita lentamente
            if (health <= 0) {
                alert("GAME OVER! Sei stato ucciso dallo zombie!");
                location.reload();
            }
            updateHealthBar();
        }
        prevTime = time;
    }

    renderer.render(scene, camera);
}

// --- AVVIO GIOCO ---
generateWorld();
camera.position.set(0, PLAYER_HEIGHT, 5); // Posizione iniziale
updateHotbar();
updateHealthBar();
animate();