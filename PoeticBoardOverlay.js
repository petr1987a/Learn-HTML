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
    const samplePhrases = [
        "Где мысль кипит, там бой суров...",
        "Поле битвы – разум твой.",
        "Каждый ход – решение судьбы.",
        "В молчаньи фигур – гром идей.",
        "Пред вечностью – мгновенье игры.",
        "Здесь гений чертит свой узор.",
        "Сквозь строй врага – удар клинка!",
        "Огонь атаки не унять.",
        "Гроза надвинулась на трон.",
        "Вперед, сметая все преграды!",
        "На острие борьбы и риска.",
        "Терпенье – щит, расчет – копье.",
        "Глухая оборона ждет.",
        "В тиши обдумывая план.",
        "Не дрогнет стойкость бастионов.",
        "Мудрость хранит последний рубеж.",
        "Пешка: Мал золотник, да дорог путь.",
        "Конь: Нежданный скок, излом игры.",
        "Ладья: Прямой удар, стальная мощь.",
        "Слон: Диагональ – стрела судьбы.",
        "Ферзь: Царица бала, смерть врагам.",
        "Король: Венец тяжел, но тверд мой дух.",
    ];

    // --- ЛОКАЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТЛАДКИ ВНУТРИ МОДУЛЯ ---
    function debugMessageLocal(msg) {
        console.log("PBO_DEBUG: " + msg);
        // При желании, можно добавить вывод в специальный debug-div на странице,
        // если он будет доступен из этого модуля (например, через глобальную переменную или переданный элемент)
    }

    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ---
    function init(boardDomElement, customPhrases = null) {
        if (!boardDomElement) {
            console.error("[PoeticBoardOverlay] Board element not provided!"); // Оставим console.error для критических ошибок
            debugMessageLocal("ERROR: Board element not provided for PoeticBoardOverlay initialization!");
            return;
        }
        boardElement = boardDomElement;
        poeticPhrases = customPhrases || samplePhrases;

        assignPhrasesToCells();
        attachEventListeners();
        isActive = true;
        debugMessageLocal("PoeticBoardOverlay Initialized and active.");
    }

    // --- ПРИВЯЗКА ФРАЗ К КЛЕТКАМ ---
    function assignPhrasesToCells() {
        cellPhraseMap.clear();
        if (!boardElement) { // Добавим проверку на существование boardElement
            debugMessageLocal("Cannot assign phrases: boardElement is null.");
            return;
        }
        const squares = boardElement.querySelectorAll('.square');
        if (squares.length === 0) {
            debugMessageLocal("No squares found on the board to assign phrases.");
            return;
        }

        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                const randomPhrase = poeticPhrases[Math.floor(Math.random() * poeticPhrases.length)];
                cellPhraseMap.set(cellKey, randomPhrase);
            }
        });
        debugMessageLocal(`Phrases assigned to ${cellPhraseMap.size} cells.`);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function attachEventListeners() {
        if (!boardElement) return;
        boardElement.addEventListener('mouseover', handleMouseOver);
        boardElement.addEventListener('mouseout', handleMouseOut);
    }

    function detachEventListeners() {
        if (!boardElement) return;
        boardElement.removeEventListener('mouseover', handleMouseOver);
        boardElement.removeEventListener('mouseout', handleMouseOut);
    }

    function handleMouseOver(event) {
        if (!isActive) return;
        const targetSquare = event.target.closest('.square');
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
        const existingOverlay = squareElement.querySelector('.poetic-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'poetic-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.textAlign = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity ${settings.fadeInDuration} ease-in-out`;
        overlay.style.fontFamily = settings.defaultFontFamily;
        overlay.style.fontSize = settings.defaultFontSize;
        overlay.style.color = settings.defaultFontColor;
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.padding = '2px 5px';
        overlay.style.borderRadius = '3px';
        overlay.style.whiteSpace = 'nowrap';
        overlay.style.overflow = 'hidden';
        overlay.style.textOverflow = 'ellipsis';
        overlay.style.maxWidth = '90%';
        overlay.textContent = phrase.length > settings.maxCharsPerCell ?
                              phrase.substring(0, settings.maxCharsPerCell - 3) + "..." :
                              phrase;

        squareElement.style.position = 'relative';
        squareElement.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    // --- УДАЛЕНИЕ ФРАЗЫ С КЛЕТКИ ---
    function removePhraseFromSquare(squareElement) {
        const overlay = squareElement.querySelector('.poetic-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode === squareElement) {
                     overlay.remove();
                }
            }, parseFloat(settings.fadeOutDuration) * 1000);
        }
    }

    // --- ПУБЛИЧНЫЕ МЕТОДЫ МОДУЛЯ ---
    return {
        activate: function(boardDomEl, phrases) {
            if (isActive) {
                debugMessageLocal("PoeticBoardOverlay Already active.");
                return;
            }
            init(boardDomEl, phrases); // init теперь корректно вызовет debugMessageLocal
        },
        deactivate: function() {
            if (!isActive) {
                debugMessageLocal("PoeticBoardOverlay Already inactive.");
                return;
            }
            detachEventListeners();
            if (boardElement) { // Добавим проверку перед querySelectorAll
                const allOverlays = boardElement.querySelectorAll('.poetic-overlay');
                allOverlays.forEach(ov => ov.remove());
            }
            isActive = false;
            debugMessageLocal("PoeticBoardOverlay Deactivated.");
        },
        setPhrases: function(newPhrasesArray) {
            if (Array.isArray(newPhrasesArray) && newPhrasesArray.length > 0) {
                poeticPhrases = newPhrasesArray;
                if (isActive && boardElement) {
                    assignPhrasesToCells();
                    debugMessageLocal("PoeticBoardOverlay Phrases updated and reassigned.");
                } else {
                     poeticPhrases = newPhrasesArray;
                     debugMessageLocal("PoeticBoardOverlay Phrases updated for future activation.");
                }
            } else {
                debugMessageLocal("PoeticBoardOverlay Invalid or empty phrases array provided to setPhrases.");
            }
        },
        isActive: function() {
            return isActive;
        }
        // debugMessageLocal больше не экспортируется, так как она теперь внутренняя функция
    };

})();// PoeticBoardOverlay.js
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
    const samplePhrases = [
        "Где мысль кипит, там бой суров...",
        "Поле битвы – разум твой.",
        "Каждый ход – решение судьбы.",
        "В молчаньи фигур – гром идей.",
        "Пред вечностью – мгновенье игры.",
        "Здесь гений чертит свой узор.",
        "Сквозь строй врага – удар клинка!",
        "Огонь атаки не унять.",
        "Гроза надвинулась на трон.",
        "Вперед, сметая все преграды!",
        "На острие борьбы и риска.",
        "Терпенье – щит, расчет – копье.",
        "Глухая оборона ждет.",
        "В тиши обдумывая план.",
        "Не дрогнет стойкость бастионов.",
        "Мудрость хранит последний рубеж.",
        "Пешка: Мал золотник, да дорог путь.",
        "Конь: Нежданный скок, излом игры.",
        "Ладья: Прямой удар, стальная мощь.",
        "Слон: Диагональ – стрела судьбы.",
        "Ферзь: Царица бала, смерть врагам.",
        "Король: Венец тяжел, но тверд мой дух.",
    ];

    // --- ЛОКАЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТЛАДКИ ВНУТРИ МОДУЛЯ ---
    function debugMessageLocal(msg) {
        console.log("PBO_DEBUG: " + msg);
        // При желании, можно добавить вывод в специальный debug-div на странице,
        // если он будет доступен из этого модуля (например, через глобальную переменную или переданный элемент)
    }

    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ---
    function init(boardDomElement, customPhrases = null) {
        if (!boardDomElement) {
            console.error("[PoeticBoardOverlay] Board element not provided!"); // Оставим console.error для критических ошибок
            debugMessageLocal("ERROR: Board element not provided for PoeticBoardOverlay initialization!");
            return;
        }
        boardElement = boardDomElement;
        poeticPhrases = customPhrases || samplePhrases;

        assignPhrasesToCells();
        attachEventListeners();
        isActive = true;
        debugMessageLocal("PoeticBoardOverlay Initialized and active.");
    }

    // --- ПРИВЯЗКА ФРАЗ К КЛЕТКАМ ---
    function assignPhrasesToCells() {
        cellPhraseMap.clear();
        if (!boardElement) { // Добавим проверку на существование boardElement
            debugMessageLocal("Cannot assign phrases: boardElement is null.");
            return;
        }
        const squares = boardElement.querySelectorAll('.square');
        if (squares.length === 0) {
            debugMessageLocal("No squares found on the board to assign phrases.");
            return;
        }

        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                const randomPhrase = poeticPhrases[Math.floor(Math.random() * poeticPhrases.length)];
                cellPhraseMap.set(cellKey, randomPhrase);
            }
        });
        debugMessageLocal(`Phrases assigned to ${cellPhraseMap.size} cells.`);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function attachEventListeners() {
        if (!boardElement) return;
        boardElement.addEventListener('mouseover', handleMouseOver);
        boardElement.addEventListener('mouseout', handleMouseOut);
    }

    function detachEventListeners() {
        if (!boardElement) return;
        boardElement.removeEventListener('mouseover', handleMouseOver);
        boardElement.removeEventListener('mouseout', handleMouseOut);
    }

    function handleMouseOver(event) {
        if (!isActive) return;
        const targetSquare = event.target.closest('.square');
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
        const existingOverlay = squareElement.querySelector('.poetic-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'poetic-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.textAlign = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity ${settings.fadeInDuration} ease-in-out`;
        overlay.style.fontFamily = settings.defaultFontFamily;
        overlay.style.fontSize = settings.defaultFontSize;
        overlay.style.color = settings.defaultFontColor;
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.padding = '2px 5px';
        overlay.style.borderRadius = '3px';
        overlay.style.whiteSpace = 'nowrap';
        overlay.style.overflow = 'hidden';
        overlay.style.textOverflow = 'ellipsis';
        overlay.style.maxWidth = '90%';
        overlay.textContent = phrase.length > settings.maxCharsPerCell ?
                              phrase.substring(0, settings.maxCharsPerCell - 3) + "..." :
                              phrase;

        squareElement.style.position = 'relative';
        squareElement.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    // --- УДАЛЕНИЕ ФРАЗЫ С КЛЕТКИ ---
    function removePhraseFromSquare(squareElement) {
        const overlay = squareElement.querySelector('.poetic-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode === squareElement) {
                     overlay.remove();
                }
            }, parseFloat(settings.fadeOutDuration) * 1000);
        }
    }

    // --- ПУБЛИЧНЫЕ МЕТОДЫ МОДУЛЯ ---
    return {
        activate: function(boardDomEl, phrases) {
            if (isActive) {
                debugMessageLocal("PoeticBoardOverlay Already active.");
                return;
            }
            init(boardDomEl, phrases); // init теперь корректно вызовет debugMessageLocal
        },
        deactivate: function() {
            if (!isActive) {
                debugMessageLocal("PoeticBoardOverlay Already inactive.");
                return;
            }
            detachEventListeners();
            if (boardElement) { // Добавим проверку перед querySelectorAll
                const allOverlays = boardElement.querySelectorAll('.poetic-overlay');
                allOverlays.forEach(ov => ov.remove());
            }
            isActive = false;
            debugMessageLocal("PoeticBoardOverlay Deactivated.");
        },
        setPhrases: function(newPhrasesArray) {
            if (Array.isArray(newPhrasesArray) && newPhrasesArray.length > 0) {
                poeticPhrases = newPhrasesArray;
                if (isActive && boardElement) {
                    assignPhrasesToCells();
                    debugMessageLocal("PoeticBoardOverlay Phrases updated and reassigned.");
                } else {
                     poeticPhrases = newPhrasesArray;
                     debugMessageLocal("PoeticBoardOverlay Phrases updated for future activation.");
                }
            } else {
                debugMessageLocal("PoeticBoardOverlay Invalid or empty phrases array provided to setPhrases.");
            }
        },
        isActive: function() {
            return isActive;
        }
        // debugMessageLocal больше не экспортируется, так как она теперь внутренняя функция
    };

})();// PoeticBoardOverlay.js
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
    const samplePhrases = [
        "Где мысль кипит, там бой суров...",
        "Поле битвы – разум твой.",
        "Каждый ход – решение судьбы.",
        "В молчаньи фигур – гром идей.",
        "Пред вечностью – мгновенье игры.",
        "Здесь гений чертит свой узор.",
        "Сквозь строй врага – удар клинка!",
        "Огонь атаки не унять.",
        "Гроза надвинулась на трон.",
        "Вперед, сметая все преграды!",
        "На острие борьбы и риска.",
        "Терпенье – щит, расчет – копье.",
        "Глухая оборона ждет.",
        "В тиши обдумывая план.",
        "Не дрогнет стойкость бастионов.",
        "Мудрость хранит последний рубеж.",
        "Пешка: Мал золотник, да дорог путь.",
        "Конь: Нежданный скок, излом игры.",
        "Ладья: Прямой удар, стальная мощь.",
        "Слон: Диагональ – стрела судьбы.",
        "Ферзь: Царица бала, смерть врагам.",
        "Король: Венец тяжел, но тверд мой дух.",
    ];

    // --- ЛОКАЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТЛАДКИ ВНУТРИ МОДУЛЯ ---
    function debugMessageLocal(msg) {
        console.log("PBO_DEBUG: " + msg);
        // При желании, можно добавить вывод в специальный debug-div на странице,
        // если он будет доступен из этого модуля (например, через глобальную переменную или переданный элемент)
    }

    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ---
    function init(boardDomElement, customPhrases = null) {
        if (!boardDomElement) {
            console.error("[PoeticBoardOverlay] Board element not provided!"); // Оставим console.error для критических ошибок
            debugMessageLocal("ERROR: Board element not provided for PoeticBoardOverlay initialization!");
            return;
        }
        boardElement = boardDomElement;
        poeticPhrases = customPhrases || samplePhrases;

        assignPhrasesToCells();
        attachEventListeners();
        isActive = true;
        debugMessageLocal("PoeticBoardOverlay Initialized and active.");
    }

    // --- ПРИВЯЗКА ФРАЗ К КЛЕТКАМ ---
    function assignPhrasesToCells() {
        cellPhraseMap.clear();
        if (!boardElement) { // Добавим проверку на существование boardElement
            debugMessageLocal("Cannot assign phrases: boardElement is null.");
            return;
        }
        const squares = boardElement.querySelectorAll('.square');
        if (squares.length === 0) {
            debugMessageLocal("No squares found on the board to assign phrases.");
            return;
        }

        squares.forEach(square => {
            const row = square.dataset.row;
            const col = square.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                const randomPhrase = poeticPhrases[Math.floor(Math.random() * poeticPhrases.length)];
                cellPhraseMap.set(cellKey, randomPhrase);
            }
        });
        debugMessageLocal(`Phrases assigned to ${cellPhraseMap.size} cells.`);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function attachEventListeners() {
        if (!boardElement) return;
        boardElement.addEventListener('mouseover', handleMouseOver);
        boardElement.addEventListener('mouseout', handleMouseOut);
    }

    function detachEventListeners() {
        if (!boardElement) return;
        boardElement.removeEventListener('mouseover', handleMouseOver);
        boardElement.removeEventListener('mouseout', handleMouseOut);
    }

    function handleMouseOver(event) {
        if (!isActive) return;
        const targetSquare = event.target.closest('.square');
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
        const existingOverlay = squareElement.querySelector('.poetic-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'poetic-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.textAlign = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity ${settings.fadeInDuration} ease-in-out`;
        overlay.style.fontFamily = settings.defaultFontFamily;
        overlay.style.fontSize = settings.defaultFontSize;
        overlay.style.color = settings.defaultFontColor;
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.padding = '2px 5px';
        overlay.style.borderRadius = '3px';
        overlay.style.whiteSpace = 'nowrap';
        overlay.style.overflow = 'hidden';
        overlay.style.textOverflow = 'ellipsis';
        overlay.style.maxWidth = '90%';
        overlay.textContent = phrase.length > settings.maxCharsPerCell ?
                              phrase.substring(0, settings.maxCharsPerCell - 3) + "..." :
                              phrase;

        squareElement.style.position = 'relative';
        squareElement.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    // --- УДАЛЕНИЕ ФРАЗЫ С КЛЕТКИ ---
    function removePhraseFromSquare(squareElement) {
        const overlay = squareElement.querySelector('.poetic-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode === squareElement) {
                     overlay.remove();
                }
            }, parseFloat(settings.fadeOutDuration) * 1000);
        }
    }

    // --- ПУБЛИЧНЫЕ МЕТОДЫ МОДУЛЯ ---
    return {
        activate: function(boardDomEl, phrases) {
            if (isActive) {
                debugMessageLocal("PoeticBoardOverlay Already active.");
                return;
            }
            init(boardDomEl, phrases); // init теперь корректно вызовет debugMessageLocal
        },
        deactivate: function() {
            if (!isActive) {
                debugMessageLocal("PoeticBoardOverlay Already inactive.");
                return;
            }
            detachEventListeners();
            if (boardElement) { // Добавим проверку перед querySelectorAll
                const allOverlays = boardElement.querySelectorAll('.poetic-overlay');
                allOverlays.forEach(ov => ov.remove());
            }
            isActive = false;
            debugMessageLocal("PoeticBoardOverlay Deactivated.");
        },
        setPhrases: function(newPhrasesArray) {
            if (Array.isArray(newPhrasesArray) && newPhrasesArray.length > 0) {
                poeticPhrases = newPhrasesArray;
                if (isActive && boardElement) {
                    assignPhrasesToCells();
                    debugMessageLocal("PoeticBoardOverlay Phrases updated and reassigned.");
                } else {
                     poeticPhrases = newPhrasesArray;
                     debugMessageLocal("PoeticBoardOverlay Phrases updated for future activation.");
                }
            } else {
                debugMessageLocal("PoeticBoardOverlay Invalid or empty phrases array provided to setPhrases.");
            }
        },
        isActive: function() {
            return isActive;
        }
        // debugMessageLocal больше не экспортируется, так как она теперь внутренняя функция
    };

})();
