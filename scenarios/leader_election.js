"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const nodes = [new Node("A"), new Node("B"), new Node("C")];
const cluster = new Cluster(nodes);
const simulator = new Simulator(cluster, new Network());
console.log("\n=== PART 1: LEADER ELECTION ===");
console.log("Initial states:", nodes.map(n => `${n.id}=${n.role}`).join(", "));
simulator.electLeader(nodes[1]);
console.log("Elected leader:", cluster.leader()?.id || "none");
console.log("Term:", cluster.leader()?.currentTerm ?? "none");
