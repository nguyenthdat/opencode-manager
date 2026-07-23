---
name: application-debugging
description: "Diagnoses and fixes hard application and web-runtime failures in TypeScript, JavaScript, Node.js, Bun, Deno, browsers, Python, Go, JVM, .NET, Ruby, PHP, and similar systems. Use for exceptions, failing or flaky tests, wrong UI or API state, async races, hangs, leaks, high CPU or memory, slow requests, browser console/network/service-worker bugs, and performance regressions when root cause is unclear. Use native-binary-debugging instead for core files, minidumps, native registers, disassembly, or WinDbg/GDB/LLDB-first analysis."
compatibility: opencode
metadata:
  domain: "debugging"
  audience: "senior-developer"
---

# Application Debugging

Diagnose application failures with a tight feedback loop and an evidence trail that survives hand-off. Prefer direct runtime or browser evidence over speculative code changes.

## Boundary

Use this skill when the failing behavior is primarily expressed through an application runtime, browser, API, worker, test runner, database interaction, queue consumer, or managed process. The repository may contain native dependencies, but choose `native-binary-debugging` when the useful evidence starts at a native crash, core/minidump, machine address, register, disassembly, or ABI boundary.

Load both skills only for a real managed/native boundary such as Node-API, Python extensions, WebAssembly, JNI, PInvoke, or FFI.

## Workflow

### 1. Establish identity and scope

Record:

- Expected and actual behavior in user-observable terms.
- Exact command, URL, input, account or fixture class, timestamp, timezone, runtime/browser version, build or commit, environment, and feature flags.
- Whether the symptom is deterministic, intermittent, load-dependent, data-dependent, or environment-specific.
- Recent changes and the last known-good version when available.

Do not start with a fix. First make the failure distinguishable from success.

### 2. Build a red-capable signal

Prefer the narrowest unattended signal that exercises the real failing path:

1. Focused unit or integration test.
2. HTTP or CLI replay with a stable fixture.
3. Browser automation that asserts the exact DOM, console, network, or storage symptom.
4. Captured request, event, trace, or message replay.
5. Differential run against a known-good build, input, configuration, or environment.
6. Stress or seeded loop that raises an intermittent failure to a measurable rate.

If no live reproduction is possible, use the supplied logs, trace, HAR, heap snapshot, profile, or crash report as the signal and state its limits. Do not invent a reproduction.

### 3. Map the failing path

Trace inputs, state, and control flow across each relevant boundary:

- Browser -> CDN/service worker -> API -> handler -> database or queue.
- Caller -> async task -> callback/promise/future -> shared state.
- Parent process -> worker or child -> IPC or serialized payload.
- Framework adapter -> application code -> external SDK.

At each boundary, compare what entered, what left, configuration and identity, timestamps, cancellation, retry count, and error translation. Instrument only boundaries that distinguish current hypotheses.

### 4. Rank falsifiable hypotheses

Keep a short ranked table:

| Hypothesis | Evidence for | Evidence against | Lowest-cost decisive probe |
|---|---|---|---|

Test one variable at a time. A probe must predict an observable result before it runs. Update the ranking after every probe instead of accumulating unrelated changes.

### 5. Choose the least-distorting tool

| Symptom | Preferred evidence |
|---|---|
| Browser rendering, event, cache, auth, or request failure | DOM/a11y snapshot, console, network request/response, storage and service-worker state, source-mapped breakpoint |
| Server exception or wrong result | Focused test or replay, full causal stack, request/trace ID, input and output at the narrow failing boundary |
| Async race, deadlock, or flake | Seeded stress loop, fake time, task/thread dump, wait graph, race detector, breakpoint or targeted trace |
| Memory growth | Controlled workload, baseline and later heap snapshots, allocation profile, retained-path analysis, GC evidence |
| High CPU or latency | Baseline timing, CPU/profile trace, flame graph or runtime profiler, query plan, distributed trace |
| Regression after a change | Automated differential run or `git bisect run` with the same red-capable signal |

Read the matching reference only when its runtime is in scope:

- `references/web-javascript.md` for browsers, TypeScript/JavaScript, Node.js, Bun, Deno, source maps, heap, and event-loop issues.
- `references/python-and-managed-runtimes.md` for Python and concise JVM, .NET, Go, Ruby, and PHP tool selection.

Verify version-sensitive commands with the installed tool's help. Do not substitute Node, Bun, Deno, Chrome, Firefox, CPython, PyPy, JVM, or .NET behavior for one another.

### 6. Prove root cause and fix

Root cause requires a causal chain, not a correlated symptom:

1. The hypothesis predicts the observed failure.
2. A targeted probe confirms the prediction or removes the cause.
3. The evidence identifies where the invalid state or control decision originated.
4. A minimal correction at that source makes the original signal pass.

Turn the minimized reproduction into a regression test at the nearest seam that still exercises the real bug. If no honest test seam exists, document that gap rather than adding a shallow test that cannot fail for the original reason.

### 7. Verify and clean up

- Re-run the original, unminimized signal and the focused regression test.
- Run adjacent formatter, linter, type checker, and tests justified by the changed files.
- Compare before/after measurements for performance or resource claims.
- Remove temporary breakpoints, debug routes, broad logging, test credentials, proxy settings, and uniquely tagged instrumentation.
- Inspect the final diff for accidental snapshots, HAR files, dumps, profiles, secrets, or user data.

## Evidence handling

- Redact secrets and personal data before sharing logs, traces, HAR files, heap snapshots, or memory-derived values.
- Treat production attachment, request capture, profiling, and runtime mutation as live actions that need explicit authorization.
- Prefer read-only observation first. State when a debugger, profiler, proxy, or added logging changes timing or memory behavior.

## Return format

```text
Status: FIXED | DIAGNOSED | PARTIAL | BLOCKED
Symptom and signal: <exact command/artifact and observed failure>
Environment identity: <runtime/browser/build/config>
Key observations: <facts only>
Hypotheses tested: <probe -> result>
Root cause: <causal chain and confidence>
Fix: <changed files or hand-off constraints>
Verification: <commands and before/after result>
Cleanup: <temporary diagnostics removed or retained intentionally>
Remaining gaps: <missing access, artifact, symbols, or environment>
```

Do not claim `FIXED` without rerunning the original signal. Use `DIAGNOSED` when the root cause is proven but implementation belongs to another owner.
