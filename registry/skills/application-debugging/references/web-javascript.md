# Web And JavaScript Runtime Debugging

Use this reference for browser, TypeScript/JavaScript, Node.js, Bun, Deno, worker, source-map, event-loop, heap, and frontend performance failures.

## Identify the real runtime

Record the browser engine or server runtime, exact version, module mode, package manager, build tool, source-map policy, rendering mode, and deployed asset hash. Do not assume Node flags work in Bun or Deno, or that development source maps match a production bundle.

Inspect `package.json`, lockfiles, runtime configuration, browser targets, bundler settings, and the command that actually launched the process before choosing a debugger.

## Browser workflow

1. Reproduce from the user-visible action and capture the exact timestamp.
2. Take a current DOM or accessibility snapshot before interacting with an unfamiliar page.
3. Inspect console errors and warnings, failed requests, redirects, response bodies, timing, initiators, cookies, storage, CSP/CORS, and service-worker state.
4. Confirm whether cache, a stale service worker, hydration, race timing, or browser extension changes the result in a clean profile.
5. Set a source-mapped breakpoint at the earliest boundary where state diverges. Use event-listener, DOM, XHR/fetch, or exception breakpoints when the trigger is not a direct call.
6. Correlate frontend requests with backend request or trace IDs before assigning blame to either side.

Use screenshots only for visual evidence. Use DOM/a11y, console, and network evidence for behavior and data-flow conclusions.

## Network and state failures

- Compare URL, method, headers, credentials mode, body, redirect chain, status, cache headers, and response shape against a known-good request.
- Distinguish preflight, DNS/TLS, proxy, CORS/CSP, authentication, server, parsing, and rendering failures; they can produce similar UI symptoms.
- Inspect cookies with their domain, path, SameSite, Secure, partitioning, and expiry context.
- Check service workers and caches before changing application logic. A deployed fix cannot correct a client that is still running old code.
- Preserve a sanitized HAR only when it adds evidence; HAR files often contain tokens and personal data.

## Node.js and compatible inspector workflows

For Node.js, verify flags with `node --help` for the installed version. Typical entry points are:

```bash
node --inspect-brk ./path/to/entry.js
node --trace-uncaught ./path/to/entry.js
```

Use the runtime inspector for breakpoints, exception pause, CPU profiles, heap snapshots, allocation sampling, and async stacks. For Bun or Deno, use that runtime's own documented inspector flags and protocol support rather than copying Node commands blindly.

When debugging TypeScript or bundled code:

- Verify source maps were generated for the exact artifact and are not stale.
- Confirm path remapping, workspace root, and ignore-list settings before trusting a mapped frame.
- Correlate the generated location with the source map and deployed asset hash when a breakpoint resolves unexpectedly.
- Do not publish private source maps merely to make debugging easier.

## Async, event-loop, and worker issues

- Capture pending timers, promises/futures, queue depth, active handles, cancellation, and worker lifecycle at the moment progress stops.
- For ordering bugs, pin time and randomness, loop the scenario, and inject a controlled scheduler boundary only as a hypothesis probe.
- Distinguish event-loop blockage from downstream latency. A CPU profile, event-loop delay metric, and distributed trace answer different questions.
- For worker or child-process failures, capture launch arguments, environment propagation, IPC payload shape, exit code, signal, stdout/stderr, and shutdown handshake.

## Memory and CPU

- Compare heap snapshots around the same controlled workload and GC point. Rising RSS alone does not prove a JavaScript heap leak.
- Follow retaining paths to an application owner, listener, cache, closure, timer, native allocation, or detached DOM node.
- For high CPU, profile before adding logs. Identify whether time is in JavaScript, rendering/layout, garbage collection, native addons, serialization, or I/O waits.
- For page performance, record a trace and tie long tasks, layout shifts, network waterfalls, and user interactions to the exact symptom. Do not optimize a synthetic score without confirming user impact.

## Completion evidence

Return the failing and passing signal, exact runtime/browser identity, source-map and artifact identity, decisive console/network/profile evidence, root cause, regression coverage, and confirmation that temporary DevTools overrides, proxies, throttling, cache disables, and instrumentation were reset.

Official references:

- Node.js debugger: `https://nodejs.org/api/debugger.html`
- Node.js Inspector API: `https://nodejs.org/api/inspector.html`
- Chrome DevTools: `https://developer.chrome.com/docs/devtools/`
- Firefox DevTools: `https://firefox-source-docs.mozilla.org/devtools-user/`
