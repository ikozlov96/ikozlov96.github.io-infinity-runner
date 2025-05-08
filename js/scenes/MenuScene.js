class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Получаем данные игры из реестра
        this.gameData = this.registry.get('gameData');

        // Фон
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x121212)
            .setOrigin(0, 0);

        // Заголовок игры
        this.add.text(this.cameras.main.centerX, 100, 'INFINITY RUNNER', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Информация о рекорде
        this.add.text(this.cameras.main.centerX, 180, `Рекорд: ${this.gameData.highScore}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Количество монет
        this.add.text(this.cameras.main.centerX, 220, `Монеты: ${this.gameData.coins}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Кнопка начала игры
        const playButton = this.add.rectangle(
            this.cameras.main.centerX,
            300,
            200,
            60,
            0x4285F4
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, 300, 'ИГРАТЬ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик нажатия на кнопку
        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Кнопка улучшений
        const upgradeButton = this.add.rectangle(
            this.cameras.main.centerX,
            380,
            200,
            60,
            0x34A853
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, 380, 'УЛУЧШЕНИЯ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик нажатия на кнопку улучшений
        upgradeButton.on('pointerdown', () => {
            this.openUpgradeMenu();
        });
    }

    openUpgradeMenu() {
        // Очищаем текущие элементы меню
        this.children.each(child => {
            if (child.type !== 'Rectangle' || child.x !== 0 || child.y !== 0) {
                child.destroy();
            }
        });

        // Заголовок улучшений
        this.add.text(this.cameras.main.centerX, 80, 'УЛУЧШЕНИЯ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Отображение монет
        this.add.text(this.cameras.main.centerX, 130, `Монеты: ${this.gameData.coins}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Улучшения
        this.createUpgradeItem(200, 'Высота прыжка', this.gameData.upgrades.jumpHeight, 5, 50, () => {
            if (this.gameData.coins >= 50) {
                this.gameData.coins -= 50;
                this.gameData.upgrades.jumpHeight += 0.2;
                this.gameData.saveProgress();
                this.openUpgradeMenu(); // Обновляем меню
            }
        });

        this.createUpgradeItem(280, 'Скорость', this.gameData.upgrades.speed, 5, 75, () => {
            if (this.gameData.coins >= 75) {
                this.gameData.coins -= 75;
                this.gameData.upgrades.speed += 0.1;
                this.gameData.saveProgress();
                this.openUpgradeMenu(); // Обновляем меню
            }
        });

        this.createUpgradeItem(360, 'Множитель монет', this.gameData.upgrades.coinMultiplier, 3, 100, () => {
            if (this.gameData.coins >= 100) {
                this.gameData.coins -= 100;
                this.gameData.upgrades.coinMultiplier += 1;
                this.gameData.saveProgress();
                this.openUpgradeMenu(); // Обновляем меню
            }
        });

        // Кнопка назад
        const backButton = this.add.rectangle(
            this.cameras.main.centerX,
            500,
            200,
            60,
            0xEA4335
        ).setInteractive();

        this.add.text(this.cameras.main.centerX, 500, 'НАЗАД', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Обработчик нажатия на кнопку назад
        backButton.on('pointerdown', () => {
            this.scene.restart(); // Перезапускаем сцену для возврата в главное меню
        });
    }

    createUpgradeItem(y, name, level, maxLevel, cost, onUpgrade) {
        // Фон элемента улучшения
        this.add.rectangle(
            this.cameras.main.centerX,
            y,
            400,
            60,
            0x333333
        );

        // Название улучшения
        this.add.text(this.cameras.main.centerX - 180, y, name, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Уровень улучшения
        this.add.text(this.cameras.main.centerX - 180, y + 25, `Уровень: ${level.toFixed(1)} / ${maxLevel.toFixed(1)}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#cccccc'
        }).setOrigin(0, 0.5);

        // Если улучшение доступно
        if (level < maxLevel) {
            // Стоимость улучшения
            this.add.text(this.cameras.main.centerX + 100, y, `${cost} 🪙`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#FFD700'
            }).setOrigin(0.5);

            // Кнопка улучшения
            const upgradeButton = this.add.rectangle(
                this.cameras.main.centerX + 180,
                y,
                80,
                40,
                this.gameData.coins >= cost ? 0x34A853 : 0x666666
            ).setInteractive();

            this.add.text(this.cameras.main.centerX + 180, y, '+', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Обработчик нажатия на кнопку улучшения
            if (this.gameData.coins >= cost) {
                upgradeButton.on('pointerdown', onUpgrade);
            }
        } else {
            // Если улучшение на максимуме
            this.add.text(this.cameras.main.centerX + 150, y, 'МАКС', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#34A853'
            }).setOrigin(0.5);
        }
    }
}