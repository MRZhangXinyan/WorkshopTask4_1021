"use strict";

class Network {
    constructor() {
        // null means all pairs are connected; otherwise an array of ID groups.
        this.groups = null;
        this.events = [];
    }

    canDeliver(from, to) {
        if (this.groups === null) return true;
        return this.groups.some(group => group.includes(from) && group.includes(to));
    }

    send(from, to, message) {
        const delivered = this.canDeliver(from, to);
        const event = { from, to, message, delivered };
        this.events.push(event);
        console.log(`NETWORK ${delivered ? "DELIVERED" : "DROPPED"}: ${from} -> ${to} ${message}`);
        return delivered;
    }

    partition(groups) {
        if (!Array.isArray(groups) || groups.length < 2 ||
            groups.some(group => !Array.isArray(group) || group.length === 0)) {
            throw new Error("Provide at least two non-empty node-ID groups");
        }
        const ids = groups.flat();
        if (new Set(ids).size !== ids.length) {
            throw new Error("Each node must occur in only one partition group");
        }
        this.groups = groups.map(group => [...group]);
        console.log(`NETWORK PARTITION ACTIVE: ${JSON.stringify(this.groups)}`);
    }

    repair() {
        this.groups = null;
        console.log("NETWORK PARTITION REPAIRED");
    }
}

module.exports = Network;
