// Файл: js/main.js

import * as data from './game_data.js';

// =================================================================
// 1. ПЕРЕМЕННЫЕ ИГРЫ И СОСТОЯНИЕ
// =================================================================

let score = 0;
let level = 1;
let timerRemainingMillis = 0;
let isTaskActive = false;
let isRestTimerActive = false;
let toleranceLevel = 0;
let totalTimeMinutes = 0; // Общее время в минутах
let totalScoreCollected = 0;
let tasksCompletedCount = 0;
let agreeCount = 0;
let refuseCount = 0;
let orgasmSuccessCount = 0;
let orgasmForbiddenCount = 0;
let totalClicksCount = 0;
let currentTaskLengthMinutes = 0;
let lastCommandTimeMillis = 0;
let commandIndex = 0; 

let unlockedBelts = ['belt_1'];
let currentBeltId = 'belt_1';
let unlockedStyles = ['style_default'];
let currentStyleId = 'style_default';
let achievementsState = data.ACHIEVEMENTS_LIST;

let taskInterval; 
let restInterval; 
let autoSaveInterval; 
let clickSound = new Audio(data.ASSET_PATHS.CLICK_SOUND);

// =================================================================
// 2. УТИЛИТЫ UI и Telegram
// =================================================================

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function showMessage(text) {
    // Использование Telegram Web App для красивых уведомлений
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
        window.Telegram.WebApp.showAlert(text);
    } else {
        alert(text);
    }
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    // Сброс полей ввода времени при закрытии
    if (id === 'taskModal') {
        document.getElementById('customTimeInput').style.display = 'none';
        document.getElementById('programTimeDisplay').style.display = 'none';
        document.getElementById('optionProgram').classList.remove('selected');
        document.getElementById('optionCustom').classList.remove('selected');
        timerRemainingMillis = 0;
    }
    if (id === 'orgasmModal') {
        document.getElementById('orgasmResult').textContent = '';
    }
}

// --- ОСНОВНОЕ ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('levelDisplay').textContent = level;
    document.getElementById('mainTimerDisplay').textContent = formatTime(timerRemainingMillis);
    document.getElementById('currentBeltName').textContent = data.BELT_DATA[currentBeltId].name;

    // Обновление фона (стиля)
    document.body.style.backgroundImage = `url(${data.STYLE_DATA[currentStyleId].path})`;
    document.body.style.backgroundColor = (currentStyleId === 'style_default') ? '#2c3e50' : ''; 

    // Обновление картинки пояса
    document.getElementById('chastityBelt').src = data.BELT_DATA[currentBeltId].imagePath;
    
    // Обновление шкалы терпимости
    const bar = document.getElementById('toleranceBar');
    bar.style.width = toleranceLevel.toFixed(0) + '%';
    bar.textContent = `Терпимость: ${toleranceLevel.toFixed(0)}%`;
    
    // Управление видимостью кнопок
    document.getElementById('takeTaskBtn').style.display = isTaskActive ? 'none' : 'block';
    document.getElementById('startTaskBtn').style.display = isTaskActive ? 'none' : 'block';
    document.getElementById('startTaskBtn').disabled = timerRemainingMillis <= 0 || isTaskActive;

    // Появление кнопки "Новый приказ"
    const tenMinutes = 600000;
    const canShowCommand = isTaskActive && (Date.now() - lastCommandTimeMillis > tenMinutes) && timerRemainingMillis > 0;
    document.getElementById('newCommandSection').style.display = canShowCommand ? 'flex' : 'none';

    // Таймер отдыха
    const beltBtn = document.getElementById('chastityBelt');
    beltBtn.style.cursor = isRestTimerActive ? 'not-allowed' : 'pointer';
    beltBtn.title = isRestTimerActive ? 'Активен таймер отдыха' : 'Нажми для клика';
}


// =================================================================
// 3. ЛОГИКА ТАЙМЕРА ЗАДАНИЯ
// =================================================================

function getRandomTaskDuration() {
    // В минутах
    const levelMap = [
        { min: 15, max: 180 }, // 1-3 уровень
        { min: 60, max: 300 }, // 4-5 уровень
        { min: 300, max: 720 }, // 6-7 уровень
        { min: 720, max: 2880 }, // 8-9 уровень
        { min: 1440, max: 10080 }, // 10+ уровень
    ];

    let rangeIndex = 0;
    if (level >= 10) rangeIndex = 4;
    else if (level >= 8) rangeIndex = 3;
    else if (level >= 6) rangeIndex = 2;
    else if (level >= 4) rangeIndex = 1;
    
    const range = levelMap[rangeIndex];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min; 
}

function selectTimeOption(option) {
    const programBtn = document.querySelector('#optionProgram');
    const customBtn = document.querySelector('#optionCustom');
    const customInput = document.getElementById('customTimeInput');
    const programDisplay = document.getElementById('programTimeDisplay');
    
    programBtn.classList.remove('selected');
    customBtn.classList.remove('selected');
    
    if (option === 'program') {
        programBtn.classList.add('selected');
        customInput.style.display = 'none';
        
        const durationMinutes = getRandomTaskDuration();
        const suggestedTime = durationMinutes * 60000; 
        document.getElementById('suggestedTime').textContent = formatTime(suggestedTime);
        programDisplay.style.display = 'block';

        timerRemainingMillis = suggestedTime;
        document.getElementById('startTaskBtn').disabled = false; 
        
        closeModal('taskModal');
        showMessage("Вы согласились на время. Нажмите 'Начать задание'!");
        
    } else if (option === 'custom') {
        customBtn.classList.add('selected');
        programDisplay.style.display = 'none';
        customInput.style.display = 'block';
        document.getElementById('startTaskBtn').disabled = true; 
    }
    updateUI();
}

document.getElementById('customTime').addEventListener('input', function() {
    const timeStr = this.value; 
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
        const totalMillis = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
        if (totalMillis > 0) {
            timerRemainingMillis = totalMillis;
            document.getElementById('startTaskBtn').disabled = false;
        } else {
            document.getElementById('startTaskBtn').disabled = true;
        }
    }
    updateUI();
});

function startGame() {
    if (timerRemainingMillis <= 0 || isTaskActive) return;
    
    isTaskActive = true;
    tasksCompletedCount++;
    currentTaskLengthMinutes = timerRemainingMillis / 60000;
    lastCommandTimeMillis = 0; 
    
    clearInterval(taskInterval);
    taskInterval = setInterval(() => {
        if (timerRemainingMillis <= 0) {
            clearInterval(taskInterval);
            endTask();
            return;
        }
        
        timerRemainingMillis -= 1000;
        totalTimeMinutes++; // Увеличиваем каждую секунду
        
        // Предупреждение за 5 минут
        if (timerRemainingMillis > 0 && timerRemainingMillis <= 300000 && timerRemainingMillis > 299000) {
             showMessage("Потерпи еще чуть-чуть");
        }
        
        // Проверка на появление кнопки "Новый приказ"
        const tenMinutes = 600000;
        if (lastCommandTimeMillis === 0 && (currentTaskLengthMinutes * 60000 - timerRemainingMillis) >= tenMinutes) {
            document.getElementById('newCommandSection').style.display = 'flex';
        }

        updateUI();
        checkAllAchievements();
    }, 1000);
    
    showMessage("Задание начато! Время в заточении пошло.");
    updateUI();
}

function endTask() {
    isTaskActive = false;
    
    const pointsEarned = Math.round(currentTaskLengthMinutes);
    score += pointsEarned;
    totalScoreCollected += pointsEarned;
    
    showMessage("Задание выполненно!\nНачислено " + pointsEarned + " очков покорности.");
    
    document.getElementById('takeTaskBtn').style.display = 'block';
    document.getElementById('startTaskBtn').style.display = 'block';
    document.getElementById('startTaskBtn').disabled = true;
    document.getElementById('newCommandSection').style.display = 'none';
    
    updateUI();
}

function shortenTime(percentage) {
    if (!isTaskActive) return;

    const reductionMillis = timerRemainingMillis * percentage;
    timerRemainingMillis -= reductionMillis;
    
    showMessage(`Таймер сокращен на ${percentage * 100}% (${formatTime(reductionMillis)})!`);
    
    clearInterval(taskInterval);
    startGame(); 
    
    updateUI();
}

// =================================================================
// 4. ЛОГИКА КЛИКЕРА И ТЕРПИМОСТИ
// =================================================================

function onChastityBeltClick() {
    if (isRestTimerActive) {
        showMessage("Нельзя кликать! Активен таймер отдыха.");
        return;
    }
    
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    const beltData = data.BELT_DATA[currentBeltId];
    let pointsToEarn = beltData.clickValue; 
    
    if (Math.random() < 0.05) { 
        pointsToEarn += 10;
    }
    
    score += pointsToEarn;
    totalClicksCount++;

    const fillRate = (11 - Math.min(level, 10)); // Заполнение шкалы, зависит от уровня
    
    if (totalClicksCount % 3 === 0) { 
        toleranceLevel += fillRate;
        if (toleranceLevel >= 100) {
            toleranceLevel = 100;
            startRestTimer();
        }
    }

    updateUI();
}

function startRestTimer() {
    isRestTimerActive = true;
    toleranceLevel = 0;
    let restDurationMillis = 3600000; // 1 час

    clearInterval(restInterval);
    restInterval = setInterval(() => {
        if (restDurationMillis <= 0) {
            clearInterval(restInterval);
            isRestTimerActive = false;
            document.getElementById('restTimerDisplay').textContent = "";
            showMessage("Таймер отдыха завершен! Можете снова кликать.");
            updateUI();
            return;
        }
        restDurationMillis -= 1000;
        document.getElementById('restTimerDisplay').textContent = "ОТДЫХ: " + formatTime(restDurationMillis);
    }, 1000);
    
    showMessage("Шкала Терпимости заполнена! Начат таймер отдыха (1 час).");
    updateUI();
}

// =================================================================
// 5. ЛОГИКА ПРИКАЗОВ
// =================================================================

function openCommandModal() {
    // 10 минут между командами
    if (!isTaskActive || Date.now() - lastCommandTimeMillis < 600000) return;

    const command = data.COMMANDS_LIST[commandIndex];
    document.getElementById('commandText').textContent = command;
    commandIndex = (commandIndex + 1) % data.COMMANDS_LIST.length; 

    openModal('commandModal');
}

function applyCommand(action) {
    if (!isTaskActive) return;
    
    const remaining = timerRemainingMillis;
    let percentage = 0.15;
    let changeMillis = remaining * percentage;
    
    if (action === 'agree') {
        timerRemainingMillis -= changeMillis;
        const pointsEarned = Math.round(changeMillis / 60000);
        score += pointsEarned;
        agreeCount++;
        showMessage(`Согласие принято! Таймер сокращен на ${formatTime(changeMillis)}. Начислено ${pointsEarned} очков.`);
    } else if (action === 'refuse') {
        timerRemainingMillis += changeMillis;
        refuseCount++;
        showMessage(`Отказ принят! Таймер продлен на ${formatTime(changeMillis)}.`);
    }
    
    lastCommandTimeMillis = Date.now();
    clearInterval(taskInterval);
    startGame();
    closeModal('commandModal');
    updateUI();
}


// =================================================================
// 6. МАГАЗИН И ИНВЕНТАРЬ (Логика)
// =================================================================

function getNextLevelCost() {
    const baseCost = 1000;
    const levelIndex = level - 1;
    return Math.round(baseCost * Math.pow(1.3, levelIndex));
}
        
function increaseLevel() {
    const cost = getNextLevelCost();
    if (score >= cost) {
        score -= cost;
        level++;
        showMessage(`Уровень повышен до ${level}!`);
        updateUI();
        populateShopModal();
    } else {
        showMessage(`Недостаточно очков. Нужно ${cost} очков.`);
    }
}

function buyBelt(beltId) {
    const belt = data.BELT_DATA[beltId];
    if (unlockedBelts.includes(beltId)) return;
    
    if (score >= belt.cost) {
        score -= belt.cost;
        unlockedBelts.push(beltId);
        showMessage(`Вы купили "${belt.name}"!`);
        equipBelt(beltId);
        closeModal('beltDetailModal');
        populateShopModal();
        updateUI();
    } else {
        showMessage(`Недостаточно очков. Требуется ${belt.cost}.`);
    }
}

function equipBelt(beltId) {
    if (unlockedBelts.includes(beltId)) {
        currentBeltId = beltId;
        showMessage(`Вы надели "${data.BELT_DATA[beltId].name}". Бонус за клик изменен!`);
        updateUI();
        closeModal('beltDetailModal');
    }
}

function buyStyle(styleId) {
    const style = data.STYLE_DATA[styleId];
    if (unlockedStyles.includes(styleId)) return;
    
    if (score >= style.cost) {
        score -= style.cost;
        unlockedStyles.push(styleId);
        showMessage(`Вы купили фон "${style.name}"!`);
        equipStyle(styleId);
        closeModal('beltDetailModal');
        populateShopModal();
        updateUI();
    } else {
        showMessage(`Недостаточно очков. Требуется ${style.cost}.`);
    }
}

function equipStyle(styleId) {
    if (unlockedStyles.includes(styleId)) {
        currentStyleId = styleId;
        showMessage(`Вы сменили фон на "${data.STYLE_DATA[styleId].name}".`);
        updateUI();
        closeModal('beltDetailModal');
    }
}

// =================================================================
// 7. МАГАЗИН И ИНВЕНТАРЬ (Заполнение UI)
// =================================================================

function showBeltDetail(itemId, type) {
    let item;
    let isOwned;
    
    if (type === 'belt') {
        item = data.BELT_DATA[itemId];
        isOwned = unlockedBelts.includes(itemId);
        
        document.getElementById('beltDetailName').textContent = item.name;
        document.getElementById('beltDetailDescription').textContent = item.description;
        document.getElementById('beltDetailValue').textContent = item.clickValue; 

        if (!isOwned) {
            document.getElementById('beltDetailBuyBtn').style.display = 'block';
            document.getElementById('beltDetailEquipBtn').style.display = 'none';
            document.getElementById('beltDetailBuyBtn').textContent = `Купить за ${item.cost}`;
            document.getElementById('beltDetailBuyBtn').onclick = () => buyBelt(itemId);
            document.getElementById('beltDetailStatus').textContent = 'Статус: Не куплен';
        } else {
            document.getElementById('beltDetailBuyBtn').style.display = 'none';
            document.getElementById('beltDetailEquipBtn').style.display = (currentBeltId === itemId) ? 'none' : 'block';
            document.getElementById('beltDetailEquipBtn').onclick = () => equipBelt(itemId);
            document.getElementById('beltDetailStatus').textContent = (currentBeltId === itemId) ? 'Статус: АКТИВЕН' : 'Статус: Куплен';
        }

    } else if (type === 'style') {
        item = data.STYLE_DATA[itemId];
        isOwned = unlockedStyles.includes(itemId);
        
        document.getElementById('beltDetailName').textContent = item.name + ' (Фон)';
        document.getElementById('beltDetailDescription').textContent = `Стоимость: ${item.cost} очков.`;
        document.getElementById('beltDetailValue').textContent = ' (Нет)'; 
        
        if (!isOwned) {
            document.getElementById('beltDetailBuyBtn').style.display = 'block';
            document.getElementById('beltDetailEquipBtn').style.display = 'none';
            document.getElementById('beltDetailBuyBtn').textContent = `Купить за ${item.cost}`;
            document.getElementById('beltDetailBuyBtn').onclick = () => buyStyle(itemId);
            document.getElementById('beltDetailStatus').textContent = 'Статус: Не куплен';
        } else {
            document.getElementById('beltDetailBuyBtn').style.display = 'none';
            document.getElementById('beltDetailEquipBtn').style.display = (currentStyleId === itemId) ? 'none' : 'block';
            document.getElementById('beltDetailEquipBtn').onclick = () => equipStyle(itemId);
            document.getElementById('beltDetailStatus').textContent = (currentStyleId === itemId) ? 'Статус: АКТИВЕН' : 'Статус: Куплен';
        }
    }
    
    openModal('beltDetailModal');
}


function populateShopModal() {
    document.getElementById('shopScoreDisplay').textContent = score;
    document.getElementById('shopLevelDisplay').textContent = level;
    document.getElementById('nextLevelCostDisplay').textContent = getNextLevelCost();

    // 1. Пояса Верности
    const beltGrid = document.getElementById('beltShopGrid');
    beltGrid.innerHTML = ''; 
    Object.values(data.BELT_DATA).forEach(belt => {
        const isOwned = unlockedBelts.includes(belt.id);
        const el = document.createElement('div');
        el.className = 'modal-item-btn';
        el.innerHTML = `
            <img src="${belt.imagePath}" alt="${belt.name}" style="width: 80px; height: 80px; object-fit: cover;">
            <p>${belt.name}</p>
            <p style="font-size: 0.9em; color: ${isOwned ? '#2ecc71' : '#f1c40f'};">${isOwned ? 'КУПЛЕНО' : belt.cost}</p>
        `;
        el.onclick = () => showBeltDetail(belt.id, 'belt');
        beltGrid.appendChild(el);
    });
    
    // 2. Стили (Фоны)
    const styleGrid = document.getElementById('styleShopGrid');
    styleGrid.innerHTML = ''; 
    Object.values(data.STYLE_DATA).forEach(style => {
        const isOwned = unlockedStyles.includes(style.id);
        const el = document.createElement('div');
        el.className = 'modal-item-btn';
        el.innerHTML = `
            <div style="height: 80px; background-image: url(${style.path}); background-size: cover; background-position: center; border-radius: 5px;"></div>
            <p>${style.name}</p>
            <p style="font-size: 0.9em; color: ${isOwned ? '#2ecc71' : '#f1c40f'};">${isOwned ? 'КУПЛЕНО' : style.cost}</p>
        `;
        el.onclick = () => showBeltDetail(style.id, 'style');
        styleGrid.appendChild(el);
    });
}

function populateInventoryModal() {
    // 1. Инвентарь Поясов
    const beltInvGrid = document.getElementById('beltInventoryGrid');
    beltInvGrid.innerHTML = '';
    unlockedBelts.forEach(beltId => {
        const belt = data.BELT_DATA[beltId];
        const isActive = currentBeltId === beltId;
        const el = document.createElement('div');
        el.className = 'modal-item-btn' + (isActive ? ' selected' : '');
        el.innerHTML = `
            <img src="${belt.imagePath}" alt="${belt.name}" style="width: 80px; height: 80px; object-fit: cover;">
            <p>${belt.name}</p>
            <p style="font-size: 0.9em; color: ${isActive ? '#f1c40f' : '#bdc3c7'};">${isActive ? 'АКТИВЕН' : 'Надеть'}</p>
        `;
        el.onclick = () => showBeltDetail(belt.id, 'belt');
        beltInvGrid.appendChild(el);
    });

    // 2. Инвентарь Стилей
    const styleInvGrid = document.getElementById('styleInventoryGrid');
    styleInvGrid.innerHTML = '';
    unlockedStyles.forEach(styleId => {
        const style = data.STYLE_DATA[styleId];
        const isActive = currentStyleId === styleId;
        const el = document.createElement('div');
        el.className = 'modal-item-btn' + (isActive ? ' selected' : '');
        el.innerHTML = `
            <div style="height: 80px; background-image: url(${style.path}); background-size: cover; background-position: center; border-radius: 5px;"></div>
            <p>${style.name}</p>
            <p style="font-size: 0.9em; color: ${isActive ? '#f1c40f' : '#bdc3c7'};">${isActive ? 'АКТИВЕН' : 'Выбрать'}</p>
        `;
        el.onclick = () => showBeltDetail(style.id, 'style');
        styleInvGrid.appendChild(el);
    });
}


// =================================================================
// 8. ДОСТИЖЕНИЯ
// =================================================================

function checkAchievement(achievement) {
    if (achievement.isUnlocked) return; 

    let conditionMet = false;

    switch (achievement.conditionType) {
        case "TIME":
            if (totalTimeMinutes / 60 >= achievement.conditionValue) {
                conditionMet = true;
            }
            break;
        case "TASK":
            if (tasksCompletedCount >= achievement.conditionValue) {
                conditionMet = true;
            }
            break;
        case "AGREE":
            if (agreeCount >= achievement.conditionValue) {
                conditionMet = true;
            }
            break;
        case "CLICKS":
            if (totalClicksCount >= achievement.conditionValue) {
                conditionMet = true;
            }
            break;
        // КЛЮЧЕВАЯ КОМАНДА: Добавляйте новые типы условий здесь!
    }

    if (conditionMet) {
        achievement.isUnlocked = true;
        showMessage(`Новое достижение получено: "${achievement.name}"!`);
        score += 100; // Награда
        updateUI();
    }
}

function checkAllAchievements() {
    achievementsState.forEach(checkAchievement);
}

function populateAchievementsModal() {
    const list = document.getElementById('achievementsList');
    list.innerHTML = '';
    
    achievementsState.forEach(ach => {
        const el = document.createElement('div');
        el.style.padding = '10px';
        el.style.margin = '5px 0';
        el.style.borderLeft = ach.isUnlocked ? '5px solid #2ecc71' : '5px solid #e74c3c';
        el.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        el.style.borderRadius = '5px';
        
        const statusText = ach.isUnlocked ? '🔓 Разблокировано' : '🔒 Заблокировано';
        const color = ach.isUnlocked ? '#2ecc71' : '#e74c3c';
        
        el.innerHTML = `
            <p style="font-weight: bold; color: ${color};">${ach.name}</p>
            <p style="font-size: 0.9em; color: #bdc3c7;">${ach.description}</p>
            <p style="font-size: 0.8em; margin-top: 5px;">${statusText}</p>
        `;
        list.appendChild(el);
    });
}

// =================================================================
// 9. СОХРАНЕНИЕ И ЗАГРУЗКА ИГРЫ (LocalStorage)
// =================================================================

function saveGame() {
    const gameState = {
        score,
        level,
        timerRemainingMillis,
        isTaskActive,
        isRestTimerActive,
        toleranceLevel,
        totalTimeMinutes,
        totalScoreCollected,
        tasksCompletedCount,
        agreeCount,
        refuseCount,
        orgasmSuccessCount,
        orgasmForbiddenCount,
        totalClicksCount,
        lastCommandTimeMillis,
        currentBeltId,
        currentStyleId,
        unlockedBelts,
        unlockedStyles,
        achievementsState,
    };
    try {
        localStorage.setItem('chastityClickerSave', JSON.stringify(gameState));
    } catch (e) {
        console.error("Ошибка при сохранении игры:", e);
    }
}

function loadGame() {
    try {
        const savedState = localStorage.getItem('chastityClickerSave');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            score = state.score || 0;
            level = state.level || 1;
            timerRemainingMillis = state.timerRemainingMillis || 0;
            isTaskActive = state.isTaskActive || false;
            isRestTimerActive = state.isRestTimerActive || false;
            toleranceLevel = state.toleranceLevel || 0;
            totalTimeMinutes = state.totalTimeMinutes || 0;
            totalScoreCollected = state.totalScoreCollected || 0;
            tasksCompletedCount = state.tasksCompletedCount || 0;
            agreeCount = state.agreeCount || 0;
            refuseCount = state.refuseCount || 0;
            orgasmSuccessCount = state.orgasmSuccessCount || 0;
            orgasmForbiddenCount = state.orgasmForbiddenCount || 0;
            totalClicksCount = state.totalClicksCount || 0;
            lastCommandTimeMillis = state.lastCommandTimeMillis || 0;
            currentBeltId = state.currentBeltId || 'belt_1';
            currentStyleId = state.currentStyleId || 'style_default';
            unlockedBelts = state.unlockedBelts || ['belt_1'];
            unlockedStyles = state.unlockedStyles || ['style_default'];
            
            // Загрузка достижений: объединяем новые с сохраненными
            if (state.achievementsState) {
                data.ACHIEVEMENTS_LIST.forEach(newAch => {
                    const existing = state.achievementsState.find(a => a.id === newAch.id);
                    if (existing) {
                        newAch.isUnlocked = existing.isUnlocked;
                    }
                });
                achievementsState = data.ACHIEVEMENTS_LIST;
            } else {
                achievementsState = data.ACHIEVEMENTS_LIST;
            }

            if (isTaskActive) {
                if (timerRemainingMillis < 0) timerRemainingMillis = 0;
                startGame();
            }
            if (isRestTimerActive) {
                startRestTimer();
            }
            
            showMessage("Прогресс загружен!");

        } 
    } catch (e) {
        console.error("Ошибка при загрузке игры:", e);
    }
}

// =================================================================
// 10. ТЕЛЕГРАМ И ВЫХОД
// =================================================================

function sendDataToTelegram(dataToSend) {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.ready) {
        // Отправка JSON-строки боту
        window.Telegram.WebApp.sendData(JSON.stringify(dataToSend));
    }
}

function handleGameExit() {
    saveGame(); 
    
    // Отправка статистики боту (этот функционал требует настройки бота)
    const gameState = {
        command: 'SAVE_STATE',
        user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'unknown_user',
        final_score: score,
        total_time: totalTimeMinutes
    };
    
    sendDataToTelegram(gameState);
    
    // Закрытие окна Web App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.close();
    } else {
        // Для отладки вне Telegram
        showMessage("Игра сохранена. Выход.");
    }
}

// =================================================================
// 11. СТАРТ И ИНИЦИАЛИЗАЦИЯ
// =================================================================

function initEventListeners() {
    // Главные кнопки
    document.getElementById('chastityBelt').addEventListener('click', onChastityBeltClick);
    document.getElementById('takeTaskBtn').addEventListener('click', () => openModal('taskModal'));
    document.getElementById('startTaskBtn').addEventListener('click', startGame);
    document.getElementById('newCommandBtn').addEventListener('click', openCommandModal);
    document.getElementById('chastityBeltShortenBtn').addEventListener('click', () => shortenTime(0.5));
    document.getElementById('plugShortenBtn').addEventListener('click', () => shortenTime(0.5));
    document.getElementById('exitGameBtn').addEventListener('click', handleGameExit);

    // Модальные окна: закрытие
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        const modalId = btn.closest('.modal').id;
        btn.addEventListener('click', () => closeModal(modalId));
    });

    // Кнопки задания: выбор времени
    document.querySelector('#optionProgram').addEventListener('click', () => selectTimeOption('program'));
    document.querySelector('#optionCustom').addEventListener('click', () => selectTimeOption('custom'));

    // Кнопки приказов: согласие/отказ
    document.getElementById('commandAgreeBtn').addEventListener('click', () => applyCommand('agree'));
    document.getElementById('commandRefuseBtn').addEventListener('click', () => applyCommand('refuse'));
    
    // Кнопка Уровня
    document.getElementById('levelUpBtn').addEventListener('click', increaseLevel);

    // Кнопки меню внизу
    document.getElementById('spendPointsBtn').addEventListener('click', () => { populateShopModal(); openModal('shopModal'); });
    document.getElementById('inventoryBtn').addEventListener('click', () => { populateInventoryModal(); openModal('inventoryModal'); });
    
    document.getElementById('statsBtn').addEventListener('click', () => {
        document.getElementById('statTotalTime').textContent = formatTime(totalTimeMinutes * 60000);
        document.getElementById('statTotalScore').textContent = totalScoreCollected;
        document.getElementById('statOrgasmSuccess').textContent = orgasmSuccessCount;
        document.getElementById('statOrgasmForbidden').textContent = orgasmForbiddenCount;
        openModal('statsModal');
    });
    
    document.getElementById('achievementsBtn').addEventListener('click', () => {
        populateAchievementsModal();
        openModal('achievementsModal');
    });
    
    // Кнопка запроса оргазма
    document.getElementById('orgasmRequestBtn').addEventListener('click', () => openModal('orgasmModal'));
    document.querySelectorAll('#orgasmModal .modal-grid button').forEach(btn => {
        btn.addEventListener('click', function() {
            const prob = parseFloat(this.getAttribute('data-prob'));
            const cost = parseInt(this.getAttribute('data-cost'));
            const resultDisplay = document.getElementById('orgasmResult');
            
            if (score < cost) {
                resultDisplay.textContent = "Недостаточно очков для запроса!";
                resultDisplay.style.color = '#e74c3c';
                return;
            }
            
            score -= cost;
            if (Math.random() < prob) {
                resultDisplay.textContent = "✅ Оргазм разрешен! (Успех)";
                resultDisplay.style.color = '#2ecc71';
                orgasmSuccessCount++;
            } else {
                resultDisplay.textContent = "❌ Запрос отклонен! Оргазм запрещен!";
                resultDisplay.style.color = '#e74c3c';
                orgasmForbiddenCount++;
            }
            updateUI();
        });
    });

    // Управление вкладками в Магазине (Shop Tabs)
    document.querySelectorAll('#shopModal .tab-menu button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('#shopModal .tab-menu button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.getElementById('shopTab_upgrades').style.display = 'none';
            document.getElementById('shopTab_belts').style.display = 'none';
            document.getElementById('shopTab_styles').style.display = 'none';
            document.getElementById('shopTab_' + tabId).style.display = 'block';
        });
    });

    // Управление вкладками в Инвентаре (Inventory Tabs)
    document.querySelectorAll('#inventoryModal .tab-menu button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-inv-tab');
            document.querySelectorAll('#inventoryModal .tab-menu button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.getElementById('invBelts').style.display = 'none';
            document.getElementById('invStyles').style.display = 'none';
            document.getElementById(tabId).style.display = 'block';
        });
    });
}


function initGame() {
    loadGame();
    initEventListeners();
    updateUI();
    
    // Скрытие заставки
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('mainGame').style.display = 'flex';
    
    // Запуск автосохранения
    autoSaveInterval = setInterval(saveGame, 10000); 

    // Инициализация Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready(); 
        window.Telegram.WebApp.MainButton.setText('Игра сохранена').hide();
    }
}

// --- Запуск игры после загрузки страницы (Инициация аудио) ---
window.onload = function() {
    const splashScreen = document.getElementById('splashScreen');
    const startButton = document.getElementById('startButton');
    const introSound = new Audio(data.ASSET_PATHS.INTRO_SOUND);

    startButton.style.display = 'block'; 
    
    startButton.addEventListener('click', () => {
        introSound.play().catch(() => {}); 
        
        setTimeout(initGame, 3000); 
    }, { once: true });
    
    // Запускаем игру, если пользователь не нажал кнопку через 5 секунд (на случай проблем с аудио)
    setTimeout(() => {
        if (splashScreen.style.display !== 'none') {
            initGame();
        }
    }, 5000); 
};