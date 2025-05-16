// Добавь это в начало script.js, вне функции DOMContentLoaded, чтобы было глобально доступно
const PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙', // Белые
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'  // Черные
};

// Это наша начальная расстановка. Массив строк.
// 'r' - rook (ладья), 'n' - knight (конь), 'b' - bishop (слон), 'q' - queen (ферзь), 'k' - king (король), 'p' - pawn (пешка)
// Маленькая буква - черные, большая - белые (или наоборот, как договоримся, но давай для JS сделаем так:
// маленькая 'b' или 'w' в начале ключа в PIECES, а здесь просто тип фигуры)
// Чтобы было проще сопоставить с доской, первый элемент массива - 8-я горизонталь, последний - 1-я.
// Пустая строка означает пустую клетку.
const INITIAL_BOARD_SETUP = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], // 8-я горизонталь (черные)
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'], // 7-я горизонталь (черные пешки)
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'], // 2-я горизонталь (белые пешки)
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']  // 1-я горизонталь (белые)
];

document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('chessBoard');
    const boardSize = 8;

    // Наша функция createBoard немного изменится
    function createBoardAndPlacePieces() {
        boardElement.innerHTML = ''; // Очищаем доску перед перерисовкой (на случай будущих обновлений)
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.dataset.row = row; // Сохраняем координаты в data-атрибутах
                square.dataset.col = col;

                if ((row + col) % 2 === 0) {
                    square.style.backgroundColor = '#f0d9b5'; // Светлая
                } else {
                    square.style.backgroundColor = '#b58863'; // Темная
                }

                // Расставляем фигуры
                const pieceCode = INITIAL_BOARD_SETUP[row][col]; // Получаем код фигуры из нашей схемы
                if (pieceCode && PIECES[pieceCode]) {
                    square.textContent = PIECES[pieceCode]; // Ставим Unicode-символ
                    // Добавим класс для цвета фигуры, чтобы можно было стилизовать отдельно
                    if (pieceCode.startsWith('w')) {
                        square.classList.add('white-piece');
                    } else if (pieceCode.startsWith('b')) {
                        square.classList.add('black-piece');
                    }
                }
                
                boardElement.appendChild(square);
            }
        }
    }

    createBoardAndPlacePieces(); // Вызываем обновленную функцию
    console.log('Шахматная доска с фигурами сгенерирована! 駒配置完了！');
});
document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('chessBoard');
    const boardSize = 8; // 8x8 доска

    function createBoard() {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                // square.dataset.row = row; // Можно добавить data-атрибуты для идентификации
                // square.dataset.col = col;

                // Определяем цвет клетки
                if ((row + col) % 2 === 0) {
                    square.style.backgroundColor = '#f0d9b5'; // Светлая клетка (например, "деревянная")
                } else {
                    square.style.backgroundColor = '#b58863'; // Темная клетка
                }
                
                // Пока просто добавим координаты для наглядности (потом уберем)
                // square.textContent = `${String.fromCharCode(97 + col)}${boardSize - row}`; 
                
                boardElement.appendChild(square);
            }
        }
    }

    createBoard();
    console.log('Шахматная доска сгенерирована! 盤面生成完了！'); // Немного японского для колорита 😉
});
