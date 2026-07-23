---
name: native-binary-debugging
description: "Diagnoses native and binary failures in Rust, C, C++, Assembly, Zig, FFI, drivers, executables, shared libraries, object files, core dumps, and Windows minidumps. Use for crashes, hangs, deadlocks, memory corruption, undefined behavior, ABI or calling-convention bugs, raw addresses, registers, disassembly, missing symbols, or live/post-mortem work with WinDbg/CDB, GDB, LLDB, sanitizers, or binary-analysis tools. Use application-debugging instead when browser, API, managed-runtime, or application-state evidence is primary."
compatibility: opencode
metadata:
  domain: "debugging"
  audience: "senior-developer"
---

# Native And Binary Debugging

Debug native code and binary artifacts from verified identity, symbols, and machine-state evidence. A clean stack trace is useful; a mismatched binary or symbol file makes it fiction.

## Boundary

Use this skill when the primary evidence is machine-level: a native process, crash, hang, core/minidump, executable or library, symbol file, instruction pointer, register set, memory region, disassembly, ABI, calling convention, or sanitizer finding.

Use `application-debugging` for browser, API, test-runner, or managed-runtime failures unless the investigation crosses into native code. For Node addons, Python extensions, JNI, PInvoke, WebAssembly, UniFFI, or other FFI paths, keep the application-level reproduction and use this skill for the native side.

## Safety and authorization

- Analyze only binaries and systems the user owns or is authorized to inspect.
- Do not execute an unknown or untrusted binary on the host. Start with hashes, metadata, imports, sections, signatures, strings, and disassembly; use an isolated, disposable environment if execution is authorized and necessary.
- Treat dumps and memory images as sensitive. They can contain credentials, keys, personal data, source paths, and proprietary code.
- Never attach to production, enable kernel debugging, disable platform security, or collect a live dump without explicit authorization for that target and action.

## Workflow

### 1. Preserve and identify the artifact

Record and retain:

- Cryptographic hash and original filename for the binary, dump, symbols, and relevant libraries.
- OS and version, CPU architecture, process bitness, runtime, compiler and linker when known.
- Build ID, UUID, PE timestamp/signature, debug link, PDB GUID/age, Mach-O UUID, or equivalent identity.
- Exact crash timestamp, exception/signal or bug check, instruction pointer, loaded-module list, command line, environment, and last known-good build.

Work on a copy when tools may modify an artifact. Preserve the original evidence.

### 2. Classify the session

| Input | First objective |
|---|---|
| Live reproducible process | Break on the earliest relevant exception/signal and capture state before recovery changes it |
| Hang or deadlock | Capture every thread, wait reason, locks, ownership, and progress indicators before resuming |
| Core or minidump | Verify executable, modules, architecture, and matching symbols before interpreting frames or locals |
| Binary without a dump | Perform static identity, format, dependency, symbol, and disassembly triage; do not invent runtime state |
| Sanitizer or verifier report | Reproduce with the same build and reduce to the first invalid operation, not the later crash |

### 3. Make symbols trustworthy

Before drawing source-level conclusions:

1. Match the debugger target to the exact executable and loaded modules.
2. Match PDB GUID/age, ELF build ID or debug link, or Mach-O/dSYM UUID.
3. Account for ASLR, relocation, image slide, architecture mode, optimization, inlining, tail calls, and omitted frame pointers.
4. Record which modules have full, public/export-only, mismatched, or no symbols.
5. Fall back to module plus offset and disassembly when symbols are unavailable; label the confidence loss.

Never force-load a mismatched symbol file merely to obtain names.

### 4. Capture the initial machine state

Start from the faulting or blocked context:

- Exception or signal and its parameters.
- Current and all-thread stacks.
- Registers, flags, instruction bytes, and nearby disassembly.
- Relevant memory mappings, module list, and loaded image bases.
- Function arguments and locals only when symbols and optimization make them trustworthy.
- Heap, lock, handle, file descriptor, or allocator evidence justified by the failure class.

The top frame may be where corruption was detected, not where it began. Trace invalid values and ownership backward.

### 5. Rank and test hypotheses

Build a short ranked set covering the plausible failure class: invalid lifetime, out-of-bounds access, race, deadlock, stack corruption, ABI mismatch, wrong module or version, bad error handling, integer issue, or logic error.

For each hypothesis, define one decisive probe such as:

- Data or hardware watchpoint on the first corrupted location.
- Breakpoint on allocation/free, exception, signal, loader event, or ownership transition.
- Sanitizer, race detector, verifier, or record/replay run against the minimized reproduction.
- Register/stack/ABI comparison at both sides of a call boundary.
- Differential run against a known-good build with identical input.

Change one variable at a time and preserve the command transcript needed to reproduce the conclusion.

### 6. Select platform guidance

Read only the relevant references:

- `references/windows-windbg.md` for WinDbg/CDB, PE/PDB, Windows dumps, exceptions, hangs, and symbols.
- `references/linux-gdb.md` for GDB, ELF/DWARF, Linux cores, systemd-coredump, threads, memory, and disassembly.
- `references/macos-lldb.md` for LLDB, Mach-O/dSYM, macOS crash reports, UUIDs, image slides, and attach restrictions.
- `references/binary-formats-and-symbols.md` for static triage, addresses, object formats, symbol matching, ABI, and mixed-language frames.

Use the installed debugger's `help` for exact syntax. Debugger aliases, extension commands, and plugin behavior vary by version.

### 7. Fix and verify

- Convert the minimized failure into a source-level regression, sanitizer case, deterministic harness, or artifact assertion when possible.
- Apply the smallest correction at the origin of the invalid state, ownership transfer, synchronization error, or ABI mismatch.
- Rebuild with the project's real compiler, target, feature flags, and relevant optimization profile.
- Re-run the original reproduction plus focused sanitizer, race, compiler, and test checks justified by the fix.
- Confirm debugger-only settings, breakpoints, generated dumps, temporary symbols, core limits, registry changes, and security exceptions were removed or intentionally retained.

## Language-specific checks

- **Rust:** distinguish panic from abort, unsafe UB, FFI ownership, unwinding boundary, async task state, allocator/native dependency, and optimized frame effects. Use `rust-gdb`, `rust-lldb`, or `ferroscope` when available, but verify they match the toolchain.
- **C/C++:** inspect object lifetime, allocator pairing, bounds, initialization, vtable/function pointers, exception state, lock order, atomics, and compiler/ABI flags. Prefer sanitizers or watchpoints that catch the first invalid operation.
- **Assembly:** establish ISA mode, ABI, stack alignment, red-zone/shadow-space rules, preserved registers, unwind metadata, instruction width, and caller/callee expectations before judging register state.
- **Zig and mixed native code:** preserve the declared Zig version and target; verify ownership, allocator, error-union, panic, C ABI, and generated-code boundaries.

## Return format

```text
Status: FIXED | DIAGNOSED | PARTIAL | BLOCKED
Artifact/session identity: <hash, build ID/UUID/PDB identity, OS, arch>
Symbol status: <matched/missing/mismatched by module>
Initial failure state: <exception/signal, thread, IP, stack/module+offset>
Key observations: <facts only>
Hypotheses tested: <debugger probe -> result>
Root cause: <causal chain and confidence>
Fix or hand-off: <changed files or exact implementation constraints>
Verification: <reproduction, tests, sanitizers, before/after evidence>
Cleanup: <temporary debugger and system settings>
Remaining gaps: <missing memory, symbols, source, platform, or authorization>
```

Use `DIAGNOSED` when evidence proves the cause but another owner must implement the fix. Use `PARTIAL` when dump capture or symbol coverage prevents a complete conclusion.
