# test-lldb-register-inspect

> Use lldb's register and memory inspection commands on macOS/BSD targets, where gdb support is often limited or absent

## Why It Matters

macOS (and increasingly some BSD variants) ship lldb as the primary/only well-supported native debugger; gdb either isn't available or requires extra setup (code-signing entitlements) to attach to processes at all. Knowing lldb's equivalent commands is necessary to debug hand-written asm on those platforms without fighting the toolchain.

## Basic Session

```
$ lldb ./test_checksum
(lldb) breakpoint set --name compute_checksum
(lldb) run
(lldb) register read              # dump all general-purpose registers
(lldb) thread step-inst             # step exactly one machine instruction
(lldb) memory read --size 1 --count 4 --format x $rdi   # examine 4 bytes at rdi, in hex
(lldb) print $rax                    # print the current value of rax
```

## Disassembling While Stepping

```
(lldb) disassemble --pc
(lldb) thread step-inst
(lldb) disassemble --pc
```

## Watching a Register or Memory Location

```
(lldb) watchpoint set variable *(long*)0x7ffeefbff000
(lldb) watchpoint set expression -- $rbx
```

## Verifying the ABI Contract at Entry/Exit

```
(lldb) breakpoint set --name compute_checksum
(lldb) run
(lldb) register read rdi rsi        # confirm arguments arrived in the expected registers
(lldb) thread until <return-line>      # or: finish, to run until the function returns
(lldb) register read rax                # confirm the return-value convention
```

## gdb-to-lldb Command Cheat Sheet

| gdb | lldb |
|---|---|
| `break FUNC` | `breakpoint set --name FUNC` |
| `run` | `run` (or `process launch`) |
| `info registers` | `register read` |
| `stepi` | `thread step-inst` |
| `x/4xb $rdi` | `memory read --size 1 --count 4 --format x $rdi` |
| `finish` | `thread step-out` (or `finish`, aliased in recent lldb) |
| `watch EXPR` | `watchpoint set variable EXPR` |

## See Also

- [test-gdb-register-inspect](test-gdb-register-inspect.md) - The gdb equivalent workflow, mapped above
- [test-disassemble-verify](test-disassemble-verify.md) - Static disassembly review as a complement
- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - Combining sanitizers with a debugger session
