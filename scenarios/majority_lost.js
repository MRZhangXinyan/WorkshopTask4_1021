"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const nodes = ["A", "B", "C", "D", "E"].map(id => new Node(id));
const cluster = new Cluster(nodes);
const simulator = new Simulator(cluster, new Network());
console.log("\n=== PART 6: MAJORITY LOST ===");
simulator.electLeader(nodes[0]);
for (const node of nodes.slice(2)) node.fail();
console.log(`Online nodes=${cluster.onlineNodes().length}, majority needed=${cluster.majority()}`);
console.log(`Current leader can commit? ${simulator.replicate("instances=20", nodes[0])}`);
console.log(`Can B win a new election? ${simulator.electLeader(nodes[1])}`);
console.log(`Uncommitted leader entry: ${nodes[0].log.length}, commitIndex=${nodes[0].commitIndex}`);
