---
name: lua-coding
description: "Comprehensive idiomatic Lua guidance: 170 prioritized rules across 15 categories covering tables, scoping, error handling, metatables/OOP, closures, coroutines, module/API design, performance, and embedding contexts. Use when writing, reviewing, refactoring, optimizing, or debugging Lua (`.lua` files, `.luacheckrc`, `.rockspec`, `stylua.toml`). Preserve the target runtime's actual Lua dialect and version — 5.1, 5.2, 5.3, 5.4, or LuaJIT (5.1-plus-extensions) — since embedding hosts (Neovim, OpenResty, Redis, game engines) vary far more in Lua version than most languages; verify before relying on integer subtypes, bitwise operators, `goto`, or `<const>`/`<close>` attributes."
compatibility: opencode
metadata:
  domain: lua
  audience: software-engineer
  edition: project-declared
---

# Lua Best Practices

Comprehensive guide for writing high-quality, idiomatic Lua code across vanilla Lua (5.1-5.4), LuaJIT, and common embedding contexts (Neovim, OpenResty/lua-nginx-module, Redis scripting, game engines like LÖVE). Contains 170 rules across 15 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared/verified target Lua version and dialect unless the user explicitly requests a migration or a version-specific feature is confirmed available on the deployment target.

## When to Apply

Reference these guidelines when:
- Writing new Lua modules, functions, or metatable-based "classes"
- Implementing error handling, coroutine-based control flow, or async bridges
- Designing public module/plugin APIs
- Reviewing code for accidental globals, table/sequence correctness, or metatable misuse
- Optimizing hot loops, table allocation, or GC pressure
- Writing or reviewing Neovim plugins, OpenResty/nginx Lua, Redis scripts, or game scripting code
- Setting up linting (`luacheck`) and formatting (`StyLua`) for a Lua project
- Migrating code between Lua versions or between vanilla Lua and LuaJIT

## Lua Versions and Dialects: Verify Before You Rely

Lua's deployment landscape is unusually fragmented compared to most languages — there is no single "current" runtime, and the gap between what a script can assume and what the host actually provides is the single most common source of "works on my machine" bugs in Lua. **Always confirm the actual target version/dialect before writing version-specific code.**

- **Lua 5.1 (2006).** No `goto`, no bitwise operators, no integer subtype (all numbers are floats), no `table.pack`/`table.unpack` (uses the global `unpack`), `module()` function existed (deprecated, avoid). Still the effective baseline dialect for LuaJIT and historically for Redis scripting.
- **Lua 5.2 (2011).** Added `goto`/labels, `_ENV` (replacing `setfenv`/`getfenv` for sandboxing), `table.pack`/`table.unpack`, weak-table semantics refinements, `__len` on tables, bitwise operations available only via the separate `bit32` library (not operators).
- **Lua 5.3 (2015).** Added the **integer subtype** (numbers are now integer or float, with distinct `math.type()`), native **bitwise operators** (`& | ~ << >> ~`), floor division (`//`), `utf8` library, `string.pack`/`string.unpack`. A major semantic shift: `2` and `2.0` are different subtypes but table-key-equivalent (see `table-key-types`).
- **Lua 5.4 (2020).** Added variable attributes `<const>` and `<close>`, a generational garbage collector mode, integer-for-loop overflow handling changes, `string.format("%s")` now calls `__tostring` automatically. The current reference version for new vanilla-Lua projects.
- **LuaJIT (2005-present, still widely deployed).** Implements the **Lua 5.1 language core** plus its own extensions: `ffi` (C interop), `table.new`/`table.clear`, the `bit` library (not native operators) for bitwise ops, `goto`/labels backported. `_VERSION` still reports `"Lua 5.1"`; check the `jit` global to detect LuaJIT specifically. Powers Neovim, OpenResty, and many game engines for its JIT-compiled performance — but does **not** support 5.2+/5.3+/5.4-only syntax (`<const>`, native bitwise operators, `_ENV`-based sandboxing idioms) unless explicitly noted as a LuaJIT-added feature.
- **Embedding-specific dialects.** Neovim bundles LuaJIT and adds the `vim` global API; OpenResty bundles LuaJIT and adds `ngx`; Redis has historically embedded a Lua 5.1-based interpreter with `os`/`io` disabled and `KEYS`/`ARGV`/`redis.*` added; game engines (LÖVE, and many custom engines) commonly embed LuaJIT for its FFI and speed and add their own globals (`love`, engine-specific tables).

Before writing anything version-sensitive: print `_VERSION`, check for a `jit` global, and check the host's documentation for which standard-library functions are restricted or added. See [`embed-preserve-target-version`](rules/embed-preserve-target-version.md) and [`embed-luajit-vs-plain`](rules/embed-luajit-vs-plain.md) for the full checklist.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Tables & Data Structures | CRITICAL | `table-` | 12 |
| 2 | Scoping & Variables | CRITICAL | `scope-` | 12 |
| 3 | Error Handling | CRITICAL | `err-` | 12 |
| 4 | Metatables & OOP Patterns | HIGH | `meta-` | 13 |
| 5 | Functions & Closures | HIGH | `fn-` | 12 |
| 6 | Coroutines & Concurrency | HIGH | `coro-` | 8 |
| 7 | API/Module Design | HIGH | `api-` | 12 |
| 8 | Naming Conventions | MEDIUM | `name-` | 10 |
| 9 | Testing | MEDIUM | `test-` | 11 |
| 10 | Documentation | MEDIUM | `doc-` | 9 |
| 11 | Performance Patterns | MEDIUM | `perf-` | 15 |
| 12 | Embedding Contexts | MEDIUM | `embed-` | 10 |
| 13 | Project Structure | LOW | `proj-` | 10 |
| 14 | Linting & Formatting | LOW | `lint-` | 9 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Tables & Data Structures (CRITICAL)

- [`table-array-vs-dict`](rules/table-array-vs-dict.md) - Keep array-part and hash-part table usage separate
- [`table-no-holes`](rules/table-no-holes.md) - Never leave `nil` holes in the middle of a sequence
- [`table-preallocate`](rules/table-preallocate.md) - Preallocate tables when the final size is known
- [`table-pairs-vs-ipairs`](rules/table-pairs-vs-ipairs.md) - Use `ipairs` for sequences, `pairs` for maps
- [`table-shallow-vs-deepcopy`](rules/table-shallow-vs-deepcopy.md) - Choose shallow or deep copy deliberately
- [`table-length-operator`](rules/table-length-operator.md) - Treat `#t` as defined only for sequences
- [`table-remove-vs-nil`](rules/table-remove-vs-nil.md) - Use `table.remove`, not manual `nil` assignment
- [`table-insert-append`](rules/table-insert-append.md) - Append consistently with `t[#t+1]`/`table.insert`
- [`table-readonly-proxy`](rules/table-readonly-proxy.md) - Use a `__newindex` proxy for read-only tables
- [`table-key-types`](rules/table-key-types.md) - Use consistent, hashable key types
- [`table-nested-ownership`](rules/table-nested-ownership.md) - Keep clear ownership of nested tables
- [`table-sort-comparator`](rules/table-sort-comparator.md) - Provide a strict-weak-order comparator to `table.sort`

### 2. Scoping & Variables (CRITICAL)

- [`scope-local-by-default`](rules/scope-local-by-default.md) - Always declare variables `local` by default
- [`scope-no-accidental-global`](rules/scope-no-accidental-global.md) - Guard against accidental globals
- [`scope-const-attribute`](rules/scope-const-attribute.md) - Use `<const>` (5.4+) for checked immutability
- [`scope-close-attribute`](rules/scope-close-attribute.md) - Use `<close>` (5.4+) for deterministic cleanup
- [`scope-closure-capture`](rules/scope-closure-capture.md) - Understand upvalue capture semantics
- [`scope-module-pattern`](rules/scope-module-pattern.md) - Use the module-table-return pattern
- [`scope-strict-mode`](rules/scope-strict-mode.md) - Enable a strict-globals guard during development
- [`scope-minimize-scope`](rules/scope-minimize-scope.md) - Declare locals in the smallest enclosing scope
- [`scope-loop-variable-capture`](rules/scope-loop-variable-capture.md) - Know your loop-variable-per-iteration semantics
- [`scope-block-scoping`](rules/scope-block-scoping.md) - Use `do...end` to scope temporary locals
- [`scope-upvalue-limit`](rules/scope-upvalue-limit.md) - Be aware of the ~200 local/upvalue limit
- [`scope-shadowing`](rules/scope-shadowing.md) - Avoid confusing shadowing of outer locals/globals

### 3. Error Handling (CRITICAL)

- [`err-pcall-protect`](rules/err-pcall-protect.md) - Use `pcall` for protected calls
- [`err-xpcall-traceback`](rules/err-xpcall-traceback.md) - Use `xpcall` with `debug.traceback`
- [`err-error-table`](rules/err-error-table.md) - Use `error()` with a table, not just a string
- [`err-error-level`](rules/err-error-level.md) - Pass an explicit `level` to `error()`
- [`err-assert-precondition`](rules/err-assert-precondition.md) - Use `assert()` for precondition checks
- [`err-propagate-context`](rules/err-propagate-context.md) - Add context when propagating errors
- [`err-no-silent-failure`](rules/err-no-silent-failure.md) - Never ignore failure-signaling return values
- [`err-nil-err-pattern`](rules/err-nil-err-pattern.md) - Follow the `(result, err)` convention
- [`err-custom-error-objects`](rules/err-custom-error-objects.md) - Create custom error "classes" via metatables
- [`err-finally-pattern`](rules/err-finally-pattern.md) - Emulate `try/finally` with `pcall`/`<close>`
- [`err-error-vs-return-nil`](rules/err-error-vs-return-nil.md) - Choose `error()` vs. `nil, err` deliberately
- [`err-validate-args`](rules/err-validate-args.md) - Validate function arguments early

### 4. Metatables & OOP Patterns (HIGH)

- [`meta-index-inheritance`](rules/meta-index-inheritance.md) - Use `__index` for prototype-based inheritance
- [`meta-newindex-guard`](rules/meta-newindex-guard.md) - Use `__newindex` to guard/validate writes
- [`meta-class-pattern`](rules/meta-class-pattern.md) - Follow the standard class-emulation pattern
- [`meta-new-constructor`](rules/meta-new-constructor.md) - Provide an explicit `.new()` constructor
- [`meta-inheritance-chain`](rules/meta-inheritance-chain.md) - Chain metatables deliberately
- [`meta-operator-overload`](rules/meta-operator-overload.md) - Use metamethods for operator overloading
- [`meta-tostring`](rules/meta-tostring.md) - Implement `__tostring` for readable debugging
- [`meta-call-functor`](rules/meta-call-functor.md) - Use `__call` to make tables callable
- [`meta-eq-semantics`](rules/meta-eq-semantics.md) - Know `__eq`'s same-type/version-sensitive semantics
- [`meta-len-metamethod`](rules/meta-len-metamethod.md) - Use `__len` (5.2+) to customize `#`
- [`meta-avoid-simple-data`](rules/meta-avoid-simple-data.md) - Don't attach metatables to plain data
- [`meta-weak-tables`](rules/meta-weak-tables.md) - Use weak tables (`__mode`) for caches
- [`meta-mixins`](rules/meta-mixins.md) - Compose behavior via mixins over deep chains

### 5. Functions & Closures (HIGH)

- [`fn-varargs-handling`](rules/fn-varargs-handling.md) - Handle `...` safely with `select`/`table.pack`
- [`fn-multiple-returns`](rules/fn-multiple-returns.md) - Use multiple return values, not wrapper tables
- [`fn-closures-encapsulate-state`](rules/fn-closures-encapsulate-state.md) - Use closures for encapsulated state
- [`fn-no-closures-hot-loop`](rules/fn-no-closures-hot-loop.md) - Avoid creating closures in hot loops
- [`fn-named-vs-anonymous`](rules/fn-named-vs-anonymous.md) - Prefer named local functions for recursion
- [`fn-default-args`](rules/fn-default-args.md) - Emulate defaults with `x or default`, watch `false`
- [`fn-variadic-forwarding`](rules/fn-variadic-forwarding.md) - Forward varargs correctly
- [`fn-first-class-functions`](rules/fn-first-class-functions.md) - Use functions as first-class dispatch values
- [`fn-recursive-local`](rules/fn-recursive-local.md) - Declare `local function` for correct recursion
- [`fn-tail-calls`](rules/fn-tail-calls.md) - Use proper tail calls to avoid stack growth
- [`fn-avoid-global-functions`](rules/fn-avoid-global-functions.md) - Define functions as locals/module fields
- [`fn-callback-signature`](rules/fn-callback-signature.md) - Keep callback signatures consistent

### 6. Coroutines & Concurrency (HIGH)

- [`coro-generator-pattern`](rules/coro-generator-pattern.md) - Use coroutines as generators/iterators
- [`coro-wrap-vs-create`](rules/coro-wrap-vs-create.md) - Choose `coroutine.wrap` vs. `create`+`resume`
- [`coro-status-check`](rules/coro-status-check.md) - Check `coroutine.status` before resuming
- [`coro-error-propagation`](rules/coro-error-propagation.md) - Propagate errors from `resume`'s return value
- [`coro-cooperative-scheduling`](rules/coro-cooperative-scheduling.md) - Build a scheduler over coroutines
- [`coro-yield-across-pcall`](rules/coro-yield-across-pcall.md) - Know your version's yield-across-pcall limits
- [`coro-async-callback-bridge`](rules/coro-async-callback-bridge.md) - Bridge callbacks to coroutines
- [`coro-no-leaked-coroutines`](rules/coro-no-leaked-coroutines.md) - Ensure coroutines finish or are dropped

### 7. API/Module Design (HIGH)

- [`api-module-return-table`](rules/api-module-return-table.md) - Return a module table (`return M`)
- [`api-no-monkey-patching`](rules/api-no-monkey-patching.md) - Don't monkey-patch shared/global tables
- [`api-public-private-fields`](rules/api-public-private-fields.md) - Distinguish public from private fields
- [`api-options-table`](rules/api-options-table.md) - Use an options table for many optional args
- [`api-consistent-arg-order`](rules/api-consistent-arg-order.md) - Keep consistent argument order
- [`api-require-path`](rules/api-require-path.md) - Design clean `require()` paths
- [`api-singleton-vs-factory`](rules/api-singleton-vs-factory.md) - Choose singleton vs. factory deliberately
- [`api-version-field`](rules/api-version-field.md) - Expose a `_VERSION`/`M.version` field
- [`api-avoid-side-effects-on-require`](rules/api-avoid-side-effects-on-require.md) - Keep `require` cheap and pure
- [`api-init-function`](rules/api-init-function.md) - Provide an explicit `setup()`/`init()` function
- [`api-backward-compat-field`](rules/api-backward-compat-field.md) - Keep deprecated aliases during migration
- [`api-return-self-chaining`](rules/api-return-self-chaining.md) - Return `self` for chainable methods

### 8. Naming Conventions (MEDIUM)

- [`name-snake-case-funcs`](rules/name-snake-case-funcs.md) - Use `snake_case` for functions/variables
- [`name-pascal-case-classes`](rules/name-pascal-case-classes.md) - Use `PascalCase` for metatable "classes"
- [`name-screaming-constants`](rules/name-screaming-constants.md) - Use `SCREAMING_SNAKE_CASE` for constants
- [`name-module-lowercase`](rules/name-module-lowercase.md) - Use short, lowercase module names
- [`name-private-underscore`](rules/name-private-underscore.md) - Leading underscore for "private" fields
- [`name-is-has-boolean`](rules/name-is-has-boolean.md) - `is_`/`has_`/`can_` for boolean functions
- [`name-self-convention`](rules/name-self-convention.md) - Use `self` as the implicit first parameter
- [`name-loop-vars`](rules/name-loop-vars.md) - Conventional loop variable names
- [`name-avoid-reserved-like`](rules/name-avoid-reserved-like.md) - Avoid shadowing stdlib table names
- [`name-event-handler-on`](rules/name-event-handler-on.md) - `on_` prefix for event-handler callbacks

### 9. Testing (MEDIUM)

- [`test-busted-describe-it`](rules/test-busted-describe-it.md) - Structure tests with busted's `describe`/`it`
- [`test-luaunit-classes`](rules/test-luaunit-classes.md) - Use `luaunit` for xUnit-style test classes
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests as arrange/act/assert
- [`test-mock-tables`](rules/test-mock-tables.md) - Mock dependencies via table/function substitution
- [`test-mock-restore`](rules/test-mock-restore.md) - Always restore mocked globals after a test
- [`test-coroutine-testing`](rules/test-coroutine-testing.md) - Test coroutines by driving resume/yield
- [`test-assert-messages`](rules/test-assert-messages.md) - Provide descriptive assertion messages
- [`test-pending-skip`](rules/test-pending-skip.md) - Mark unfinished tests as pending, not silently skipped
- [`test-isolate-state`](rules/test-isolate-state.md) - Isolate module state between tests
- [`test-busted-spy`](rules/test-busted-spy.md) - Use busted's `spy`/`stub` for call verification
- [`test-descriptive-names`](rules/test-descriptive-names.md) - Give tests names that state expected behavior

### 10. Documentation (MEDIUM)

- [`doc-emmylua-annotations`](rules/doc-emmylua-annotations.md) - Use EmmyLua/LuaCATS `---@param`/`---@return`
- [`doc-ldoc-comments`](rules/doc-ldoc-comments.md) - Use LDoc-style comments for generated docs
- [`doc-module-header`](rules/doc-module-header.md) - Document the module's purpose in a header
- [`doc-class-annotations`](rules/doc-class-annotations.md) - Use `---@class` for metatable "classes"
- [`doc-function-signature`](rules/doc-function-signature.md) - Document parameter types and nullability
- [`doc-examples-in-comments`](rules/doc-examples-in-comments.md) - Include runnable usage examples
- [`doc-changelog`](rules/doc-changelog.md) - Maintain a CHANGELOG for published modules
- [`doc-type-alias`](rules/doc-type-alias.md) - Use `---@alias`/`---@field` for reused shapes
- [`doc-readme-usage`](rules/doc-readme-usage.md) - Provide a README with install/usage instructions

### 11. Performance Patterns (MEDIUM)

- [`perf-local-cache-globals`](rules/perf-local-cache-globals.md) - Cache frequently used globals as locals
- [`perf-avoid-table-in-loop`](rules/perf-avoid-table-in-loop.md) - Avoid allocating tables in hot loops
- [`perf-table-concat`](rules/perf-table-concat.md) - Use `table.concat` over repeated `..`
- [`perf-luajit-ffi`](rules/perf-luajit-ffi.md) - Use LuaJIT FFI for hot numeric/C-interop paths
- [`perf-avoid-metatable-hot-path`](rules/perf-avoid-metatable-hot-path.md) - Avoid metatable indirection in hot code
- [`perf-numeric-for`](rules/perf-numeric-for.md) - Prefer numeric `for` over generic `for` for known ranges
- [`perf-string-format-cache`](rules/perf-string-format-cache.md) - Avoid recompiling format strings/patterns
- [`perf-avoid-select-hash`](rules/perf-avoid-select-hash.md) - Avoid string-keyed dispatch in hot paths
- [`perf-gc-tuning`](rules/perf-gc-tuning.md) - Tune the garbage collector for latency-sensitive code
- [`perf-avoid-pcall-hot-loop`](rules/perf-avoid-pcall-hot-loop.md) - Avoid per-iteration `pcall` in hot loops
- [`perf-reuse-tables`](rules/perf-reuse-tables.md) - Reuse/clear tables instead of reallocating
- [`perf-luajit-table-new`](rules/perf-luajit-table-new.md) - Use `table.new` (LuaJIT) to preallocate
- [`perf-avoid-multiple-returns-alloc`](rules/perf-avoid-multiple-returns-alloc.md) - Avoid wrapping returns in tables
- [`perf-string-rep-vs-concat`](rules/perf-string-rep-vs-concat.md) - Use `string.rep` for repeated patterns
- [`perf-profile-first`](rules/perf-profile-first.md) - Profile before optimizing; let measurement decide

### 12. Embedding Contexts (MEDIUM)

- [`embed-preserve-target-version`](rules/embed-preserve-target-version.md) - Preserve the target's actual Lua dialect
- [`embed-neovim-vim-api`](rules/embed-neovim-vim-api.md) - Use Neovim's `vim.*` API and `vim.uv` correctly
- [`embed-neovim-lazy-plugin`](rules/embed-neovim-lazy-plugin.md) - Follow lazy.nvim plugin-spec conventions
- [`embed-openresty-phases`](rules/embed-openresty-phases.md) - Respect OpenResty's request-processing phases
- [`embed-openresty-non-blocking`](rules/embed-openresty-non-blocking.md) - Use `ngx.*` non-blocking APIs
- [`embed-redis-scripting`](rules/embed-redis-scripting.md) - Follow Redis Lua scripting constraints
- [`embed-love2d-callbacks`](rules/embed-love2d-callbacks.md) - Structure LÖVE games around its callback contract
- [`embed-game-engine-hot-reload`](rules/embed-game-engine-hot-reload.md) - Design for script hot-reload
- [`embed-luajit-vs-plain`](rules/embed-luajit-vs-plain.md) - Know LuaJIT's dialect vs. vanilla PUC-Lua
- [`embed-sandbox-restrict-env`](rules/embed-sandbox-restrict-env.md) - Sandbox untrusted scripts via `_ENV`

### 13. Project Structure (LOW)

- [`proj-require-path-convention`](rules/proj-require-path-convention.md) - Follow `?.lua`/`?/init.lua` conventions
- [`proj-rockspec-luarocks`](rules/proj-rockspec-luarocks.md) - Provide a LuaRocks rockspec
- [`proj-flat-small-project`](rules/proj-flat-small-project.md) - Keep small projects flat
- [`proj-src-lua-layout`](rules/proj-src-lua-layout.md) - Use a conventional `lua/` source layout
- [`proj-init-lua-entry`](rules/proj-init-lua-entry.md) - Use `init.lua` as the package entry point
- [`proj-separate-config`](rules/proj-separate-config.md) - Separate configuration from logic modules
- [`proj-vendor-dependencies`](rules/proj-vendor-dependencies.md) - Vendor pure-Lua dependencies deliberately
- [`proj-plugin-directory-layout`](rules/proj-plugin-directory-layout.md) - Follow Neovim's plugin directory layout
- [`proj-single-responsibility-module`](rules/proj-single-responsibility-module.md) - One responsibility per module
- [`proj-avoid-circular-require`](rules/proj-avoid-circular-require.md) - Avoid circular `require()` dependencies

### 14. Linting & Formatting (LOW)

- [`lint-luacheckrc-config`](rules/lint-luacheckrc-config.md) - Configure `.luacheckrc` with correct globals/std
- [`lint-stylua-format`](rules/lint-stylua-format.md) - Use StyLua for consistent formatting
- [`lint-luacheck-ci`](rules/lint-luacheck-ci.md) - Run `luacheck` in CI
- [`lint-ignore-directives`](rules/lint-ignore-directives.md) - Use targeted ignore comments, not broad disables
- [`lint-unused-variable`](rules/lint-unused-variable.md) - Fix unused-variable warnings, don't suppress
- [`lint-globals-allowlist`](rules/lint-globals-allowlist.md) - Allowlist known embedding globals
- [`lint-max-line-length`](rules/lint-max-line-length.md) - Enforce a consistent max line length
- [`lint-editorconfig`](rules/lint-editorconfig.md) - Use `.editorconfig` for whitespace consistency
- [`lint-type-check-lua-ls`](rules/lint-type-check-lua-ls.md) - Use `lua-language-server` diagnostics

### 15. Anti-patterns (REFERENCE)

- [`anti-missing-local`](rules/anti-missing-local.md) - A missing `local` silently creates a global
- [`anti-pairs-order-dependent`](rules/anti-pairs-order-dependent.md) - Relying on `pairs()` iteration order
- [`anti-deep-nested-mutation`](rules/anti-deep-nested-mutation.md) - Deep nested mutation without ownership
- [`anti-metatable-abuse-simple-data`](rules/anti-metatable-abuse-simple-data.md) - Metatables on plain data
- [`anti-string-dispatch`](rules/anti-string-dispatch.md) - String-based dispatch instead of table lookup
- [`anti-ignore-pcall-result`](rules/anti-ignore-pcall-result.md) - Ignoring `pcall`'s success/failure result
- [`anti-global-function-pollution`](rules/anti-global-function-pollution.md) - Defining functions as globals
- [`anti-table-holes-length`](rules/anti-table-holes-length.md) - Creating holes, then relying on `#`
- [`anti-tostring-concat`](rules/anti-tostring-concat.md) - Relying on implicit `tostring` in `..`
- [`anti-type-coercion-surprises`](rules/anti-type-coercion-surprises.md) - Relying on implicit type coercion
- [`anti-global-state-mutation`](rules/anti-global-state-mutation.md) - Mutating shared global state from libraries
- [`anti-os-exit-library`](rules/anti-os-exit-library.md) - Calling `os.exit()` from library code
- [`anti-ffi-unsafe-defaults`](rules/anti-ffi-unsafe-defaults.md) - Unsafe LuaJIT FFI pointer/lifetime handling
- [`anti-require-side-effects`](rules/anti-require-side-effects.md) - Modules with heavy side effects on `require`
- [`anti-loadstring-eval`](rules/anti-loadstring-eval.md) - Using `load`/`loadstring` on untrusted input

---

## Recommended Tooling Configuration

```lua
-- .luacheckrc
std = "lua51+busted"        -- match the actual target: lua51/lua52/lua53/lua54/luajit
                              -- add "+busted"/"+love"/"ngx_lua" as needed
globals = { "vim" }           -- e.g. Neovim plugin; use {"love"} for LÖVE, {"ngx","ndk"} for OpenResty
read_globals = { "jit" }      -- LuaJIT's read-only global, if targeting LuaJIT

max_line_length = 120

exclude_files = {
  "vendor/**",
}
```

```toml
# stylua.toml
column_width = 120
line_endings = "Unix"
indent_type = "Spaces"
indent_width = 2
quote_style = "AutoPreferDouble"
call_parentheses = "Always"
```

```jsonc
// .luarc.json -- lua-language-server project configuration
{
  "runtime.version": "LuaJIT",           // match the ACTUAL target: "Lua 5.1"/"5.4"/"LuaJIT"
  "diagnostics.globals": ["vim"],
  "workspace.checkThirdParty": false
}
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Lua code:

1. **Identify the target Lua version/dialect first** (`_VERSION`, `jit` global, host documentation)
2. **Check relevant category** based on task type
3. **Apply rules** with matching prefix
4. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
5. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New function/module | `scope-`, `err-`, `name-`, `api-` |
| New "class"/OOP type | `meta-`, `doc-`, `name-` |
| Error handling | `err-`, `anti-` |
| Async/generator code | `coro-`, `fn-` |
| Performance tuning | `perf-`, `table-`, `embed-` (LuaJIT-specific) |
| Neovim plugin | `embed-`, `api-`, `proj-` |
| OpenResty/nginx module | `embed-`, `coro-`, `err-` |
| Code review | `anti-`, `lint-` |
| CI/tooling setup | `lint-`, `proj-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic patterns (metatable-based inheritance, closures-as-state, dispatch tables in Lua; equivalent idioms in other languages).
- [security-review](../security-review/SKILL.md) - multi-language security-audit checklists; relevant to Lua for `load()`/sandbox escapes, untrusted-input evaluation, and FFI memory-safety review.
- [c-coding](../c-coding/SKILL.md) - for writing C extensions/bindings for Lua (the Lua C API, `luaL_*` helpers, userdata, and the common case of exposing a native library to Lua scripts).

## Sources

This skill synthesizes best practices from:
- *Programming in Lua* by Roberto Ierusalimschy (the language's chief architect) — 4th edition (covers Lua 5.3/5.4)
- The official [Lua 5.4 Reference Manual](https://www.lua.org/manual/5.4/)
- [lua-users.org wiki](http://lua-users.org/wiki/) style guide and community idioms
- `luacheck` and `StyLua` rule documentation
- Production codebases: Neovim's runtime Lua and plugin ecosystem, OpenResty/`lua-nginx-module` conventions, LÖVE game-engine scripting conventions, LuaJIT documentation and FFI semantics
- Community conventions (2024-2026)
