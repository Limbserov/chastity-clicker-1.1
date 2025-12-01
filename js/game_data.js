// Файл: js/game_data.js

// =================================================================
// 1. ПУТИ К ВАШИМ АКТИВАМ (Изображения, Звуки)
// КЛЮЧЕВАЯ КОМАНДА: Обновите эти пути, используя вашу структуру папок /assets/...
// =================================================================
export const ASSET_PATHS = {
    // Изображения (Заглушки)
    BELT_THUMB_1: 'assets/images/belts/belt_1_thumb.png',
    BELT_THUMB_2: 'assets/images/belts/belt_2_thumb.png',
    BELT_THUMB_3: 'assets/images/belts/belt_3_thumb.png',
    BACKGROUND_DEFAULT: 'assets/images/backgrounds/default_bg.jpg',
    BACKGROUND_SISSY: 'assets/images/backgrounds/sissy_bg.jpg',
    BACKGROUND_METAL: 'assets/images/backgrounds/metal_bg.jpg',
    
    // Звуки (Заглушки)
    INTRO_SOUND: 'assets/audio/intro.mp3', 
    CLICK_SOUND: 'assets/audio/click.mp3', 
};


// =================================================================
// 2. КОНСТАНТЫ КОНТЕНТА (ПОЯСА)
// КЛЮЧЕВАЯ КОМАНДА: Добавляйте новые пояса здесь!
// =================================================================
export const BELT_DATA = {
    'belt_1': { 
        id: 'belt_1', 
        name: 'Пояс верности 1 (Старт)', 
        description: 'Простой, но надежный. Начальный уровень защиты. Минимальный бонус.', 
        cost: 0, 
        clickValue: 1, // Очки за клик
        imagePath: ASSET_PATHS.BELT_THUMB_1, 
    },
    'belt_2': { 
        id: 'belt_2', 
        name: 'Пояс верности 2 (Кожа)', 
        description: 'Более серьезный и плотный. Увеличивает очки за клик.', 
        cost: 200, 
        clickValue: 3, 
        imagePath: ASSET_PATHS.BELT_THUMB_2,
    },
    'belt_3': { 
        id: 'belt_3', 
        name: 'Пояс верности 3 (Металл)', 
        description: 'Холодный металл и максимальная покорность. Высокий бонус за клик.', 
        cost: 500, 
        clickValue: 6, 
        imagePath: ASSET_PATHS.BELT_THUMB_3,
    },
    // КЛЮЧЕВАЯ КОМАНДА: ДОБАВИТЬ НОВЫЕ ПОЯСА ЗДЕСЬ
};

// =================================================================
// 3. КОНСТАНТЫ КОНТЕНТА (ФОНЫ/СТИЛИ)
// КЛЮЧЕВАЯ КОМАНДА: Добавляйте новые стили здесь!
// =================================================================
export const STYLE_DATA = {
    'style_default': { 
        id: 'style_default', 
        name: 'Стандартный', 
        cost: 0, 
        path: ASSET_PATHS.BACKGROUND_DEFAULT
    },
    'style_sissy': { 
        id: 'style_sissy', 
        name: 'Sissy Style', 
        cost: 300, 
        path: ASSET_PATHS.BACKGROUND_SISSY
    },
    'style_metal': { 
        id: 'style_metal', 
        name: 'Индустриальный', 
        cost: 400, 
        path: ASSET_PATHS.BACKGROUND_METAL
    },
    // КЛЮЧЕВАЯ КОМАНДА: ДОБАВИТЬ НОВЫЕ СТИЛИ ЗДЕСЬ
};

// =================================================================
// 4. СПИСОК ПРИКАЗОВ
// КЛЮЧЕВАЯ КОМАНДА: Добавляйте новые приказы здесь!
// =================================================================
export const COMMANDS_LIST = [
    "Посмотри свой любимый порно-ролик ровно 3 минуты",
    "Шлёпай себя по ягодице до красноты 30 ударов",
    "Ущепни себя за соски, и держи ровно минуту",
    "Собери по больше слюны, плюнь на пол и слежи",
    "Напиши себе на животе "Покорный раб" помадой",
    "Прими холодный душ в течение 5 минут",
];

// =================================================================
// 5. ДОСТИЖЕНИЯ
// КЛЮЧЕВАЯ КОМАНДА: Добавляйте новые достижения здесь!
// =================================================================
export const ACHIEVEMENTS_LIST = [
    { id: "time_1h", name: "Первый час", description: "Провести в заточении 1 час (60 минут).", conditionType: "TIME", conditionValue: 60, isUnlocked: false },
    { id: "task_1", name: "Первое задание", description: "Взять и выполнить первое задание.", conditionType: "TASK", conditionValue: 1, isUnlocked: false },
    { id: "agree_1", name: "Послушный", description: "Согласиться выполнить приказ 1 раз.", conditionType: "AGREE", conditionValue: 1, isUnlocked: false },
    { id: "clicks_100", name: "Кликер-Мастер", description: "Совершить 100 кликов по поясу.", conditionType: "CLICKS", conditionValue: 100, isUnlocked: false },
    // КЛЮЧЕВАЯ КОМАНДА: ДОБАВИТЬ НОВЫЕ ДОСТИЖЕНИЯ ЗДЕСЬ (Не забудьте добавить тип "CLICKS" в main.js)
];