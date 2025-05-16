// ChessAI with parallel calculation (Web Worker) and mate-in-one protection (all in one file!)
// Usage: ChessAI.getSmartMove(board, color, getAllLegalMoves, isKingInCheck).then(move => { ... })

const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc, isKingInCheckFunc) {
        return new Promise((resolve, reject) => {
            const moves = getAllLegalMovesFunc(playerColor, boardStateFromGame);
            // --- Worker code as string ---
            const workerCode = `
                onmessage = function(event) {
                    const { board, playerColor, move, depth, getAllLegalMovesStr, isKingInCheckStr } = event.data;
                    const getAllLegalMovesFunc = eval('(' + getAllLegalMovesStr + ')');
                    const isKingInCheckFunc = eval('(' + isKingInCheckStr + ')');
                    
                    function cloneBoard(board) {
                        return board.map(row => row.slice());
                    }
                    function makeMove(board, move) {
                        const newBoard = cloneBoard(board);
                        newBoard[move.to.tr][move.to.tc] = newBoard[move.from.r][move.from.c];
                        newBoard[move.from.r][move.from.c] = '';
                        return newBoard;
                    }
                    function evaluateBoard(board, getAllLegalMovesFunc, isKingInCheckFunc) {
                        const pieceValues = {
                            'wK': 0,   'wQ': 9,  'wR': 5,  'wB': 3,  'wN': 3,  'wP': 1,
                            'bK': 0,   'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
                        };
                        let total = 0;
                        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                            const piece = board[r][c];
                            if (piece) total += pieceValues[piece] || 0;
                        }
                        // Mate/stalemate
                        const botColor = 'b';
                        const humanColor = 'w';
                        const botMoves = getAllLegalMovesFunc(botColor, board);
                        const humanMoves = getAllLegalMovesFunc(humanColor, board);

                        if (botMoves.length === 0) {
                            if (isKingInCheckFunc(botColor, board)) return -10000;
                            else return 0;
                        }
                        if (humanMoves.length === 0) {
                            if (isKingInCheckFunc(humanColor, board)) return 10000;
                            else return 0;
                        }
                        return total;
                    }
                    function isCheckOrMateMove(move, board, getAllLegalMovesFunc, isKingInCheckFunc, opponentColor) {
                        const tempBoard = makeMove(board, move);
                        return isKingInCheckFunc(opponentColor, tempBoard);
                    }
                    function orderMoves(moves) {
                        return moves.slice().sort((a, b) => {
                            const aIsCapture = a.details && (a.details.type === 'capture' || a.details.type === 'en_passant');
                            const bIsCapture = b.details && (b.details.type === 'capture' || b.details.type === 'en_passant');
                            if (aIsCapture && !bIsCapture) return -1;
                            if (!aIsCapture && bIsCapture) return 1;
                            return 0;
                        });
                    }
                    function minimax(board, depth, alpha, beta, maximizingPlayer, getAllLegalMovesFunc, isKingInCheckFunc, ply) {
                        const currentColor = maximizingPlayer ? 'w' : 'b';
                        const opponentColor = maximizingPlayer ? 'b' : 'w';
                        let moves = getAllLegalMovesFunc(currentColor, board);
                        moves = orderMoves(moves);

                        // Speed-up: on ply=2, filter if too many
                        if (ply === 2 && moves.length > 20) {
                            const checkMoves = moves.filter(m => isCheckOrMateMove(m, board, getAllLegalMovesFunc, isKingInCheckFunc, opponentColor));
                            const nonCheckMoves = moves.filter(m => !isCheckOrMateMove(m, board, getAllLegalMovesFunc, isKingInCheckFunc, opponentColor));
                            const topMoves = nonCheckMoves.slice(0, 8).concat(checkMoves);
                            const uniqueMoves = [];
                            const seen = new Set();
                            for (const move of topMoves) {
                                const key = move.from.r + ',' + move.from.c + ',' + move.to.tr + ',' + move.to.tc;
                                if (!seen.has(key)) {
                                    uniqueMoves.push(move);
                                    seen.add(key);
                                }
                            }
                            moves = uniqueMoves;
                        }
                        // ply >= 3 — only top-3 + checks
                        if (ply >= 3) {
                            const checkMoves = moves.filter(m => isCheckOrMateMove(m, board, getAllLegalMovesFunc, isKingInCheckFunc, opponentColor));
                            const nonCheckMoves = moves.filter(m => !isCheckOrMateMove(m, board, getAllLegalMovesFunc, isKingInCheckFunc, opponentColor));
                            const topMoves = nonCheckMoves.slice(0, 3).concat(checkMoves);
                            const uniqueMoves = [];
                            const seen = new Set();
                            for (const move of topMoves) {
                                const key = move.from.r + ',' + move.from.c + ',' + move.to.tr + ',' + move.to.tc;
                                if (!seen.has(key)) {
                                    uniqueMoves.push(move);
                                    seen.add(key);
                                }
                            }
                            moves = uniqueMoves;
                        }
                        if (depth === 0 || moves.length === 0) {
                            return { value: evaluateBoard(board, getAllLegalMovesFunc, isKingInCheckFunc) };
                        }
                        let bestMove = null;
                        if (maximizingPlayer) {
                            let maxEval = -Infinity;
                            for (let move of moves) {
                                const newBoard = makeMove(board, move);
                                const evalResult = minimax(
                                    newBoard, depth - 1, alpha, beta, false, getAllLegalMovesFunc, isKingInCheckFunc, ply + 1
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
                                const evalResult = minimax(
                                    newBoard, depth - 1, alpha, beta, true, getAllLegalMovesFunc, isKingInCheckFunc, ply + 1
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
                    const boardAfterMove = makeMove(board, move);
                    const maximizing = (playerColor === 'w');
                    const result = minimax(
                        boardAfterMove,
                        3 - 1,
                        -Infinity,
                        Infinity,
                        !maximizing,
                        getAllLegalMovesFunc,
                        isKingInCheckFunc,
                        2
                    );
                    postMessage({ move, value: result.value });
                };
            `;
            // --- End worker code ---
            const workerBlob = new Blob([workerCode], { type: "application/javascript" });
            const workerURL = URL.createObjectURL(workerBlob);

            const getAllLegalMovesStr = getAllLegalMovesFunc.toString();
            const isKingInCheckStr = isKingInCheckFunc.toString();

            let results = [];
            let finished = 0;

            if (moves.length === 0) {
                resolve(null);
                return;
            }

            moves.forEach(move => {
                const worker = new Worker(workerURL);
                worker.postMessage({
                    board: boardStateFromGame,
                    playerColor,
                    move,
                    getAllLegalMovesStr,
                    isKingInCheckStr,
                    depth: 3
                });
                worker.onmessage = function(e) {
                    results.push(e.data);
                    finished++;
                    worker.terminate();
                    if (finished === moves.length) {
                        if (playerColor === 'w') {
                            results.sort((a, b) => b.value - a.value);
                        } else {
                            results.sort((a, b) => a.value - b.value);
                        }
                        resolve(results[0].move);
                    }
                };
                worker.onerror = function(err) {
                    finished++;
                    worker.terminate();
                    if (finished === moves.length && results.length > 0) {
                        resolve(results[0].move);
                    }
                };
            });
        });
    }
};
