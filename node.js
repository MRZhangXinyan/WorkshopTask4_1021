"use strict";

class Node {
    constructor(id) {
        this.id = id;
        this.role = "FOLLOWER";
        this.currentTerm = 0;
        this.votedFor = null;
        this.log = [];
        this.commitIndex = 0;
        this.online = true;
        // This simulator records timer resets but has no background scheduler.
        this.electionTimerResets = 0;
    }

    becomeFollower(term) {
        if (term < this.currentTerm) return false;
        if (term > this.currentTerm) this.votedFor = null;
        this.currentTerm = term;
        this.role = "FOLLOWER";
        console.log(`${this.id} -> FOLLOWER (TERM ${term})`);
        return true;
    }

    becomeCandidate() {
        if (!this.online) return false;
        this.role = "CANDIDATE";
        this.currentTerm += 1;
        this.votedFor = this.id;
        console.log(`${this.id} -> CANDIDATE (TERM ${this.currentTerm})`);
        return true;
    }

    becomeLeader() {
        if (!this.online || this.role !== "CANDIDATE") return false;
        this.role = "LEADER";
        console.log(`${this.id} -> LEADER (TERM ${this.currentTerm})`);
        return true;
    }

    resetElectionTimer() {
        this.electionTimerResets += 1;
    }

    fail() {
        this.online = false;
        // The crashed process cannot keep providing an active leadership service.
        this.role = "FOLLOWER";
        console.log(`${this.id} OFFLINE`);
    }

    recover() {
        this.online = true;
        this.role = "FOLLOWER";
        console.log(`${this.id} ONLINE`);
    }
}

module.exports = Node;
