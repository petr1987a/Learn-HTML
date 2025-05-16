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
