
import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ================= GAME SETUP =================

const container = document.getElementById("game-container");
const scoreElement = document.getElementById("score");
const coinsElement = document.getElementById("coins");
const speedElement = document.getElementById("speed");
const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10152b);
scene.fog = new THREE.Fog(0x10152b, 65, 190);

const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    300
);

camera.position.set(0, 8, 15);
camera.lookAt(0, 1, -22);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

function resizeGame() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener("resize", resizeGame);
resizeGame();

// ================= LIGHTING =================

scene.add(
    new THREE.HemisphereLight(0xc6d8ff, 0x17152d, 2)
);

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(-15, 30, 15);
sunlight.castShadow = true;
scene.add(sunlight);

// Neon lights
const purpleLight = new THREE.PointLight(0x9b4dff, 35, 45);
purpleLight.position.set(-8, 5, -15);
scene.add(purpleLight);

const blueLight = new THREE.PointLight(0x168bff, 30, 45);
blueLight.position.set(8, 5, -30);
scene.add(blueLight);

// ================= MATERIALS =================

const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x101322,
    roughness: 0.9
});

const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x171923,
    roughness: 0.8
});

const laneMaterial = new THREE.MeshBasicMaterial({
    color: 0x8c68ff
});

const purpleMaterial = new THREE.MeshStandardMaterial({
    color: 0x6c2bd9,
    emissive: 0x3c087c,
    emissiveIntensity: 1.2
});

const blueMaterial = new THREE.MeshStandardMaterial({
    color: 0x087cff,
    emissive: 0x063caa,
    emissiveIntensity: 1.1
});

// ================= GROUND AND ROAD =================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 400),
    groundMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.12, -100);
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 400),
    roadMaterial
);

road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -100);
road.receiveShadow = true;
scene.add(road);

// Neon road edges
function createRoadEdge(x, material) {
    const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 400),
        material
    );

    edge.position.set(x, 0.05, -100);
    scene.add(edge);
}

createRoadEdge(-6, purpleMaterial);
createRoadEdge(6, blueMaterial);

// Lane markings
const laneDashes = [];

for (let laneX of [-2, 2]) {
    for (let i = 0; i < 35; i++) {
        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.025, 2.4),
            laneMaterial
        );

        dash.position.set(laneX, 0.025, -i * 8);
        scene.add(dash);
        laneDashes.push(dash);
    }
}

// ================= CITY BUILDINGS =================

const buildings = [];

function createBuilding(x, z) {
    const height = 5 + Math.random() * 19;
    const width = 3 + Math.random() * 4;
    const depth = 4 + Math.random() * 6;

    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
            0.62 + Math.random() * 0.08,
            0.35,
            0.12 + Math.random() * 0.08
        ),
        metalness: 0.45,
        roughness: 0.65
    });

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterial
    );

    building.position.set(x, height / 2 - 0.1, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    buildings.push({
        mesh: building,
        height: height,
        width: width,
        depth: depth,
        side: x < 0 ? -1 : 1
    });

    // Neon rooftop trim
    const trim = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.1, 0.07, depth + 0.1),
        Math.random() > 0.5 ? purpleMaterial : blueMaterial
    );

    trim.position.set(x, height, z);
    scene.add(trim);

    // Glowing windows on the front-facing side
    const windowMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x9d7bff : 0x38aaff
    });

    for (let y = 1.5; y < height - 1; y += 2.5) {
        for (let wx = -width / 2 + 0.6; wx < width / 2; wx += 1.1) {
            const windowMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.42, 0.65, 0.035),
                windowMaterial
            );

            windowMesh.position.set(
                x + wx,
                y,
                z + depth / 2 + 0.025
            );

            scene.add(windowMesh);
        }
    }
}

for (let i = 0; i < 32; i++) {
    const z = -i * 12 - 10;

    createBuilding(-11 - Math.random() * 5, z);
    createBuilding(11 + Math.random() * 5, z - 5);
}

// ================= TREES =================

const trees = [];

function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x45302b })
    );

    trunk.position.set(x, 0.8, z);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2.5, 8),
        new THREE.MeshStandardMaterial({
            color: 0x123c37,
            emissive: 0x031d21
        })
    );

    leaves.position.set(x, 2.5, z);
    scene.add(leaves);

    trees.push({ trunk, leaves });
}

for (let i = 0; i < 24; i++) {
    const z = -i * 15 - 5;
    createTree(-7.8, z);
    createTree(7.8, z - 7);
}

// ================= STREETLIGHTS =================

const streetlights = [];

function createStreetlight(x, z) {
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.09, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x30374f })
    );

    pole.position.set(x, 2.5, z);
    scene.add(pole);

    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x424966 })
    );

    arm.position.set(x - Math.sign(x) * 0.5, 4.8, z);
    scene.add(arm);

    const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.12, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x9c7bff })
    );

    bulb.position.set(x - Math.sign(x) * 0.9, 4.7, z);
    scene.add(bulb);

    streetlights.push({ pole, arm, bulb });
}

for (let i = 0; i < 18; i++) {
    const z = -i * 20 - 10;
    createStreetlight(-7, z);
    createStreetlight(7, z - 10);
}

// ================= CAR CREATION =================

function createCar(color, isPlayer = false) {
    const car = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.72,
        roughness: 0.28
    });

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.55, 3.1),
        bodyMaterial
    );

    body.position.y = 0.62;
    body.castShadow = true;
    car.add(body);

    const hood = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.22, 1.05),
        bodyMaterial
    );

    hood.position.set(0, 0.88, -0.85);
    car.add(hood);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.58, 1.35),
        new THREE.MeshStandardMaterial({
            color: 0x101a2c,
            metalness: 0.65,
            roughness: 0.2
        })
    );

    cabin.position.set(0, 1.12, 0.25);
    car.add(cabin);

    // Wheels
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x08080c,
        roughness: 0.8
    });

    for (const x of [-0.86, 0.86]) {
        for (const z of [-0.95, 0.95]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.31, 0.31, 0.18, 16),
                wheelMaterial
            );

            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.35, z);
            car.add(wheel);
        }
    }

    // Rear lights
    const rearLightMaterial = new THREE.MeshBasicMaterial({
        color: isPlayer ? 0xff1744 : 0xff3333
    });

    for (const x of [-0.52, 0.52]) {
        const light = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.13, 0.06),
            rearLightMaterial
        );

        light.position.set(x, 0.75, 1.57);
        car.add(light);
    }

    // Front lights
    for (const x of [-0.52, 0.52]) {
        const light = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.12, 0.06),
            new THREE.MeshBasicMaterial({ color: 0xc8eaff })
        );

        light.position.set(x, 0.75, -1.57);
        car.add(light);
    }

    return car;
}

// Three lanes
const lanePositions = [-4, 0, 4];

let playerLane = 1;
const player = createCar(0xe11d48, true);

player.position.set(lanePositions[playerLane], 0, 4);
scene.add(player);

// ================= TRAFFIC =================

const trafficCars = [];
const trafficColors = [
    0x1677ff,
    0xf59e0b,
    0x22c55e,
    0xe5e7eb,
    0x9333ea,
    0xf43f5e
];

function spawnTraffic(z) {
    const lane = Math.floor(Math.random() * 3);
    const color = trafficColors[
        Math.floor(Math.random() * trafficColors.length)
    ];

    const car = createCar(color);
    car.position.set(lanePositions[lane], 0, z);
    scene.add(car);

    trafficCars.push({ mesh: car, lane: lane });
}

for (let i = 0; i < 7; i++) {
    spawnTraffic(-35 - i * 27);
}

// ================= COINS =================

const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0x6b3900,
    emissiveIntensity: 0.5
});

const coins = [];

function spawnCoin(z) {
    const lane = Math.floor(Math.random() * 3);

    const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.13, 10, 20),
        coinMaterial
    );

    coin.position.set(lanePositions[lane], 1.15, z);
    scene.add(coin);

    coins.push({ mesh: coin, lane: lane });
}

for (let i = 0; i < 18; i++) {
    spawnCoin(-22 - i * 17);
}

// ================= GAME STATE =================

let score = 0;
let coinCount = 0;
let speed = 4;
let paused = false;
let gameOver = false;
let lastTime = 0;
let spawnTimer = 0;
let coinTimer = 0;

function updateHUD() {
    scoreElement.textContent = "SCORE: " + score;
    coinsElement.textContent = "COINS: " + coinCount;
    speedElement.textContent = "SPEED: " + speed.toFixed(1);
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.add("show");
}

function hideMessage() {
    message.classList.remove("show");
}

// ================= PLAYER CONTROLS =================

function changeLane(direction) {
    if (paused || gameOver) return;

    playerLane += direction;
    playerLane = Math.max(0, Math.min(2, playerLane));
}

window.addEventListener("keydown", (event) => {
    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key)
    ) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        changeLane(-1);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        changeLane(1);
    }

    if (event.key === " " && !gameOver) {
        paused ? resumeGame() : pauseGame();
    }
});

// ================= PAUSE AND RESTART =================

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
    coins.forEach(coin => scene.remove(coin.mesh));

    trafficCars.length = 0;
    coins.length = 0;

    score = 0;
    coinCount = 0;
    speed = 4;
    playerLane = 1;
    spawnTimer = 0;
    coinTimer = 0;
    paused = false;
    gameOver = false;

    player.position.set(lanePositions[playerLane], 0, 4);

    for (let i = 0; i < 7; i++) {
        spawnTraffic(-35 - i * 27);
    }

    for (let i = 0; i < 18; i++) {
        spawnCoin(-22 - i * 17);
    }

    hideMessage();
    updateHUD();
}

document.getElementById("pause-btn").addEventListener("click", pauseGame);
document.getElementById("resume-btn").addEventListener("click", resumeGame);
document.getElementById("restart-btn").addEventListener("click", resetGame);

// ================= COLLISION DETECTION =================

function checkCollision(a, b) {
    return (
        Math.abs(a.position.x - b.position.x) < 1.45 &&
        Math.abs(a.position.z - b.position.z) < 2.2
    );
}

function endGame() {
    gameOver = true;
    paused = true;
    showMessage("GAME OVER", "Score: " + score + " | Press Restart to play again");
}

// ================= ANIMATION =================

function animate(time = 0) {
    requestAnimationFrame(animate);

    const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
    lastTime = time;

    if (!paused && !gameOver) {
        // Move player smoothly between lanes
        const targetX = lanePositions[playerLane];
        player.position.x += (targetX - player.position.x) * 0.18 * delta;

        // Slight car movement
        player.rotation.z = (targetX - player.position.x) * 0.025;

        // Increase score and speed over time
        score += Math.max(1, Math.floor(delta));
        speed = Math.min(12, 4 + score / 350);

        const movement = speed * 0.15 * delta;

        // Road markings move toward the player
        laneDashes.forEach(dash => {
            dash.position.z += movement;

            if (dash.position.z > 12) {
                dash.position.z -= 280;
            }
        });

        // Traffic movement and collisions
        spawnTimer += delta;

        if (spawnTimer > 42) {
            spawnTraffic(-190);
            spawnTimer = 0;
        }

        for (let i = trafficCars.length - 1; i >= 0; i--) {
            const car = trafficCars[i];
            car.mesh.position.z += movement;

            if (checkCollision(player, car.mesh)) {
                endGame();
                break;
            }

            if (car.mesh.position.z > 15) {
                scene.remove(car.mesh);
                trafficCars.splice(i, 1);
            }
        }

        // Coin movement and collection
        coinTimer += delta;

        if (coinTimer > 30) {
            spawnCoin(-190);
            coinTimer = 0;
        }

        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];

            coin.mesh.position.z += movement;
            coin.mesh.rotation.y += 0.08 * delta;
            coin.mesh.rotation.x += 0.015 * delta;

            if (
                Math.abs(player.position.x - coin.mesh.position.x) < 1.4 &&
                Math.abs(player.position.z - coin.mesh.position.z) < 2
            ) {
                coinCount++;
                score += 10;

                scene.remove(coin.mesh);
                coins.splice(i, 1);
                continue;
            }

            if (coin.mesh.position.z > 15) {
                scene.remove(coin.mesh);
                coins.splice(i, 1);
            }
        }

        // Animate neon city scenery
        buildings.forEach(building => {
            building.mesh.position.z += movement;

            if (building.mesh.position.z > 25) {
                building.mesh.position.z -= 384;
            }
        });

        // Move trees
        trees.forEach(tree => {
            tree.trunk.position.z += movement;
            tree.leaves.position.z += movement;

            if (tree.trunk.position.z > 20) {
                tree.trunk.position.z -= 360;
                tree.leaves.position.z -= 360;
            }
        });

        // Move streetlights
        streetlights.forEach(light => {
            light.pole.position.z += movement;
            light.arm.position.z += movement;
            light.bulb.position.z += movement;

            if (light.pole.position.z > 25) {
                light.pole.position.z -= 360;
                light.arm.position.z -= 360;
                light.bulb.position.z -= 360;
            }
        });

        updateHUD();
    }

    renderer.render(scene, camera);
}

// Start game
updateHUD();
animate();
