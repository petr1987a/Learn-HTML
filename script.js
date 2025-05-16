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
function isValidMove(startRow, startCol, endRow, endCol) {
    const piece = currentBoardState[startRow][startCol];
    const targetPiece = currentBoardState[endRow][endCol];

    if (!piece) return false; // Нельзя ходить пустой клеткой
    if (startRow === endRow && startCol === endCol) return false; // Нельзя ходить на ту же клетку

    // Нельзя ходить на клетку со своей фигурой
    if (targetPiece && targetPiece.startsWith(piece[0])) { // piece[0] - 'w' или 'b'
        return false;
    }

    const pieceType = piece.substring(1); // 'P', 'R', 'N', 'B', 'Q', 'K'
    const pieceColor = piece[0]; // 'w' или 'b'

    switch (pieceType) {
        case 'P': // Пешка
            const direction = (pieceColor === 'w') ? -1 : 1; // -1 для белых (вверх), +1 для черных (вниз)
            const initialRow = (pieceColor === 'w') ? 6 : 1;

            // Обычный ход на одну клетку вперед
            if (endCol === startCol && endRow === startRow + direction && !targetPiece) {
                return true;
            }
            // Первый ход на две клетки вперед
            if (endCol === startCol && startRow === initialRow && endRow === startRow + 2 * direction && !targetPiece && !currentBoardState[startRow + direction][startCol]) {
                return true;
            }
            // Взятие по диагонали
            if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction && targetPiece && !targetPiece.startsWith(pieceColor)) {
                return true;
            }
            // TODO: Взятие на проходе (En Passant)
            // TODO: Превращение пешки
            return false; // Если ни одно из правил пешки не сработало

        case 'R': // Ладья (Rook)
            // TODO: Логика для Ладьи
            console.warn(`Логика ходов для Ладьи еще не реализована!`);
            return (startRow === endRow || startCol === endCol); // Заглушка: по прямой

        case 'N': // Конь (Knight)
            // TODO: Логика для Коня
            console.warn(`Логика ходов для Коня еще не реализована!`);
            const dRow = Math.abs(endRow - startRow);
            const dCol = Math.abs(endCol - startCol);
            return (dRow === 2 && dCol === 1) || (dRow === 1 && dCol === 2); // Заглушка: буквой Г

        case 'B': // Слон (Bishop)
            // TODO: Логика для Слона
            console.warn(`Логика ходов для Слона еще не реализована!`);
            return (Math.abs(endRow - startRow) === Math.abs(endCol - startCol)); // Заглушка: по диагонали

        case 'Q': // Ферзь (Queen)
            // TODO: Логика для Ферзя
            console.warn(`Логика ходов для Ферзя еще не реализована!`);
            return (startRow === endRow || startCol === endCol || Math.abs(endRow - startRow) === Math.abs(endCol - startCol)); // Заглушка: как ладья + слон

        case 'K': // Король (King)
            // TODO: Логика для Короля
            console.warn(`Логика ходов для Короля еще не реализована!`);
            return (Math.abs(endRow - startRow) <= 1 && Math.abs(endCol - startCol) <= 1); // Заглушка: на 1 клетку
            // TODO: Рокировка
        
        default:
            return false; // Неизвестный тип фигуры
    }
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
