class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Получаем физические константы и улучшения
        this.physicsConstants = scene.registry.get('physicsConstants');
        const gameData = scene.registry.get('gameData');

        // Вычисляем силу прыжка
        this.jumpPower = this.physicsConstants.getJumpForce(gameData.upgrades.jumpHeight);

        // Множители для физики падения
        this.fallMultiplier = this.physicsConstants.PLAYER.FALL_MULTIPLIER;
        this.lowJumpMultiplier = this.physicsConstants.PLAYER.LOW_JUMP_MULTIPLIER;

        // Создание спрайта игрока
        this.sprite = scene.physics.add.sprite(x, y, 'player');

        // Если текстура не загружена, создаем простой квадрат
        if (!this.sprite.texture.key) {
            const playerWidth = this.physicsConstants.PLAYER.WIDTH;
            const playerHeight = this.physicsConstants.PLAYER.HEIGHT;

            const graphics = scene.add.graphics();
            graphics.fillStyle(0x4285F4, 1); // Синий квадрат
            graphics.fillRect(0, 0, playerWidth, playerHeight);
            graphics.generateTexture('player', playerWidth, playerHeight);
            graphics.destroy();

            this.sprite.setTexture('player');
        }

        // Настройка физики с прямыми значениями
        this.sprite.setBounce(this.physicsConstants.PLAYER.BOUNCE);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body.mass = this.physicsConstants.PLAYER.MASS;

        // Свойства игрока
        this.isJumping = false;
        this.canDoubleJump = false;
        this.isJumpHeld = false;
        this.jumpReleased = true;

        // Обработчики прыжка
        scene.input.on('pointerdown', this.onJumpPressed, this);
        scene.input.on('pointerup', this.onJumpReleased, this);

        scene.input.keyboard.on('keydown-SPACE', this.onJumpPressed, this);
        scene.input.keyboard.on('keyup-SPACE', this.onJumpReleased, this);

        scene.input.keyboard.on('keydown-UP', this.onJumpPressed, this);
        scene.input.keyboard.on('keyup-UP', this.onJumpReleased, this);

        console.log("Сила прыжка игрока:", this.jumpPower);
    }

    update() {
        // Проверка приземления
        if (this.sprite.body.touching.down) {
            this.isJumping = false;
            this.canDoubleJump = true;
        }

        // УПРОЩЕННАЯ физика падения
        const gravity = this.scene.physics.world.gravity.y;

        if (this.sprite.body.velocity.y > 0) { // Если падаем
            this.sprite.body.setGravityY(gravity * this.fallMultiplier);
        } else if (this.sprite.body.velocity.y < 0 && !this.isJumpHeld) { // Подъем и кнопка не удерживается
            this.sprite.body.setGravityY(gravity * this.lowJumpMultiplier);
        } else {
            this.sprite.body.setGravityY(0); // Сбрасываем доп. гравитацию
        }
    }

    onJumpPressed() {
        this.isJumpHeld = true;
        this.jump();
    }

    onJumpReleased() {
        this.isJumpHeld = false;
        this.jumpReleased = true;
    }

    jump() {
        if (!this.isJumping) {
            // Первый прыжок
            this.sprite.setVelocityY(-this.jumpPower);
            this.isJumping = true;
            console.log("Прыжок! Сила:", this.jumpPower, "Скорость Y:", this.sprite.body.velocity.y);
        } else if (this.canDoubleJump && this.jumpReleased) {
            // Двойной прыжок
            this.sprite.setVelocityY(-this.jumpPower * this.physicsConstants.PLAYER.DOUBLE_JUMP_MULTIPLIER);
            this.canDoubleJump = false;
            console.log("Двойной прыжок! Сила:", this.jumpPower * this.physicsConstants.PLAYER.DOUBLE_JUMP_MULTIPLIER);
        }
    }

    die() {
        // Анимация смерти (простое мигание)
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Вызываем обработчик смерти в сцене
                this.scene.onPlayerDeath();
            }
        });
    }
}