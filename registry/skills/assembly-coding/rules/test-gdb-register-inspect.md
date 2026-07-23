# test-gdb-register-inspect

> Use gdb to step through hand-written asm instruction-by-instruction and inspect register/memory state at each point

## Why It Matters

Source-level debugging tools are built around high-level languages; verifying an asm routine's correctness often requires stepping one instruction at a time and checking exactly which registers hold what, something gdb supports natively and which is the fastest way to confirm a suspected register-allocation or addressing bug without adding print statements to the asm itself.

## Basic Session

```
$ gdb ./test_checksum
(gdb) break compute_checksum
(gdb) run
(gdb) info registers          # dump all general-purpose registers
(gdb) stepi                    # step exactly one machine instruction
(gdb) x/4xb $rdi                # examine 4 bytes at the address in rdi, in hex
(gdb) print $rax                 # print the current value of rax
```

## Disassembling While Stepping

```
(gdb) disassemble
(gdb) display/i $pc            # show the current instruction every time execution stops
(gdb) stepi
(gdb) stepi
```

## Watching a Memory Location or Register for Changes

```
(gdb) watch *(long*)0x7fffffffe000    # break when this memory location changes
(gdb) watch $rbx                        # break when rbx changes
```

## Verifying the ABI Contract at Entry/Exit

```
(gdb) break compute_checksum
(gdb) run
(gdb) info registers rdi rsi           # confirm arguments arrived in the expected registers
(gdb) finish                             # run until the function returns
(gdb) print $rax                          # confirm the return value convention
```

## Example Debugging a Wrong-Register Bug

```
(gdb) break add_three
(gdb) run
(gdb) info registers rdi rsi rdx     # confirm a=rdi, b=rsi, c=rdx as the ABI specifies
(gdb) stepi 3
(gdb) print $rax                       # check the intermediate accumulator matches expectations
```

## See Also

- [test-lldb-register-inspect](test-lldb-register-inspect.md) - The equivalent workflow on macOS/BSD using lldb
- [test-disassemble-verify](test-disassemble-verify.md) - Static disassembly review, complementary to live debugging
- [interop-preserve-caller-state](interop-preserve-caller-state.md) - The register-preservation contract this verifies
