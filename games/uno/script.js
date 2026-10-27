/* Neon Synth Audio Synthesizer via Web Audio API */
class NeonSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, gainStart = 0.2, gainEnd = 0.001) {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio safety catch
    }
  }

  playCard() {
    this.playTone(587.33, 'sine', 0.1, 0.25); // D5 Synth blip
    setTimeout(() => this.playTone(880, 'triangle', 0.08, 0.15), 45);
  }

  drawCard() {
    this.playTone(329.63, 'sawtooth', 0.12, 0.18); // E4 synth glide
  }

  specialCard() {
    // High-tech laser triad
    this.playTone(740, 'square', 0.08, 0.12);
    setTimeout(() => this.playTone(987.77, 'sawtooth', 0.1, 0.15), 80);
    setTimeout(() => this.playTone(1318.51, 'sine', 0.18, 0.2), 160);
  }

  unoCall() {
    this.playTone(880, 'square', 0.12, 0.2);
    setTimeout(() => this.playTone(1760, 'sawtooth', 0.35, 0.25), 100);
  }

  win() {
    const notes = [587.33, 739.99, 880, 1174.66, 1760];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.4, 0.3), i * 120);
    });
  }

  lose() {
    const notes = [523.25, 466.16, 415.3, 311.13];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sawtooth', 0.3, 0.2), i * 140);
    });
  }
}

const sound = new NeonSoundEngine();

// Sound toggle listener
const soundBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
soundBtn.addEventListener('click', () => {
  sound.muted = !sound.muted;
  soundIcon.textContent = sound.muted ? '🔇' : '🔊';
  soundBtn.classList.toggle('border-rose-500', sound.muted);
  soundBtn.classList.toggle('text-rose-400', sound.muted);
});

const COLORS = ['Red', 'Yellow', 'Green', 'Blue'];

class UnoGame {
  constructor() {
    this.deck = [];
    this.discardPile = [];
    this.playerHand = [];
    this.aiHand = [];
    this.currentColor = null;
    this.currentValue = null;
    this.isPlayerTurn = true;
    this.turnLocked = false;
    this.hasCalledUno = false;
    this.pendingWildCard = null;

    this.initDOM();
    this.startNewGame();
  }

  initDOM() {
    this.statusBanner = document.getElementById('game-status-banner');
    this.playerHandEl = document.getElementById('player-hand');
    this.aiHandEl = document.getElementById('ai-hand-container');
    this.discardPileEl = document.getElementById('discard-pile');
    this.drawDeckEl = document.getElementById('draw-deck');
    this.activeColorBadge = document.getElementById('active-color-badge');
    this.activeColorName = document.getElementById('active-color-name');
    this.playerCountEl = document.getElementById('player-card-count');
    this.aiCountEl = document.getElementById('ai-card-count');
    this.aiThinkingEl = document.getElementById('ai-thinking');
    this.colorModal = document.getElementById('color-picker-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.callUnoBtn = document.getElementById('call-uno-btn');

    this.drawDeckEl.addEventListener('click', () => {
      if (!this.isPlayerTurn || this.turnLocked) return;
      this.handlePlayerDraw();
    });

    this.callUnoBtn.addEventListener('click', () => {
      this.hasCalledUno = true;
      sound.unoCall();
      this.setStatus('🎉 UNO PROTOCOL ACTIVATED!');
      this.callUnoBtn.classList.add('hidden');
    });

    document.querySelectorAll('.color-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosenColor = btn.getAttribute('data-color');
        this.resolvePlayerWild(chosenColor);
      });
    });

    document.getElementById('restart-game-btn').addEventListener('click', () => this.startNewGame());
    document.getElementById('modal-restart-btn').addEventListener('click', () => {
      this.hideGameOverModal();
      this.startNewGame();
    });
  }

  buildDeck() {
    const deck = [];
    COLORS.forEach(color => {
      deck.push({ color, value: '0', id: crypto.randomUUID() });
      for (let i = 1; i <= 9; i++) {
        deck.push({ color, value: i.toString(), id: crypto.randomUUID() });
        deck.push({ color, value: i.toString(), id: crypto.randomUUID() });
      }
      ['Skip', 'Reverse', 'Draw Two'].forEach(act => {
        deck.push({ color, value: act, id: crypto.randomUUID() });
        deck.push({ color, value: act, id: crypto.randomUUID() });
      });
    });

    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'Wild', value: 'Wild', id: crypto.randomUUID() });
      deck.push({ color: 'Wild', value: 'Wild Draw Four', id: crypto.randomUUID() });
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  startNewGame() {
    this.deck = this.buildDeck();
    this.discardPile = [];
    this.playerHand = [];
    this.aiHand = [];
    this.isPlayerTurn = true;
    this.turnLocked = false;
    this.hasCalledUno = false;
    this.pendingWildCard = null;

    for (let i = 0; i < 7; i++) {
      this.playerHand.push(this.deck.pop());
      this.aiHand.push(this.deck.pop());
    }

    let starter = this.deck.pop();
    while (starter.value === 'Wild Draw Four') {
      this.deck.unshift(starter);
      starter = this.deck.pop();
    }

    this.discardPile.push(starter);
    this.currentColor = starter.color === 'Wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : starter.color;
    this.currentValue = starter.value;

    this.setStatus(`MATCH START // STARTER: ${this.currentColor.toUpperCase()} ${starter.value}`);
    this.renderAll();
  }

  drawCardFromDeck() {
    if (this.deck.length === 0) {
      const topCard = this.discardPile.pop();
      this.deck = [...this.discardPile];
      this.discardPile = [topCard];
      
      for (let i = this.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
      }
      this.setStatus('♻️ RECYCLING DISCARD BUFFER INTO DRAW DECK');
    }
    return this.deck.pop();
  }

  canPlayCard(card) {
    if (card.color === 'Wild') return true;
    if (card.color === this.currentColor) return true;
    if (card.value === this.currentValue) return true;
    return false;
  }

  getPlayableCards(hand) {
    return hand.filter(c => this.canPlayCard(c));
  }

  handlePlayerDraw() {
    sound.drawCard();
    const drawn = this.drawCardFromDeck();
    this.playerHand.push(drawn);
    this.hasCalledUno = false;

    if (this.canPlayCard(drawn)) {
      this.setStatus(`DREW ${drawn.color.toUpperCase()} ${drawn.value} // READY TO PLAY`);
    } else {
      this.setStatus(`DREW A CARD // NO VALID PROTOCOL. PASSING.`);
      this.turnLocked = true;
      this.renderAll();
      setTimeout(() => this.passTurnToAI(), 900);
      return;
    }

    this.renderAll();
  }

  handlePlayerCardClick(card) {
    if (!this.isPlayerTurn || this.turnLocked) return;
    if (!this.canPlayCard(card)) return;

    if (this.playerHand.length === 2 && !this.hasCalledUno) {
      this.setStatus('⚠️ PENALTY: UNO NOT CALLED! +2 CARDS DRAWN');
      sound.lose();
      this.playerHand.push(this.drawCardFromDeck());
      this.playerHand.push(this.drawCardFromDeck());
      this.renderAll();
      return;
    }

    if (card.color === 'Wild') {
      this.pendingWildCard = card;
      this.openColorPicker();
    } else {
      this.executePlay(card, 'Player', card.color);
    }
  }

  openColorPicker() {
    this.colorModal.classList.remove('hidden');
    setTimeout(() => {
      this.colorModal.classList.remove('opacity-0');
      this.colorModal.querySelector('div').classList.remove('scale-95');
    }, 10);
  }

  closeColorPicker() {
    this.colorModal.classList.add('opacity-0');
    this.colorModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => this.colorModal.classList.add('hidden'), 200);
  }

  resolvePlayerWild(chosenColor) {
    this.closeColorPicker();
    const card = this.pendingWildCard;
    this.pendingWildCard = null;
    this.executePlay(card, 'Player', chosenColor);
  }

  executePlay(card, actor, chosenColor) {
    this.turnLocked = true;
    sound.playCard();

    if (actor === 'Player') {
      const index = this.playerHand.findIndex(c => c.id === card.id);
      this.playerHand.splice(index, 1);
    } else {
      const index = this.aiHand.findIndex(c => c.id === card.id);
      this.aiHand.splice(index, 1);
    }

    this.discardPile.push(card);
    this.currentColor = chosenColor || card.color;
    this.currentValue = card.value;

    if (['Skip', 'Reverse', 'Draw Two', 'Wild Draw Four'].includes(card.value)) {
      sound.specialCard();
    }

    if (this.playerHand.length === 0 || this.aiHand.length === 0) {
      this.renderAll();
      setTimeout(() => this.handleWin(actor), 400);
      return;
    }

    let skipOpponent = false;
    let actionMsg = `${actor} played ${card.color === 'Wild' ? 'Wild' : card.color} ${card.value}`;

    if (card.value === 'Skip' || card.value === 'Reverse') {
      skipOpponent = true;
      actionMsg += `! ${actor === 'Player' ? 'Bot' : 'Your'} cycle skipped.`;
    } else if (card.value === 'Draw Two') {
      skipOpponent = true;
      const target = actor === 'Player' ? this.aiHand : this.playerHand;
      target.push(this.drawCardFromDeck());
      target.push(this.drawCardFromDeck());
      actionMsg += `! ${actor === 'Player' ? 'Bot forced +2' : 'You forced +2'} & cycle skipped.`;
    } else if (card.value === 'Wild Draw Four') {
      skipOpponent = true;
      const target = actor === 'Player' ? this.aiHand : this.playerHand;
      for (let k = 0; k < 4; k++) target.push(this.drawCardFromDeck());
      actionMsg += ` (${chosenColor})! ${actor === 'Player' ? 'Bot draws 4 cards' : 'You draw 4 cards'} & lost turn.`;
    } else if (card.color === 'Wild') {
      actionMsg += `! Frequency shifted to ${chosenColor}.`;
    }

    this.setStatus(actionMsg);
    this.renderAll();

    if (actor === 'Player') {
      if (skipOpponent) {
        this.turnLocked = false;
        this.isPlayerTurn = true;
      } else {
        setTimeout(() => this.passTurnToAI(), 800);
      }
    } else {
      if (skipOpponent) {
        setTimeout(() => this.passTurnToAI(), 1100);
      } else {
        this.isPlayerTurn = true;
        this.turnLocked = false;
      }
    }

    this.renderAll();
  }

  passTurnToAI() {
    this.isPlayerTurn = false;
    this.turnLocked = true;
    this.aiThinkingEl.classList.remove('hidden');
    this.renderAll();

    setTimeout(() => {
      this.executeAITurn();
    }, 1200);
  }

  executeAITurn() {
    this.aiThinkingEl.classList.add('hidden');
    const playable = this.getPlayableCards(this.aiHand);

    if (this.aiHand.length === 2) {
      sound.unoCall();
      this.setStatus('🤖 BOT SHOUTED "UNO!"');
    }

    if (playable.length === 0) {
      sound.drawCard();
      const drawn = this.drawCardFromDeck();
      this.aiHand.push(drawn);

      if (this.canPlayCard(drawn)) {
        setTimeout(() => {
          const bestColor = this.getBestColorForHand(this.aiHand);
          this.executePlay(drawn, 'Bot', bestColor);
        }, 600);
      } else {
        this.setStatus('BOT DREW & PASSED CYCLE // YOUR TURN');
        this.isPlayerTurn = true;
        this.turnLocked = false;
        this.renderAll();
      }
      return;
    }

    let chosenCard = playable.find(c => ['Draw Two', 'Skip', 'Reverse'].includes(c.value));
    if (!chosenCard) chosenCard = playable.find(c => c.color !== 'Wild');
    if (!chosenCard) chosenCard = playable[0];

    const chosenColor = this.getBestColorForHand(this.aiHand);
    this.executePlay(chosenCard, 'Bot', chosenColor);
  }

  getBestColorForHand(hand) {
    const counts = { Red: 0, Blue: 0, Yellow: 0, Green: 0 };
    hand.forEach(c => {
      if (c.color !== 'Wild' && counts[c.color] !== undefined) {
        counts[c.color]++;
      }
    });
    let best = 'Red';
    let max = -1;
    for (const [col, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = col;
      }
    }
    return best;
  }

  renderAll() {
    this.renderPlayerHand();
    this.renderAIHand();
    this.renderCenterBoard();
    this.updateStats();
  }

  updateStats() {
    this.playerCountEl.textContent = `${this.playerHand.length} CARD${this.playerHand.length === 1 ? '' : 'S'}`;
    this.aiCountEl.textContent = `${this.aiHand.length} CARD${this.aiHand.length === 1 ? '' : 'S'}`;

    if (this.playerHand.length === 2 && this.isPlayerTurn && !this.hasCalledUno) {
      this.callUnoBtn.classList.remove('hidden');
    } else if (this.playerHand.length !== 2) {
      this.callUnoBtn.classList.add('hidden');
    }

    const playerBadge = document.getElementById('player-avatar-badge');
    const aiBadge = document.getElementById('ai-avatar-badge');
    if (this.isPlayerTurn) {
      playerBadge.classList.add('active-turn-ring');
      aiBadge.classList.remove('active-turn-ring');
    } else {
      aiBadge.classList.add('active-turn-ring');
      playerBadge.classList.remove('active-turn-ring');
    }
  }

  renderCenterBoard() {
    const topCard = this.discardPile[this.discardPile.length - 1];
    this.discardPileEl.innerHTML = this.createCardHTML(topCard, false, false);

    const colorClasses = {
      Red: 'bg-[#ff0055] shadow-[#ff0055]',
      Yellow: 'bg-[#ffe600] shadow-[#ffe600]',
      Green: 'bg-[#00ff88] shadow-[#00ff88]',
      Blue: 'bg-[#00e5ff] shadow-[#00e5ff]'
    };
    this.activeColorBadge.className = `w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-[0_0_15px] transition-all duration-300 ${colorClasses[this.currentColor] || 'bg-gray-800'}`;
    this.activeColorName.textContent = this.currentColor ? this.currentColor.toUpperCase() : 'NONE';
    this.activeColorName.style.color = this.currentColor === 'Yellow' ? '#ffe600' : (this.currentColor === 'Red' ? '#ff0055' : (this.currentColor === 'Blue' ? '#00e5ff' : '#00ff88'));
  }

  renderPlayerHand() {
    this.playerHandEl.innerHTML = '';
    const playableCards = this.isPlayerTurn && !this.turnLocked ? this.getPlayableCards(this.playerHand) : [];

    this.playerHand.forEach(card => {
      const isPlayable = playableCards.some(pc => pc.id === card.id);
      const cardDiv = document.createElement('div');
      cardDiv.innerHTML = this.createCardHTML(card, true, isPlayable);
      const el = cardDiv.firstElementChild;

      if (isPlayable) {
        el.addEventListener('click', () => this.handlePlayerCardClick(card));
      }
      this.playerHandEl.appendChild(el);
    });
  }

  renderAIHand() {
    this.aiHandEl.innerHTML = '';
    this.aiHand.forEach(() => {
      const cardBack = document.createElement('div');
      cardBack.className = 'uno-card bg-uno-back pointer-events-none transform scale-90 md:scale-95 shadow-lg';
      cardBack.innerHTML = `
        <div class="uno-card-inner">
          <div class="uno-oval bg-cyan-950 !rotate-[-28deg] border border-cyan-400">
            <span class="font-cyber font-black text-cyan-300 text-xs md:text-sm transform rotate-[28deg] drop-shadow-[0_0_5px_#00f0ff]">UNO</span>
          </div>
        </div>
      `;
      this.aiHandEl.appendChild(cardBack);
    });
  }

  createCardHTML(card, isPlayerCard = false, isPlayable = false) {
    const bgClass = {
      Red: 'bg-uno-red',
      Yellow: 'bg-uno-yellow',
      Green: 'bg-uno-green',
      Blue: 'bg-uno-blue',
      Wild: 'bg-uno-wild'
    }[card.color] || 'bg-slate-800';

    let innerContent = '';
    let cornerValue = card.value;

    if (card.value === 'Skip') {
      cornerValue = '⊘';
      innerContent = `
        <svg class="w-8 h-8 md:w-10 md:h-10 text-white fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" fill="none" />
          <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" stroke-width="2.5" />
        </svg>`;
    } else if (card.value === 'Reverse') {
      cornerValue = '⇄';
      innerContent = `
        <svg class="w-8 h-8 md:w-10 md:h-10 text-white fill-current drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
        </svg>`;
    } else if (card.value === 'Draw Two') {
      cornerValue = '+2';
      innerContent = `<span class="font-cyber font-black text-2xl md:text-3xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">+2</span>`;
    } else if (card.value === 'Wild') {
      cornerValue = 'W';
      innerContent = `<span class="font-cyber font-black text-xs md:text-sm text-cyan-300 bg-black/80 px-2 py-0.5 rounded-full uppercase tracking-widest border border-cyan-400 drop-shadow-[0_0_6px_#00f0ff]">WILD</span>`;
    } else if (card.value === 'Wild Draw Four') {
      cornerValue = '+4';
      innerContent = `<span class="font-cyber font-black text-2xl md:text-3xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">+4</span>`;
    } else {
      innerContent = `<span class="font-cyber font-black text-3xl md:text-4xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">${card.value}</span>`;
    }

    const isWild = card.color === 'Wild';
    const ovalStyle = isWild ? 'uno-oval-wild' : '';
    const cornerColorClass = card.color === 'Yellow' ? 'text-uno-yellow-corner' : '';
    const playClass = isPlayerCard ? (isPlayable ? 'card-playable' : 'card-disabled') : '';

    return `
      <div class="uno-card ${playClass}">
        <div class="uno-card-inner ${bgClass}">
          <div class="card-corner corner-tl ${cornerColorClass}">${cornerValue}</div>
          <div class="card-corner corner-br ${cornerColorClass}">${cornerValue}</div>
          <div class="uno-oval ${ovalStyle}">
            <div class="transform rotate-[25deg] flex items-center justify-center">
              ${innerContent}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setStatus(msg) {
    this.statusBanner.textContent = msg;
    this.statusBanner.classList.remove('animate-shake');
    void this.statusBanner.offsetWidth;
    this.statusBanner.classList.add('animate-shake');
  }

  handleWin(winner) {
    const modal = this.gameOverModal;
    const emoji = document.getElementById('game-over-emoji');
    const title = document.getElementById('game-over-title');
    const desc = document.getElementById('game-over-desc');
    const summaryWinner = document.getElementById('summary-winner');
    const summaryCards = document.getElementById('summary-opponent-cards');

    if (winner === 'Player') {
      sound.win();
      emoji.textContent = '👑';
      title.textContent = 'VICTORY ACHVD';
      desc.textContent = 'CyberBot completely dominated in this cycle!';
      summaryWinner.textContent = 'Player (You)';
      summaryCards.textContent = `${this.aiHand.length} cards remaining`;
    } else {
      sound.lose();
      emoji.textContent = '💀';
      title.textContent = 'SYSTEM OVERLOAD';
      desc.textContent = 'CyberBot cleared its hand first. Try again!';
      summaryWinner.textContent = 'CyberBot AI';
      summaryCards.textContent = `${this.playerHand.length} cards remaining`;
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('div').classList.remove('scale-90');
    }, 10);
  }

  hideGameOverModal() {
    this.gameOverModal.classList.add('opacity-0');
    this.gameOverModal.querySelector('div').classList.add('scale-90');
    setTimeout(() => this.gameOverModal.classList.add('hidden'), 250);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new UnoGame();
});