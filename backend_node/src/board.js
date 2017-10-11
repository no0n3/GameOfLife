var BoardCells = require('./board_cells').BoardCells;

/**
 * Holds all boards.
 * @type {object}
 */
let boards = {};

module.exports = {
    /**
     * Gets the board specified by the token.
     * @param {string} token
     * @returns {BoardCells}
     */
    getByToken(token) {
        let board = boards[token];
        if (!(board instanceof BoardCells)) {
             boards[token] = new BoardCells();
        }

        return  boards[token];
    }
};
