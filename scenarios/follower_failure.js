"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const [a, b, c] = [new Node("A"), new Node("B"), new Node("C")];
const cluster = new Cluster([a, b, c]);
const simulator = new Simulator(cluster, new Network());
console.log("\n=== PART 5: FOLLOWER FAILURE ===");
simulator.electLeader(a);
c.fail();
console.log(`C is offline; online=${cluster.onlineNodes().length}, majority=${cluster.majority()}`);
const committed = simulator.replicate("instances=10");
console.log(`Committed despite follower failure: ${committed}`);
for (const n of [a, b, c]) console.log(`${n.id}: online=${n.online}, entries=${n.log.length}, commitIndex=${n.commitIndex}`);
