# macOS LLDB And Crash Analysis

Use this reference for LLDB, Mach-O, dSYM, macOS crash reports, core files, live processes, image slides, threads, registers, memory, and disassembly.

## Open or attach

Typical entry points are:

```bash
lldb /path/to/app-or-executable
lldb -p 1234
lldb -n process-name
lldb -c /path/to/core
```

LLDB also supports interactive `target create`, including `target create --core <file>`. Confirm exact syntax with `help target create` in the installed version.

Record macOS version, CPU architecture, translated/native execution state, executable UUID, dSYM UUID, crash timestamp, exception/signal, termination reason, binary images, and image load addresses.

## Match Mach-O and dSYM identities

Use UUIDs, not filenames, to match a dSYM to a Mach-O image. Check UUIDs with `dwarfdump --uuid` or the equivalent Xcode tooling. LLDB usually finds a correctly colocated matching dSYM; otherwise add the verified symbol file using the installed LLDB's target-symbol commands.

For a crash report, preserve the binary-image table and image slide. Symbolication needs the exact architecture slice, executable or framework UUID, dSYM, and load address. An address mapped with the wrong slide can produce a plausible but false function.

## Initial triage

Useful LLDB commands include:

```lldb
thread list
thread backtrace all
frame select 0
frame variable
register read
memory read $sp
disassemble -p
image list
image lookup -a $pc
```

Set focused breakpoints with `breakpoint set -n <function>` or file and line options. Use `breakpoint set -a <address>` only after resolving whether the address is a load address or file address. Use `watchpoint set` after consulting `help watchpoint set` for the current architecture and LLDB version.

Optimized Swift, Rust, C, C++, and Objective-C frames can inline, tail-call, omit variables, or expose runtime thunks. Correlate source frames with registers and disassembly when a value looks impossible.

## Hangs and performance

- Capture all thread stacks before resuming. Identify main-thread blockage, dispatch queues, locks, actor/task waits, XPC, I/O, and shutdown dependencies.
- Use `sample` or `spindump` for low-touch hang snapshots when appropriate; check local help and authorization before collection.
- Use Instruments or a sampling profiler for CPU, allocation, leaks, locks, and signposts. LLDB stepping is not a representative performance measurement.

## Attach restrictions

Code signing, entitlements, hardened runtime, sandboxing, System Integrity Protection, and task-for-pid policy can block attachment. Prefer a debug-signed development build or an approved diagnostic entitlement. Do not disable system-wide security controls merely to make attachment succeed.

For iOS or simulator targets, use the project's Xcode workflow and matching device/simulator symbols. Check Xcode session defaults before invoking build, run, or test tooling.

## Symbolication tools

`atos`, `dwarfdump`, `dsymutil`, `otool`, and `nm` can support symbol and image analysis, but their flags differ across Xcode versions and architectures. Verify local help, UUIDs, architecture, load address, and image slide before recording a symbolicated result.

Official references:

- LLDB tutorial: `https://lldb.llvm.org/use/tutorial.html`
- LLDB command-line manual: `https://lldb.llvm.org/man/lldb.html`
- Apple crash-report analysis: `https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs`
