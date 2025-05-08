// Инициализация Telegram Mini Apps
let tgApp;
try {
    tgApp = window.Telegram.WebApp;
    tgApp.expand(); // Расширяем на весь экран
    console.log('Telegram WebApp инициализирован');
} catch (e) {
    console.log('Telegram WebApp не обнаружен, запуск в обычном режиме');
}

// Создаем заглушку для Telegram API при тестировании
if (!window.Telegram) {
    window.Telegram = {
        WebApp: {
            expand: () => console.log('Заглушка для Telegram.WebApp.expand'),
            isExpanded: true,
            CloudStorage: null,
            MainButton: {
                show: () => console.log('MainButton.show заглушка'),
                hide: () => console.log('MainButton.hide заглушка'),
                setText: () => console.log('MainButton.setText заглушка'),
                onClick: () => console.log('MainButton.onClick заглушка')
            },
            BackButton: {
                show: () => console.log('BackButton.show заглушка'),
                hide: () => console.log('BackButton.hide заглушка'),
                onClick: () => console.log('BackButton.onClick заглушка')
            }
        }
    }
}

// Функция инициализации пользователя Telegram
// Перемещена перед использованием в gameData
function initTelegramUser() {
    if (tgApp && tgApp.initDataUnsafe) {
        const user = tgApp.initDataUnsafe.user;
        if (user) {
            // Можно сохранять прогресс под ID пользователя
            console.log(`Telegram User: ${user.first_name} (ID: ${user.id})`);
            return user.id;
        }
    }
    return 'local_user'; // Для локального тестирования
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
            // Используем гравитацию из физических констант
            gravity: {y: PhysicsConstants.WORLD.GRAVITY},
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
    userId: initTelegramUser(),
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
        let loaded = false;

        // Пытаемся загрузить из Telegram Cloud
        if (tgApp && tgApp.CloudStorage) {
            try {
                tgApp.CloudStorage.getItem('infinityRunnerProgress')
                    .then(value => {
                        if (value) {
                            const parsedData = JSON.parse(value);
                            this.highScore = parsedData.highScore || 0;
                            this.coins = parsedData.coins || 0;
                            this.upgrades = parsedData.upgrades || {
                                jumpHeight: 1,
                                speed: 1,
                                coinMultiplier: 1
                            };
                            loaded = true;
                            console.log('Прогресс загружен из облака Telegram');
                        }
                    })
                    .catch(e => console.error('Ошибка загрузки из облака Telegram:', e));
            } catch (e) {
                console.error('Ошибка при попытке загрузить из облака Telegram:', e);
            }
        }

        // Если не получилось из Telegram или прогресс еще не загружен, пробуем из localStorage
        if (!loaded) {
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
                console.error('Ошибка загрузки прогресса из localStorage:', e);
            }
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

            // Если есть Telegram Mini Apps, сохраняем в облачное хранилище с обработкой ошибок
            if (tgApp && tgApp.CloudStorage) {
                tgApp.CloudStorage.setItem('infinityRunnerProgress', JSON.stringify(dataToSave))
                    .then(() => console.log('Прогресс сохранен в облаке Telegram'))
                    .catch(e => console.error('Ошибка сохранения в облаке Telegram:', e));
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

    // Настройка кнопки "Назад" в Telegram
    if (tgApp && tgApp.BackButton) {
        tgApp.BackButton.hide(); // По умолчанию скрыта

        // Слушатель события по изменению сцены
        game.events.on('changedata-currentScene', (parent, value) => {
            if (value === 'MenuScene') {
                tgApp.BackButton.hide();
            } else {
                tgApp.BackButton.show();
                tgApp.BackButton.onClick(() => {
                    game.scene.start('MenuScene');
                });
            }
        });
    }

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