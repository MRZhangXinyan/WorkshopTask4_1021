"use strict";

// A Raft log entry is identified by its index and the leader's term.
class LogEntry {
    constructor(index, term, command) {
        this.index = index;
        this.term = term;
        this.command = command;
    }
}

module.exports = LogEntry;
