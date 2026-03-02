/* ========== MINESWEEPER GAME LOGIC & UI ========== */

const LEVELS = {
    easy: { rows: 5, cols: 5, mines: 5, label: 'DỄ', size: '5×5' },
    medium: { rows: 9, cols: 9, mines: 10, label: 'TRUNG BÌNH', size: '9×9' },
    hard: { rows: 12, cols: 12, mines: 20, label: 'KHÓ', size: '12×12' },
    expert: { rows: 20, cols: 20, mines: 60, label: 'SIÊU KHÓ', size: '20×20' },
};

let game = null, currentLevel = 'medium', actionMode = 'reveal';
let timerInterval = null, elapsedSeconds = 0, previousScreen = 'screen-menu';
let soundEnabled = true, vibrateEnabled = true;
let boardStyle = 'classic', bombStyle = 'bomb', numColorTheme = 'classic';
let customRows = 10, customCols = 10, customMines = 16;

// ---- CELL & LOGIC (port from logic.py) ----
class Cell {
    constructor() { this.isMine = false; this.mineCount = 0; this.isRevealed = false; this.isFlagged = false; }
}

class MinesweeperLogic {
    constructor(rows, cols, numMines) {
        this.rows = rows; this.cols = cols;
        this.numMines = numMines != null ? numMines : Math.floor((rows * cols) / 6);
        this.gameOver = false; this.win = false; this.firstClick = false; this.flagCount = 0;
        this.board = [];
        for (let i = 0; i < rows; i++) { const row = []; for (let j = 0; j < cols; j++) row.push(new Cell()); this.board.push(row); }
    }
    _valid(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
    _adj(r, c) {
        const a = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const nr = r + dr, nc = c + dc; if (this._valid(nr, nc)) a.push([nr, nc]); }
        return a;
    }
    _generateBoard(exclude) {
        const ex = new Set(exclude.map(([r, c]) => r * this.cols + c));
        const cells = []; for (let i = 0; i < this.rows * this.cols; i++) if (!ex.has(i)) cells.push(i);
        for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[cells[i], cells[j]] = [cells[j], cells[i]]; }
        for (let k = 0; k < Math.min(this.numMines, cells.length); k++) { const p = cells[k]; this.board[Math.floor(p / this.cols)][p % this.cols].isMine = true; }
        for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) if (this.board[i][j].isMine) for (const [nr, nc] of this._adj(i, j)) if (!this.board[nr][nc].isMine) this.board[nr][nc].mineCount++;
    }
    revealCell(r, c) {
        if (!this._valid(r, c) || this.gameOver || this.board[r][c].isFlagged || this.board[r][c].isRevealed) return false;
        if (!this.firstClick) { this._generateBoard([[r, c], ...this._adj(r, c)]); this.firstClick = true; }
        if (this.board[r][c].isMine) { this.gameOver = true; this.board[r][c].isRevealed = true; return true; }
        if (this.board[r][c].mineCount === 0) this._flood(r, c);
        this.board[r][c].isRevealed = true; return true;
    }
    _flood(r, c) {
        const dfs = (r2, c2) => { if (this.board[r2][c2].isRevealed || this.board[r2][c2].isFlagged) return; this.board[r2][c2].isRevealed = true; if (this.board[r2][c2].mineCount > 0) return; for (const [nr, nc] of this._adj(r2, c2)) dfs(nr, nc); };
        dfs(r, c);
    }
    toggleFlag(r, c) {
        if (this.gameOver || this.board[r][c].isRevealed) return false;
        this.board[r][c].isFlagged = !this.board[r][c].isFlagged;
        this.flagCount += this.board[r][c].isFlagged ? 1 : -1; return true;
    }
    checkWin() {
        for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) if (!this.board[i][j].isMine && !this.board[i][j].isRevealed) return false;
        this.win = true; this.gameOver = true; return true;
    }
}

// ---- BOMB ICONS ----
const BOMB_ICONS = { bomb: '💣', star: '⭐', skull: '💀' };
function getBombIcon() { return BOMB_ICONS[bombStyle] || '💣'; }

// ========== SOUND EFFECTS (.wav files via Web Audio API) ==========
let audioCtx = null;
let sfxVolume = 0.5; // 0-1
let musicEnabled = false, musicVolume = 0.3;
let musicGainNode = null, musicInterval = null, musicPlaying = false;

const SFX_FILES = {
    reveal: '/sound_effect/mixkit-game-ball-tap-2073.wav',
    explosion: '/sound_effect/mixkit-short-explosion-1694.wav',
    win: '/sound_effect/mixkit-game-level-completed-2059.wav',
    lose: '/sound_effect/mixkit-player-losing-or-failing-2042.wav',
    unlock: '/sound_effect/mixkit-unlock-game-notification-253.wav',
};

// Pre-decoded AudioBuffers for near-zero latency
const sfxBuffers = {};

function preloadSounds() {
    const ctx = getAudioCtx();
    for (const [key, url] of Object.entries(SFX_FILES)) {
        fetch(url)
            .then(res => res.arrayBuffer())
            .then(buf => ctx.decodeAudioData(buf))
            .then(decoded => { sfxBuffers[key] = decoded; })
            .catch(() => { });
    }
}

function playSfx(key) {
    if (!soundEnabled || sfxVolume === 0) return;
    try {
        const ctx = getAudioCtx();
        const buffer = sfxBuffers[key];
        if (!buffer) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = sfxVolume;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
    } catch (e) { /* ignore */ }
}

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Keep procedural playTone for flag sound and ambient music
function playTone(freq, duration, type, baseVol) {
    if (!soundEnabled || sfxVolume === 0) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const vol = (baseVol || 0.15) * sfxVolume;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
}

function playRevealSound() { playSfx('reveal'); }
function playFlagSound() {
    playTone(800, 0.06, 'square', 0.1);
    setTimeout(() => playTone(1000, 0.06, 'square', 0.1), 60);
}
function playExplosionSound() { playSfx('explosion'); }
function playWinSound() { playSfx('win'); }
function playLoseSound() { playSfx('lose'); }
function playUnlockSound() { playSfx('unlock'); }

// ---- SFX Volume Control ----
function onSfxVolumeChange(val) {
    sfxVolume = parseInt(val) / 100;
    localStorage.setItem('ms-sfx-volume', val);
    document.getElementById('sfx-volume-val').textContent = val + '%';
    if (!soundEnabled && sfxVolume > 0) {
        soundEnabled = true;
        document.getElementById('sound-toggle').checked = true;
        localStorage.setItem('ms-sound', true);
    }
}
function setSfxVolume(val) {
    document.getElementById('sfx-volume').value = val;
    onSfxVolumeChange(val);
}

// ========== AMBIENT MUSIC (Procedural) ==========
const MUSIC_CHORDS = [
    [261.6, 329.6, 392.0],  // C major
    [220.0, 277.2, 329.6],  // A minor
    [293.7, 349.2, 440.0],  // D minor
    [246.9, 311.1, 370.0],  // B dim (tension)
    [261.6, 329.6, 392.0],  // C major
    [349.2, 440.0, 523.3],  // F major
    [293.7, 370.0, 440.0],  // D minor
    [196.0, 246.9, 293.7],  // G (resolve)
];

let musicChordIndex = 0;

function playMusicChord() {
    if (!musicEnabled || !musicPlaying) return;
    try {
        const ctx = getAudioCtx();
        const chord = MUSIC_CHORDS[musicChordIndex % MUSIC_CHORDS.length];
        musicChordIndex++;

        chord.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            const vol = musicVolume * 0.08;
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(vol, ctx.currentTime + 1.5);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.8);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + 3);
        });

        // Subtle pad layer
        const pad = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();
        pad.type = 'triangle';
        pad.frequency.setValueAtTime(chord[0] / 2, ctx.currentTime);
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(300, ctx.currentTime);
        const padVol = musicVolume * 0.04;
        padGain.gain.setValueAtTime(0, ctx.currentTime);
        padGain.gain.linearRampToValueAtTime(padVol, ctx.currentTime + 0.5);
        padGain.gain.setValueAtTime(padVol, ctx.currentTime + 2);
        padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.9);
        pad.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(ctx.destination);
        pad.start(ctx.currentTime);
        pad.stop(ctx.currentTime + 3);
    } catch (e) { /* ignore */ }
}

function startMusic() {
    if (musicPlaying) return;
    musicPlaying = true;
    musicChordIndex = 0;
    playMusicChord();
    musicInterval = setInterval(playMusicChord, 3000);
    updateMusicUI();
}

function stopMusic() {
    musicPlaying = false;
    if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
    updateMusicUI();
}

function toggleMusic() {
    musicEnabled = document.getElementById('music-toggle').checked;
    localStorage.setItem('ms-music', musicEnabled);
    if (musicEnabled) { playUnlockSound(); startMusic(); showToast('Đã bật nhạc nền', 'info'); }
    else { stopMusic(); showToast('Đã tắt nhạc nền', 'info'); }
}

function onMusicVolumeChange(val) {
    musicVolume = parseInt(val) / 100;
    localStorage.setItem('ms-music-volume', val);
    document.getElementById('music-volume-val').textContent = val + '%';
}
function setMusicVolume(val) {
    document.getElementById('music-volume').value = val;
    onMusicVolumeChange(val);
}

function updateMusicUI() {
    const info = document.getElementById('music-info');
    const status = document.getElementById('music-status');
    if (musicPlaying) {
        info.classList.remove('paused');
        status.textContent = 'Đang phát nhạc nền...';
    } else {
        info.classList.add('paused');
        status.textContent = 'Nhạc nền đang tắt';
    }
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(msg, type) {
    if (typeof Toastify === 'undefined') return;
    const colors = {
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    };
    Toastify({
        text: msg,
        duration: 2500,
        gravity: 'top',
        position: 'center',
        style: { background: colors[type] || colors.info },
        stopOnFocus: false,
    }).showToast();
}

// ========== CUSTOM CONFIRM MODAL ==========
function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        msgEl.textContent = message;
        modal.classList.add('active');

        function cleanup(result) {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ---- SCREEN NAV ----
function showScreen(id) {
    if (id !== 'screen-settings' && id !== 'screen-leaderboard' && id !== 'screen-custom') previousScreen = id;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen-leaderboard') renderLeaderboard();
    if (id === 'screen-custom') updateCustomInfo();
}
function goBackFromSettings() { showScreen(previousScreen); }

// ---- THEME ----
function applyTheme(theme) {
    if (theme === 'system') { document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches); }
    else { document.documentElement.classList.toggle('dark', theme === 'dark'); }
    const icon = document.getElementById('theme-float-icon');
    if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    updateThemePicker();
}
function setTheme(t) { localStorage.setItem('ms-theme', t); applyTheme(t); showToast('Đã đổi giao diện', 'info'); }
function quickToggleTheme() { setTheme((localStorage.getItem('ms-theme') || 'light') === 'dark' ? 'light' : 'dark'); }
function updateThemePicker() { const s = localStorage.getItem('ms-theme') || 'light'; document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === s)); }

// ---- BOARD STYLE ----
function setBoardStyle(style) {
    boardStyle = style; localStorage.setItem('ms-boardstyle', style);
    document.documentElement.classList.remove('board-classic', 'board-matrix', 'board-wooden');
    if (style !== 'classic') document.documentElement.classList.add('board-' + style);
    document.querySelectorAll('.style-opt').forEach(b => b.classList.toggle('active', b.dataset.style === style));
    if (game) renderGrid();
}
function setBombStyle(style) {
    bombStyle = style; localStorage.setItem('ms-bombstyle', style);
    document.querySelectorAll('.bomb-opt').forEach(b => b.classList.toggle('active', b.dataset.bomb === style));
    if (game) renderGrid();
}
function setNumColor(theme) {
    numColorTheme = theme; localStorage.setItem('ms-numcolor', theme);
    document.documentElement.classList.remove('numcolor-classic', 'numcolor-neon', 'numcolor-pastel');
    if (theme !== 'classic') document.documentElement.classList.add('numcolor-' + theme);
    document.querySelectorAll('.numcolor-opt').forEach(b => b.classList.toggle('active', b.dataset.numcolor === theme));
    if (game) renderGrid();
}

// ---- SOUND / VIBRATE ----
function toggleSound() {
    soundEnabled = document.getElementById('sound-toggle').checked;
    localStorage.setItem('ms-sound', soundEnabled);
    if (soundEnabled) { playUnlockSound(); showToast('Đã bật âm thanh', 'info'); }
    else { showToast('Đã tắt âm thanh', 'info'); }
}
function toggleVibrate() {
    vibrateEnabled = document.getElementById('vibrate-toggle').checked;
    localStorage.setItem('ms-vibrate', vibrateEnabled);
    showToast(vibrateEnabled ? 'Đã bật rung' : 'Đã tắt rung', 'info');
}
function doVibrate(ms) { if (vibrateEnabled && navigator.vibrate) navigator.vibrate(ms); }

// ---- TIMER ----
function startTimer() { stopTimer(); elapsedSeconds = 0; updateTimerDisplay(); timerInterval = setInterval(() => { elapsedSeconds++; updateTimerDisplay(); }, 1000); }
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function updateTimerDisplay() {
    const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const ss = String(elapsedSeconds % 60).padStart(2, '0');
    const display = mm + ':' + ss;
    const el = document.getElementById('timer-display'); if (el) el.textContent = display;
    const sb = document.getElementById('sidebar-time'); if (sb) sb.textContent = display;
}
function formatTime(sec) { return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }

// ---- CUSTOM MODE ----
function updateCustomInfo() {
    const n = parseInt(document.getElementById('custom-size').value);
    customRows = n; customCols = n;
    document.getElementById('custom-size-val').textContent = n;
    document.getElementById('custom-size-val2').textContent = n;
    const maxMines = Math.ceil((n * n) / 2) - 1;
    const mineSlider = document.getElementById('custom-mines');
    mineSlider.max = maxMines;
    if (parseInt(mineSlider.value) > maxMines) mineSlider.value = maxMines;
    customMines = parseInt(mineSlider.value);
    document.getElementById('custom-mines-val').textContent = customMines;
    document.getElementById('custom-hint').textContent = 'Tối đa: ' + maxMines + ' bom';
}
function startCustomGame() {
    updateCustomInfo();
    currentLevel = 'custom';
    game = new MinesweeperLogic(customRows, customCols, customMines);
    actionMode = 'reveal';
    document.getElementById('level-label').textContent = 'TÙY CHỈNH ' + customRows + '×' + customCols;
    const sbl = document.getElementById('sidebar-level'); if (sbl) sbl.textContent = customRows + '×' + customCols;
    updateMineCount(); buildGrid(); startTimer(); showScreen('screen-game'); setMode('reveal');
}

// ---- GAME INIT ----
function startGame(level) {
    currentLevel = level; const cfg = LEVELS[level];
    game = new MinesweeperLogic(cfg.rows, cfg.cols, cfg.mines);
    actionMode = 'reveal';
    document.getElementById('level-label').textContent = cfg.label;
    const sbl = document.getElementById('sidebar-level'); if (sbl) sbl.textContent = cfg.size;
    updateMineCount(); buildGrid(); startTimer(); showScreen('screen-game'); setMode('reveal');
}
function resetGame() { if (currentLevel === 'custom') startCustomGame(); else startGame(currentLevel); }

function setMode(mode) {
    actionMode = mode;
    document.getElementById('btn-reveal').classList.toggle('active', mode === 'reveal');
    document.getElementById('btn-flag').classList.toggle('active', mode === 'flag');
    const sbr = document.getElementById('sb-reveal'), sbf = document.getElementById('sb-flag');
    if (sbr) sbr.classList.toggle('active', mode === 'reveal');
    if (sbf) sbf.classList.toggle('active', mode === 'flag');
}
function updateMineCount() {
    const r = game.numMines - game.flagCount;
    document.getElementById('mine-count').textContent = String(Math.max(0, r)).padStart(3, '0');
    const sb = document.getElementById('sidebar-mines'); if (sb) sb.textContent = r;
}

// ---- BUILD GRID (auto-scale to fit screen) ----
function buildGrid() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;

    // Calculate available space for auto-scaling
    const isMobile = window.innerWidth < 780;
    const maxW = isMobile ? window.innerWidth - 40 : Math.min(520, window.innerWidth - 280) - 40;
    const maxH = (isMobile ? window.innerHeight - 230 : window.innerHeight - 140);
    const gridGap = 3;
    const gridPad = 12;
    const availW = maxW - gridPad;
    const availH = maxH - gridPad;
    let ts = Math.floor(Math.min(availW / game.cols, availH / game.rows) - gridGap);
    ts = Math.max(12, Math.min(ts, 60)); // clamp between 12 and 60

    const fs = Math.max(9, Math.floor(ts * 0.55));
    for (let i = 0; i < game.rows; i++) {
        for (let j = 0; j < game.cols; j++) {
            const t = document.createElement('div');
            t.className = 'tile unrevealed'; t.style.width = ts + 'px'; t.style.height = ts + 'px'; t.style.fontSize = fs + 'px';
            t.dataset.r = i; t.dataset.c = j;
            t.addEventListener('click', () => onTileClick(i, j));
            t.addEventListener('contextmenu', e => { e.preventDefault(); onTileRightClick(i, j); });
            grid.appendChild(t);
        }
    }
}

function onTileClick(r, c) {
    if (!game || game.gameOver) return;
    if (actionMode === 'flag') { onTileRightClick(r, c); return; }
    if (!game.revealCell(r, c)) return;
    playRevealSound();
    doVibrate(15); renderGrid();
    if (game.gameOver && !game.win) { onLose(r, c); return; }
    if (game.checkWin()) onWin();
}
function onTileRightClick(r, c) {
    if (!game || game.gameOver) return;
    if (!game.toggleFlag(r, c)) return;
    playFlagSound();
    doVibrate(30); updateMineCount(); renderGrid();
}

function renderGrid() {
    const tiles = document.getElementById('game-grid').children;
    let idx = 0;
    for (let i = 0; i < game.rows; i++) {
        for (let j = 0; j < game.cols; j++) {
            const cell = game.board[i][j], t = tiles[idx++];
            t.className = 'tile'; t.innerHTML = '';
            if (cell.isRevealed) {
                t.classList.add('revealed');
                if (cell.isMine) { t.classList.add('mine-hit'); t.textContent = getBombIcon(); }
                else if (cell.mineCount > 0) { t.classList.add('n' + cell.mineCount); t.textContent = cell.mineCount; }
            } else if (cell.isFlagged) {
                t.classList.add('unrevealed', 'flagged');
                t.innerHTML = '<span class="material-icons-round" style="font-size:inherit">flag</span>';
            } else { t.classList.add('unrevealed'); }
        }
    }
}

// ---- WIN / LOSE ----
function onWin() {
    stopTimer();
    playWinSound();
    const emoji = document.getElementById('emoji-btn');
    if (emoji) emoji.querySelector('.material-icons-round').textContent = 'sentiment_very_satisfied';
    const score = Math.max(100, Math.round(1000 * game.numMines / Math.max(1, elapsedSeconds)));
    document.getElementById('win-score').textContent = score;
    document.getElementById('win-time').textContent = formatTime(elapsedSeconds);
    document.getElementById('win-mines').textContent = game.numMines + '/' + game.numMines;
    saveScoreToServer(currentLevel, score, elapsedSeconds);
    setTimeout(() => showScreen('screen-win'), 600);
}
function onLose(hitR, hitC) {
    stopTimer();
    playExplosionSound();
    doVibrate([100, 50, 200, 50, 300]); // pattern vibration for explosion
    const emoji = document.getElementById('emoji-btn');
    if (emoji) emoji.querySelector('.material-icons-round').textContent = 'sentiment_very_dissatisfied';
    for (let i = 0; i < game.rows; i++) for (let j = 0; j < game.cols; j++) if (game.board[i][j].isMine) game.board[i][j].isRevealed = true;
    renderGrid();
    document.getElementById('lose-time').textContent = formatTime(elapsedSeconds);
    document.getElementById('lose-mines').textContent = Math.max(0, game.numMines - game.flagCount);
    // Wait for explosion sound to finish, then play losing sound and show result
    setTimeout(() => {
        playLoseSound();
        showScreen('screen-lose');
    }, 1500);
}

// ---- SCORES API ----
async function fetchScores() {
    try { const r = await fetch('/api/scores'); return await r.json(); } catch { return {}; }
}
async function saveScoreToServer(level, score, time) {
    try {
        const scores = await fetchScores();
        if (!scores[level]) scores[level] = { recent: [], best: null };
        if (Array.isArray(scores[level])) scores[level] = { recent: scores[level], best: null };
        scores[level].recent.unshift({ score, time });
        if (scores[level].recent.length > 5) scores[level].recent = scores[level].recent.slice(0, 5);
        if (!scores[level].best || score > scores[level].best.score) {
            scores[level].best = { score, time };
        }
        await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scores) });
    } catch (e) { console.error('Save score failed:', e); }
}

async function resetScores() {
    const confirmed = await showConfirmModal('Bạn có chắc muốn xóa toàn bộ thành tích?');
    if (!confirmed) return;
    try { await fetch('/api/scores', { method: 'DELETE' }); } catch { }
    showToast('Đã xóa toàn bộ thành tích', 'success');
    renderLeaderboard();
}

async function renderLeaderboard() {
    const container = document.getElementById('leaderboard-content');
    const scores = await fetchScores();
    let html = '';
    const allLevels = { ...LEVELS, custom: { label: 'TÙY CHỈNH', size: 'N×N' } };
    for (const [key, cfg] of Object.entries(allLevels)) {
        let data = scores[key];
        if (!data) { data = { recent: [], best: null }; }
        if (Array.isArray(data)) data = { recent: data, best: null };
        html += `<div class="lb-level"><h3>${cfg.label} (${cfg.size})</h3>`;
        if (data.best) {
            html += `<div class="lb-best"><span class="lb-best-label">🏆 Tốt nhất</span><span>${data.best.score} điểm — ${formatTime(data.best.time)}</span></div>`;
        }
        if (!data.recent || data.recent.length === 0) {
            html += '<div class="lb-empty">Chưa có thành tích</div>';
        } else {
            data.recent.forEach((item, i) => {
                html += `<div class="lb-item"><span class="lb-rank">#${i + 1}</span><span class="lb-score">${item.score} điểm</span><span class="lb-time">${formatTime(item.time)}</span></div>`;
            });
        }
        html += '</div>';
    }
    container.innerHTML = html;
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('ms-theme') || 'light');
    setBoardStyle(localStorage.getItem('ms-boardstyle') || 'classic');
    setBombStyle(localStorage.getItem('ms-bombstyle') || 'bomb');
    setNumColor(localStorage.getItem('ms-numcolor') || 'classic');
    const ss = localStorage.getItem('ms-sound'), sv = localStorage.getItem('ms-vibrate');
    if (ss !== null) { soundEnabled = ss === 'true'; document.getElementById('sound-toggle').checked = soundEnabled; }
    if (sv !== null) { vibrateEnabled = sv === 'true'; document.getElementById('vibrate-toggle').checked = vibrateEnabled; }
    preloadSounds(); // Pre-load all sound effects
    // Load SFX volume
    const savedSfxVol = localStorage.getItem('ms-sfx-volume');
    if (savedSfxVol !== null) {
        sfxVolume = parseInt(savedSfxVol) / 100;
        document.getElementById('sfx-volume').value = savedSfxVol;
        document.getElementById('sfx-volume-val').textContent = savedSfxVol + '%';
    }
    // Load Music settings
    const savedMusicVol = localStorage.getItem('ms-music-volume');
    if (savedMusicVol !== null) {
        musicVolume = parseInt(savedMusicVol) / 100;
        document.getElementById('music-volume').value = savedMusicVol;
        document.getElementById('music-volume-val').textContent = savedMusicVol + '%';
    }
    const savedMusic = localStorage.getItem('ms-music');
    if (savedMusic === 'true') {
        musicEnabled = true;
        document.getElementById('music-toggle').checked = true;
        // Don't auto-start music - browser blocks autoplay. Start on first interaction.
    }
    window.addEventListener('resize', () => { if (game && !game.gameOver) { buildGrid(); renderGrid(); } });
});
