# Python Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the Python bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable.

---

## Cluster: Deserialization & Dynamic Execution

### `PY-PICKLE` — Unsafe `pickle`/`marshal`/`shelve` deserialization
**Description:** `pickle.load`/`pickle.loads` (and anything built on it: `shelve`, some `multiprocessing` transports, older `pandas.read_pickle`) executes arbitrary code during deserialization via `__reduce__`. Deserializing untrusted or network-sourced data is equivalent to remote code execution.
**Detection heuristic:** `pickle\.(load|loads)\(|cPickle\.|shelve\.open\(` where the byte source is a network request, uploaded file, or cache entry not fully controlled by the server itself.
**Severity:** Critical.

### `PY-YAMLLOAD` — `yaml.load` without `SafeLoader`
**Description:** `yaml.load(data)` without an explicit `Loader=yaml.SafeLoader` (or using `yaml.unsafe_load`) can instantiate arbitrary Python objects from YAML tags (`!!python/object/apply:os.system`), leading to RCE.
**Detection heuristic:** `yaml\.load\(` with no `Loader=` argument, or `Loader=yaml.Loader`/`yaml.unsafe_load(`.
**Severity:** Critical.

### `PY-EVALEXEC` — `eval`/`exec` on untrusted input
**Description:** Passing user-controlled strings to `eval`, `exec`, or `compile()` executes arbitrary Python. Includes indirect forms like `ast.literal_eval` misuse (safer, but still crashes on malformed input) and Jinja2 `Template(user_string)`.
**Detection heuristic:** `\beval\(|\bexec\(|\bcompile\(.*'exec'` where the argument traces to request data, config files from untrusted sources, or CLI args in a multi-tenant context.
**Severity:** Critical when attacker-influenced.

### `PY-SUBPROCESSSHELL` — Command injection via `subprocess`/`os.system`
**Description:** `subprocess.run/call/Popen` with `shell=True` and a string built via concatenation/f-string from untrusted input, or `os.system(f"...{user_input}...")`, allows shell metacharacter injection.
**Detection heuristic:** `shell=True` combined with an f-string/`.format()`/`%`-formatted command; any `os.system(`/`os.popen(` with interpolated input.
**Severity:** Critical.

### `PY-TEMPLATEINJ` — Server-side template injection (SSTI)
**Description:** User input becomes part of the *template source* rather than the template *context* — e.g. `Template(request.form['name']).render()` in Jinja2/Flask — allowing `{{ ''.__class__.__mro__[...] }}`-style sandbox escapes to RCE.
**Detection heuristic:** `render_template_string(` or `Template(` called with a string built from request data rather than a static template file path.
**Severity:** Critical.

---

## Cluster: Injection & Input Validation

### `PY-SQLI` — SQL injection via string formatting
**Description:** Building SQL with f-strings, `%`, or `.format()` instead of parameterized queries (`cursor.execute(query, params)`), including Django `.raw()`/`extra()` and SQLAlchemy `text()` with interpolated values.
**Detection heuristic:** `execute\(f['"]|execute\(.*%\s*\(|\.raw\(f|extra\(where=f`. Confirm the interpolated value flows from request input.
**Severity:** Critical.

### `PY-SSRF` — Server-side request forgery via `requests`/`urllib`
**Description:** Fetching a URL supplied (fully or partially — host/scheme) by the user without an allowlist, letting an attacker reach internal services (metadata endpoints, internal admin panels) or use the server as a proxy.
**Detection heuristic:** `requests\.(get|post|request)\(` / `urllib\.request\.urlopen\(` where the URL/host is built from request parameters, with no allowlist or scheme/host validation.
**Severity:** High to Critical (cloud metadata endpoint access is Critical).

### `PY-PATHTRAVERSAL` — Path traversal via unsanitized join
**Description:** `os.path.join(base_dir, user_supplied)` or `open(user_supplied)` does not prevent `../` sequences or absolute paths from escaping `base_dir` — `os.path.join` in particular silently discards `base_dir` entirely if the second argument is absolute.
**Detection heuristic:** `os\.path\.join\(.*request\.|open\(.*request\.` without a subsequent `os.path.realpath`/`Path.resolve()` + "is relative to base" check.
**Severity:** High.

### `PY-XMLENTITY` — XXE via unsafe XML parsing
**Description:** `xml.etree.ElementTree`, `lxml`, or `xml.dom.minidom` parsing untrusted XML with external entity resolution enabled, allowing local file read or SSRF via `<!ENTITY xxe SYSTEM "...">`.
**Detection heuristic:** `lxml.etree.parse(` without `resolve_entities=False`; stdlib `xml.etree` is safer by default in modern Python but check for `defusedxml` absence when parsing untrusted XML.
**Severity:** High.

### `PY-ZIPSLIP` — Path traversal on archive extraction (Zip Slip)
**Description:** `zipfile.ZipFile.extractall()` or `tarfile.extractall()` on an untrusted archive whose entry names contain `../` can write files outside the intended extraction directory.
**Detection heuristic:** `\.extractall\(` on an archive obtained from an upload/download, with no per-member path validation (Python 3.12's `tarfile` `filter=` argument addresses this — check it's set).
**Severity:** High.

---

## Cluster: Auth, Secrets & Trust Boundaries

### `PY-WEAKHASH` — Passwords hashed with a fast/weak algorithm
**Description:** Using `hashlib.md5`/`sha256` directly (unsalted, single-round) for password storage instead of a slow, salted KDF (`bcrypt`, `argon2`, `scrypt`, Django's `PBKDF2PasswordHasher`).
**Detection heuristic:** `hashlib\.(md5|sha1|sha256)\(.*password` with no work-factor/salting library involved.
**Severity:** High.

### `PY-WEAKRANDOM` — `random` module used for security-sensitive values
**Description:** The `random` module (Mersenne Twister) is not cryptographically secure; using it for tokens, password-reset codes, or session IDs makes them predictable from a handful of outputs.
**Detection heuristic:** `random\.(random|randint|choice)\(` flowing into a token/secret/session-id variable. Fix: `secrets.token_urlsafe`/`secrets.choice`.
**Severity:** High to Critical.

### `PY-HARDCODEDSECRET` — Hardcoded credentials/keys in source or settings
**Description:** Secrets committed directly rather than loaded from environment/secret manager, including Django `SECRET_KEY` checked into `settings.py`.
**Detection heuristic:** String literals matching key patterns, or `SECRET_KEY = "..."` with a non-placeholder value in a tracked file.
**Severity:** Critical.

### `PY-DEBUGENABLED` — Debug mode / interactive debugger enabled in production
**Description:** Flask/Django running with `debug=True` in production exposes a Werkzeug/Django interactive traceback debugger to any client that triggers an exception — which itself allows arbitrary code execution via the debugger console.
**Detection heuristic:** `app.run(debug=True)`, `DEBUG = True` in a settings module without an environment-based override.
**Severity:** Critical if internet-facing.

---

## Cluster: Concurrency & Async

### `PY-GILFALSECOMFORT` — Assuming the GIL makes compound operations atomic
**Description:** Code relies on "the GIL protects it" for check-then-act sequences (`if key not in cache: cache[key] = compute()`) across threads; the GIL only guarantees individual bytecode ops are atomic, not multi-step sequences, so races on shared mutable state still occur.
**Detection heuristic:** Shared dict/list read-modify-write patterns across `threading.Thread` workers without a `Lock`.
**Severity:** Medium to High depending on what state is corrupted.

### `PY-ASYNCBLOCKING` — Blocking call inside an `async def`
**Description:** Synchronous, blocking I/O (`requests.get`, `time.sleep`, blocking DB drivers, CPU-heavy work) called directly inside an `async def` function stalls the entire event loop for all concurrent tasks.
**Detection heuristic:** `requests\.|time\.sleep\(|\.execute\(` (sync DB driver) inside a function whose signature is `async def`, with no `run_in_executor`/`asyncio.to_thread`.
**Severity:** Medium to High under load.

### `PY-FORKUNSAFE` — Sharing non-fork-safe resources across `multiprocessing`/`os.fork`
**Description:** Objects like open DB connections, file handles, or locks are inherited into a forked child process, where reusing them corrupts state or deadlocks (a lock held by another thread at fork time stays held forever in the child).
**Detection heuristic:** `multiprocessing.Process`/`os.fork()` where the parent has open connections/locks created before the fork with no explicit close/reopen in the child.
**Severity:** Medium.

---

## Cluster: Resource Safety & Crash-Induced DoS

### `PY-UNBOUNDEDREAD` — Reading untrusted input without a size limit
**Description:** `request.get_data()`, `file.read()` on an upload, or a decompression step (`gzip`, `zipfile`) with no size cap, allowing memory exhaustion or zip-bomb style amplification.
**Detection heuristic:** `\.read\(\)` (no length argument) on request bodies/uploads; decompression without checking `info.file_size` before extracting.
**Severity:** Medium to High.

### `PY-BAREEXCEPT` — Bare `except:` / overly broad `except Exception` swallowing errors
**Description:** Catching all exceptions (including `SystemExit`/`KeyboardInterrupt` with a bare `except:`) and continuing silently hides real failures, including security-relevant ones (a failed permission check that raises, then gets swallowed and treated as success).
**Detection heuristic:** `except:\s*$` or `except Exception:\s*pass`. Especially dangerous around auth/permission logic.
**Severity:** Medium (correctness), higher if it masks an auth check failure.

### `PY-MUTABLEDEFAULT` — Mutable default argument
**Description:** `def f(items=[])` — the list is created once at function-definition time and shared across all calls that don't pass their own, causing state to leak between unrelated invocations/requests.
**Detection heuristic:** Function signatures with a `list`/`dict`/`set` literal as a default value.
**Severity:** Low to Medium (correctness bug, can become a cross-request data leak in web handlers).

### `PY-RECURSIONLIMIT` — Unbounded/attacker-controlled recursion depth
**Description:** Recursive parsing (JSON, nested user-defined structures) with no depth limit hits Python's default recursion limit (~1000) and raises `RecursionError`, or with `sys.setrecursionlimit` raised too high, can crash the interpreter (segfault) on deeply nested input before hitting the limit.
**Severity:** Medium.
**Detection heuristic:** Recursive descent parsers/serializers with no explicit depth counter, applied to attacker-supplied nested structures (JSON, YAML, XML).

---

## Cluster: Supply Chain

### `PY-DEPCONFUSION` — Unpinned or typosquat-vulnerable dependency
**Description:** `requirements.txt` without pinned versions/hashes allows a compromised or typosquatted package version to be installed transparently; internal package names without a private index configured are vulnerable to public-registry dependency confusion.
**Detection heuristic:** `requirements.txt` entries without `==`/`--hash`; absence of `pip.conf`/`--index-url` pinning for internal package names.
**Severity:** High.

### `PY-PICKLECACHE` — Using pickle for cache/queue serialization across trust boundaries
**Description:** Using `pickle` to serialize objects into Redis/Celery/a message queue that could be written to by a less-trusted component reintroduces `PY-PICKLE`'s RCE risk at the boundary.
**Detection heuristic:** `pickle.dumps`/`loads` used as the serializer for `celery`, `redis`, or any queue where producers and consumers have different trust levels.
**Severity:** Critical if the queue can be written by untrusted or lower-privilege components.

---

## Cluster: Logic Correctness

### `PY-MUTABLESHARE` — Aliasing/shared-reference bugs from implicit reference semantics
**Description:** Assigning `b = a` for a list/dict and mutating `b` unexpectedly mutates `a` too, since Python variables are references — common in code migrated from value-semantics languages.
**Detection heuristic:** Manual review; look for `copy.deepcopy` absence where independent mutation is assumed after assignment.
**Severity:** Low to Medium.

### `PY-FLOATCOMPARE` — Direct floating-point equality comparison
**Description:** `if x == 0.1` style comparisons fail due to binary floating-point representation error; security-relevant amount/threshold comparisons using exact float equality can be bypassed.
**Detection heuristic:** `==`/`!=` between `float`-typed values, especially amounts, prices, or thresholds.
**Severity:** Low to Medium (correctness; higher if it's a payment/quota check).

### `PY-TIMINGUNSAFECOMPARE` — Non-constant-time secret comparison
**Description:** Comparing HMACs/tokens/passwords with `==` leaks timing information; the fix is `hmac.compare_digest`.
**Detection heuristic:** `==` between variables named `signature`/`token`/`mac`/`digest` and a computed value.
**Severity:** Medium.

### `PY-DATETIMENAIVE` — Naive (timezone-unaware) datetime used in security-relevant expiry checks
**Description:** Comparing `datetime.now()` (naive, local time) against a stored UTC-aware expiry timestamp can silently produce wrong results (e.g. accepting an expired token) depending on server timezone configuration.
**Detection heuristic:** `datetime.now()`/`datetime.utcnow()` (deprecated, also naive) mixed with timezone-aware comparisons for token/session expiry.
**Severity:** Medium.
