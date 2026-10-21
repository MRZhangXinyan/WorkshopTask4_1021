"use strict";

const LogEntry = require("./logEntry");

function isUpToDate(candidate, voter) {
    const a = candidate.log.at(-1);
    const b = voter.log.at(-1);
    const candidateTerm = a ? a.term : 0;
    const voterTerm = b ? b.term : 0;
    return candidateTerm > voterTerm ||
        (candidateTerm === voterTerm && candidate.log.length >= voter.log.length);
}

class Simulator {
    constructor(cluster, network) {
        this.cluster = cluster;
        this.network = network;
    }

    electLeader(node) {
        if (!node.online || !this.cluster.nodes.includes(node)) {
            console.log("ELECTION REJECTED: candidate unavailable");
            return false;
        }
        node.becomeCandidate();
        let votes = 1; // A candidate votes for itself.

        for (const peer of this.cluster.nodes) {
            if (peer.id === node.id || !peer.online) continue;
            if (!this.network.send(node.id, peer.id,
                `RequestVote(term=${node.currentTerm})`)) continue;

            if (peer.currentTerm > node.currentTerm) {
                this.network.send(peer.id, node.id, "VoteDenied(higher term)");
                node.becomeFollower(peer.currentTerm);
                console.log(`Votes = ${votes}/${this.cluster.nodes.length}`);
                return false;
            }
            if (peer.currentTerm < node.currentTerm) {
                peer.becomeFollower(node.currentTerm);
            }
            const grant = (peer.votedFor === null || peer.votedFor === node.id) &&
                isUpToDate(node, peer);
            if (grant) {
                peer.votedFor = node.id;
                peer.resetElectionTimer();
            }
            if (this.network.send(peer.id, node.id,
                `RequestVoteResponse(granted=${grant})`) && grant) {
                votes += 1;
            }
        }

        console.log(`Votes = ${votes}/${this.cluster.nodes.length} (required ${this.cluster.majority()})`);
        if (votes >= this.cluster.majority()) {
            node.becomeLeader();
            return true;
        }
        console.log("NO MAJORITY: election unsuccessful");
        return false;
    }

    // Simulate an AppendEntries RPC and a follower's log-prefix consistency check.
    // No wall-clock delays, retries, or actual sockets are modelled.
    syncFollower(leader, follower) {
        if (!leader.online || !follower.online || leader.role !== "LEADER") return false;
        if (!this.network.send(leader.id, follower.id,
            `AppendEntries(term=${leader.currentTerm}, entries=${leader.log.length})`)) return false;

        if (follower.currentTerm > leader.currentTerm) {
            this.network.send(follower.id, leader.id,
                `AppendEntriesResponse(success=false, term=${follower.currentTerm})`);
            leader.becomeFollower(follower.currentTerm);
            return false;
        }
        if (follower.currentTerm < leader.currentTerm || follower.role !== "FOLLOWER") {
            follower.becomeFollower(leader.currentTerm);
        }
        follower.resetElectionTimer();

        let common = 0;
        while (common < Math.min(leader.log.length, follower.log.length) &&
               leader.log[common].index === follower.log[common].index &&
               leader.log[common].term === follower.log[common].term &&
               leader.log[common].command === follower.log[common].command) {
            common += 1;
        }
        if (common < follower.commitIndex) {
            throw new Error(`SAFETY VIOLATION: cannot replace ${follower.id}'s committed history`);
        }
        const before = follower.log.length;
        follower.log = [
            ...follower.log.slice(0, common),
            ...leader.log.slice(common).map(e => new LogEntry(e.index, e.term, e.command))
        ];
        follower.commitIndex = Math.max(follower.commitIndex,
            Math.min(leader.commitIndex, follower.log.length));
        this.network.send(follower.id, leader.id,
            `AppendEntriesResponse(success=true, matchIndex=${follower.log.length})`);
        if (before !== follower.log.length || common !== before) {
            console.log(`${follower.id} LOG REPAIRED: commonPrefix=${common}, length=${follower.log.length}`);
        }
        return true;
    }

    heartbeat(leader = this.cluster.leader()) {
        if (!leader || !leader.online || leader.role !== "LEADER") {
            console.log("NO ACTIVE LEADER");
            return 0;
        }
        let received = 0;
        for (const peer of this.cluster.nodes) {
            if (peer.id === leader.id || !peer.online) continue;
            if (!this.network.send(leader.id, peer.id,
                `AppendEntries(term=${leader.currentTerm}, entries=[])`)) continue;
            if (peer.currentTerm > leader.currentTerm) {
                leader.becomeFollower(peer.currentTerm);
                break;
            }
            if (peer.currentTerm < leader.currentTerm || peer.role !== "FOLLOWER") {
                peer.becomeFollower(leader.currentTerm);
            }
            peer.resetElectionTimer();
            // A heartbeat cannot commit an entry unless this follower has the
            // SAME entry at that index. Otherwise a partition could "commit"
            // conflicting uncommitted history before log repair.
            const upto = Math.min(leader.commitIndex, peer.log.length);
            const prefixMatches = leader.log.slice(0, upto).every((entry, i) =>
                peer.log[i].term === entry.term &&
                peer.log[i].command === entry.command);
            if (prefixMatches) {
                peer.commitIndex = Math.max(peer.commitIndex, upto);
            } else {
                console.log(`${peer.id}: heartbeat cannot advance commitIndex; log mismatch`);
            }
            received += 1;
        }
        console.log(`HEARTBEATS RECEIVED: ${received}`);
        return received;
    }

    replicate(command, leader = this.cluster.leader()) {
        if (!leader || !leader.online || leader.role !== "LEADER") {
            console.log("NO ACTIVE LEADER: request not processed");
            return false;
        }
        if (typeof command !== "string" || command.length === 0) {
            throw new Error("Client command must be a non-empty string");
        }
        const entry = new LogEntry(leader.log.length + 1, leader.currentTerm, command);
        leader.log.push(entry);
        console.log(`CLIENT REQUEST: ${command}`);
        console.log(`Leader ${leader.id} created entry: index=${entry.index}, term=${entry.term}, command=${entry.command}`);

        let acknowledgements = 1; // Leader already has the new entry.
        for (const peer of this.cluster.nodes) {
            if (peer.id === leader.id || !peer.online) continue;
            if (this.syncFollower(leader, peer)) acknowledgements += 1;
            if (leader.role !== "LEADER") break;
        }
        console.log(`ACKNOWLEDGEMENTS: ${acknowledgements}/${this.cluster.nodes.length}`);
        if (leader.role === "LEADER" && acknowledgements >= this.cluster.majority()) {
            leader.commitIndex = entry.index;
            console.log(`ENTRY COMMITTED: index=${entry.index}`);
            this.heartbeat(leader); // Advertise leaderCommit to reachable peers.
            return true;
        }
        console.log(`NOT COMMITTED: majority ${this.cluster.majority()} not reached`);
        return false;
    }
}

module.exports = Simulator;
