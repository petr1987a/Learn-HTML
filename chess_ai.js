// Пример минимакса для шахматного бота

function evaluateBoard(board) {
    // Простая оценочная функция: сумма стоимости фигур
    const pieceValues = {
        'wK': 1000, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1,
        'bK': -1000, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    };
    let total = 0;
    for (let row of board) {
        for (let piece of row) {
            if (piece) total += pieceValues[piece] || 0;
        }
    }
    return total;
}

// Копирование доски для симуляции ходов
function cloneBoard(board) {
    return board.map(row => row.slice());
}

// Применение хода (должна быть совместима с вашей структурой данных)
function makeMove(board, move) {
    const newBoard = cloneBoard(board);
    newBoard[move.to.tr][move.to.tc] = newBoard[move.from.r][move.from.c];
    newBoard[move.from.r][move.from.c] = '';
    return newBoard;
}

// Минимакс на глубину 2
function findBestMove(board, playerColor, getAllLegalMovesFunc) {
    const moves = getAllLegalMovesFunc(playerColor, board);
    let bestScore = playerColor === 'w' ? -Infinity : Infinity;
    let bestMove = null;

    for (const move of moves) {
        const simulatedBoard = makeMove(board, move);
        // Соперник
        const opponent = playerColor === 'w' ? 'b' : 'w';
        const opponentMoves = getAllLegalMovesFunc(opponent, simulatedBoard);

        // Если у соперника нет ходов (мат/пат)
        if (opponentMoves.length === 0) {
            const score = evaluateBoard(simulatedBoard);
            if ((playerColor === 'w' && score > bestScore) ||
                (playerColor === 'b' && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
            continue;
        }

        // Минимакс: выбираем лучший ответ соперника
        let worstScore = playerColor === 'w' ? Infinity : -Infinity;
        for (const oppMove of opponentMoves) {
            const oppBoard = makeMove(simulatedBoard, oppMove);
            const score = evaluateBoard(oppBoard);
            if (playerColor === 'w') {
                if (score < worstScore) worstScore = score;
            } else {
                if (score > worstScore) worstScore = score;
            }
        }
        if ((playerColor === 'w' && worstScore > bestScore) ||
            (playerColor === 'b' && worstScore < bestScore)) {
            bestScore = worstScore;
            bestMove = move;
        }
    }
    return bestMove;
}

// Использование внутри AI:
const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc) {
        return findBestMove(boardStateFromGame, playerColor, getAllLegalMovesFunc);
    }
};
