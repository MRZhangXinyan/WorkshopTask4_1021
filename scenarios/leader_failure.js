"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const [a, b, c] = [new Node("A"), new Node("B"), new Node("C")];
const cluster = new Cluster([a, b, c]);
const simulator = new Simulator(cluster, new Network());
console.log("\n=== PART 3: LEADER FAILURE ===");
simulator.electLeader(b);
console.log(`Initial leader=${b.id}, term=${b.currentTerm}`);
b.fail();
console.log("Election timeout simulated at node A");
simulator.electLeader(a);
console.log(`Replacement leader=${cluster.leader()?.id}, term=${cluster.leader()?.currentTerm}`);
b.recover();
simulator.heartbeat(a); // Node B sees the newer term and remains a follower.
console.log(`Recovered B: role=${b.role}, term=${b.currentTerm}`);
