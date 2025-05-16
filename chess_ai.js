// chess_ai.js

const ChessAI = {
    // Можно будет добавлять разные уровни сложности или типы AI сюда
    getRandomMove: function(boardState, playerColor, getAllLegalMovesFunc, isValidMoveFunc) {
        // playerColor - цвет бота, который должен сделать ход ('w' или 'b')
        // boardState - текущее состояние доски (массив массивов)
        // getAllLegalMovesFunc - ссылка на нашу функцию getAllLegalMoves из основного скрипта
        // isValidMoveFunc - ссылка на нашу функцию isValidMove из основного скрипта

        const legalMoves = getAllLegalMovesFunc(playerColor, boardState);

        if (legalMoves.length === 0) {
            return null; // Нет доступных ходов (мат или пат)
        }

        const randomMoveData = legalMoves[Math.floor(Math.random() * legalMoves.length)];

        // Важно: getAllLegalMoves возвращает { from: { r, c }, to: { tr, tc } }
        // Нам нужно также получить moveDetails для функции movePiece
        const startRow = randomMoveData.from.r;
        const startCol = randomMoveData.from.c;
        const endRow = randomMoveData.to.tr;
        const endCol = randomMoveData.to.tc;

        // Получаем pieceCode со стартовой клетки для isValidMove
        const pieceCode = boardState[startRow][startCol];
        if (!pieceCode) {
            console.error("AI: Ошибка - на стартовой клетке случайного хода нет фигуры!", randomMoveData);
            return null; // Не должно произойти, если getAllLegalMoves работает корректно
        }

        // Важно передать isValidMoveFunc для получения moveDetails
        // isValidMove также нуждается в текущем состоянии доски, но оно у нас есть (boardState)
        // Однако, isValidMove в текущей реализации использует ГЛОБАЛЬНЫЙ currentBoardState.
        // Это нужно будет поправить, чтобы isValidMove принимал boardState как аргумент.
        // И _getPieceSpecificMoveLogic тоже.
        // Пока допустим, что мы это исправим или что isValidMoveFunc уже адаптирована.
        // Для передачи глобальных переменных, таких как enPassantTargetSquare и флаги рокировки,
        // их тоже нужно будет либо передавать в AI, либо isValidMove должен их как-то получать.
        // ИДЕАЛЬНО: isValidMove и _getPieceSpecificMoveLogic должны принимать полный контекст игры или boardState.

        // --- НАЧАЛО СЕКЦИИ, ТРЕБУЮЩЕЙ ВНИМАНИЯ К ЗАВИСИМОСТЯМ isValidMove ---
        // Предположим, что isValidMove можно вызвать так,
        // или мы передаем все нужные зависимости в ChessAI.getRandomMove
        // Это САМЫЙ СЛОЖНЫЙ МОМЕНТ при вынесении AI.
        // Нам нужна версия isValidMove, которая может работать с переданным состоянием доски
        // и не полагается на глобальные currentBoardState, enPassantTargetSquare и флаги рокировки.
        // Либо мы передаем весь этот "контекст" в функцию AI.

        // Пока что, для простоты, будем считать, что `isValidMoveFunc` - это наш глобальный `isValidMove`,
        // который работает с `currentBoardState`. Это не идеально для чистоты AI модуля, но рабочий вариант для начала.
        const moveDetails = isValidMoveFunc(startRow, startCol, endRow, endCol);
        // --- КОНЕЦ СЕКЦИИ ---

        if (!moveDetails) {
             console.error("AI: Случайный ход оказался невалидным по какой-то причине (это плохо):", randomMoveData);
             // Этого не должно происходить, если getAllLegalMoves работает корректно
             // и возвращает только валидные ходы.
             return null;
        }

        return {
            startRow: startRow,
            startCol: startCol,
            endRow: endRow,
            endCol: endCol,
            pieceCode: pieceCode, // Фигура, которая ходит
            moveDetails: moveDetails // Детали хода для функции movePiece
        };
    }

    // В будущем можно добавить:
    // getGreedyMove: function(boardState, playerColor, ...) { ... }
    // getMinimaxMove: function(boardState, playerColor, depth, ...) { ... }
};

// Если ты хочешь использовать его как модуль (ES6 Modules), можно добавить:
// export default ChessAI;
// Но для простого подключения через <script> это не обязательно.
