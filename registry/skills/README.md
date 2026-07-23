# Custom skill registry

Add one directory per custom skill:

```text
registry/skills/<skill-name>/SKILL.md
```

The OpenCode Manager TUI discovers these skills from the `custom` source in
`registry/catalog.jsonc`. Selecting one copies its complete directory into the
active project's `.opencode/skills/` directory.

## Bundled skills

### Engineering workflows

| Skill | Scope |
| --- | --- |
| [`application-debugging`](application-debugging) | Application, browser, API, test, concurrency, and performance failures |
| [`native-binary-debugging`](native-binary-debugging) | Native crashes, dumps, registers, disassembly, ABI, and memory corruption |
| [`security-review`](security-review) | Security, correctness, unsafe-code, dependency, and supply-chain review |
| [`software-architect`](software-architect) | System architecture, service boundaries, resilience, build-vs-buy, and ADRs |
| [`codebase-design`](codebase-design) | Module seams, dependency direction, deep interfaces, and FFI boundaries |
| [`design-patterns`](design-patterns) | GoF and modern pattern selection with idiomatic language implementations |
| [`uniffi`](uniffi) | Rust bindings for Kotlin and Swift through UniFFI |

### Language guidance

| Skill | Scope |
| --- | --- |
| [`assembly-coding`](assembly-coding) | x86-64, ARM64/AArch64, RISC-V, SIMD, ABI, and C interop |
| [`bash-coding`](bash-coding) | Bash and POSIX shell scripting, portability, safety, and testing |
| [`c-coding`](c-coding) | Modern C, memory safety, undefined behavior, APIs, and concurrency |
| [`cpp-coding`](cpp-coding) | Modern C++, RAII, templates, concurrency, and performance |
| [`csharp-coding`](csharp-coding) | Modern C# and .NET APIs, async, nullability, LINQ, and DI |
| [`go-coding`](go-coding) | Idiomatic Go errors, concurrency, APIs, HTTP, generics, and testing |
| [`groovy-coding`](groovy-coding) | Groovy, Gradle, Jenkins pipelines, closures, DSLs, and testing |
| [`java-coding`](java-coding) | Modern Java, records, virtual threads, concurrency, and API design |
| [`javascript-coding`](javascript-coding) | Modern JavaScript and Node.js async, security, APIs, and performance |
| [`kotlin-coding`](kotlin-coding) | Kotlin, coroutines, Flow, Android/JVM interop, and Gradle Kotlin DSL |
| [`lua-coding`](lua-coding) | Lua 5.1-5.4 and LuaJIT modules, metatables, coroutines, and embedding |
| [`objectivec-coding`](objectivec-coding) | Objective-C ARC, Cocoa APIs, GCD, nullability, and Swift interop |
| [`php-coding`](php-coding) | Modern PHP, strict types, OOP/DI, frameworks, security, and testing |
| [`powershell-coding`](powershell-coding) | PowerShell 7 cmdlets, pipelines, modules, security, DSC, and Pester |
| [`python-coding`](python-coding) | Modern Python typing, async, APIs, data modeling, and testing |
| [`ruby-coding`](ruby-coding) | Modern Ruby, Rails conventions, metaprogramming, testing, and YJIT |
| [`rust-coding`](rust-coding) | Idiomatic Rust, ownership, async, APIs, unsafe boundaries, and Rust 2024 |
| [`swift-coding`](swift-coding) | Swift 6, concurrency, SwiftUI state, APIs, and Objective-C interop |
| [`typescript-coding`](typescript-coding) | Strict TypeScript, type design, modules, async, APIs, and JavaScript interop |
| [`zig-coding`](zig-coding) | Zig allocators, comptime, error unions, build system, and safety modes |
