// --- 상수 설정 ---
const GAME_HEIGHT = 700;
const JUDGMENT_BOTTOM = 100;
const JUDGMENT_Y = GAME_HEIGHT - JUDGMENT_BOTTOM;
const HIT_RANGE_PERFECT = 35;
const HIT_RANGE_GOOD = 70;
const MAX_LIVES = 3;

// --- 상점 아이템 데이터 ---
const SHOP_ITEMS = [
    { id: 'default', name: 'NEON (Default)', price: 0, class: '', preview: 'preview-default' },
    { id: 'gold',    name: 'GOLD RUSH',      price: 100, class: 'skin-gold', preview: 'preview-gold' },
    { id: 'matrix',  name: 'THE MATRIX',     price: 250, class: 'skin-matrix', preview: 'preview-matrix' },
    { id: 'fire',    name: 'INFERNO',        price: 500, class: 'skin-fire', preview: 'preview-fire' },
    { id: 'ice',     name: 'FROST BITE',     price: 500, class: 'skin-ice', preview: 'preview-ice' }
];

// --- 스테이지 데이터 ---
const STAGE_DATA = [
    { level: 1, speed: 3, target: 5000 },
    { level: 2, speed: 4, target: 8000 },
    { level: 3, speed: 5, target: 12000 },
    { level: 4, speed: 6, target: 16000 },
    { level: 5, speed: 7, target: 20000 },
    { level: 6, speed: 8, target: 25000 },
    { level: 7, speed: 9, target: 30000 },
    { level: 8, speed: 10, target: 36000 },
    { level: 9, speed: 11, target: 42000 },
    { level: 10, speed: 13, target: 50000 },
    { level: 11, speed: 10, target: 60000 },
    { level: 12, speed: 10, target: 75000 },
    { level: 13, speed: 11, target: 80000 } 
];

// --- 변수 ---
let userSettingSpeed = 5;
let infinitySpeed = 5; // [NEW] 인피니티 모드 가변 속도

let userKeys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK']; 
let bindingTrack = -1;

let gameMode = 'practice';
let currentStage = 1;      
let targetScore = 0;       

let score = 0;
let points = 0; // [NEW] 소지 포인트
let earnedPoints = 0; // 이번 판에 얻은 포인트
let highScore = 0;
let combo = 0;
let maxCombo = 0;
let lives = 3;
let isPlaying = false;
let isInvincible = false;
let notes = [];
let keyState = [false, false, false, false];
let spawnTimer; 
let animationFrameId;

let stageNoteQueue = []; 
let stageStartTime = 0;
let nextNoteIndex = 0;

let clearedStages = []; 

// [NEW] 스킨 관련 변수
let ownedSkins = ['default'];
let equippedSkin = 'default';

// 시드 기반 랜덤
let _seed = 1;
function setSeed(s) { _seed = s; }
function seededRandom() {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
}

// --- 저장 데이터 로드/저장 ---
function loadData() {
    const savedScore = localStorage.getItem('neonBeatInfiniteHighScore');
    if (savedScore) highScore = parseInt(savedScore);
    
    const savedStages = localStorage.getItem('neonBeatClearedStages');
    if (savedStages) clearedStages = JSON.parse(savedStages);

    const savedPoints = localStorage.getItem('neonBeatPoints');
    if (savedPoints) points = parseInt(savedPoints);

    const savedSkins = localStorage.getItem('neonBeatOwnedSkins');
    if (savedSkins) ownedSkins = JSON.parse(savedSkins);

    const savedEquip = localStorage.getItem('neonBeatEquippedSkin');
    if (savedEquip) equippedSkin = savedEquip;

    updatePointDisplay();
}

function saveData() {
    localStorage.setItem('neonBeatInfiniteHighScore', highScore);
    localStorage.setItem('neonBeatClearedStages', JSON.stringify(clearedStages));
    localStorage.setItem('neonBeatPoints', points);
    localStorage.setItem('neonBeatOwnedSkins', JSON.stringify(ownedSkins));
    localStorage.setItem('neonBeatEquippedSkin', equippedSkin);
}

// ==========================================
// 1. 상점 시스템 (NEW)
// ==========================================
function openShop() {
    document.getElementById('title-screen').classList.remove('active');
    document.getElementById('shop-screen').classList.remove('hidden');
    document.getElementById('shop-screen').classList.add('active');
    renderShop();
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    document.getElementById('shop-points').innerText = `POINTS: ${points}`;

    SHOP_ITEMS.forEach(item => {
        const isOwned = ownedSkins.includes(item.id);
        const isEquipped = equippedSkin === item.id;
        
        const div = document.createElement('div');
        div.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        // 아이템 HTML
        div.innerHTML = `
            <div class="item-preview ${item.preview}"></div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${isOwned ? 'OWNED' : item.price + ' P'}</div>
        `;

        // 버튼 생성
        const btn = document.createElement('button');
        if (isOwned) {
            btn.className = 'equip-btn';
            btn.innerText = isEquipped ? 'EQUIPPED' : 'EQUIP';
            if (!isEquipped) {
                btn.onclick = () => equipSkin(item.id);
            }
        } else {
            btn.className = 'buy-btn';
            btn.innerText = 'BUY';
            btn.onclick = () => buySkin(item);
        }
        
        div.appendChild(btn);
        grid.appendChild(div);
    });
}

function buySkin(item) {
    if (points >= item.price) {
        points -= item.price;
        ownedSkins.push(item.id);
        saveData();
        renderShop();
    } else {
        alert("Not enough points!");
    }
}

function equipSkin(id) {
    equippedSkin = id;
    saveData();
    renderShop();
}

function updatePointDisplay() {
    document.getElementById('user-points').innerText = `POINTS: ${points}`;
}

// ==========================================
// 2. 메뉴 및 화면 전환
// ==========================================

function openModeSelect() {
    document.getElementById('title-screen').classList.remove('active');
    document.getElementById('mode-select-screen').classList.remove('hidden');
    document.getElementById('mode-select-screen').classList.add('active');
}

function backToTitle() {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('title-screen').classList.add('active');
    updatePointDisplay();
}

function startPracticeMode() {
    gameMode = 'practice';
    document.getElementById('mode-select-screen').classList.remove('active');
    document.getElementById('mode-title').innerText = "PRACTICE";
    document.getElementById('target-box').classList.add('hidden');
    document.getElementById('infinity-stats').classList.add('hidden'); 
    document.getElementById('speed-box').classList.add('hidden');
    startGame();
}

function startInfinityMode() {
    gameMode = 'infinity';
    infinitySpeed = 5; // 초기 속도 5
    document.getElementById('mode-select-screen').classList.remove('active');
    document.getElementById('mode-title').innerText = "INFINITY";
    document.getElementById('target-box').classList.add('hidden');
    document.getElementById('infinity-stats').classList.remove('hidden');
    document.getElementById('speed-box').classList.remove('hidden');
    document.getElementById('current-speed-display').innerText = infinitySpeed.toFixed(1);
    document.getElementById('high-score').innerText = highScore;
    startGame();
}

function openStageSelect() {
    initStageButtons();
    document.getElementById('mode-select-screen').classList.remove('active');
    document.getElementById('stage-select-screen').classList.remove('hidden');
    document.getElementById('stage-select-screen').classList.add('active');
}

function backToModeSelect() {
    isPlaying = false;
    clearTimeout(spawnTimer);
    cancelAnimationFrame(animationFrameId);
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('stage-select-screen').classList.remove('active');
    document.getElementById('stage-select-screen').classList.add('hidden');
    document.getElementById('mode-select-screen').classList.remove('hidden');
    document.getElementById('mode-select-screen').classList.add('active');
}

function initStageButtons() {
    const grid = document.querySelector('.stage-grid');
    grid.innerHTML = '';
    STAGE_DATA.forEach(data => {
        const btn = document.createElement('button');
        btn.className = 'stage-btn';
        btn.innerText = data.level;
        if (clearedStages.includes(data.level)) btn.classList.add('cleared');
        btn.onclick = () => startStageMode(data.level);
        grid.appendChild(btn);
    });
}

function startStageMode(level) {
    gameMode = 'stage';
    currentStage = level;
    
    const data = STAGE_DATA.find(d => d.level === level);
    targetScore = data.target;

    stageNoteQueue = generateFixedPattern(level);
    nextNoteIndex = 0;

    document.getElementById('stage-select-screen').classList.remove('active');
    document.getElementById('mode-title').innerText = `STAGE ${level}`;
    document.getElementById('target-box').classList.remove('hidden');
    document.getElementById('target-score').innerText = targetScore;
    document.getElementById('infinity-stats').classList.add('hidden');
    document.getElementById('speed-box').classList.add('hidden');
    startGame();
}

// 설정 함수 (기존 유지)
function openSettings() { document.getElementById('settings-modal').classList.remove('hidden'); }
function closeSettings() { document.getElementById('settings-modal').classList.add('hidden'); bindingTrack = -1; updateKeyLabels(); }
function changeUserSpeed(amount) {
    userSettingSpeed += amount;
    if (userSettingSpeed < 1) userSettingSpeed = 1;
    if (userSettingSpeed > 15) userSettingSpeed = 15;
    document.getElementById('speed-val').innerText = userSettingSpeed;
}
function startBinding(trackIdx) {
    bindingTrack = trackIdx;
    for(let i=0; i<4; i++) document.getElementById(`key-${i}`).classList.remove('binding');
    document.getElementById(`key-${trackIdx}`).classList.add('binding');
    document.getElementById(`key-${trackIdx}`).innerText = "?";
}
function updateKeyLabels() {
    for(let i=0; i<4; i++) {
        const label = userKeys[i].replace('Key', '').replace('Arrow', '');
        document.getElementById(`key-${i}`).innerText = label;
        document.getElementById(`guide-${i}`).innerText = label;
        document.getElementById(`track-guide-${i}`).innerText = label;
    }
}

// 패턴 생성 (기존 유지)
function generateFixedPattern(level) {
    setSeed(level * 100); 
    const pattern = [];
    const duration = 40000 + (level * 2000); 
    
    let baseInterval = Math.max(200, 800 - (level * 50)); 
    if (level >= 11) baseInterval = 180; 

    if (level === 13) {
        let t = 1000;
        while(t < duration) {
            let lane = Math.floor(seededRandom() * 4);
            pattern.push({ time: t, track: lane, type: 'normal', length: 35 });
            if (seededRandom() < 0.3) {
                let trapLane = (lane + 1 + Math.floor(seededRandom() * 3)) % 4;
                pattern.push({ time: t, track: trapLane, type: 'trap', length: 35 });
            }
            if (seededRandom() < 0.2) {
                 let lane2 = (lane + 2) % 4;
                 pattern.push({ time: t, track: lane2, type: 'normal', length: 35 });
            }
            t += 200;
        }
    }
    else if (level === 11) {
        let t = 1000;
        while(t < duration) {
            let pType = Math.floor(seededRandom() * 3);
            if (pType === 0) { 
                for(let i=0; i<4; i++) {
                    pattern.push({ time: t, track: Math.floor(seededRandom() * 4), type: 'normal', length: 35 });
                    t += 300;
                }
            } else if (pType === 1) { 
                for(let i=0; i<4; i++) {
                    let lane = Math.floor(seededRandom() * 4);
                    pattern.push({ time: t, track: lane, type: 'normal', length: 35 });
                    t += 150; 
                    pattern.push({ time: t, track: (lane+1)%4, type: 'normal', length: 35 });
                    t += 450; 
                }
            } else { 
                for(let i=0; i<2; i++) {
                    let lane = Math.floor(seededRandom() * 4);
                    let lane2 = (lane + 2) % 4;
                    pattern.push({ time: t, track: lane, type: 'normal', length: 35 });
                    pattern.push({ time: t, track: lane2, type: 'normal', length: 35 });
                    t += 600;
                }
            }
        }
    } 
    else if (level === 12) {
        let t = 1000;
        while(t < duration) {
            let section = Math.floor(seededRandom() * 4);
            if (section === 0) { 
                let l1 = 1, l2 = 2;
                for(let i=0; i<8; i++) {
                    pattern.push({ time: t, track: (i%2===0 ? l1 : l2), type: 'normal', length: 35 });
                    t += 150;
                }
            } else if (section === 1) { 
                for(let k=0; k<2; k++) {
                    for(let i=0; i<4; i++) {
                        pattern.push({ time: t, track: i, type: 'normal', length: 35 });
                        t += 150;
                    }
                }
            } else if (section === 2) { 
                let lane = Math.floor(seededRandom() * 4);
                pattern.push({ time: t, track: lane, type: 'long', length: 400 });
                pattern.push({ time: t+100, track: (lane+2)%4, type: 'normal', length: 35 });
                pattern.push({ time: t+300, track: (lane+3)%4, type: 'normal', length: 35 });
                t += 600;
            } else {
                pattern.push({ time: t, track: Math.floor(seededRandom()*4), type: 'normal', length: 35 });
                t += 400;
            }
        }
    } 
    else {
        for (let t = 1000; t < duration; t += baseInterval) {
            const isLong = seededRandom() < 0.2;
            const track = Math.floor(seededRandom() * 4);
            const len = isLong ? 200 : 35;
            pattern.push({ time: t, track: track, type: isLong?'long':'normal', length: len });
            if (level > 5 && seededRandom() < (level * 0.05)) {
                 pattern.push({ time: t, track: (track + 2) % 4, type: 'normal', length: 35 });
            }
        }
    }
    pattern.sort((a, b) => a.time - b.time);
    return pattern;
}

// ==========================================
// 3. 게임 시작/루프
// ==========================================
function startGame() {
    loadData();
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('active');
    
    resetGame();
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('stage-clear-screen').classList.add('hidden');
    showMessage("START!", "#fff");
}

function retryGame() {
    if (gameMode === 'stage') startStageMode(currentStage);
    else if (gameMode === 'infinity') startInfinityMode();
    else startPracticeMode();
}

function nextStage() {
    if (currentStage < 13) startStageMode(currentStage + 1);
    else backToModeSelect();
}

function resetGame() {
    isPlaying = true;
    score = 0;
    earnedPoints = 0;
    combo = 0;
    lives = MAX_LIVES;
    isInvincible = false;
    document.getElementById('game-container').classList.remove('invincible-mode');
    
    notes = [];
    keyState = [false, false, false, false];
    
    stageStartTime = Date.now();

    if (spawnTimer) clearTimeout(spawnTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    document.querySelectorAll('.note').forEach(n => n.remove());
    for(let i=0; i<4; i++) {
        const t = document.getElementById(`track-${i}`);
        t.classList.remove('active', 'holding', 'hit-perfect', 'hit-miss');
    }
    
    updateUI();
    updateLivesUI();
    updateKeyLabels();
    gameLoop();
    spawnLoop();
}

function gameOver() {
    isPlaying = false;
    clearTimeout(spawnTimer);
    cancelAnimationFrame(animationFrameId);
    
    if (gameMode === 'infinity' && score > highScore) {
        highScore = score;
        saveData();
    }
    
    // [NEW] 포인트 정산 (1000점당 1포인트)
    earnedPoints = Math.floor(score / 1000);
    points += earnedPoints;
    saveData();

    document.getElementById('final-score').innerText = score;
    document.getElementById('earned-points').innerText = earnedPoints;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function stageClear() {
    isPlaying = false;
    clearTimeout(spawnTimer);
    cancelAnimationFrame(animationFrameId);

    if (!clearedStages.includes(currentStage)) {
        clearedStages.push(currentStage);
    }
    
    // 포인트 정산
    earnedPoints = Math.floor(score / 1000);
    points += earnedPoints;
    saveData();

    document.getElementById('clear-final-score').innerText = score;
    document.getElementById('clear-earned-points').innerText = earnedPoints;
    document.getElementById('stage-clear-screen').classList.remove('hidden');
}

// ==========================================
// 4. 노트 생성 로직
// ==========================================
function spawnLoop() {
    if (!isPlaying) return;

    if (gameMode === 'stage') {
        const currentTime = Date.now() - stageStartTime;
        while (nextNoteIndex < stageNoteQueue.length) {
            const noteData = stageNoteQueue[nextNoteIndex];
            if (noteData.time > currentTime + 30) {
                spawnTimer = setTimeout(spawnLoop, 10);
                return;
            }
            createNote(noteData.track, noteData.type === 'long', noteData.length, noteData.type === 'trap');
            nextNoteIndex++;
        }
        if (nextNoteIndex >= stageNoteQueue.length) {
             if (notes.length === 0) {
                 if (score < targetScore) gameOver(); 
                 else stageClear();
                 return;
             }
             spawnTimer = setTimeout(spawnLoop, 100);
             return;
        }
    } 
    else {
        let currentSpeed, currentGap;

        if (gameMode === 'infinity') {
            // [NEW] 인피니티 모드 속도 증가 로직
            // 시간이 지날수록, 혹은 노트가 생성될 때마다 속도 증가 (최대 15)
            if (infinitySpeed < 15) {
                infinitySpeed += 0.005; // 천천히 증가
            }
            currentSpeed = infinitySpeed;
            document.getElementById('current-speed-display').innerText = infinitySpeed.toFixed(1);
            
            // 속도가 빠를수록 간격 줄임
            currentGap = 350 - (currentSpeed * 5); 
            if(currentGap < 150) currentGap = 150;
        } else {
            currentSpeed = userSettingSpeed;
            currentGap = (Math.random() * 500 + 400) * (5 / currentSpeed);
        }

        const track = Math.floor(Math.random() * 4);
        const lastNote = notes.slice().reverse().find(n => n.track === track);
        const safeGap = 60 + (currentSpeed * 2); 
        
        if (lastNote && lastNote.y < safeGap) {
            spawnTimer = setTimeout(spawnLoop, 50);
            return;
        }

        const isLong = Math.random() < 0.2;
        const length = isLong ? Math.random() * 200 + 150 : 35;
        createNote(track, isLong, length, false); 

        const nextTime = (gameMode === 'infinity') 
            ? currentGap + (Math.random() * 300 - 50)
            : currentGap;

        spawnTimer = setTimeout(spawnLoop, nextTime);
    }
}

function createNote(trackIdx, isLong, length, isTrap) {
    const trackEl = document.getElementById(`track-${trackIdx}`);
    const noteEl = document.createElement('div');
    
    // [NEW] 스킨 적용 (함정 노트가 아닐 때만)
    noteEl.classList.add('note', `col-${trackIdx}`);
    if (isTrap) {
        noteEl.classList.add('trap');
    } else {
        if (isLong) noteEl.classList.add('long');
        // 스킨 클래스 추가 (equippedSkin이 default가 아니면)
        if (equippedSkin && equippedSkin !== 'default') {
            const item = SHOP_ITEMS.find(i => i.id === equippedSkin);
            if(item) noteEl.classList.add(item.class);
        }
    }
    
    noteEl.style.height = `${length}px`;
    noteEl.style.top = `-${length}px`;
    trackEl.appendChild(noteEl);

    notes.push({
        el: noteEl, track: trackIdx, y: -length, length: length,
        type: isTrap ? 'trap' : (isLong ? 'long' : 'normal'), 
        isHeld: false, processed: false
    });
}

// ==========================================
// 5. 게임 루프
// ==========================================
function gameLoop() {
    if (!isPlaying) return;

    let speed;
    if (gameMode === 'stage') {
        const data = STAGE_DATA.find(d => d.level === currentStage);
        speed = data ? data.speed : 5;
    } else if (gameMode === 'infinity') {
        speed = infinitySpeed;
    } else {
        speed = userSettingSpeed;
    }

    notes.forEach((note, i) => {
        note.y += speed;
        note.el.style.top = `${note.y}px`;
        const headY = note.y + note.length;
        const tailY = note.y;

        if (note.type === 'long' && note.isHeld) {
            let passed = headY - JUDGMENT_Y;
            if (passed > 0) {
                note.el.style.clipPath = `inset(0 0 ${passed}px 0)`;
                if (passed % (20 + speed) < speed) { 
                    score += 10; 
                    updateUI(); 
                    if (gameMode === 'stage') checkStageClear();
                }
            }
        }

        if (!note.processed && headY > JUDGMENT_Y + HIT_RANGE_GOOD) {
            if (!note.isHeld) {
                if (note.type === 'trap') { }
                else {
                    note.processed = true;
                    note.el.style.opacity = 0.3;
                    processMiss(note.track);
                }
            }
        }

        if (note.type === 'long' && note.isHeld) {
            if (tailY > JUDGMENT_Y) {
                processHit(note.track, "PERFECT", 500);
                note.isHeld = false;
                document.getElementById(`track-${note.track}`).classList.remove('holding');
                note.el.remove();
                notes.splice(i, 1);
            }
        }

        if (tailY > GAME_HEIGHT) {
            if (note.el.parentNode) note.el.remove();
            notes.splice(i, 1);
        }
    });
    animationFrameId = requestAnimationFrame(gameLoop);
}

function checkStageClear() {
    if (gameMode === 'stage' && score >= targetScore) stageClear();
}

// --- 입력 처리 ---
document.addEventListener('keydown', e => {
    if (bindingTrack !== -1) {
        userKeys[bindingTrack] = e.code;
        document.getElementById(`key-${bindingTrack}`).classList.remove('binding');
        updateKeyLabels();
        bindingTrack = -1;
        return;
    }
    if (document.getElementById('title-screen').classList.contains('active')) return;
    if (e.code === 'KeyR') {
        if (isPlaying || !document.getElementById('game-over-screen').classList.contains('hidden')) retryGame();
        return;
    }
    if (!isPlaying || e.repeat) return;

    const trackIdx = userKeys.indexOf(e.code);
    if (trackIdx === -1) return;

    keyState[trackIdx] = true;
    document.getElementById(`track-${trackIdx}`).classList.add('active');

    let candidates = notes.filter(n => 
        n.track === trackIdx && !n.processed && !n.isHeld &&
        Math.abs((n.y + n.length) - JUDGMENT_Y) <= HIT_RANGE_GOOD
    );
    candidates.sort((a, b) => Math.abs((a.y + a.length) - JUDGMENT_Y) - Math.abs((b.y + b.length) - JUDGMENT_Y));
    const target = candidates[0];

    if (target) {
        if (target.type === 'trap') {
            target.processed = true;
            target.el.style.display = 'none'; 
            triggerExplosion(trackIdx);
        } 
        else {
            const diff = Math.abs((target.y + target.length) - JUDGMENT_Y);
            const judgment = diff <= HIT_RANGE_PERFECT ? "PERFECT" : "GOOD";
            
            if (target.type === 'normal') {
                processHit(trackIdx, judgment, judgment==="PERFECT"?300:100);
                target.processed = true;
                target.el.remove();
                const idx = notes.indexOf(target);
                if (idx > -1) notes.splice(idx, 1);
            } else { 
                target.isHeld = true;
                document.getElementById(`track-${trackIdx}`).classList.add('holding'); 
                processHit(trackIdx, judgment, 0);
            }
        }
    } else {
        const holding = notes.find(n => n.track === trackIdx && n.isHeld);
        if (!holding) processMiss(trackIdx); 
    }
});

document.addEventListener('keyup', e => {
    if (!isPlaying) return;
    const trackIdx = userKeys.indexOf(e.code);
    if (trackIdx === -1) return;
    keyState[trackIdx] = false;
    const t = document.getElementById(`track-${trackIdx}`);
    t.classList.remove('active');
    t.classList.remove('holding'); 
    const heldNote = notes.find(n => n.track === trackIdx && n.isHeld);
    if (heldNote) {
        heldNote.isHeld = false;
        heldNote.processed = true;
        heldNote.el.style.opacity = 0.5;
    }
});

function triggerExplosion(trackIdx) {
    lives--;
    updateLivesUI();
    showMessage("BOOM!", "#ff00ff");
    combo = 0; 
    updateUI();
    const t = document.getElementById(`track-${trackIdx}`);
    t.classList.add('hit-miss');
    setTimeout(() => t.classList.remove('hit-miss'), 150);
    if (lives <= 0) gameOver();
    else activateInvincibility();
}

function processHit(trackIdx, text, addScore) {
    score += addScore;
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    if (gameMode === 'infinity' && score > highScore) {
        highScore = score;
        document.getElementById('high-score').innerText = highScore;
    }

    const color = text === "PERFECT" ? "#00ffff" : "#00ff00";
    showMessage(text, color);
    
    const t = document.getElementById(`track-${trackIdx}`);
    t.classList.remove('hit-perfect', 'hit-miss');
    void t.offsetWidth;
    t.classList.add('hit-perfect');
    setTimeout(() => t.classList.remove('hit-perfect'), 150);

    const line = document.getElementById('judgment-line');
    line.classList.remove('hit');
    void line.offsetWidth;
    line.classList.add('hit');
    setTimeout(() => line.classList.remove('hit'), 100);

    updateUI();
    if (gameMode === 'stage') checkStageClear();
}

function processMiss(trackIdx) {
    combo = 0;
    updateUI();
    const t = document.getElementById(`track-${trackIdx}`);
    t.classList.remove('hit-perfect', 'hit-miss');
    void t.offsetWidth;
    t.classList.add('hit-miss');
    setTimeout(() => t.classList.remove('hit-miss'), 150);

    if (isInvincible) {
        showMessage("SAFE!", "#aaa");
        return;
    }

    lives--;
    updateLivesUI();
    showMessage("MISS", "#ff3333");
    activateInvincibility();

    if (lives <= 0) gameOver();
}

function activateInvincibility() {
    isInvincible = true;
    const container = document.getElementById('game-container');
    container.classList.add('invincible-mode');
    setTimeout(() => {
        isInvincible = false;
        container.classList.remove('invincible-mode');
    }, 2000);
}

function showMessage(text, color) {
    const el = document.getElementById('message');
    el.innerText = text;
    el.style.color = color;
    el.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    el.style.opacity = 1;
    el.style.transform = "translate(-50%, -50%) scale(1.4)";
    if (el.timer) clearTimeout(el.timer);
    el.timer = setTimeout(() => {
        el.style.opacity = 0;
        el.style.transform = "translate(-50%, -50%) scale(0.8)";
    }, 200);
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('combo').innerText = combo;
    if (gameMode === 'infinity') document.getElementById('max-combo').innerText = maxCombo;
    const c = document.querySelector('.combo-display span');
    c.style.transform = "scale(1.5)";
    setTimeout(() => c.style.transform = "scale(1)", 100);
}

function updateLivesUI() {
    let hearts = "";
    for(let i=0; i<lives; i++) hearts += "❤️";
    document.getElementById('lives').innerText = hearts;
}

loadData();
updateKeyLabels();
