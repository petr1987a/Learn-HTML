const PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

// Начальная позиция: r=ладья, n=конь, b=слон, q=ферзь, k=король, p=пешка
// Верхний регистр - белые (w), нижний - черные (b) в PIECES
// Массив представляет доску сверху вниз (8-я горизонталь -> 1-я)
const initialBoardSetup = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

let currentBoardState = []; // Будет хранить текущее состояние доски (копии initialBoardSetup)
let selectedSquare = null; // { row, col, piece }
let currentPlayer = 'w'; // 'w' - белые, 'b' - черные

const boardElement = document.getElementById('chessBoard');
const messageElement = document.getElementById('message');
const currentPlayerElement = document.getElementById('currentPlayer');
const resetButton = document.getElementById('resetButton');
const boardSize = 8;

function initializeBoard() {
    currentBoardState = JSON.parse(JSON.stringify(initialBoardSetup)); // Глубокое копирование
    selectedSquare = null;
    currentPlayer = 'w';
    renderBoard();
    updateInfoPanel();
    console.log('Доска инициализирована. 初期化完了！');
}

function renderBoard() {
    boardElement.innerHTML = ''; // Очищаем доску
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const pieceCode = currentBoardState[row][col];
            if (pieceCode) {
                square.textContent = PIECES[pieceCode];
                square.classList.add('piece');
                square.classList.add(pieceCode.startsWith('w') ? 'white' : 'black');
            }

            square.addEventListener('click', () => onSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
    // Если есть выбранная клетка, подсветить её
    if (selectedSquare) {
        const domSquare = boardElement.querySelector(`.square[data-row='${selectedSquare.row}'][data-col='${selectedSquare.col}']`);
        if (domSquare) domSquare.classList.add('selected');
    }
}

function onSquareClick(row, col) {
    console.log(`Клик по клетке: (${row}, ${col})`);
    const pieceCode = currentBoardState[row][col];

    if (selectedSquare) {
        // Если уже выбрана фигура, пытаемся сделать ход
        const targetPiece = pieceCode;
        // TODO: Проверка легальности хода
        // Пока просто перемещаем, если клетка пустая или вражеская (без проверки легальности)
        if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
            movePiece(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            // TODO: Смена игрока и другие действия после хода
            switchPlayer();
            // Очищаем подсветку возможных ходов
            clearPossibleMovesHighlight();
        } else if (selectedSquare.row === row && selectedSquare.col === col) {
            // Клик по той же клетке - отменить выбор
            selectedSquare = null;
            clearPossibleMovesHighlight();
            renderBoard(); // Перерисовать, чтобы убрать .selected
            updateInfoPanel("Выберите фигуру для хода.");
        } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
             // Клик по другой своей фигуре - перевыбрать
            clearPossibleMovesHighlight();
            selectedSquare = { row, col, piece: pieceCode };
            renderBoard(); // Перерисовать для .selected
            highlightPossibleMoves(row, col, pieceCode);
            updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        } else {
            // Неверный ход или клик не на свою фигуру
             updateInfoPanel("Неверный ход или не ваша фигура. Попробуйте снова.");
             console.log("Неверный ход или не та фигура");
        }

    } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
        // Если фигура не выбрана и кликнули на свою фигуру
        selectedSquare = { row, col, piece: pieceCode };
        renderBoard(); // Перерисовать, чтобы добавить класс .selected
        highlightPossibleMoves(row, col, pieceCode); // Подсветить возможные ходы
        updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
    } else if (pieceCode && !pieceCode.startsWith(currentPlayer)){
        updateInfoPanel("Сейчас не ваш ход!");
    } else {
        updateInfoPanel("Пустая клетка. Выберите свою фигуру.");
    }
}

function isValidMove(startRow, startCol, endRow, endCol) {
    // ЗАГЛУШКА: Пока любой ход на пустую клетку или на вражескую считается валидным
    // В будущем здесь будет сложная логика проверки ходов для каждой фигуры
    const piece = currentBoardState[startRow][startCol];
    const targetPiece = currentBoardState[endRow][endCol];

    if (!piece) return false; // Нельзя ходить пустой клеткой

    // Нельзя ходить на клетку со своей фигурой
    if (targetPiece && targetPiece.startsWith(piece[0])) { // piece[0] - 'w' или 'b'
        return false;
    }
    
    // Проверка для пешки (очень упрощенная, только вперед на 1 или 2 с начальной)
    if (piece.endsWith('P')) { // 'wP' или 'bP'
        const direction = piece.startsWith('w') ? -1 : 1; // Белые вверх (-1), черные вниз (+1)
        const startRank = piece.startsWith('w') ? 6 : 1;

        // Ход на одну клетку вперед
        if (endCol === startCol && endRow === startRow + direction && !targetPiece) {
            return true;
        }
        // Ход на две клетки вперед с начальной позиции
        if (endCol === startCol && startRow === startRank && endRow === startRow + 2 * direction && !targetPiece && !currentBoardState[startRow + direction][startCol]) {
            return true;
        }
        // Взятие по диагонали
        if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction && targetPiece && !targetPiece.startsWith(piece[0])) {
            return true;
        }
        return false; // Другие ходы пешкой пока не реализованы
    }

    // ЗАГЛУШКА: Для остальных фигур пока разрешаем любой ход (кроме на свои)
    // Это нужно будет заменить реальной логикой!
    console.warn(`Логика ходов для ${PIECES[piece]} еще не полностью реализована!`);
    return true; // Временное разрешение
}

function highlightPossibleMoves(row, col, pieceCode) {
    clearPossibleMovesHighlight(); // Сначала очистить старые подсветки
    // ЗАГЛУШКА: Здесь должна быть логика определения РЕАЛЬНЫХ возможных ходов
    // Пока просто подсветим все клетки для примера (чтобы видеть, что функция вызывается)
    // Реальная логика будет похожа на isValidMove, но для всех клеток доски
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (isValidMove(row, col, r, c)) {
                 const domSquare = boardElement.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
                 if (domSquare) domSquare.classList.add('possible-move');
            }
        }
    }
}

function clearPossibleMovesHighlight() {
    document.querySelectorAll('.possible-move').forEach(sq => sq.classList.remove('possible-move'));
}


function movePiece(startRow, startCol, endRow, endCol) {
    const piece = currentBoardState[startRow][startCol];
    currentBoardState[endRow][endCol] = piece;
    currentBoardState[startRow][startCol] = '';
    // TODO: Проверка на шах, мат, пат, превращение пешки
    renderBoard(); // Перерисовать доску с новой позицией
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}. Выберите фигуру.`);
}

function updateInfoPanel(message = "") {
    currentPlayerElement.textContent = currentPlayer === 'w' ? 'Белых' : 'Черных';
    if (message) {
        messageElement.textContent = message;
    }
}

resetButton.addEventListener('click', initializeBoard);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initializeBoard);
