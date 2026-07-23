# TypeScript / JavaScript Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the TypeScript/JavaScript (Node.js and browser) bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable.

Applies to both TS and plain JS; TS-specific entries are marked.

---

## Cluster: Injection & Dynamic Code Execution

### `TS-EVAL` — `eval` / `new Function()` / indirect eval on untrusted input
**Description:** Constructing and executing code strings from user input, config, or network responses. Includes `eval(userInput)`, `new Function(args, body)`, `setTimeout(str, ms)` with a string first argument, and `vm.runInNewContext` without a locked-down sandbox.
**Detection heuristic:** `\beval\(|new Function\(|setTimeout\(\s*['"\`]|setInterval\(\s*['"\`]|vm\.run`. Trace the argument back to request bodies, query params, env vars, or file contents.
**Severity:** Critical if the string is attacker-influenced (RCE); Informational if fully static.

### `TS-CMDINJ` — Command injection via `child_process`
**Description:** `exec`/`execSync` build a shell command via string concatenation or template literals with untrusted input, letting shell metacharacters (`;`, `|`, `` ` ``, `$()`) inject additional commands.
**Detection heuristic:** `child_process\.(exec|execSync)\(` followed by a template string or `+` concatenation. `execFile`/`spawn` with an argv array is the safe alternative — flag its absence.
**Severity:** Critical (RCE) when input is externally controlled.

### `TS-SQLI` — SQL injection via string-built queries
**Description:** Building SQL with template literals or `+` instead of parameterized queries/prepared statements (`db.query('...' + userId)`), including ORM `.raw()`/`$queryRawUnsafe` escapes.
**Detection heuristic:** `query\(\s*[`'"].*\$\{|\.raw\(|\$queryRawUnsafe\(`. Confirm the interpolated value flows from request input.
**Severity:** Critical for auth/data-bearing tables, High otherwise.

### `TS-NOSQLI` — NoSQL/operator injection (MongoDB, etc.)
**Description:** Passing a raw request body/object directly into a Mongo query (`find(req.body)`), letting an attacker inject operators like `{"$ne": null}` or `{"$where": "..."}` to bypass filters or execute JS server-side (`$where`).
**Detection heuristic:** `find\(\s*req\.(body|query|params)\)`, `\$where\b` in a query built from user input. Missing schema validation (no Zod/Joi/express-validator) before the query is the enabling condition.
**Severity:** High to Critical depending on whether `$where` (arbitrary JS execution) is reachable.

### `TS-TEMPLATEINJ` — Server-side template injection (SSTI)
**Description:** User input flows into a template string that is then compiled/rendered (EJS, Handlebars with unsafe helpers, Pug with `#{}` interpolation of untrusted data), allowing template-engine directive injection.
**Detection heuristic:** Template render calls (`ejs.render`, `pug.render`) where the template source itself (not just data) includes request input.
**Severity:** Critical if it leads to code execution in the templating engine.

---

## Cluster: Prototype Pollution & Object Safety

### `TS-PROTOPOLLUTE` — Prototype pollution via recursive merge/assign
**Description:** A recursive deep-merge/clone/set utility (hand-rolled or an outdated `lodash.merge`/`deepmerge`) copies keys from untrusted JSON without blocking `__proto__`, `constructor`, or `prototype`, letting an attacker mutate `Object.prototype` for every object in the process.
**Detection heuristic:** Custom recursive merge functions without a denylist check; `JSON.parse` output flowing directly into `merge()`/`extend()`/`_.merge()`. Grep for `__proto__` handling (its absence is the bug).
**Severity:** High to Critical — can escalate to auth bypass or RCE depending on what downstream code reads off polluted objects.

### `TS-MASSASSIGN` — Mass assignment / uncontrolled object spread into models
**Description:** Spreading `req.body` directly into a database update/create call (`User.update({...req.body})`) lets an attacker set fields they shouldn't control (`isAdmin`, `role`, `verified`).
**Detection heuristic:** `\.\.\.req\.(body|query)` flowing into an ORM write, or `Object.assign(model, req.body)`.
**Severity:** High — privilege escalation risk.

### `TS-UNSAFEJSONPARSE` — Unsafe `JSON.parse` on oversized/untrusted input without limits
**Description:** Parsing arbitrarily large or deeply nested untrusted JSON with no size/depth limit, enabling memory-exhaustion or algorithmic-complexity DoS (also see `TS-REDOS`).
**Detection heuristic:** `JSON.parse(` directly on a request body without a body-size limit middleware (`express.json({limit: ...})` missing or set very high).
**Severity:** Medium.

---

## Cluster: ReDoS & Input Validation

### `TS-REDOS` — Regular expression denial of service
**Description:** A regex with nested quantifiers or overlapping alternation (e.g. `(a+)+`, `(a|a)*`, `(.*)+`) exhibits catastrophic backtracking on crafted input, blocking the Node.js single-threaded event loop.
**Detection heuristic:** Regex literals with nested `+`/`*` groups; run inputs through a regex-complexity linter (`eslint-plugin-security` `detect-unsafe-regex`) or test with a long adversarial string (`"a".repeat(30) + "!"`).
**Severity:** High for regexes applied to user-controlled strings on a shared server process.

### `TS-VALIDATIONBYPASS` — Client-only validation trusted server-side
**Description:** Input constraints (length, type, allowed values) enforced only in frontend form validation or a TS type annotation that is erased at runtime, with no corresponding server-side check.
**Detection heuristic:** API handlers that read `req.body` fields and use them without a validation library (Zod/Yup/class-validator/Joi) call, relying only on a TS interface type.
**Severity:** Medium to High depending on what the unvalidated field controls.

### `TS-TYPEASSERT` — Unsound `as` cast / non-null assertion masking runtime type errors
**Description (TS-specific):** `value as SomeType` or `value!` used to silence the compiler on data that actually needs a runtime check (parsed JSON, API responses), causing a runtime crash or logic error when the assumption is wrong.
**Detection heuristic:** `as\s+\w+` or trailing `!` on values sourced from `JSON.parse`, `fetch().then(r => r.json())`, or `any`-typed function returns, with no `typeof`/schema validation nearby.
**Severity:** Low to Medium (correctness/DoS), higher if the miscast value is then used in a security decision.

---

## Cluster: Auth, Session & Trust Boundaries

### `TS-JWTNONE` — JWT `alg: none` / algorithm confusion accepted
**Description:** JWT verification code does not pin the expected algorithm, allowing an attacker to submit a token signed with `alg: none` or to swap an RS256-signed token's algorithm to HS256 using the public key as the HMAC secret.
**Detection heuristic:** `jwt.verify(token, secret)` without an `algorithms: [...]` option; libraries like `jsonwebtoken` are vulnerable to this class if misconfigured.
**Severity:** Critical — full auth bypass.

### `TS-CORSWILDCARD` — Overly permissive CORS with credentials
**Description:** `Access-Control-Allow-Origin: *` (or a reflected `Origin` header) combined with `Access-Control-Allow-Credentials: true`, letting any origin make authenticated cross-site requests.
**Detection heuristic:** `cors({ origin: true, credentials: true })` or manual header-reflection (`res.header('Access-Control-Allow-Origin', req.headers.origin)`).
**Severity:** High — CSRF-equivalent data exfiltration.

### `TS-SESSIONFIXATION` — Session ID not rotated on privilege change
**Description:** The session identifier issued pre-login is reused after successful authentication instead of being regenerated, letting an attacker who fixed a victim's session ID before login hijack the authenticated session.
**Detection heuristic:** Login handlers that do not call `req.session.regenerate()` (or framework equivalent) before setting authenticated session state.
**Severity:** Medium to High.

### `TS-INSECURECOOKIE` — Missing `httpOnly`/`secure`/`sameSite` on sensitive cookies
**Description:** Session or auth cookies set without `httpOnly` (readable by XSS), `secure` (sent over plain HTTP), or `sameSite` (CSRF exposure).
**Detection heuristic:** `res.cookie(` / `Set-Cookie` calls missing these flags for cookies whose name suggests session/auth.
**Severity:** Medium.

---

## Cluster: Async, Concurrency & Resource Safety

### `TS-UNHANDLEDREJECTION` — Floating/unhandled promise
**Description:** A promise-returning call is invoked without `await`, `.then/.catch`, or `void`, so a rejection becomes an unhandled rejection — in Node this can crash the process (depending on `--unhandled-rejections` mode) or silently swallow an error path.
**Detection heuristic:** ESLint `no-floating-promises` (requires `@typescript-eslint`) findings; grep for async function calls at statement position with no `await`/`.catch`.
**Severity:** Medium (crash/DoS) to Low (silent failure), higher if it drops a security-relevant error (e.g. a failed auth check).

### `TS-ASYNCCTORLEAK` — Async work started in a constructor/module scope with no lifecycle owner
**Description:** Fire-and-forget async operations (timers, subscriptions, open connections) started without ever being cancelled/closed, accumulating listeners or connections over the process lifetime.
**Detection heuristic:** `setInterval`/`setImmediate`/event-emitter `.on()` registrations in constructors or module top-level with no matching `clearInterval`/`.off()`/`removeListener` in a teardown path.
**Severity:** Medium — memory/resource-leak DoS under sustained load.

### `TS-RACEBOOTSTRAP` — Missing await creates a check-then-act race
**Description:** An `async` initialization step (loading config, establishing a DB connection) is not awaited before request handling begins, so early requests observe partially-initialized state.
**Detection heuristic:** Server `listen()` call not gated behind the resolution of an async setup promise.
**Severity:** Medium.

### `TS-EVENTLOOPBLOCK` — Synchronous CPU-heavy work blocking the event loop
**Description:** Expensive synchronous operations (large JSON stringify/parse, crypto with sync APIs, image processing, big regex) run directly in a request handler, stalling all other connections on that Node process.
**Detection heuristic:** `JSON.stringify`/`parse` on large structures, `crypto.*Sync`, `fs.*Sync` in hot request paths without offloading to a worker thread.
**Severity:** Medium to High under adversarial/large input (DoS).

---

## Cluster: Supply Chain & Dependency Risk

### `TS-DEPCONFUSION` — Dependency/typosquat confusion
**Description:** A private/internal package name is also resolvable from the public npm registry (no scoped package, no registry pinning), letting an attacker publish a malicious public package with the same name that gets installed instead.
**Detection heuristic:** `package.json` dependencies that look internal (company-prefixed, unscoped) with no corresponding `.npmrc` registry override or scope (`@company/...`).
**Severity:** Critical if it reaches CI/production install.

### `TS-POSTINSTALLSCRIPT` — Unreviewed lifecycle scripts in dependencies
**Description:** A dependency (or transitive dependency) runs an arbitrary `postinstall`/`preinstall` script at install time, which is a common supply-chain compromise vector.
**Detection heuristic:** `npm ls --all` / lockfile audit for packages with `scripts.postinstall`; CI without `--ignore-scripts` for untrusted installs.
**Severity:** High — arbitrary code execution on developer/CI machines.

### `TS-LOCKFILEMISMATCH` — Lockfile not committed or out of sync with manifest
**Description:** Missing or stale `package-lock.json`/`pnpm-lock.yaml` means installs can silently pull newer, unaudited transitive versions (or a compromised version if a package was unpublished/repurposed).
**Detection heuristic:** Lockfile absent from VCS, or `npm ci` failing due to manifest/lockfile drift.
**Severity:** Medium.

---

## Cluster: Info Disclosure & Logging

### `TS-STACKTRACELEAK` — Stack traces or internal errors returned to clients
**Description:** An unhandled exception handler serializes the full `Error` object (including `stack`) into an HTTP response, leaking file paths, dependency versions, and internal logic to attackers.
**Detection heuristic:** Express error middleware or `catch` blocks that `res.json(err)` or `res.send(err.stack)` directly, especially when `NODE_ENV` is not checked.
**Severity:** Low to Medium (info disclosure aiding further attacks).

### `TS-SECRETLOG` — Secrets logged or included in error telemetry
**Description:** Passwords, tokens, or API keys are logged directly (`console.log(req.body)`, full request/response logging middleware) or forwarded to an error-tracking SaaS without redaction.
**Detection heuristic:** Logging of entire request/response objects on auth-related routes; missing redaction config on Sentry/Datadog integrations.
**Severity:** High.

### `TS-SOURCEMAPLEAK` — Production source maps expose original source
**Description:** `.map` files are deployed alongside minified bundles in production, letting anyone reconstruct original TypeScript source including comments and internal logic.
**Detection heuristic:** Build config (`webpack`/`vite`) with `devtool: 'source-map'` in production mode and no server-side block on `.map` requests.
**Severity:** Low to Medium depending on what's exposed (hardcoded secrets are Critical if found this way).

---

## Cluster: Crypto & Secrets

### `TS-WEAKRANDOM` — `Math.random()` used for security-sensitive values
**Description:** `Math.random()` is not cryptographically secure; using it for session tokens, password-reset codes, or API keys makes them predictable.
**Detection heuristic:** `Math\.random\(\)` flowing into a token/id/secret variable name. The fix is `crypto.randomBytes`/`crypto.randomUUID`.
**Severity:** High to Critical depending on what the token protects.

### `TS-HARDCODEDSECRET` — Hardcoded credentials or API keys in source
**Description:** Secrets committed directly in source files rather than loaded from environment/secret manager.
**Detection heuristic:** String literals matching key-like patterns (`sk_live_`, `AKIA`, `-----BEGIN PRIVATE KEY-----`) or variable names like `apiKey =`/`secret =` assigned a literal.
**Severity:** Critical.

---

## Cluster: Panic/Crash-Induced DoS

### `TS-UNCAUGHTEXCEPTION` — Missing global error boundary/handler crashes the process
**Description:** No `process.on('uncaughtException'/'unhandledRejection')` handler (or one that doesn't exit gracefully) means a single unexpected error anywhere can crash the whole Node process, taking down all in-flight requests.
**Detection heuristic:** Absence of top-level handlers in the entrypoint file; framework middleware not wrapping async handlers (Express pre-5 requires manual `try/catch` or a wrapper for async route handlers, else a rejected promise crashes the process).
**Severity:** Medium to High for internet-facing services.

### `TS-UNBOUNDEDBODYSIZE` — No request body/file-upload size limit
**Description:** No `limit` configured on body-parsing middleware or multipart upload handling, letting an attacker send an arbitrarily large payload to exhaust memory.
**Detection heuristic:** `express.json()`/`bodyParser.json()` without `limit`, `multer` without `limits.fileSize`.
**Severity:** Medium.

---

## Cluster: Logic Correctness

### `TS-LOOSEEQUALITY` — `==`/`!=` triggering unexpected type coercion
**Description:** Loose equality can produce surprising results (`"" == 0` is `true`, `null == undefined` is `true`) that create auth/logic bugs when comparing user input against expected values.
**Detection heuristic:** `==`/`!=` (not `===`/`!==`) in security-relevant comparisons (role checks, token comparisons).
**Severity:** Low to Medium depending on context; Medium+ if it's an auth check.

### `TS-TIMINGUNSAFECOMPARE` — Non-constant-time comparison of secrets
**Description:** Comparing tokens/HMACs/passwords with `===` or `String.prototype ==` leaks timing information proportional to the matching prefix length, enabling a timing side-channel to recover the secret byte by byte.
**Detection heuristic:** `===` comparisons of variables named `token`/`signature`/`hmac`/`hash` against a computed value, with no `crypto.timingSafeEqual`.
**Severity:** Medium (requires a very controlled network environment to exploit in practice, but real).
