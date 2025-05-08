#!/bin/bash

## Скрипт для создания структуры проекта Infinity Runner без содержимого файлов
#
## Создаем корневую директорию
#mkdir -p infinity-runner
#cd infinity-runner

# Создаем структуру директорий
mkdir -p js/scenes js/objects

# Создаем пустые файлы

# HTML и CSS
touch index.html
touch styles.css

# Основной JS файл
touch js/main.js

# Файлы сцен
touch js/scenes/MenuScene.js
touch js/scenes/GameScene.js
touch js/scenes/GameOverScene.js

# Файлы объектов
touch js/objects/Player.js
touch js/objects/Obstacle.js

echo "Структура проекта Infinity Runner создана!"
echo "Директории и файлы:"
find . -type f | sort

# Инструкции по запуску сервера
echo ""
echo "Для запуска локального сервера выполните одну из команд:"
echo "1. Python: python -m http.server"
echo "2. Node.js: npx http-server"
echo "3. PHP: php -S localhost:8000"
echo ""
echo "Затем откройте http://localhost:8000 (или другой порт) в браузере"