# Binary Formats, Symbols, Addresses, And ABI

Use this reference before static analysis or when debugger output contains unresolved addresses, mismatched symbols, mixed-language frames, stripped modules, or calling-convention uncertainty.

## Artifact identity table

Build a table before analysis:

| Artifact | Hash | Format/arch | Identity | Symbols | Source/build provenance |
|---|---|---|---|---|---|

Identity examples:

- PE/COFF: image timestamp and size plus PDB GUID/age; record Authenticode separately because signing identity is not debug identity.
- ELF: GNU build ID, `.gnu_debuglink`, architecture, interpreter, SONAME, and separate debug-file identity.
- Mach-O: UUID per architecture slice and matching dSYM UUID.
- WebAssembly: module hash, producers/build metadata when present, DWARF/source map identity, and host runtime version.

Names and modification times are insufficient.

## Static triage without execution

Use format-aware tools available on the analysis platform:

- General: `file`, cryptographic hash tools, signature tools, and a hex viewer.
- PE/COFF: `dumpbin`, WinDbg image commands, LLVM object tools, or an authorized IDA Pro/Ghidra workflow.
- ELF: `readelf`, `objdump` or `llvm-objdump`, `nm`, and `addr2line` against the exact binary and debug files.
- Mach-O: `otool`, `nm`, `dwarfdump`, `dsymutil`, `atos`, or LLVM object tools.

Inspect headers, sections/segments and permissions, imports/exports, relocations, dynamic dependencies, unwind data, symbol tables, entry points, and suspiciously inconsistent architecture metadata. `strings` can suggest leads but does not establish control flow or behavior.

Do not run dependency helpers that may execute an untrusted binary. Static import/dynamic-section inspection is safer.

## Address normalization

Label every address as one of:

- Runtime/load address.
- Module-relative virtual address or module plus offset.
- Preferred image virtual address.
- File offset.
- Source-level symbol plus displacement.

Account for ASLR, PIE, relocations, shared-cache images, image slide, architecture slice, and rebasing. Convert addresses explicitly and record image base and arithmetic. Do not paste a runtime address into a static disassembler without normalization.

## Symbol confidence

Classify symbol quality per module:

1. Exact private/debug symbols with verified identity.
2. Exact public/export symbols.
3. Symbol table only, stripped debug details.
4. Heuristic function boundaries or signatures.
5. Raw module plus offset/disassembly.

State the level in conclusions. Function names recovered heuristically are leads, not proof.

## Stack and unwind validation

A stack can be wrong because of corruption, missing unwind metadata, frame-pointer omission, hand-written assembly, signal/exception frames, JIT code, mixed architecture, or debugger heuristics.

Validate suspicious frames against:

- Stack bounds and alignment.
- Return addresses that map to executable regions and valid call sites.
- ABI-preserved registers and canonical frame rules.
- Unwind metadata and prologue/epilogue state.
- Exception, interrupt, signal, coroutine, async, or runtime transition frames.

## ABI and mixed-language boundaries

At both sides of a boundary, compare:

- Calling convention, register and stack argument placement, stack alignment, red zone or shadow space, and preserved registers.
- Integer width/sign, enum representation, pointer ownership, nullability, alignment, packing, endianness, and struct/union layout.
- Name mangling, symbol visibility, linkage, architecture, exception/unwind model, panic behavior, and allocator pairing.
- Callback lifetime, thread affinity, cancellation, and whether unwinding may cross the boundary.

For Rust FFI, also verify `repr(C)`, unsafe preconditions, panic containment, ownership transfer, and generated binding version. For assembly, verify unwind metadata and every callee-saved register touched.

## Build-mode effects

Optimization can inline, reorder, eliminate variables, tail-call, vectorize, merge functions, and expose undefined behavior. Debug builds can hide races or change layout. Reproduce with the affected build first, then create a diagnostic build that changes one factor at a time. Keep build identity in every captured result.
