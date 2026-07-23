# Linux GDB And Core Dumps

Use this reference for GDB, ELF/DWARF, live Linux processes, core files, systemd-coredump, threads, registers, memory, shared libraries, and disassembly.

## Open the correct target

Typical entry points are:

```bash
gdb --args ./app arg1 arg2
gdb ./app /path/to/core
gdb -p 1234
```

For systemd-coredump systems, inspect the record and use `coredumpctl debug` only when available and authorized. Record executable path, build ID, architecture, signal, kernel/container context, command line, loaded modules, and core truncation limits.

## Verify ELF and DWARF identity

- Match executable and shared-library build IDs to the core's mappings.
- Locate separate debug files through the distribution's debug packages, `.gnu_debuglink`, build-ID directories, or the project's symbol store.
- Record stripped modules and optimization/frame-pointer settings.
- Configure sysroot and shared-library search paths for container or remote targets before interpreting frames.
- Never use a same-named library from a different image merely to obtain symbols.

## Initial triage

Capture all threads and the faulting context:

```gdb
info threads
thread apply all backtrace full
frame 0
info args
info locals
info registers
x/16gx $sp
x/10i $pc
info sharedlibrary
```

Use architecture-appropriate stack and program-counter registers. Optimized variables can be unavailable or misleading; fall back to registers, calling convention, memory, and disassembly.

Useful command families:

- `break`, `tbreak`, `watch`, `rwatch`, `awatch`, `catch`, `delete`, and `disable` for stopping conditions.
- `run`, `continue`, `next`, `step`, `finish`, `until`, and `advance` for execution control.
- `thread`, `frame`, `up`, `down`, `bt`, `print`, `ptype`, `x`, `disassemble`, and `info registers` for state inspection.
- `info proc mappings`, `maintenance info sections`, and `info sharedlibrary` for address and module mapping when supported by the target.
- `set solib-search-path`, `set sysroot`, `symbol-file`, and `add-symbol-file` for verified symbol and relocated-module workflows.

Check `help <command>` in the installed GDB because target support and syntax vary by version.

## Hangs, races, and corruption

- For hangs, capture all thread stacks and identify futexes, condition variables, lock owners, I/O waits, signals, event loops, and shutdown dependencies.
- For corruption, prefer ASan/HWASan, Valgrind where appropriate, allocator diagnostics, or a hardware watchpoint that catches the first write. The crash site may be much later.
- For races, use TSan or the language race detector and raise reproduction rate. GDB single-stepping can hide the schedule.
- For hard-to-reproduce deterministic userspace bugs, consider `rr` when architecture, kernel, syscall, and performance constraints support it.

## Core capture cautions

Core availability depends on shell limits, `/proc/sys/kernel/core_pattern`, container settings, systemd-coredump limits, filesystem capacity, and security policy. Changing these is a system operation; record and restore any setting. A truncated core can provide stacks while lacking heap pages needed for deeper analysis.

Do not use `ldd` on an untrusted executable. Prefer static ELF dynamic-section inspection such as `readelf -d`; historical and implementation-specific `ldd` behavior can execute code.

Official references:

- Current GDB manual: `https://sourceware.org/gdb/current/onlinedocs/gdb.html/`
- GDB core-file and process invocation: `https://sourceware.org/gdb/current/onlinedocs/gdb.html/gdb-man.html`
