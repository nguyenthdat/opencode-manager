# proj-per-arch-directory-layout

> Organize per-ISA assembly implementations in arch-specific directories (`arch/x86_64/`, `arch/arm64/`, `arch/riscv64/`) rather than scattering them by filename suffix alone

## Why It Matters

For projects with more than a handful of per-architecture routines, a directory-per-arch layout scales better than filename suffixes alone: it makes the set of supported architectures visible at a glance in the directory tree, lets each arch's build rules (flags, included headers) be scoped to that directory, and avoids increasingly long, repetitive filenames as the number of routines grows.

## Bad (Flat Layout With Growing Filename Clutter)

```
src/
  checksum_x86_64.s
  checksum_arm64.s
  checksum_riscv64.s
  fast_math_x86_64.s
  fast_math_arm64.s
  fast_math_riscv64.s
  matrix_ops_x86_64.s
  matrix_ops_arm64.s
  matrix_ops_riscv64.s
  # ... continues to grow, increasingly hard to scan
```

## Good

```
src/
  arch/
    x86_64/
      checksum.s
      fast_math.s
      matrix_ops.s
    arm64/
      checksum.s
      fast_math.s
      matrix_ops.s
    riscv64/
      checksum.s
      fast_math.s
      matrix_ops.s
  common/
    dispatch.c          # runtime feature detection / dispatch logic shared across all arches
```

## Wiring This Into the Build

```cmake
# CMakeLists.txt - select the whole per-arch directory at configure time
if(CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64")
    file(GLOB ARCH_SRCS "src/arch/x86_64/*.s")
elseif(CMAKE_SYSTEM_PROCESSOR STREQUAL "aarch64")
    file(GLOB ARCH_SRCS "src/arch/arm64/*.s")
endif()

add_executable(app src/common/dispatch.c ${ARCH_SRCS})
```

## Either Convention Is Fine — Consistency Is What Matters

Small projects with only one or two per-arch routines may reasonably prefer the flatter filename-suffix convention from `name-file-per-arch-suffix`; the directory layout pays off once the number of routines per architecture grows large enough that scanning filenames becomes unwieldy. Pick one and apply it project-wide.

## See Also

- [name-file-per-arch-suffix](name-file-per-arch-suffix.md) - The filename-suffix alternative for smaller projects
- [proj-cmake-asm-language](proj-cmake-asm-language.md) - Build-system integration for either layout
- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - The dispatch logic that typically lives alongside this layout
