# Windows WinDbg And CDB

Use this reference for Windows user-mode or kernel-mode dumps, live processes, hangs, PE/PDB symbols, exceptions, and WinDbg/CDB command selection.

## Open and identify

Open a user-mode dump with WinDbg or CDB:

```text
windbg -z C:\path\crash.dmp
cdb -z C:\path\crash.dmp
```

Record debugger version, target OS/build, architecture, dump type, process command line, exception or bug check, and loaded modules. A minidump contains less memory than a full dump; commands that need uncaptured pages cannot succeed.

## Configure and verify symbols

Use a local cache for Microsoft public symbols, then append private symbols for the exact application build:

```text
.symfix C:\Symbols
.sympath+ C:\path\to\private-symbols
.reload /f
```

Check symbol and module state before trusting names:

```text
.sympath
lm
lmvm module_name
```

If loading fails, use `!sym noisy`, reload the affected module, and inspect the exact PDB path and identity. Do not force a PDB from a different build.

## Crash triage

Start with the debugger's analysis, then verify it manually:

```text
!analyze -v
.ecxr
kv
r
u @rip
lm
```

Use the architecture-appropriate instruction pointer register. Inspect exception parameters, the faulting instruction, effective addresses, register provenance, stack integrity, and module identity. `!analyze -v` is a triage aid, not a root-cause oracle.

Useful command families:

- `k`, `kb`, `kp`, `kv` for stack variants.
- `~` and `~* k` for thread listing and all-thread stacks.
- `r`, `dv`, `dt`, `x`, `u`, `ub`, and `d*` for registers, locals, types, symbols, disassembly, and memory.
- `bp`, `bu`, `ba`, `bl`, and `bc` for software, unresolved, data, list, and clear breakpoint operations.
- `g`, `p`, and `t` for continue, step over, and step into.

Use `help` or `.hh <command>` for exact syntax in the installed debugger.

## Hang and deadlock triage

Capture every thread before changing execution:

```text
!analyze -hang
~* k
```

Identify wait functions, lock owners, message loops, thread pools, loader lock, I/O completion, and progress counters. Select the relevant current thread before relying on user-mode hang analysis. Add framework-specific extensions only when their runtime and versions match the dump.

## Live debugging

Break on the earliest relevant exception or ownership transition. Prefer `bu` for symbols in modules that may load later and `ba` for a proven corruption address. Watchpoints are scarce and alignment/size-sensitive; use them on the smallest stable location.

Time Travel Debugging can answer backwards-causality questions when a recording is available, but recording overhead and capture policy must be approved. Do not assume TTD can reconstruct events absent from a conventional dump.

## Kernel caution

Kernel debugging, Driver Verifier, and crash-inducing commands can destabilize a machine. Use an authorized test target, preserve recovery access, and state every system setting changed. Do not enable them on production by implication.

Official Microsoft references:

- User-mode dumps: `https://learn.microsoft.com/windows-hardware/drivers/debugger/analyzing-a-user-mode-dump-file`
- Symbol paths: `https://learn.microsoft.com/windows-hardware/drivers/debugger/symbol-path`
- `!analyze`: `https://learn.microsoft.com/windows-hardware/drivers/debuggercmds/-analyze`
- WinDbg command reference: `https://learn.microsoft.com/windows-hardware/drivers/debuggercmds/`
