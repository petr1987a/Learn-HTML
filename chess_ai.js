// chess_ai.js

const ChessAI = {
    // Можно будет добавлять разные уровни сложности или типы AI сюда
    // chess_ai.js
getRandomMove: function(boardState, playerColor, getAllLegalMovesFunc, isValidMoveFunc) {
    console.log("[AI] getRandomMove called for player:", playerColor, "Current AI boardState:", JSON.parse(JSON.stringify(boardState))); // Лог состояния

    const legalMoves = getAllLegalMovesFunc(playerColor, boardState /*, ... другие нужные параметры, если рефакторил */);
    console.log("[AI] Legal moves found:", legalMoves);

    if (!legalMoves || legalMoves.length === 0) { // Добавил проверку на !legalMoves
        console.error("[AI] No legal moves returned by getAllLegalMovesFunc.");
        return null;
    }

    const randomMoveData = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    console.log("[AI] Selected random move data:", randomMoveData);

    const startRow = randomMoveData.from.r;
    const startCol = randomMoveData.from.c;
    const endRow = randomMoveData.to.tr;
    const endCol = randomMoveData.to.tc;

    const pieceCode = boardState[startRow][startCol];
    if (!pieceCode) {
        console.error("[AI] Error - no piece on start square of random move:", randomMoveData, "Board state at square:", boardState[startRow][startCol]);
        return null;
    }
    console.log(`[AI] Trying to validate move for piece ${pieceCode} from ${startRow},${startCol} to ${endRow},${endCol}`);

    // Вот здесь ключевой момент: как isValidMoveFunc будет работать с boardState?
    // Если isValidMoveFunc - это наш старый isValidMove, он будет использовать ГЛОБАЛЬНЫЙ currentBoardState,
    // а не переданный `boardState`. Это самая частая причина проблем.
    // Для чистоты, isValidMove ДОЛЖЕН быть рефакторен, чтобы принимать boardState.
    const moveDetails = isValidMoveFunc(startRow, startCol, endRow, endCol /*, pieceCode, boardState, enPassantTarget, castlingFlags - если рефакторил */);
    console.log("[AI] Move details from isValidMoveFunc:", moveDetails);

    if (!moveDetails) {
         console.error("[AI] The random move was deemed invalid by isValidMoveFunc. This is often due to isValidMove using global state instead of passed state, or missing context like enPassant/castling flags.");
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
