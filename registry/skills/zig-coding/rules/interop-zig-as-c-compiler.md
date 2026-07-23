# interop-zig-as-c-compiler

> Use `zig cc`/`zig c++` as a portable, drop-in C/C++ compiler for cross-compilation and existing C codebases

## Why It Matters

Zig ships a bundled Clang and libc sources for many targets, exposed via `zig cc`/`zig c++` — a fully capable C/C++ compiler with straightforward cross-compilation (`zig cc -target aarch64-linux-musl`) and no separate toolchain installation. This is useful both for building a C dependency your Zig project links against, and for using Zig purely as a build tool in an otherwise all-C/C++ project.

## Bad

```makefile
# Makefile — hardcodes a specific host compiler and offers no straightforward
# cross-compilation story without installing a separate cross-toolchain.
CC = gcc
CFLAGS = -O2

app: main.c
	$(CC) $(CFLAGS) -o app main.c
```

## Good

```makefile
# Makefile — zig cc cross-compiles without a separate toolchain install.
CC = zig cc
CFLAGS = -O2 -target x86_64-linux-musl

app: main.c
	$(CC) $(CFLAGS) -o app main.c
```

```sh
# Building for multiple targets from one machine, no cross-toolchain setup:
zig cc -target aarch64-macos -o app-arm64 main.c
zig cc -target x86_64-linux-gnu -o app-linux main.c
zig cc -target x86_64-windows-gnu -o app.exe main.c
```

## Integrating Into `build.zig` for a Mixed C/Zig Project

```zig
// build.zig (excerpt)
const exe = b.addExecutable(.{ .name = "app", .target = target, .optimize = optimize });
exe.addCSourceFile(.{ .file = b.path("src/legacy.c"), .flags = &.{"-std=c11"} });
exe.linkLibC();
```

## See Also

- [interop-build-linklibc](interop-build-linklibc.md) - linking libc for mixed C/Zig builds
- [proj-cross-compile-targets](proj-cross-compile-targets.md) - declaring supported targets project-wide
- [interop-cimport-cinclude](interop-cimport-cinclude.md) - consuming C headers from the Zig side of a mixed build
