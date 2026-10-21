"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const nodes = [new Node("A"), new Node("B"), new Node("C")];
const simulator = new Simulator(new Cluster(nodes), new Network());
console.log("\n=== PART 2: HEARTBEATS ===");
simulator.electLeader(nodes[1]);
simulator.heartbeat();
simulator.heartbeat();
for (const n of nodes) {
    console.log(`${n.id}: role=${n.role}, term=${n.currentTerm}, timerResets=${n.electionTimerResets}`);
}
