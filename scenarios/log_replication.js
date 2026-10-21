"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const nodes = [new Node("A"), new Node("B"), new Node("C")];
const simulator = new Simulator(new Cluster(nodes), new Network());
console.log("\n=== PART 4: LOG REPLICATION ===");
simulator.electLeader(nodes[1]);
simulator.replicate("instances=10");
for (const node of nodes) {
    console.log(`${node.id}: log=${JSON.stringify(node.log)}, commitIndex=${node.commitIndex}`);
}
