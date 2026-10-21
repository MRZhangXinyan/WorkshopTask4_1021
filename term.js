"use strict";

// Terms are logical election epochs, not measurements of wall-clock time.
class Term {
    constructor(number = 0) {
        if (!Number.isSafeInteger(number) || number < 0) {
            throw new RangeError("Term must be a non-negative integer");
        }
        this.number = number;
    }

    next() {
        this.number += 1;
        return this.number;
    }
}

module.exports = Term;
