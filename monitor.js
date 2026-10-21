"use strict";

// Monitoring runs on explicit logical ticks; it is not a real-time scheduler.
class RaftMonitor {
    constructor({ electionStormThreshold = 3, churnThreshold = 2, window = 5,
                  maxFollowerLag = 1 } = {}) {
        this.electionStormThreshold = electionStormThreshold;
        this.churnThreshold = churnThreshold;
        this.window = window;
        this.maxFollowerLag = maxFollowerLag;
        this.electionAttempts = [];
        this.leaderChanges = [];
        this.lastLeader = null;
        this.audit = [];
    }

    record(type, details) {
        const event = { type, details };
        this.audit.push(event);
        console.log(`AUDIT ${type}: ${JSON.stringify(details)}`);
    }

    validateElectionTimeout(electionTimeoutMs, heartbeatIntervalMs) {
        // Pedagogical guideline, not a universally sufficient Raft timing condition.
        const valid = Number.isFinite(electionTimeoutMs) &&
            Number.isFinite(heartbeatIntervalMs) && heartbeatIntervalMs > 0 &&
            electionTimeoutMs >= 3 * heartbeatIntervalMs;
        if (!valid) console.log("WARNING: ELECTION TIMEOUT TOO SHORT RELATIVE TO HEARTBEATS");
        return valid;
    }

    recordElectionAttempt(nodeId, tick) {
        this.electionAttempts.push({ nodeId, tick });
        this.electionAttempts = this.electionAttempts.filter(e => e.tick >= tick - this.window);
        this.record("election-attempt", { nodeId, tick });
        if (this.electionAttempts.length > this.electionStormThreshold) {
            console.log("WARNING: ELECTION STORM");
            return true;
        }
        return false;
    }

    recordLeader(leaderId, tick) {
        if (this.lastLeader === leaderId) return false;
        this.lastLeader = leaderId;
        this.leaderChanges.push({ leaderId, tick });
        this.leaderChanges = this.leaderChanges.filter(e => e.tick >= tick - this.window);
        this.record("leader-change", { leaderId, tick });
        if (this.leaderChanges.length > this.churnThreshold) {
            console.log("WARNING: LEADERSHIP CHURN");
            return true;
        }
        return false;
    }

    checkQuorum(cluster, network, leader) {
        const reachable = cluster.reachableNodes(leader, network).length;
        const healthy = reachable >= cluster.majority();
        this.record("quorum-health", { leader: leader.id, reachable, required: cluster.majority(), healthy });
        if (!healthy) console.log("WARNING: NO REACHABLE MAJORITY");
        return healthy;
    }

    checkFollowerLag(leader, follower) {
        const lag = Math.max(0, leader.log.length - follower.log.length);
        this.record("follower-lag", { leader: leader.id, follower: follower.id, lag });
        if (lag > this.maxFollowerLag) console.log(`WARNING: FOLLOWER ${follower.id} LAG=${lag}`);
        return lag;
    }

    validatePersistentState(node) {
        const valid = Number.isSafeInteger(node.currentTerm) && node.currentTerm >= 0 &&
            (node.votedFor === null || typeof node.votedFor === "string") &&
            Number.isSafeInteger(node.commitIndex) && node.commitIndex >= 0 &&
            node.commitIndex <= node.log.length &&
            node.log.every((e, i) => e.index === i + 1 &&
                Number.isSafeInteger(e.term) && e.term >= 0 && typeof e.command === "string");
        this.record("state-validation", { node: node.id, valid });
        if (!valid) console.log(`WARNING: INVALID STATE ON ${node.id}`);
        return valid;
    }
}

module.exports = RaftMonitor;
