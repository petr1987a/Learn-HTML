// PoeticBoardOverlay.js
// Модуль для создания эффекта "Живой Доски Слов"

const PoeticBoardOverlay = (function() {

    let isActive = false; // Флаг активности модуля
    let boardElement = null; // Ссылка на DOM-элемент доски
    let poeticPhrases = []; // Массив поэтических фраз
    let cellPhraseMap = new Map(); // Карта для связи клетки (row-col) с фразой

    // --- НАСТРОЙКИ (можно вынести вовне или расширить) ---
    const settings = {
        phraseDisplayDuration: 3000, // мс, как долго фраза видна после увода мыши (0 - сразу убирать)
        fadeInDuration: '0.5s',      // Длительность появления
        fadeOutDuration: '0.3s',     // Длительность исчезания
        defaultFontSize: '12px',     // Размер шрифта по умолчанию
        defaultFontColor: '#C0C0C0', // Цвет шрифта (серебристый, для примера)
        defaultFontFamily: "'Times New Roman', Times, serif", // Поэтичный шрифт
        maxCharsPerCell: 40,         // Максимальное кол-во символов для отображения на клетке
    };

    // --- ПОЭТИЧЕСКИЕ ФРАЗЫ (ПРИМЕРЫ) ---
    // В идеале, их должно быть МНОГО и они могут быть сгруппированы по темам
    const samplePhrases = [
        // Общие / Начало
        "Где мысль кипит, там бой суров...",
        "Поле битвы – разум твой.",
        "Каждый ход – решение судьбы.",
        "В молчаньи фигур – гром идей.",
        "Пред вечностью – мгновенье игры.",
        "Здесь гений чертит свой узор.",
        // Атака / Напряжение
        "Сквозь строй врага – удар клинка!",
        "Огонь атаки не унять.",
        "Гроза надвинулась на трон.",
        "Вперед, сметая все преграды!",
        "На острие борьбы и риска.",
        // Защита / Обдумывание
        "Терпенье – щит, расчет – копье.",
        "Глухая оборона ждет.",
        "В тиши обдумывая план.",
        "Не дрогнет стойкость бастионов.",
        "Мудрость хранит последний рубеж.",
        // Для разных фигур (можно расширить)
        "Пешка: Мал золотник, да дорог путь.", // Пешка
        "Конь: Нежданный скок, излом игры.",    // Конь
        "Ладья: Прямой удар, стальная мощь.",   // Ладья
        "Слон: Диагональ – стрела судьбы.",   // Слон
        "Ферзь: Царица бала, смерть врагам.",  // Ферзь
        "Король: Венец тяжел, но тверд мой дух.", // Король
    ];

    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ---
    function init(boardDomElement, customPhrases = null) {
        if (!boardDomElement) {
            console.error("[PoeticBoardOverlay] Board element not provided!");
            debugMessageLocal("[PoeticBoardOverlay] ERROR: Board element not provided!");
            return;
        }
        boardElement = boardDomElement;
        poeticPhrases = customPhrases || samplePhrases;

        // Предполагаем, что клетки доски имеют data-атрибуты row и col
        // или их можно как-то идентифицировать
        assignPhrasesToCells();
        attachEventListeners();
        isActive = true;
        debugMessageLocal("[PoeticBoardOverlay] Initialized and active.");
        // console.log("[PoeticBoardOverlay] Initialized. Phrases assigned.");
    }

    // --- ПРИВЯЗКА ФРАЗ К КЛЕТКАМ ---
    function assignPhrasesToCells() {
        cellPhraseMap.clear();
        const squares = boardElement.querySelectorAll('.square'); // Замени '.square' на твой селектор клетки
        if (squares.length === 0) {
            debugMessageLocal("[PoeticBoardOverlay] No squares found on the board to assign phrases.");
            return;
        }

        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                // Простой случайный выбор фразы для примера
                const randomPhrase = poeticPhrases[Math.floor(Math.random() * poeticPhrases.length)];
                cellPhraseMap.set(cellKey, randomPhrase);
            }
        });
        debugMessageLocal(`[PoeticBoardOverlay] Phrases assigned to ${cellPhraseMap.size} cells.`);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function attachEventListeners() {
        boardElement.addEventListener('mouseover', handleMouseOver);
        boardElement.addEventListener('mouseout', handleMouseOut);
    }

    function detachEventListeners() {
        boardElement.removeEventListener('mouseover', handleMouseOver);
        boardElement.removeEventListener('mouseout', handleMouseOut);
    }

    function handleMouseOver(event) {
        if (!isActive) return;
        const targetSquare = event.target.closest('.square'); // Убедись, что это клетка
        if (targetSquare) {
            const row = targetSquare.dataset.row;
            const col = targetSquare.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                const phrase = cellPhraseMap.get(cellKey);
                if (phrase) {
                    displayPhraseOnSquare(targetSquare, phrase);
                }
            }
        }
    }

    function handleMouseOut(event) {
        if (!isActive) return;
        const targetSquare = event.target.closest('.square');
        if (targetSquare) {
            removePhraseFromSquare(targetSquare);
        }
    }

    // --- ОТОБРАЖЕНИЕ ФРАЗЫ НА КЛЕТКЕ ---
    function displayPhraseOnSquare(squareElement, phrase) {
        // Удаляем предыдущий оверлей, если он есть
        const existingOverlay = squareElement.querySelector('.poetic-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'poetic-overlay';
        overlay.style.position = 'absolute'; // Позиционирование относительно клетки
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.textAlign = 'center';
        overlay.style.pointerEvents = 'none'; // Чтобы не мешал кликам по фигурам
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity ${settings.fadeInDuration} ease-in-out`;
        overlay.style.fontFamily = settings.defaultFontFamily;
        overlay.style.fontSize = settings.defaultFontSize;
        overlay.style.color = settings.defaultFontColor;
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Полупрозрачный фон для читаемости
        overlay.style.padding = '2px 5px';
        overlay.style.borderRadius = '3px';
        overlay.style.whiteSpace = 'nowrap'; // Чтобы текст не переносился, если короткий
        overlay.style.overflow = 'hidden';
        overlay.style.textOverflow = 'ellipsis'; // Многоточие, если не влезает
        overlay.style.maxWidth = '90%'; // Не шире клетки

        // Обрезаем фразу, если она слишком длинная
        overlay.textContent = phrase.length > settings.maxCharsPerCell ?
                              phrase.substring(0, settings.maxCharsPerCell - 3) + "..." :
                              phrase;

        squareElement.style.position = 'relative'; // Для абсолютного позиционирования оверлея
        squareElement.appendChild(overlay);

        // Плавное появление
        requestAnimationFrame(() => { // Даем браузеру отрисовать элемент перед анимацией
            overlay.style.opacity = '1';
        });
    }

    // --- УДАЛЕНИЕ ФРАЗЫ С КЛЕТКИ ---
    function removePhraseFromSquare(squareElement) {
        const overlay = squareElement.querySelector('.poetic-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            // Удаляем элемент после анимации исчезновения
            setTimeout(() => {
                if (overlay.parentNode === squareElement) { // Проверяем, не удалили ли его уже
                     overlay.remove();
                }
            }, parseFloat(settings.fadeOutDuration) * 1000);
        }
    }

    // --- ПУБЛИЧНЫЕ МЕТОДЫ МОДУЛЯ ---
    return {
        activate: function(boardDomEl, phrases) {
            if (isActive) {
                debugMessageLocal("[PoeticBoardOverlay] Already active.");
                return;
            }
            init(boardDomEl, phrases);
        },
        deactivate: function() {
            if (!isActive) {
                debugMessageLocal("[PoeticBoardOverlay] Already inactive.");
                return;
            }
            detachEventListeners();
            // Можно также пройтись и удалить все существующие оверлеи, если нужно
            const allOverlays = boardElement.querySelectorAll('.poetic-overlay');
            allOverlays.forEach(ov => ov.remove());
            isActive = false;
            debugMessageLocal("[PoeticBoardOverlay] Deactivated.");
            // console.log("[PoeticBoardOverlay] Deactivated.");
        },
        setPhrases: function(newPhrasesArray) {
            if (Array.isArray(newPhrasesArray) && newPhrasesArray.length > 0) {
                poeticPhrases = newPhrasesArray;
                if (isActive && boardElement) {
                    assignPhrasesToCells(); // Переназначаем фразы
                    debugMessageLocal("[PoeticBoardOverlay] Phrases updated and reassigned.");
                } else if (Array.isArray(newPhrasesArray)) {
                     poeticPhrases = newPhrasesArray; // Просто сохраняем для будущей активации
                     debugMessageLocal("[PoeticBoardOverlay] Phrases updated for future activation.");
                }
            } else {
                debugMessageLocal("[PoeticBoardOverlay] Invalid or empty phrases array provided to setPhrases.");
            }
        },
        isActive: function() {
            return isActive;
        },
        // Добавим простую локальную debugMessage, чтобы не зависеть от глобальной, пока модуль не подключен
        debugMessageLocal: function(msg) {
            console.log("PBO_DEBUG: " + msg);
            // Ты можешь заменить это на вывод в твой debug-div, если он доступен из этого модуля
        }
    };

})(); // Самовызывающаяся функция для создания модуля
