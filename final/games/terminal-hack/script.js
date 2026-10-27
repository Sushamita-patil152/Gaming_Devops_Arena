const gridEl = document.getElementById("grid");
const targetEl = document.getElementById("target");
const msgEl = document.getElementById("message");
const nextBtn = document.getElementById("next");
const restartBtn = document.getElementById("restart");

let round = 1, score = 0, moves = 0, timeLeft = 0;
let timer = null, progress = 0, target = [], active = false;

function randHex() {
    return Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0");
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function updateHud() {
    document.getElementById("round").textContent = round;
    document.getElementById("score").textContent = score;
    document.getElementById("moves").textContent = moves;
    document.getElementById("time").textContent = timeLeft;
}

function renderTarget() {
    targetEl.innerHTML = "";
    target.forEach((code, i) => {
        const s = document.createElement("span");
        s.textContent = code;
        if (i < progress) s.className = "done";
        else if (i === progress) s.className = "current";
        targetEl.appendChild(s);
    });
}

function startRound() {
    clearInterval(timer);
    moves = 0;
    progress = 0;
    active = true;
    nextBtn.hidden = true;
    msgEl.textContent = "";
    msgEl.className = "";

    const codes = new Set();
    while (codes.size < 25) codes.add(randHex());
    const list = [...codes];
    target = shuffle(list).slice(0, Math.min(3 + round, 8));
    
    // Corrected timer reduction calculation per round
    timeLeft = Math.max(15, 32 - round * 2);

    gridEl.innerHTML = "";
    shuffle(list).forEach(code => {
        const b = document.createElement("button");
        b.textContent = code;
        b.addEventListener("click", () => handleClick(b, code));
        gridEl.appendChild(b);
    });

    renderTarget();
    updateHud();

    timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { 
            timeLeft = 0; 
            lose(); 
        }
        updateHud();
    }, 1000);
}

function handleClick(btn, code) {
    if (!active) return;
    moves++;
    if (code === target[progress]) {
        btn.classList.add("done");
        btn.disabled = true;
        progress++;
        renderTarget();
        if (progress === target.length) win();
    } else {
        btn.classList.add("wrong");
        setTimeout(() => btn.classList.remove("wrong"), 300);
        timeLeft = Math.max(0, timeLeft - 2);
        if (timeLeft === 0) lose();
    }
    updateHud();
}

function win() {
    active = false;
    clearInterval(timer);
    score += timeLeft * 10 + round * 50;
    msgEl.textContent = "ACCESS GRANTED ✓";
    msgEl.className = "win";
    nextBtn.hidden = false;
    updateHud();
}

function lose() {
    active = false;
    clearInterval(timer);
    msgEl.textContent = "ACCESS DENIED ✗ Press Restart to try again";
    msgEl.className = "lose";
}

nextBtn.addEventListener("click", () => { round++; startRound(); });
restartBtn.addEventListener("click", () => { round = 1; score = 0; startRound(); });

startRound();