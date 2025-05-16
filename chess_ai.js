// --- Логирующий минимакс, чтобы убедиться что бот не зевает мат в один ход ---
// Эту версию chess_ai.js можно использовать для анализа и отладки, чтобы убедиться, что на ply=2 (ответ соперника) перебираются ВСЕ ходы.

function evaluateBoard(board, getAllLegalMovesFunc) {
    // Пример: быстрая и чуть более сильная оценка
    const pieceValues = {
        'wK': 0,   'wQ': 9,  'wR': 5,  'wB': 3,  'wN': 3,  'wP': 1,
        'bK': 0,   'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    };
    let total = 0;
    // Центр: e4,d4,e5,d5 = [3][3],[3][4],[4][3],[4][4]
    const centerSquares = [
        [3, 3], [3, 4], [4, 3], [4, 4]
    ];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            total += pieceValues[piece] || 0;
            // Бонус за фигуру в центре
            for (const [cr, cc] of centerSquares)
                if (r === cr && c === cc)
                    total += (piece[0] === 'w') ? 0.2 : -0.2;
        }
    }
    // Мат/пат
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

/// --- ВАЖНО: Логика перебора ходов по ply ---
/// ply = 1: ход AI (анализировать все ходы)
/// ply = 2: ответ соперника (анализировать все ходы)
/// ply >= 3: можно ограничивать перебор top-3 + все шахи/маты

function minimaxAlphaBeta(board, depth, alpha, beta, maximizingPlayer, getAllLegalMovesFunc, ply = 1) {
    const currentColor = maximizingPlayer ? 'w' : 'b';
    const opponentColor = maximizingPlayer ? 'b' : 'w';
    let moves = getAllLegalMovesFunc(currentColor, board);
    moves = orderMoves(moves);

    // Для отладки — логируем количество ходов на каждом уровне
    if (typeof console !== "undefined") {
        console.log(`[MINIMAX] ply=${ply} (depth=${depth}), color=${currentColor}, moves count: ${moves.length}`);
    }

    if (ply >= 3) {
        // top-3 + все шахи/маты
        const checkMoves = moves.filter(m => isCheckOrMateMove(m, board, getAllLegalMovesFunc, opponentColor));
        const nonCheckMoves = moves.filter(m => !isCheckOrMateMove(m, board, getAllLegalMovesFunc, opponentColor));
        const topMoves = nonCheckMoves.slice(0, 3).concat(checkMoves);
        // удаляем дубли
        const uniqueMoves = [];
        const seen = new Set();
        for (const move of topMoves) {
            const key = `${move.from.r},${move.from.c},${move.to.tr},${move.to.tc}`;
            if (!seen.has(key)) {
                uniqueMoves.push(move);
                seen.add(key);
            }
        }
        moves = uniqueMoves;
        if (typeof console !== "undefined") {
            console.log(`[MINIMAX] ply=${ply} (depth=${depth}), after top-3+check-moves, moves count: ${moves.length}`);
        }
    }

    if (depth === 0 || moves.length === 0) {
        return { value: evaluateBoard(board, getAllLegalMovesFunc) };
    }

    let bestMove = null;
    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let move of moves) {
            const newBoard = makeMove(board, move);
            const evalResult = minimaxAlphaBeta(
                newBoard, depth - 1, alpha, beta, false, getAllLegalMovesFunc, ply + 1
            );
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
        for (let move of moves) {
            const newBoard = makeMove(board, move);
            const evalResult = minimaxAlphaBeta(
                newBoard, depth - 1, alpha, beta, true, getAllLegalMovesFunc, ply + 1
            );
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
            getAllLegalMovesFunc,
            1 // ply = 1, обязательно!
        );
        return result.move;
    }
};
