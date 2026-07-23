# Module Idioms by Language

Per-language conventions for module decomposition, visibility, packaging, and the module system. Apply these when designing a module's internal structure and public surface. For language-agnostic design principles, see the parent `SKILL.md`.

---

## Rust

**Module unit**: crate (library or binary). Public API via `pub` items re-exported through `lib.rs`.

**Visibility tiers** (narrowest to widest):
1. Private (default) — module-internal, invisible to parent and siblings.
2. `pub(crate)` — visible within the crate, invisible to downstream consumers.
3. `pub(super)` — visible to the parent module only.
4. `pub(in path)` — visible to a specific ancestor module.
5. `pub` — visible to all consumers (the public API contract).

**Default rule**: default everything to private. Use `pub(crate)` for cross-module access within the crate. Use `pub` only for items in the public API.

**Module organization**:
- `lib.rs` — re-exports the public API. No logic beyond `pub use` and `pub mod`.
- `main.rs` — thin entry point. Call into `lib.rs` immediately.
- Feature modules: `src/feature_name/mod.rs` or `src/feature_name.rs` with `mod.rs` for sub-modules.
- By feature/domain, not by type. Prefer `src/auth/`, `src/payments/`, `src/storage/` over `src/models/`, `src/services/`, `src/controllers/`.
- `#[cfg(test)] mod tests { use super::*; }` — tests colocated with source.

**Re-export pattern**:
```rust
// lib.rs
pub mod auth;
pub mod payments;
pub mod storage;

pub use auth::{Authenticator, Credentials, AuthError};
pub use payments::{PaymentService, Invoice, PaymentError};
pub use storage::{Store, Key, Value, StorageError};

// Optional prelude for convenient imports
pub mod prelude {
    pub use crate::auth::Authenticator;
    pub use crate::payments::PaymentService;
    pub use crate::storage::Store;
}
```

**Crate boundaries**: one crate per responsibility. Crates that form a workspace can depend on each other via `[dependencies]` with `path = "../sibling-crate"`. Internal crates that are not a public API contract use `publish = false` in `Cargo.toml`.

**Deep-module signal**: a crate with <10 `pub` items in `lib.rs` and comprehensive functionality behind them.

**Shallow-module signal**: a crate where every internal type is `pub` "just in case."

---

## TypeScript / JavaScript

**Module unit**: file (ES module). Package boundaries via `package.json` or a monorepo tool (npm workspaces, pnpm workspace, Turborepo, Nx).

**Visibility tiers**:
1. Un-exported declaration — file-private.
2. `export` — visible to importers.
3. Barrel export through `index.ts` — makes the file's exports part of the package's public API.

**Default rule**: export only the public API surface. Everything else remains un-exported. Use barrel files (`index.ts`) to curate the public surface.

**Module organization**:
- `src/index.ts` — package public API barrel: `export { Foo } from './foo';`.
- Feature modules: `src/feature-name/` with `index.ts` barrel, `types.ts`, `implementation.ts`.
- By feature/domain, not by type.
- Tests: `*.test.ts` or `*.spec.ts` colocated with source, or `__tests__/` directory.

**Package boundaries** (monorepo):
- Each package has its own `package.json` with `"name"` and `"main"`/`"exports"`.
- Internal packages use `"private": true`.
- Inter-package dependencies declared in `package.json` via workspace protocol (`"@scope/foo": "workspace:*"`).

**Deep-module signal**: a package whose `index.ts` exports <15 symbols and whose README shows a one-call primary use case.

**Shallow-module signal**: every internal helper is exported "because someone might need it."

---

## Python

**Module unit**: `.py` file (module) or directory with `__init__.py` (package). Package boundaries via `pyproject.toml` or `setup.py`.

**Visibility tiers**:
1. Leading underscore (`_name`) — convention: internal, not part of the public API.
2. `__all__` list — explicit public API surface. Tools (linters, `from module import *`) respect it.
3. `__init__.py` re-exports — curated public API for a package.

**Default rule**: prefix internal names with `_`. Populate `__all__` for every module that has a public API. Re-export in `__init__.py`.

**Module organization**:
- `package_name/__init__.py` — re-exports the public API.
- Feature subpackages: `package_name/feature_name/` with `__init__.py`, `_internal.py`, `api.py`.
- By feature/domain, not by type.
- Tests: `tests/` at the package root, mirroring source structure. `test_*.py` files.

**Package boundaries**:
- `pyproject.toml` declares `[project] name`, `dependencies`, optional `[project.optional-dependencies]`.
- Internal packages that are not published use `private = true` (if using poetry) or simply omit the publish config.

**Deep-module signal**: a package where `__init__.py` re-exports <15 names and `help(package)` shows one clear primary entry point.

**Shallow-module signal**: `__init__.py` is empty or re-exports everything.

---

## Go

**Module unit**: package (directory of `.go` files with the same `package` declaration). Module boundaries via `go.mod`.

**Visibility tiers**:
1. Unexported (lowercase) — package-internal.
2. Exported (Uppercase) — visible to importers.
3. `internal/` directory — Go toolchain enforces: packages under `internal/` can only be imported by packages rooted at the `internal/` parent. This is the strongest encapsulation Go offers.

**Default rule**: default everything to unexported. Use `internal/` for packages that must not leak outside the module. Export only the public API contract.

**Module organization**:
- Root package — the module's public API. If it's a library, this is the import path consumers use.
- `cmd/` — one directory per binary (e.g. `cmd/server/main.go`, `cmd/cli/main.go`).
- `internal/` — packages the module needs but consumers must never import.
- `pkg/` — packages that are public but not the root API (use sparingly; prefer `internal/`).
- By feature/domain: `internal/auth/`, `internal/payments/`, `internal/storage/`.
- Tests: `*_test.go` in the same package (white-box) or `_test` package suffix (black-box).

**Module boundaries** (monorepo):
- `go.mod` at the repo root or per-service.
- Multi-module repos use `go.work` for local development: `go work init && go work use ./module-a ./module-b`.
- Internal modules: `replace` directive in `go.mod` for local-only dependencies.

**Deep-module signal**: a package with <10 exported names and comprehensive functionality. `go doc <pkg>` should show the primary use case in the first few lines.

**Shallow-module signal**: every type is exported, `internal/` is empty or unused.

---

## C# / .NET

**Module unit**: assembly (`.csproj` project) or namespace within an assembly. Solution (`.sln`) groups projects.

**Visibility tiers**:
1. `private` — class-internal.
2. `internal` — assembly-internal (default for top-level types).
3. `protected internal` — assembly-internal or derived classes.
4. `public` — visible to all consumers.

**Default rule**: default to `internal` for top-level types. Use `public` only for the assembly's public API contract. Use `InternalsVisibleTo` for test assemblies.

**Module organization**:
- Solution: one `.sln` per deployable boundary.
- Projects: `src/FeatureName/FeatureName.csproj`. A project is an assembly boundary.
- Namespaces: `CompanyName.FeatureName` or `CompanyName.Product.Module`.
- By feature/domain, not by type.
- Tests: `tests/FeatureName.Tests/FeatureName.Tests.csproj`. Reference the source project; use `InternalsVisibleTo` for internal access.

**Deep-module signal**: an assembly where the `public` surface is deliberately small and curated through `EditorBrowsable(Never)` on implementation details.

**Shallow-module signal**: everything is `public` in every project.

---

## Java

**Module unit**: package (directory with `package` declaration). Module boundaries via JPMS (`module-info.java`) or build-tool boundaries (Maven module, Gradle subproject).

**Visibility tiers**:
1. `private` — class-internal.
2. Package-private (default, no modifier) — visible within the package.
3. `protected` — package-internal + subclasses.
4. `public` — visible to all consumers.

**Default rule**: default to package-private. Use `public` only for the package's public API contract. Use `module-info.java` to `exports` only specific packages.

**Module organization**:
- Maven: `<module>` entries in the parent POM. One module per responsibility.
- Gradle: `include(":module-name")` in `settings.gradle`. One subproject per responsibility.
- Packages: `com.company.feature` (by feature/domain, not `com.company.models`).
- `module-info.java`: `exports com.company.feature.api;` — export only the API package.
- Tests: `src/test/java/` mirroring source structure.

**Deep-module signal**: a module whose `module-info.java` exports only one or two API packages.

**Shallow-module signal**: `module-info.java` exports every package, or no module descriptor exists.

---

## Kotlin

**Module unit**: same as Java (package, Maven/Gradle module). Additional `internal` visibility modifier.

**Visibility tiers**:
1. `private` — file/class-internal.
2. `protected` — class + subclasses.
3. `internal` — module-internal (Gradle module / Maven module). Kotlin's key design improvement: a true module-scoped modifier.
4. `public` (default) — visible everywhere.

**Default rule**: change the default. Use `internal` for module-internal visibility. Use `public` only for the API contract.

**Module organization**: same as Java, with `internal` replacing package-private for module-level encapsulation.

**Deep-module signal**: a Kotlin module where most declarations are `internal` and the `public` surface is deliberate.

---

## Groovy

**Module unit**: same as Java/Kotlin. Typically used in Gradle build scripts or as a scripting/testing layer alongside Java.

**Visibility tiers**: same as Java. Groovy adds `@PackageScope` annotation for explicit package-private intent.

**Default rule**: use Java conventions. Groovy is typically the glue/scripting layer — its modules should be thin wrappers around Java/Kotlin core logic.

---

## C

**Module unit**: translation unit (`.c` + `.h` pair). Library boundaries via `Makefile`, CMake targets, or linking configuration.

**Visibility tiers**:
1. `static` function / file-scope variable — translation-unit-internal.
2. Non-`static` function with declaration in a private header — library-internal (convention).
3. Non-`static` function declared in the public header — public API.

**Default rule**: default everything to `static`. Declare in the public header only functions that form the library's API contract. Use opaque pointers (`typedef struct Foo Foo;` with definition in `.c`) for encapsulation.

**Module organization**:
- `include/libname/` — public headers.
- `src/` — private headers + `.c` files.
- One `.c` + `.h` pair per responsibility. By feature, not by type.
- Tests: `tests/` with a test runner (e.g. Unity, Criterion). Use `#include` of the public header to test through the interface.

**Opaque pointer pattern (PIMPL in C)**:
```c
// public.h
typedef struct Database Database;
Database* db_open(const char* path);
int db_close(Database* db);
// caller never sees the struct definition

// private.c
struct Database { /* internal fields */ };
```

**Deep-module signal**: a library whose public header declares <20 functions and uses opaque pointers for all internal state.

---

## C++

**Module unit**: translation unit (`.cpp` + `.h`/`.hpp` pair). C++20 modules (`import`, `export module`) available but adoption varies. Library boundaries via CMake targets.

**Visibility tiers**:
1. `private` — class-internal.
2. `protected` — class + derived classes.
3. `public` — class public interface.
4. Anonymous namespace / `static` — file-internal (prefer anonymous namespace for C++).
5. PIMPL (Pointer to IMPLementation) — hide implementation details from the header entirely.

**Default rule**: default everything to anonymous-namespace/private. Use PIMPL for stable ABIs and to keep headers lean. Use `public` only for the library's API contract.

**Module organization**:
- `include/libname/` — public headers.
- `src/` — `.cpp` implementations, private headers.
- CMake: `add_library(libname ...)` with `target_include_directories` for public vs. private headers.
- Tests: `tests/` with a test framework (Catch2, Google Test, doctest).

**C++20 modules** (when supported):
- `export module libname.feature;` — one module per feature.
- `module;` with `#include` for legacy headers.
- `export import` to re-export sub-modules.

**Deep-module signal**: headers that are mostly `class Foo { public: /* 3-5 methods */ private: class Impl; std::unique_ptr<Impl> impl_; };`.

---

## Swift

**Module unit**: module (framework/target in Xcode, or a Swift Package Manager target). A module is the unit of access control and import.

**Visibility tiers** (Swift 5.9+ with `package`):
1. `private` — declaration-internal (same file, same declaration).
2. `fileprivate` — file-internal.
3. `internal` (default) — module-internal.
4. `package` — visible within the Swift package (multi-target package). Swift 5.9+.
5. `public` — visible to importers, but not subclassable/overridable outside the module.
6. `open` — visible and subclassable/overridable outside the module.

**Default rule**: use `internal` for within-module, `public` for the API contract, `open` only for explicitly designed extension points. Use `package` to share internals between package targets without exposing them to consumers.

**Module organization**:
- SPM: `Package.swift` with multiple `.target(name:dependencies:)` entries.
- Xcode: framework targets or Swift Package dependencies.
- By feature, not by type.
- Tests: `Tests/TargetNameTests/` in SPM.

**Deep-module signal**: a module where `open` appears only on protocol conformances and explicit extension points, and the public API is intentionally slim.

---

## Objective-C

**Module unit**: class (`.h` + `.m` pair). Framework/library boundaries via Xcode targets or CocoaPods.

**Visibility tiers**:
1. Class extension / category in `.m` — implementation-private.
2. `.h` declared methods/properties — public API.
3. `@package` (rare) — framework-internal.

**Default rule**: declare in the `.h` only the public API. Move all internal methods to a class extension in the `.m`. Use `@protocol` for interfaces/seams.

**Module organization**:
- Headers: umbrella header for frameworks. Public headers in the framework's `Headers` build phase.
- By feature, not by type.
- Tests: XCTest targets referencing the module.

**Deep-module signal**: `.h` files with only `@interface` public methods; all state and internal logic in `.m`.

---

## Zig

**Module unit**: file. Zig modules are created with `@import("file.zig")`. Package boundaries via `build.zig` and `build.zig.zon`.

**Visibility tiers**:
1. Non-`pub` declarations — file-internal (default).
2. `pub` declarations — visible to importers.

**Default rule**: default everything to file-private. Use `pub` only for the public API.

**Module organization**:
- `src/main.zig` — thin entry point. `pub fn main() !void`.
- `src/root.zig` — library root, re-exports the public API.
- Feature modules: `src/feature_name.zig`.
- By feature, not by type.
- `build.zig` — declares executables, libraries, tests, and their dependencies.
- Tests: `test "name" { ... }` blocks colocated with source. `zig build test` runs them.

**Deep-module signal**: a file where <50% of declarations are `pub`.

---

## Lua

**Module unit**: file. Modules return a table. Package boundaries via `require("module")` and `package.path`.

**Visibility tiers**:
1. `local` variable/function — file-internal.
2. Returned table entry — public API.

**Default rule**: default everything to `local`. Return only the public API in the module table.

**Module organization**:
```lua
-- module.lua
local function internal_helper()
  -- private
end

local M = {}

function M.public_function()
  internal_helper()
end

return M
```
- By feature, not by type.
- Tests: `luaunit`, `busted`, or `lua-TestMore`.

**Deep-module signal**: the returned table has <10 entries; the rest is `local`.

---

## Ruby

**Module unit**: file. `module`/`class` definitions within. Gems for package boundaries.

**Visibility tiers**:
1. `private` — class-internal (implicit receiver only).
2. `protected` — class + subclasses.
3. `public` (default) — visible everywhere.

**Default rule**: default to `private` for internal methods. Use `public` only for the API.

**Module organization**:
- `lib/gem_name.rb` — entry point that `require`s all public files.
- `lib/gem_name/feature.rb` — by feature.
- Gemspec for package metadata.
- Tests: `spec/` or `test/` mirroring `lib/` structure.

**Deep-module signal**: a gem where `lib/gem_name.rb` requires <10 files and the README shows a one-method primary use case.

---

## PHP

**Module unit**: file with `namespace`. Composer packages for package boundaries.

**Visibility tiers**:
1. `private` — class-internal.
2. `protected` — class + subclasses.
3. `public` — visible everywhere.

**Default rule**: use `private` for internal methods. Use `public` for the API. Use `final` on classes not designed for inheritance.

**Module organization**:
- `src/` — PSR-4 autoloaded classes.
- `composer.json` — autoload config, dependencies.
- Namespace: `Vendor\Package\Feature`.
- By feature, not by type.
- Tests: `tests/` with PHPUnit, mirroring `src/`.

**Deep-module signal**: a package whose `composer.json` `autoload.psr-4` maps one root namespace and the public class count is <20.

---

## PowerShell

**Module unit**: `.psm1` (script module) or `.psd1` (module manifest). Modules are the unit of `Import-Module`.

**Visibility tiers**:
1. Un-exported function — module-internal (not listed in `FunctionsToExport`).
2. `FunctionsToExport` in `.psd1` — public API.
3. `Export-ModuleMember` in `.psm1` — explicit public surface.

**Default rule**: export only functions that form the module's API. Use `FunctionsToExport = @('Public-Function')` in the manifest.

**Module organization**:
- `ModuleName.psd1` — manifest.
- `ModuleName.psm1` — root module, dot-sources private and public functions.
- `Public/` — one `.ps1` per public function.
- `Private/` — one `.ps1` per internal function.
- Tests: `Tests/` with Pester.

**Deep-module signal**: `FunctionsToExport` in the manifest lists <15 functions.

---

## Bash

**Module unit**: script file. "Modules" are sourced scripts; there is no formal package system.

**Visibility tiers**:
1. `local` variable / function declared inside another function — function-scoped.
2. `local` variable at file scope — file-scoped (in some shells).
3. Non-`local` — global (pollutes the caller's namespace).

**Default rule**: default everything to `local` inside functions. Use `readonly` for constants. Use `declare -r` for readonly variables. Source scripts should export only a well-defined set of functions.

**Module organization**:
```bash
# lib/feature.sh
_feature_internal() { :; }  # private by convention (_ prefix)

feature_public() {           # public function
  _feature_internal
}
```
- By feature, not by type.
- Entry script sources dependencies explicitly.
- Tests: `bats` (Bash Automated Testing System), `shunit2`, `shellspec`.

**Deep-module signal**: a script that uses `local` everywhere and exports <10 public functions.

---

## Assembly

**Module unit**: translation unit (`.asm`/`.s` file). No native module system; boundaries are link-time conventions.

**Visibility tiers**:
1. Non-`global`/non-`GLOBAL` symbol — file-internal (not exported to linker).
2. `global`/`GLOBAL` symbol — visible to the linker (public API).

**Default rule**: default every symbol to file-internal. Mark only the API symbols as `global`. Use calling-convention comments to document the interface contract.

**Module organization**:
- One `.asm`/`.s` file per responsibility.
- Public symbols documented with calling convention, register usage, and stack expectations.
- By feature, not by platform (though platform-specific files are common).
- Tests: call the assembly functions from C test harnesses, or use inline assertions.

**Deep-module signal**: a file where <30% of symbols are `global`.

---

## Per-Language Dependency Direction Table

| Language | Cycle detection tool | Visibility enforcement tool |
|---|---|---|
| Rust | `cargo tree --invert` for ad-hoc; no built-in cycle detection | `#[deny(unreachable_pub)]` + `cargo clippy` |
| TypeScript/JS | `madge`, `dependency-cruiser`, `nx graph` (Nx) | `eslint-plugin-import` with `no-restricted-imports` |
| Python | `import-linter`, `pydeps` | `import-linter` contracts, `ruff` rules |
| Go | `go mod graph`, `goda` | `golangci-lint` + `depguard`, `go doc` |
| C#/.NET | `ndepend`, `Visual Studio Code Map` | `ArchUnitNET`, analyzer rules |
| Java | `jdeps`, `ArchUnit`, `Degraph` | `ArchUnit` rules, `checkstyle` imports |
| Kotlin | Same as Java + `detekt` | `detekt` + `ArchUnit` |
| C | Manual or `include-what-you-use` | Manual or `include-what-you-use` |
| C++ | `include-what-you-use`, `clang-modules` | Same + CMake `PRIVATE` link dependencies |
| Swift | `Xcode` dependency inspector | `periphery` dead-code detection |
| Zig | None built-in; `zig build` shows linkage | None built-in |
| Lua/Ruby/PHP/PowerShell/Bash | Manual / language-specific lint | Language-specific lint |
