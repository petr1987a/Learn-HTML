// В САМОЕ НАЧАЛО script.js
function debugMessage(msg) {
    if (messageElement) {
        // Для объектов и массивов используем JSON.stringify для более читаемого вывода
        const messageContent = (typeof msg === 'object' && msg !== null) ? JSON.stringify(msg, null, 2) : msg;
        const currentInfoPanelMsg = messageElement.textContent;
        messageElement.textContent = `DEBUG: ${messageContent} | ${currentInfoPanelMsg.substring(0, 150)}`;
    }
    // В консоль выводим как есть, она справится с объектами
    console.log("DEBUG:", msg);
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
    const chessBoardElement = document.getElementById('chessBoard'); 
    if (chessBoardElement) {
    PoeticBoardOverlay.activate(chessBoardElement);
    PoeticBoardOverlay.debugMessageLocal("Poetic Overlay Activated from main script!");
    // Если хочешь использовать свои фразы:
    // const myCustomPoetry = ["Думы мои, думы...", "Вперед, к победе!", "Семь раз отмерь..."];
    // PoeticBoardOverlay.setPhrases(myCustomPoetry);
    // PoeticBoardOverlay.activate(chessBoardElement); // Если фразы заданы до активации, можно и так
    } catch (e) {
        debugMessage("ОШИБКА при вызове PoeticBoardOverlay.activate(): " + e.message + " | Стек: " + (e.stack ? e.stack.substring(0,150) : "нет стека"));
    }
} else {
    debugMessage("ОШИБКА: Элемент доски 'chessBoard' НЕ НАЙДЕН для PoeticBoardOverlay!");
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
    // Подсветка шаха/мата должна происходить на основе currentBoardState
    if (gameStatus === "ongoing" && isKingInCheck(currentPlayer, currentBoardState)) {
         highlightKingInCheck(currentPlayer, false);
    } else if (gameStatus === "checkmate") {
        const loser = currentPlayer; // В gameStatus currentPlayer это тот, кто НЕ МОЖЕТ походить
        highlightKingInCheck(loser, true);
    }
}

function onSquareClick(row, col) {
    debugMessage(`onSquareClick: ${row},${col}. Player: ${currentPlayer}. Selected: ${selectedSquare ? selectedSquare.piece : 'null'}`);
    if (gameStatus !== "ongoing") {
        updateInfoPanel("Игра завершена. Начните новую игру, нажав 'Начать заново'.");
        return;
    }

    const pieceCode = currentBoardState[row][col];

    if (selectedSquare) {
        // При проверке хода игрока используем currentBoardState
        const moveDetails = isValidMove(selectedSquare.row, selectedSquare.col, row, col, currentBoardState);
        if (moveDetails) {
            debugMessage(`Player move valid: ${PIECES[selectedSquare.piece]} to ${row},${col}. Details: ${JSON.stringify(moveDetails)}`);
            movePiece(selectedSquare.row, selectedSquare.col, row, col, moveDetails); // pieceCode передается из selectedSquare.piece
            const prevSelectedPiece = selectedSquare.piece;
            selectedSquare = null;
            clearPossibleMovesHighlight(); // Заглушка

            if (gameStatus === "ongoing") { // movePiece мог изменить gameStatus через pawn promotion -> checkGameStatus
                switchPlayer();
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
            // renderBoard() будет вызван из switchPlayer -> checkGameStatus или после хода бота
        } else if (selectedSquare.row === row && selectedSquare.col === col) {
            debugMessage("Player cancelled selection.");
            selectedSquare = null;
            clearPossibleMovesHighlight();
            updateInfoPanel("Выбор отменен. Выберите фигуру для хода.");
            renderBoard(); // Обновить подсветку
        } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
            debugMessage(`Player re-selected piece: ${PIECES[pieceCode]}`);
            clearPossibleMovesHighlight();
            selectedSquare = { row, col, piece: pieceCode };
            highlightPossibleMoves(row, col, pieceCode); // Заглушка
            updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
            renderBoard(); // Обновить подсветку
        } else {
            debugMessage("Invalid move attempt by player.");
            updateInfoPanel("Неверный ход. Попробуйте снова.");
            // selectedSquare остается, чтобы игрок мог попробовать другой ход той же фигурой
            renderBoard();
        }
    } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
        debugMessage(`Player selected piece: ${PIECES[pieceCode]}`);
        selectedSquare = { row, col, piece: pieceCode };
        highlightPossibleMoves(row, col, pieceCode); // Заглушка
        updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        renderBoard();
    } else if (pieceCode && !pieceCode.startsWith(currentPlayer)) {
        debugMessage("Not player's turn or selected opponent's piece.");
        updateInfoPanel("Сейчас не ваш ход или выбрана фигура противника!");
    } else {
        debugMessage("Clicked on empty square without prior selection.");
        updateInfoPanel("Пустая клетка. Выберите свою фигуру.");
    }
}

function _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardState, forAttackCheck = false) {
    const targetPieceOnEndSquare = boardState[endRow][endCol];
    if (!pieceCode) return false;
    if (startRow === endRow && startCol === endCol) return false;
    // Если это не проверка атаки, и на целевой клетке стоит своя фигура - ход невозможен
    if (!forAttackCheck && targetPieceOnEndSquare && targetPieceOnEndSquare.startsWith(pieceCode[0])) return false;

    const pieceType = pieceCode.substring(1);
    const pieceColor = pieceCode[0];

    switch (pieceType) {
        case 'P':
            const direction = (pieceColor === 'w') ? -1 : 1;
            const initialRow = (pieceColor === 'w') ? 6 : 1;
            if (endCol === startCol) { // Движение вперед
                if (!targetPieceOnEndSquare) { // Клетка должна быть пуста
                    if (endRow === startRow + direction) return { type: 'normal' };
                    if (startRow === initialRow && endRow === startRow + 2 * direction && !boardState[startRow + direction][startCol]) return { type: 'pawn_two_step' };
                }
            } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) { // Атака по диагонали
                if (forAttackCheck) return { type: 'capture_or_attack' }; // Для isSquareAttacked достаточно, что поле под боем
                if (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) return { type: 'capture' };
                // Взятие на проходе (enPassantTargetSquare - глобальная переменная)
                if (enPassantTargetSquare && endRow === enPassantTargetSquare.row && endCol === enPassantTargetSquare.col && !targetPieceOnEndSquare) return { type: 'en_passant' };
            }
            return false;
        case 'R':
            if (startRow !== endRow && startCol !== endCol) return false; // Не по прямой
            if (startRow === endRow) { // Горизонтально
                const step = (endCol > startCol) ? 1 : -1;
                for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
            } else { // Вертикально
                const step = (endRow > startRow) ? 1 : -1;
                for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'N':
            const dRowN = Math.abs(endRow - startRow);
            const dColN = Math.abs(endCol - startCol);
            if ((dRowN === 2 && dColN === 1) || (dRowN === 1 && dColN === 2))
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            return false;
        case 'B':
            if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false; // Не по диагонали
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
            } else { // isBishopMove
                const dRowQ = (endRow > startRow) ? 1 : -1;
                const dColQ = (endCol > startCol) ? 1 : -1;
                let rQ = startRow + dRowQ, cQ = startCol + dColQ;
                while (rQ !== endRow || cQ !== endCol) { if (boardState[rQ][cQ]) return false; rQ += dRowQ; cQ += dColQ; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'K':
            const dRowK = Math.abs(endRow - startRow);
            const dColK = Math.abs(endCol - startCol);
            if (dRowK <= 1 && dColK <= 1 && (dRowK > 0 || dColK > 0)) // Обычный ход короля
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };

            // Рокировка (использует глобальные флаги moved, но проверяет на boardState)
            if (!forAttackCheck && dRowK === 0 && dColK === 2) { // Попытка рокировки
                const kingMoved = (pieceColor === 'w') ? whiteKingMoved : blackKingMoved;
                if (kingMoved || isKingInCheck(pieceColor, boardState)) return false;

                const kingSide = endCol > startCol; // true для короткой, false для длинной
                const rookColInitial = kingSide ? 7 : 0;
                const rookExpectedPiece = pieceColor + 'R';
                if (boardState[startRow][rookColInitial] !== rookExpectedPiece) return false;

                const rookMovedFlag = kingSide ?
                    ((pieceColor === 'w') ? whiteRookKingsideMoved : blackRookKingsideMoved) :
                    ((pieceColor === 'w') ? whiteRookQueensideMoved : blackRookQueensideMoved);
                if (rookMovedFlag) return false;

                // Проверка пути между королем и ладьей
                const pathDir = kingSide ? 1 : -1;
                for (let c = startCol + pathDir; c !== rookColInitial; c += pathDir) {
                    if (boardState[startRow][c]) return false;
                }
                // Проверка, что поля, через которые проходит король, не атакованы
                const opponentColor = (pieceColor === 'w') ? 'b' : 'w';
                if (isSquareAttacked(startRow, startCol + pathDir, opponentColor, boardState)) return false; // Поле рядом с королем
                if (isSquareAttacked(startRow, startCol + 2 * pathDir, opponentColor, boardState)) return false; // Поле, куда становится король

                return { type: kingSide ? 'castling_kingside' : 'castling_queenside' };
            }
            return false;
        default: return false;
    }
}

function isValidMove(startRow, startCol, endRow, endCol, boardStateToTest) {
    debugMessage(`isValidMove: from ${startRow},${startCol} to ${endRow},${endCol} on board (first row): ${JSON.stringify(boardStateToTest[0])}`);
    const pieceCode = boardStateToTest[startRow][startCol];
    if (!pieceCode) {
        debugMessage("isValidMove returning false: no piece on start square.");
        return false;
    }
    const pieceColor = pieceCode[0];

    // Получаем "сырые" детали хода, не проверяя на шах королю
    const moveDetails = _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardStateToTest);
    if (!moveDetails) {
        debugMessage("isValidMove returning false: _getPieceSpecificMoveLogic returned false.");
        return false;
    }

    // Теперь создаем временную доску, делаем ход и проверяем, не оказался ли король под шахом
    const tempBoardState = JSON.parse(JSON.stringify(boardStateToTest));
    const pieceToMove = tempBoardState[startRow][startCol]; // Берем фигуру с временной доски

    // Обработка специальных ходов на временной доске
    if (moveDetails.type === 'en_passant') {
        const capturedPawnRow = startRow; // Взятая пешка на той же горизонтали, что и атакующая
        const capturedPawnCol = endCol;   // и на той же вертикали, куда идет атакующая
        tempBoardState[capturedPawnRow][capturedPawnCol] = ''; // Убираем взятую пешку
    } else if (moveDetails.type === 'castling_kingside') {
        tempBoardState[startRow][startCol + 1] = tempBoardState[startRow][7]; // Ладья на f1/f8
        tempBoardState[startRow][7] = ''; // Убрать ладью с h1/h8
    } else if (moveDetails.type === 'castling_queenside') {
        tempBoardState[startRow][startCol - 1] = tempBoardState[startRow][0]; // Ладья на d1/d8
        tempBoardState[startRow][0] = ''; // Убрать ладью с a1/a8
    }

    // Основной ход
    tempBoardState[endRow][endCol] = pieceToMove;
    tempBoardState[startRow][startCol] = '';

    if (isKingInCheck(pieceColor, tempBoardState)) {
        debugMessage(`isValidMove returning false: King ${pieceColor} would be in check.`);
        return false;
    }
    debugMessage(`isValidMove returning: ${JSON.stringify(moveDetails)}`);
    return moveDetails;
}

function isSquareAttacked(targetRow, targetCol, attackerColor, boardState) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const pieceCode = boardState[r][c];
            if (pieceCode && pieceCode.startsWith(attackerColor)) {
                // Используем _getPieceSpecificMoveLogic с флагом forAttackCheck = true
                if (_getPieceSpecificMoveLogic(r, c, targetRow, targetCol, pieceCode, boardState, true)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isKingInCheck(kingColor, boardState) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (boardState[r][c] === kingPieceCode) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }

    if (kingRow === undefined) {
        // Это серьезная ошибка, если короля нет на доске
        debugMessage(`ERROR: King ${kingPieceCode} not found on board in isKingInCheck! Board state: ${JSON.stringify(boardState)}`);
        console.error(`King ${kingPieceCode} not found on board!`);
        return true; // Лучше перестраховаться и считать, что под шахом, если состояние некорректно
    }

    const attackerColor = (kingColor === 'w') ? 'b' : 'w';
    return isSquareAttacked(kingRow, kingCol, attackerColor, boardState);
}

function getAllLegalMoves(playerColor, board) {
    debugMessage(`getAllLegalMoves called for: ${playerColor}. Board (first row): ${JSON.stringify(board[0])}`);
    const legalMoves = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = board[r][c];
            if (piece && piece.startsWith(playerColor)) {
                for (let tr = 0; tr < boardSize; tr++) {
                    for (let tc = 0; tc < boardSize; tc++) {
                        // ВАЖНО: Передаем `board` в `isValidMove`
                        const moveDetails = isValidMove(r, c, tr, tc, board);
                        if (moveDetails) {
                            // Сохраняем детали, они могут понадобиться AI
                            legalMoves.push({ from: { r, c }, to: { tr, tc }, pieceCode: piece, details: moveDetails });
                        }
                    }
                }
            }
        }
    }
    debugMessage(`getAllLegalMoves for ${playerColor} found: ${legalMoves.length} moves. Example: ${legalMoves.length > 0 ? JSON.stringify(legalMoves[0]) : 'No moves'}`);
    return legalMoves;
}

function updateInfoPanel(messageText) {
    if (messageElement) messageElement.textContent = messageText;
    if (currentPlayerElement) currentPlayerElement.textContent = (currentPlayer === 'w' ? 'Белых' : 'Черных');
}

function highlightPossibleMoves(row, col, pieceCode) { // ЗАГЛУШКА
    // console.log(`Нужно подсветить ходы для ${PIECES[pieceCode]} (${pieceCode}) с клетки ${row},${col}`);
    // debugMessage(`TODO: highlight moves for ${PIECES[pieceCode]}`);
}

function clearPossibleMovesHighlight() { // ЗАГЛУШКА
    document.querySelectorAll('.possible-move').forEach(sq => sq.classList.remove('possible-move'));
}

function highlightKingInCheck(kingColor, isMate) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    // Ищем короля на ГЛОБАЛЬНОМ currentBoardState, т.к. подсветка для текущей отображаемой доски
    for (let r = 0; r < boardSize; r++) { for (let c = 0; c < boardSize; c++) { if (currentBoardState[r][c] === kingPieceCode) { kingRow = r; kingCol = c; break; } } if (kingRow !== undefined) break; }

    if (kingRow !== undefined && kingCol !== undefined) {
        const kingSquare = boardElement.querySelector(`.square[data-row='${kingRow}'][data-col='${kingCol}']`);
        if (kingSquare) {
            kingSquare.classList.add(isMate ? 'checkmate' : 'check');
            debugMessage(`King ${kingColor} is in ${isMate ? 'CHECKMATE' : 'CHECK'} on currentBoard`);
        }
    } else {
        debugMessage(`ERROR: Could not find king ${kingColor} to highlight on currentBoard.`);
        console.error(`Не удалось найти короля ${kingColor} для подсветки.`);
    }
}

function clearKingInCheckHighlight() {
    document.querySelectorAll('.check, .checkmate').forEach(sq => { sq.classList.remove('check'); sq.classList.remove('checkmate'); });
}

function movePiece(startRow, startCol, endRow, endCol, moveDetails) {
    const piece = currentBoardState[startRow][startCol]; // Фигура с текущей доски
    debugMessage(`movePiece: ${PIECES[piece]} from ${startRow},${startCol} to ${endRow},${endCol}. Details: ${JSON.stringify(moveDetails)}`);

    const pieceColor = piece[0];
    const pieceType = piece.substring(1);

    // Сброс флага для взятия на проходе перед каждым ходом
    // Он будет установлен снова, только если пешка сделает двойной ход
    enPassantTargetSquare = null;

    // Обновление флагов для рокировки
    if (pieceType === 'K') {
        if (pieceColor === 'w') whiteKingMoved = true;
        else blackKingMoved = true;
    } else if (pieceType === 'R') {
        if (pieceColor === 'w') {
            if (startRow === 7 && startCol === 0) whiteRookQueensideMoved = true;
            if (startRow === 7 && startCol === 7) whiteRookKingsideMoved = true;
        } else { // black
            if (startRow === 0 && startCol === 0) blackRookQueensideMoved = true;
            if (startRow === 0 && startCol === 7) blackRookKingsideMoved = true;
        }
    }

    // Выполнение специальных ходов
    if (moveDetails.type === 'en_passant') {
        const capturedPawnRow = startRow;
        const capturedPawnCol = endCol;
        currentBoardState[capturedPawnRow][capturedPawnCol] = '';
        debugMessage(`En passant: removed pawn at ${capturedPawnRow},${capturedPawnCol}`);
    } else if (moveDetails.type === 'castling_kingside') {
        currentBoardState[startRow][startCol + 1] = currentBoardState[startRow][7]; // Переместить ладью
        currentBoardState[startRow][7] = '';
        debugMessage("Kingside castling performed.");
    } else if (moveDetails.type === 'castling_queenside') {
        currentBoardState[startRow][startCol - 1] = currentBoardState[startRow][0]; // Переместить ладью
        currentBoardState[startRow][0] = '';
        debugMessage("Queenside castling performed.");
    }

    // Основное перемещение фигуры
    currentBoardState[endRow][endCol] = piece;
    currentBoardState[startRow][startCol] = '';

    // Превращение пешки
    if (pieceType === 'P') {
        const promotionRank = (pieceColor === 'w') ? 0 : 7;
        if (endRow === promotionRank) {
            let promotedPieceType = 'Q'; // По умолчанию Ферзь
            const botColor = 'b'; // Предполагаем, что бот всегда 'b'
            
            if (pieceColor !== botColor) { // Если ходит не бот (т.е. человек 'w')
                const promotedPieceInput = prompt(`Пешка достигла последней горизонтали! В какую фигуру превратить? (Q, R, B, N)`, 'Q');
                if (promotedPieceInput) {
                     const upperInput = promotedPieceInput.toUpperCase();
                     if (['Q', 'R', 'B', 'N'].includes(upperInput)) {
                        promotedPieceType = upperInput;
                     } else {
                        alert(`Некорректный выбор. Пешка превращена в Ферзя.`);
                     }
                }
            } // Если бот, то он автоматически превращается в Ферзя (promotedPieceType уже 'Q')
            
            const newPieceCode = pieceColor + promotedPieceType;
            currentBoardState[endRow][endCol] = newPieceCode;
            debugMessage(`Pawn promoted to ${PIECES[newPieceCode]} for ${pieceColor}`);
        }
    }

    // Установка флага для взятия на проходе, если пешка сделала двойной ход
    if (moveDetails.type === 'pawn_two_step') {
        enPassantTargetSquare = { row: (startRow + endRow) / 2, col: startCol };
        debugMessage(`En passant target set at: ${JSON.stringify(enPassantTargetSquare)}`);
    }
    // renderBoard() здесь не нужен, он будет вызван из checkGameStatus или после хода бота в makeBotMove
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
    debugMessage(`switchPlayer: New current player is ${currentPlayer}`);
    // Важно: updateInfoPanel перед checkGameStatus, чтобы сообщение было актуальным, если игра закончится
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}.`);
    checkGameStatus(); // Проверяем статус игры для НОВОГО игрока
}

function checkGameStatus() {
    debugMessage(`checkGameStatus for player ${currentPlayer} on currentBoard`);
    // Используем currentBoardState для определения статуса текущей игры
    const legalMovesForCurrentPlayer = getAllLegalMoves(currentPlayer, currentBoardState);
    const kingIsCurrentlyInCheck = isKingInCheck(currentPlayer, currentBoardState);

    clearKingInCheckHighlight(); // Сначала очищаем старую подсветку

    if (legalMovesForCurrentPlayer.length === 0) {
        if (kingIsCurrentlyInCheck) {
            gameStatus = "checkmate";
            highlightKingInCheck(currentPlayer, true); // Подсветить короля текущего игрока, которому мат
            const winner = (currentPlayer === 'w') ? 'Черные' : 'Белые';
            updateInfoPanel(`МАТ! ${winner} выиграли. Нажмите 'Начать заново'.`);
        } else {
            gameStatus = "stalemate";
            updateInfoPanel(`ПАТ! Ничья. Нажмите 'Начать заново'.`);
            // При пате король не подсвечивается как под шахом
        }
        debugMessage(`Game over: ${gameStatus}. Player ${currentPlayer} has no legal moves.`);
    } else if (kingIsCurrentlyInCheck) {
        // Шах, но игра продолжается
        highlightKingInCheck(currentPlayer, false); // Подсветить короля текущего игрока
        updateInfoPanel(`ШАХ ${currentPlayer === 'w' ? 'Белым' : 'Черным'}! Ваш ход.`);
    }
    // Если не мат/пат и не шах, то просто ход следующего игрока (сообщение уже в updateInfoPanel из switchPlayer)

    renderBoard(); // Перерисовать доску, чтобы отразить все изменения (ход, подсветку шаха/мата)
}

// --- AI Bot ---
function makeBotMove() {
    debugMessage("[Game] makeBotMove function has been CALLED.");
    const botColor = 'b'; // Предполагаем, что бот всегда черными

    if (currentPlayer !== botColor || gameStatus !== "ongoing") {
        debugMessage(`[AI] makeBotMove: Not bot's turn or game over. Current: ${currentPlayer}, Status: ${gameStatus}. Aborting.`);
        return;
    }

    // AI будет работать с текущим состоянием доски currentBoardState.
    // Функции getAllLegalMoves и isValidMove, переданные в AI, теперь корректно принимают
    // и используют состояние доски.
    const boardForAI = JSON.parse(JSON.stringify(currentBoardState)); // Делаем копию на всякий случай, хотя AI сейчас не меняет ее.

    const moveData = ChessAI.getRandomMove(
        boardForAI, // Этот аргумент теперь может быть использован AI, если он будет доработан. Пока getRandomMove его игнорирует.
        botColor,
        getAllLegalMoves, // Эта функция теперь правильно работает с переданной ей доской
        isValidMove       // Эта функция теперь правильно работает с переданной ей доской
    );

    if (moveData && moveData.pieceCode) { // Убедимся, что pieceCode есть
        debugMessage(`[AI] Got move from AI: ${PIECES[moveData.pieceCode]} from ${moveData.startRow},${moveData.startCol} to ${moveData.endRow},${moveData.endCol}. Details: ${JSON.stringify(moveData.moveDetails)}`);
        
        movePiece(moveData.startRow, moveData.startCol, moveData.endRow, moveData.endCol, moveData.moveDetails);
        // selectedSquare и clearPossibleMovesHighlight не нужны для бота

        // renderBoard() и switchPlayer() будут вызваны после хода
        // switchPlayer вызовет checkGameStatus, который вызовет renderBoard
        switchPlayer(); // Переключить игрока (на человека) и проверить статус игры
    } else {
        debugMessage("[AI] AI's getRandomMove returned null or invalid data (no moves or error in AI). Game status: " + gameStatus);
        // Если это не мат/пат, то это ошибка. checkGameStatus должен был это обработать ДО вызова makeBotMove.
        // Если getRandomMove вернул null, когда ходы ЕСТЬ, значит, проблема в логике AI или в том,
        // как getAllLegalMoves/isValidMove отработали для currentBoardState.
        // Дополнительная проверка: если игра не окончена, а бот не нашел ходов, это странно.
        if (gameStatus === "ongoing") {
            debugMessage("[AI-ERROR] AI returned no move, but game is ongoing. This indicates a problem with legal move generation or AI logic for the current board state!");
            updateInfoPanel("Ошибка ИИ: не удалось сделать ход. Попробуйте начать заново.");
        }
    }
}

// --- Инициализация ---
if (resetButton) {
    resetButton.addEventListener('click', initializeBoard);
} else {
    console.error("Кнопка сброса #resetButton не найдена!");
    debugMessage("ERROR: resetButton not found!");
}

document.addEventListener('DOMContentLoaded', () => {
    debugMessage("DOM fully loaded. Initializing board...");
    initializeBoard();
});
