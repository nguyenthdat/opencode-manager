# name-section-name-standard

> Use the standard section names (`.text`, `.data`, `.bss`, `.rodata`) rather than inventing custom ones unless there is a specific linker-script reason to

## Why It Matters

Toolchains, linkers, debuggers, and profilers all have built-in expectations about the standard section names — default linker scripts place `.text` as read+execute, `.rodata` as read-only, and so on, without any extra configuration. Inventing a custom section name (`.mycode`, `.fastpath`) works only if you also maintain a custom linker script to give it the right permissions and placement, adding maintenance burden for no benefit unless there's a genuine need (e.g. a specific memory region for embedded/bare-metal targets).

## Bad

```asm
# x86-64 AT&T - custom section name with no corresponding linker script entry
.section .fastpath
.global hot_function
hot_function:
    ret
# without a custom linker script, .fastpath's permissions/placement are whatever the default
# linker script happens to do with unrecognized sections -- not something to rely on
```

## Good

```asm
# x86-64 AT&T - standard section, correctly read+execute by every default linker script
.section .text
.global hot_function
hot_function:
    ret
```

## When a Custom Section Is Actually Justified

Bare-metal/embedded targets legitimately use custom section names paired with an explicit linker script, to place code/data in specific memory regions (e.g. a `.fast_ram` section mapped to on-chip SRAM for latency-critical routines):

```
/* linker.ld snippet - custom section explicitly placed and permission-configured */
SECTIONS {
    .fast_ram : { *(.fast_ram) } > SRAM
}
```

```asm
# x86-64 AT&T (illustrative embedded target) - custom section matching the linker script above
.section .fast_ram
.global hot_function
hot_function:
    ret
```

## See Also

- [syntax-section-directives](syntax-section-directives.md) - The standard sections and their default permissions
- [proj-separate-text-data-bss](proj-separate-text-data-bss.md) - Project-level organization around standard sections
