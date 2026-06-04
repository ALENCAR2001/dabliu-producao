---
shortDescription: Reviews code and plans for logic coherence, correctness, and structural integrity.
usedBy: [reviewer]
version: 0.0.1
lastUpdated: 2026-03-26
---

## Purpose

A correct function that violates a naming rule can ship with a warning. A rule-compliant function with broken logic cannot ship at all. This skill checks the things that matter most — does the code make sense, does it survive real-world input, and does it respect the project's structural boundaries. It is the first pass in any review because nothing else matters until the code is coherent and correct.

## Procedure

1. **Logic coherence.** Read the work as a narrative. Trace the flow from entry point to exit. Check:
   - Does the algorithm solve what the task brief says it should?
   - Are there unreachable branches, dead code, or circular logic?
   - Do the data structures fit the problem, or is the code fighting its own model?
   - For plans: check for ambiguity (instructions that can be read two ways), logical gaps (steps that assume preconditions without establishing them), redundancy (duplicate steps), and contradictions.
   - For other work: review against the task brief's acceptance criteria. Stress-test for blindspots, ambiguity, and false assumptions.

2. **Correctness.** The logic is sound — now verify it survives real-world input. Walk each changed file and check:
   - Error paths — every error is handled or explicitly logged. No silent swallows.
   - Boundary conditions — off-by-one, nil/null, empty collections, zero values.
   - Concurrency — shared state is protected. No data races, no unguarded async mutations.
   - N+1 queries — loops that trigger a database query per iteration instead of batching.
   - Resource leaks — unclosed connections, file handles, channels, or transactions in error paths.
   - Retry logic — missing backoff, missing idempotency keys, thundering-herd potential on failure recovery.
   - Time handling — timezone assumptions, clock skew sensitivity, missing UTC normalization.
   - Stale reads — reading state, deciding, then acting without verifying the state still holds.
   - Missing indexes — new query patterns that will table-scan at production data volumes.
   - Missing timeouts — external calls (HTTP clients, database queries, third-party APIs) without a timeout. One slow dependency without a deadline cascades into a full system hang.
   - Backward compatibility — does this change break existing consumers? Removed or renamed fields, changed response shapes, stricter validation, or altered behavior on existing endpoints.
   - Incomplete work markers — `TODO`, `FIXME`, `HACK`, `XXX`, empty function bodies, stub implementations returning hardcoded values.
   - Test skip markers — `t.Skip()`, `pytest.mark.skip`, `.skip(`, `xit(`, `xdescribe(`, `xtest(`, or equivalent. Skipped tests hide regressions.

3. **Structural coherence.** Step back from individual lines. Read the `.context.md` files for affected directories to understand layer boundaries and directory purpose. Check:
   - Does the change respect those boundaries?
   - Are there new dependencies that break the dependency direction?
   - Is there duplicated logic that should be extracted, or premature abstractions that should be inlined?
   - For plans: does any proposed change introduce a dependency that flows against the architecture's grain?

4. **Classify findings.** For each issue found, assign a severity:
   - **Blocker** — logic incoherence, correctness bug, architectural violation, plan contradiction. Must be fixed.
   - **Warning** — minor structural concern, edge case worth considering. Should be addressed.
   - **Note** — observation or question. No action required.

## Guardrails

- Never skip the logic coherence step to jump to correctness. A correct implementation of broken logic is still broken.
- Never flag style, naming, or convention issues. Those belong to the quality review skill.
