// В САМОЕ НАЧАЛО script.js
function debugMessage(msg) {
    if (messageElement) {
        const currentInfoPanelMsg = messageElement.textContent;
        messageElement.textContent = `DEBUG: ${msg} | ${currentInfoPanelMsg.substring(0, 150)}`;
    }
    console.log("DEBUG: " + msg);
}
// --- КОНЕЦ ФУНКЦИИ DEBUGMESSAGE ---

const PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

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

let currentBoardState = [];
let selectedSquare = null; // { row, col, piece }
let currentPlayer = 'w'; // 'w' - белые, 'b' - черные
const boardSize = 8;

// Состояния для специальных ходов и статуса игры
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookKingsideMoved = false; // h1
let whiteRookQueensideMoved = false; // a1
let blackRookKingsideMoved = false; // h8
let blackRookQueensideMoved = false; // a8
let enPassantTargetSquare = null; // { row, col }
let gameStatus = "ongoing"; // "ongoing", "checkmate", "stalemate"

const boardElement = document.getElementById('chessBoard');
const messageElement = document.getElementById('message');
const currentPlayerElement = document.getElementById('currentPlayer');
const resetButton = document.getElementById('resetButton');

function initializeBoard() {
    debugMessage("initializeBoard called");
    currentBoardState = JSON.parse(JSON.stringify(initialBoardSetup));
    selectedSquare = null;
    currentPlayer = 'w';
    whiteKingMoved = false;
    blackKingMoved = false;
    whiteRookKingsideMoved = false;
    whiteRookQueensideMoved = false;
    blackRookKingsideMoved = false;
    blackRookQueensideMoved = false;
    enPassantTargetSquare = null;
    gameStatus = "ongoing";

    renderBoard();
    clearKingInCheckHighlight();
    updateInfoPanel("Игра началась. Ход Белых.");
    console.log('Доска инициализирована.');
}

function renderBoard() {
    // debugMessage("renderBoard called"); // Может быть слишком часто
    boardElement.innerHTML = '';
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
    if (selectedSquare) {
        const domSquare = boardElement.querySelector(`.square[data-row='${selectedSquare.row}'][data-col='${selectedSquare.col}']`);
        if (domSquare) domSquare.classList.add('selected');
    }
    if (gameStatus === "ongoing" && isKingInCheck(currentPlayer, currentBoardState)) {
         highlightKingInCheck(currentPlayer, false);
    } else if (gameStatus === "checkmate") {
        const loser = currentPlayer;
        highlightKingInCheck(loser, true);
    }
}

function onSquareClick(row, col) {
    debugMessage(`onSquareClick: ${row},${col}. Current player: ${currentPlayer}. Selected: ${selectedSquare ? selectedSquare.piece : 'null'}`);
    if (gameStatus !== "ongoing") {
        updateInfoPanel("Игра завершена. Начните новую игру, нажав 'Начать заново'.");
        return;
    }

    const pieceCode = currentBoardState[row][col];

    if (selectedSquare) {
        const moveDetails = isValidMove(selectedSquare.row, selectedSquare.col, row, col);
        if (moveDetails) {
            debugMessage(`Player move valid: ${PIECES[selectedSquare.piece]} to ${row},${col}`);
            movePiece(selectedSquare.row, selectedSquare.col, row, col, moveDetails);
            const prevSelectedPiece = selectedSquare.piece; // Сохраним для лога
            selectedSquare = null;
            clearPossibleMovesHighlight();

            if (gameStatus === "ongoing") {
                switchPlayer(); // Переключает ход (например, на 'b' - бота)
                debugMessage(`After switchPlayer, currentPlayer is: ${currentPlayer}, gameStatus: ${gameStatus}`);

                const botColor = 'b';
                if (currentPlayer === botColor && gameStatus === "ongoing") {
                    updateInfoPanel("Бот думает...");
                    debugMessage(`[Game] Player's ${PIECES[prevSelectedPiece]} turn ended. Bot's turn (${botColor}). Calling makeBotMove.`);
                    setTimeout(() => {
                        debugMessage("[Game] setTimeout: Calling makeBotMove now.");
                        makeBotMove();
                    }, 500);
                }
            }
            // renderBoard() здесь НЕ нужен, т.к. он будет вызван из checkGameStatus или после хода бота
        } else if (selectedSquare.row === row && selectedSquare.col === col) {
            debugMessage("Player cancelled selection.");
            selectedSquare = null;
            clearPossibleMovesHighlight();
            updateInfoPanel("Выбор отменен. Выберите фигуру для хода.");
        } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
            debugMessage(`Player re-selected piece: ${PIECES[pieceCode]}`);
            clearPossibleMovesHighlight();
            selectedSquare = { row, col, piece: pieceCode };
            highlightPossibleMoves(row, col, pieceCode); // Все еще заглушка
            updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        } else {
            debugMessage("Invalid move attempt by player.");
            updateInfoPanel("Неверный ход. Попробуйте снова.");
        }
        renderBoard(); // Перерисовать в любом случае, чтобы отразить изменения подсветки/отмены
    } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
        debugMessage(`Player selected piece: ${PIECES[pieceCode]}`);
        selectedSquare = { row, col, piece: pieceCode };
        highlightPossibleMoves(row, col, pieceCode); // Все еще заглушка
        updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        renderBoard();
    } else if (pieceCode && !pieceCode.startsWith(currentPlayer)) {
        debugMessage("Not player's turn or selected opponent's piece.");
        updateInfoPanel("Сейчас не ваш ход!");
    } else {
        debugMessage("Clicked on empty square without prior selection.");
        updateInfoPanel("Пустая клетка. Выберите свою фигуру.");
    }
}

// --- Логика ходов (без изменений, как ты прислал) ---
function _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardState, forAttackCheck = false) {
    const targetPieceOnEndSquare = boardState[endRow][endCol];
    if (!pieceCode) return false;
    if (startRow === endRow && startCol === endCol) return false;
    if (!forAttackCheck && targetPieceOnEndSquare && targetPieceOnEndSquare.startsWith(pieceCode[0])) return false;
    const pieceType = pieceCode.substring(1);
    const pieceColor = pieceCode[0];
    switch (pieceType) {
        case 'P':
            const direction = (pieceColor === 'w') ? -1 : 1;
            const initialRow = (pieceColor === 'w') ? 6 : 1;
            if (endCol === startCol) {
                if (!targetPieceOnEndSquare) {
                    if (endRow === startRow + direction) return { type: 'normal' };
                    if (startRow === initialRow && endRow === startRow + 2 * direction && !boardState[startRow + direction][startCol]) return { type: 'pawn_two_step' };
                }
            } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) {
                if (forAttackCheck) return { type: 'capture_or_attack' };
                if (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) return { type: 'capture' };
                if (enPassantTargetSquare && endRow === enPassantTargetSquare.row && endCol === enPassantTargetSquare.col && !targetPieceOnEndSquare) return { type: 'en_passant' };
            }
            return false;
        case 'R':
            if (startRow !== endRow && startCol !== endCol) return false;
            if (startRow === endRow) {
                const step = (endCol > startCol) ? 1 : -1;
                for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
            } else {
                const step = (endRow > startRow) ? 1 : -1;
                for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'N':
            const dRowN = Math.abs(endRow - startRow);
            const dColN = Math.abs(endCol - startCol);
            if ((dRowN === 2 && dColN === 1) || (dRowN === 1 && dColN === 2)) return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            return false;
        case 'B':
            if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false;
            const dRowB = (endRow > startRow) ? 1 : -1;
            const dColB = (endCol > startCol) ? 1 : -1;
            let rB = startRow + dRowB, cB = startCol + dColB;
            while (rB !== endRow || cB !== endCol) { if (boardState[rB][cB]) return false; rB += dRowB; cB += dColB; }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'Q':
            const isRookMove = (startRow === endRow || startCol === endCol);
            const isBishopMove = (Math.abs(endRow - startRow) === Math.abs(endCol - startCol));
            if (!isRookMove && !isBishopMove) return false;
            if (isRookMove) {
                if (startRow === endRow) {
                    const step = (endCol > startCol) ? 1 : -1;
                    for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
                } else {
                    const step = (endRow > startRow) ? 1 : -1;
                    for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
                }
            } else {
                const dRowQ = (endRow > startRow) ? 1 : -1;
                const dColQ = (endCol > startCol) ? 1 : -1;
                let rQ = startRow + dRowQ, cQ = startCol + dColQ;
                while (rQ !== endRow || cQ !== endCol) { if (boardState[rQ][cQ]) return false; rQ += dRowQ; cQ += dColQ; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'K':
            const dRowK = Math.abs(endRow - startRow);
            const dColK = Math.abs(endCol - startCol);
            if (dRowK <= 1 && dColK <= 1 && (dRowK > 0 || dColK > 0)) return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            if (dRowK === 0 && dColK === 2) {
                const kingMoved = (pieceColor === 'w') ? whiteKingMoved : blackKingMoved;
                if (kingMoved || isKingInCheck(pieceColor, boardState)) return false;
                const kingSide = endCol > startCol;
                const rookColInitial = kingSide ? 7 : 0;
                const rookExpectedPiece = pieceColor + 'R';
                if (boardState[startRow][rookColInitial] !== rookExpectedPiece) return false;
                const rookMovedFlag = kingSide ? ((pieceColor === 'w') ? whiteRookKingsideMoved : blackRookKingsideMoved) : ((pieceColor === 'w') ? whiteRookQueensideMoved : blackRookQueensideMoved);
                if (rookMovedFlag) return false;
                const pathDir = kingSide ? 1 : -1;
                for (let c = startCol + pathDir; c !== rookColInitial; c += pathDir) { if (c === endCol) continue; if (boardState[startRow][c]) return false; }
                const opponentColor = (pieceColor === 'w') ? 'b' : 'w';
                if (isSquareAttacked(startRow, startCol + pathDir, opponentColor, boardState)) return false;
                return { type: kingSide ? 'castling_kingside' : 'castling_queenside' };
            }
            return false;
        default: return false;
    }
}

function isValidMove(startRow, startCol, endRow, endCol) {
    // Эта функция ВСЕГДА использует currentBoardState.
    // Это ОСНОВНАЯ проблема для AI, который должен работать с гипотетическими досками.
    // Для временного "грязного" трюка, где AI ходит на реальной доске, это сработает.
    const pieceCode = currentBoardState[startRow][startCol];
    if (!pieceCode) return false;
    const pieceColor = pieceCode[0];
    const moveDetails = _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, currentBoardState);
    if (!moveDetails) return false;
    const tempBoardState = JSON.parse(JSON.stringify(currentBoardState));
    const pieceToMove = tempBoardState[startRow][startCol];
    if (moveDetails.type === 'en_passant') { tempBoardState[startRow][endCol] = ''; }
    else if (moveDetails.type === 'castling_kingside') { tempBoardState[startRow][startCol + 1] = tempBoardState[startRow][7]; tempBoardState[startRow][7] = ''; }
    else if (moveDetails.type === 'castling_queenside') { tempBoardState[startRow][startCol - 1] = tempBoardState[startRow][0]; tempBoardState[startRow][0] = ''; }
    tempBoardState[endRow][endCol] = pieceToMove;
    tempBoardState[startRow][startCol] = '';
    if (isKingInCheck(pieceColor, tempBoardState)) return false;
    return moveDetails;
}

function isSquareAttacked(targetRow, targetCol, attackerColor, boardState) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const pieceCode = boardState[r][c];
            if (pieceCode && pieceCode.startsWith(attackerColor)) {
                if (_getPieceSpecificMoveLogic(r, c, targetRow, targetCol, pieceCode, boardState, true)) return true;
            }
        }
    }
    return false;
}

function isKingInCheck(kingColor, boardState) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) { for (let c = 0; c < boardSize; c++) { if (boardState[r][c] === kingPieceCode) { kingRow = r; kingCol = c; break; } } if (kingRow !== undefined) break; }
    if (kingRow === undefined) { console.error(`Король ${kingColor} не найден!`); return false; }
    const attackerColor = (kingColor === 'w') ? 'b' : 'w';
    return isSquareAttacked(kingRow, kingCol, attackerColor, boardState);
}

function getAllLegalMoves(playerColor, board) { // `board` здесь currentBoardState для AI (в отладочной версии AI)
    // Эта функция также вызывает isValidMove, которая смотрит на currentBoardState.
    const legalMoves = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = board[r][c]; // Используем переданный board
            if (piece && piece.startsWith(playerColor)) {
                for (let tr = 0; tr < boardSize; tr++) {
                    for (let tc = 0; tc < boardSize; tc++) {
                        // isValidMove будет использовать ГЛОБАЛЬНЫЙ currentBoardState
                        if (isValidMove(r, c, tr, tc)) {
                            legalMoves.push({ from: { r, c }, to: { tr, tc } });
                        }
                    }
                }
            }
        }
    }
    return legalMoves;
}

function updateInfoPanel(messageText) {
    if (messageElement) messageElement.textContent = messageText;
    if (currentPlayerElement) currentPlayerElement.textContent = (currentPlayer === 'w' ? 'Белых' : 'Черных');
    // console.log(`InfoPanel: ${messageText}, Ход: ...`); // Убрал дублирование с debugMessage
}

function highlightPossibleMoves(row, col, pieceCode) { // ЗАГЛУШКА
    console.log(`Нужно подсветить ходы для ${PIECES[pieceCode]} (${pieceCode}) с клетки ${row},${col}`);
    debugMessage(`TODO: highlight moves for ${PIECES[pieceCode]}`);
}

function clearPossibleMovesHighlight() { // ЗАГЛУШКА
    const previouslySelected = boardElement.querySelector('.selected');
    // if (previouslySelected) previouslySelected.classList.remove('selected'); // renderBoard() это делает
    document.querySelectorAll('.possible-move').forEach(sq => sq.classList.remove('possible-move'));
}

function highlightKingInCheck(kingColor, isMate) {
    let kingRow, kingCol; // ... (остальная логика как была)
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) { for (let c = 0; c < boardSize; c++) { if (currentBoardState[r][c] === kingPieceCode) { kingRow = r; kingCol = c; break; } } if (kingRow !== undefined) break; }
    if (kingRow !== undefined && kingCol !== undefined) {
        const kingSquare = boardElement.querySelector(`.square[data-row='${kingRow}'][data-col='${kingCol}']`);
        if (kingSquare) {
            kingSquare.classList.add(isMate ? 'checkmate' : 'check');
            debugMessage(`King ${kingColor} is in ${isMate ? 'CHECKMATE' : 'CHECK'}`);
        }
    } else { console.error(`Не удалось найти короля ${kingColor} для подсветки.`); }
}

function clearKingInCheckHighlight() {
    document.querySelectorAll('.check, .checkmate').forEach(sq => { sq.classList.remove('check'); sq.classList.remove('checkmate'); });
}

function movePiece(startRow, startCol, endRow, endCol, moveDetails) {
    debugMessage(`movePiece: ${PIECES[currentBoardState[startRow][startCol]]} from ${startRow},${startCol} to ${endRow},${endCol}`);
    const piece = currentBoardState[startRow][startCol];
    const pieceColor = piece[0];
    const pieceType = piece.substring(1);
    enPassantTargetSquare = null;
    if (pieceType === 'K') { if (pieceColor === 'w') whiteKingMoved = true; else blackKingMoved = true; }
    else if (pieceType === 'R') {
        if (pieceColor === 'w') { if (startRow === 7 && startCol === 0) whiteRookQueensideMoved = true; if (startRow === 7 && startCol === 7) whiteRookKingsideMoved = true; }
        else { if (startRow === 0 && startCol === 0) blackRookQueensideMoved = true; if (startRow === 0 && startCol === 7) blackRookKingsideMoved = true; }
    }
    if (moveDetails.type === 'en_passant') { currentBoardState[startRow][endCol] = ''; }
    else if (moveDetails.type === 'castling_kingside') { currentBoardState[startRow][startCol + 1] = currentBoardState[startRow][7]; currentBoardState[startRow][7] = ''; }
    else if (moveDetails.type === 'castling_queenside') { currentBoardState[startRow][startCol - 1] = currentBoardState[startRow][0]; currentBoardState[startRow][0] = ''; }
    currentBoardState[endRow][endCol] = piece;
    currentBoardState[startRow][startCol] = '';
    if (pieceType === 'P') {
        const promotionRank = (pieceColor === 'w') ? 0 : 7;
        if (endRow === promotionRank) {
            const promotedPieceInput = prompt(`Пешка достигла последней горизонтали! В какую фигуру превратить? (Q, R, B, N)`, 'Q');
            const promotedPieceType = promotedPieceInput ? promotedPieceInput.toUpperCase() : 'Q';
            let newPieceCode = pieceColor + promotedPieceType;
            if (!PIECES[newPieceCode] || ['K', 'P'].includes(promotedPieceType)) { newPieceCode = pieceColor + 'Q'; alert(`Некорректный выбор. Пешка превращена в Ферзя.`); }
            currentBoardState[endRow][endCol] = newPieceCode;
            debugMessage(`Pawn promoted to ${PIECES[newPieceCode]}`);
        }
    }
    if (moveDetails.type === 'pawn_two_step') { enPassantTargetSquare = { row: (startRow + endRow) / 2, col: startCol }; }
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
    debugMessage(`switchPlayer: New current player is ${currentPlayer}`);
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}.`);
    checkGameStatus();
}

function checkGameStatus() {
    debugMessage(`checkGameStatus for player ${currentPlayer}`);
    const legalMoves = getAllLegalMoves(currentPlayer, currentBoardState); // Используем currentBoardState
    const kingIsChecked = isKingInCheck(currentPlayer, currentBoardState);
    clearKingInCheckHighlight();
    if (legalMoves.length === 0) {
        if (kingIsChecked) {
            gameStatus = "checkmate";
            highlightKingInCheck(currentPlayer, true);
            updateInfoPanel(`МАТ! ${currentPlayer === 'w' ? 'Белые' : 'Черные'} проиграли. Нажмите 'Начать заново'.`);
        } else {
            gameStatus = "stalemate";
            updateInfoPanel(`ПАТ! Ничья. Нажмите 'Начать заново'.`);
        }
        debugMessage(`Game over: ${gameStatus}. Player ${currentPlayer} has no legal moves.`);
    } else if (kingIsChecked) {
        highlightKingInCheck(currentPlayer, false);
        updateInfoPanel(`ШАХ ${currentPlayer === 'w' ? 'Белым' : 'Черным'}! Ваш ход.`);
    }
    renderBoard();
}

// --- AI Bot ---
function makeBotMove() {
    debugMessage("[Game] makeBotMove function has been CALLED.");
    const botColor = 'b';

    if (currentPlayer !== botColor || gameStatus !== "ongoing") {
        debugMessage(`[AI] makeBotMove: Not bot's turn or game over. Current: ${currentPlayer}, Status: ${gameStatus}. Aborting.`);
        return;
    }

    // В отладочной версии ChessAI.getRandomMove ПЕРВЫЙ аргумент (boardState) ИГНОРИРУЕТСЯ,
    // и AI работает с глобальным currentBoardState через переданные функции.
    // JSON.parse(JSON.stringify(currentBoardState)) здесь пока не имеет критического значения,
    // но оставим для будущего правильного AI.
    const moveData = ChessAI.getRandomMove(
        JSON.parse(JSON.stringify(currentBoardState)),
        botColor,
        getAllLegalMoves,
        isValidMove
    );

    if (moveData) {
        debugMessage(`[AI] Got move from AI: ${PIECES[moveData.pieceCode]} from ${moveData.startRow},${moveData.startCol} to ${moveData.endRow},${moveData.endCol}`);
        // console.log(`AI (${PIECES[moveData.pieceCode]}) ходит: ${String.fromCharCode(97 + moveData.startCol)}${8 - moveData.startRow} -> ${String.fromCharCode(97 + moveData.endCol)}${8 - moveData.endRow}`); // Уже есть в debugMessage от movePiece

        movePiece(moveData.startRow, moveData.startCol, moveData.endRow, moveData.endCol, moveData.moveDetails);
        // selectedSquare = null; // Не нужно для бота
        // clearPossibleMovesHighlight(); // Не нужно для бота

        renderBoard(); // Перерисовать доску после хода бота
        switchPlayer(); // Переключить игрока (на человека) и проверить статус игры
    } else {
        debugMessage("[AI] AI's getRandomMove returned null (no moves or error in AI). Game status: " + gameStatus);
        // Если это не мат/пат, то это ошибка в логике AI или getAllLegalMoves/isValidMove для текущей ситуации.
        // checkGameStatus уже должен был обработать мат/пат для бота перед вызовом makeBotMove,
        // но если getRandomMove возвращает null, когда ходы есть, это проблема.
    }
}

// --- Инициализация ---
if (resetButton) {
    resetButton.addEventListener('click', initializeBoard);
} else {
    console.error("Кнопка сброса #resetButton не найдена!");
    // debugMessage("ERROR: resetButton not found!"); // Можно добавить
}

document.addEventListener('DOMContentLoaded', () => {
    debugMessage("DOM fully loaded. Initializing board...");
    initializeBoard();
});
