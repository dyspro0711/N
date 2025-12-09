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
    { id: 'ice',     name: 'FROST BITE',     price: 500, class: 'skin-ice', preview: 'preview-ice' },
    { id: 'chromatic', name: 'CHROMATIC',    price: 1000, class: 'skin-chromatic', preview: 'preview-chromatic' }
];

const BACKGROUND_ITEMS = [
    { id: 'bg_default', name: 'DARK VOID', price: 0, class: 'bg-skin-default', preview: 'preview-bg-default' },
    { id: 'bg_space',   name: 'DEEP SPACE', price: 500, class: 'bg-skin-space', preview: 'preview-bg-space' },
    { id: 'bg_cyber',   name: 'CYBER GRID', price: 1500, class: 'bg-skin-cyber', preview: 'preview-bg-cyber' },
    { id: 'bg_sunset',  name: 'VAPORWAVE',  price: 2000, class: 'bg-skin-sunset', preview: 'preview-bg-sunset' }
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
    { level: 10, speed: 13, target: 45000 },
    { level: 11, speed: 10, target: 50000 },
    { level: 12, speed: 10, target: 60000 },
    { level: 13, speed: 11, target: 60000 } 
];

// --- 변수 ---
let userSettingSpeed = 5;
let infinitySpeed = 5; 

let userKeys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK']; 
let bindingTrack = -1;

let gameMode = 'practice';
let currentStage = 1;      
let targetScore = 0;       

let score = 0;
let points = 0; 
let earnedPoints = 0; 
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

let ownedSkins = ['default'];
let equippedSkin = 'default';
let ownedBackgrounds = ['bg_default'];
let equippedBackground = 'bg_default';
let currentShopTab = 'note'; 

let _seed = 1;
function setSeed(s) { _seed = s; }
function seededRandom() {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
}

function loadData() {
    if(localStorage.getItem('neonBeatInfiniteHighScore')) highScore = parseInt(localStorage.getItem('neonBeatInfiniteHighScore'));
    if(localStorage.getItem('neonBeatClearedStages')) clearedStages = JSON.parse(localStorage.getItem('neonBeatClearedStages'));
    if(localStorage.getItem('neonBeatPoints')) points = parseInt(localStorage.getItem('neonBeatPoints'));
    if(localStorage.getItem('neonBeatOwnedSkins')) ownedSkins = JSON.parse(localStorage.getItem('neonBeatOwnedSkins'));
    if(localStorage.getItem('neonBeatEquippedSkin')) equippedSkin = localStorage.getItem('neonBeatEquippedSkin');
    if(localStorage.getItem('neonBeatOwnedBackgrounds')) ownedBackgrounds = JSON.parse(localStorage.getItem('neonBeatOwnedBackgrounds'));
    if(localStorage.getItem('neonBeatEquippedBackground')) equippedBackground = localStorage.getItem('neonBeatEquippedBackground');
    updatePointDisplay();
}

function saveData() {
    localStorage.setItem('neonBeatInfiniteHighScore', highScore);
    localStorage.setItem('neonBeatClearedStages', JSON.stringify(clearedStages));
    localStorage.setItem('neonBeatPoints', points);
    localStorage.setItem('neonBeatOwnedSkins', JSON.stringify(ownedSkins));
    localStorage.setItem('neonBeatEquippedSkin', equippedSkin);
    localStorage.setItem('neonBeatOwnedBackgrounds', JSON.stringify(ownedBackgrounds));
    localStorage.setItem('neonBeatEquippedBackground', equippedBackground);
}

// ==========================================
// 1. 고정 패턴 생성기 (버그 수정: 롱노트 시간 계산)
// ==========================================
function generateFixedPattern(level) {
    setSeed(level * 100); 
    const pattern = [];
    const duration = 40000 + (level * 2000); 
    
    // 현재 레벨의 속도 가져오기 (시간 계산용)
    const stageInfo = STAGE_DATA.find(d => d.level === level);
    const speed = stageInfo ? stageInfo.speed : 5;
    
    // 속도(px/frame)를 시간(ms/px)으로 변환 (60fps 기준)
    // 1 frame = 16.6ms. speed 10 = 10px/16.6ms = 0.6px/ms
    const pxPerMs = speed * 0.06;

    let baseInterval = Math.max(200, 800 - (level * 50)); 
    if (level >= 11) baseInterval = 180; 

    // --- 스테이지별 패턴 ---
    
    if (level === 13) {
        // [Stage 13] 함정 & 쏟아지는 노트 (Speed 11)
        let t = 1000;
        while(t < duration) {
            let lane = Math.floor(seededRandom() * 4);
            pattern.push({ time: t, track: lane, type: 'normal', length: 35 });
            
            // 함정 (터지면 안됨)
            if (seededRandom() < 0.35) {
                let trapLane = (lane + 1 + Math.floor(seededRandom() * 3)) % 4;
                pattern.push({ time: t, track: trapLane, type: 'trap', length: 35 });
            }
            // 동시타
            if (seededRandom() < 0.25) {
                 let lane2 = (lane + 2) % 4;
                 pattern.push({ time: t, track: lane2, type: 'normal', length: 35 });
            }
            t += 180; // 매우 빠름
        }
    }
    else if (level === 11) {
        // [Stage 11] 엇박자
        let t = 1000;
        while(t < duration) {
            let pType = Math.floor(seededRandom() * 3);
            if (pType === 0) { // 정박
                for(let i=0; i<4; i++) {
                    pattern.push({ time: t, track: Math.floor(seededRandom() * 4), type: 'normal', length: 35 });
                    t += 300;
                }
            } else if (pType === 1) { // 엇박
                for(let i=0; i<4; i++) {
                    let lane = Math.floor(seededRandom() * 4);
                    pattern.push({ time: t, track: lane, type: 'normal', length: 35 });
                    t += 150; 
                    pattern.push({ time: t, track: (lane+1)%4, type: 'normal', length: 35 });
                    t += 450; 
                }
            } else { // 동시
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
        // [Stage 12] 트릴 & 롱노트 (버그 수정됨)
        let t = 1000;
        while(t < duration) {
            let section = Math.floor(seededRandom() * 4);
            if (section === 0) { // 트릴
                let l1 = 1, l2 = 2;
                for(let i=0; i<8; i++) {
                    pattern.push({ time: t, track: (i%2===0 ? l1 : l2), type: 'normal', length: 35 });
                    t += 150;
                }
            } else if (section === 1) { // 계단
                for(let k=0; k<2; k++) {
                    for(let i=0; i<4; i++) {
                        pattern.push({ time: t, track: i, type: 'normal', length: 35 });
                        t += 150;
                    }
                }
            } else if (section === 2) { 
                // [수정] 롱노트 겹침 방지 로직
                let lane = Math.floor(seededRandom() * 4);
                let longLen = 400;
                // 롱노트가 화면을 지나가는 시간 계산
                let timeForLong = longLen / pxPerMs; 
                
                pattern.push({ time: t, track: lane, type: 'long', length: longLen });
                
                // 롱노트 누르는 동안 다른 손 단타
                pattern.push({ time: t + 100, track: (lane+2)%4, type: 'normal', length: 35 });
                pattern.push({ time: t + 300, track: (lane+3)%4, type: 'normal', length: 35 });
                
                // 롱노트가 끝날 때까지 시간 추가 (+여유시간 200ms)
                t += (timeForLong + 200); 
            } else {
                pattern.push({ time: t, track: Math.floor(seededRandom()*4), type: 'normal', length: 35 });
                t += 400;
            }
        }
    } 
    else {
        // [Stage 1 ~ 10]
        for (let t = 1000; t < duration; t += baseInterval) {
            const isLong = seededRandom() < 0.2;
            const track = Math.floor(seededRandom() * 4);
            const len = isLong ? 200 : 35;
            
            pattern.push({ time: t, track: track, type: isLong?'long':'normal', length: len });
            
            // [수정] 롱노트면 그만큼 시간 더 밀기
            if (isLong) {
                let timeForLong = len / pxPerMs;
                t += timeForLong; // 롱노트 길이만큼 시간 추가
            }

            if (level > 5 && seededRandom() < (level * 0.05)) {
                 // 롱노트가 아닐때만 동시타 추가
                 if (!isLong) {
                    pattern.push({ time: t, track: (track + 2) % 4, type: 'normal', length: 35 });
                 }
            }
        }
    }
    pattern.sort((a, b) => a.time - b.time);
    return pattern;
}

// ==========================================
// 2. 상점 및 메뉴 로직
// ==========================================
function openShop() {
    document.getElementById('title-screen').classList.remove('active');
    document.getElementById('shop-screen').classList.remove('hidden');
    document.getElementById('shop-screen').classList.add('active');
    switchShopTab('note');
}

function switchShopTab(tab) {
    currentShopTab = tab;
    const tabs = document.querySelectorAll('.shop-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if(tab === 'note') tabs[0].classList.add('active');
    else tabs[1].classList.add('active');
    renderShop();
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    document.getElementById('shop-points').innerText = `POINTS: ${points}`;

    const items = currentShopTab === 'note' ? SHOP_ITEMS : BACKGROUND_ITEMS;
    const ownedList = currentShopTab === 'note' ? ownedSkins : ownedBackgrounds;
    const equippedId = currentShopTab === 'note' ? equippedSkin : equippedBackground;

    items.forEach(item => {
        const isOwned = ownedList.includes(item.id);
        const isEquipped = equippedId === item.id;
        
        const div = document.createElement('div');
        div.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        div.innerHTML = `
            <div class="item-preview ${item.preview}"></div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${isOwned ? 'OWNED' : item.price + ' P'}</div>
        `;

        const btn = document.createElement('button');
        if (isOwned) {
            btn.className = 'equip-btn';
            btn.innerText = isEquipped ? 'EQUIPPED' : 'EQUIP';
            if (!isEquipped) {
                btn.onclick = () => currentShopTab === 'note' ? equipSkin(item.id) : equipBackground(item.id);
            }
        } else {
            btn.className = 'buy-btn';
            btn.innerText = 'BUY';
            btn.onclick = () => currentShopTab === 'note' ? buySkin(item) : buyBackground(item);
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
    } else alert("Not enough points!");
}
function buyBackground(item) {
    if (points >= item.price) {
        points -= item.price;
        ownedBackgrounds.push(item.id);
        saveData();
        renderShop();
    } else alert("Not enough points!");
}
function equipSkin(id) {
    equippedSkin = id;
    saveData();
    renderShop();
}
function equipBackground(id) {
    equippedBackground = id;
    saveData();
    renderShop();
}
function updatePointDisplay() {
    document.getElementById('user-points').innerText = `POINTS: ${points}`;
}
function applyBackground() {
    const container = document.getElementById('game-container');
    BACKGROUND_ITEMS.forEach(bg => container.classList.remove(bg.class));
    const bgItem = BACKGROUND_ITEMS.find(bg => bg.id === equippedBackground);
    if(bgItem) container.classList.add(bgItem.class);
    else container.classList.add('bg-skin-default');
}

// 화면 전환
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
    infinitySpeed = 5; 
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

// 설정 관련
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

// ==========================================
// 3. 게임 시작/루프
// ==========================================
function startGame() {
    loadData();
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('active');
    applyBackground();
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
            if (infinitySpeed < 15) {
                infinitySpeed += 0.005; 
            }
            currentSpeed = infinitySpeed;
            document.getElementById('current-speed-display').innerText = infinitySpeed.toFixed(1);
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
    
    noteEl.classList.add('note', `col-${trackIdx}`);
    if (isTrap) {
        noteEl.classList.add('trap');
    } else {
        if (isLong) noteEl.classList.add('long');
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
// 5. 게임 루프 (이동)
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
