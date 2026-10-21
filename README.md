# COMSM0122 – Workshop 4: Understanding and Stress-Testing Raft

Educational JavaScript simulation of Raft leader election, heartbeats, failures, log replication, network partitions, recovery, and operational monitoring.

**Status:** Modified and tested version of the supplied workshop repository, not a production implementation of Raft.

## Requirements

- Node.js 18 or later
- npm
- Ubuntu/WSL, macOS or Windows terminal
- Optional: Visual Studio Code

No third-party runtime libraries are required.

## Quick start

```bash
npm install
npm start
npm run all
npm test
```

To save the complete scenario output:

```bash
npm run all > all_scenarios.txt 2>&1
npm test > test_results.txt 2>&1
```

## Scenario commands

| Part | npm script | Purpose |
|---|---|---|
| 1 | `npm run election` | Followers, candidates, votes, leader and term |
| 2 | `npm run heartbeats` | Empty AppendEntries and election-timer resets |
| 3 | `npm run leader-failure` | Failure, new term, re-election, old leader recovery |
| 4 | `npm run replication` | Client request, log entry, acknowledgements and commit |
| 5 | `npm run follower-failure` | Commit with one failed follower |
| 6 | `npm run majority-lost` | Failure to elect or commit without majority |
| 7 | `npm run partition` | Minority vs majority and log repair after partition |
| 8 | `npm run recovery` | Follower missing entries 3–5 and catching up |
| 9–10 | `npm run hardening` | Timeout validation, storm/churn/quorum/lag/state warnings |
| All | `npm run all` | Run the nine workshop scenarios in order |
| Tests | `npm test` | Node.js built-in test runner, 14 checks |


## Important design boundaries

This is a **synchronous teaching simulator**. The explicit method calls simulate timeouts and message exchange. It does **not** implement real sockets, randomized timers, concurrent request scheduling, stable on-disk persistence, all AppendEntries retry/consistency mechanics, crash-recovery persistence, snapshots, membership changes, authenticated transports, or Byzantine fault tolerance. `ENTRY COMMITTED` denotes simulated logical commitment, **not physical disk durability**.

The follower catch-up operation uses an in-memory common-prefix comparison and transfers the remaining leader entries in a single simulated exchange; real Raft uses incremental AppendEntries validation (`prevLogIndex`, `prevLogTerm`), `nextIndex` and acknowledgements. State validation checks the structure of in-memory state but does not implement disk persistence. The timeout multiplier of three is an illustrative configurable heuristic, not a proof of safe timing in all deployments.

## Security and correctness considerations

- Votes are counted only when both request and response are delivered.
- Voting checks term and relative log freshness.
- A leader commits a current-term entry only after majority acknowledgements.
- A stale node steps down after learning a newer term.
- An empty heartbeat cannot commit a conflicting follower entry.
- Repair refuses to overwrite a follower's already committed prefix.
- Quorum monitoring checks network reachability, not merely whether processes are online.


