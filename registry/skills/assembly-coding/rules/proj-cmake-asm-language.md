# proj-cmake-asm-language

> Enable CMake's `ASM`/`ASM_NASM` language support explicitly rather than shelling out to the assembler via a custom command

## Why It Matters

CMake has first-class support for assembling `.s`/`.S` files via the standard `ASM` language (GAS-compatible assemblers) and a separate `ASM_NASM` language for NASM sources, both of which integrate properly with CMake's dependency tracking, cross-compilation toolchain selection, and IDE project generation. Using a hand-rolled `add_custom_command` instead loses all of that integration and has to reimplement dependency tracking manually.

## Bad (Custom Command, No Real Integration)

```cmake
# CMakeLists.txt - manually invoking the assembler, bypassing CMake's built-in support
add_custom_command(
    OUTPUT checksum.o
    COMMAND as checksum.s -o checksum.o
    DEPENDS checksum.s
)
add_executable(app main.c checksum.o)
```

## Good (First-Class ASM Language Support)

```cmake
# CMakeLists.txt - proper ASM language enablement
cmake_minimum_required(VERSION 3.16)
project(app C ASM)     # enable both C and ASM languages

set(CMAKE_ASM_FLAGS "${CMAKE_ASM_FLAGS} -g")

add_executable(app main.c checksum_x86_64.s)
```

## NASM Sources Specifically

```cmake
# CMakeLists.txt - NASM sources need the separate ASM_NASM language
cmake_minimum_required(VERSION 3.16)
project(app C ASM_NASM)

set(CMAKE_ASM_NASM_OBJECT_FORMAT elf64)   # or win64, macho64, depending on target

add_executable(app main.c checksum_x86_64.nasm)
```

## Per-Architecture Source Selection

```cmake
# CMakeLists.txt - select the arch-appropriate source at configure time
if(CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64")
    set(ASM_SRC checksum_x86_64.s)
elseif(CMAKE_SYSTEM_PROCESSOR STREQUAL "aarch64")
    set(ASM_SRC checksum_arm64.s)
endif()

add_executable(app main.c ${ASM_SRC})
```

## See Also

- [proj-makefile-integration](proj-makefile-integration.md) - The Makefile equivalent of this integration
- [proj-per-arch-directory-layout](proj-per-arch-directory-layout.md) - Organizing sources this configuration selects between
