"use strict";
const Node = require("../node");
const Cluster = require("../cluster");
const Network = require("../network");
const Simulator = require("../simulator");

const [a, b, c, d, e] = ["A", "B", "C", "D", "E"].map(id => new Node(id));
const cluster = new Cluster([a, b, c, d, e]);
const network = new Network();
const simulator = new Simulator(cluster, network);
console.log("\n=== PART 7: NETWORK PARTITION ===");
simulator.electLeader(a);
simulator.heartbeat(a);
network.partition([["A", "B"], ["C", "D", "E"]]);
console.log(`Minority A,B can reach quorum? ${cluster.canReachMajority(a, network)}`);
console.log(`Majority C,D,E can reach quorum? ${cluster.canReachMajority(c, network)}`);
console.log(`Minority leader can commit: ${simulator.replicate("minority-write", a)}`);
console.log(`Majority elects C: ${simulator.electLeader(c)}`);
console.log(`Majority can commit: ${simulator.replicate("majority-write", c)}`);
console.log(`Before repair: A term=${a.currentTerm}, C term=${c.currentTerm}`);
network.repair();
simulator.heartbeat(c); // Former minority leader A learns the new term.
simulator.syncFollower(c, a);
simulator.syncFollower(c, b);
console.log(`After repair: A role=${a.role}, term=${a.currentTerm}`);
console.log(`Committed history A=${JSON.stringify(a.log)}, C=${JSON.stringify(c.log)}`);
