"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");
const RaftMonitor = require("../monitor");

const nodes = ["A", "B", "C", "D", "E"].map(id => new Node(id));
const [a, b] = nodes;
const cluster = new Cluster(nodes);
const network = new Network();
const simulator = new Simulator(cluster, network);
const monitor = new RaftMonitor();
console.log("\n=== PARTS 9 & 10: OPERATIONAL HARDENING ===");
console.log("Timeout configuration valid:", monitor.validateElectionTimeout(50, 30));
console.log("Safe example valid:", monitor.validateElectionTimeout(300, 30));
for (let tick = 1; tick <= 5; tick++) monitor.recordElectionAttempt("A", tick);
monitor.recordLeader("A", 1);
monitor.recordLeader("B", 2);
monitor.recordLeader("C", 3);
simulator.electLeader(a);
for (const node of nodes.slice(2)) node.fail();
console.log("Reachable quorum:", monitor.checkQuorum(cluster, network, a));
// Replication with two online nodes cannot commit, but reveals replication lag.
simulator.replicate("one", a);
simulator.replicate("two", a);
console.log("Follower C lag:", monitor.checkFollowerLag(a, nodes[2]));
console.log("Node A state valid:", monitor.validatePersistentState(a));
a.commitIndex = 999; // Deliberate corruption for the validation demonstration.
console.log("Corrupted node A state valid:", monitor.validatePersistentState(a));
console.log("Audit events recorded:", monitor.audit.length);
