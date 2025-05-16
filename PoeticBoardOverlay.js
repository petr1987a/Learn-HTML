// PoeticBoardOverlay.js
// Модуль для создания эффекта "Живой Доски Слов" с Tooltip

const PoeticBoardOverlay = (function() {

    let isActive = false;
    let boardElement = null;
    let poeticPhrases = [];
    let cellPhraseMap = new Map();
    let tooltipElement = null; // Наш новый элемент для тултипа

    // --- НАСТРОЙКИ (можно вынести вовне или расширить) ---
    const settings = {
        // Настройки для фраз и модуля (если нужны)
        // maxCharsPerCell больше не актуален для тултипа
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
        // Оставим для отладки самого модуля, если нужно
        // console.log("PBO_DEBUG: " + msg);
    }

    // --- СОЗДАНИЕ ЭЛЕМЕНТА ТУЛТИПА ---
    function createTooltip() {
        if (tooltipElement) return; // Уже создан

        tooltipElement = document.createElement('div');
        tooltipElement.id = 'poeticTooltip'; // Дадим ID для стилизации и поиска
        tooltipElement.style.position = 'fixed'; // Позиционирование относительно окна браузера
        tooltipElement.style.display = 'none';   // Скрыт по умолчанию
        tooltipElement.style.padding = '8px 12px';
        tooltipElement.style.backgroundColor = 'rgba(44, 62, 80, 0.9)'; // Темно-синий полупрозрачный
        tooltipElement.style.color = '#ecf0f1'; // Светлый текст
        tooltipElement.style.borderRadius = '5px';
        tooltipElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        tooltipElement.style.fontFamily = "'Times New Roman', Times, serif";
        tooltipElement.style.fontSize = '14px';
        tooltipElement.style.lineHeight = '1.4';
        tooltipElement.style.pointerEvents = 'none'; // Чтобы не перехватывал события мыши
        tooltipElement.style.zIndex = '1001'; // Поверх других элементов доски
        tooltipElement.style.maxWidth = '300px'; // Ограничим ширину
        tooltipElement.style.whiteSpace = 'normal'; // Разрешим перенос строк
        document.body.appendChild(tooltipElement);
        debugMessageLocal("Tooltip element created and appended to body.");
    }

    // --- ИНИЦИАЛИЗАЦИЯ МОДУЛЯ ---
    function init(boardDomElement, customPhrases = null) {
        if (!boardDomElement) {
            console.error("[PoeticBoardOverlay] Board element not provided!");
            return;
        }
        boardElement = boardDomElement;
        poeticPhrases = customPhrases || samplePhrases;

        createTooltip(); // Создаем тултип при инициализации
        assignPhrasesToCells();
        attachEventListeners();
        isActive = true;
        debugMessageLocal("PoeticBoardOverlay Initialized and active. Tooltip ready.");
    }

    // --- ПРИВЯЗКА ФРАЗ К КЛЕТКАМ ---
    function assignPhrasesToCells() {
        cellPhraseMap.clear();
        if (!boardElement) {
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
        // Используем 'mousemove' на доске для более плавного позиционирования тултипа
        boardElement.addEventListener('mousemove', handleMouseMove);
        boardElement.addEventListener('mouseover', handleMouseOverCell); // Для показа
        boardElement.addEventListener('mouseout', handleMouseOutCell);   // Для скрытия
    }

    function detachEventListeners() {
        if (!boardElement) return;
        boardElement.removeEventListener('mousemove', handleMouseMove);
        boardElement.removeEventListener('mouseover', handleMouseOverCell);
        boardElement.removeEventListener('mouseout', handleMouseOutCell);
    }

    function handleMouseMove(event) {
        if (!isActive || !tooltipElement || tooltipElement.style.display === 'none') return;
        // Обновляем позицию тултипа относительно курсора
        // Добавим небольшое смещение, чтобы курсор не перекрывал тултип
        const offsetX = 15;
        const offsetY = 15;
        let x = event.pageX + offsetX;
        let y = event.pageY + offsetY;

        // Проверка, чтобы тултип не вылезал за пределы экрана
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const tooltipRect = tooltipElement.getBoundingClientRect(); // Получаем реальные размеры тултипа

        if (x + tooltipRect.width > screenWidth) {
            x = event.pageX - tooltipRect.width - offsetX; // Перемещаем влево от курсора
        }
        if (y + tooltipRect.height > screenHeight) {
            y = event.pageY - tooltipRect.height - offsetY; // Перемещаем вверх от курсора
        }
        
        tooltipElement.style.left = x + 'px';
        tooltipElement.style.top = y + 'px';
    }

    function handleMouseOverCell(event) {
        if (!isActive || !tooltipElement) return;
        const targetSquare = event.target.closest('.square');
        if (targetSquare) {
            const row = targetSquare.dataset.row;
            const col = targetSquare.dataset.col;
            if (row !== undefined && col !== undefined) {
                const cellKey = `${row}-${col}`;
                const phrase = cellPhraseMap.get(cellKey);
                if (phrase) {
                    tooltipElement.innerHTML = phrase; // Используем innerHTML, если фразы могут содержать HTML (например, <br>)
                                                      // Если только текст, то textContent безопаснее.
                    tooltipElement.style.display = 'block';
                    // Начальное позиционирование, handleMouseMove догонит
                    handleMouseMove(event);
                } else {
                    tooltipElement.style.display = 'none'; // Если для клетки нет фразы
                }
            }
        }
    }

    function handleMouseOutCell(event) {
        if (!isActive || !tooltipElement) return;
        const targetSquare = event.target.closest('.square');
        // Прячем тултип, если мышь ушла с клетки ИЛИ ушла с доски вообще
        // relatedTarget помогает понять, куда ушла мышь
        if (targetSquare && (!event.relatedTarget || !boardElement.contains(event.relatedTarget))) {
             tooltipElement.style.display = 'none';
        } else if (targetSquare && event.relatedTarget && !event.relatedTarget.closest('.square')) {
            // Если ушли с клетки на другой элемент доски, не являющийся клеткой
            tooltipElement.style.display = 'none';
        }
         // Если мышь просто перешла на другую клетку, handleMouseOverCell для новой клетки сработает
         // и обновит/покажет тултип.
    }
    
    // Старые функции displayPhraseOnSquare и removePhraseFromSquare больше не нужны
    // в их первоначальном виде. Если ты хочешь их оставить для чего-то другого,
    // можно их переделать или удалить. Сейчас они не используются.

    // --- ПУБЛИЧНЫЕ МЕТОДЫ МОДУЛЯ ---
    return {
        activate: function(boardDomEl, phrases) {
            if (isActive) {
                debugMessageLocal("PoeticBoardOverlay Already active.");
                return;
            }
            init(boardDomEl, phrases);
        },
        deactivate: function() {
            if (!isActive) {
                debugMessageLocal("PoeticBoardOverlay Already inactive.");
                return;
            }
            detachEventListeners();
            if (tooltipElement && tooltipElement.parentNode) {
                tooltipElement.parentNode.removeChild(tooltipElement); // Удаляем тултип из DOM
                tooltipElement = null;
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
    };

})();
