// chess_ai.js - ВРЕМЕННАЯ ОТЛАДОЧНАЯ ВЕРСИЯ getRandomMove
getRandomMove: function(ignoredBoardState, playerColor, getAllLegalMovesFunc, isValidMoveFunc) {
    // ignoredBoardState - мы его пока игнорируем и работаем с глобальным currentBoardState
    // Это ПЛОХО для настоящего AI, но хорошо для быстрой проверки.

    console.log("[AI-DEBUG] getRandomMove called for player:", playerColor);

    // getAllLegalMovesFunc будет использовать глобальный currentBoardState
    // и глобальные флаги, если мы не рефакторили его.
    const legalMoves = getAllLegalMovesFunc(playerColor, currentBoardState); // ИСПОЛЬЗУЕМ ГЛОБАЛЬНЫЙ currentBoardState
    console.log("[AI-DEBUG] Legal moves found on currentBoardState:", legalMoves);

    if (!legalMoves || legalMoves.length === 0) {
        console.error("[AI-DEBUG] No legal moves returned by getAllLegalMovesFunc on currentBoardState.");
        return null;
    }

    const randomMoveData = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    console.log("[AI-DEBUG] Selected random move data:", randomMoveData);

    const startRow = randomMoveData.from.r;
    const startCol = randomMoveData.from.c;
    const endRow = randomMoveData.to.tr;
    const endCol = randomMoveData.to.tc;

    // pieceCode берем из ГЛОБАЛЬНОГО currentBoardState
    const pieceCode = currentBoardState[startRow][startCol];
    if (!pieceCode) {
        console.error("[AI-DEBUG] Error - no piece on start square of random move on currentBoardState:", randomMoveData);
        return null;
    }
    console.log(`[AI-DEBUG] Trying to validate move for piece ${pieceCode} from ${startRow},${startCol} to ${endRow},${endCol} using global isValidMove`);

    // isValidMoveFunc будет использовать глобальный currentBoardState и флаги
    const moveDetails = isValidMoveFunc(startRow, startCol, endRow, endCol);
    console.log("[AI-DEBUG] Move details from global isValidMoveFunc:", moveDetails);

    if (!moveDetails) {
         console.error("[AI-DEBUG] The random move was deemed invalid by global isValidMoveFunc.");
         return null;
    }
    
    return {
        startRow: startRow,
        startCol: startCol,
        endRow: endRow,
        endCol: endCol,
        pieceCode: pieceCode,
        moveDetails: moveDetails
    };
}
