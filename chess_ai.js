// ChessAI: умный минимакс с простыми шахматными эвристиками
const ChessAI = {
    // --- Константы ---
    BOARD_SIZE: 8,

    PIECE_VALUES: {
        'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1,
        'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    },

    // Коэффициенты для эвристик
    EVAL_COEFFICIENTS: {
        CENTER_PAWN_CONTROL: 0.3,
        MINOR_PIECE_DEVELOPMENT: 0.2,
        ADVANCED_PAWN: 0.35,
        EARLY_QUEEN_PENALTY: -0.3, // Отрицательный, т.к. это штраф
        UNCASTLED_KING_PENALTY: -0.3, // Штраф для белых
        // Можно добавить бонус за рокированного короля, если есть инфо о рокировке
        // CASTLED_KING_BONUS: 0.5,
    },

    // Для сортировки ходов (абсолютные значения)
    ORDERING_PIECE_VALUES: {
        'K': 0, 'Q': 9, 'R': 5, 'B': 3, 'N': 3, 'P': 1
    },

    // --- Вспомогательные функции для доски ---
    _cloneBoard: function(board) {
        return board.map(row => row.slice());
    },

    _makeMove: function(board, move) {
        const newBoard = this._cloneBoard(board);
        // Проверка на корректность хода (если to и from существуют)
        if (move.to && move.from &&
            newBoard[move.from.r] && newBoard[move.from.r][move.from.c] !== undefined) {
            newBoard[move.to.tr][move.to.tc] = newBoard[move.from.r][move.from.c];
            newBoard[move.from.r][move.from.c] = '';

            // Обработка взятия на проходе (если такая информация есть в move.details)
            if (move.details && move.details.type === 'enpassant') {
                const capturedPawnRow = move.to.tr === 2 ? 3 : 4; // Белые берут на 3, черные на 4
                newBoard[capturedPawnRow][move.to.tc] = '';
            }
            // Обработка превращения пешки
            if (move.details && move.details.type === 'promotion') {
                 // Предполагаем, что ход содержит информацию о фигуре превращения, например, move.promotionPiece
                newBoard[move.to.tr][move.to.tc] = move.promotionPiece || (newBoard[move.to.tr][move.to.tc][0] + 'Q'); // По умолчанию ферзь
            }
            // Обработка рокировки (если такая информация есть в move.details)
            if (move.details && move.details.type === 'castling') {
                const rookFromCol = move.to.tc === 6 ? 7 : 0; // g-файл (короткая) или c-файл (длинная)
                const rookToCol = move.to.tc === 6 ? 5 : 3;   // f-файл или d-файл
                newBoard[move.from.r][rookToCol] = newBoard[move.from.r][rookFromCol];
                newBoard[move.from.r][rookFromCol] = '';
            }

        } else {
            console.warn("Попытка сделать некорректный ход в _makeMove:", move, board);
        }
        return newBoard;
    },

    // --- Оценочная функция ---
    _evaluateBoard: function(board, playerColor) { // playerColor может быть нужен для асимметричных эвристик
        let total = 0;
        let whiteCenterPawns = 0, blackCenterPawns = 0;
        let whiteMinorDev = 0, blackMinorDev = 0;
        let whiteAdvancedPawns = 0, blackAdvancedPawns = 0;
        let whiteKingOnStart = false, blackKingOnStart = false;
        let whiteRooksOnStartFiles = 0, blackRooksOnStartFiles = 0;
        let whiteQueenMovedEarly = 0, blackQueenMovedEarly = 0;

        // Центр: d4,e4,d5,e5 -> (3,3),(3,4),(4,3),(4,4) для доски 8x8, где (0,0) - a8
        // Если (0,0) это a1, то (3,3),(3,4),(4,3),(4,4) будут e4,d4,e5,d5
        // В коде (0,0) это a8, (7,7) это h1. Значит, центр это (3,3)d5,(3,4)e5,(4,3)d4,(4,4)e4
        const centerSquares = [[3,3],[3,4],[4,3],[4,4]];

        for (let r = 0; r < this.BOARD_SIZE; r++) {
            for (let c = 0; c < this.BOARD_SIZE; c++) {
                const piece = board[r][c];
                if (!piece) continue;

                total += this.PIECE_VALUES[piece] || 0;

                const pieceType = piece.substring(1);
                const pieceColor = piece.substring(0,1);

                // Контроль центра пешками
                if (pieceType === 'P' && centerSquares.some(([cr,cc]) => cr === r && cc === c)) {
                    if (pieceColor === 'w') whiteCenterPawns++;
                    else blackCenterPawns++;
                }

                // Развитие легких фигур (кони и слоны не на начальных позициях)
                // Белые: не на 7-й горизонтали (индекс 7). Черные: не на 0-й горизонтали.
                if (pieceType === 'N' || pieceType === 'B') {
                    if (pieceColor === 'w' && r < 7) whiteMinorDev++;
                    if (pieceColor === 'b' && r > 0) blackMinorDev++;
                }

                // Продвинутые пешки: белые на 6-й (индекс 1), черные на 3-й (индекс 6)
                if (pieceType === 'P') {
                    if (pieceColor === 'w' && r === 1) whiteAdvancedPawns++; // Предполагается, что пешка скоро превратится
                    if (pieceColor === 'b' && r === 6) blackAdvancedPawns++;
                }

                // Ранний выход ферзя (если ферзь не на последних двух горизонталях для белых / первых двух для черных)
                // и при этом не развиты легкие фигуры (упрощенно: если он просто сдвинулся далеко)
                if (pieceType === 'Q') {
                    if (pieceColor === 'w' && r < 6 && (board[7][1] === 'wN' || board[7][6] === 'wN' || board[7][2] === 'wB' || board[7][5] === 'wB')) whiteQueenMovedEarly++; // Пример: если ферзь на 1-6 рядах, а кони/слоны еще дома
                    if (pieceColor === 'b' && r > 1 && (board[0][1] === 'bN' || board[0][6] === 'bN' || board[0][2] === 'bB' || board[0][5] === 'bB')) blackQueenMovedEarly++;
                }
            }
        }

        // Король на исходной
        if (board[7] && board[7][4] === 'wK') whiteKingOnStart = true;
        if (board[0] && board[0][4] === 'bK') blackKingOnStart = true;

        // Ладьи на исходных (для проверки потенциальной рокировки)
        if (board[7]) {
            if (board[7][0] === 'wR') whiteRooksOnStartFiles++;
            if (board[7][7] === 'wR') whiteRooksOnStartFiles++;
        }
        if (board[0]) {
            if (board[0][0] === 'bR') blackRooksOnStartFiles++;
            if (board[0][7] === 'bR') blackRooksOnStartFiles++;
        }

        // Суммируем бонусы/штрафы
        total += (whiteCenterPawns - blackCenterPawns) * this.EVAL_COEFFICIENTS.CENTER_PAWN_CONTROL;
        total += (whiteMinorDev - blackMinorDev) * this.EVAL_COEFFICIENTS.MINOR_PIECE_DEVELOPMENT;
        total += (whiteAdvancedPawns - blackAdvancedPawns) * this.EVAL_COEFFICIENTS.ADVANCED_PAWN;
        total += (whiteQueenMovedEarly - blackQueenMovedEarly) * this.EVAL_COEFFICIENTS.EARLY_QUEEN_PENALTY;

        // Безопасность короля: штраф, если король и обе ладьи на месте (за не рокированного)
        // Этот штраф применяется, если ИИ играет за белых и белый король не рокирован,
        // или если ИИ играет за черных и черный король рокирован (значит, для противника это хорошо).
        // Мы оцениваем позицию с точки зрения белых.
        if (whiteKingOnStart && whiteRooksOnStartFiles === 2) {
            total += this.EVAL_COEFFICIENTS.UNCASTLED_KING_PENALTY;
        }
        if (blackKingOnStart && blackRooksOnStartFiles === 2) {
            total -= this.EVAL_COEFFICIENTS.UNCASTLED_KING_PENALTY; // Зеркальный штраф для черных (т.е. бонус для белых)
        }
        
        // Если playerColor === 'b', инвертируем оценку, т.к. минимакс ищет максимум для текущего игрока
        // Однако, стандартный минимакс уже обрабатывает это через maximizingPlayer.
        // Эта оценочная функция всегда возвращает оценку с точки зрения белых.
        return total;
    },

    // --- Алгоритм Минимакс с альфа-бета отсечением ---
    _minimax: function(board, depth, alpha, beta, maximizingPlayer, getAllLegalMovesFunc, isKingInCheckFunc) {
        if (depth === 0) {
            return { value: this._evaluateBoard(board, maximizingPlayer ? 'w' : 'b') }; // Передаем цвет для возможной асимметрии
        }

        const currentColor = maximizingPlayer ? 'w' : 'b';
        const moves = getAllLegalMovesFunc(currentColor, board, this.BOARD_SIZE);

        if (moves.length === 0) {
            if (isKingInCheckFunc(currentColor, board, this.BOARD_SIZE)) {
                return { value: maximizingPlayer ? -10000 - depth : 10000 + depth }; // Мат ближе -> хуже/лучше
            } else {
                return { value: 0 }; // Пат
            }
        }

        let bestValue = maximizingPlayer ? -Infinity : Infinity;
        // let bestMoveForThisNode = null; // Для отладки или если бы минимакс возвращал ход

        const orderedMoves = this._orderMoves(moves, board, currentColor); // Передаем board и currentColor для MVV-LVA

        for (const move of orderedMoves) {
            const newBoard = this._makeMove(board, move); // Используем this._makeMove
            const result = this._minimax(newBoard, depth - 1, alpha, beta, !maximizingPlayer, getAllLegalMovesFunc, isKingInCheckFunc);

            if (maximizingPlayer) {
                if (result.value > bestValue) {
                    bestValue = result.value;
                    // bestMoveForThisNode = move;
                }
                alpha = Math.max(alpha, bestValue);
            } else {
                if (result.value < bestValue) {
                    bestValue = result.value;
                    // bestMoveForThisNode = move;
                }
                beta = Math.min(beta, bestValue);
            }
            if (beta <= alpha) {
                break; // Альфа-бета отсечение
            }
        }
        return { value: bestValue /*, move: bestMoveForThisNode */ };
    },

    // --- Сортировка ходов ---
    _orderMoves: function(moves, board, attackerColor) {
        // MVV-LVA: Most Valuable Victim - Least Valuable Aggressor
        // Сначала ходы, дающие шах, затем взятия, затем остальные.
        const getPieceAbsoluteValue = (pieceSymbol) => {
            if (!pieceSymbol) return 0;
            return this.ORDERING_PIECE_VALUES[pieceSymbol.substring(1)] || 0;
        };

        return moves.slice().sort((a, b) => {
            let aScore = 0;
            let bScore = 0;

            // 1. Шахи (можно добавить, если isKingInCheckFunc быстрая и может проверять гипотетический ход)
            // ... (пропущено для простоты, т.к. требует проверки шаха после каждого хода)

            // 2. Взятия (MVV-LVA)
            const aIsCapture = a.details && a.details.type === 'capture';
            const bIsCapture = b.details && b.details.type === 'capture';

            if (aIsCapture) {
                const victimValue = getPieceAbsoluteValue(a.capturedPiece);
                const aggressorPieceSymbol = board[a.from.r][a.from.c];
                const aggressorValue = getPieceAbsoluteValue(aggressorPieceSymbol);
                // Чем больше ценность жертвы и меньше ценность атакующего, тем лучше
                aScore = 100 + victimValue * 10 - aggressorValue; // *10 для приоритета жертвы
            }
            if (bIsCapture) {
                const victimValue = getPieceAbsoluteValue(b.capturedPiece);
                const aggressorPieceSymbol = board[b.from.r][b.from.c];
                const aggressorValue = getPieceAbsoluteValue(aggressorPieceSymbol);
                bScore = 100 + victimValue * 10 - aggressorValue;
            }
            
            // 3. Прочие эвристики для сортировки (например, продвижение пешек)
            // ...

            return bScore - aScore; // Сортировка по убыванию "хорошести" хода
        });
    },

    // --- Основная функция выбора хода ---
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc, isKingInCheckFunc) {
        return new Promise((resolve) => {
            // BOARD_SIZE теперь константа объекта
            const moves = getAllLegalMovesFunc(playerColor, boardStateFromGame, this.BOARD_SIZE);

            if (!moves || moves.length === 0) {
                console.log("Нет доступных ходов для", playerColor);
                resolve(null);
                return;
            }

            // Сортировка ходов на верхнем уровне
            const orderedMoves = this._orderMoves(moves, boardStateFromGame, playerColor);

            // Динамическая глубина
            let depth = 5; // Базовая глубина
            const numMoves = orderedMoves.length;
            if (numMoves <= 5) depth = 7;       // Очень мало ходов, можно глубже
            else if (numMoves <= 10) depth = 6; 
            else if (numMoves >= 25) depth = 4; 
            else if (numMoves >= 35) depth = 3;  // Много ходов, уменьшаем глубину

            console.log(`ChessAI (${playerColor}): ${numMoves} ходов, глубина поиска: ${depth}`);


            let bestMove = null;
            let bestValue = playerColor === 'w' ? -Infinity : Infinity;
            let alpha = -Infinity;
            let beta = Infinity;

            for (const move of orderedMoves) {
                const newBoard = this._makeMove(this._cloneBoard(boardStateFromGame), move); // Клонируем оригинальную доску
                
                // На первом уровне maximizingPlayer - это противник
                const result = this._minimax(newBoard, depth - 1, alpha, beta, playerColor !== 'w', getAllLegalMovesFunc, isKingInCheckFunc);
                
                // console.log(`Ход: ${String.fromCharCode(97+move.from.c)}${8-move.from.r}-${String.fromCharCode(97+move.to.tc)}${8-move.to.tr}, Оценка: ${result.value}`);


                if (playerColor === 'w') {
                    if (result.value > bestValue) {
                        bestValue = result.value;
                        bestMove = move;
                    }
                    alpha = Math.max(alpha, bestValue); // Обновляем alpha для корневого узла
                } else { // playerColor === 'b'
                    if (result.value < bestValue) {
                        bestValue = result.value;
                        bestMove = move;
                    }
                    beta = Math.min(beta, bestValue); // Обновляем beta для корневого узла
                }
                // На верхнем уровне нет отсечения beta <= alpha, т.к. мы должны рассмотреть все корневые ходы,
                // но alpha/beta передаются вглубь для отсечений там.
            }
            if (!bestMove && orderedMoves.length > 0) {
                console.warn("Не удалось выбрать лучший ход, хотя ходы были. Выбираем первый из списка.");
                bestMove = orderedMoves[0];
            }
            
            console.log(`ChessAI (${playerColor}) выбрал ход:`, bestMove, `с оценкой: ${bestValue}`);
            resolve(bestMove);
        });
    }
};

// Пример использования (если бы это был отдельный файл и его нужно было экспортировать)
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = ChessAI;
// }
