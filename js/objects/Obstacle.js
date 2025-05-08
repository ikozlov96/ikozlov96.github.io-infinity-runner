class Obstacle {
    constructor(scene, x, y, type = 'default') {
        this.scene = scene;
        this.type = type;

        // Получаем физические константы и улучшения
        this.physicsConstants = scene.registry.get('physicsConstants');
        const gameData = scene.registry.get('gameData');

        // Базовая скорость с учетом улучшения скорости
        this.baseSpeed = this.physicsConstants.getGameSpeed(
            gameData.upgrades.speed,
            1.0  // Начальный множитель = 1.0
        );

        // Создаем спрайт препятствия
        this.sprite = scene.physics.add.sprite(x, y, `obstacle_${type}`);

        // Если текстура не загружена, создаем простой прямоугольник с размерами из физических констант
        if (!this.sprite.texture.key) {
            // Получаем размеры из физических констант
            let width, height, color;

            switch (type) {
                case 'small':
                    width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.SMALL.WIDTH);
                    height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.SMALL.HEIGHT);
                    color = 0xEA4335; // Красный
                    break;
                case 'tall':
                    width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.TALL.WIDTH);
                    height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.TALL.HEIGHT);
                    color = 0xFBBC05; // Желтый
                    break;
                case 'long':
                    width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.LONG.WIDTH);
                    height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.LONG.HEIGHT);
                    color = 0x34A853; // Зеленый
                    break;
                default:
                    width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.DEFAULT.WIDTH);
                    height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.DEFAULT.HEIGHT);
                    color = 0xFA7B17; // Оранжевый
                    break;
            }

            const graphics = scene.add.graphics();
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, width, height);
            graphics.generateTexture(`obstacle_${type}`, width, height);
            graphics.destroy();
            this.sprite.setTexture(`obstacle_${type}`);
        }

        // Настройка физики
        this.sprite.setImmovable(true);
        this.sprite.body.allowGravity = false;
        this.sprite.setVelocityX(-this.baseSpeed);

        // Установка коллайдера в зависимости от типа
        this.setColliderByType();
    }

    setColliderByType() {
        // Получаем размеры из физических констант
        let width, height;

        switch (this.type) {
            case 'small':
                width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.SMALL.WIDTH * 0.8);
                height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.SMALL.HEIGHT * 0.8);
                break;
            case 'tall':
                width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.TALL.WIDTH * 0.8);
                height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.TALL.HEIGHT * 0.9);
                break;
            case 'long':
                width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.LONG.WIDTH * 0.9);
                height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.LONG.HEIGHT * 0.8);
                break;
            default:
                width = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.DEFAULT.WIDTH * 0.85);
                height = this.physicsConstants.convertToGameUnits(this.physicsConstants.OBSTACLES.SIZES.DEFAULT.HEIGHT * 0.85);
                break;
        }

        this.sprite.body.setSize(width, height);
        this.sprite.setOrigin(0.5, 1); // Выравнивание по земле
    }

    update() {
        // Если препятствие ушло за край экрана, уничтожаем его
        if (this.sprite.x < -100) {
            this.destroy();
            return false;
        }
        return true;
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    // Плавное изменение скорости
    adjustSpeed(speedMultiplier, smooth = false) {
        if (!this.sprite) return;

        const targetSpeed = -this.baseSpeed * speedMultiplier;

        if (smooth) {
            // Плавное изменение скорости с анимацией
            this.scene.tweens.add({
                targets: this.sprite.body.velocity,
                x: targetSpeed,
                duration: 400,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Мгновенное изменение скорости
            this.sprite.setVelocityX(targetSpeed);
        }
    }
}

// Класс для монет
class Coin extends Obstacle {
    constructor(scene, x, y) {
        super(scene, x, y, 'coin');

        // Получаем радиус из физических констант
        const coinRadius = this.physicsConstants.convertToGameUnits(
            this.physicsConstants.OBSTACLES.SIZES.COIN.RADIUS
        );

        // Переопределяем графику для монет
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xFFD700, 1); // Золотой цвет
        graphics.fillCircle(coinRadius, coinRadius, coinRadius);
        graphics.generateTexture('obstacle_coin', coinRadius * 2, coinRadius * 2);
        graphics.destroy();

        this.sprite.setTexture('obstacle_coin');
        this.sprite.body.setCircle(coinRadius);

        // Анимация "парения"
        scene.tweens.add({
            targets: this.sprite,
            y: y - coinRadius * 4, // Высота парения в зависимости от радиуса
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    // Сбор монеты
    collect() {
        // Анимация сбора
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.destroy();
            }
        });

        // Получаем множитель монет из gameData
        const gameData = this.scene.registry.get('gameData');
        const coinValue = 1 * gameData.upgrades.coinMultiplier;

        // Возвращаем стоимость монеты
        return coinValue;
    }
}