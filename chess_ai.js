// --- Оценочная функция, учёт мата и пата ---
function evaluateBoard(board, getAllLegalMovesFunc) {
    const botColor = 'b';
    const humanColor = 'w';
    const botMoves = getAllLegalMovesFunc(botColor, board);
    const humanMoves = getAllLegalMovesFunc(humanColor, board);

    if (botMoves.length === 0) {
        if (isKingInCheck(botColor, board)) return -10000; // Мат боту
        else return 0; // Пат
    }
    if (humanMoves.length === 0) {
        if (isKingInCheck(humanColor, board)) return 10000; // Мат человеку
        else return 0; // Пат
    }
    // Материальная оценка
    const pieceValues = {
        'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1,
        'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    };
    let total = 0;
    for (let row of board) {
        for (let piece of row) {
            if (piece) total += pieceValues[piece] || 0;
        }
    }
    return total;
}

function cloneBoard(board) {
    return board.map(row => row.slice());
}

function makeMove(board, move) {
    const newBoard = cloneBoard(board);
    newBoard[move.to.tr][move.to.tc] = newBoard[move.from.r][move.from.c];
    newBoard[move.from.r][move.from.c] = '';
    return newBoard;
}

// Move ordering: сначала взятия, потом остальные
function orderMoves(moves) {
    // Ходы с details.type === 'capture' или 'en_passant' идут первыми
    return moves.slice().sort((a, b) => {
        const aIsCapture = a.details && (a.details.type === 'capture' || a.details.type === 'en_passant');
        const bIsCapture = b.details && (b.details.type === 'capture' || b.details.type === 'en_passant');
        if (aIsCapture && !bIsCapture) return -1;
        if (!aIsCapture && bIsCapture) return 1;
        return 0;
    });
}

// Проверка, даёт ли ход шах/мат
function isCheckOrMateMove(move, board, getAllLegalMovesFunc, opponentColor) {
    const tempBoard = makeMove(board, move);
    return isKingInCheck(opponentColor, tempBoard);
}

// --- Минимакс с альфа-бета, move ordering и гарантией поиска шахов/матов ---
function minimaxAlphaBeta(board, depth, alpha, beta, maximizingPlayer, getAllLegalMovesFunc) {
    const currentColor = maximizingPlayer ? 'w' : 'b';
    const opponentColor = maximizingPlayer ? 'b' : 'w';
    let moves = getAllLegalMovesFunc(currentColor, board);
    moves = orderMoves(moves);

    // Всегда добавить все ходы, дающие шах/мат, даже если их больше 3!
    const checkMoves = moves.filter(m => isCheckOrMateMove(m, board, getAllLegalMovesFunc, opponentColor));
    const nonCheckMoves = moves.filter(m => !isCheckOrMateMove(m, board, getAllLegalMovesFunc, opponentColor));
    // top-3 обычных + все шахи/маты
    const topMoves = nonCheckMoves.slice(0, 3).concat(checkMoves);
    // удаляем дубли
    const uniqueMoves = [];
    const seen = new Set();
    for (const move of topMoves) {
        // Сериализуем ход для сравнения (можно по from/to)
        const key = `${move.from.r},${move.from.c},${move.to.tr},${move.to.tc}`;
        if (!seen.has(key)) {
            uniqueMoves.push(move);
            seen.add(key);
        }
    }

    if (depth === 0 || uniqueMoves.length === 0) {
        return { value: evaluateBoard(board, getAllLegalMovesFunc) };
    }

    let bestMove = null;
    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let move of uniqueMoves) {
            const newBoard = makeMove(board, move);
            const evalResult = minimaxAlphaBeta(newBoard, depth - 1, alpha, beta, false, getAllLegalMovesFunc);
            if (evalResult.value > maxEval) {
                maxEval = evalResult.value;
                bestMove = move;
            }
            alpha = Math.max(alpha, evalResult.value);
            if (beta <= alpha) break;
        }
        return { value: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (let move of uniqueMoves) {
            const newBoard = makeMove(board, move);
            const evalResult = minimaxAlphaBeta(newBoard, depth - 1, alpha, beta, true, getAllLegalMovesFunc);
            if (evalResult.value < minEval) {
                minEval = evalResult.value;
                bestMove = move;
            }
            beta = Math.min(beta, evalResult.value);
            if (beta <= alpha) break;
        }
        return { value: minEval, move: bestMove };
    }
}

// --- Основной AI-интерфейс ---
const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc) {
        const depth = 3;
        const maximizingPlayer = (playerColor === 'w');
        const result = minimaxAlphaBeta(
            boardStateFromGame,
            depth,
            -Infinity,
            Infinity,
            maximizingPlayer,
            getAllLegalMovesFunc
        );
        return result.move;
    }
};
