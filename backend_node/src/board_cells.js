
function BoardCells(data) {
    data = data || {};
    var self = this;
    var mapSize = parseInt(data.mapSize);
    if (!mapSize || 0 <= mapSize) {
        mapSize = BoardCells.DEFAULT_SIZE;
    }
    var generation = 0;
    var cells = [];

    var prevGeneration = {
        alive: [],
        number: 0
    };

    clearBoard();

    /**
     * Updates the current generation to the next one, returning the cell coordinates of the surviving cells.
     * @returns {array}
     */
    this.nextGeneration = function () {
        if (0 === generation) {
            return [];
        }
        prevGeneration.alive = self.getAlive();
        prevGeneration.number = generation;

        updateBoard();
        generation++;

        return self.getAlive();
    };
    this.getPrevGeneration = function() {
        return prevGeneration;
    };
    /**
     * Resets the cell board setting the first generation with specified cells.
     * @param {array} selectedCells
     */
    this.reset = function (selectedCells) {
        generation = 1;
        self.setAlive(selectedCells);
    };
    /**
     * Sets the surviving cells of the current generation.
     * @param {array} data
     */
    this.setAlive = function (data) {
        clearBoard();
        for (let i in data) {
            var tx = parseInt(data[i].x);
            var ty = parseInt(data[i].y);

            if (!isNaN(tx) && !isNaN(ty) &&
                0 <= tx && tx < mapSize &&
                0 <= ty && ty < mapSize
            ) {
                cells[ty][tx] = 1;
            }
        }
    };
    /**
     * Gets the coordinates of the current alive cells.
     * @returns {array}
     */
    this.getAlive = function () {
        let aliveCells = [];
        for (let y = 0; y < mapSize; y++) {
            for (let x = 0; x < mapSize; x++) {
                if (cells[y][x]) {
                    aliveCells.push({x, y});
                }
            }
        }

        return aliveCells;
    };
    /**
     * Gets the current generation number.
     * @returns {number}
     */
    this.getGeneration = function () {
        return generation;
    };
    /**
     * Checks if the cell board is init.
     * @returns {boolean} TRUE if the cell board is init, FALSE otherwise
     */
    this.isInit = function () {
        return generation > 0;
    }
    /**
     * Resets the cell board.
     */
    function clearBoard() {
        for (let y = -BoardCells.BOARD_OFFSET; y < mapSize + BoardCells.BOARD_OFFSET; y++) {
            cells[y] = [];
            for (let x = -BoardCells.BOARD_OFFSET; x < mapSize + BoardCells.BOARD_OFFSET; x++) {
                cells[y][x] = 0;
            }
        }
    }

    /**
     * Updates the current generation to the next one.
     */
    function updateBoard() {
        let updatedMirror = getUpdatedGeneration(cells);
        for (let y = -BoardCells.BOARD_OFFSET; y < mapSize + BoardCells.BOARD_OFFSET; y++) {
            for (let x = -BoardCells.BOARD_OFFSET; x < mapSize + BoardCells.BOARD_OFFSET; x++) {
                cells[y][x] = updatedMirror[y][x];
            }
        }
    }

    /**
     * Returns an array of N number future generations without updating the current generation.
     * @param {number} numberOfRounds
     * @returns {array}
     */
    function getUpdatedGenerations(numberOfRounds) {
        numberOfRounds = parseInt(numberOfRounds);
        if (isNaN(numberOfRounds) || 0 >= numberOfRounds || 10 < numberOfRounds) {
            numberOfRounds = 1;
        }
        let updatedMirror = cells;
        let result = [];
        for (let i = 1; i <= numberOfRounds; i++) {
            updatedMirror = getUpdatedGeneration(updatedMirror);
            result.push({
                generation: generation + i,
                aline: updatedMirror
            });
        }

        return result;
    }

    /**
     * Gets the updated generation of the supplied one.
     * @param {array} cells The targer generation cell board to be updated
     * @returns {array} The updated generation
     */
    function getUpdatedGeneration(cells) {
        var tmpMap = [];
        for (let y = -BoardCells.BOARD_OFFSET; y < mapSize + BoardCells.BOARD_OFFSET; y++) {
            tmpMap[y] = [];
            for (let x = -BoardCells.BOARD_OFFSET; x < mapSize + BoardCells.BOARD_OFFSET; x++) {
                tmpMap[y][x] = cells[y][x];
            }
        }

        for (let i = -BoardCells.BOARD_OFFSET + 1; i < mapSize + BoardCells.BOARD_OFFSET - 1; i++) {
            for (let j = -BoardCells.BOARD_OFFSET + 1; j < mapSize + BoardCells.BOARD_OFFSET - 1; j++) {
                var c = 0;

                c += cells[i - 1][j];
                c += cells[i - 1][j + 1];
                c += cells[i - 1][j - 1];

                c += cells[i][j + 1];
                c += cells[i][j - 1];

                c += cells[i + 1][j];
                c += cells[i + 1][j + 1];
                c += cells[i + 1][j - 1];

                if (1 === cells[i][j]) {
                    if (2 > c || 3 < c) {
                        tmpMap[i][j] = 0;
                    }
                } else if (0 === cells[i][j]) {
                    if (3 === c) {
                        tmpMap[i][j] = 1;
                    }
                }
            }
        }

        return tmpMap;
    }
}
BoardCells.DEFAULT_SIZE = 50;
BoardCells.BOARD_OFFSET = 10;

module.exports = {
    BoardCells: BoardCells
};
