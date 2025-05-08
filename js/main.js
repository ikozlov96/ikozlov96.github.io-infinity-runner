// Инициализация Telegram Mini Apps
let tgApp;
try {
    tgApp = window.Telegram.WebApp;
    tgApp.expand(); // Расширяем на весь экран
} catch (e) {
    console.log('Telegram WebApp не обнаружен, запуск в обычном режиме');
}

// Создаем заглушку для Telegram API при тестировании
if (!window.Telegram) {
    window.Telegram = {
        WebApp: {
            expand: () => console.log('Заглушка для Telegram.WebApp.expand'),
            isExpanded: true,
            CloudStorage: null
        }
    }
}

// Конфигурация игры с использованием физических констант
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            // Используем реальную гравитацию, переведенную в игровые единицы
            gravity: {y: PhysicsConstants.convertToGameUnits(PhysicsConstants.WORLD.GRAVITY)},
            debug: false
        }
    },
    fps: {
        target: PhysicsConstants.WORLD.TARGET_FPS,
        forceSetTimeOut: true
    },
    scene: [MenuScene, GameScene, GameOverScene]
};

// Глобальные переменные игры
const gameData = {
    score: 0,
    highScore: 0,
    coins: 0,
    // Система прогресса
    upgrades: {
        jumpHeight: 1,
        speed: 1,
        coinMultiplier: 1
    },
    // Загрузка сохранений
    loadProgress: function () {
        try {
            const savedData = localStorage.getItem('infinityRunnerProgress');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.highScore = parsedData.highScore || 0;
                this.coins = parsedData.coins || 0;
                this.upgrades = parsedData.upgrades || {
                    jumpHeight: 1,
                    speed: 1,
                    coinMultiplier: 1
                };
            }
        } catch (e) {
            console.error('Ошибка загрузки прогресса:', e);
        }
    },
    // Сохранение прогресса
    saveProgress: function () {
        try {
            const dataToSave = {
                highScore: this.highScore,
                coins: this.coins,
                upgrades: this.upgrades
            };
            localStorage.setItem('infinityRunnerProgress', JSON.stringify(dataToSave));

            // Если есть Telegram Mini Apps, можно сохранить в облачное хранилище
            if (tgApp && tgApp.CloudStorage) {
                tgApp.CloudStorage.setItem('infinityRunnerProgress', JSON.stringify(dataToSave));
            }
        } catch (e) {
            console.error('Ошибка сохранения прогресса:', e);
        }
    }
};

// Инициализация игры при загрузке страницы
window.addEventListener('load', () => {
    // Загружаем сохраненный прогресс
    gameData.loadProgress();

    // Создаем игру
    const game = new Phaser.Game(config);

    // Делаем глобальные данные доступными для сцен
    game.registry.set('gameData', gameData);
    game.registry.set('physicsConstants', PhysicsConstants);

    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        resizeGame(game);
    });

    // Начальное изменение размера
    resizeGame(game);
});

// Функция для адаптивности игры
function resizeGame(game) {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const aspectRatio = config.width / config.height;
    let newWidth, newHeight;

    if (containerWidth / containerHeight > aspectRatio) {
        newHeight = containerHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = containerWidth;
        newHeight = newWidth / aspectRatio;
    }

    game.scale.resize(newWidth, newHeight);
    game.scale.setZoom(newWidth / config.width);
}