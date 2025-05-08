class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Получаем данные игры и физические константы из реестра
        this.gameData = this.registry.get('gameData');
        this.physicsConstants = this.registry.get('physicsConstants');

        // Сброс счета для новой игры
        this.score = 0;
        this.collectedCoins = 0;
        this.gameSpeed = 1;
        this.gameOver = false;

        // Настройка FPS для стабильной физики
        this.physics.world.setFPS(this.physicsConstants.WORLD.TARGET_FPS);

        // Создание земли
        this.ground = this.physics.add.staticGroup();
        const groundRect = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            this.cameras.main.width,
            100,
            0x81C784 // Цвет земли
        );
        this.ground.add(groundRect);

        // Создание игрока
        this.player = new Player(this, 150, this.cameras.main.height - 150);

        // УДАЛЕНО: вызов метода logPhysicalStats, который больше не существует
        // Вместо этого просто логгируем основные параметры
        console.log("Физические параметры: Гравитация =", this.physics.world.gravity.y);

        // Коллизия игрока с землей
        this.physics.add.collider(this.player.sprite, this.ground);

        // Создание групп препятствий и монет
        this.obstacles = [];
        this.coins = [];

        // Интервал появления препятствий
        this.obstacleTimer = this.time.addEvent({
            delay: this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.OBSTACLE_BASE,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // Интервал появления монет
        this.coinTimer = this.time.addEvent({
            delay: this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.COIN_BASE,
            callback: this.spawnCoin,
            callbackScope: this,
            loop: true
        });

        // Текст счета
        this.scoreText = this.add.text(20, 20, 'Счет: 0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        });

        // Текст монет
        this.coinText = this.add.text(20, 60, 'Монеты: 0', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#FFD700'
        });

        // Увеличение сложности со временем
        this.difficultyTimer = this.time.addEvent({
            delay: 5000,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });

        // Добавляем отслеживание времени для плавного изменения скорости
        this.lastTime = 0;
        this.deltaTime = 0;
    }

    update(time) {
        if (this.gameOver) return;

        // Рассчитываем deltaTime для плавных изменений
        this.deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0.016;
        this.lastTime = time;

        // Обновление игрока
        this.player.update();

        // Обновление препятствий
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (!obstacle.update()) {
                // Если препятствие ушло за край экрана, удаляем его
                this.obstacles.splice(i, 1);

                // Увеличение счета за пройденное препятствие
                this.score += 1;
                this.scoreText.setText(`Счет: ${this.score}`);
            }
        }

        // Обновление монет
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (!coin.update()) {
                // Если монета ушла за край экрана, удаляем ее
                this.coins.splice(i, 1);
            }

            // Проверка сбора монет
            if (coin.sprite && this.physics.overlap(this.player.sprite, coin.sprite)) {
                const coinValue = coin.collect();
                this.coins.splice(i, 1);

                this.collectedCoins += coinValue;
                this.coinText.setText(`Монеты: ${this.collectedCoins}`);
            }
        }

        // Проверка столкновений с препятствиями
        this.obstacles.forEach(obstacle => {
            if (obstacle.sprite && this.physics.overlap(this.player.sprite, obstacle.sprite)) {
                this.playerHit();
            }
        });
    }

    spawnObstacle() {
        if (this.gameOver) return;

        // Типы препятствий: small, tall, long, default
        const types = ['small', 'tall', 'long', 'default'];
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Случайная высота для прыгающих препятствий
        const y = this.cameras.main.height - 100;

        // Создание препятствия
        const obstacle = new Obstacle(this, this.cameras.main.width + 100, y, randomType);
        this.obstacles.push(obstacle);
    }

    spawnCoin() {
        if (this.gameOver) return;

        // Случайная высота для монет
        const y = this.cameras.main.height - 150 - Math.random() * 150;

        // Создание монеты
        const coin = new Coin(this, this.cameras.main.width + 100, y);
        this.coins.push(coin);
    }

    increaseDifficulty() {
        if (this.gameOver) return;

        // Плавное увеличение скорости игры
        const speedIncrement = this.physicsConstants.WORLD.ACCELERATION_INCREMENT;
        this.gameSpeed += speedIncrement;

        // Ограничение максимальной скорости
        const maxSpeed = this.physicsConstants.WORLD.MAX_GAME_SPEED / this.physicsConstants.WORLD.BASE_GAME_SPEED;
        if (this.gameSpeed > maxSpeed) {
            this.gameSpeed = maxSpeed;
        }

        // Применение плавного изменения скорости к существующим объектам
        this.obstacles.forEach(obstacle => {
            obstacle.adjustSpeed(this.gameSpeed, true); // true для плавного перехода
        });

        this.coins.forEach(coin => {
            coin.adjustSpeed(this.gameSpeed, true);
        });

        // Плавное уменьшение интервалов появления препятствий и монет
        const baseObstacleDelay = this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.OBSTACLE_BASE;
        const baseCoinDelay = this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.COIN_BASE;
        const minObstacleDelay = this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.OBSTACLE_MIN;
        const minCoinDelay = this.physicsConstants.OBSTACLES.SPAWN_INTERVALS.COIN_MIN;

        this.obstacleTimer.delay = Math.max(minObstacleDelay, baseObstacleDelay - (this.gameSpeed - 1) * 1000);
        this.coinTimer.delay = Math.max(minCoinDelay, baseCoinDelay - (this.gameSpeed - 1) * 1000);
    }

    playerHit() {
        if (this.gameOver) return;

        // Игра окончена
        this.gameOver = true;

        // Остановка таймеров
        this.obstacleTimer.remove();
        this.coinTimer.remove();
        this.difficultyTimer.remove();

        // Анимация смерти игрока
        this.player.die();
    }

    onPlayerDeath() {
        // Обновление рекорда
        if (this.score > this.gameData.highScore) {
            this.gameData.highScore = this.score;
        }

        // Добавление собранных монет
        this.gameData.coins += this.collectedCoins;

        // Сохранение прогресса
        this.gameData.saveProgress();

        // Переход на экран окончания игры
        this.scene.start('GameOverScene', { score: this.score, coins: this.collectedCoins });
    }

    init() {
        // Инициализация переменных
        this.collectedCoins = 0;
    }
}