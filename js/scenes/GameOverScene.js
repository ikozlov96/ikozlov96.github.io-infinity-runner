class GameOverScene extends Phaser.Scene {
    constructor() {
        super({key: 'GameOverScene'});
    }

    init(data) {
        // Получаем данные из предыдущей сцены
        this.score = data.score || 0;
        this.coins = data.coins || 0;
    }

    create() {
        // Получаем данные игры из реестра
        this.gameData = this.registry.get('gameData');

        // Настройка кнопок Telegram
        if (tgApp) {
            if (tgApp.MainButton) tgApp.MainButton.hide();
            if (tgApp.BackButton) {
                tgApp.BackButton.show();
                tgApp.BackButton.onClick(() => {
                    this.scene.start('MenuScene');
                });
            }

            // Устанавливаем текущую сцену для системы навигации
            this.registry.set('currentScene', 'GameOverScene');

            // Отправка результата игры в нативный Telegram
            if (tgApp.sendData) {
                const gameResult = JSON.stringify({
                    score: this.score,
                    coins: this.coins,
                    type: 'game_result'
                });
                tgApp.sendData(gameResult);
            }
        }

        // Фон
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x121212)
            .setOrigin(0, 0);

        // Текст "Игра окончена"
        this.add.text(this.cameras.main.centerX, 150, 'ИГРА ОКОНЧЕНА', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Текст результата
        this.add.text(this.cameras.main.centerX, 250, `Счет: ${this.score}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Текст о рекорде
        const isHighScore = this.score >= this.gameData.highScore;
        this.add.text(this.cameras.main.centerX, 300, isHighScore ? 'Новый рекорд!' : `Рекорд: ${this.gameData.highScore}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: isHighScore ? '#FFD700' : '#cccccc'
        }).setOrigin(0.5);

        // Текст о собранных монетах
        this.add.text(this.cameras.main.centerX, 350, `Монеты: ${this.coins}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Текст о общем количестве монет
        this.add.text(this.cameras.main.centerX, 390, `Всего монет: ${this.gameData.coins}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Кнопка "Играть снова"
        const replayButton = this.add.rectangle(
            this.cameras.main.centerX,
            450,
            200,
            60,
            0x4285F4
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, 450, 'ИГРАТЬ СНОВА', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик нажатия на кнопку "Играть снова"
        replayButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Интеграция с MainButton Telegram для кнопки "Играть снова"
        if (tgApp && tgApp.MainButton) {
            replayButton.on('pointerover', () => {
                tgApp.MainButton.setText('ИГРАТЬ СНОВА');
                tgApp.MainButton.show();
                tgApp.MainButton.onClick(() => {
                    this.scene.start('GameScene');
                });
            });

            replayButton.on('pointerout', () => {
                tgApp.MainButton.hide();
            });
        }

        // Кнопка "В главное меню"
        const menuButton = this.add.rectangle(
            this.cameras.main.centerX,
            530,
            200,
            60,
            0xEA4335
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, 530, 'В МЕНЮ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик нажатия на кнопку "В главное меню"
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Интеграция с MainButton Telegram для кнопки "В меню"
        if (tgApp && tgApp.MainButton) {
            menuButton.on('pointerover', () => {
                tgApp.MainButton.setText('В МЕНЮ');
                tgApp.MainButton.show();
                tgApp.MainButton.onClick(() => {
                    this.scene.start('MenuScene');
                });
            });
        }

        // Проверка на то, хватает ли монет для улучшений
        this.checkForUpgrades();

        // Предложение поделиться результатом в Telegram
        if (tgApp && this.score > 10) {
            this.createShareButton();
        }
    }

    createShareButton() {
        // Кнопка "Поделиться"
        const shareButton = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.height - 80,
            200,
            60,
            0x0088cc // Цвет Telegram
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, this.cameras.main.height - 80, 'ПОДЕЛИТЬСЯ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик для кнопки "Поделиться"
        shareButton.on('pointerdown', () => {
            this.shareResult();
        });

        // Интеграция с кнопками Telegram
        if (tgApp && tgApp.MainButton) {
            shareButton.on('pointerover', () => {
                tgApp.MainButton.setText('ПОДЕЛИТЬСЯ');
                tgApp.MainButton.show();
                tgApp.MainButton.onClick(() => {
                    this.shareResult();
                });
            });
        }
    }

    shareResult() {
        if (tgApp) {
            // Отправка счета в Telegram Games API
            if (window.TelegramGameProxy) {
                window.TelegramGameProxy.shareScore();
            }

            // Отправка результата в Telegram Mini Apps API
            if (tgApp.sendData) {
                const gameResult = JSON.stringify({
                    score: this.score,
                    coins: this.coins,
                    type: 'game_result'
                });
                tgApp.sendData(gameResult);
            }
        }
    }

    checkForUpgrades() {
        // Если у игрока достаточно монет для улучшений
        if (this.gameData.coins >= 50) {
            // Кнопка "Улучшения"
            const upgradeButton = this.add.rectangle(
                this.cameras.main.centerX,
                600,
                200,
                60,
                0x34A853
            ).setInteractive();

            this.add.text(this.cameras.main.centerX, 600, 'УЛУЧШЕНИЯ', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Обработчик нажатия на кнопку "Улучшения"
            upgradeButton.on('pointerdown', () => {
                this.scene.start('MenuScene');
                // Вызов меню улучшений через событие
                this.time.delayedCall(100, () => {
                    const menuScene = this.scene.get('MenuScene');
                    if (menuScene && menuScene.openUpgradeMenu) {
                        menuScene.openUpgradeMenu();
                    }
                });
            });

            // Интеграция с MainButton Telegram
            if (tgApp && tgApp.MainButton) {
                upgradeButton.on('pointerover', () => {
                    tgApp.MainButton.setText('УЛУЧШЕНИЯ');
                    tgApp.MainButton.show();
                    tgApp.MainButton.onClick(() => {
                        this.scene.start('MenuScene');
                        // Вызов меню улучшений через событие
                        this.time.delayedCall(100, () => {
                            const menuScene = this.scene.get('MenuScene');
                            if (menuScene && menuScene.openUpgradeMenu) {
                                menuScene.openUpgradeMenu();
                            }
                        });
                    });
                });
            }
        }
    }
}