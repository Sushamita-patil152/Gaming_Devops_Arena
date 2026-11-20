


// ======================================
// RETRO RACER 3D - MIDNIGHT NEON
// All objects are generated using 3D shapes
// ======================================

const container = document.getElementById("game-container");

const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const speedEl = document.getElementById("speed");

const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05091c);
scene.fog = new THREE.Fog(0x080b25, 65, 190);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    400
);

camera.position.set(0, 9, 17);
camera.lookAt(0, 2, -22);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

container.appendChild(renderer.domElement);

function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener("resize", resize);
resize();

// ======================================
// LIGHTING
// ======================================

scene.add(new THREE.HemisphereLight(0x8dbaff, 0x100520, 2.5));

const mainLight = new THREE.DirectionalLight(0xffffff, 2);
mainLight.position.set(-10, 25, 15);
mainLight.castShadow = true;
scene.add(mainLight);

const purpleLight = new THREE.PointLight(0xc000ff, 100, 80);
purpleLight.position.set(-9, 8, -20);
scene.add(purpleLight);

const blueLight = new THREE.PointLight(0x0088ff, 100, 80);
blueLight.position.set(9, 8, -30);
scene.add(blueLight);

// ======================================
// MATERIALS
// ======================================

const roadMat = new THREE.MeshStandardMaterial({
    color: 0x101323,
    roughness: 0.3,
    metalness: 0.5
});

const purpleMat = new THREE.MeshStandardMaterial({
    color: 0x8b00ff,
    emissive: 0x8b00ff,
    emissiveIntensity: 2
});

const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2
});

const whiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff
});

// ======================================
// GROUND
// ======================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 450),
    new THREE.MeshStandardMaterial({
        color: 0x080d21,
        roughness: 0.9
    })
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.15, -120);
scene.add(ground);

// ======================================
// ROAD
// ======================================

const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 450),
    roadMat
);

road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -120);
road.receiveShadow = true;
scene.add(road);

// Road edges
function createBox(w, h, d, material, x, y, z, parent = scene) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
}

createBox(0.12, 0.12, 450, purpleMat, -6, 0.08, -120);
createBox(0.12, 0.12, 450, blueMat, 6, 0.08, -120);

// Lane markings
const laneDashes = [];

for (const x of [-2, 2]) {
    for (let i = 0; i < 45; i++) {
        const dash = createBox(
            0.08, 0.035, 3,
            whiteMat,
            x, 0.035, -i * 8
        );

        laneDashes.push(dash);
    }
}

// ======================================
// GUARD RAILS
// ======================================

for (const side of [-1, 1]) {
    createBox(
        0.35, 0.5, 450,
        new THREE.MeshStandardMaterial({
            color: 0x25294d,
            metalness: 0.8
        }),
        side * 7, 0.25, -120
    );

    createBox(
        0.12, 0.12, 450,
        side === -1 ? purpleMat : blueMat,
        side * 7, 0.55, -120
    );
}

// ======================================
// MOON
// ======================================

const moon = new THREE.Mesh(
    new THREE.SphereGeometry(5, 32, 32),
    new THREE.MeshBasicMaterial({
        color: 0xc9dcff
    })
);

moon.position.set(20, 23, -85);
scene.add(moon);

// Moon glow
const moonGlow = new THREE.PointLight(0x8abaff, 80, 90);
moonGlow.position.copy(moon.position);
scene.add(moonGlow);

// ======================================
// STARS
// ======================================

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];

for (let i = 0; i < 900; i++) {
    starPositions.push(
        (Math.random() - 0.5) * 220,
        8 + Math.random() * 65,
        -Math.random() * 200
    );
}

starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.22
    })
);

scene.add(stars);

// ======================================
// CITY BUILDINGS
// ======================================

const buildings = [];

function createBuilding(x, z) {
    const height = 7 + Math.random() * 22;
    const width = 3 + Math.random() * 3;
    const depth = 4 + Math.random() * 3;

    const group = new THREE.Group();

    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x111a3b,
        metalness: 0.7,
        roughness: 0.4
    });

    const building = createBox(
        width,
        height,
        depth,
        buildingMaterial,
        0,
        height / 2,
        0,
        group
    );

    // Rooftop neon
    createBox(
        width + 0.15,
        0.12,
        depth + 0.15,
        Math.random() > 0.5 ? purpleMat : blueMat,
        0,
        height,
        0,
        group
    );

    // Windows facing the road
    for (let y = 1.5; y < height - 1; y += 2.2) {
        for (let wx = -width / 2 + 0.7; wx < width / 2; wx += 1) {
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x9b55ff : 0x00baff
            });

            createBox(
                0.4,
                0.65,
                0.04,
                windowMaterial,
                wx,
                y,
                depth / 2 + 0.03,
                group
            );
        }
    }

    group.position.set(x, 0, z);
    scene.add(group);

    buildings.push(group);
}

for (let i = 0; i < 38; i++) {
    const z = -i * 11 - 15;

    createBuilding(-12 - Math.random() * 5, z);
    createBuilding(12 + Math.random() * 5, z - 5);
}

// ======================================
// NEON ARROWS
// ======================================

for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
        const arrow = new THREE.Group();

        const arrowMaterial = side === -1 ? purpleMat : blueMat;

        createBox(0.25, 0.25, 0.25, arrowMaterial, 0, 0, 0, arrow);

        const wing1 = createBox(
            0.25, 0.25, 0.25,
            arrowMaterial, -0.25, 0, 0, arrow
        );

        wing1.rotation.z = Math.PI / 4;

        const wing2 = createBox(
            0.25, 0.25, 0.25,
            arrowMaterial, 0.25, 0, 0, arrow
        );

        wing2.rotation.z = -Math.PI / 4;

        arrow.position.set(side * 7.8, 2, -i * 25 - 10);
        scene.add(arrow);
    }
}

// ======================================
// STREETLIGHTS
// ======================================

const streetlights = [];

function createStreetlight(x, z) {
    const group = new THREE.Group();

    createBox(
        0.12, 5, 0.12,
        new THREE.MeshStandardMaterial({ color: 0x41486b }),
        0, 2.5, 0, group
    );

    createBox(
        1.3, 0.12, 0.12,
        new THREE.MeshStandardMaterial({ color: 0x41486b }),
        -Math.sign(x) * 0.55, 4.8, 0, group
    );

    createBox(
        0.65, 0.15, 0.4,
        purpleMat,
        -Math.sign(x) * 1.05, 4.7, 0, group
    );

    group.position.set(x, 0, z);
    scene.add(group);

    streetlights.push(group);
}

for (let i = 0; i < 18; i++) {
    createStreetlight(-7.8, -i * 22 - 10);
    createStreetlight(7.8, -i * 22 - 20);
}

// ======================================
// TREES
// ======================================

const trees = [];

function createTree(x, z) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.2, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x57382c })
    );

    trunk.position.y = 0.75;
    group.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2.7, 8),
        new THREE.MeshStandardMaterial({
            color: 0x103d37,
            emissive: 0x05251e
        })
    );

    leaves.position.y = 2.6;
    group.add(leaves);

    group.position.set(x, 0, z);
    scene.add(group);
    trees.push(group);
}

for (let i = 0; i < 20; i++) {
    createTree(-8.2, -i * 17);
    createTree(8.2, -i * 17 - 8);
}

// ======================================
// CAR CREATION
// ======================================

function createCar(color) {
    const car = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.22
    });

    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x101a39,
        metalness: 0.8,
        roughness: 0.1
    });

    // Main body
    createBox(1.8, 0.55, 3.3, bodyMat, 0, 0.65, 0, car);

    // Front hood
    createBox(1.7, 0.2, 1, bodyMat, 0, 0.95, -1.05, car);

    // Cabin
    createBox(1.3, 0.65, 1.5, glassMat, 0, 1.15, 0.25, car);

    // Roof
    createBox(1.25, 0.1, 1.2, bodyMat, 0, 1.5, 0.25, car);

    // Front bumper
    createBox(1.7, 0.2, 0.15, bodyMat, 0, 0.4, -1.68, car);

    // Rear bumper
    createBox(1.7, 0.2, 0.15, bodyMat, 0, 0.4, 1.68, car);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.9
    });

    for (const x of [-0.92, 0.92]) {
        for (const z of [-1, 1]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.34, 0.34, 0.2, 20),
                wheelMat
            );

            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.38, z);
            car.add(wheel);
        }
    }

    // Headlights
    for (const x of [-0.55, 0.55]) {
        createBox(
            0.35, 0.15, 0.08,
            whiteMat, x, 0.78, -1.7, car
        );
    }

    // Rear lights
    for (const x of [-0.55, 0.55]) {
        createBox(
            0.4, 0.16, 0.08,
            new THREE.MeshBasicMaterial({ color: 0xff003c }),
            x, 0.8, 1.7, car
        );
    }

    // Rear spoiler
    createBox(2, 0.12, 0.3, bodyMat, 0, 1.15, 1.4, car);

    // Neon underglow
    const glow = new THREE.PointLight(color, 12, 5);
    glow.position.set(0, 0.3, 0);
    car.add(glow);

    car.traverse(object => {
        if (object.isMesh) object.castShadow = true;
    });

    return car;
}

// ======================================
// PLAYER CAR
// ======================================

const lanes = [-4, 0, 4];

let playerLane = 1;

const player = createCar(0xff003c);
player.position.set(0, 0, 5);

scene.add(player);

// ======================================
// TRAFFIC CARS
// ======================================

const trafficCars = [];

const trafficColors = [
    0x1677ff,
    0xffaa00,
    0x00dd99,
    0xffffff,
    0xa855f7
];

function spawnTraffic(z) {
    const lane = Math.floor(Math.random() * 3);

    const color = trafficColors[
        Math.floor(Math.random() * trafficColors.length)
    ];

    const car = createCar(color);

    car.scale.setScalar(0.85);
    car.position.set(lanes[lane], 0, z);

    scene.add(car);

    trafficCars.push({ mesh: car });
}

for (let i = 0; i < 6; i++) {
    spawnTraffic(-45 - i * 32);
}

// ======================================
// GOLD COINS
// ======================================

const coins = [];

function spawnCoin(z) {
    const lane = Math.floor(Math.random() * 3);

    const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.14, 12, 24),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.15,
            emissive: 0x995500,
            emissiveIntensity: 0.8
        })
    );

    coin.position.set(lanes[lane], 1.4, z);
    scene.add(coin);

    coins.push(coin);
}

for (let i = 0; i < 15; i++) {
    spawnCoin(-30 - i * 22);
}

// ======================================
// GAME VARIABLES
// ======================================

let score = 0;
let coinCount = 0;
let speed = 10;

let paused = false;
let gameOver = false;

let spawnTimer = 0;
let coinTimer = 0;
let lastTime = 0;

function updateHUD() {
    scoreEl.textContent = "SCORE: " + score;
    coinsEl.textContent = "COINS: " + coinCount;
    speedEl.textContent = "SPEED: " + speed.toFixed(1);
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.add("show");
}

function hideMessage() {
    message.classList.remove("show");
}

// ======================================
// PLAYER CONTROLS
// ======================================

function changeLane(direction) {
    if (paused || gameOver) return;

    playerLane = Math.max(
        0,
        Math.min(2, playerLane + direction)
    );
}

window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        changeLane(-1);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        changeLane(1);
    }

    if (event.code === "Space" && !gameOver) {
        paused ? resumeGame() : pauseGame();
    }
});

// ======================================
// COLLISION
// ======================================

function collision(a, b) {
    return (
        Math.abs(a.position.x - b.position.x) < 1.5 &&
        Math.abs(a.position.z - b.position.z) < 2.2
    );
}

function endGame() {
    gameOver = true;
    paused = true;

    showMessage(
        "GAME OVER",
        "Score: " + score + " | Press Restart to play again"
    );
}

// ======================================
// PAUSE / RESUME / RESTART
// ======================================

function pauseGame() {
    if (gameOver) return;

    paused = true;
    showMessage("PAUSED", "Press Resume to continue");
}

function resumeGame() {
    if (gameOver) return;

    paused = false;
    hideMessage();
}

function resetGame() {
    trafficCars.forEach(car => scene.remove(car.mesh));
    coins.forEach(coin => scene.remove(coin));

    trafficCars.length = 0;
    coins.length = 0;

    score = 0;
    coinCount = 0;
    speed = 10;

    playerLane = 1;
    player.position.set(0, 0, 5);

    spawnTimer = 0;
    coinTimer = 0;

    paused = false;
    gameOver = false;

    for (let i = 0; i < 6; i++) {
        spawnTraffic(-45 - i * 32);
    }

    for (let i = 0; i < 15; i++) {
        spawnCoin(-30 - i * 22);
    }

    hideMessage();
    updateHUD();
}

document.getElementById("pause-btn").onclick = pauseGame;
document.getElementById("resume-btn").onclick = resumeGame;
document.getElementById("restart-btn").onclick = resetGame;

// ======================================
// MAIN GAME ANIMATION
// ======================================

function animate(time = 0) {
    requestAnimationFrame(animate);

    const delta = Math.min(
        (time - lastTime) / 1000 || 0.016,
        0.05
    );

    lastTime = time;

    if (!paused && !gameOver) {

        // Player movement
        const targetX = lanes[playerLane];

        player.position.x +=
            (targetX - player.position.x) * 10 * delta;

        player.rotation.z =
            (targetX - player.position.x) * 0.04;

        // Score and speed
        score += Math.floor(delta * 10);
        speed = Math.min(25, 10 + score / 100);

        const movement = speed * delta * 3;

        // Road markings
        laneDashes.forEach(dash => {
            dash.position.z += movement;

            if (dash.position.z > 12) {
                dash.position.z -= 360;
            }
        });

        // City movement
        buildings.forEach(building => {
            building.position.z += movement;

            if (building.position.z > 25) {
                building.position.z -= 420;
            }
        });

        streetlights.forEach(light => {
            light.position.z += movement;

            if (light.position.z > 25) {
                light.position.z -= 396;
            }
        });

        trees.forEach(tree => {
            tree.position.z += movement;

            if (tree.position.z > 20) {
                tree.position.z -= 340;
            }
        });

        // Traffic
        spawnTimer += delta;

        if (spawnTimer > 2.5) {
            spawnTraffic(-190);
            spawnTimer = 0;
        }

        for (let i = trafficCars.length - 1; i >= 0; i--) {
            const car = trafficCars[i];

            car.mesh.position.z += movement;

            if (collision(player, car.mesh)) {
                endGame();
                break;
            }

            if (car.mesh.position.z > 15) {
                scene.remove(car.mesh);
                trafficCars.splice(i, 1);
            }
        }

        // Coins
        coinTimer += delta;

        if (coinTimer > 1.8) {
            spawnCoin(-180);
            coinTimer = 0;
        }

        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];

            coin.position.z += movement;
            coin.rotation.y += delta * 3;

            if (
                Math.abs(player.position.x - coin.position.x) < 1.4 &&
                Math.abs(player.position.z - coin.position.z) < 2
            ) {
                coinCount++;
                score += 10;

                scene.remove(coin);
                coins.splice(i, 1);
                continue;
            }

            if (coin.position.z > 15) {
                scene.remove(coin);
                coins.splice(i, 1);
            }
        }

        updateHUD();
    }

    renderer.render(scene, camera);
}

// ======================================
// START GAME
// ======================================

updateHUD();
resize();
animate();
