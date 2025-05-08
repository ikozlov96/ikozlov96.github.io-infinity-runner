/**
 * PhysicsConstants.js
 * Файл содержит сильно модифицированные физические константы для аркадного геймплея
 */

const PhysicsConstants = {
    // Общие настройки
    WORLD: {
        // Масштаб: сколько пикселей в метре
        PIXELS_PER_METER: 100,

        // СИЛЬНО УМЕНЬШЕННАЯ гравитация для аркадного геймплея!
        // Это уже не реалистичная физика, а игровая
        GRAVITY: 980, // Прямое значение в пикселях/с²

        // Базовая скорость игры (прямое значение)
        BASE_GAME_SPEED: 300, // пикселей/с

        // Максимальная скорость игры
        MAX_GAME_SPEED: 900, // пикселей/с

        // Инкремент ускорения
        ACCELERATION_INCREMENT: 0.05,

        // FPS игры
        TARGET_FPS: 60
    },

    // Настройки персонажа
    PLAYER: {
        // Физические параметры персонажа
        MASS: 1, // Очень легкий для лучшего контроля
        WIDTH: 50, // Прямые значения в пикселях
        HEIGHT: 50,

        // ЭКСТРЕМАЛЬНО высокая сила прыжка для аркадного геймплея
        JUMP_VELOCITY: 600, // Прямое значение в пикселях/с

        // Дополнительные множители больше не нужны
        JUMP_FORCE_MULTIPLIER: 1.0,

        // Множитель для двойного прыжка (% от основного)
        DOUBLE_JUMP_MULTIPLIER: 0.9, // Почти как основной

        // Множители для улучшения физики падения
        FALL_MULTIPLIER: 1.2, // Быстрее падать, но не слишком
        LOW_JUMP_MULTIPLIER: 1.1, // Для короткого прыжка

        // Начальная сила отскока
        BOUNCE: 0.0 // Без отскока для лучшего контроля
    },

    // Настройки препятствий
    OBSTACLES: {
        // Базовая скорость препятствий
        BASE_SPEED: 300, // пикселей/с

        // Физические размеры препятствий (в пикселях)
        SIZES: {
            SMALL: { WIDTH: 50, HEIGHT: 50 },
            DEFAULT: { WIDTH: 70, HEIGHT: 70 },
            TALL: { WIDTH: 50, HEIGHT: 100 },
            LONG: { WIDTH: 100, HEIGHT: 50 },
            COIN: { RADIUS: 20 }
        },

        // Интервалы появления (в миллисекундах)
        SPAWN_INTERVALS: {
            OBSTACLE_BASE: 2000,
            OBSTACLE_MIN: 800,
            COIN_BASE: 3000,
            COIN_MIN: 1500
        }
    },

    // Улучшения
    UPGRADES: {
        // Максимальные уровни улучшений
        MAX_LEVELS: {
            JUMP_HEIGHT: 5,
            SPEED: 5,
            COIN_MULTIPLIER: 3
        },

        // Множители улучшений
        INCREMENT: {
            JUMP_HEIGHT: 0.2,
            SPEED: 0.1,
            COIN_MULTIPLIER: 1
        },

        // Стоимость улучшений
        COSTS: {
            JUMP_HEIGHT: 50,
            SPEED: 75,
            COIN_MULTIPLIER: 100
        }
    },

    // УПРОЩЕННЫЕ ФУНКЦИИ - больше не используем преобразования физических величин
    // Эти методы оставлены для совместимости, но возвращают прямые значения

    convertToGameUnits: function(realValue) {
        return realValue; // Просто возвращаем как есть
    },

    convertToRealUnits: function(gameValue) {
        return gameValue; // Просто возвращаем как есть
    },

    // Получение текущей силы прыжка с учетом улучшений
    getJumpForce: function(upgradeLevel) {
        return this.PLAYER.JUMP_VELOCITY * (1 + (upgradeLevel - 1) * this.UPGRADES.INCREMENT.JUMP_HEIGHT);
    },

    // Получение текущей скорости игры с учетом улучшений
    getGameSpeed: function(upgradeLevel, speedMultiplier) {
        const baseSpeed = this.OBSTACLES.BASE_SPEED;
        const upgradeBonus = (upgradeLevel - 1) * this.UPGRADES.INCREMENT.SPEED;
        return baseSpeed * (1 + upgradeBonus) * speedMultiplier;
    }
};

// Экспорт констант для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsConstants;
}