# proj-consistent-directory-layout

> Adopt a conventional, predictable directory layout (`src/`, `include/`, `tests/`, `docs/`) so contributors and tooling can find things without asking

## Why It Matters

A predictable layout lets a new contributor (or a new IDE/build tool integration) find source, headers, and tests without needing a guided tour, and lets build-system configuration, CI scripts, and packaging rules make simple, stable assumptions about where things live instead of special-casing an idiosyncratic structure.

## Bad

```
myproject/
  code/                  # source? headers? both mixed together
  stuff/                  # tests? examples? unclear
  h/                        # headers, abbreviated unpredictably
  myproject.c               # a stray file at the root alongside everything else
```

## Good

```
myproject/
  include/
    myproject/           # public headers, namespaced by project name
  src/                     # implementation (.c files, private headers)
  tests/
    unit/
    integration/
  examples/                 # runnable usage examples
  docs/
  CMakeLists.txt              # or Makefile
  README.md
  CHANGELOG.md
```

## This Layout Mirrors What Most C Build Tooling Already Expects

CMake's `find_package`, package managers (Conan, vcpkg), and most CI templates default to assuming an `include/`+`src/` split; deviating from it without strong reason means every integration point (packaging, IDE project generation, doc generators) needs extra configuration to work around your project's specific layout.

## See Also

- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - The public/private header split within this layout
- [test-integration-test-separate-binary](test-integration-test-separate-binary.md) - Where integration tests live in this structure
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - The build system that ties this layout together
