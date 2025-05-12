const express = require('express');
const path = require('path');
const {Telegraf} = require('telegraf');
const PORT = process.env.PORT || 3000;

// Инициализация Express сервера
const app = express();

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Replace with your GitHub Pages URL
const GAME_URL = process.env.GAME_URL || 'https://yourusername.github.io/your-repo-name/';
const GAME_SHORT_NAME = 'infinity_runner'; // or your game's short name from BotFather

// Replace with your new token from BotFather
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_NEW_BOT_TOKEN_HERE';
const bot = new Telegraf(BOT_TOKEN);

// Обработчик для специальной страницы игры с параметрами Telegram
app.get('/game.html', (req, res) => {
    // Перенаправляем на главную страницу игры со всеми параметрами из URL
    const queryParams = new URLSearchParams(req.query).toString();
    res.redirect(`/?${queryParams}`);
});

// API для получения и сохранения рекордов (пример - можно расширить)
app.get('/api/scores', (req, res) => {
    // Здесь можно добавить логику для получения рекордов из БД
    res.json({message: 'Score API works!'});
});

// ===== НАСТРОЙКА БОТА =====

// Обработка команды /start
bot.start((ctx) => {
    ctx.reply('👋 Добро пожаловать в Infinity Runner! Бегите, собирайте монеты и улучшайте своего персонажа.', {
        reply_markup: {
            inline_keyboard: [
                [{text: '🎮 ИГРАТЬ', callback_game: GAME_SHORT_NAME}],
                [{text: '🏆 Рекорды', callback_data: 'highscore'}],
                [{text: '❓ Помощь', callback_data: 'help'}]
            ]
        }
    });
});

// Обработка команды /play
bot.command('play', (ctx) => {
    ctx.replyWithGame(GAME_SHORT_NAME);
});

// Обработка команды /highscore
bot.command('highscore', async (ctx) => {
    showHighScores(ctx);
});

// Обработка команды /help
bot.command('help', (ctx) => {
    showHelp(ctx);
});

// Обработка callback_query для игры
bot.on('callback_query', async (ctx) => {
    const callbackQuery = ctx.callbackQuery;

    // Если это запрос на запуск игры
    if (callbackQuery.game_short_name === GAME_SHORT_NAME) {
        // Отправляем URL игры с параметрами для Telegram Game API
        ctx.answerGameQuery(GAME_URL);
    }
    // Если это запрос на рекорды
    else if (callbackQuery.data === 'highscore') {
        showHighScores(ctx);
    }
    // Если это запрос на помощь
    else if (callbackQuery.data === 'help') {
        showHelp(ctx);
    }
});

// Функция для отображения рекордов
async function showHighScores(ctx) {
    try {
        const userId = ctx.from.id;
        const highScores = await ctx.getGameHighScores(userId, GAME_SHORT_NAME);

        if (highScores && highScores.length > 0) {
            const userScore = highScores[0].score;
            ctx.reply(`🏆 Ваш лучший результат: ${userScore} очков!`);

            // Пытаемся получить глобальные рекорды
            try {
                ctx.reply('🌍 Топ-5 игроков мира:');

                let message = '';
                for (let i = 0; i < Math.min(5, highScores.length); i++) {
                    const score = highScores[i];
                    message += `${i + 1}. ${score.user.first_name}: ${score.score} очков\n`;
                }

                ctx.reply(message || 'Пока нет данных о рекордах.');
            } catch (error) {
                console.log('Ошибка при получении глобальных рекордов:', error);
            }
        } else {
            ctx.reply('У вас пока нет рекордов. Сыграйте в игру, чтобы установить свой первый рекорд!');
        }
    } catch (error) {
        console.error('Ошибка при получении рекордов:', error);
        ctx.reply('Произошла ошибка при получении рекордов. Попробуйте позже.');
    }
}

// Функция для отображения помощи
function showHelp(ctx) {
    ctx.reply(
        `📋 Как играть в Infinity Runner:

🏃‍♂️ Ваш персонаж автоматически бежит вперёд
🦘 Нажимайте на экран или пробел для прыжка
🪙 Собирайте монеты для улучшений
🚧 Перепрыгивайте через препятствия
💪 Улучшайте своего персонажа между забегами

Команды бота:
/play - Начать игру
/highscore - Показать рекорды
/help - Показать эту справку`
    );
}

// URL для вебхука - Replace with your server's domain
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-backend-domain.com';

// Настройка маршрута для вебхука Telegram
app.use(bot.webhookCallback('/webhook'));

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);

    // Если есть URL для вебхука, настраиваем его
    if (WEBHOOK_URL) {
        bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`)
            .then(() => console.log('Вебхук установлен на', `${WEBHOOK_URL}/webhook`))
            .catch(err => console.error('Ошибка при установке вебхука:', err));
    } else {
        // Иначе используем long polling
        bot.launch()
            .then(() => console.log('Бот запущен в режиме long polling'))
            .catch(err => console.error('Ошибка при запуске бота:', err));
    }
});

// Обработка остановки процесса
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});