# Parallel Agent Orchestration

Use subagents proactively for non-trivial work when at least two workstreams are independent.

- Fan out 2-4 independent `task` calls in the same assistant turn so they run concurrently. Use up to 6 only for large tasks with clearly disjoint scopes.
- Delegate codebase discovery to `explore`, external research to `search`, and isolated multi-step implementation or verification to `general`.
- Give every agent a concrete deliverable, relevant paths or symbols, constraints, and a non-overlapping ownership boundary.
- Keep integration, shared-file edits, dependency ordering, and final verification with the primary agent unless ownership is explicitly assigned to one worker.
- A `general` worker may fan out `explore` and `search` leaf agents when discovery or external research can run while it handles its assigned workstream.
- Do not delegate trivial work, strictly sequential work, or tasks likely to edit the same files. Do not duplicate work already delegated.
- Batch independent reads, searches, and checks with the available parallel tool-call mechanism instead of issuing them one at a time.
- After fan-out completes, reconcile conflicting findings, integrate once, and run the relevant checks.
