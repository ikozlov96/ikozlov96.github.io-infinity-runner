// Инициализация Telegram Mini Apps
let tgApp;
try {
    tgApp = window.Telegram.WebApp;
    // ИСПРАВЛЕНО: Принудительно расширяем на весь экран и ждем готовности
    tgApp.expand();
    tgApp.ready();
    console.log('Telegram WebApp инициализирован');
} catch (e) {
    console.log('Telegram WebApp не обнаружен, запуск в обычном режиме');
}

// Создаем заглушку для Telegram API при тестировании
if (!window.Telegram) {
    window.Telegram = {
        WebApp: {
            expand: () => console.log('Заглушка для Telegram.WebApp.expand'),
            ready: () => console.log('Заглушка для Telegram.WebApp.ready'),
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
function initTelegramUser() {
    // Проверяем параметры URL для случаев, когда игра запускается из Telegram Games
    const urlParams = new URLSearchParams(window.location.search);
    const tgParamUserId = urlParams.get('user_id') || urlParams.get('id');

    // Если есть параметры в URL, используем их
    if (tgParamUserId) {
        console.log(`Telegram Game User ID from URL: ${tgParamUserId}`);
        return tgParamUserId;
    }

    // Иначе пытаемся получить из WebApp
    if (tgApp && tgApp.initDataUnsafe) {
        const user = tgApp.initDataUnsafe.user;
        if (user) {
            console.log(`Telegram User: ${user.first_name} (ID: ${user.id})`);
            return user.id;
        }
    }

    return 'local_user'; // Для локального тестирования
}

// ИСПРАВЛЕНО: Получаем текущую ширину и высоту окна для правильного масштабирования
const getWindowSize = () => {
    if (tgApp) {
        // Для Telegram берем размеры из viewport
        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        return { width: viewportWidth, height: viewportHeight };
    } else {
        // Для обычного браузера
        return { width: 800, height: 600 };
    }
};

// ИСПРАВЛЕНО: Используем динамическое определение размеров
const windowSize = getWindowSize();

// Конфигурация игры с использованием физических констант
const config = {
    type: Phaser.AUTO,
    // ИСПРАВЛЕНО: Используем размер окна для canvas
    width: windowSize.width,
    height: windowSize.height,
    parent: 'game-container',
    // ИСПРАВЛЕНО: Добавляем scale mode для лучшего масштабирования
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
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
    // ИСПРАВЛЕНО: Добавляем небольшую задержку, чтобы убедиться, что Telegram.WebApp полностью инициализирован
    setTimeout(() => {
        // Загружаем сохраненный прогресс
        gameData.loadProgress();

        // Создаем игру
        const game = new Phaser.Game(config);

        // Делаем глобальные данные доступными для сцен
        game.registry.set('gameData', gameData);
        game.registry.set('physicsConstants', PhysicsConstants);

        // Передача высокого счета в Telegram Game
        window.TelegramGameProxy = {
            shareScore: function() {
                if (window.TelegramGameProxy && gameData.highScore > 0) {
                    window.TelegramGameProxy.postEvent('SCORE', gameData.highScore);
                    console.log('Score sent to Telegram:', gameData.highScore);
                }
            }
        };

        // Добавляем обработчик сообщений от Telegram Games API
        window.addEventListener('message', function(e) {
            if (e.data && e.data.eventName === 'SCORE') {
                gameData.highScore = Math.max(gameData.highScore, e.data.eventData);
                gameData.saveProgress();
            }
        });

        // ИСПРАВЛЕНО: Обрабатываем изменение размера окна для адаптивности
        window.addEventListener('resize', () => {
            // Автоматически обрабатывается Phaser.Scale.RESIZE
            console.log('Размер окна изменен');
        });

        // ИСПРАВЛЕНО: Для мобильных устройств добавляем обработчик ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Даем время на перерисовку после изменения ориентации
                game.scale.refresh();
            }, 200);
        });
    }, 100);
});