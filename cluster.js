"use strict";

class Cluster {
    constructor(nodes) {
        if (!Array.isArray(nodes) || !nodes.length ||
            new Set(nodes.map(node => node.id)).size !== nodes.length) {
            throw new Error("Cluster requires a non-empty list of unique nodes");
        }
        this.nodes = nodes;
    }

    majority() {
        return Math.floor(this.nodes.length / 2) + 1;
    }

    onlineNodes() {
        return this.nodes.filter(node => node.online);
    }

    hasMajority() {
        return this.onlineNodes().length >= this.majority();
    }

    leaders() {
        return this.onlineNodes().filter(node => node.role === "LEADER");
    }

    // In a partition, separate terms can temporarily have different local leaders.
    // Prefer the highest known term, but do not confuse this with global quorum.
    leader() {
        return this.leaders().sort((a, b) => b.currentTerm - a.currentTerm)[0] || null;
    }

    reachableNodes(node, network) {
        if (!node.online) return [];
        return this.onlineNodes().filter(peer =>
            network.canDeliver(node.id, peer.id) &&
            network.canDeliver(peer.id, node.id));
    }

    canReachMajority(node, network) {
        return this.reachableNodes(node, network).length >= this.majority();
    }
}

module.exports = Cluster;
